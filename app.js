/* Wiring. Owns routing, event delegation and the render loop. */

import { getState, setState, subscribe, storageKind, shareLink, repLink, takeIncoming, currentLinkSig, parsePasted, linkSig } from "./store.js";
import { ensure, emptyState, newRep, today, num, uid, mergeIncoming } from "./model.js";
import { renderRep, bump, ensureToday, esc, repUI } from "./view-rep.js";
import { renderManager, buildCSV, seedTeam, mgrUI } from "./view-manager.js";
import { teamReport, repDayReport, repSendDue } from "./reports.js";
import * as cloud from "./cloud.js";
import * as cloudUI from "./cloud-ui.js";
import { ask, showCopy } from "./dialog.js";

let boardMod = null;
import("./view-board.js")
  .then((m) => { boardMod = m; if (S().view === "board") render(); })
  .catch((e) => console.warn("game board module unavailable", e));

let nudge = null;
import("./nudge.js")
  .then((m) => { nudge = m; render(); })
  .catch((e) => console.warn("nudge module unavailable", e));

import { recruitBannerHtml, renderRecruitAdmin, ensureRecruit } from "./recruiting.js";

let deal = null;
/* Team edition: the private deal tab is not in this build. */

let offline = null;
import("./offline.js")
  .then((m) => {
    offline = m;
    try { m.registerSW && m.registerSW(); } catch (_) {}
    try {
      m.onOnlineChange && m.onOnlineChange((on) => {
        const el = document.getElementById("net");
        if (!el) return;
        el.textContent = on ? "Ready" : "Offline, still saving";
        el.classList.toggle("off", !on);
      });
    } catch (_) {}
    try {
      const btn = document.getElementById("installbtn");
      const sync = () => { if (btn && m.canInstall) btn.hidden = !m.canInstall(); };
      sync();
      setInterval(sync, 2000);
      if (btn) btn.onclick = () => { try { m.promptInstall && m.promptInstall(); } catch (_) {} };
    } catch (_) {}
  })
  .catch(() => {});

/* ---------- state ---------- */
function S() {
  let s = getState();
  if (!s || !s.v) s = setState(ensure(emptyState()));
  return ensure(s);
}
function commit(mut) {
  const s = S();
  mut(s);
  setState(s);
}

const root = () => document.getElementById("root");

