/*! Copyright 2026 David Borske. All rights reserved. */
import { callRpc, GOALS, isOn } from "./cloud.js";

const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const num = v => { const n = parseFloat(String(v ?? "").replace(/[$,\s]/g, "")); return isFinite(n) && n > 0 ? n : 0; };
const GOAL_KEYS = ["g30", "g60", "g90", "p30", "p60", "p90"];
const anyGoal = p => !!(p && GOAL_KEYS.some(k => String(p[k] || "").trim()));
const SMART_NAMES = { S: "Specific", M: "Measurable", A: "Attainable", R: "Relatable", T: "Time frame" };
const NUM_WORDS = /\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|fifteen|twenty|thirty|forty|fifty|hundred|thousand|half|double|daily|every day|each day|weekly|every week|times a week)\b/i;
export function smartOf(text, days) {
  const t = String(text || "").trim(), words = t ? t.split(/\s+/).filter(w => /[a-z0-9]/i.test(w)) : [];
  const vague = /^(i will |i want to |to )?(be |do |get |make |have )?(better|more|good|great|best|rich|successful|happy|healthy|money|paid)\b/i;
  const S = words.length >= 3 && !(words.length < 7 && vague.test(t));
  const M = /\d/.test(t) || NUM_WORDS.test(t);
  let A = M;
  if (A) {
    const sm = t.match(/(\d[\d,]*)\s*(sales|sale|deals|deal|accounts|customers|installs)\b/i);
    if (sm && num(sm[1]) > days * 3) A = false;
    const mo = t.match(/\$\s?(\d[\d,]*(?:\.\d+)?)\s*(k\b)?/i);
    if (mo) { let v = num(mo[1]); if (mo[2]) v *= 1000; if (v > 50000 * Math.max(1, days / 30)) A = false; }
    if (/\b(million|billion|millionaire|billionaire)\b/i.test(t)) A = false;
    const lb = t.match(/\b(lose|drop)\s+(\d+)\s*(lb|lbs|pounds)\b/i); if (lb && num(lb[2]) > days * 0.35) A = false;
  }
  const R = /\b(so|because|for (my|me|the|our|us)|to (pay|save|buy|help|cover|support|build|provide|move|afford|take care|get out|become|be able|feel|keep)|which (will|lets|means)|in order to|that way)\b/i.test(t);
  return { S, M, A, R, T: t.length > 0 };
}
function smartHint(r, days) {
  if (!r.T) return "";
  if (!r.S) return "Specific: say exactly what you will do or have.";
  if (!r.M) return "Measurable: add a number, like 12 sales or $500 saved.";
  if (!r.A) return `Attainable: that number looks too big for ${days} days. Pick one you can hit.`;
  if (!r.R) return "Relatable: say why it matters to you, like so I can pay my rent.";
  return "SMART goal. All five letters are lit.";
}
function smartInner(text, days, hint) {
  const r = smartOf(text, days);
  return `<span class="plsls">${"SMART".split("").map(L => `<span class="plsl${r[L] ? " on" : ""}" title="${SMART_NAMES[L]}" aria-label="${SMART_NAMES[L]} ${r[L] ? "met" : "not yet"}">${L}</span>`).join("")}</span>${hint ? `<span class="fine plshint">${esc(smartHint(r, days))}</span>` : ""}`;
}
function smartHtml(key, text, days, hint) { return `<div class="plsmart" data-plsmart="${key}" data-days="${days}">${smartInner(text, days, hint)}</div>`; }
const money = n => "$" + Math.round(n).toLocaleString("en-US");
const pct = n => Math.round(n * 100) + "%";
const WEEKS = 4.33;

function localDay(d = new Date(Date.now() - 4 * 3600000)) {
  const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return z.toISOString().slice(0, 10);
}
function addDays(day, n) { const d = new Date(day + "T12:00:00"); d.setDate(d.getDate() + n); return localDay(d); }
function fmtPhone(p) { const d = String(p || "").replace(/\D/g, "").replace(/^1(?=\d{10}$)/, ""); return d.length === 10 ? d.slice(0, 3) + "-" + d.slice(3, 6) + "-" + d.slice(6) : String(p || ""); }

// Module state survives the app's full re-renders, so nothing closes or resets on its own.
const st = {
  loaded: false, loading: false, err: "", at: 0,
  plans: {}, log: [], contacts: null, cAt: 0,
  draft: null, draftRep: "", saving: false, msg: "",
  open: {}, editContacts: false, cDraft: null, cMsg: "",
  rEdit: false, rDraft: null, rSorted: null, rMsg: "", rBusy: false
};
let app = null, lastS = null;

function token(s) { return s && s.cloud && s.cloud.token; }
function role(s) { return s && s.cloud ? s.cloud.role : ""; }
function myRep(s) { return s && s.cloud && s.cloud.role === "rep" ? s.cloud.rep_id : null; }

async function load(s, force) {
  if (!isOn(s) || st.loading) return;
  if (!force && st.loaded && Date.now() - st.at < 120000) return;
  st.loading = true; if (force && app) app.render();
  try {
    const r = await callRpc("dpc_plan_get", { p_token: token(s) });
    st.plans = {};
    (r && r.plans || []).forEach(p => { st.plans[p.rep_id] = Object.assign({ updated_at: p.updated_at }, p.plan || {}); });
    st.log = (r && r.log) || [];
    st.err = ""; st.loaded = true; st.at = Date.now();
  } catch (e) { st.err = e && e.message ? e.message : "Could not load goals."; }
  st.loading = false;
  app && app.render();
}
async function loadContacts(s, force) {
  if (!isOn(s)) return;
  if (!force && st.contacts && Date.now() - st.cAt < 300000) return;
  st.cAt = Date.now();
  try { st.contacts = await callRpc("dpc_contacts_get", { p_token: token(s) }) || []; }
  catch (e) { st.contacts = st.contacts || []; st.cMsg = e && e.message ? e.message : ""; }
  app && app.render();
}

