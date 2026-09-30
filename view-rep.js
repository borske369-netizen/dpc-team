/* Rep view. One thumb, outdoors, bad signal, sun on the screen.

   The design rule here: a rep in the field taps a big number, they do not fill
   in a form. Everything else on this screen exists to answer two questions,
   how am I doing today and what do I need to not get flagged. */

import {
  today, weekStart, weekLabel, repEntries, repTotals, weekTotals, rates,
  flagState, fmtPct, fmtNum, fmt1, num, uid, STAGES, FLAG_RULE,
} from "./model.js";

const STEPS = [
  { key: "d", letter: "D", label: "Door", help: "A door you worked." },
  { key: "p", letter: "P", label: "Presentation", help: "You got into it and presented." },
  { key: "c", letter: "C", label: "Close (ask for business)", help: "You asked. This is not the sale." },
  { key: "sale", letter: "S", label: "Got the sale", help: "They said yes." },
];

/* Screen state that should survive a repaint but never be saved. */
export const repUI = { editDate: null, editOpen: false, remindOpen: false, lastRep: null };

function entryFor(state, repId, date) {
  const list = state.entries[repId] || [];
  return list.find((e) => e.date === date) || null;
}

export function ensureToday(state, repId) {
  const d = today();
  if (!state.entries[repId]) state.entries[repId] = [];
  if (!entryFor(state, repId, d)) {
    state.entries[repId].push({ id: uid(), date: d, d: 0, p: 0, c: 0, sale: 0, note: "" });
  }
  return state;
}

export function bump(state, repId, key, delta) {
  ensureToday(state, repId);
  const e = entryFor(state, repId, today());
  if (repUI.lastRep !== repId) { repUI.lastRep = repId; repUI.editDate = null; }
  const editDate = repUI.editDate && repUI.editDate <= today() ? repUI.editDate : today();
  const ed = entryFor(state, repId, editDate) || { d: 0, p: 0, c: 0, sale: 0 };
  e[key] = Math.max(0, num(e[key]) + delta);
  /* A count later in the funnel cannot exceed the one before it, because that
     is not a strong day, it is a typo. Carry the earlier stage up with it. */
  const order = ["d", "p", "c", "sale"];
  const i = order.indexOf(key);
  if (i > 0) {
    for (let k = i - 1; k >= 0; k--) {
      const prev = order[k], next = order[k + 1];
      if (num(e[prev]) < num(e[next])) e[prev] = num(e[next]);
    }
  }
  for (let k = 1; k < order.length; k++) {
    const prev = order[k - 1], next = order[k];
    if (num(e[next]) > num(e[prev])) e[next] = num(e[prev]);
  }
  return state;
}