/* ---------- render ---------- */
let raf = null;
function render() {
  if (raf) return;
  raf = requestAnimationFrame(() => {
    raf = null;
    const s = S();
    const el = root();
    if (!el) return;
    document.body.classList.toggle("rep-phone", s.role === "rep");
    /* Every repaint replaces the markup, so remember which field had the
       cursor and put it back. Any input carrying a data attribute qualifies,
       which covers the roster, the day editor, the note, the recruiting panel
       and the board. Without this a second keystroke lands on nothing, and on
       a laptop a digit then fires a tab shortcut. */
    const active = document.activeElement;
    let keep = null;
    if (active && active !== document.body && active.matches && active.matches("input, textarea, select") && active.dataset) {
      const k = Object.keys(active.dataset).find((x) => x !== "recBound");
      if (k) {
        let sel = [null, null];
        try { sel = [active.selectionStart, active.selectionEnd]; } catch (_) {}
        keep = { k, v: active.dataset[k],
          rep: active.closest("[data-rep]") ? active.closest("[data-rep]").dataset.rep : null, sel };
      }
    }

    if (s.view === "rep") {
      renderRep(el, s, api);
      if (!cloud.isOn(s) && repSendDue(s, s.activeRep)) {
        const wrap = el.querySelector(".repwrap");
        if (wrap) wrap.insertAdjacentHTML("afterbegin", `<button class="duebar" data-sendmine="1">
          <span class="duedot" aria-hidden="true"></span><span>End of day. Send your numbers to your manager.</span><span class="duego">Send</span></button>`);
      }
      if (cloud.isOn(s)) {
        const wrap = el.querySelector(".repwrap") || el;
        const st = cloud.syncStatus();
        wrap.insertAdjacentHTML("beforeend", `<p class="fine livenote">${st.state === "offline"
          ? "No signal. Your numbers are saved and will reach your manager when you reconnect."
          : "Live sync is on. Your numbers reach your manager on their own."}</p>`);
      }
      const rh = el.querySelector("[data-remindhost]");
      if (rh && nudge && nudge.renderNudgeSettings) {
        try { nudge.renderNudgeSettings(rh, s, api); } catch (e) { console.warn(e); }
      }
      const b = recruitBannerHtml(s);
      if (b) {
        const wrap = el.querySelector(".repwrap") || el;
        wrap.insertAdjacentHTML("afterbegin", b);
      }
    }
    else if (s.view === "board") {
      if (boardMod && boardMod.renderBoard) boardMod.renderBoard(el, s, api);
      else el.innerHTML = `<div class="card"><div class="empty"><h3>Game board</h3>
        <p>Loading.</p></div></div>`;
    } else if (s.view === "deal") {
      if (deal && deal.renderDeal) {
        deal.renderDeal(el, s, api);
        if (deal.dealGate && deal.dealGate.isUnlocked(s)) {
          const host = document.createElement("div");
          el.insertBefore(host, el.firstChild);
          renderRecruitAdmin(host, s, api);
        }
      }
      else el.innerHTML = `<div class="card"><div class="empty"><h3>Recruiting</h3><p>Loading.</p></div></div>`;
    } else {
      renderManager(el, s, api);
      try {
        const first = el.querySelector(".card");
        const html = cloudUI.managerCardHtml(s);
        if (first) first.insertAdjacentHTML("beforebegin", html); else el.insertAdjacentHTML("afterbegin", html);
      } catch (e) { console.warn(e); }
      const box = el.querySelector("[data-importbox]");
      if (box && importDraft) box.value = importDraft;
      const b = recruitBannerHtml(s);
      if (b) el.insertAdjacentHTML("afterbegin", b);
    }

    let host = document.getElementById("nudgehost");
    if (!host) {
      host = document.createElement("div");
      host.id = "nudgehost";
      document.body.appendChild(host);
    }
    host.innerHTML = s.view === "rep" && nudge && nudge.nudgeHtml ? nudge.nudgeHtml(s) : "";

    try { cloud.paintChip(); } catch (_) {}
    document.querySelectorAll("#tabs button").forEach((b) =>
      b.classList.toggle("on", b.dataset.view === s.view));

    if (keep) {
      const scope = keep.rep ? document.querySelector(`[data-rep="${keep.rep}"]`) : document;
      const sel = `[data-${camelToAttr(keep.k)}="${String(keep.v).replace(/"/g, '\\"')}"]`;
      const next = scope && scope.querySelector(sel);
      if (next && document.activeElement !== next) {
        next.focus();
        try { if (keep.sel[0] != null) next.setSelectionRange(keep.sel[0], keep.sel[1]); } catch (_) {}
      }
    }
  });
}
function camelToAttr(k) {
  return k.replace(/[A-Z]/g, (c) => "-" + c.toLowerCase());
}

subscribe(() => { render(); cloud.onChange(); });

/* ---------- api handed to views ---------- */
const api = {
  render,
  commit,
  setView(v) { commit((s) => { s.view = v === "deal" ? "manager" : v; }); },
  getBoardModule: () => boardMod,
};