// Law of averages from the rep's own logged history.
function history(s, repId, days) {
  const from = days ? addDays(localDay(), -days) : "0000-00-00";
  const t = { d: 0, p: 0, c: 0, sale: 0, worked: new Set() };
  ((s.entries && s.entries[repId]) || []).forEach(e => {
    if (!e || !e.date || e.date < from) return;
    t.d += +e.d || 0; t.p += +e.p || 0; t.c += +e.c || 0; t.sale += +e.sale || 0;
    if ((+e.d || 0) + (+e.p || 0) + (+e.c || 0) + (+e.sale || 0) > 0) t.worked.add(e.date);
  });
  t.days = t.worked.size;
  return t;
}
function today(s, repId) {
  const d = localDay(), t = { d: 0, p: 0, c: 0, sale: 0 };
  ((s.entries && s.entries[repId]) || []).forEach(e => { if (e && e.date === d) { t.d += +e.d || 0; t.p += +e.p || 0; t.c += +e.c || 0; t.sale += +e.sale || 0; } });
  return t;
}
function payFor(plan, repId) {
  const p = num(plan && plan.pay);
  if (p) return p;
  const g = GOALS && GOALS.list && GOALS.list[repId];
  return g && g.goals ? num(g.goals.pay) : 0;
}
function pace(s, repId, plan) {
  let h = history(s, repId, 60);
  if (h.sale === 0) h = history(s, repId, 0);
  const income = num(plan && plan.income), pay = payFor(plan, repId), dpw = Math.min(7, Math.max(1, Math.round(num(plan && plan.days)) || 5));
  const out = { h, income, pay, dpw, ready: false };
  out.pd = h.d ? h.p / h.d : 0; out.cp = h.p ? h.c / h.p : 0; out.sc = h.c ? h.sale / h.c : 0;
  out.dPerSale = h.sale ? h.d / h.sale : 0;
  if (income && pay) {
    out.salesMonth = Math.ceil(income / pay);
    out.salesWeek = Math.ceil(out.salesMonth / WEEKS);
    out.salesDay = out.salesMonth / (dpw * WEEKS);
  }
  if (out.salesDay && out.dPerSale) {
    out.ready = true;
    out.dDay = Math.ceil(out.salesDay * out.dPerSale);
    out.pDay = Math.ceil(out.dDay * out.pd);
    out.cDay = Math.ceil(out.pDay * out.cp);
    out.sDay = Math.round(out.salesDay * 10) / 10;
    // What a better conversion rate does, five points at a time.
    const steps = [["pd", "D to P", "pitch more of the people you talk to"], ["cp", "P to C", "ask for the business after more pitches"], ["sc", "C to S", "close more of your asks"]];
    out.better = steps.map(([k, label, how]) => {
      const r = { pd: out.pd, cp: out.cp, sc: out.sc };
      if (!r[k]) return null;
      r[k] = Math.min(1, r[k] + 0.05);
      const dps = 1 / (r.pd * r.cp * r.sc);
      const dDay = Math.ceil(out.salesDay * dps);
      return { k, label, how, from: out[k], to: r[k], dDay, saved: out.dDay - dDay };
    }).filter(Boolean).sort((a, b) => b.saved - a.saved);
  }
  return out;
}
function doneCount(items, l) { const d = new Set(l && l.done || []); return items.filter(it => d.has(it.id)).length; }
function dayLog(repId, day) { return st.log.find(l => l.rep_id === repId && l.day === day); }
function weekRate(repId, plan) {
  const items = (plan && plan.routine || []).length; if (!items) return null;
  let done = 0, total = 0;
  for (let i = 1; i <= 7; i++) { const l = dayLog(repId, addDays(localDay(), -i)); total += items; if (l) done += doneCount(plan.routine, l); }
  return total ? done / total : null;
}

function draftFor(repId) {
  if (st.draftRep !== repId || !st.draft) {
    const p = st.plans[repId] || {};
    st.draftRep = repId;
    st.draft = {
      g30: p.g30 || "", g60: p.g60 || "", g90: p.g90 || "", p30: p.p30 || "", p60: p.p60 || "", p90: p.p90 || "",
      income: p.income ? String(p.income) : "", pay: p.pay ? String(p.pay) : "", days: p.days ? String(p.days) : "5"
    };
  }
  return st.draft;
}
function draftPlan(repId) {
  const d = draftFor(repId);
  return { income: num(d.income), pay: num(d.pay), days: num(d.days) };
}

function paceHtml(s, repId, plan, mine) {
  const p = pace(s, repId, plan), t = today(s, repId);
  const you = mine ? "you" : "they", your = mine ? "your" : "their";
  if (!p.income || !p.pay) return `<p class="fine">${mine ? "Add your monthly income goal and what you make per sale, then tap Save. Your daily pace shows up here." : "No income goal set yet."}</p>`;
  let h = `<p><b>${money(p.income)} a month</b> at ${money(p.pay)} a sale is <b>${p.salesMonth} sales a month</b>, about ${p.salesWeek} a week.</p>`;
  if (!p.ready) {
    h += `<p class="fine">${mine ? "Your daily pace comes from your own numbers. Log every decision maker you reach, D to P to C to S. After your first logged sale it shows how many decision maker contacts you need a day." : "Pace shows after their first logged sale."}</p>`;
    return h;
  }
  const bar = (have, need) => { const w = need ? Math.min(100, Math.round(have / need * 100)) : 0; return `<span class="plbar"><i style="width:${w}%"></i></span>`; };
  const nd = p.h.days || 0;
  h += `<p class="plbig">${mine ? "Talk to" : "Needs"} <b>${p.dDay} decision makers</b> a day</p>
  <p class="fine">D means you talked to the decision maker. This comes from ${your} last ${nd} ${nd === 1 ? "day" : "days"} worked: about ${Math.round(p.dPerSale)} D for every sale, ${p.dpw} days a week.</p>
  <ul class="plpace">
    <li><b>D</b> ${t.d} of ${p.dDay} today ${bar(t.d, p.dDay)}</li>
    <li><b>P</b> ${t.p} of ${p.pDay} today ${bar(t.p, p.pDay)}</li>
    <li><b>C</b> ${t.c} of ${p.cDay} today ${bar(t.c, p.cDay)}</li>
    <li><b>S</b> ${t.sale} today, goal about ${Math.max(1, Math.round(p.salesDay))} a day</li>
  </ul>`;
  const best = p.better && p.better.find(b => b.saved > 0);
  if (best) h += `<p><b>Fastest way to need fewer:</b> ${mine ? esc(best.how.charAt(0).toUpperCase() + best.how.slice(1)) : esc(best.label) + " is the weak step"}. Moving ${esc(best.label)} from ${pct(best.from)} to ${pct(best.to)} cuts it to ${best.dDay} a day.</p>`;
  return h;
}

