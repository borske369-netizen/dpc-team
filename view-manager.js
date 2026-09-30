/* Manager view. David's side.

   This answers, in order: who is flagged, what is the team actually doing, and
   where in the funnel each person is losing it. The funnel diagnosis is the
   reason the app exists, so it gets the most room. */

import {
  teamTotals, weakestStage, flagState, weekTotals, weekSpan, weekLabel,
  isCurrentWeek, rates, repTotals, fmtPct, fmtNum, fmt1, num, newRep,
  FLAG_RULE, today, weekStart, repFirstWeek, MIN_DOORS_FOR_DIAGNOSIS,
} from "./model.js";
import { esc } from "./view-rep.js";
import { subjectLabel } from "./control.js";
import { teamReport, dueReport } from "./reports.js";

/* Which report is open. Screen state only. */
export const mgrUI = { report: null };

export function renderManager(el, state, api) {
  const T = teamTotals(state);
  const med = weakestStage(T.per);

  const due = dueReport(state);
  const open = mgrUI.report ? teamReport(state, mgrUI.report) : null;
  el.innerHTML = `
  <div class="mgr">
    ${open ? reportPanel(open, state) : ""}
    ${!open && due ? `<button class="duebar" data-report="${due.kind}" data-duekey="${due.key}">
      <span class="duedot" aria-hidden="true"></span><span>${esc(due.label)}</span><span class="duego">Open</span></button>` : ""}
    ${T.flagged.length || T.atRisk.length ? alertBar(T) : ""}

    <div class="kpis">
      ${kpi("Active reps", fmtNum(T.activeCount), state.reps.length + " on the roster")}
      ${kpi("Doors", fmtNum(T.t.d), "All time")}
      ${kpi("Presentations", fmtNum(T.t.p), fmtPct(T.r.dToP) + " of doors")}
      ${kpi("Close (ask for business)", fmtNum(T.t.c), fmtPct(T.r.pToC) + " of presentations", true)}
      ${kpi("Sales", fmtNum(T.t.sale), fmtPct(T.r.cToSale) + " of asks")}
      ${kpi("Doors per sale", fmt1(T.r.doorsPerSale), "Team wide")}
    </div>

    <div class="card">
      <h4>The team funnel</h4>
      ${funnel(T)}
    </div>

    <div class="card">
      <h4>Roster</h4>
      <div class="scroll">
        <table class="roster">
          <thead><tr>
            <th>Rep</th><th>Market</th><th>Standing</th>
            <th class="num">D</th><th class="num">P</th><th class="num">Asked</th><th class="num">Sales</th>
            <th class="num">D to P</th><th class="num">Ask rate</th><th class="num">Ask to sale</th>
            <th class="num">This week</th><th></th>
          </tr></thead>
          <tbody>${state.reps.map((rp) => rosterRow(state, rp, med)).join("") ||
            `<tr><td colspan="12"><div class="empty"><h3>No one on the roster yet</h3>
             <p>Add the team and each person can start logging their own day.</p></div></td></tr>`}</tbody>
        </table>
      </div>
      <div class="rowbtns mgr-only">
        <button class="primary" data-addrep="1">Add a rep</button>
        <button class="ghost" data-seed="1">Load example team</button>
        <button class="ghost" data-exportcsv="1">Export CSV</button>
      </div>
    </div>

    <div class="card mgr-only">
      <h4>Reports</h4>
      <p class="fine">Built from every number on this phone. Text it, email it, or save it as a PDF.
      The app raises the daily report after 7pm and last week's report on the first open of a new week.</p>
      <div class="rowbtns">
        <button class="primary" data-report="day">Today</button>
        <button class="ghost" data-report="week">This week so far</button>
        <button class="ghost" data-report="lastweek">Last week</button>
      </div>
      <label class="rp-email">Email reports to
        <input type="email" data-reportemail="1" value="${esc(state.reportEmail || "")}" placeholder="partner@example.com, you@example.com" autocomplete="email">
      </label>
    </div>

    ${focusCard(state)}

    <div class="card">
      <h4>Backup</h4>
      <p class="fine">Saves everything on this phone to one file, including the private Recruiting tab. Keep it somewhere safe.
      Restoring on a new or reset phone brings it all back.</p>
      <div class="rowbtns">
        <button class="ghost" data-backup="1">Back up this phone</button>
        <label class="ghost btnlike">Restore from backup<input type="file" accept=".json,application/json" data-restore="1" hidden></label>
      </div>
      ${state.lastBackup ? `<p class="fine">Last backup ${new Date(state.lastBackup).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}.</p>` : `<p class="fine warnline">This phone has never been backed up.</p>`}
    </div>

    ${state.cloud && state.cloud.token ? "" : `
    <div class="card mgr-only">
      <h4>Share and collect</h4>
      <p class="fine">Each phone keeps its own numbers. Send the team link so reps can pick their name and start.
      When a rep texts you their numbers link, tap it, or paste it here if the tracker is saved to your home screen.</p>
      <div class="rowbtns"><button class="primary" data-shareteam="1">Send team link</button></div>
      <div class="importrow">
        <textarea data-importbox="1" rows="2" placeholder="Paste a rep's numbers link" aria-label="Paste a rep's numbers link"></textarea>
        <button class="ghost" data-importpaste="1">Add to team</button>
      </div>
    `}
    </div>

    ${med ? diagnosis(T, med) : `<div class="card"><h4>Where the funnel is leaking</h4>
      <p class="fine">Once three or more reps have ${MIN_DOORS_FOR_DIAGNOSIS} or more doors logged, this compares each person against the
      team's own median instead of an outside benchmark, so it stays honest on a small team.</p></div>`}

    <div class="card">
      <h4>Weeks against the standard</h4>
      ${weekGrid(state)}
      <p class="fine">The standard is ${FLAG_RULE.minSales} sales a week. ${FLAG_RULE.weeks} completed weeks under it in a row
      raises a flag. The week in progress is shown but never triggers a flag on its own.</p>
    </div>
  </div>`;
}

function reportPanel(rp, state) {
  return `<div class="card rp-wrap">
    <div class="rp-actions">
      <button class="primary" data-rpshare="1">Text or share</button>
      <button class="ghost" data-rpemail="1">Email</button>
      <button class="ghost" data-rpcopy="1">Copy</button>
      <button class="ghost" data-rpprint="1">Save as PDF</button>
      <button class="ghost" data-rpclose="1">Close</button>
    </div>
    ${rp.html}
  </div>`;
}

/* Focus flags reps logged on the game board, sent over with their numbers.
   The count is not the point. The same thought coming back is. */
function focusCard(state) {
  const log = (state.control && Array.isArray(state.control.log)) ? state.control.log : [];
  const cut = new Date(Date.now() - 7 * 86400000);
  const cutDay = cut.getFullYear() + "-" + String(cut.getMonth() + 1).padStart(2, "0") + "-" + String(cut.getDate()).padStart(2, "0");
  const rows = state.reps.map((rp) => {
    const mine = log.filter((e) => e.v === "nocontrol" && e.rep === rp.id && e.day >= cutDay);
    if (!mine.length) return null;
    const by = {};
    mine.forEach((e) => { const k = e.subject || "other"; by[k] = (by[k] || 0) + 1; });
    const top = Object.keys(by).sort((a, b) => by[b] - by[a])[0];
    const last = mine.slice().sort((a, b) => (a.at < b.at ? 1 : -1))[0];
    return { name: rp.name || "Unnamed", n: mine.length, top, topN: by[top], last: last && last.text };
  }).filter(Boolean).sort((a, b) => b.n - a.n);
  if (!rows.length) return "";
  return `<div class="card">
    <h4>Focus flags, last 7 days</h4>
    <div class="diag">${rows.map((x) => `
      <div class="drow ${x.topN >= 3 ? "attn" : ""}">
        <div class="dname">${esc(x.name)}</div>
        <div class="dtext"><b>${x.n}</b> time${x.n === 1 ? "" : "s"} focused on something outside their control.
        Most often: <b>${esc(subjectLabel(x.top))}</b> (${x.topN}).${x.last ? ` Latest: "${esc(x.last)}"` : ""}
        ${x.topN >= 3 ? " Same thought three or more times. That is the coaching conversation." : ""}</div>
      </div>`).join("")}</div>
    <p class="fine">From the "What is on your mind" box on the game board. Comes in when a rep sends you their numbers.</p>
  </div>`;
}

function alertBar(T) {
  const parts = [];
  if (T.flagged.length) parts.push(`<b>${T.flagged.length}</b> flagged`);
  if (T.atRisk.length) parts.push(`<b>${T.atRisk.length}</b> at risk this week`);
  return `<div class="alert">
    <div class="alerthead">${parts.join(" and ")}</div>
    <div class="alertbody">${T.flagged.concat(T.atRisk).map((x) =>
      `<span class="chip ${x.flag.flagged ? "bad" : "warn"}">${esc(x.rep.name || "Unnamed")} <span class="chipsub">${esc(x.flag.reason)}</span></span>`).join("")}</div>
  </div>`;
}

function kpi(label, value, sub, accent) {
  return `<div class="kpi ${accent ? "accent" : ""}">
    <div class="klab">${label}</div><div class="kval">${value}</div><div class="ksub">${sub}</div></div>`;
}

function funnel(T) {
  const max = Math.max(T.t.d, 1);
  const rows = [
    ["Doors", T.t.d, null],
    ["Presentations", T.t.p, T.r.dToP],
    ["Close (ask for business)", T.t.c, T.r.pToC],
    ["Sales", T.t.sale, T.r.cToSale],
  ];
  return `<div class="fun">${rows.map(([lab, v, conv], i) => `
    <div class="frow">
      <div class="flab">${lab}</div>
      <div class="ftrack"><div class="ffill ${i === 2 ? "ask" : ""} ${i === 3 ? "sale" : ""}" style="width:${((v / max) * 100).toFixed(1)}%"></div></div>
      <div class="fval">${fmtNum(v)}</div>
      <div class="fconv">${conv === null ? "" : fmtPct(conv) + " of the step above"}</div>
    </div>`).join("")}</div>`;
}

function rosterRow(state, rp, med) {
  const t = repTotals(state, rp.id);
  const r = rates(t);
  const f = flagState(state, rp.id);
  const wt = weekTotals(state, rp.id);
  const cw = wt[weekStart(today())];
  const thisWeek = cw ? cw.sale : 0;
  const cell = (v, val) => {
    if (!med || val === null) return `<td class="num">${v}</td>`;
    const below = val < med * 0.8;
    return `<td class="num ${below ? "low" : ""}">${v}</td>`;
  };
  return `<tr data-rep="${rp.id}">
    <td><input class="nm" data-repf="name" value="${esc(rp.name)}" placeholder="Name" ${state.role === "rep" ? "readonly" : ""}></td>
    <td><input class="mk" data-repf="market" value="${esc(rp.market)}" placeholder="Market" ${state.role === "rep" ? "readonly" : ""}></td>
    <td>${f.flagged ? `<span class="pill bad">Flagged</span>` : f.atRisk ? `<span class="pill warn">At risk</span>` : `<span class="pill good">Clear</span>`}</td>
    <td class="num">${fmtNum(t.d)}</td>
    <td class="num">${fmtNum(t.p)}</td>
    <td class="num">${fmtNum(t.c)}</td>
    <td class="num accent">${fmtNum(t.sale)}</td>
    ${cell(fmtPct(r.dToP), r.dToP === null ? null : r.dToP)}
    ${cell(fmtPct(r.pToC), r.pToC === null ? null : r.pToC)}
    ${cell(fmtPct(r.cToSale), r.cToSale === null ? null : r.cToSale)}
    <td class="num ${thisWeek < FLAG_RULE.minSales ? "low" : ""}">${thisWeek}</td>
    <td class="rowact">
      <button class="ghost xs" data-openrep="${rp.id}">Open</button>
      <button class="ghost xs danger mgr-only" data-delrep="${rp.id}">Remove</button>
    </td>
  </tr>`;
}

function diagnosis(T, med) {
  const rows = T.per
    .filter((x) => x.t.d >= MIN_DOORS_FOR_DIAGNOSIS)
    .map((x) => {
      const gaps = [
        { stage: "getting into presentations", val: x.r.dToP, med: med.dToP, fix: "the door approach" },
        { stage: "asking for the business", val: x.r.pToC, med: med.pToC, fix: "the ask itself" },
        { stage: "landing the sale after asking", val: x.r.cToSale, med: med.cToSale, fix: "handling what comes back after the ask" },
      ].filter((g) => g.val !== null && g.med !== null && g.med > 0);
      if (!gaps.length) return null;
      const worst = gaps.reduce((a, b) => (b.val / b.med < a.val / a.med ? b : a));
      const ratio = worst.val / worst.med;
      return { name: x.rep.name || "Unnamed", worst, ratio, flagged: x.flag.flagged };
    })
    .filter(Boolean)
    .sort((a, b) => a.ratio - b.ratio);

  return `<div class="card">
    <h4>Where each person is leaking</h4>
    <div class="diag">${rows.map((x) => `
      <div class="drow ${x.ratio < 0.8 ? "attn" : ""}">
        <div class="dname">${esc(x.name)}</div>
        <div class="dtext">Weakest at <b>${x.worst.stage}</b> at ${fmtPct(x.worst.val)} against a team median of ${fmtPct(x.worst.med)}.
          ${x.ratio < 0.8 ? "Coach " + x.worst.fix + "." : "Inside the normal spread for this team."}</div>
      </div>`).join("")}</div>
    <p class="fine">Compared against this team's own median across ${med.n} reps with ${MIN_DOORS_FOR_DIAGNOSIS}+ doors logged, not an outside benchmark. Reps under that are left out until the sample is real.
    With a small team the median moves easily, so treat this as where to look first, not as a verdict.</p>
  </div>`;
}

function weekGrid(state) {
  const weeks = weekSpan(state).slice(-8);
  if (!state.reps.length) return `<p class="fine">Nothing to show yet.</p>`;
  return `<div class="scroll"><table class="wk">
    <thead><tr><th>Rep</th>${weeks.map((w) =>
      `<th class="num">${weekLabel(w).split(" to ")[0]}${isCurrentWeek(w) ? '<span class="now">now</span>' : ""}</th>`).join("")}</tr></thead>
    <tbody>${state.reps.map((rp) => {
      const wt = weekTotals(state, rp.id);
      const first = repFirstWeek(state, rp.id);
      return `<tr><td>${esc(rp.name || "Unnamed")}</td>${weeks.map((w) => {
        const s = wt[w] ? wt[w].sale : 0;
        const cur = isCurrentWeek(w);
        if (w < first) return `<td class="num pre" title="Before this rep started">\u00b7</td>`;
        const cls = cur ? "cur" : s < FLAG_RULE.minSales ? "miss" : "hit";
        return `<td class="num ${cls}">${wt[w] ? s : "\u2014"}</td>`;
      }).join("")}</tr>`;
    }).join("")}</tbody></table></div>`;
}

export function buildCSV(state) {
  const q = (s) => `"${String(s ?? "").replace(/"/g, '""')}"`;
  const T = teamTotals(state);
  let out = "DPC FIELD TRACKER\nExported," + today() + "\n";
  out += "Note,\"C means the rep asked for the business. It is not a sale. Sales are counted separately.\"\n\n";
  out += "ROSTER\nRep,Market,Started,Active,Standing,Doors,Presentations,Asked,Sales,D to P,Ask rate,Ask to sale,Doors per sale\n";
  T.per.forEach((x) => {
    out += [q(x.rep.name), q(x.rep.market), x.rep.started, x.rep.active,
      q(x.flag.flagged ? "Flagged" : x.flag.atRisk ? "At risk" : "Clear"),
      x.t.d, x.t.p, x.t.c, x.t.sale,
      x.r.dToP === null ? "" : (x.r.dToP * 100).toFixed(1),
      x.r.pToC === null ? "" : (x.r.pToC * 100).toFixed(1),
      x.r.cToSale === null ? "" : (x.r.cToSale * 100).toFixed(1),
      x.r.doorsPerSale === null ? "" : x.r.doorsPerSale.toFixed(1)].join(",") + "\n";
  });
  out += [q("TEAM TOTAL"), "", "", "", "", T.t.d, T.t.p, T.t.c, T.t.sale,
    T.r.dToP === null ? "" : (T.r.dToP * 100).toFixed(1),
    T.r.pToC === null ? "" : (T.r.pToC * 100).toFixed(1),
    T.r.cToSale === null ? "" : (T.r.cToSale * 100).toFixed(1),
    T.r.doorsPerSale === null ? "" : T.r.doorsPerSale.toFixed(1)].join(",") + "\n";

  out += "\nDAILY LOG\nRep,Date,Doors,Presentations,Asked,Sales,Note\n";
  state.reps.forEach((rp) => {
    (state.entries[rp.id] || []).slice().sort((a, b) => (a.date < b.date ? -1 : 1))
      .forEach((e) => {
        out += [q(rp.name), e.date, num(e.d), num(e.p), num(e.c), num(e.sale), q(e.note)].join(",") + "\n";
      });
  });
  out += "\n\u00a9 2026 David Borske. All rights reserved.\n";
  return out;
}