/* ---------- events ---------- */
document.addEventListener("click", (ev) => {
  const sum = ev.target.closest("details[data-editbox] > summary");
  if (sum) { repUI.editOpen = !sum.parentElement.open; return; }
  const rsum = ev.target.closest("details[data-remindbox] > summary");
  if (rsum) { repUI.remindOpen = !rsum.parentElement.open; return; }
  const nd = ev.target.closest('[data-nudge-action="dismiss"]');
  if (nd) {
    if (nudge && nudge.dismissNudge) {
      try { nudge.dismissNudge(S(), api, nd.dataset.nudgeId); } catch (_) {}
    }
    return;
  }

  const t = ev.target.closest("[data-view],[data-bump],[data-addrep],[data-seed],[data-exportcsv],[data-delrep],[data-openrep],[data-pickrep],[data-switchrep],[data-shareteam],[data-sendmine],[data-importpaste],[data-report],[data-rpshare],[data-rpemail],[data-rpcopy],[data-rpprint],[data-rpclose],[data-backup]");
  if (!t) return;

  if (t.dataset.view) { api.setView(t.dataset.view); return; }

  if (t.dataset.report) {
    const kind = t.dataset.report;
    mgrUI.report = kind;
    commit((s) => {
      s.view = "manager";
      s.reportSeen = s.reportSeen || {};
      const r = teamReport(s, kind);
      if (kind === "lastweek") s.reportSeen.week = r.from;
      if (kind === "day") s.reportSeen.day = r.from;
    });
    setTimeout(() => { const r = document.getElementById("report"); if (r) r.scrollIntoView({ block: "start" }); }, 60);
    return;
  }
  if (t.dataset.backup) {
    const s0 = S();
    const out = { app: "dpc-field-tracker", backupAt: new Date().toISOString(), state: s0 };
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(out, null, 1)], { type: "application/json" }));
    a.download = "dpc-backup-" + today() + ".json";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    commit((s) => { s.lastBackup = out.backupAt; });
    flash("Backup saved to your downloads.");
    return;
  }
  if (t.dataset.rpclose) { mgrUI.report = null; render(); return; }
  if (t.dataset.rpshare || t.dataset.rpcopy || t.dataset.rpemail) {
    const r = teamReport(S(), mgrUI.report || "day");
    if (t.dataset.rpemail) {
      const to = (S().reportEmail || "").trim();
      location.href = "mailto:" + encodeURIComponent(to).replace(/%2C/g, ",").replace(/%40/g, "@") +
        "?subject=" + encodeURIComponent(r.title) + "&body=" + encodeURIComponent(r.text);
      return;
    }
    if (t.dataset.rpcopy) {
      navigator.clipboard.writeText(r.text).then(() => flash("Report copied."), () => showCopy("Copy the report:", r.text));
      return;
    }
    shareText(r.title, r.text);
    return;
  }
  if (t.dataset.rpprint) {
    document.body.classList.add("printing-report");
    setTimeout(() => {
      window.print();
      setTimeout(() => document.body.classList.remove("printing-report"), 500);
    }, 50);
    return;
  }

  if (t.dataset.shareteam) {
    sendLink(shareLink(), "DPC team tracker",
      "Open this, tap your name, and log your day. Save it to your home screen.");
    return;
  }
  if (t.dataset.importpaste) {
    const box = document.querySelector("[data-importbox]");
    const inc = parsePasted(box ? box.value : "");
    if (!inc) { flash("That is not a tracker link. Paste the whole link the rep texted you."); return; }
    const sigv = linkSig(box.value);
    applyIncoming(S(), inc, sigv).then((done) => { if (done) { const b2 = document.querySelector("[data-importbox]"); if (b2) b2.value = ""; importDraft = ""; } });
    return;
  }
  if (t.dataset.sendmine) {
    const s0 = S();
    const rp = s0.reps.find((r) => r.id === s0.activeRep);
    const link = repLink(s0.activeRep);
    if (!link) return;
    const rep = repDayReport(s0, s0.activeRep);
    sendLink(link, "DPC numbers from " + (rp && rp.name ? rp.name : "a rep"),
      (rep ? rep.text + "\n\n" : "") + "Tap to add my numbers to the team:");
    commit((s) => { s.sentDay = s.sentDay || {}; s.sentDay[s.activeRep] = today(); });
    return;
  }

  if (t.dataset.bump) {
    ev.preventDefault();
    const by = parseInt(t.dataset.by, 10) || 0;
    commit((s) => { if (s.activeRep) bump(s, s.activeRep, t.dataset.bump, by); });
    try { navigator.vibrate && navigator.vibrate(12); } catch (_) {}
    if (nudge && nudge.maybeNudge && by > 0) {
      const counter = { d: "D", p: "P", c: "C", sale: "Sale" }[t.dataset.bump] || "D";
      try { nudge.maybeNudge(S(), api, { type: "tap", counter }); } catch (_) {}
    }
    return;
  }

  const repPhone = S().role === "rep";
  if (repPhone && (t.dataset.addrep || t.dataset.seed || t.dataset.delrep || t.dataset.importpaste)) return;

  if (t.dataset.addrep) {
    commit((s) => { const r = newRep(""); s.reps.push(r); s.entries[r.id] = []; });
    setTimeout(() => {
      const inputs = document.querySelectorAll('[data-repf="name"]');
      const last = inputs[inputs.length - 1];
      if (last) last.focus();
    }, 40);
    return;
  }

  if (t.dataset.seed) {
    if (cloud.isOn(S())) { flash("Live sync is on, so the example team is off. It would replace your real team for everyone."); return; }
    const go = () => commit((s) => { seedTeam(s); s.activeRep = s.reps[0] ? s.reps[0].id : null; });
    if (!S().reps.length) { go(); return; }
    ask("This replaces the current roster and all logged days with an example team. Continue?", "Replace").then((ok) => { if (ok) go(); });
    return;
  }

  if (t.dataset.exportcsv) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([buildCSV(S())], { type: "text/csv" }));
    a.download = "dpc-team-" + today() + ".csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    /* Revoking right away cancels the download on iPhone Safari. */
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    return;
  }

  if (t.dataset.delrep) {
    const s0 = S();
    const rp = s0.reps.find((r) => r.id === t.dataset.delrep);
    const rid = t.dataset.delrep;
    ask("Remove " + (rp && rp.name ? rp.name : "this rep") + " and everything they logged?" + (cloud.isOn(s0) ? " This removes them for the whole team and signs out their phone." : ""), "Remove").then((ok) => {
      if (!ok) return;
      commit((s) => {
        cloud.noteDeleted(s, rid);
        s.reps = s.reps.filter((r) => r.id !== rid);
        delete s.entries[rid];
        if (s.activeRep === rid) s.activeRep = null;
      });
    });
    return;
  }

  if (t.dataset.openrep) {
    commit((s) => { s.activeRep = t.dataset.openrep; s.view = "rep"; });
    return;
  }
  if (t.dataset.pickrep) {
    commit((s) => { s.activeRep = t.dataset.pickrep; });
    return;
  }
  if (t.dataset.switchrep) {
    commit((s) => { s.activeRep = null; });
    return;
  }
});