// ---------- Routine: read it, sort it into AM and PM, rate it against goals ----------
const PM_WORDS = /\b(pm|p\.m\.|night|tonight|evening|bed|bedtime|sleep|dinner|after work|end of (the )?day|recap|reflect|journal|plan (for )?tomorrow|tomorrow)\b/i;
const AM_WORDS = /\b(am|a\.m\.|morning|wake|breakfast|before i leave|before leaving|start (my|the) day|first thing|shower)\b/i;
const HEAD_AM = /^(am|a\.m\.|morning|mornings|morning routine)\s*:?$/i;
const HEAD_PM = /^(pm|p\.m\.|night|evening|nightly|night routine|evening routine)\s*:?$/i;

const MAX_ITEMS = 20;
export function sortRoutine(text) {
  const out = []; let part = "am";
  String(text || "").split(/\r?\n|;/).forEach(raw => {
    let line = raw.replace(/^\s*(?:[-*\u2022\u25CF\u25AA]+|\d{1,2}[.)])\s*/, "").replace(/\s+/g, " ").trim();
    if (!line) return;
    if (HEAD_AM.test(line)) { part = "am"; return; }
    if (HEAD_PM.test(line)) { part = "pm"; return; }
    if (/^(my |daily |the )?(daily )?routine\s*:?$/i.test(line) || /^(my )?(am|pm) routine\s*:?$/i.test(line)) return;
    const hm = line.match(/^(am|a\.m\.|morning|pm|p\.m\.|night|evening)\s*:\s*(.+)$/i);
    let p = part;
    if (hm) { p = /^(am|a\.m\.|morning)$/i.test(hm[1]) ? "am" : "pm"; line = hm[2].trim(); }
    else {
      const tm = line.match(/\b(\d{1,2})(?::\d{2})?\s*(am|pm|a\.m\.|p\.m\.)/i);
      if (tm) p = /^p/i.test(tm[2]) ? "pm" : "am";
      else if (/\bsleep in\b/i.test(line)) p = "am";
      else if (PM_WORDS.test(line)) p = "pm";
      else if (AM_WORDS.test(line)) p = "am";
    }
    if (line.replace(/[^a-z]/gi, "").length < 3) return;
    line = line.charAt(0).toUpperCase() + line.slice(1);
    if (out.some(o => o.text.toLowerCase() === line.toLowerCase())) return;
    out.push({ text: line.slice(0, 120), part: p });
  });
  return out.slice(0, MAX_ITEMS);
}

const CHECKS = [
  { pts: 2, re: /\b(goal|goals|vision|my why|affirm)/i, name: "reading your goals", add: "Read my goals out loud" },
  { pts: 2, re: /\b(pitch|practice|role ?play|script|objection|rebuttal|train|training|study|rehears)/i, name: "practicing your pitch", add: "Practice my pitch out loud for 10 minutes" },
  { pts: 1, re: /\b(field|knock|doors?|territory|turf|on time|head out|contacts?|decision makers?)\b/i, name: "a set time in the field", add: "In the field on time" },
  { pts: 1, re: /\b\d+\s*(decision makers?|contacts?|doors?|knocks?|houses?|homes?|conversations?)\b/i, name: "a daily contact number", add: "Reach a set number of decision makers every day" },
  { pts: 2, re: /\b(log|track|numbers|app|dpc|count)\b/i, name: "logging your numbers", add: "Log every decision maker as it happens" },
  { pts: 1, re: /\b(review|reflect|recap|journal|plan (for )?tomorrow|fix one|what went)/i, name: "reviewing your day", add: "Review my numbers and fix one thing for tomorrow" },
  { pts: 1, re: /\b(in bed|bedtime|to bed|sleep by|sleep at|gym|work ?out|exercise|run|walk|stretch|water|eat|meal|breakfast|lunch|pray|meditat|breath)/i, name: "taking care of your energy", add: "In bed by the same time every night" }
];
export function rateRoutine(items, plan) {
  const text = items.map(i => i.text).join("\n");
  let score = 0; const have = [], miss = [];
  CHECKS.forEach(c => { if (c.re.test(text)) { score += c.pts; have.push(c.name); } else miss.push(c); });
  const hasGoals = !!(anyGoal(plan) || num(plan && plan.income));
  const hasNum = CHECKS[3].re.test(text);
  const label = score >= 8 && hasNum ? "Strong" : score >= 5 ? "Good start" : "Needs work";
  return { score, label, have, miss: miss.sort((a, b) => b.pts - a.pts), hasGoals };
}