export function renderRep(el, state, api) {
  const repId = state.activeRep;
  const rep = state.reps.find((r) => r.id === repId);
  if (!rep) {
    el.innerHTML = `<div class="pad"><div class="empty">
      <h3>Pick who you are</h3>
      <p>Choose your name so the day is logged against you.</p>
      ${state.reps.length
        ? `<div class="pickgrid">${state.reps.map((r) => `<button class="pick" data-pickrep="${r.id}">${esc(r.name || "Unnamed")}</button>`).join("")}</div>`
        : `<p class="fine">No one is on the roster yet. Add the team in the manager view first.</p>`}
    </div></div>`;
    return;
  }

  ensureToday(state, repId);
  const e = entryFor(state, repId, today());
  if (repUI.lastRep !== repId) { repUI.lastRep = repId; repUI.editDate = null; }
  const editDate = repUI.editDate && repUI.editDate <= today() ? repUI.editDate : today();
  const ed = entryFor(state, repId, editDate) || { d: 0, p: 0, c: 0, sale: 0 };
  const t = repTotals(state, repId);
  const r = rates(t);
  const flag = flagState(state, repId);
  const wt = weekTotals(state, repId);
  const cw = weekStart(today());
  const wk = wt[cw] || { d: 0, p: 0, c: 0, sale: 0, days: 0 };
  const wr = rates(wk);

  const dayRates = rates({ ...e, days: 1 });

  el.innerHTML = `
  <div class="repwrap">
    <div class="rephead">
      <div>
        <div class="rname">${esc(rep.name || "Unnamed")}</div>
        <div class="rsub">${new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}</div>
      </div>
      <button class="ghost sm" data-switchrep="1">Not you</button>
    </div>

    ${standingCard(flag, wk)}

    <div class="taps">
      ${STEPS.map((s) => tapCard(s, e, dayRates)).join("")}
    </div>

    <div class="card">
      <h4>Where today is breaking down</h4>
      ${barRow("Doors to presentation", dayRates.dToP, e.d, e.p)}
      ${barRow("Presentation to ask", dayRates.pToC, e.p, e.c)}
      ${barRow("Ask to sale", dayRates.cToSale, e.c, e.sale)}
      <p class="fine">Each bar is the stage above divided by the stage below it, today only.
      A dash means you have not reached that stage yet, which is different from zero.</p>
    </div>

    <div class="card">
      <h4>This week so far</h4>
      <div class="wgrid">
        ${wcell("Doors", fmtNum(wk.d))}
        ${wcell("Presentations", fmtNum(wk.p))}
        ${wcell("Asked", fmtNum(wk.c))}
        ${wcell("Sales", fmtNum(wk.sale), true)}
      </div>
      <div class="wgrid2">
        ${wcell("Ask rate", fmtPct(wr.pToC))}
        ${wcell("Ask to sale", fmtPct(wr.cToSale))}
        ${wcell("Doors per sale", fmt1(wr.doorsPerSale))}
        ${wcell("Days worked", fmtNum(wk.days))}
      </div>
      <p class="fine">Week of ${weekLabel(cw)}. Rates are totals over totals, not an average of your days.</p>
    </div>

    <div class="card">
      <h4>Note for today</h4>
      <textarea data-note="1" rows="2" placeholder="Anything worth remembering about today">${esc(e.note || "")}</textarea>
    </div>

    <details class="card" data-editbox="1" ${repUI.editOpen ? "open" : ""}>
      <summary>Fix a number or log a past day</summary>
      <div class="editgrid">
        <label>Date<input type="date" data-editdate="1" value="${editDate}" max="${today()}"></label>
        ${STEPS.map((s) => `<label>${s.label}<input type="text" inputmode="numeric" data-editk="${s.key}" value="${num(ed[s.key])}"></label>`).join("")}
      </div>
      ${funnelWarning(ed)}
      <p class="fine">${editDate === today()
        ? "Pick a past date to load that day and correct it without touching today."
        : "Editing " + new Date(editDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" }) + ". Today is untouched."}</p>
    </details>

    ${state.cloud && state.cloud.token ? `<div class="card">
      <h4>Your numbers are live</h4>
      <p class="fine">Every tap goes to your team board on its own. With no signal it waits and sends when you are back online. Nothing to send at the end of the day.</p>
      <div class="rowbtns"><button class="ghost" data-backup="1">Back up this phone</button></div>
    </div>` : `<div class="card">
      <h4>Send your numbers to your manager</h4>
      <p class="fine">Your numbers save on this phone only. Tap this at the end of the day and text the link to your manager so your day counts on the team board.</p>
      <div class="rowbtns"><button class="primary" data-sendmine="1">Send my numbers</button>
      <button class="ghost" data-backup="1">Back up this phone</button></div>
    </div>`}

    <details class="card" data-remindbox="1" ${repUI.remindOpen ? "open" : ""}>
      <summary>Reminders and your reason why</summary>
      <div data-remindhost="1"></div>
    </details>

    <div class="card">
      <h4>Your last days</h4>
      ${historyTable(state, repId)}
    </div>
  </div>`;
}

