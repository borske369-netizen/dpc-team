/* Live sync with the team database.

   The phone stays the source of truth for what it shows. Every change is kept
   on the phone first, then sent up in the background. Anything that cannot be
   sent (no signal, the app closed) is found again on the next sync by
   comparing what is on the phone with what was last confirmed by the server.

   s.cloud = {
     token, role, rep_id, team_id, team, join_code, manager_code,
     since,      server time of the last good sync
     sent,       "repId|date" -> fingerprint the server has confirmed
     repSent,    repId -> fingerprint of roster details confirmed
     flagSent,   ids of focus flags confirmed
     deleted,    rep ids removed on this phone, waiting to be sent
     boardSent, recruitSent, emailSent, teamSent
     lastOk, lastErr
   } */

import { publicRecruit } from "./store.js";
import { num, uid } from "./model.js";
import { TEAM_EDITION, appBase } from "./edition.js";

const URL_ = "https://ywfjrtegdyargcorhjdd.supabase.co/rest/v1/rpc/";
const KEY = "sb_publishable_zSMxIgpFvUqVXWcrdNYDrQ_uLU5a-Ya";

let A = null;          // { S, commit, render, flash }
let busy = false;
let again = false;
let applying = false;
let timer = null;
let status = { state: "off", at: null, msg: "" };

const MESSAGES = {
  bad_code: "That code is not right. Check it with your manager.",
  claimed: "That name is already signed in on another phone. Ask your manager to free it.",
  pick_name: "Pick your name first.",
  signed_out: "This phone was signed out of live sync.",
  managers_only: "Only a manager can do that.",
  not_self: "You cannot remove your own phone here.",
  bad_key: "That activation code is not valid or was already used. Contact David Borske.",
  team_paused: "This team's access is paused. Contact David Borske to turn it back on.",
};

async function rpc(fn, args) {
  const ctl = typeof AbortController !== "undefined" ? new AbortController() : null;
  const t = setTimeout(() => ctl && ctl.abort(), 20000);
  try {
    const r = await fetch(URL_ + fn, {
      method: "POST",
      headers: { apikey: KEY, "Content-Type": "application/json" },
      body: JSON.stringify(args),
      signal: ctl ? ctl.signal : undefined,
    });
    const txt = await r.text();
    let body = null;
    try { body = JSON.parse(txt); } catch (_) { body = txt; }
    if (!r.ok) {
      const code = body && body.message ? String(body.message) : "server";
      const err = new Error(MESSAGES[code] || "The team database did not answer. It will try again.");
      err.code = code;
      throw err;
    }
    return body;
  } catch (e) {
    if (!e.code) { e.code = "network"; e.message = "No connection. Your numbers are safe on this phone and will send when you have signal."; }
    throw e;
  } finally {
    clearTimeout(t);
  }
}

const fp = (e) => [num(e.d), num(e.p), num(e.c), num(e.sale), String(e.note || "")].join("|");
const repFp = (r) => [r.name || "", r.phone || "", r.market || "", r.started || "", r.active !== false].join("|");
const hashStr = (o) => {
  const t = JSON.stringify(o || null);
  let h = 0x811c9dc5;
  for (let i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  return h.toString(36) + "." + t.length;
};
const blank = (e) => num(e.d) + num(e.p) + num(e.c) + num(e.sale) === 0 && !String(e.note || "");

export function isOn(s) { return !!(s && s.cloud && s.cloud.token); }
export function isManager(s) { return isOn(s) && s.cloud.role === "manager"; }
export function syncStatus() { return status; }

function setStatus(st, msg) {
  status = { state: st, at: st === "ok" ? new Date() : status.at, msg: msg || "" };
  paintChip();
}

export function paintChip() {
  const net = document.getElementById("net");
  if (!net || !A) return;
  const s = A.S();
  if (!isOn(s)) return;
  const t = status.at ? status.at.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) : "";
  let label = "Live";
  if (status.state === "syncing") label = "Syncing";
  else if (status.state === "ok") label = "Live, synced " + t;
  else if (status.state === "offline") label = "Offline, will sync";
  else if (status.state === "error") label = "Sync paused";
  net.textContent = label;
  net.classList.toggle("off", status.state === "offline" || status.state === "error");
  net.classList.toggle("live", status.state === "ok" || status.state === "syncing");
}

/* ---------- building what to send ---------- */