function ratingHtml(items, plan, mine, s, repId) {
  if (!items.length) return "";
  const r = rateRoutine(items, plan);
  let h = `<div class="card"><h4>Does ${mine ? "my" : "their"} routine support ${mine ? "my" : "their"} goals?</h4>
    <p class="plscore"><b>${r.score} of 10</b> <span class="pill ${r.score >= 8 ? "good" : r.score >= 5 ? "" : "warn"}">${r.label}</span></p>`;
  if (!r.hasGoals) h += `<p class="fine">${mine ? "Save your goals on the Goals tab so this rating has something to check against." : "No goals saved yet, so this rates the routine on its own."}</p>`;
  if (r.have.length) h += `<p class="fine">What helps: ${esc(r.have.join(", "))}.</p>`;
  if (s && repId && plan && num(plan.income) && payFor(plan, repId)) {
    const pc = pace(s, repId, plan);
    const m = items.map(i => i.text).join(" ").match(/\b(\d+)\s*(decision makers?|contacts?|conversations?)\b/i);
    const dm = m ? +m[1] : 0;
    h += pc.ready
      ? `<p class="fine">${mine ? "Your" : "Their"} income goal takes about ${pc.dDay} decision makers a day. ${dm >= pc.dDay ? "The routine sets " + dm + " a day. That covers it." : dm ? "The routine sets " + dm + " a day. Raise it to " + pc.dDay + "." : "Put that number in the routine, like: Reach " + pc.dDay + " decision makers."}</p>`
      : `<p class="fine">${mine ? "Your" : "Their"} income goal is ${pc.salesMonth} sales a month. After the first logged sale this shows the daily contacts it takes.</p>`;
  }
  if (r.miss.length) h += `<p><b>Add next:</b> ${esc(r.miss[0].add)}</p><p class="fine">It is missing ${esc(r.miss[0].name)}. Goals get hit with daily habits ${mine ? "you" : "they"} control.</p>`;
  return h + `</div>`;
}

function checklistHtml(repId, items, mine) {
  const day = localDay(), l = dayLog(repId, day), done = new Set(l ? l.done : []);
  const row = it => mine ? `<label class="plcheck"><input type="checkbox" data-plcheck="${esc(it.id)}" ${done.has(it.id) ? "checked" : ""}> <span>${esc(it.text)}</span></label>`
    : `<p class="plcheck plro"><span class="plmark ${done.has(it.id) ? "on" : ""}">${done.has(it.id) ? "✓" : ""}</span><span>${esc(it.text)}${done.has(it.id) ? "" : ' <span class="fine">not yet</span>'}</span></p>`;
  const am = items.filter(i => i.part !== "pm"), pm = items.filter(i => i.part === "pm");
  const n = items.filter(it => done.has(it.id)).length;
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = addDays(day, -i), x = dayLog(repId, d), k = x ? doneCount(items, x) : 0;
    days.push(`<span class="pldaywrap"><span class="plday ${k >= items.length ? "full" : k ? "part" : ""}">${i === 0 ? "Today" : new Date(d + "T12:00:00").toLocaleDateString("en-US", { weekday: "short" })}</span><span class="fine">${k}/${items.length}</span></span>`);
  }
  return `<p><b>Today: ${n} of ${items.length} done</b>${n >= items.length ? ' <span class="pill good">Done</span>' : ""}</p>
    ${am.length ? `<p class="plpart">AM, ${am.length} ${am.length === 1 ? "thing" : "things"}</p>${am.map(row).join("")}` : ""}
    ${pm.length ? `<p class="plpart">PM, ${pm.length} ${pm.length === 1 ? "thing" : "things"}</p>${pm.map(row).join("")}` : ""}
    <p class="plpart">Last 7 days</p><p class="fine">Filled in means every item was checked that day.</p><div class="pldays">${days.join("")}</div>`;
}

function routineHtml(repId, plan, mine) {
  const items = plan && plan.routine || [];
  if (!items.length) return `<p class="fine">No routine set yet.</p>`;
  return checklistHtml(repId, items, mine);
}

function loadScript(src, name) {
  if (window[name]) return Promise.resolve(window[name]);
  return new Promise((ok, bad) => { const sc = document.createElement("script"); sc.src = src; sc.onload = () => window[name] ? ok(window[name]) : bad(new Error("load")); sc.onerror = () => bad(new Error("load")); document.head.appendChild(sc); });
}
async function readFile(f, say) {
  const n = (f.name || "").toLowerCase(), t = f.type || "";
  if (/^image\//.test(t) || /\.(jpe?g|png|heic|webp)$/.test(n)) {
    say("Reading the photo");
    const T = await loadScript("https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js", "Tesseract");
    const r = await T.recognize(f, "eng", { logger: m => { if (m && m.status === "recognizing text") say("Reading the photo, " + Math.round((m.progress || 0) * 100) + "%"); } });
    return r && r.data ? r.data.text : "";
  }
  if (/\.pdf$/.test(n) || t === "application/pdf") {
    say("Reading the PDF");
    const P = "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/";
    const lib = await loadScript(P + "pdf.min.js", "pdfjsLib"); lib.GlobalWorkerOptions.workerSrc = P + "pdf.worker.min.js";
    const doc = await lib.getDocument({ data: await f.arrayBuffer() }).promise; let out = "";
    for (let i = 1; i <= Math.min(doc.numPages, 5); i++) {
      const c = await (await doc.getPage(i)).getTextContent(); let y = null;
      c.items.forEach(it => { const yy = it.transform ? it.transform[5] : 0; out += (y !== null && Math.abs(yy - y) > 2 ? "\n" : " ") + it.str; y = yy; });
      out += "\n";
    }
    return out;
  }
  if (/\.docx$/.test(n)) { say("Reading the document"); const M = await loadScript("https://cdn.jsdelivr.net/npm/mammoth@1.8.0/mammoth.browser.min.js", "mammoth"); return (await M.extractRawText({ arrayBuffer: await f.arrayBuffer() })).value || ""; }
  return await f.text();
}

