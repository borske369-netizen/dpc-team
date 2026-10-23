/*! Copyright 2026 David Borske. All rights reserved. */
// Your team's pitch and objections.
// The manager sets the team's pitch steps in order and the team's own objection answers.
// Reps study them on the board and check what they actually say against the steps.
// Plain word matching only, not AI. The same words always get the same answer.
// What a rep types stays on the rep's phone. Nothing is recorded.
import { setTeamObjections } from "./objections.js";

const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const LS = {
  get(k) { try { return JSON.parse(localStorage.getItem(k) || "null"); } catch { return null; } },
  set(k, v) { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, JSON.stringify(v)); } catch {} }
};

export const LIMITS = { steps: 8, objections: 20, name: 40, cover: 200, line: 300, listen: 400, say: 120, also: 240, answer: 400, mine: 3000 };

// A starting point the manager can edit. Plain and general so it fits most teams.
export const SAMPLE_STEPS = [
  { name: "Intro", cover: "Who you are, who you are with, and why you are here.", line: "Hi, I am [your name] with [company]. I am here because [your reason].", listen: "my name, name is, i am with, im with, here with, here because, reason i, working with your, your neighbors" },
  { name: "Questions", cover: "Find out what they have now, what they like about it and what they wish was better.", line: "What do you have now? What do you wish was better about it?", listen: "what do you, who do you, how do you, do you have, are you using, how is it, how much do you, how long have you, what would you" },
  { name: "Value", cover: "Tie what you offer to what they just told you.", line: "You said [what they told you]. That is exactly why people switch to us.", listen: "you said, you mentioned, you told me, that means, which means, so you get, you would get, you will get, you get, save you, saves you" },
  { name: "Ask", cover: "Ask for the business. Give them a choice between two yeses.", line: "Let us get you set up. Does Tuesday or Thursday work better?", listen: "get you set up, get you started, lets get you, let us get you, sign you up, set you up, or thursday, or tuesday, which works better, what works better, which day, morning or afternoon, today or tomorrow" }
];

const PH = {
  feel: "I understand how you feel.",
  felt: "A lot of people I talk to felt the same way.",
  found: "What they found was...",
  ret: "Then ask for the business again."
};

let app = null;
let lastS = null;
const ui = { edit: null, editAt: null, msg: "", msgBad: false, mine: null, mineKey: "", result: null, test: "", testResult: null };

function role(s) { return s && s.cloud ? s.cloud.role : ""; }
function isMgr(s) { return !s || !s.cloud || role(s) === "manager"; }
function repKey(s) { return (s && s.cloud && s.cloud.rep_id) || (s && s.activeRep) || "me"; }
const clip = (v, n) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, n);
const clipLines = (v, n) => String(v ?? "").replace(/\r/g, "").replace(/[ \t]+/g, " ").trim().slice(0, n);

export function teamOf(s) {
  const t = s && s.board && s.board.team;
  if (!t || typeof t !== "object") return { steps: [], objections: [], at: null };
  const steps = (Array.isArray(t.steps) ? t.steps : []).slice(0, LIMITS.steps).map(x => ({
    name: clip(x && x.name, LIMITS.name), cover: clip(x && x.cover, LIMITS.cover), line: clip(x && x.line, LIMITS.line), listen: clip(x && x.listen, LIMITS.listen)
  })).filter(x => x.name);
  const objections = (Array.isArray(t.objections) ? t.objections : []).slice(0, LIMITS.objections).map(x => ({
    say: clip(x && x.say, LIMITS.say), also: clip(x && x.also, LIMITS.also), feel: clip(x && x.feel, LIMITS.answer), felt: clip(x && x.felt, LIMITS.answer), found: clip(x && x.found, LIMITS.answer), ret: clip(x && x.ret, LIMITS.answer)
  })).filter(x => x.say && (x.feel || x.felt || x.found));
  return { steps, objections, at: t.at || null };
}

