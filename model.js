/* Data model and every calculation.

   Vocabulary is the product. See CONTRACT.md.
     D    a door worked
     P    a presentation given
     C    the rep ASKED FOR THE BUSINESS. Not a sale.
     Sale a separate count. A rep can close and not get the sale.

   Every rate is a summed numerator over a summed denominator. Never an
   average of daily rates, because that silently weights a quiet day the same
   as a heavy one. */

export const STAGES = [
  { key: "d", letter: "D", name: "Doors", verb: "Door worked" },
  { key: "p", letter: "P", name: "Presentations", verb: "Presented" },
  { key: "c", letter: "C", name: "Closes", verb: "Asked for business" },
  { key: "sale", letter: "S", name: "Sales", verb: "Got the sale" },
];

export const FLAG_RULE = { minSales: 5, weeks: 3 };

export const uid = () =>
  "r" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

export const num = (v) => {
  const x = typeof v === "number" ? v : parseFloat(String(v ?? "").replace(/[^0-9.\-]/g, ""));
  return isFinite(x) ? x : 0;
};

/* ---------- dates. Weeks run Monday to Sunday. ---------- */

export function isoDay(d) {
  const t = d instanceof Date ? d : new Date(d);
  return new Date(t.getTime() - t.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
}

export function today() {
  return isoDay(new Date());
}

export function weekStart(dateStr) {
  const d = new Date(dateStr + "T12:00:00");
  const dow = (d.getDay() + 6) % 7; // Monday is 0
  d.setDate(d.getDate() - dow);
  return isoDay(d);
}

export function weekLabel(ws) {
  const a = new Date(ws + "T12:00:00");
  const b = new Date(a.getTime() + 6 * 86400000);
  const f = (x) =>
    x.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return f(a) + " to " + f(b);
}

export function isCurrentWeek(ws) {
  return ws === weekStart(today());
}

/* Every Monday from the earliest entry through the current week, oldest first. */
export function weekSpan(state) {
  const days = allEntries(state).map((e) => e.date);
  const cur = weekStart(today());
  if (!days.length) return [cur];
  let w = weekStart(days.reduce((a, b) => (a < b ? a : b)));
  const out = [];
  let guard = 0;
  while (w <= cur && guard++ < 520) {
    out.push(w);
    const d = new Date(w + "T12:00:00");
    d.setDate(d.getDate() + 7);
    w = isoDay(d);
  }
  return out;
}

/* ---------- shape ---------- */

export function emptyState() {
  return {
    v: 1,
    team: "",
    reps: [],
    entries: {}, // repId -> [{ id, date, d, p, c, sale, note }]
    board: null, // set by view-board
    boardLog: {}, // repId -> [{ date, text, verdict, nearest }]
    activeRep: null,
    view: "manager",
  };
}

export function ensure(state) {
  const s = state && typeof state === "object" ? state : {};
  const base = emptyState();
  const out = { ...base, ...s };
  out.reps = Array.isArray(out.reps) ? out.reps : [];
  out.entries = out.entries && typeof out.entries === "object" ? out.entries : {};
  out.boardLog = out.boardLog && typeof out.boardLog === "object" ? out.boardLog : {};
  out.reps.forEach((r) => {
    if (!out.entries[r.id]) out.entries[r.id] = [];
  });
  return out;
}

export function newRep(name = "") {
  return {
    id: uid(),
    name,
    phone: "",
    market: "",
    started: today(),
    active: true,
  };
}

export function allEntries(state) {
  const out = [];
  Object.keys(state.entries || {}).forEach((rid) =>
    (state.entries[rid] || []).forEach((e) => out.push({ ...e, rep: rid }))
  );
  return out;
}

/* ---------- counting ---------- */

const ZERO = { d: 0, p: 0, c: 0, sale: 0, days: 0 };

export function sumEntries(entries) {
  const t = { ...ZERO };
  const seen = new Set();
  (entries || []).forEach((e) => {
    t.d += num(e.d);
    t.p += num(e.p);
    t.c += num(e.c);
    t.sale += num(e.sale);
    /* A day only counts as worked when something was logged. Opening the app
       creates an empty row for today, and that must not inflate days worked. */
    const worked = num(e.d) + num(e.p) + num(e.c) + num(e.sale) > 0;
    if (worked && !seen.has(e.date)) {
      seen.add(e.date);
      t.days++;
    }
  });
  return t;
}

/* Conversions. Each returns null when the denominator is zero, so the UI can
   print a dash instead of a misleading 0 percent. */
export function rates(t) {
  const r = (n, d) => (d > 0 ? n / d : null);
  return {
    dToP: r(t.p, t.d),
    pToC: r(t.c, t.p), // the ask rate
    cToSale: r(t.sale, t.c), // of the times asked, how often it landed
    doorsPerSale: t.sale > 0 ? t.d / t.sale : null,
    doorsPerPresentation: t.p > 0 ? t.d / t.p : null,
    salePerDay: t.days > 0 ? t.sale / t.days : null,
  };
}

export function repEntries(state, repId) {
  return (state.entries[repId] || [])
    .slice()
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function repTotals(state, repId) {
  return sumEntries(state.entries[repId]);
}

/* repId -> { weekStart -> totals } */
export function weekTotals(state, repId) {
  const by = {};
  (state.entries[repId] || []).forEach((e) => {
    const w = weekStart(e.date);
    if (!by[w]) by[w] = [];
    by[w].push(e);
  });
  const out = {};
  Object.keys(by).forEach((w) => (out[w] = sumEntries(by[w])));
  return out;
}

/* Monday of the earliest of the rep's start date and their first logged day. */
export function repFirstWeek(state, repId) {
  const rep = (state.reps || []).find((r) => r.id === repId);
  const dates = (state.entries[repId] || []).map((e) => e.date).filter(Boolean);
  if (rep && rep.started) dates.push(rep.started);
  if (!dates.length) return weekStart(today());
  return weekStart(dates.reduce((a, b) => (a < b ? a : b)));
}

/* ---------- the standard ----------
   Flagged when sales are under 5 in each of 3 consecutive COMPLETED weeks.
   The in progress week never flags anyone. It can only put them at risk. */
export function flagState(state, repId) {
  const wt = weekTotals(state, repId);
  /* Only judge a rep on weeks since they joined. Weeks before their first
     day on the team are not misses, they did not exist yet. */
  const firstWeek = repFirstWeek(state, repId);
  const weeks = weekSpan(state).filter((w) => !isCurrentWeek(w) && w >= firstWeek);
  const series = weeks.map((w) => ({
    week: w,
    sales: wt[w] ? wt[w].sale : 0,
    has: !!wt[w],
  }));

  let run = 0;
  let longest = 0;
  let flaggedAt = null;
  series.forEach((x) => {
    if (x.sales < FLAG_RULE.minSales) {
      run++;
      if (run > longest) longest = run;
      if (run >= FLAG_RULE.weeks && !flaggedAt) flaggedAt = x.week;
    } else {
      run = 0;
    }
  });

  const curWeek = weekStart(today());
  const curSales = wt[curWeek] ? wt[curWeek].sale : 0;
  const trailingRun = run; // consecutive misses ending at the last completed week
  const atRisk =
    !flaggedAt &&
    trailingRun === FLAG_RULE.weeks - 1 &&
    curSales < FLAG_RULE.minSales;

  return {
    flagged: !!flaggedAt,
    flaggedAt,
    consecutiveMisses: trailingRun,
    longestRun: longest,
    atRisk,
    currentWeekSales: curSales,
    needThisWeek: Math.max(0, FLAG_RULE.minSales - curSales),
    weeks: series,
    /* Plain language, because a flag has to be explainable out loud. */
    reason: flaggedAt
      ? "Under " + FLAG_RULE.minSales + " sales in " + FLAG_RULE.weeks + " weeks running, most recently the week of " + weekLabel(flaggedAt)
      : atRisk
        ? trailingRun + " weeks under " + FLAG_RULE.minSales + " already. " + Math.max(0, FLAG_RULE.minSales - curSales) + " more sales this week clears it"
        : trailingRun > 0
          ? trailingRun + " week" + (trailingRun > 1 ? "s" : "") + " under " + FLAG_RULE.minSales
          : series.length
            ? "Every completed week has hit " + FLAG_RULE.minSales + " or better"
            : "New on the team. No completed weeks yet, so nothing counts against you until this week ends",
  };
}

/* ---------- team roll up ---------- */
export function teamTotals(state) {
  const per = state.reps.map((r) => {
    const t = repTotals(state, r.id);
    return { rep: r, t, r: rates(t), flag: flagState(state, r.id) };
  });
  const t = per.reduce(
    (a, x) => ({
      d: a.d + x.t.d,
      p: a.p + x.t.p,
      c: a.c + x.t.c,
      sale: a.sale + x.t.sale,
      days: a.days + x.t.days,
    }),
    { ...ZERO }
  );
  return {
    per,
    t,
    r: rates(t),
    flagged: per.filter((x) => x.flag.flagged),
    atRisk: per.filter((x) => x.flag.atRisk),
    activeCount: state.reps.filter((r) => r.active).length,
  };
}

/* Where the funnel is leaking worst, measured against the team's own median so
   it stays honest with small samples rather than inventing a benchmark. */
/* Fewer doors than this and one good or bad day swings every rate, so the
   rep is left out of the median and the diagnosis until they have more. */
export const MIN_DOORS_FOR_DIAGNOSIS = 50;

export function weakestStage(per) {
  const withData = per.filter((x) => x.t.d >= MIN_DOORS_FOR_DIAGNOSIS);
  if (withData.length < 3) return null;
  const med = (arr) => {
    const a = arr.filter((x) => x !== null).sort((x, y) => x - y);
    if (!a.length) return null;
    const m = Math.floor(a.length / 2);
    return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
  };
  return {
    dToP: med(withData.map((x) => x.r.dToP)),
    pToC: med(withData.map((x) => x.r.pToC)),
    cToSale: med(withData.map((x) => x.r.cToSale)),
    n: withData.length,
  };
}

export function fmtPct(v, dp = 0) {
  return v === null || v === undefined || !isFinite(v)
    ? "\u2014"
    : (v * 100).toFixed(dp) + "%";
}
export function fmtNum(v) {
  return v === null || v === undefined || !isFinite(v)
    ? "\u2014"
    : Math.round(v).toLocaleString();
}
export function fmt1(v) {
  return v === null || v === undefined || !isFinite(v)
    ? "\u2014"
    : (Math.round(v * 10) / 10).toLocaleString();
}

/* ---------- bringing in data from a link ----------
   kind "rep"  : one rep's numbers sent to the manager. Their numbers win.
   kind "team" : the manager's roster sent out. Numbers from the link win,
                 except the phone owner's own days, which stay as they are. */
const normName = (s) => String(s || "").trim().toLowerCase().replace(/\s+/g, " ");

export function mergeIncoming(state, inc, opts = {}) {
  const out = { reps: 0, added: 0, days: 0, names: [] };
  if (!inc || !Array.isArray(inc.reps)) return out;
  const kind = inc.kind === "rep" ? "rep" : "team";
  const keepMine = kind === "team" ? opts.ownRep || null : null;
  inc.reps.forEach((ir) => {
    if (!ir || !ir.id) return;
    let mine = state.reps.find((r) => r.id === ir.id);
    if (!mine && normName(ir.name)) mine = state.reps.find((r) => normName(r.name) === normName(ir.name));
    if (!mine) {
      mine = { ...newRep(ir.name || ""), ...ir };
      state.reps.push(mine);
      state.entries[mine.id] = [];
      out.added++;
    } else {
      if (!mine.name && ir.name) mine.name = ir.name;
      if (!mine.market && ir.market) mine.market = ir.market;
      if (ir.started && (!mine.started || ir.started < mine.started)) mine.started = ir.started;
    }
    out.reps++;
    out.names.push(mine.name || "Unnamed");
    if (!state.entries[mine.id]) state.entries[mine.id] = [];
    const list = state.entries[mine.id];
    ((inc.entries && inc.entries[ir.id]) || []).forEach((ie) => {
      if (!ie || !ie.date) return;
      const clean = {
        id: ie.id || uid(), date: String(ie.date).slice(0, 10),
        d: Math.max(0, num(ie.d)), p: Math.max(0, num(ie.p)),
        c: Math.max(0, num(ie.c)), sale: Math.max(0, num(ie.sale)),
        note: String(ie.note || ""),
      };
      const i = list.findIndex((e) => e.date === clean.date);
      if (i < 0) { list.push(clean); out.days++; return; }
      if (keepMine && mine.id === keepMine) return;
      const had = list[i];
      if (had.d !== clean.d || had.p !== clean.p || had.c !== clean.c || had.sale !== clean.sale || had.note !== clean.note) {
        list[i] = { ...clean, id: had.id };
        out.days++;
      }
    });
  });
  if (kind === "rep" && inc.flags) {
    if (!state.control || typeof state.control !== "object") state.control = {};
    if (!Array.isArray(state.control.log)) state.control.log = [];
    const have = new Set(state.control.log.map((e) => e.id));
    inc.reps.forEach((ir) => {
      const mine = state.reps.find((r) => r.id === ir.id) ||
        state.reps.find((r) => normName(r.name) && normName(r.name) === normName(ir.name));
      if (!mine) return;
      ((inc.flags && inc.flags[ir.id]) || []).forEach((f) => {
        if (!f || !f.id || have.has(f.id)) return;
        have.add(f.id);
        state.control.log.push({ ...f, v: "nocontrol", rep: mine.id, remote: true });
      });
    });
    state.control.log = state.control.log.slice(-800);
  }
  if (kind === "team") {
    if (inc.board) state.board = inc.board;
    if (inc.recruit) state.recruit = inc.recruit;
  }
  return out;
}