function funnelWarning(x) {
  const d = num(x.d), p = num(x.p), c = num(x.c), sl = num(x.sale);
  const bad = p > d ? "More presentations than doors" : c > p ? "More asks than presentations" : sl > c ? "More sales than asks" : "";
  return bad ? `<p class="fine warnline">${bad}. Check the numbers for this day.</p>` : "";
}

function standingCard(flag, wk) {
  const cls = flag.flagged ? "bad" : flag.atRisk ? "warn" : "good";
  const head = flag.flagged
    ? "Flagged"
    : flag.atRisk
      ? "At risk this week"
      : "Meeting the standard";
  const need = flag.needThisWeek;
  return `<div class="standing ${cls}">
    <div class="sthead">${head}</div>
    <div class="stbody">${esc(flag.reason)}</div>
    <div class="stbar">
      ${Array.from({ length: FLAG_RULE.minSales }, (_, i) =>
        `<span class="pip ${i < wk.sale ? "on" : ""}"></span>`).join("")}
      <span class="stcount">${wk.sale} of ${FLAG_RULE.minSales} sales this week</span>
    </div>
    <div class="fine">${need > 0
      ? need + " more " + (need === 1 ? "sale" : "sales") + " clears the week."
      : "The week is already clear."}
      The standard is ${FLAG_RULE.minSales} sales a week. ${FLAG_RULE.weeks} weeks under it in a row is a flag.</div>
  </div>`;
}

function tapCard(s, e, dr) {
  const v = num(e[s.key]);
  const sub =
    s.key === "p" ? pctSub(dr.dToP, "of doors") :
    s.key === "c" ? pctSub(dr.pToC, "of presentations") :
    s.key === "sale" ? pctSub(dr.cToSale, "of asks") :
    s.key === "d" ? "The attempt" : "";
  return `<div class="tap ${s.key === "c" ? "accentedge" : ""}">
    <div class="tapl">
      <span class="tletter">${s.letter}</span>
      <span class="tlabel">${s.label}</span>
    </div>
    <div class="tapv">${v}</div>
    <div class="tapsub">${sub || s.help}</div>
    <div class="taprow">
      <button class="minus" data-bump="${s.key}" data-by="-1" aria-label="Remove one ${s.label}">\u2212</button>
      <button class="plus" data-bump="${s.key}" data-by="1" aria-label="Add one ${s.label}">+</button>
    </div>
  </div>`;
}

function pctSub(v, tail) {
  return v === null ? "" : (v * 100).toFixed(0) + "% " + tail;
}

function barRow(label, v, top, bottom) {
  const w = v === null ? 0 : Math.max(0, Math.min(1, v)) * 100;
  return `<div class="brow">
    <div class="blab">${label}</div>
    <div class="btrack"><div class="bfill" style="width:${w.toFixed(1)}%"></div></div>
    <div class="bval">${v === null ? "\u2014" : (v * 100).toFixed(0) + "%"}</div>
    <div class="bfrac">${bottom} of ${top}</div>
  </div>`;
}

function wcell(label, v, accent) {
  return `<div class="wcell"><div class="wv ${accent ? "accent" : ""}">${v}</div><div class="wl">${label}</div></div>`;
}

function historyTable(state, repId) {
  const list = repEntries(state, repId).slice(0, 14);
  if (!list.length) return `<p class="fine">Nothing logged yet.</p>`;
  return `<div class="scroll"><table class="hist">
    <thead><tr><th>Date</th><th class="num">D</th><th class="num">P</th><th class="num">Asked</th><th class="num">Sales</th><th class="num">Ask rate</th></tr></thead>
    <tbody>${list.map((e) => {
      const rr = rates({ ...e, days: 1 });
      return `<tr><td>${new Date(e.date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}</td>
      <td class="num">${num(e.d)}</td><td class="num">${num(e.p)}</td>
      <td class="num">${num(e.c)}</td><td class="num accent">${num(e.sale)}</td>
      <td class="num">${fmtPct(rr.pToC)}</td></tr>`;
    }).join("")}</tbody></table></div>`;
}

export function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