function buildPush(s) {
  const c = s.cloud;
  const mgr = c.role === "manager";
  const sent = c.sent || {};
  const push = { entries: [], flags: [] };
  const mine = mgr ? s.reps.map((r) => r.id) : [c.rep_id];
  mine.forEach((rid) => {
    (s.entries[rid] || []).forEach((e) => {
      if (!e || !e.date) return;
      const key = rid + "|" + e.date;
      const f = fp(e);
      if (sent[key] === f) return;
      if (sent[key] === undefined && blank(e)) return;
      push.entries.push({ rep_id: rid, date: e.date, id: e.id || "", d: num(e.d), p: num(e.p), c: num(e.c), sale: num(e.sale), note: String(e.note || "") });
    });
  });

  const fs = new Set(c.flagSent || []);
  const log = (s.control && Array.isArray(s.control.log)) ? s.control.log : [];
  log.forEach((e) => {
    if (!e || e.v !== "nocontrol" || e.remote || !e.id || fs.has(e.id)) return;
    const rid = mgr ? (e.rep || s.activeRep) : c.rep_id;
    if (!rid) return;
    push.flags.push({ id: e.id, rep_id: rid, day: e.day || "", subject: e.subject || "", theme: e.theme || "", text: e.text || "", at: e.at || "" });
  });

  if (mgr) {
    const rs = c.repSent || {};
    push.reps = s.reps.filter((r) => rs[r.id] !== repFp(r)).map((r) => ({
      id: r.id, name: r.name || "", phone: r.phone || "", market: r.market || "", started: r.started || "", active: r.active !== false,
    }));
    if ((c.deleted || []).length) push.deleted = c.deleted.slice();
    if (s.board && hashStr(s.board) !== c.boardSent) push.board = s.board;
    const pr = s.recruit && !TEAM_EDITION ? publicRecruit(s.recruit) : null;
    if (pr && hashStr(pr) !== c.recruitSent) push.recruit = pr;
    if ((s.reportEmail || "") !== (c.emailSent || "")) push.report_email = s.reportEmail || "";
    if ((s.team || "") && (s.team || "") !== (c.teamSent || "")) push.team = s.team;
  }
  return push;
}

/* ---------- applying what came back ---------- */

