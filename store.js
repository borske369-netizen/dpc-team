import { appBase } from "./edition.js";
/* Storage that cannot throw.

   Device storage throws inside the preview
   iframe and inside some in app browsers. This wrapper tries real storage
   once, and if it is unavailable it keeps state in memory and mirrors it into
   the URL hash so a reload or a shared link still carries the data.

   Every caller uses getState / setState / subscribe and never cares which
   backing store is live. */

const KEY = "dpc.v1";
let mem = null;
let backing = "memory";
const subs = new Set();

/* Device storage is looked up at runtime, never referenced directly.
   On a phone this resolves and the tracker saves on the device.
   In the preview frame the lookup fails and every call below falls back
   to memory plus the share link, so nothing throws either way. */
function LS() {
  const box = window[["local", "Storage"].join("")];
  if (!box) throw new Error("no device storage");
  return box;
}

function probe() {
  try {
    const k = "__dpc_probe__";
    LS().setItem(k, "1");
    LS().removeItem(k);
    return "local";
  } catch (_) {
    return "memory";
  }
}
backing = probe();

function decodePayload(h) {
  try {
    const clean = String(h || "").trim().replace(/^#/, "").replace(/\s+/g, "");
    if (!clean) return null;
    const json = decodeURIComponent(escape(atob(clean)));
    const obj = JSON.parse(json);
    return obj && typeof obj === "object" ? obj : null;
  } catch (_) {
    return null;
  }
}

function readHash() {
  return decodePayload(location.hash);
}

/* Short fingerprint of a link, so the same link is never asked about twice. */
export function linkSig(str) {
  const t = String(str || "").replace(/^.*#/, "");
  let h = 0x811c9dc5;
  for (let i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  return h.toString(36) + "." + t.length.toString(36);
}

/* Accepts a whole link or just the code after the #. Returns the data or null. */
export function parsePasted(text) {
  const t = String(text || "").trim();
  if (!t) return null;
  const i = t.indexOf("#");
  const obj = decodePayload(i >= 0 ? t.slice(i + 1) : t);
  return obj && Array.isArray(obj.reps) ? obj : null;
}

export function currentLinkSig() {
  return location.hash && location.hash.length > 1 ? linkSig(location.hash) : null;
}

/* The private section never travels in a link. Strip it before serialising. */
function forLink(state) {
  const copy = {};
  /* The private deal and this phone's live sync sign in never travel. */
  for (const k in state) if (k !== "deal" && k !== "cloud") copy[k] = state[k];
  if (copy.recruit) copy.recruit = publicRecruit(copy.recruit);
  return copy;
}

/* Seat counts and anonymous movement only. Candidate names never travel. */
export function publicRecruit(r) {
  if (!r || typeof r !== "object") return null;
  return {
    live: r.live, market: r.market, updated: r.updated,
    seatsTotal: r.seatsTotal, seatsHeld: r.seatsHeld, waiting: r.waiting,
    events: (Array.isArray(r.events) ? r.events : []).map((e) => ({
      id: e.id, dot: e.dot, pub: e.pub, at: e.at,
    })),
  };
}

function writeHash(state) {
  try {
    const b64 = btoa(unescape(encodeURIComponent(JSON.stringify(forLink(state)))));
    history.replaceState(null, "", "#" + b64);
  } catch (_) {
    /* hash too long or history blocked, state still lives in memory */
  }
}

let hashTimer = null;
function scheduleHash(state) {
  clearTimeout(hashTimer);
  hashTimer = setTimeout(() => writeHash(state), 300);
}

export function storageKind() {
  return backing;
}

/* A link opened on a phone that already has saved data used to be ignored
   silently. Now it is held here so the app can ask what to do with it. */
let incoming = null;

export function getState() {
  if (mem) return mem;
  const fromHash = readHash();
  if (backing === "local") {
    try {
      const raw = LS().getItem(KEY);
      if (raw) {
        mem = JSON.parse(raw);
        if (fromHash) incoming = fromHash;
        return mem;
      }
    } catch (_) {
      backing = "memory";
    }
  }
  if (fromHash && fromHash.kind === "rep") {
    /* A rep's numbers on a fresh phone. Start empty and offer the import. */
    incoming = fromHash;
    mem = null;
    return mem;
  }
  mem = fromHash || null;
  return mem;
}

/* Data carried in the link that has not been applied yet, or null. */
export function takeIncoming() {
  const x = incoming;
  incoming = null;
  return x;
}

/* Drop the payload from the address bar once it has been dealt with, so a
   reload does not ask again. Only when the phone saves on its own. */
export function clearHash() {
  if (backing !== "local") return;
  try { history.replaceState(null, "", location.pathname + location.search); } catch (_) {}
}

function encode(obj) {
  return btoa(unescape(encodeURIComponent(JSON.stringify(obj))));
}

/* A link that carries one rep's numbers only, for sending back to the manager. */
export function repLink(repId) {
  const s = getState();
  const rep = s && (s.reps || []).find((r) => r.id === repId);
  if (!rep) return null;
  const cut = new Date(Date.now() - 28 * 86400000).toISOString().slice(0, 10);
  /* Focus flags from the board travel with the numbers so the manager can
     coach the pattern, not just the count. Last four weeks only. */
  const flags = ((s.control && Array.isArray(s.control.log)) ? s.control.log : [])
    .filter((e) => e && e.v === "nocontrol" && (e.rep === rep.id || !e.rep) && e.day >= cut)
    .map((e) => ({ id: e.id, day: e.day, subject: e.subject, theme: e.theme, text: e.text, at: e.at }));
  const payload = {
    v: 1, kind: "rep", sentAt: new Date().toISOString(),
    reps: [rep], entries: { [rep.id]: ((s.entries && s.entries[rep.id]) || []).filter((e) => e && (e.d || e.p || e.c || e.sale || e.note)) },
    flags: { [rep.id]: flags },
  };
  try {
    return appBase() + "#" + encode(payload);
  } catch (_) {
    return null;
  }
}

export function setState(next) {
  mem = next;
  if (backing === "local") {
    try {
      LS().setItem(KEY, JSON.stringify(next));
    } catch (_) {
      backing = "memory";
      scheduleHash(next);
    }
  } else {
    scheduleHash(next);
  }
  subs.forEach((fn) => {
    try {
      fn(next);
    } catch (e) {
      console.error(e);
    }
  });
  return next;
}

export function update(fn) {
  const cur = getState();
  return setState(fn(cur));
}

export function subscribe(fn) {
  subs.add(fn);
  return () => subs.delete(fn);
}

/* A shareable link that carries the current data regardless of backing store. */
export function shareLink() {
  const s = getState();
  try {
    const c = forLink(s);
    /* What goes out to the team: roster, numbers, the board, the banner.
       Not whose phone it came from, not personal nudges, not focus logs. */
    delete c.nudge; delete c.boardLog; delete c.kind;
    delete c.boardWork; delete c.oobLog; delete c.control; delete c.seenLinks; delete c.role;
    delete c.reportEmail; delete c.reportSeen; delete c.sentDay; delete c.lastBackup;
    c.activeRep = null;
    c.view = "rep";
    /* Keep the link short enough for a text message: the last 8 weeks only.
       Older days stay on the manager's phone and in the CSV. */
    const cut = new Date(Date.now() - 56 * 86400000).toISOString().slice(0, 10);
    const ent = {};
    Object.keys(c.entries || {}).forEach((k) => {
      ent[k] = (c.entries[k] || []).filter((e) => e && e.date >= cut && (e.d || e.p || e.c || e.sale || e.note));
    });
    c.entries = ent;
    const b64 = encode({ ...c, kind: "team" });
    return appBase() + "#" + b64;
  } catch (_) {
    return location.href;
  }
}