function draftText(items) {
  const am = items.filter(i => i.part !== "pm").map(i => i.text), pm = items.filter(i => i.part === "pm").map(i => i.text);
  return (am.length ? "Morning:\n" + am.join("\n") : "") + (am.length && pm.length ? "\n\n" : "") + (pm.length ? "Night:\n" + pm.join("\n") : "");
}
function routinePage(s) {
  const repId = myRep(s);
  if (!repId) return `<div class="card"><h4>My routine</h4><p class="fine">Sign in with your rep key to set your routine.</p></div>`;
  const plan = st.plans[repId] || null, items = plan && plan.routine || [];
  if (items.length && !st.rEdit) {
    return `<div class="plwrap">
      <div class="card"><h4>My routine today</h4>${checklistHtml(repId, items, true)}</div>
      ${ratingHtml(items, plan, true, s, repId)}
      <div class="card"><button class="ghost sm" data-plredit="1">Change my routine</button>${st.rMsg ? `<p class="fine" role="status">${esc(st.rMsg)}</p>` : ""}</div></div>`;
  }
  if (st.rDraft === null) st.rDraft = items.length ? draftText(items) : "";
  let h = `<div class="plwrap"><div class="card"><h4>My routine</h4>
    <p class="fine">Type your routine, one thing per line, or add a photo of it written out. The app turns it into an AM and PM checklist.</p>
    <textarea data-plrtext="1" rows="7" maxlength="2000" placeholder="Wake up at 6 AM&#10;Read my goals out loud&#10;Practice my pitch for 10 minutes&#10;In the field by 11&#10;Review my numbers at night">${esc(st.rDraft)}</textarea>
    <button class="primary plfull" data-plrsort="1" ${st.rBusy ? "disabled" : ""}>Make my checklist</button>
    <div class="plbtns"><label class="ghost sm plfile">Add a photo or file<input type="file" data-plrfile="1" accept="image/*,.pdf,.docx,.txt"></label>
    ${items.length ? `<button class="ghost sm" data-plredit="0">Cancel</button>` : ""}</div>
    ${st.rMsg ? `<p class="fine" role="status">${esc(st.rMsg)}</p>` : ""}</div>`;
  if (st.rSorted && st.rSorted.length) {
    const idx = st.rSorted.map((it, i) => [it, i]);
    const row = ([it, i]) => `<li><span>${esc(it.text)}</span><button class="plmove" data-plrmove="${i}" aria-label="Move to ${it.part === "pm" ? "AM" : "PM"}">To ${it.part === "pm" ? "AM" : "PM"}</button></li>`;
    const am = idx.filter(([it]) => it.part !== "pm"), pm = idx.filter(([it]) => it.part === "pm");
    h += `<div class="card"><h4>Check your checklist</h4><p class="fine">Wrong part of the day? Tap To AM or To PM.</p>
      <p class="plpart">AM, ${am.length}</p><ul class="plsort">${am.map(row).join("") || '<li class="fine">Nothing in the AM yet</li>'}</ul>
      <p class="plpart">PM, ${pm.length}</p><ul class="plsort">${pm.map(row).join("") || '<li class="fine">Nothing in the PM yet</li>'}</ul>
      <button class="primary" data-plrsave="1" ${st.saving ? "disabled" : ""}>${st.saving ? "Saving" : "Save my routine"}</button></div>`;
    h += ratingHtml(st.rSorted, plan, true, s, repId);
  }
  return h + `</div>`;
}

function repPage(s) {
  const repId = myRep(s);
  if (!repId) return `<div class="card"><h4>My goals</h4><p class="fine">Sign in with your rep key to set your goals.</p></div>`;
  const plan = st.plans[repId] || null, d = draftFor(repId);
  const live = Object.assign({}, plan || {}, draftPlan(repId));
  return `<div class="plwrap">
  <div class="card"><h4>My goals</h4>
    <p class="fine">Write them in your own words. Your manager sees what you write here.</p>
    <p class="fine plsmartkey">Make each goal SMART. The letters light up as your goal hits them: <b>S</b> Specific, <b>M</b> Measurable, <b>A</b> Attainable, <b>R</b> Relatable, <b>T</b> Time frame. The time frame is already set by the 30, 60 and 90 day slots.</p>
    ${[[30, "12 sales so I can cover my rent and car", "save $300 so I have money set aside"], [60, "", ""], [90, "", ""]].map(([n, pb, pp]) => `<div class="plslot"><h5>${n} days from now</h5>
      <label class="pllab">Business goal<textarea data-pl="g${n}" rows="2" maxlength="600"${pb ? ` placeholder="For example, ${pb}"` : ""}>${esc(d["g" + n])}</textarea></label>
      ${smartHtml("g" + n, d["g" + n], n, true)}
      <label class="pllab">Personal goal<textarea data-pl="p${n}" rows="2" maxlength="600"${pp ? ` placeholder="For example, ${pp}"` : ""}>${esc(d["p" + n])}</textarea></label>
      ${smartHtml("p" + n, d["p" + n], n, true)}</div>`).join("")}
    <div class="plrow">
      <label class="pllab">Income a month<input data-pl="income" inputmode="decimal" placeholder="$4,000" value="${esc(d.income)}"></label>
      <label class="pllab">Pay per sale<input data-pl="pay" inputmode="decimal" placeholder="$100" value="${esc(d.pay)}"></label>
      <label class="pllab">Days a week<input data-pl="days" inputmode="numeric" placeholder="5" value="${esc(d.days)}"></label>
    </div>
    <button class="primary" data-plsave="1" ${st.saving ? "disabled" : ""}>${st.saving ? "Saving" : "Save my goals"}</button>
    ${st.msg ? `<p class="fine" role="status">${esc(st.msg)}</p>` : ""}
    ${plan && plan.updated_at ? `<p class="fine">Last saved ${new Date(plan.updated_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}.</p>` : ""}
  </div>
  <div class="card"><h4>My pace</h4>${paceHtml(s, repId, live, true)}</div></div>`;
}

function reportText(s) {
  const reps = (s.reps || []).filter(r => r.active !== false), day = localDay();
  const lines = [];
  let withR = 0, full = 0;
  reps.forEach(r => {
    const p = st.plans[r.id]; const items = p && p.routine || [];
    if (!items.length) return; withR++;
    const l = dayLog(r.id, day), n = l ? doneCount(items, l) : 0;
    if (n >= items.length) full++;
    lines.push((r.name || "Unnamed") + ": " + (l ? n + " of " + items.length + " routine items" : "no routine check in"));
  });
  const none = reps.filter(r => !(st.plans[r.id] && (st.plans[r.id].routine || []).length)).map(r => r.name || "Unnamed");
  return "Routine report " + new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }) + "\n" +
    full + " of " + withR + " reps finished their routine.\n" + lines.join("\n") +
    (none.length ? "\nNo routine yet: " + none.join(", ") : "");
}