function applyResult(s, push, res) {
  const c = s.cloud;
  /* The first sync after joining only reads. The team's numbers win over
     whatever this phone held from an old link; anything only this phone has
     is sent on the very next sync. */
  const pullFirst = !!c.pullFirst;
  const mgr = res.me && res.me.role === "manager";
  c.role = res.me ? res.me.role : c.role;
  c.rep_id = res.me ? res.me.rep_id : c.rep_id;
  c.sent = c.sent || {};
  c.repSent = c.repSent || {};
  if (res.team) {
    if (res.team.join_code) c.join_code = res.team.join_code;
    c.manager_code = res.team.manager_code || null;
    if (res.team.name) c.team = res.team.name;
  }

  /* What we sent is now confirmed. */
  push.entries.forEach((e) => { c.sent[e.rep_id + "|" + e.date] = fp(e); });
  if (push.reps) push.reps.forEach((r) => { c.repSent[r.id] = repFp(r); });
  if (push.deleted) c.deleted = (c.deleted || []).filter((id) => !push.deleted.includes(id));
  const fs = new Set(c.flagSent || []);
  push.flags.forEach((f) => fs.add(f.id));
  if ("board" in push) c.boardSent = hashStr(push.board);
  if ("recruit" in push) c.recruitSent = hashStr(push.recruit);
  if ("report_email" in push) c.emailSent = push.report_email;
  if ("team" in push) c.teamSent = push.team;

  /* Roster. */
  (res.reps || []).forEach((r) => {
    let mine = s.reps.find((x) => x.id === r.id);
    if (r.deleted) {
      if (mine) {
        s.reps = s.reps.filter((x) => x.id !== r.id);
        delete s.entries[r.id];
        if (s.activeRep === r.id) s.activeRep = null;
      }
      delete c.repSent[r.id];
      return;
    }
    const incoming = { id: r.id, name: r.name || "", phone: mgr ? r.phone || "" : (mine ? mine.phone : ""), market: r.market || "", started: r.started || "", active: r.active !== false };
    if (!mine) {
      s.reps.push(incoming);
      if (!s.entries[r.id]) s.entries[r.id] = [];
      c.repSent[r.id] = repFp(incoming);
      return;
    }
    /* A manager's unsent roster edit wins until it is sent. */
    if (mgr && c.repSent[r.id] !== undefined && c.repSent[r.id] !== repFp(mine)) return;
    Object.assign(mine, incoming);
    c.repSent[r.id] = repFp(mine);
  });

  /* Daily numbers. */
  (res.entries || []).forEach((e) => {
    const rid = e.rep_id;
    if (!s.reps.find((x) => x.id === rid)) return;
    if (!s.entries[rid]) s.entries[rid] = [];
    const list = s.entries[rid];
    const key = rid + "|" + e.date;
    const f = fp(e);
    const i = list.findIndex((x) => x.date === e.date);
    const writable = mgr || rid === c.rep_id;
    if (i >= 0) {
      const lf = fp(list[i]);
      if (lf === f) { c.sent[key] = f; return; }
      if (writable && !pullFirst) {
        /* Changed on this phone after the last confirm: keep it, it goes next. */
        if (c.sent[key] !== undefined && lf !== c.sent[key]) return;
        if (c.sent[key] === undefined && !blank(list[i])) return;
      }
      list[i] = { ...list[i], d: num(e.d), p: num(e.p), c: num(e.c), sale: num(e.sale), note: String(e.note || "") };
    } else {
      list.push({ id: e.id || uid(), date: e.date, d: num(e.d), p: num(e.p), c: num(e.c), sale: num(e.sale), note: String(e.note || "") });
    }
    c.sent[key] = f;
  });

  /* Focus flags from other phones. */
  if ((res.flags || []).length) {
    if (!s.control || typeof s.control !== "object") s.control = {};
    if (!Array.isArray(s.control.log)) s.control.log = [];
    const have = new Set(s.control.log.map((e) => e.id));
    res.flags.forEach((f) => {
      fs.add(f.id);
      if (have.has(f.id)) return;
      have.add(f.id);
      s.control.log.push({ id: f.id, v: "nocontrol", rep: f.rep_id, day: f.day, subject: f.subject, theme: f.theme, text: f.text, at: f.at, remote: true });
    });
    s.control.log = s.control.log.slice(-800);
  }
  c.flagSent = Array.from(fs).slice(-2000);

  /* Shared board and recruiting banner. A manager's own unsent change wins. */
  if (res.team && res.team.state_changed) {
    if (res.team.board && (pullFirst || !(mgr && s.board && hashStr(s.board) !== c.boardSent))) {
      s.board = res.team.board; c.boardSent = hashStr(res.team.board);
    }
    if (res.team.recruit && (!mgr || TEAM_EDITION)) s.recruit = res.team.recruit;
    if (mgr && res.team.recruit) c.recruitSent = c.recruitSent || hashStr(res.team.recruit);
  }
  if (mgr && res.team && typeof res.team.report_email === "string" && !("report_email" in push)) {
    if ((s.reportEmail || "") === (c.emailSent || "")) { s.reportEmail = res.team.report_email; c.emailSent = res.team.report_email; }
  }

  /* Phone mode follows the sign in. */
  if (c.role === "rep") {
    s.role = "rep";
    if (c.rep_id && s.reps.find((x) => x.id === c.rep_id)) s.activeRep = c.rep_id;
  } else if (s.role === "rep") {
    delete s.role;
  }

  delete c.pullFirst;
  c.since = res.now;
  c.lastOk = new Date().toISOString();
  c.lastErr = "";
}

/* ---------- the sync loop ---------- */

export async function syncNow(opts = {}) {
  if (!A) return;
  const s0 = A.S();
  if (!isOn(s0)) return;
  if (busy) { again = true; return; }
  busy = true;
  setStatus("syncing");
  try {
    const pullFirst = !!s0.cloud.pullFirst;
    const push = pullFirst ? { entries: [], flags: [] } : buildPush(s0);
    /* Ask for a little before the last sync so nothing written at the same
       instant on another phone is missed. Applying twice is harmless. */
    const since = s0.cloud.since ? new Date(new Date(s0.cloud.since).getTime() - 15000).toISOString() : null;
    const res = await rpc("dpc_sync", { p_token: s0.cloud.token, p_since: since, p_push: push });
    applying = true;
    A.commit((s) => { if (isOn(s)) applyResult(s, push, res); });
    applying = false;
    setStatus("ok");
    if (pullFirst) again = true;
    if (opts.announce) A.flash("Synced with the team.");
  } catch (e) {
    applying = false;
    if (e.code === "signed_out") {
      applying = true;
      A.commit((s) => { if (s.cloud) { s.cloud.token = null; s.cloud.lastErr = e.message; } });
      applying = false;
      setStatus("off");
      A.flash(e.message);
    } else {
      setStatus(e.code === "network" ? "offline" : "error", e.message);
      if (opts.announce) A.flash(e.message);
    }
  } finally {
    busy = false;
    if (again) { again = false; schedule(1500); }
  }
}