let importDraft = "";
document.addEventListener("input", (ev) => {
  const el = ev.target;
  if (el.dataset.importbox) { importDraft = el.value; return; }
  if (el.dataset.reportemail) { commit((s) => { s.reportEmail = el.value; }); return; }

  if (el.dataset.repf) {
    if (S().role === "rep") return;
    const row = el.closest("[data-rep]");
    if (!row) return;
    commit((s) => {
      const rp = s.reps.find((r) => r.id === row.dataset.rep);
      if (rp) rp[el.dataset.repf] = el.value;
    });
    return;
  }

  if (el.dataset.note) {
    commit((s) => {
      ensureToday(s, s.activeRep);
      const e = s.entries[s.activeRep].find((x) => x.date === today());
      if (e) e.note = el.value;
    });
    return;
  }

  if (el.dataset.editk) {
    const date = repUI.editDate || today();
    commit((s) => {
      if (!s.activeRep) return;
      if (!s.entries[s.activeRep]) s.entries[s.activeRep] = [];
      let e = s.entries[s.activeRep].find((x) => x.date === date);
      if (!e) {
        e = { id: uid(), date, d: 0, p: 0, c: 0, sale: 0, note: "" };
        s.entries[s.activeRep].push(e);
      }
      e[el.dataset.editk] = Math.max(0, num(el.value));
    });
    return;
  }
});

