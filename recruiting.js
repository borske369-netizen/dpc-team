/* recruiting.js  (owner: main)
 *
 * Two jobs.
 *
 * 1. A team facing banner that says a recruiting cycle is live. The team sees
 *    it every time they open the app. It runs off real counts entered behind
 *    the lock, never off a hardcoded slogan, because a number that never moves
 *    stops being believed.
 *
 * 2. The admin panel that sets those counts. Rendered only inside the unlocked
 *    Recruiting tab.
 *
 * State: state.recruit = {
 *   live: bool, interviews: n, ridealongs: n, startsMonday: n,
 *   seats: n, bench: n, market: str, updated: ISO
 * }
 *
 * No storage calls. Mutate through api.commit.
 */

export function ensureRecruit(state) {
  if (!state) return null;
  if (!state.recruit || typeof state.recruit !== "object") {
    state.recruit = {
      live: false, seatsTotal: 0, seatsHeld: 0, waiting: 0,
      market: "", updated: null, events: [],
    };
  }
  const r = state.recruit;
  if (!Array.isArray(r.events)) r.events = [];
  /* Events that arrived through a team link carry only the public line, no
     name. They still have to show on the banner, so keep anything with text
     or a public line. */
  r.events = r.events.filter((e) => e && (e.text || e.pub)).slice(-24);
  /* migrate the old pipeline shape forward */
  if (r.seatsTotal === undefined && r.seats !== undefined) {
    r.seatsTotal = r.seats; r.seatsHeld = 0; r.waiting = r.bench || 0;
  }
  ["seatsTotal", "seatsHeld", "waiting"].forEach((k) => {
    const n = parseInt(r[k], 10);
    r[k] = isFinite(n) && n > 0 ? n : 0;
  });
  r.live = !!r.live;
  r.market = String(r.market == null ? "" : r.market);
  return r;
}

/* The name being typed survives a repaint. */
let whoDraft = "";
let kindDraft = "applied";