function schedule(ms) {
  clearTimeout(timer);
  timer = setTimeout(() => syncNow(), ms);
}

/* Called from the store on every change. */
export function onChange() {
  if (applying || !A) return;
  if (!isOn(A.S())) return;
  schedule(2500);
}

export function init(api) {
  A = api;
  setInterval(() => {
    if (document.visibilityState === "visible") syncNow();
  }, 30000);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") syncNow();
  });
  window.addEventListener("online", () => syncNow());
  if (isOn(A.S())) { paintChip(); setTimeout(() => syncNow(), 400); }
}

/* ---------- joining and managing ---------- */

export async function createTeam(teamName, myName, key) {
  const res = await rpc("dpc_create_team", { p_team: teamName || "", p_name: myName || "", p_key: key || "" });
  A.commit((s) => {
    s.cloud = { token: res.token, role: "manager", team_id: res.team_id, team: res.team,
      join_code: res.join_code, manager_code: res.manager_code, since: null,
      sent: {}, repSent: {}, flagSent: [], deleted: [] };
    delete s.role;
  });
  await syncNow();
  return res;
}

export async function roster(code) {
  return rpc("dpc_roster", { p_code: String(code || "").trim().toUpperCase() });
}

export async function join(code, repId, name) {
  const res = await rpc("dpc_join", { p_code: String(code || "").trim().toUpperCase(), p_rep_id: repId || null, p_name: name || "" });
  A.commit((s) => {
    /* A rep who was logging under a name this phone made up moves those
       numbers onto the name they picked. */
    if (res.role === "rep" && s.activeRep && s.activeRep !== res.rep_id) {
      const old = s.reps.find((r) => r.id === s.activeRep);
      const target = s.reps.find((r) => r.id === res.rep_id);
      if (old && !target) {
        s.entries[res.rep_id] = s.entries[old.id] || [];
        delete s.entries[old.id];
        old.id = res.rep_id;
      } else if (old && target) {
        const into = s.entries[res.rep_id] || (s.entries[res.rep_id] = []);
        (s.entries[old.id] || []).forEach((e) => {
          if (blank(e)) return;
          const i = into.findIndex((x) => x.date === e.date);
          if (i < 0) into.push(e);
        });
      }
    }
    s.cloud = { token: res.token, role: res.role, team_id: res.team_id, team: res.team, rep_id: res.rep_id || null,
      join_code: res.join_code, manager_code: res.manager_code || null, since: null,
      sent: {}, repSent: {}, flagSent: [], deleted: [], pullFirst: true };
    if (res.role === "rep") { s.role = "rep"; s.activeRep = res.rep_id; s.view = "rep"; }
    else { delete s.role; s.view = "manager"; }
  });
  await syncNow();
  return res;
}

export async function members() {
  const s = A.S();
  return rpc("dpc_members", { p_token: s.cloud.token });
}

export async function revoke(memberId) {
  const s = A.S();
  return rpc("dpc_revoke", { p_token: s.cloud.token, p_member: memberId });
}

export async function newRepCode() {
  const s = A.S();
  const res = await rpc("dpc_new_codes", { p_token: s.cloud.token, p_which: "rep" });
  A.commit((x) => { if (x.cloud) x.cloud.join_code = res.join_code; });
  return res;
}

export async function leave() {
  const s = A.S();
  try { await rpc("dpc_leave", { p_token: s.cloud.token }); } catch (_) {}
  A.commit((x) => { delete x.cloud; });
  setStatus("off");
}

/* A rep removed on a manager phone is removed for the team on next sync. */
export function noteDeleted(s, repId) {
  if (!isManager(s)) return;
  s.cloud.deleted = Array.from(new Set([...(s.cloud.deleted || []), repId]));
}

export function inviteLink(code) {
  return appBase() + "#join=" + encodeURIComponent(code);
}

/* Read once at load, before anything else can rewrite the address. */
const JOIN_AT_LOAD = (() => {
  try {
    const m = /^#join=([A-Za-z0-9]+)/.exec(location.hash || "");
    return m ? m[1].toUpperCase() : null;
  } catch (_) { return null; }
})();
export function readJoinHash() { return JOIN_AT_LOAD; }