/* Picking a date in "Fix a number" loads that day into the fields. */
document.addEventListener("change", (ev) => {
  const el = ev.target;
  if (el && el.dataset && el.dataset.restore && el.files && el.files[0]) {
    const rd = new FileReader();
    rd.onload = () => {
      try {
        const obj = JSON.parse(String(rd.result || ""));
        const st = obj && obj.app === "dpc-field-tracker" && obj.state ? obj.state : null;
        if (!st || !Array.isArray(st.reps)) { flash("That file is not a tracker backup."); return; }
        const when = obj.backupAt ? new Date(obj.backupAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "an unknown date";
        ask("Restore the backup from " + when + "? Everything on this phone is replaced with it (" + st.reps.length + " reps).", "Restore").then((ok) => {
          if (!ok) return;
          setState(ensure(st));
          flash("Backup restored.");
        });
      } catch (_) { flash("That file could not be read."); }
    };
    rd.readAsText(el.files[0]);
    el.value = "";
    return;
  }
  if (el && el.dataset && el.dataset.editdate) {
    const v = String(el.value || "").slice(0, 10);
    repUI.editDate = v && v <= today() ? v : today();
    render();
  }
});
document.addEventListener("toggle", (ev) => {
  const el = ev.target;
  if (el && el.dataset && el.dataset.editbox) repUI.editOpen = el.open;
}, true);

/* Keyboard shortcuts on desktop so David can move fast at a laptop. */
const finePointer = (() => { try { return matchMedia("(pointer: fine)").matches; } catch (_) { return false; } })();
document.addEventListener("keydown", (ev) => {
  if (!finePointer || ev.ctrlKey || ev.metaKey || ev.altKey) return;
  if (ev.target.matches("input, textarea, select, [contenteditable]")) return;
  const map = { "1": "rep", "2": "board", "3": "manager" };
  if (map[ev.key]) api.setView(map[ev.key]);
});

/* ---------- links ---------- */
async function shareText(title, text) {
  try {
    if (navigator.share) { await navigator.share({ title, text }); return; }
  } catch (e) {
    if (e && e.name === "AbortError") return;
  }
  try { await navigator.clipboard.writeText(text); flash("Report copied. Paste it into a text or email."); return; } catch (_) {}
  showCopy("Copy the report:", text);
}

async function sendLink(url, title, text) {
  try {
    if (navigator.share) { await navigator.share({ title, text, url }); return; }
  } catch (e) {
    if (e && e.name === "AbortError") return;
  }
  try {
    await navigator.clipboard.writeText(text ? text + "\n" + url : url);
    flash(text ? "Report and link copied. Paste it into a text." : "Link copied. Paste it into a text.");
    return;
  } catch (_) {}
  showCopy("Copy this and text it:", text ? text + "\n" + url : url);
}

function flash(msg) {
  let el = document.getElementById("flash");
  if (!el) {
    el = document.createElement("div");
    el.id = "flash";
    el.className = "flash";
    el.setAttribute("role", "status");
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add("on");
  clearTimeout(flash.t);
  flash.t = setTimeout(() => el.classList.remove("on"), 3200);
}

/* A link opened on a phone that already has data. Ask, then merge. Nothing
   is ever replaced wholesale, so a stray link cannot wipe a phone. */
function seenLink(s, sig) {
  return !!sig && Array.isArray(s.seenLinks) && s.seenLinks.includes(sig);
}
function markLink(s, sig) {
  if (!sig) return;
  s.seenLinks = (Array.isArray(s.seenLinks) ? s.seenLinks : []).filter((x) => x !== sig).concat(sig).slice(-30);
}

function handleIncoming() {
  const inc = takeIncoming();
  const sig = currentLinkSig();
  const s = S();
  if (!inc) {
    /* Fresh phone that loaded straight from the link. Remember it so a reload
       does not ask. The link stays in the address bar on purpose: an iPhone
       home screen icon keeps the address it was saved from. */
    if (sig && !seenLink(s, sig)) { markLink(s, sig); setState(s); }
    return;
  }
  if (seenLink(s, sig)) return;
  applyIncoming(s, inc, sig);
}

async function applyIncoming(s, inc, sig) {
  const isRep = inc.kind === "rep";
  const who = (inc.reps || []).map((r) => r.name || "Unnamed");
  const days = (inc.reps || []).reduce((a, r) => a + (((inc.entries || {})[r.id]) || []).length, 0);
  const q = isRep
    ? "Add " + (who[0] || "this rep") + "'s numbers to your team? (" + days + " day" + (days === 1 ? "" : "s") + " logged)"
    : "This link has the team roster (" + who.length + " rep" + (who.length === 1 ? "" : "s") + "). Update your roster and numbers from it? Your own logged days stay as they are.";
  if (!(await ask(q, isRep ? "Add them" : "Update"))) { const c = S(); markLink(c, sig); setState(c); return false; }
  s = S();
  const res = mergeIncoming(s, inc, { ownRep: s.activeRep });
  if (isRep) s.view = "manager";
  markLink(s, sig);
  setState(s);
  flash(isRep
    ? (who[0] || "Rep") + " added. " + res.days + " day" + (res.days === 1 ? "" : "s") + " updated."
    : "Team updated. " + res.added + " new rep" + (res.added === 1 ? "" : "s") + ", " + res.days + " day" + (res.days === 1 ? "" : "s") + " updated.");
  return true;
}

/* ---------- boot ---------- */
(function boot() {
  const s = S();
  /* A phone first set up from the team link is a rep phone. The manager's
     phone never is, because it started empty or already had data. */
  if (s.kind === "team" && !s.role) s.role = "rep";
  delete s.kind;
  if (!s.reps.length || s.view === "deal") s.view = "manager";
  if (!s.activeRep && s.reps.length && s.view !== "rep") s.activeRep = s.reps[0].id;
  setState(s);
  handleIncoming();
  render();
  const net = document.getElementById("net");
  if (net && !cloud.isOn(s)) {
    const kind = storageKind();
    net.textContent = navigator.onLine === false
      ? "Offline, still saving"
      : kind === "local" ? "Saved on this phone" : "Saved in the link";
    net.classList.toggle("off", navigator.onLine === false);
  }
})();

setInterval(() => {
  if (nudge && nudge.maybeNudge) {
    try { nudge.maybeNudge(S(), api, { type: "idle_check" }); } catch (_) {}
  }
}, 60000);

cloudUI.init({ S, commit, render, flash, sendLink });

window.DPC = { S, commit, render, shareLink, buildCSV, cloud };
