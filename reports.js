/* Reports. Built from what is on this phone, no server.

   Three reports:
     rep day      what a rep sends at the end of the day, with their numbers link
     team day     the manager's daily read on the team
     team week    the weekly report, current week so far or the last full week

   Each report comes back as { title, text, html } so it can be texted,
   emailed, copied or printed to PDF from the same source. */

import {
  today, weekStart, weekLabel, repTotals, weekTotals, rates, flagState,
  teamTotals, weakestStage, sumEntries, fmtPct, fmtNum, fmt1, num, FLAG_RULE,
  MIN_DOORS_FOR_DIAGNOSIS,
} from "./model.js";
import { subjectLabel } from "./control.js";

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const dayName = (d) => new Date(d + "T12:00:00").toLocaleDateString("en-US",
  { weekday: "long", month: "short", day: "numeric" });

/* Text reports never print a dash for a missing rate. */
const pctT = (v) => (v === null || v === undefined || !isFinite(v) ? "none yet" : fmtPct(v));

const plural = (n, one, many) => n + " " + (n === 1 ? one : many || one + "s");

function addDays(iso, n) {
  const d = new Date(iso + "T12:00:00");
  d.setDate(d.getDate() + n);
  const t = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return t.toISOString().slice(0, 10);
}

function entriesBetween(state, repId, from, to) {
  return (state.entries[repId] || []).filter((e) => e.date >= from && e.date <= to);
}

function flagsBetween(state, repId, from, to) {
  const log = (state.control && Array.isArray(state.control.log)) ? state.control.log : [];
  return log.filter((e) => e.v === "nocontrol" && e.rep === repId && e.day >= from && e.day <= to);
}

function topSubject(flags) {
  if (!flags.length) return null;
  const by = {};
  flags.forEach((f) => { const k = f.subject || "other"; by[k] = (by[k] || 0) + 1; });
  const k = Object.keys(by).sort((a, b) => by[b] - by[a])[0];
  return { label: subjectLabel(k), n: by[k] };
}

/* ---------- rep, end of day ---------- */

export function repDayReport(state, repId, date) {
  const d = date || today();
  const rep = state.reps.find((r) => r.id === repId);
  if (!rep) return null;
  const t = sumEntries(entriesBetween(state, repId, d, d));
  const r = rates(t);
  const wk = weekTotals(state, repId)[weekStart(d)] || { sale: 0 };
  const flag = flagState(state, repId);
  const note = ((state.entries[repId] || []).find((e) => e.date === d) || {}).note || "";
  const flags = flagsBetween(state, repId, d, d);
  const need = Math.max(0, FLAG_RULE.minSales - wk.sale);

  const lines = [
    (rep.name || "Rep") + ", " + dayName(d),
    plural(t.d, "door") + ", " + plural(t.p, "presentation") + ", " + plural(t.c, "ask") + ", " + plural(t.sale, "sale"),
    "Ask rate " + pctT(r.pToC) + ". Ask to sale " + pctT(r.cToSale) + ".",
    "Week so far: " + wk.sale + " of " + FLAG_RULE.minSales + " sales" + (need ? ", " + need + " to go." : ", week is clear."),
    "Standing: " + (flag.flagged ? "Flagged" : flag.atRisk ? "At risk" : "Meeting the standard") + ".",
  ];
  if (flags.length) lines.push("Focus flags today: " + flags.length + (topSubject(flags) ? ", mostly " + topSubject(flags).label.toLowerCase() : "") + ".");
  if (note) lines.push("Note: " + note);

  return { title: (rep.name || "Rep") + " day report", text: lines.join("\n"), html: "" };
}

/* ---------- team ---------- */

function repBlock(state, rp, from, to) {
  const t = sumEntries(entriesBetween(state, rp.id, from, to));
  const r = rates(t);
  const f = flagState(state, rp.id);
  const flags = flagsBetween(state, rp.id, from, to);
  return { rep: rp, t, r, f, flags, top: topSubject(flags) };
}