function repRows(s, kind) {
  const reps = (s.reps || []).filter(r => r.active !== false), day = localDay();
  return reps.map(r => {
    const p = st.plans[r.id], items = p && p.routine || [];
    const l = dayLog(r.id, day), n = l ? doneCount(items, l) : 0;
    const hasGoals = p && (anyGoal(p) || p.income);
    const pc = p ? pace(s, r.id, p) : null, t = today(s, r.id);
    const status = kind === "goals"
      ? (hasGoals ? '<span class="pill good">Goals set</span>' : '<span class="pill">No goals yet</span>')
      : (!items.length ? '<span class="pill">No routine yet</span>' : n >= items.length ? '<span class="pill good">Done today</span>' : `<span class="pill warn">${n} of ${items.length} done today</span>`);
    const key = kind + ":" + r.id, open = !!st.open[key];
    let detail = "";
    if (open) {
      if (kind === "goals") detail = hasGoals ? `<div class="pldetail">
        ${[30, 60, 90].map(n => `<div class="plslot"><h5>${n} days</h5><p><b>Business:</b> ${esc(p["g" + n] || "not set")}</p>${p["g" + n] ? smartHtml("", p["g" + n], n, false) : ""}<p><b>Personal:</b> ${esc(p["p" + n] || "not set")}</p>${p["p" + n] ? smartHtml("", p["p" + n], n, false) : ""}</div>`).join("")}
        ${paceHtml(s, r.id, p, false)}</div>` : '<div class="pldetail"><p class="fine">No goals saved yet.</p></div>';
      else {
        const wr = weekRate(r.id, p), rt = items.length ? rateRoutine(items, p) : null;
        detail = items.length ? `<div class="pldetail">${routineHtml(r.id, p, false)}${wr !== null ? `<p class="fine">Past 7 days, not counting today: ${pct(wr)} of items done.</p>` : ""}
          <p class="fine">Supports their goals: ${rt.score} of 10, ${rt.label}.${rt.miss.length ? " Missing " + esc(rt.miss[0].name) + "." : ""}</p></div>` : '<div class="pldetail"><p class="fine">No routine saved yet.</p></div>';
      }
    }
    return `<li class="plrep"><button class="plrepbtn" data-plopen="${esc(key)}" aria-expanded="${open}">
      <span>${esc(r.name || "Unnamed")}</span>${status}
      <span class="fine">${kind === "goals" && pc && pc.ready ? `D ${t.d} of ${pc.dDay}` : ""}</span><span class="plchev" aria-hidden="true">${open ? "▴" : "▾"}</span></button>${detail}</li>`;
  }).join("");
}
function managerGoals(s) {
  return `<div class="plwrap"><div class="card"><h4>Team goals</h4><p class="fine">Tap a rep to see their 30, 60 and 90 day goals and their daily pace.</p>
    ${st.err ? `<p class="cbalert bad">${esc(st.err)}</p>` : ""}
    <ul class="plreps">${repRows(s, "goals") || '<li class="fine">No reps yet.</li>'}</ul></div></div>`;
}
function managerRoutine(s) {
  const reps = (s.reps || []).filter(r => r.active !== false), day = localDay();
  let withR = 0, full = 0;
  reps.forEach(r => { const items = (st.plans[r.id] && st.plans[r.id].routine) || []; if (items.length) { withR++; const l = dayLog(r.id, day); if (l && doneCount(items, l) >= items.length) full++; } });
  return `<div class="plwrap">
  <div class="card"><h4>Routine report, today</h4>
    <p><b>${withR} ${withR === 1 ? "rep has" : "reps have"} a routine. ${full} finished it today.</b></p>
    <p class="fine">Managers with app notifications on get this report at 8:30 PM.</p>
    <div class="plbtns"><button class="ghost sm" data-plcopy="1">Copy report</button><button class="ghost sm" data-plrefresh="1" ${st.loading ? "disabled" : ""}>${st.loading ? "Refreshing" : "Refresh"}</button></div>
    ${st.at ? `<p class="fine">Updated ${new Date(st.at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}.</p>` : ""}
  </div>
  <div class="card"><h4>Team routines</h4><p class="fine">Tap a rep to see their AM and PM checklist and rating.</p>
    ${st.err ? `<p class="cbalert bad">${esc(st.err)}</p>` : ""}
    <ul class="plreps">${repRows(s, "routine") || '<li class="fine">No reps yet.</li>'}</ul></div></div>`;
}

function contactsPage(s) {
  const mgr = role(s) === "manager";
  const list = st.contacts || [];
  let h = `<div class="plwrap"><div class="card"><h4>Contacts</h4>
    <p class="fine">${mgr ? "Tap Call or Text." : "Tap Call or Text to reach your team."}</p>`;
  if (!isOn(s)) h += `<p class="fine">Sign in with your key to see your team contacts.</p>`;
  else if (st.contacts === null) h += `<p class="fine">Loading.</p>`;
  else if (!list.length) h += `<p class="fine">No contacts yet.${mgr ? " Add them below." : ""}</p>`;
  else h += `<ul class="plcontacts">` + list.map(c => {
    const ph = fmtPhone(c.phone), dial = String(c.phone || "").replace(/\D/g, "");
    return `<li><div><b>${esc(c.name)}</b><span class="fine">${esc(c.role || "")}</span><span>${esc(ph)}</span></div>
      <div class="plcbtns"><a class="primary btnlike sm" href="tel:${dial}">Call</a><a class="ghost btnlike sm" href="sms:${dial}">Text</a></div></li>`;
  }).join("") + `</ul>`;
  h += `</div>`;
  if (mgr && isOn(s)) {
    if (st.editContacts) {
      if (st.cDraft === null) st.cDraft = list.map(c => [c.name, c.role, fmtPhone(c.phone)].join(", ")).join("\n");
      h += `<div class="card"><h4>Edit contacts</h4><p class="fine">One person per line: name, title, phone.</p>
        <textarea data-plcontacts="1" rows="7" maxlength="3000">${esc(st.cDraft)}</textarea>
        <div class="plbtns"><button class="primary" data-plcsave="1">Save contacts</button><button class="ghost" data-plcedit="0">Cancel</button></div>
        ${st.cMsg ? `<p class="fine" role="status">${esc(st.cMsg)}</p>` : ""}</div>`;
    } else h += `<div class="card"><button class="ghost sm" data-plcedit="1">Edit contacts</button>${st.cMsg ? `<p class="fine" role="status">${esc(st.cMsg)}</p>` : ""}</div>`;
  }
  return h + `</div>`;
}

export function render(root, s, a) {
  app = a; lastS = s;
  if (s.view === "contacts") { loadContacts(s); root.innerHTML = contactsPage(s); return; }
  const title = s.view === "routine" ? "Routine" : "Goals";
  load(s);
  if (!isOn(s)) { root.innerHTML = `<div class="card"><h4>${title}</h4><p class="fine">Sign in with your key to use ${title.toLowerCase()}.</p></div>`; return; }
  if (!st.loaded && !st.err) { root.innerHTML = `<div class="card"><h4>${title}</h4><p class="fine">Loading.</p></div>`; return; }
  const mgr = role(s) === "manager";
  root.innerHTML = s.view === "routine" ? (mgr ? managerRoutine(s) : routinePage(s)) : (mgr ? managerGoals(s) : repPage(s));
}

async function save(s) {
  const repId = myRep(s); if (!repId || st.saving) return;
  const d = draftFor(repId);
  const routine = (st.plans[repId] && st.plans[repId].routine) || [];
  const inc = num(d.income), pay = num(d.pay);
  if (inc > 100000 || pay > 5000) { st.msg = inc > 100000 ? "Check your monthly income goal. That number looks too big." : "Check what you make per sale. That number looks too big."; app.render(); return; }
  const plan = { g30: d.g30.trim().slice(0, 600), g60: d.g60.trim().slice(0, 600), g90: d.g90.trim().slice(0, 600), p30: d.p30.trim().slice(0, 600), p60: d.p60.trim().slice(0, 600), p90: d.p90.trim().slice(0, 600), income: num(d.income), pay: num(d.pay), days: Math.min(7, Math.max(1, Math.round(num(d.days)) || 5)), routine };
  st.saving = true; st.msg = ""; app.render();
  try {
    await callRpc("dpc_plan_set", { p_token: token(s), p_rep_id: repId, p_plan: plan });
    st.plans[repId] = Object.assign({ updated_at: new Date().toISOString() }, plan);
    st.draft = null; st.msg = "Saved. Your manager can see your goals.";
  } catch (e) { st.msg = e && e.message ? e.message : "Could not save. Try again."; }
  st.saving = false; app.render();
}
async function saveRoutine(s) {
  const repId = myRep(s); if (!repId || st.saving || !st.rSorted || !st.rSorted.length) return;
  const cur = st.plans[repId] || {}, old = cur.routine || [];
  const routine = st.rSorted.map((it, i) => { const same = old.find(o => o.text === it.text); return { id: same ? same.id : "r" + Date.now().toString(36) + i, text: it.text, part: it.part }; });
  const plan = { g30: cur.g30 || "", g60: cur.g60 || "", g90: cur.g90 || "", p30: cur.p30 || "", p60: cur.p60 || "", p90: cur.p90 || "", income: num(cur.income), pay: num(cur.pay), days: Math.min(7, Math.max(1, Math.round(num(cur.days)) || 5)), routine };
  st.saving = true; app.render();
  try {
    await callRpc("dpc_plan_set", { p_token: token(s), p_rep_id: repId, p_plan: plan });
    st.plans[repId] = Object.assign({ updated_at: new Date().toISOString() }, plan);
    st.rEdit = false; st.rDraft = null; st.rSorted = null; st.rMsg = "Saved. Check it off as you go. Your manager can see it.";
  } catch (e) { st.rMsg = e && e.message ? e.message : "Could not save. Try again."; }
  st.saving = false; app.render();
}
async function check(s, id, on) {
  const repId = myRep(s), plan = st.plans[repId]; if (!repId || !plan) return;
  const day = localDay();
  let l = dayLog(repId, day);
  if (!l) { l = { rep_id: repId, day, done: [], total: plan.routine.length }; st.log.push(l); }
  const set = new Set(l.done || []); on ? set.add(id) : set.delete(id);
  l.done = plan.routine.map(r => r.id).filter(x => set.has(x)); l.total = plan.routine.length;
  app.render();
  try { await callRpc("dpc_routine_set", { p_token: token(s), p_day: day, p_done: l.done, p_total: l.total }); }
  catch (e) { app.flash(e && e.message ? e.message : "Could not save that check. Try again."); }
}
async function saveContacts(s) {
  const rows = String(st.cDraft || "").split(/\r?\n/).map(x => x.split(",").map(y => y.trim())).filter(x => x[0]);
  const list = rows.slice(0, 30).map(x => ({ name: x[0].slice(0, 60), role: (x.length > 2 ? x[1] : "").slice(0, 40), phone: fmtPhone(x[x.length - 1]).slice(0, 20) }));
  try { st.contacts = await callRpc("dpc_contacts_set", { p_token: token(s), p_contacts: list }); st.editContacts = false; st.cDraft = null; st.cMsg = "Contacts saved."; }
  catch (e) { st.cMsg = e && e.message ? e.message : "Could not save. Try again."; }
  app.render();
}

export function init(a) {
  app = a;
  const getState = () => lastS;
  document.addEventListener("input", e => {
    const t = e.target; if (!t || !t.dataset) return;
    if (t.dataset.pl && st.draft) { st.draft[t.dataset.pl] = t.value; if (/^(income|pay|days)$/.test(t.dataset.pl)) app.render();
      else { const box = document.querySelector(`[data-plsmart="${t.dataset.pl}"]`); if (box) box.innerHTML = smartInner(t.value, +box.dataset.days || 30, true); } }
    if (t.dataset.plcontacts) st.cDraft = t.value;
    if (t.dataset.plrtext) { st.rDraft = t.value; if (st.rSorted) { st.rSorted = null; st.rMsg = "Tap Make my checklist to update it."; app.render(); } }
  });
  document.addEventListener("focusin", e => { const t = e.target; if (t && t.dataset && /^(income|pay|days)$/.test(t.dataset.pl || "")) setTimeout(() => { try { t.select(); } catch {} }, 0); });
  document.addEventListener("change", e => {
    const t = e.target; if (!t || !t.dataset) return;
    if (t.dataset.plcheck) check(getState(), t.dataset.plcheck, t.checked);
    if (t.dataset.plrfile && t.files && t.files[0]) {
      const f = t.files[0]; t.value = "";
      st.rBusy = true; st.rMsg = "Reading"; app.render();
      readFile(f, m => { st.rMsg = m; const p = document.querySelector(".plwrap [role=status]"); if (p) p.textContent = m; })
        .then(txt => {
          const all = sortRoutine(String(txt || "").split(/\r?\n/).length > 0 ? txt : "");
          const lines = String(txt || "").split(/\r?\n/).filter(x => x.trim()).length;
          if (!all.length) { st.rMsg = "Could not read any lines from that. Try a clearer photo or type it in."; return; }
          st.rDraft = draftText(all);
          st.rSorted = all;
          st.rMsg = "Read " + all.length + " items from the " + (/^image/.test(f.type || "") ? "photo" : "file") + ". It replaced what was in the box." + (lines > MAX_ITEMS + 4 ? " Only the first " + MAX_ITEMS + " fit." : "") + " Fix any typos in the box, then tap Make my checklist again.";
        })
        .catch(() => { st.rMsg = "Could not read that file. Try a clearer photo or type it in."; })
        .finally(() => { st.rBusy = false; app.render(); });
    }
  });
  document.addEventListener("click", e => {
    const b = e.target.closest && e.target.closest("[data-plsave],[data-plopen],[data-plcopy],[data-plrefresh],[data-plcedit],[data-plcsave],[data-plredit],[data-plrsort],[data-plrmove],[data-plrsave]");
    if (!b) return;
    const s = getState(); if (!s) return;
    if (b.dataset.plsave) save(s);
    else if (b.dataset.plopen) { st.open[b.dataset.plopen] = !st.open[b.dataset.plopen]; app.render(); }
    else if (b.dataset.plrefresh) load(s, true);
    else if (b.dataset.plcopy) {
      const txt = reportText(s);
      (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(() => app.flash("Report copied. Paste it into a text.")).catch(() => { try { window.prompt("Copy the report:", txt); } catch {} });
    }
    else if (b.dataset.plcedit) { st.editContacts = b.dataset.plcedit === "1"; st.cDraft = null; st.cMsg = ""; app.render(); }
    else if (b.dataset.plcsave) saveContacts(s);
    else if (b.dataset.plredit) { st.rEdit = b.dataset.plredit === "1"; st.rDraft = null; st.rSorted = null; st.rMsg = ""; app.render(); }
    else if (b.dataset.plrsort) {
      const el = document.querySelector("[data-plrtext]"); if (el) st.rDraft = el.value;
      st.rSorted = sortRoutine(st.rDraft);
      const n = String(st.rDraft || "").split(/\r?\n/).filter(x => x.trim() && !/^(morning|night|evening|am|pm)\s*:?$/i.test(x.trim())).length;
      st.rMsg = !st.rSorted.length ? "Type at least one thing, one per line." : n > MAX_ITEMS ? "Only the first " + MAX_ITEMS + " items fit." : "";
      app.render();
      setTimeout(() => { const c = document.querySelector(".plsort"); c && c.scrollIntoView({ behavior: "smooth", block: "center" }); }, 50);
    }
    else if (b.dataset.plrmove !== undefined && st.rSorted) { const it = st.rSorted[+b.dataset.plrmove]; if (it) { it.part = it.part === "pm" ? "am" : "pm"; app.render(); } }
    else if (b.dataset.plrsave) saveRoutine(s);
  });
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") { const s = getState(); if (s && (s.view === "goals" || s.view === "routine")) load(s, true); } });
}