// ---------- Plain matching ----------
const clean = t => String(t || "").toLowerCase().replace(/[\u2018\u2019'`]/g, "").replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
const toks = t => { const c = clean(t); return c ? c.split(" ") : []; };
const STOP = new Set(("a an and are as at be been but by can could did do does for from get got had has have he her here hers him his how i if im in into is it its ive just let lets me my no not of on or our ours out she so than that thats the their theirs them then there these they this those to too up us very was we were what when where which who why will with would you your youre yours yes really okay ok well about also like just").split(" "));
const QSTART = new Set("who what when where why how which do does did are is have has can could would will any".split(" "));

function wordHit(w, t) { return t === w || (w.length >= 4 && t.length > w.length && t.length - w.length <= 4 && t.startsWith(w)); }
function phraseIn(p, tk) {
  for (let i = 0; i + p.length <= tk.length; i++) {
    let ok = true;
    for (let j = 0; j < p.length; j++) if (!wordHit(p[j], tk[i + j])) { ok = false; break; }
    if (ok) return tk.slice(i, i + p.length).join(" ");
  }
  return "";
}
function sentences(text) {
  const parts = String(text || "").replace(/\r/g, "").replace(/([.!?])(\s+|$)/g, "$1\n").split(/\n+/).map(x => x.trim()).filter(Boolean);
  return parts.map(raw => {
    const tk = toks(raw);
    return { raw, tk, q: /\?\s*["')\]]*\s*$/.test(raw) || (tk.length > 2 && QSTART.has(tk[0]) && tk.includes("you")) };
  }).filter(x => x.tk.length);
}
export function listenOf(st) {
  const raw = String(st && st.listen || "").split(/[,;\n]+/).map(x => x.trim()).filter(Boolean);
  const ph = []; let q = false;
  for (const r of raw) { if (r === "?") { q = true; continue; } const w = toks(r); if (w.length) ph.push(w); }
  if (ph.length || q) return { ph, q, auto: false };
  const src = String(((st && st.line) || "") + " " + ((st && st.cover) || "") + " " + ((st && st.name) || "")).replace(/\[[^\]]*\]/g, " ");
  const seen = new Set();
  for (const w of toks(src)) if (w.length >= 4 && !STOP.has(w) && !seen.has(w)) { seen.add(w); ph.push([w]); if (ph.length >= 8) break; }
  return { ph, q: false, auto: true };
}

// Same steps and the same words always give the same answer.
export function checkPitch(steps, text) {
  const ss = sentences(text);
  const words = ss.reduce((n, x) => n + x.tk.length, 0);
  const res = steps.map((st, i) => {
    const L = listenOf(st); let at = -1, heard = "";
    for (let j = 0; j < ss.length && at < 0; j++) {
      for (const p of L.ph) { const h = phraseIn(p, ss[j].tk); if (h) { at = j; heard = h; break; } }
      if (at < 0 && L.q && ss[j].q) { at = j; heard = "a question"; }
    }
    return { i, name: st.name, at, heard, auto: L.auto, late: null };
  });
  const hit = res.filter(r => r.at >= 0);
  let order = null;
  for (let a = 0; a < hit.length && !order; a++) for (let b = a + 1; b < hit.length; b++) if (hit[b].at < hit[a].at) { order = { first: hit[a], jumped: hit[b] }; break; }
  if (order) order.jumped.late = order.first.name;
  const covered = hit.length;
  const miss = res.find(r => r.at < 0);
  let fix;
  if (words < 8) fix = { kind: "short", title: "Type your whole pitch.", body: "Start to finish, the way you really say it. Then check it." };
  else if (miss && (!order || miss.i < order.first.i)) { const st = steps[miss.i]; fix = { kind: "missing", step: miss.i, title: `Add ${st.name}.`, body: st.cover, line: st.line }; }
  else if (order) { const st = steps[order.first.i]; fix = { kind: "order", step: order.first.i, title: `Keep the order: ${order.first.name}, then ${order.jumped.name}.`, body: `You got to ${order.jumped.name} before ${order.first.name}. Same order every time.`, line: st.line }; }
  else fix = { kind: "ok", title: "Every step is there, in order.", body: "Now say it out loud until it sounds like you, not a script." };
  return { steps: res, covered, total: steps.length, order: !!order, fix, words };
}

// ---------- Board search: the team's own objection answers ----------
function syncObjections(s) {
  const t = teamOf(s);
  try { setTeamObjections(t.objections); } catch (e) { console.warn(e); }
}

// ---------- HTML ----------
function resultHtml(r) {
  if (!r) return "";
  const rows = r.steps.map(x => {
    if (x.at < 0) return `<li class="tp-row tp-miss"><span class="tp-k">Skipped</span> <b>${esc(x.name)}</b></li>`;
    if (x.late) return `<li class="tp-row tp-late"><span class="tp-k">Out of order</span> <b>${esc(x.name)}</b> <span class="fine">came before ${esc(x.late)}</span></li>`;
    return `<li class="tp-row tp-ok"><span class="tp-k">Covered</span> <b>${esc(x.name)}</b> <span class="fine">heard "${esc(x.heard)}"</span></li>`;
  }).join("");
  const f = r.fix;
  const state = r.order ? " Out of order." : r.covered === r.total ? " In order." : "";
  return `<div class="tp-res">
    <p class="tp-score"><b>${r.covered} of ${r.total} steps covered.</b>${state}</p>
    <ul class="tp-list">${rows}</ul>
    <div class="tp-fix${f.kind === "ok" ? " good" : ""}">
      <p class="tp-fixk">One fix</p>
      <p><b>${esc(f.title)}</b> ${esc(f.body || "")}</p>
      ${f.line ? `<p class="fine">Your team says it like: "${esc(f.line)}"</p>` : ""}
    </div>
  </div>`;
}

function stepsList(steps) {
  return `<ol class="pbl">${steps.map(st => `<li><b>${esc(st.name)}</b>${st.cover ? `<p>${esc(st.cover)}</p>` : ""}${st.line ? `<p class="fine">Say it like: "${esc(st.line)}"</p>` : ""}</li>`).join("")}</ol>`;
}

function objectionsList(list) {
  return list.map(o => `<div class="tp-o">
      <p class="tp-say">"${esc(o.say)}"</p>
      ${o.feel ? `<p class="obj-step"><span class="obj-k">Feel</span> ${esc(o.feel)}</p>` : ""}
      ${o.felt ? `<p class="obj-step"><span class="obj-k">Felt</span> ${esc(o.felt)}</p>` : ""}
      ${o.found ? `<p class="obj-step"><span class="obj-k">Found</span> ${esc(o.found)}</p>` : ""}
      <p class="obj-step"><span class="obj-k">Return</span> ${esc(o.ret || PH.ret)}</p>
    </div>`).join("");
}

function mineFor(s) {
  const k = "dpc.tpmine." + repKey(s);
  if (ui.mineKey !== k) { ui.mineKey = k; ui.mine = String(LS.get(k) || ""); ui.result = null; }
  return ui.mine;
}

function repHtml(s, t) {
  let h = "";
  if (t.steps.length) {
    const mine = mineFor(s);
    h += `<details class="card playbook tp" id="tp-pitch">
    <summary><b>Your team's pitch</b> <span class="fine">Tap to open</span></summary>
    <p>Your manager set these steps. Same order every time. A pitch falls apart where a step gets skipped.</p>
    ${stepsList(t.steps)}
    <h4 class="pbh">Check your pitch</h4>
    <p class="fine">Type what you actually say, start to finish. It checks your words against your team's steps. Plain matching, not AI, same answer every time. What you type stays on this phone.</p>
    <label class="pllab">What I say<textarea data-tpm="1" rows="${rowsFor(mine, 6)}" maxlength="${LIMITS.mine}" placeholder="Hi, I am...">${esc(mine)}</textarea></label>
    <button type="button" class="primary" data-tp="check">Check my pitch</button>
    <div class="tp-out" role="status" aria-live="polite">${resultHtml(ui.result)}</div>
  </details>`;
  }
  if (t.objections.length) {
    h += `<details class="card playbook tp" id="tp-objs">
    <summary><b>Your team's objections</b> <span class="fine">Tap to open</span></summary>
    <p>Study these before your next conversation. Most of your answer is Feel and Felt. Keep Found short, then go back to the ask.</p>
    ${objectionsList(t.objections)}
    <p class="fine">Type one of these into the board search and it answers with your team's lines.</p>
  </details>`;
  }
  return h;
}

function blankStep() { return { name: "", cover: "", line: "", listen: "" }; }
function blankObj() { return { say: "", also: "", feel: "", felt: "", found: "", ret: "" }; }
const clone = x => JSON.parse(JSON.stringify(x));
const rowsFor = (v, min) => Math.max(min, Math.min(8, Math.ceil(String(v || "").length / 32) + 1));

function editFor(s) {
  const t = teamOf(s);
  if (!ui.edit || ui.editAt !== (t.at || "none")) {
    const d = LS.get("dpc.tpedit");
    ui.edit = d && d.base === (t.at || "none") && d.edit ? d.edit : { steps: clone(t.steps), objections: clone(t.objections) };
    ui.editAt = t.at || "none";
  }
  return ui.edit;
}
function dirty(s) {
  const t = teamOf(s), e = ui.edit;
  if (!e) return false;
  return JSON.stringify({ steps: e.steps, objections: e.objections }) !== JSON.stringify({ steps: t.steps, objections: t.objections });
}
function keepDraft() { LS.set("dpc.tpedit", { base: ui.editAt, edit: ui.edit }); }

function stepEditor(st, i, n) {
  const f = (k, label, max, rows, hint) => `<label class="pllab">${label}${hint ? ` <span class="fine">${hint}</span>` : ""}${rows ? `<textarea data-tpe="s:${i}:${k}" rows="${rowsFor(st[k], rows)}" maxlength="${max}">${esc(st[k])}</textarea>` : `<input data-tpe="s:${i}:${k}" maxlength="${max}" value="${esc(st[k])}">`}</label>`;
  return `<div class="tp-ed">
    <div class="tp-edh"><b>Step ${i + 1}</b><span class="tp-edb">
      <button type="button" class="ghost sm" data-tp="up" data-i="${i}" ${i === 0 ? "disabled" : ""} aria-label="Move step ${i + 1} up">Up</button>
      <button type="button" class="ghost sm" data-tp="down" data-i="${i}" ${i === n - 1 ? "disabled" : ""} aria-label="Move step ${i + 1} down">Down</button>
      <button type="button" class="ghost sm" data-tp="delstep" data-i="${i}" aria-label="Remove step ${i + 1}">Remove</button></span></div>
    ${f("name", "Step name", LIMITS.name, 0, "")}
    ${f("cover", "What to cover", LIMITS.cover, 2, "")}
    ${f("line", "Sample line", LIMITS.line, 2, "")}
    ${f("listen", "Words that show this step happened", LIMITS.listen, 2, "Separate with commas. Type ? to count any question. Left empty, it uses words from the sample line.")}
  </div>`;
}
function objEditor(o, j) {
  const f = (k, label, max, rows, ph, hint) => `<label class="pllab">${label}${hint ? ` <span class="fine">${hint}</span>` : ""}${rows ? `<textarea data-tpe="o:${j}:${k}" rows="${rowsFor(o[k], rows)}" maxlength="${max}" placeholder="${esc(ph)}">${esc(o[k])}</textarea>` : `<input data-tpe="o:${j}:${k}" maxlength="${max}" placeholder="${esc(ph)}" value="${esc(o[k])}">`}</label>`;
  return `<div class="tp-ed">
    <div class="tp-edh"><b>Objection ${j + 1}</b><span class="tp-edb"><button type="button" class="ghost sm" data-tp="delobj" data-i="${j}" aria-label="Remove objection ${j + 1}">Remove</button></span></div>
    ${f("say", "What the customer says", LIMITS.say, 0, "We need to think about it", "")}
    ${f("also", "Other ways they say it", LIMITS.also, 0, "let me think about it, we will think it over", "Optional. Separate with commas.")}
    ${f("feel", "Feel", LIMITS.answer, 2, PH.feel, "")}
    ${f("felt", "Felt", LIMITS.answer, 2, PH.felt, "")}
    ${f("found", "Found", LIMITS.answer, 2, PH.found, "")}
    ${f("ret", "Back to the ask", LIMITS.answer, 2, PH.ret, "")}
  </div>`;
}

function mgrHtml(s, t) {
  const e = editFor(s);
  const parts = [];
  if (t.steps.length) parts.push(`${t.steps.length} pitch step${t.steps.length === 1 ? "" : "s"}`);
  if (t.objections.length) parts.push(`${t.objections.length} objection${t.objections.length === 1 ? "" : "s"}`);
  const status = parts.length ? parts.join(", ") : "Not set yet";
  const d = dirty(s);
  const testSteps = e.steps.filter(x => clip(x.name, LIMITS.name));
  return `<details class="card playbook tp" id="tp-mgr">
    <summary><b>Your team's pitch and objections</b> <span class="fine">${esc(status)}. Tap to open</span></summary>
    <p>Most of this board works for any team. Your pitch and your objections are yours. Set them here once and every phone on your team gets them on the board, new hires on day one.</p>
    <h4 class="pbh">Your pitch, in order</h4>
    <p class="fine">List the steps your reps should hit, in order. For each step, add the words that show it happened. When a rep checks a pitch, the app looks for those words, step by step. Plain matching, not AI, same answer every time.</p>
    ${e.steps.length ? e.steps.map((st, i) => stepEditor(st, i, e.steps.length)).join("") : `<button type="button" class="ghost" data-tp="sample">Start from a sample: Intro, Questions, Value, Ask</button>`}
    ${e.steps.length < LIMITS.steps ? `<button type="button" class="ghost" data-tp="addstep">Add a step</button>` : ""}
    <h4 class="pbh">Your objections</h4>
    <p class="fine">Add what customers say about your product and how your team answers it with Feel, Felt, Found. Reps study these on the board. When a rep types one into the board search, it answers with your lines.</p>
    ${e.objections.map((o, j) => objEditor(o, j)).join("")}
    ${e.objections.length < LIMITS.objections ? `<button type="button" class="ghost" data-tp="addobj">Add an objection</button>` : ""}
    <div class="tp-save">
      <button type="button" class="primary" data-tp="save" ${d ? "" : "disabled"}>Save for my team</button>
      ${d ? `<button type="button" class="ghost" data-tp="discard">Undo changes</button>` : ""}
    </div>
    <p class="fine tp-msg${ui.msgBad ? " bad" : ""}" role="status" aria-live="polite">${esc(ui.msg)}</p>
    ${testSteps.length ? `<h4 class="pbh">Try the check</h4>
    <p class="fine">Type a pitch the way a rep would say it and see what your reps will see.</p>
    <label class="pllab">What a rep says<textarea data-tpt="1" rows="5" maxlength="${LIMITS.mine}" placeholder="Hi, I am...">${esc(ui.test)}</textarea></label>
    <button type="button" class="ghost" data-tp="try">Check this pitch</button>
    <div class="tp-out" role="status" aria-live="polite">${resultHtml(ui.testResult)}</div>` : ""}
  </details>`;
}

// Called by the board while it draws. Returns the cards for this phone.
export function boardHtml(s) {
  lastS = s;
  syncObjections(s);
  const t = teamOf(s);
  try { return isMgr(s) ? mgrHtml(s, t) : repHtml(s, t); } catch (e) { console.warn(e); return ""; }
}

// ---------- Saving ----------
function validate(e) {
  const steps = [], objections = [];
  for (let i = 0; i < e.steps.length; i++) {
    const x = e.steps[i];
    const st = { name: clip(x.name, LIMITS.name), cover: clip(x.cover, LIMITS.cover), line: clip(x.line, LIMITS.line), listen: clip(x.listen, LIMITS.listen) };
    if (!st.name && !st.cover && !st.line && !st.listen) continue;
    if (!st.name) return { err: `Give step ${i + 1} a name.` };
    if (!listenOf(st).ph.length && !listenOf(st).q) return { err: `Step ${i + 1} needs a sample line or words that show it happened.` };
    steps.push(st);
  }
  for (let j = 0; j < e.objections.length; j++) {
    const x = e.objections[j];
    const o = { say: clip(x.say, LIMITS.say), also: clip(x.also, LIMITS.also), feel: clip(x.feel, LIMITS.answer), felt: clip(x.felt, LIMITS.answer), found: clip(x.found, LIMITS.answer), ret: clip(x.ret, LIMITS.answer) };
    if (!o.say && !o.also && !o.feel && !o.felt && !o.found && !o.ret) continue;
    if (!o.say) return { err: `Objection ${j + 1} needs what the customer says.` };
    if (!o.feel && !o.felt && !o.found) return { err: `Objection ${j + 1} needs at least one line: Feel, Felt or Found.` };
    objections.push(o);
  }
  return { steps, objections };
}

function save() {
  const s = lastS; if (!s || !isMgr(s) || !ui.edit) return;
  const v = validate(ui.edit);
  if (v.err) { ui.msg = v.err; ui.msgBad = true; app && app.render(); return; }
  const at = new Date().toISOString();
  const team = v.steps.length || v.objections.length ? { v: 1, steps: v.steps, objections: v.objections, at } : null;
  app.commit(x => { x.board = Object.assign({}, x.board && typeof x.board === "object" ? x.board : {}, { team }); });
  LS.set("dpc.tpedit", null);
  ui.edit = null; ui.editAt = null; ui.msgBad = false;
  ui.msg = team ? "Saved. Every phone on your team gets it on its next sync." : "Removed. Your reps will no longer see a team pitch.";
  app.flash(team ? "Saved for your team." : "Team pitch removed.");
  app.render();
}

// ---------- Events ----------
function settle(root) { (root || document).querySelectorAll("[data-tpe],[data-tpm],[data-tpt]").forEach(el => { el.defaultValue = el.value; }); }

function onInput(ev) {
  const el = ev.target; if (!el || !el.dataset) return;
  if (el.dataset.tpe) {
    const [kind, i, k] = el.dataset.tpe.split(":"); const e = ui.edit; if (!e) return;
    const list = kind === "s" ? e.steps : e.objections; const it = list[+i]; if (!it) return;
    it[k] = el.value; keepDraft();
    const sv = document.querySelector('[data-tp="save"]'); if (sv) sv.disabled = !dirty(lastS);
    return;
  }
  if (el.dataset.tpm) { ui.mine = el.value; LS.set(ui.mineKey || ("dpc.tpmine." + repKey(lastS)), el.value); return; }
  if (el.dataset.tpt) { ui.test = el.value; }
}

function onClick(ev) {
  const b = ev.target && ev.target.closest && ev.target.closest("[data-tp]"); if (!b || b.disabled) return;
  const act = b.dataset.tp, i = +b.dataset.i, s = lastS; if (!s) return;
  ev.preventDefault();
  settle(document.getElementById("root"));
  const t = teamOf(s);
  if (act === "check") {
    const box = document.querySelector("[data-tpm]"); if (box) ui.mine = box.value;
    LS.set(ui.mineKey || ("dpc.tpmine." + repKey(s)), ui.mine);
    ui.result = checkPitch(t.steps, ui.mine);
    app.render(); return;
  }
  if (!isMgr(s)) return;
  const e = editFor(s);
  if (act === "try") { const box = document.querySelector("[data-tpt]"); if (box) ui.test = box.value; ui.testResult = checkPitch(e.steps.filter(x => clip(x.name, LIMITS.name)), ui.test); app.render(); return; }
  if (act === "save") { save(); return; }
  if (act === "discard") { LS.set("dpc.tpedit", null); ui.edit = null; ui.editAt = null; ui.msg = ""; ui.msgBad = false; app.render(); return; }
  if (act === "sample") e.steps = clone(SAMPLE_STEPS);
  else if (act === "addstep" && e.steps.length < LIMITS.steps) e.steps.push(blankStep());
  else if (act === "delstep") e.steps.splice(i, 1);
  else if (act === "up" && i > 0) [e.steps[i - 1], e.steps[i]] = [e.steps[i], e.steps[i - 1]];
  else if (act === "down" && i < e.steps.length - 1) [e.steps[i + 1], e.steps[i]] = [e.steps[i], e.steps[i + 1]];
  else if (act === "addobj" && e.objections.length < LIMITS.objections) e.objections.push(blankObj());
  else if (act === "delobj") e.objections.splice(i, 1);
  else return;
  ui.msg = ""; ui.msgBad = false; ui.testResult = null;
  keepDraft(); app.render();
}

let bound = false;
export function init(a) {
  app = a;
  if (bound || typeof document === "undefined") return;
  bound = true;
  document.addEventListener("input", onInput);
  document.addEventListener("click", onClick);
}