export function teamReport(state, kind, ref) {
  const refDay = ref || today();
  let from, to, title, span;
  if (kind === "day") {
    from = to = refDay;
    title = "Team report, " + dayName(refDay);
    span = "today";
  } else if (kind === "lastweek") {
    from = addDays(weekStart(refDay), -7);
    to = addDays(from, 6);
    title = "Weekly report, " + weekLabel(from);
    span = "last week";
  } else {
    from = weekStart(refDay);
    to = refDay;
    title = "Week so far, " + weekLabel(from);
    span = "this week";
  }

  const reps = state.reps.filter((r) => r.active !== false);
  const rows = reps.map((rp) => repBlock(state, rp, from, to));
  const T = rows.reduce((a, x) => ({ d: a.d + x.t.d, p: a.p + x.t.p, c: a.c + x.t.c, sale: a.sale + x.t.sale }), { d: 0, p: 0, c: 0, sale: 0 });
  const TR = rates({ ...T, days: 1 });

  const worked = rows.filter((x) => x.t.d + x.t.p + x.t.c + x.t.sale > 0);
  const silent = rows.filter((x) => x.t.d + x.t.p + x.t.c + x.t.sale === 0);
  const bySales = worked.slice().sort((a, b) => b.t.sale - a.t.sale || b.r.pToC - a.r.pToC);
  const top = bySales[0] && bySales[0].t.sale > 0 ? bySales[0] : null;
  const flagged = rows.filter((x) => x.f.flagged);
  const atRisk = rows.filter((x) => x.f.atRisk);
  const lowAsk = worked.filter((x) => x.t.p >= 5 && x.r.pToC !== null && x.r.pToC < 0.5);
  const fixated = rows.filter((x) => x.top && x.top.n >= 3);

  /* Weekly standard, only meaningful for week reports. */
  const hit = kind === "day" ? [] : rows.filter((x) => x.t.sale >= FLAG_RULE.minSales);
  const miss = kind === "day" ? [] : rows.filter((x) => x.t.sale < FLAG_RULE.minSales);

  const med = weakestStage(teamTotals(state).per);

  const rec = state.recruit && state.recruit.live ? state.recruit : null;

  /* ---- headline items, in order of what needs action ---- */
  const actions = [];
  if (flagged.length) actions.push("Flagged: " + flagged.map((x) => x.rep.name || "Unnamed").join(", ") + ". Under " + FLAG_RULE.minSales + " sales " + FLAG_RULE.weeks + " weeks running.");
  if (atRisk.length) actions.push("At risk this week: " + atRisk.map((x) => (x.rep.name || "Unnamed") + " (needs " + x.f.needThisWeek + ")").join(", ") + ".");
  if (fixated.length) actions.push("Same focus flag 3 or more times: " + fixated.map((x) => (x.rep.name || "Unnamed") + ", " + x.top.label.toLowerCase()).join("; ") + ".");
  if (lowAsk.length) actions.push("Presenting but not asking (under 50% ask rate): " + lowAsk.map((x) => (x.rep.name || "Unnamed") + " " + pctT(x.r.pToC)).join(", ") + ".");
  if (silent.length && kind === "day") actions.push("No numbers in yet: " + silent.map((x) => x.rep.name || "Unnamed").join(", ") + ".");
  if (silent.length && kind !== "day") actions.push("Nothing logged " + span + ": " + silent.map((x) => x.rep.name || "Unnamed").join(", ") + ".");

  /* ---- text version, for a text message or email ---- */
  const L = [];
  L.push(title);
  L.push("");
  L.push("Team: " + plural(T.d, "door") + ", " + plural(T.p, "presentation") + ", " + plural(T.c, "ask") + ", " + plural(T.sale, "sale") + ".");
  L.push("Door to presentation " + pctT(TR.dToP) + ", ask rate " + pctT(TR.pToC) + ", ask to sale " + pctT(TR.cToSale) + (TR.doorsPerSale ? ", " + fmt1(TR.doorsPerSale) + " doors per sale" : "") + ".");
  L.push(worked.length + " of " + rows.length + " reps logged " + span + ".");
  if (top) L.push("Top: " + (top.rep.name || "Unnamed") + " with " + plural(top.t.sale, "sale") + ".");
  if (kind !== "day") L.push("Hit the standard of " + FLAG_RULE.minSales + ": " + (hit.length ? hit.map((x) => x.rep.name || "Unnamed").join(", ") : "nobody yet") + ".");
  if (actions.length) { L.push(""); L.push("Needs attention"); actions.forEach((a) => L.push("- " + a)); }
  L.push("");
  L.push("By rep (doors / pres / asks / sales)");
  rows.slice().sort((a, b) => b.t.sale - a.t.sale).forEach((x) => {
    L.push((x.rep.name || "Unnamed") + ": " + x.t.d + " / " + x.t.p + " / " + x.t.c + " / " + x.t.sale +
      (x.f.flagged ? "  FLAGGED" : x.f.atRisk ? "  at risk" : ""));
  });
  if (rec) {
    L.push("");
    L.push("Recruiting: " + (rec.seatsTotal ? rec.seatsHeld + " of " + rec.seatsTotal + " seats held, " : "") + plural(rec.waiting || 0, "person", "people") + " waiting.");
  }

  /* ---- html version, for the screen and for printing to PDF ---- */
  const kpi = (l, v) => `<div class="rp-kpi"><div class="rp-kv">${v}</div><div class="rp-kl">${l}</div></div>`;
  const html = `
  <article class="report" id="report">
    <header class="rp-head">
      <div>
        <p class="rp-kicker">DPC Field Tracker</p>
        <h2 class="rp-title">${esc(title)}</h2>
        <p class="rp-sub">${worked.length} of ${rows.length} reps logged ${span}. Generated ${new Date().toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}.</p>
      </div>
    </header>
    <div class="rp-kpis">
      ${kpi("Doors", fmtNum(T.d))}
      ${kpi("Presentations", fmtNum(T.p))}
      ${kpi("Asks", fmtNum(T.c))}
      ${kpi("Sales", fmtNum(T.sale))}
      ${kpi("Ask rate", fmtPct(TR.pToC))}
      ${kpi("Doors per sale", fmt1(TR.doorsPerSale))}
    </div>
    ${actions.length ? `<section class="rp-sec"><h3>Needs attention</h3><ul class="rp-list">${actions.map((a) => `<li>${esc(a)}</li>`).join("")}</ul></section>`
      : `<section class="rp-sec"><h3>Needs attention</h3><p class="rp-ok">Nothing flagged ${span}.</p></section>`}
    ${top ? `<section class="rp-sec"><h3>Top performer</h3><p>${esc(top.rep.name || "Unnamed")}: ${plural(top.t.sale, "sale")} from ${plural(top.t.d, "door")}, ask rate ${fmtPct(top.r.pToC)}.</p></section>` : ""}
    <section class="rp-sec">
      <h3>By rep</h3>
      <div class="scroll"><table class="rp-table">
        <thead><tr><th>Rep</th><th class="num">Doors</th><th class="num">Pres</th><th class="num">Asks</th><th class="num">Sales</th><th class="num">Ask rate</th><th class="num">Ask to sale</th><th>Standing</th><th class="num">Focus flags</th></tr></thead>
        <tbody>${rows.slice().sort((a, b) => b.t.sale - a.t.sale).map((x) => `<tr>
          <td>${esc(x.rep.name || "Unnamed")}</td>
          <td class="num">${x.t.d}</td><td class="num">${x.t.p}</td><td class="num">${x.t.c}</td><td class="num"><b>${x.t.sale}</b></td>
          <td class="num">${fmtPct(x.r.pToC)}</td><td class="num">${fmtPct(x.r.cToSale)}</td>
          <td>${x.f.flagged ? '<span class="pill bad">Flagged</span>' : x.f.atRisk ? '<span class="pill warn">At risk</span>' : '<span class="pill good">Clear</span>'}</td>
          <td class="num">${x.flags.length || ""}</td></tr>`).join("")}</tbody>
        <tfoot><tr><td>Team</td><td class="num">${T.d}</td><td class="num">${T.p}</td><td class="num">${T.c}</td><td class="num"><b>${T.sale}</b></td><td class="num">${fmtPct(TR.pToC)}</td><td class="num">${fmtPct(TR.cToSale)}</td><td></td><td></td></tr></tfoot>
      </table></div>
    </section>
    ${kind !== "day" ? `<section class="rp-sec"><h3>Against the standard</h3>
      <p>${hit.length} hit ${FLAG_RULE.minSales} sales ${span}${hit.length ? ": " + esc(hit.map((x) => x.rep.name || "Unnamed").join(", ")) : ""}.
      ${miss.length} under${miss.length ? ": " + esc(miss.map((x) => (x.rep.name || "Unnamed") + " " + x.t.sale).join(", ")) : ""}.</p>
      ${kind === "week" ? `<p class="rp-fine">The week is still in progress. It never flags anyone until it ends.</p>` : ""}</section>` : ""}
    ${med ? `<section class="rp-sec"><h3>Team medians</h3><p>Door to presentation ${fmtPct(med.dToP)}, ask rate ${fmtPct(med.pToC)}, ask to sale ${fmtPct(med.cToSale)}, across ${med.n} reps with ${MIN_DOORS_FOR_DIAGNOSIS}+ doors.</p></section>` : ""}
    ${rec ? `<section class="rp-sec"><h3>Recruiting</h3><p>${rec.seatsTotal ? rec.seatsHeld + " of " + rec.seatsTotal + " seats held. " : ""}${plural(rec.waiting || 0, "person", "people")} waiting on a seat.</p></section>` : ""}
    <p class="rp-fine">Built from the numbers on this phone. Reps who have not sent their numbers yet show as zero. &copy; 2026 David Borske.</p>
  </article>`;

  return { title, text: L.join("\n"), html, from, to, kind };
}