/* A small example team so the app can be understood before real data exists. */
export function seedTeam(state) {
  const names = [
    ["Marcus Hill", "North Charlotte", [12, 9, 7, 6, 8, 5]],
    ["Tyrell Banks", "Concord", [4, 3, 5, 4, 3, 4]],
    ["Dana Ruiz", "Gastonia", [7, 6, 6, 7, 9, 8]],
    ["Chris Okafor", "North Charlotte", [3, 2, 4, 3, 2, 3]],
    ["Samir Patel", "Rock Hill", [9, 11, 8, 10, 7, 9]],
  ];
  /* Ratios vary by person on purpose so the diagnosis panel has something real
     to find: one rep asks rarely, one asks constantly and closes poorly. */
  const profile = [
    { dp: 0.20, pc: 0.75 }, { dp: 0.18, pc: 0.30 }, { dp: 0.22, pc: 0.70 },
    { dp: 0.09, pc: 0.65 }, { dp: 0.24, pc: 0.80 },
  ];
  state.reps = [];
  state.entries = {};
  names.forEach(([name, market, weekly], i) => {
    const rp = newRep(name);
    rp.market = market;
    state.reps.push(rp);
    state.entries[rp.id] = [];
    const p = profile[i];
    weekly.forEach((sales, wIdx) => {
      const weeksAgo = weekly.length - wIdx;
      for (let day = 0; day < 5; day++) {
        const dt = new Date();
        dt.setDate(dt.getDate() - (weeksAgo * 7) + day);
        const dd = 55 + ((i * 7 + day * 3 + wIdx) % 25);
        const pp = Math.round(dd * p.dp);
        const cc = Math.round(pp * p.pc);
        const ss = Math.min(cc, Math.round(sales / 5) + (day === 2 && sales % 5 > 2 ? 1 : 0));
        const iso = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
        if (iso < rp.started) rp.started = iso;
        state.entries[rp.id].push({
          id: "s" + i + wIdx + day,
          date: new Date(dt.getTime() - dt.getTimezoneOffset() * 60000).toISOString().slice(0, 10),
          d: dd, p: pp, c: cc, sale: ss, note: "",
        });
      }
    });
  });
  return state;
}