function n(v) { const x = parseInt(v, 10); return isFinite(x) && x > 0 ? x : 0; }
function esc(v) {
  return String(v == null ? "" : v).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

/* The line that does the work. Chosen off whichever number is most pointed
   right now, so the message shifts as the pipeline shifts. */
function headline(r) {
  const held = r.seatsHeld > 0 ? r.seatsHeld : 0;
  const total = r.seatsTotal > 0 ? r.seatsTotal : 0;
  if (total > 0) {
    const open = Math.max(0, total - held);
    if (open === 0) return "Every seat on this team is filled.";
    return open === 1 ? "One seat is open." : open + " seats are open.";
  }
  return "Seats on this team are limited.";
}

function pressure(r) {
  const waiting = r.waiting > 0 ? r.waiting : 0;
  const total = r.seatsTotal > 0 ? r.seatsTotal : 0;
  const open = total > 0 ? Math.max(0, total - (r.seatsHeld > 0 ? r.seatsHeld : 0)) : 0;
  if (waiting === 0) return "Production keeps yours.";
  const who = waiting === 1 ? "Someone is waiting" : waiting + " people are waiting";
  if (total > 0 && open === 0) return who + " on a seat that is already taken.";
  if (waiting > open && open > 0) return who + " on " + open + ".";
  return who + " on one.";
}

/* `stage` is what YOU see behind the lock. `pub` is all the team ever sees.
   No names leave this tab. The team gets movement and scarcity, nothing else. */
export const EVENT_KINDS = [
  { k: "applied",   stage: "Identified",  dot: "new",  pub: "Someone new wants a seat" },
  { k: "screened",  stage: "Screened",    dot: "warm", pub: "A candidate cleared screening" },
  { k: "interview", stage: "Interviewed", dot: "warm", pub: "A candidate interviewed for a seat" },
  { k: "ridealong", stage: "Ride along",  dot: "hot",  pub: "A candidate is out on the doors this week" },
  { k: "offer",     stage: "Offered",     dot: "hot",  pub: "A seat was offered" },
  { k: "onboarded", stage: "Onboarded",   dot: "live", pub: "A seat was filled" },
  { k: "firstsale", stage: "First sale",  dot: "live", pub: "A new rep got on the board" },
  { k: "released",  stage: "Released",    dot: "cold", pub: "A seat opened back up" },
];

export function addEvent(state, kind, who) {
  const r = ensureRecruit(state);
  if (!r) return;
  const def = EVENT_KINDS.find((e) => e.k === kind) || EVENT_KINDS[0];
  const name = String(who || "").trim();
  if (!name) return;
  r.events.push({
    id: "e" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    kind: def.k, dot: def.dot, who: name, stage: def.stage, pub: def.pub,
    text: def.stage + ": " + name, at: new Date().toISOString(),
  });
  r.events = r.events.slice(-24);
  r.updated = new Date().toISOString();
}

function ago(iso) {
  const t = Date.parse(iso);
  if (!isFinite(t)) return "";
  const m = Math.max(0, Math.round((Date.now() - t) / 60000));
  if (m < 60) return "today";
  const h = Math.round(m / 60);
  if (h < 24) return "today";
  const d = Math.round(h / 24);
  if (d === 1) return "yesterday";
  if (d < 7) return "this week";
  return "recently";
}

/* Exact time, for the locked view only. */
function agoExact(iso) {
  const t = Date.parse(iso);
  if (!isFinite(t)) return "";
  const m = Math.max(0, Math.round((Date.now() - t) / 60000));
  if (m < 1) return "just now";
  if (m < 60) return m + "m ago";
  const h = Math.round(m / 60);
  if (h < 24) return h + "h ago";
  return Math.round(h / 24) + "d ago";
}

function tickerHtml(r) {
  const ev = r.events.slice().reverse().slice(0, 8);
  if (!ev.length) return "";
  return `
   <div class="rec-tickwrap">
    <div class="rec-ticker" aria-label="Recent recruiting activity">
      <div class="rec-track" style="--n:${ev.length}">
        ${ev.concat(ev).map((e) => `
          <span class="rec-ev">
            <i class="rec-ev-dot rec-${esc(e.dot)}" aria-hidden="true"></i>
            <span class="rec-ev-t">${esc(e.pub || "Movement in the pipeline")}</span>
            <span class="rec-ev-a">${esc(ago(e.at))}</span>
          </span>`).join("")}
      </div>
    </div>`;
}

export function recruitBannerHtml(state) {
  const r = ensureRecruit(state);
  if (!r || !r.live) return "";
  const total = r.seatsTotal > 0 ? r.seatsTotal : 0;
  const held = Math.min(r.seatsHeld > 0 ? r.seatsHeld : 0, total || Infinity);
  const chips = [
    total ? [held + " of " + total, "seats held"] : null,
    r.waiting ? [r.waiting, "waiting on a seat"] : null,
  ].filter(Boolean);

  return `
  <section class="rec-banner" role="status">
    <div class="rec-top">
      <span class="rec-dot" aria-hidden="true"></span>
      <span class="rec-kicker">Recruiting cycle is live${r.market ? " in " + esc(r.market) : ""}</span>
    </div>
    <p class="rec-head">${esc(headline(r))}</p>
    ${chips.length ? `<div class="rec-chips">${chips.map(([v, l]) =>
      `<span class="rec-chip"><strong>${esc(String(v))}</strong> ${esc(l)}</span>`).join("")}</div>` : ""}
    ${tickerHtml(r)}
    <p class="rec-press">${esc(pressure(r))}</p>
  </section>`;
}

export function renderRecruitAdmin(el, state, api) {
  if (!el) return;
  const r = ensureRecruit(state);
  const f = (k, label, hint) => `
    <label class="rec-f">
      <span>${esc(label)}</span>
      <input type="text" inputmode="numeric" data-rec="${k}" value="${r[k]}" aria-label="${esc(label)}">
      ${hint ? `<em>${esc(hint)}</em>` : ""}
    </label>`;

  el.innerHTML = `
  <section class="rec-admin deal-card">
    <h3 class="rec-admin-h">Recruiting cycle, what the team sees</h3>
    <p class="rec-admin-p">The team sees three things and nothing more: how many seats exist, how many are
      held, and that people are waiting. No names, no stages, no pipeline detail.
      Keep the numbers true and current. A count that never moves stops being believed.</p>

    <label class="rec-toggle">
      <input type="checkbox" data-rec="live" ${r.live ? "checked" : ""}>
      <span>Show the cycle banner to the team</span>
    </label>

    <label class="rec-f rec-f-wide">
      <span>Market</span>
      <input type="text" data-rec="market" value="${esc(r.market)}" placeholder="North Charlotte" aria-label="Market">
    </label>

    <div class="rec-grid">
      ${f("seatsTotal", "Total seats", "Housing capacity")}
      ${f("seatsHeld", "Seats held", "Reps in them now")}
      ${f("waiting", "Waiting on a seat", "Shown as a count only")}
    </div>

    <div class="rec-ev-add">
      <p class="rec-prev-l">Log activity. The team sees it anonymously</p>
      <div class="rec-ev-row">
        <input type="text" data-recev="who" value="${esc(whoDraft)}" placeholder="First name, stays private" aria-label="Who">
        <select data-recev="kind" aria-label="What happened">
          ${EVENT_KINDS.map((e) => `<option value="${e.k}" ${e.k === kindDraft ? "selected" : ""}>${esc(e.stage)}</option>`).join("")}
        </select>
        <button type="button" class="btn-primary" data-recev="add">Add</button>
      </div>
      ${r.events.length ? `<ul class="rec-ev-list">${r.events.slice().reverse().slice(0, 6).map((e) => `
        <li><span class="rec-ev-dot rec-${esc(e.dot)}"></span> <b>${esc(e.stage || "")}</b> ${esc(e.who || "")}
        <em>${esc(agoExact(e.at))}</em>
        <button type="button" class="ghost xs" data-recdel="${esc(e.id)}">Remove</button></li>`).join("")}</ul>`
        : `<p class="rec-off">Nothing logged yet. The strip stays hidden until something moves.</p>`}
    </div>

    <div class="rec-prev">
      <p class="rec-prev-l">Preview, exactly as the team sees it</p>
      ${r.live ? recruitBannerHtml(state) : `<p class="rec-off">Banner is off. The team sees nothing.</p>`}
    </div>
  </section>`;

  if (el.dataset.recBound) return;
  el.dataset.recBound = "1";
  const commit = (fn) => {
    if (api && typeof api.commit === "function") api.commit(fn);
    else { fn(state); if (api && typeof api.render === "function") api.render(); }
  };
  el.addEventListener("input", (ev) => {
    const t = ev.target;
    if (t && t.dataset && t.dataset.recev === "who") { whoDraft = t.value; return; }
    const k = t && t.dataset && t.dataset.rec;
    if (!k) return;
    commit((s) => {
      const rr = ensureRecruit(s);
      if (k === "live") rr.live = !!t.checked;
      else if (k === "market") rr.market = t.value;
      else rr[k] = n(t.value);
      rr.updated = new Date().toISOString();
    });
  });
  el.addEventListener("click", (ev) => {
    const del = ev.target.closest("[data-recdel]");
    if (del) {
      commit((s) => {
        const rr = ensureRecruit(s);
        rr.events = rr.events.filter((x) => x.id !== del.dataset.recdel);
      });
      return;
    }
    const add = ev.target.closest('[data-recev="add"]');
    if (!add) return;
    const whoEl = el.querySelector('[data-recev="who"]');
    const kindEl = el.querySelector('[data-recev="kind"]');
    const who = whoEl ? whoEl.value.trim() : "";
    if (!who) { if (whoEl) whoEl.focus(); return; }
    whoDraft = "";
    commit((s) => addEvent(s, kindEl ? kindEl.value : "applied", who));
  });
  el.addEventListener("change", (ev) => {
    if (ev.target && ev.target.dataset && ev.target.dataset.recev === "kind") { kindDraft = ev.target.value; return; }
    if (ev.target && ev.target.dataset && ev.target.dataset.rec === "live") {
      commit((s) => { const rr = ensureRecruit(s); rr.live = !!ev.target.checked; });
    }
  });
}