/* ---------- when a report is due ----------
   No server can push, so the app raises the report itself the first time the
   manager opens it after the report is due: the daily one after 7pm, the
   weekly one on the first open of a new week. */
export function dueReport(state) {
  if (state.role === "rep" || !state.reps.length) return null;
  const seen = state.reportSeen || {};
  const t = today();
  const ws = weekStart(t);
  const lastWs = weekStart(addDays(ws, -1));
  const hasLastWeek = state.reps.some((r) => entriesBetween(state, r.id, lastWs, addDays(lastWs, 6)).length);
  if (hasLastWeek && seen.week !== lastWs) return { kind: "lastweek", key: lastWs, label: "Last week's report is ready" };
  if (new Date().getHours() >= 19 && seen.day !== t) return { kind: "day", key: t, label: "Today's team report is ready" };
  return null;
}

/* ---------- rep reminder ----------
   After 6pm, if the rep logged today and has not sent their numbers. */
export function repSendDue(state, repId) {
  if (!repId) return false;
  const t = today();
  const e = (state.entries[repId] || []).find((x) => x.date === t);
  if (!e || num(e.d) + num(e.p) + num(e.c) + num(e.sale) === 0) return false;
  if (state.sentDay && state.sentDay[repId] === t) return false;
  return new Date().getHours() >= 18;
}
