/* Live sync screens: the Team tab card, the rep card, and the join sheet. */

import * as cloud from "./cloud.js";
import { TEAM_EDITION } from "./edition.js";
import { ask, askText } from "./dialog.js";

let A = null; // { S, commit, render, flash, sendLink }
const ui = { busy: false, members: null, membersOpen: false, join: null, codeDraft: "", nameDraft: "", mgrName: "" };

const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function when(iso) {
  if (!iso) return "never";
  const d = new Date(iso);
  const same = d.toDateString() === new Date().toDateString();
  return same
    ? d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
    : d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

/* ---------- Team tab ---------- */

export function managerCardHtml(s) {
  const c = s.cloud;
  if (!cloud.isOn(s)) {
    const repPhone = s.role === "rep";
    return `<div class="card cloudcard" id="livesync">
      <h4>Live sync</h4>
      <p class="fine"><strong>Joining a team?</strong> Enter the code your manager texted you. Reps use the 6 character rep code, managers the 10 character manager code.</p>
      <div class="joinrow">
        <input data-clcode="1" inputmode="text" autocapitalize="characters" autocomplete="off" maxlength="20" placeholder="Team or activation code" value="${esc(ui.codeDraft)}" aria-label="Team code">
        <button class="primary" data-cl="code" ${ui.busy ? "disabled" : ""}>Join</button>
      </div>
      ${repPhone ? "" : `<details class="startteam"><summary>Starting a new team? Needs an activation code</summary>
        <p class="fine">This creates a brand new team with this phone as its manager, using the activation code from David Borske. Reps and managers joining an existing team should use the code above instead.
        Once it is on, every phone on the team saves to one shared place, reps' numbers show up here as they log them, the team report emails itself at 7pm, and nothing is lost if a phone is.${TEAM_EDITION ? "" : " The private Recruiting tab stays on this phone."}</p>
        <div class="rowbtns"><button class="ghost" data-cl="create" ${ui.busy ? "disabled" : ""}>Start a new team</button></div>
      </details>`}
      ${c && c.lastErr ? `<p class="fine warnline">${esc(c.lastErr)}</p>` : ""}
    </div>`;
  }
  const st = cloud.syncStatus();
  const mgr = c.role === "manager";
  const line = st.state === "offline" ? "No signal right now. Everything is saved on this phone and sends when you reconnect."
    : st.state === "error" ? esc(st.msg || "Sync paused. It will try again.")
    : "Last synced " + when(c.lastOk) + ".";
  if (!mgr) {
    return `<div class="card cloudcard" id="livesync">
      <h4>Live sync is on</h4>
      <p class="fine">Signed in to ${esc(c.team || "your team")}. ${line}</p>
      <div class="rowbtns"><button class="ghost" data-cl="sync">Sync now</button><button class="ghost" data-cl="leave">Sign this phone out</button></div>
    </div>`;
  }
  const mem = ui.membersOpen && ui.members ? `<ul class="memlist">${ui.members.map((m) => `
      <li><span><b>${esc(m.name || (m.role === "manager" ? "Manager" : "Rep"))}</b> <span class="fine">${m.role === "manager" ? "manager" : "rep"}, seen ${esc(when(m.last_seen))}</span></span>
      ${m.me ? `<span class="fine">this phone</span>` : `<button class="ghost small" data-cl="revoke" data-mid="${esc(m.id)}" data-mname="${esc(m.name || "")}">Sign out</button>`}</li>`).join("")}</ul>` : "";
  return `<div class="card cloudcard" id="livesync">
    <h4>Live sync is on</h4>
    <p class="fine">${esc(c.team || "Your team")}. ${line}</p>
    <div class="codes">
      <div><span class="fine">Rep code</span><b class="code">${esc(c.join_code || "")}</b></div>
      <div><span class="fine">Manager code</span><b class="code">${esc(c.manager_code || "")}</b></div>
    </div>
    <p class="fine">Reps open the invite, tap their name, and they are in. Give the manager code only to people who should see and edit everyone.</p>
    <div class="rowbtns">
      <button class="primary" data-cl="inviterep">Send rep invite</button>
      <button class="ghost" data-cl="invitemgr">Invite a manager</button>
    </div>
    <div class="rowbtns">
      <button class="ghost" data-cl="members">${ui.membersOpen ? "Hide phones" : "Phones signed in"}</button>
      <button class="ghost" data-cl="sync">Sync now</button>
    </div>
    ${mem}
    <details class="clmore"><summary>More</summary>
      <div class="rowbtns">
        <button class="ghost" data-cl="newcode">New rep code</button>
        <button class="ghost" data-cl="leave">Turn off on this phone</button>
      </div>
      <p class="fine">A new rep code stops the old invite from working. Phones already signed in stay signed in.</p>
    </details>
  </div>`;
}

/* ---------- join sheet ---------- */

function sheetHtml() {
  const j = ui.join;
  if (!j) return "";
  let body = "";
  if (j.loading) body = `<p>Checking the code.</p>`;
  else if (j.error) body = `<p class="warnline">${esc(j.error)}</p><div class="rowbtns"><button class="ghost" data-cl="sheetclose">Close</button></div>`;
  else if (j.kind === "manager") {
    body = `<p>This invite makes this phone a manager phone for <b>${esc(j.team)}</b>. You will see and can edit everyone's numbers.</p>
      <input data-clname="1" placeholder="Your name" value="${esc(ui.mgrName)}" autocomplete="name" aria-label="Your name">
      <div class="rowbtns"><button class="primary" data-cl="joinmgr" ${ui.busy ? "disabled" : ""}>Join as a manager</button><button class="ghost" data-cl="sheetclose">Not now</button></div>`;
  } else {
    const list = (j.reps || []).map((r) => r.claimed
      ? `<button class="ghost namebtn" disabled>${esc(r.name || "Unnamed")} <span class="fine">signed in</span></button>`
      : `<button class="ghost namebtn" data-cl="joinrep" data-rid="${esc(r.id)}" ${ui.busy ? "disabled" : ""}>${esc(r.name || "Unnamed")}</button>`).join("");
    body = `<p>Tap your name to join <b>${esc(j.team)}</b>. Your numbers reach your manager on their own after this.</p>
      <div class="namegrid">${list || `<p class="fine">No names on the roster yet.</p>`}</div>
      <p class="fine">Not on the list?</p>
      <div class="joinrow"><input data-clname="1" placeholder="Your full name" value="${esc(ui.nameDraft)}" autocomplete="name" aria-label="Your full name">
      <button class="ghost" data-cl="joinnew" ${ui.busy ? "disabled" : ""}>Join</button></div>
      <div class="rowbtns"><button class="ghost" data-cl="sheetclose">Not now</button></div>`;
  }
  return `<div class="clsheet" role="dialog" aria-modal="true" aria-label="Join your team"><div class="clsheet-in card">
    <h4>Join your team</h4>${body}</div></div>`;
}

export function paintSheet() {
  let host = document.getElementById("clsheethost");
  if (!host) { host = document.createElement("div"); host.id = "clsheethost"; document.body.appendChild(host); }
  const had = document.activeElement && document.activeElement.dataset && document.activeElement.dataset.clname;
  host.innerHTML = sheetHtml();
  if (had) { const i = host.querySelector("[data-clname]"); if (i) { i.focus(); const n = i.value.length; try { i.setSelectionRange(n, n); } catch (_) {} } }
}

async function openJoin(code) {
  ui.join = { code, loading: true };
  paintSheet();
  try {
    const r = await cloud.roster(code);
    ui.join = { code, kind: r.kind, team: r.team || "your team", reps: r.reps || [] };
  } catch (e) {
    ui.join = { code, error: e.message };
  }
  paintSheet();
}

function clearJoinHash() {
  try { if (/^#join=/.test(location.hash)) history.replaceState(null, "", location.pathname + location.search); } catch (_) {}
}

async function doJoin(repId, name) {
  if (!ui.join) return;
  ui.busy = true; paintSheet();
  try {
    const res = await cloud.join(ui.join.code, repId, name);
    ui.join = null; ui.nameDraft = ""; ui.codeDraft = "";
    clearJoinHash();
    paintSheet();
    A.flash(res.role === "manager" ? "This is now a manager phone for " + (res.team || "the team") + "." : "You are in. Your numbers now reach your manager on their own.");
  } catch (e) {
    ui.join = { ...ui.join, error: e.message };
    paintSheet();
  } finally {
    ui.busy = false; A.render(); paintSheet();
  }
}

/* ---------- events ---------- */

async function onClick(ev) {
  const t = ev.target.closest("[data-cl]");
  if (!t) return;
  const act = t.dataset.cl;
  const s = A.S();

  if (act === "create") {
    const key = ui.prefillKey || await askText("Enter the activation code from David Borske. Starting a team requires one. If you are joining an existing team, cancel and enter the code your manager sent you.", "Activation code", "", "Next");
    ui.prefillKey = "";
    if (key === null) return;
    if (!key.trim()) { A.flash("An activation code is needed to start a team."); return; }
    let name = s.team || "";
    if (!name) {
      name = await askText("Team name, as it should appear on reports:", "For example, Charlotte team", "", "Next");
      if (name === null) return;
    }
    ui.busy = true; A.render();
    try {
      if (name && !s.team) A.commit((x) => { x.team = name; });
      const me = await askText("Your name, so the team sees who the manager is:", "Your name", "", "Turn on live sync");
      if (me === null) { ui.busy = false; A.render(); return; }
      await cloud.createTeam(name, me.trim(), key.trim().toUpperCase());
      A.flash("Live sync is on. Send the rep invite next.");
    } catch (e) { A.flash(e.message); }
    ui.busy = false; A.render();
    return;
  }
  if (act === "code") {
    const box = document.querySelector("[data-clcode]");
    const code = String((box && box.value) || ui.codeDraft || "").trim().toUpperCase();
    if (code.length < 6) { A.flash("Enter the code your manager gave you."); return; }
    if (/^DPC-?[A-Z0-9]{4}-?[A-Z0-9]{4}$/.test(code.replace(/\s+/g, ""))) {
      let k = code.replace(/[^A-Z0-9]/g, "");
      k = k.slice(0, 3) + "-" + k.slice(3, 7) + "-" + k.slice(7, 11);
      ui.prefillKey = k;
      const f = document.createElement("button");
      f.dataset.cl = "create";
      return onClick({ target: f });
    }
    openJoin(code);
    return;
  }
  if (act === "joinrep") { doJoin(t.dataset.rid, ""); return; }
  if (act === "joinnew") {
    const nm = String(ui.nameDraft || "").trim();
    if (nm.length < 2) { A.flash("Type your full name."); return; }
    const taken = (ui.join.reps || []).find((r) => r.name.trim().toLowerCase() === nm.toLowerCase());
    if (taken) { A.flash("That name is on the list. Tap it above."); return; }
    const cur = s.reps.find((r) => r.id === s.activeRep);
    const rid = cur && !(ui.join.reps || []).some((r) => r.id === cur.id) ? cur.id
      : "r" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    doJoin(rid, nm);
    return;
  }
  if (act === "joinmgr") {
    const nm = String(ui.mgrName || "").trim();
    if (nm.length < 2) { A.flash("Type your name so the team knows who is signed in."); return; }
    doJoin(null, nm);
    return;
  }
  if (act === "sheetclose") { ui.join = null; clearJoinHash(); paintSheet(); return; }

  if (!cloud.isOn(s)) return;
  const c = s.cloud;
  if (act === "sync") { cloud.syncNow({ announce: true }); return; }
  if (act === "inviterep") {
    A.sendLink(cloud.inviteLink(c.join_code), "Join " + (c.team || "the DPC team"),
      "Open this, tap your name, and log your day. If you saved the tracker to your home screen, open it and enter team code " + c.join_code + ".");
    return;
  }
  if (act === "invitemgr") {
    if (!(await ask("A manager can see and edit everyone's numbers. Send the manager invite?", "Send it"))) return;
    A.sendLink(cloud.inviteLink(c.manager_code), "Manager access, " + (c.team || "DPC team"),
      "This makes your phone a manager phone for the team. If you saved the tracker to your home screen, open it and enter code " + c.manager_code + ".");
    return;
  }
  if (act === "members") {
    ui.membersOpen = !ui.membersOpen;
    if (ui.membersOpen) {
      try { ui.members = await cloud.members(); } catch (e) { A.flash(e.message); ui.membersOpen = false; }
    }
    A.render();
    return;
  }
  if (act === "revoke") {
    if (!(await ask("Sign out " + (t.dataset.mname || "this phone") + "? They can join again with the rep code.", "Sign out"))) return;
    try { await cloud.revoke(t.dataset.mid); ui.members = await cloud.members(); A.flash("Signed out."); } catch (e) { A.flash(e.message); }
    A.render();
    return;
  }
  if (act === "newcode") {
    if (!(await ask("Make a new rep code? The old invite stops working.", "Make new code"))) return;
    try { const r = await cloud.newRepCode(); A.flash("New rep code " + r.join_code + "."); } catch (e) { A.flash(e.message); }
    A.render();
    return;
  }
  if (act === "leave") {
    const mgr = c.role === "manager";
    if (!(await ask(mgr ? "Turn off live sync on this phone? The numbers stay on this phone and on the team database." : "Sign this phone out of live sync? Your numbers stay on this phone.", mgr ? "Turn off" : "Sign out"))) return;
    await cloud.leave();
    A.flash("Live sync is off on this phone.");
    A.render();
  }
}

function onInput(ev) {
  const el = ev.target;
  if (!el || !el.dataset) return;
  if (el.dataset.clcode) ui.codeDraft = el.value.toUpperCase();
  if (el.dataset.clname) {
    if (ui.join && ui.join.kind === "manager") ui.mgrName = el.value; else ui.nameDraft = el.value;
  }
}

export function init(api) {
  A = api;
  cloud.init(api);
  document.addEventListener("click", onClick);
  document.addEventListener("input", onInput);
  const code = cloud.readJoinHash();
  if (code) {
    const s = A.S();
    if (cloud.isOn(s) && (code === s.cloud.join_code || code === s.cloud.manager_code)) clearJoinHash();
    else if (cloud.isOn(s)) {
      ask("This phone is already signed in to " + (s.cloud.team || "a team") + ". Switch to the team in this invite?", "Switch").then((ok) => {
        if (ok) cloud.leave().then(() => openJoin(code));
        else clearJoinHash();
      });
    } else openJoin(code);
  }
}
