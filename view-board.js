// view-board.js  (owner: subagent B)
//
// The game board. Three columns, D, P, C. Each column holds controllable
// actions. Anything a rep is focused on that is not on the board is out of
// bounds, and out of bounds means you cannot score.
//
// The real chart is being produced by the owner. This module ships only the
// STRUCTURE, a forgiving parser for his pasted chart, a paste and preview
// screen, and an empty state that waits for the chart. Stub items are generic
// on purpose and flagged placeholder: true.
//
// Plain ES module, no build step, no storage calls. State comes in through
// arguments and goes out through the api passed to renderBoard.
//
// State keys this module reads and writes (all optional, created lazily):
//   state.board      board structure, see defaultBoard(). Absent means stubs.
//   state.boardWork  { [YYYY-MM-DD]: { [itemId]: true } }   items worked per day
//   state.oobLog     { [YYYY-MM-DD]: [ { text, nearestId, at } ] }  out of bounds log
//
// renderBoard(el, state, api). api may be:
//   a function            api(nextState)
//   an object with        api.setState(nextState)  or  api.update(nextState)
//   optionally            api.today()  returning a YYYY-MM-DD string
// With no usable api the board still works, held in module memory.

import { readControl, subjectLabel, logRead, fixation } from './control.js';

export const COLUMN_ORDER = ['d', 'p', 'c', 'a'];

const COLUMN_NAMES = { d: 'Doors', p: 'Presentation', c: 'Close', a: 'Accounts' };

// ---------------------------------------------------------------------------
// Board data
// ---------------------------------------------------------------------------

export function defaultBoard() {
  return {
    placeholder: false,
    title: 'Game board',
    source: "Owner's chart, transcribed 2026-09-18",
    grade: { note: 'Grade scale pending confirmation.', scale: [] },
    columns: {
      d: {
        key: 'd', title: 'Doors', theme: 'PACE',
        purpose: 'An interaction with someone counts as a door.',
        items: [
          { id: 'd1', group: 'WORK ETHIC', text: 'Law of Averages', why: '', keywords: [] },
          { id: 'd2', group: 'WORK ETHIC', text: 'Talk to Everyone, Knock Every Door', why: '', keywords: [] },
          { id: 'd3', group: 'ATTITUDE (FOCUS)', text: 'S.E.E. Factors', why: '', keywords: [] },
          { id: 'd4', group: 'ATTITUDE (FOCUS)', text: 'Smile, Eye Contact, Enthusiasm', why: '', keywords: [] },
          { id: 'd5', group: 'ATTITUDE (FOCUS)', text: 'Step Back Two or Three Steps After You Knock', why: 'Back off the door after you knock. It takes the pressure off whoever is inside, it puts you in their full view instead of on top of them, and it gives you the two seconds to reset your face before it opens.', keywords: ['step', 'steps', 'back', 'backup', 'back up', 'porch', 'doorstep', 'crowding', 'space'] },
          { id: 'd6', group: 'PURPOSE', text: 'Sense of Urgency', why: '', keywords: [] }
        ]
      },
      p: {
        key: 'p', title: 'Presentation', theme: 'PITCH',
        purpose: 'Getting through the presentation counts as a presentation.',
        items: [
          { id: 'p1', text: 'KISS vs KILL', why: '', keywords: [] },
          { id: 'p2', text: 'Keep it Stupid Simple vs Keep it long and lengthy', why: '', keywords: [] },
          { id: 'p3', text: 'Follow Structure', why: '', keywords: [] },
          { id: 'p4', text: 'S.E.E. Factors', why: '', keywords: [] },
          { id: 'p5', text: 'Tone, inflection, Conviction, Enthusiasm', why: '', keywords: [] },
          { id: 'p6', text: '60/40 (Business/Personal) Control conversation and build rapport', why: '', keywords: [] },
          { id: 'p7', text: 'Gather and discover (Internet provider, use it for, decision maker, needs & wants, etc.)', why: '', keywords: [] }
        ]
      },
      c: {
        key: 'c', title: 'Close', theme: 'ATTITUDE (FOCUS)',
        purpose: 'Asking for the business counts as a close. It is an attempted close, not a sale.',
        items: [
          { id: 'c1', text: 'Feel, Felt, Found', why: '', keywords: [] },
          { id: 'c2', text: 'A.I.R.', why: 'Air it out. The A is Agree, Address or Acknowledge, whichever one the situation calls for. Then Ignore the whole thing after that as if it never happened, and Return right back to where you were.', keywords: ['air', 'agree', 'address', 'acknowledge', 'ignore', 'return', 'loop', 'closing'] },
          { id: 'c3', text: 'Address (FFF), Acknowledge, Agree, Ignore, Return', why: '', keywords: [] },
          { id: 'c4', text: 'Assume The Sale', why: '', keywords: [] },
          { id: 'c5', text: 'Confidence', why: '', keywords: [] },
          { id: 'c6', text: 'Ask for Business', why: '', keywords: [] },
          { id: 'c7', text: 'Close 2x to 3x (Conviction, Break Eye Contact)', why: '', keywords: [] },
          { id: 'c8', text: 'Indifference (hesitation? Take it away)', why: '', keywords: [] }
        ]
      },
      a: {
        key: 'a', title: 'Accounts', theme: '',
        purpose: 'Work after the sale. Nothing here is tallied against D, P or C.',
        items: [
          { id: 'a1', text: 'Track Installs', why: '', keywords: [] },
          { id: 'a2', text: 'Courtesy Follow ups', why: '', keywords: [] },
          { id: 'a3', text: 'Customer Wrap up (quiz customer to confirm comprehension)', why: '', keywords: [] },
          { id: 'a4', text: 'Submit tickets (requests and customer issues): retention@turnerabrams.com', why: '', keywords: [] }
        ]
      }
    }
  };
}

export function setBoard(state, board) {
  const next = Object.assign({}, state || {});
  next.board = normalizeBoard(board);
  return next;
}

export function getBoard(state) {
  const b = state && state.board;
  if (b && b.columns && COLUMN_ORDER.every((k) => b.columns[k] && Array.isArray(b.columns[k].items))) {
    return b;
  }
  return defaultBoard();
}

export function isLoaded(state) {
  const b = getBoard(state);
  return !b.placeholder && COLUMN_ORDER.some((k) => b.columns[k].items.length > 0);
}

function normalizeBoard(board) {
  const out = {
    placeholder: !!(board && board.placeholder),
    title: (board && board.title) || 'Game board',
    columns: {}
  };
  COLUMN_ORDER.forEach((k) => {
    const src = (board && board.columns && board.columns[k]) || {};
    const items = Array.isArray(src.items) ? src.items : [];
    out.columns[k] = {
      key: k,
      title: src.title || COLUMN_NAMES[k],
      purpose: src.purpose || '',
      items: items.map((it, i) => ({
        id: (it && it.id) || `${k}${i + 1}`,
        text: String((it && it.text) != null ? it.text : ''),
        why: String((it && it.why) != null ? it.why : ''),
        keywords: Array.isArray(it && it.keywords) ? it.keywords.map(String) : []
      })).filter((it) => it.text.trim())
    };
  });
  return out;
}

// ---------------------------------------------------------------------------
// Parsing a pasted chart. Returns { ok, board, warnings }. Never throws.
// Item wording is preserved exactly. Only cell delimiters, surrounding
// whitespace, CSV quotes and leading list bullets are removed.
// ---------------------------------------------------------------------------

const HEADER_WORDS = {
  d: /^(?:d|doors?|door\s*knock(?:s|ing)?|knock(?:s|ing)?)$/i,
  p: /^(?:p|presentations?|presents?|presenting|pitch(?:es)?)$/i,
  c: /^(?:c|close|closes|closing|closer|asks?|asking)$/i
};

// Words allowed to sit next to a column word in a header without making it an item.
const HEADER_FILLER = /^(?:column|col|columns|stage|step|the|actions?|items?|list|board|\d+)$/i;

// Turn a header cell or line into a column key, or null. Accepts "D", "D: Doors",
// "Doors", "## Presentation", "C (Close)", "Close / Ask", "Column 3 Close".
// Rejects lines that merely START with a column word, like "Ask for the business",
// so real items are never swallowed as headers. Every token must be a column
// word or filler, and all column words must agree on one column.
function headerKey(cell) {
  let s = String(cell == null ? '' : cell).trim();
  if (!s) return null;
  s = s.replace(/^#+\s*/, '').replace(/^\*+|\*+$/g, '').replace(/^_+|_+$/g, '').trim();
  if (!s || s.length > 60) return null;
  const tokensList = s.split(/[\s:|,;/()\[\]\-–—.]+/).filter(Boolean);
  if (!tokensList.length || tokensList.length > 5) return null;
  let key = null;
  for (const t of tokensList) {
    let hit = null;
    for (const k of COLUMN_ORDER) if (HEADER_WORDS[k].test(t)) { hit = k; break; }
    if (hit) {
      if (key && key !== hit) return null; // "Door Close" is not a header
      key = hit;
    } else if (!HEADER_FILLER.test(t)) {
      return null;
    }
  }
  return key;
}

function headerTitle(cell, k) {
  // "D: Doors" -> "Doors". "Doors:" -> "Doors". "D" -> default name.
  let s = String(cell == null ? '' : cell).trim().replace(/^#+\s*/, '').replace(/^\*+|\*+$/g, '').replace(/^_+|_+$/g, '').trim();
  const m = s.match(/^[dpc]\s*[:|,;/\-–—.)(]+\s*(.+)$/i);
  if (m) s = m[1].trim();
  s = s.replace(/[)(\[\]]/g, '').replace(/^[\s:|,;/\-–—.]+|[\s:|,;/\-–—.]+$/g, '').trim();
  if (!s || /^[dpc]$/i.test(s)) return COLUMN_NAMES[k];
  return s;
}

function isWhyHeader(cell) {
  return /^\s*(?:why|reason|reasons|because|control|coaching|note|notes)\b/i.test(String(cell || ''));
}

function splitCsv(line) {
  const cells = [];
  let cur = '';
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (q && line[i + 1] === '"') { cur += '"'; i++; } else q = !q;
    } else if (ch === ',' && !q) {
      cells.push(cur.trim()); cur = '';
    } else cur += ch;
  }
  cells.push(cur.trim());
  return cells;
}

function splitTsv(line) {
  return line.split('\t').map((c) => c.trim());
}

function splitMd(line) {
  let s = line.trim();
  if (s.startsWith('|')) s = s.slice(1);
  if (s.endsWith('|')) s = s.slice(0, -1);
  return s.split('|').map((c) => c.trim());
}

function isMdSeparator(line) {
  return /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(line);
}

function stripBullet(s) {
  return String(s).replace(/^\s*(?:[-*•▪◦►·]|\d{1,3}[.)]|[a-zA-Z][.)])\s+/, '');
}

function emptyBoard() {
  const b = { placeholder: false, title: 'Game board', columns: {} };
  COLUMN_ORDER.forEach((k) => { b.columns[k] = { key: k, title: COLUMN_NAMES[k], purpose: '', items: [] }; });
  return b;
}

function detectFormat(lines) {
  const n = lines.length;
  const md = lines.filter((l) => /^\s*\|.*\|\s*$/.test(l) || isMdSeparator(l)).length;
  if (md >= 2 && md >= n * 0.6) return 'markdown';
  const tabs = lines.filter((l) => l.includes('\t')).length;
  if (tabs >= 1 && tabs >= n * 0.5) return 'tsv';
  const commas = lines.filter((l) => splitCsv(l).length >= 2).length;
  if (commas >= 2 && commas >= n * 0.6) return 'csv';
  return 'list';
}

export function boardFromText(text) {
  const warnings = [];
  const board = emptyBoard();
  try {
    const raw = String(text == null ? '' : text).replace(/\r\n?/g, '\n');
    const lines = raw.split('\n').filter((l) => l.trim());
    if (!lines.length) {
      return { ok: false, board, warnings: ['Nothing to read. Paste the chart first.'] };
    }

    const format = detectFormat(lines);
    let handled = false;

    if (format === 'markdown' || format === 'tsv' || format === 'csv') {
      const split = format === 'markdown' ? splitMd : (format === 'tsv' ? splitTsv : splitCsv);
      const rows = lines.filter((l) => !(format === 'markdown' && isMdSeparator(l))).map(split);
      handled = parseTable(rows, board, warnings, format);
      if (!handled) warnings.push(`Read this as ${format === 'csv' ? 'CSV' : format === 'tsv' ? 'a spreadsheet paste' : 'a markdown table'} but could not find two or more D, P, C headers in the first rows. Trying it as a headed list instead.`);
    }

    if (!handled) handled = parseList(lines, board, warnings);

    const counts = COLUMN_ORDER.map((k) => board.columns[k].items.length);
    const total = counts.reduce((a, b) => a + b, 0);
    if (!total) {
      warnings.push('No items found. Each column needs a header like D, P, C or Doors, Presentation, Close, with one action per line or per cell under it.');
      return { ok: false, board, warnings };
    }
    COLUMN_ORDER.forEach((k, i) => {
      if (!counts[i]) warnings.push(`${k.toUpperCase()} (${board.columns[k].title}) came through with no items.`);
    });

    // Assign ids and finish. Wording untouched.
    COLUMN_ORDER.forEach((k) => {
      board.columns[k].items = board.columns[k].items.map((it, i) => ({
        id: `${k}${i + 1}`, text: it.text, why: it.why || '', keywords: []
      }));
    });
    return { ok: true, board, warnings };
  } catch (e) {
    warnings.push('The chart could not be read. Nothing was changed.');
    return { ok: false, board: emptyBoard(), warnings };
  }
}

// Columnar table: header row has D/P/C cells, later rows carry items.
// Also accepts a two column layout: [column, item] or [column, item, why].
function parseTable(rows, board, warnings, format) {
  // Find the header row within the first 5 rows.
  let hIdx = -1;
  let keys = null;
  for (let i = 0; i < Math.min(rows.length, 5); i++) {
    const ks = rows[i].map(headerKey);
    if (new Set(ks.filter(Boolean)).size >= 2) { hIdx = i; keys = ks; break; }
  }

  if (keys) {
    const header = rows[hIdx];
    const whyCol = {};
    const seen = {};
    keys.forEach((k, idx) => {
      if (!k) return;
      if (seen[k]) { warnings.push(`Two headers point at ${k.toUpperCase()}. Both were merged into that column.`); }
      seen[k] = true;
      board.columns[k].title = headerTitle(header[idx], k);
      if (!keys[idx + 1] && isWhyHeader(header[idx + 1])) whyCol[idx] = idx + 1;
    });
    const unknown = header.filter((c, idx) => c && !keys[idx] && !Object.values(whyCol).includes(idx));
    if (unknown.length) warnings.push(`Ignored columns: ${unknown.join(', ')}.`);
    for (let r = hIdx + 1; r < rows.length; r++) {
      const cells = rows[r];
      keys.forEach((k, idx) => {
        if (!k) return;
        const cell = cells[idx];
        if (cell == null || !String(cell).trim()) return;
        const text = format === 'markdown' ? String(cell) : stripBullet(cell);
        const why = whyCol[idx] != null && cells[whyCol[idx]] ? String(cells[whyCol[idx]]) : '';
        board.columns[k].items.push({ text, why });
      });
    }
    return true;
  }

  // Two column layout: first cell names the column, second is the item.
  const tagged = rows.filter((r) => r.length >= 2 && headerKey(r[0]) && String(r[1] || '').trim());
  if (tagged.length >= 2 && tagged.length >= rows.length * 0.5) {
    rows.forEach((r) => {
      const k = headerKey(r[0]);
      if (!k) return;
      const text = String(r[1] || '').trim();
      if (!text) return;
      board.columns[k].items.push({ text: stripBullet(text), why: r[2] ? String(r[2]) : '' });
    });
    return true;
  }
  return false;
}

// Headed list: a line naming a column starts a section, following lines are items.
function parseList(lines, board, warnings) {
  let cur = null;
  let sawHeader = false;
  const orphans = [];
  for (const line of lines) {
    const t = line.trim();
    const bulletless = stripBullet(t);
    const isBulleted = bulletless !== t;
    let k = !isBulleted ? headerKey(t) : null;
    // A repeat of the column already open is an item, not a new header.
    // Under "C", a line reading just "Close" is his wording for an action.
    if (k && k === cur && !/^#/.test(t) && !/:$/.test(t)) k = null;
    // A header is short and names a column. "D" alone, "Doors", "P: Presentation", "## Close".
    if (k && t.length <= 60) {
      cur = k;
      sawHeader = true;
      board.columns[k].title = headerTitle(t, k);
      continue;
    }
    if (!cur) { orphans.push(t); continue; }
    board.columns[cur].items.push({ text: bulletless, why: '' });
  }
  if (orphans.length) warnings.push(`${orphans.length} line${orphans.length === 1 ? '' : 's'} before the first column header ${orphans.length === 1 ? 'was' : 'were'} skipped: ${orphans.slice(0, 2).join(' / ')}${orphans.length > 2 ? ' ...' : ''}`);
  if (!sawHeader) {
    warnings.push('No column headers found. Add a line with D, P or C (or Doors, Presentation, Close) above each group of actions.');
    return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// Matching. Reads only the loaded board data. No built in themes.
// ---------------------------------------------------------------------------

const STOP = new Set(('a an the and or but if of to in on at for with by from as is am are was were be been being ' +
  'i me my mine we our you your he she it its they their this that these those there here so too very just really ' +
  'about into out up down off over under again then than also not no yes do does did doing have has had having ' +
  'will would can could should shall may might must get got getting go going gonna want wanted keep keeps ' +
  'im ive dont cant wont didnt isnt arent thats whats what how when where why who which because feel feeling ' +
  'think thinking today right now still even like need needs').split(/\s+/));

function tokens(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w && !STOP.has(w))
    .map(stem);
}

function stem(w) {
  if (w.length <= 3) return w;
  return w.replace(/ies$/, 'y').replace(/(ing|ers?|ed|es|ly|s)$/, '');
}

export function matchBoard(board, input) {
  const result = { input: String(input || '').trim(), loaded: false, inBounds: false, item: null, column: null, score: 0, nearest: null };
  const hasItems = COLUMN_ORDER.some((k) => board.columns[k].items.length);
  result.loaded = !board.placeholder && hasItems;
  const words = tokens(input);
  if (!result.loaded || !words.length) return result;

  let best = null;
  COLUMN_ORDER.forEach((k) => {
    board.columns[k].items.forEach((item) => {
      const textTerms = new Set(tokens(item.text));
      const sideTerms = new Set(tokens(item.why).concat(tokens((item.keywords || []).join(' '))));
      let score = 0;
      words.forEach((w) => {
        if (textTerms.has(w)) score += 2;
        else if (sideTerms.has(w)) score += 1;
      });
      if (score > 0 && (!best || score > best.score)) best = { item, column: k, score };
    });
  });

  if (best && best.score >= 2) {
    result.inBounds = true;
    result.item = best.item;
    result.column = best.column;
    result.score = best.score;
  } else if (best) {
    result.nearest = best.item;
    result.column = best.column;
  }
  return result;
}

function findItem(board, id) {
  for (const k of COLUMN_ORDER) {
    const hit = board.columns[k].items.find((it) => it.id === id);
    if (hit) return hit;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Stats for the manager view
// ---------------------------------------------------------------------------

export function todayKey(d) {
  const dt = d instanceof Date ? d : new Date();
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
}

export function boardStats(state, dateKey) {
  const board = getBoard(state);
  const day = dateKey || todayKey();
  const work = (state && state.boardWork && state.boardWork[day]) || {};
  const log = (state && state.oobLog && state.oobLog[day]) || [];
  const columns = {};
  COLUMN_ORDER.forEach((k) => {
    const items = board.columns[k].items;
    const workedIds = items.filter((it) => work[it.id]).map((it) => it.id);
    columns[k] = { title: board.columns[k].title, total: items.length, worked: workedIds.length, workedIds };
  });
  return {
    date: day,
    placeholder: !!board.placeholder,
    loaded: isLoaded(state),
    columns,
    workedTotal: COLUMN_ORDER.reduce((n, k) => n + columns[k].worked, 0),
    itemTotal: COLUMN_ORDER.reduce((n, k) => n + columns[k].total, 0),
    outOfBounds: log.map((e) => ({
      text: e.text,
      nearestId: e.nearestId || null,
      nearestText: e.nearestId ? ((findItem(board, e.nearestId) || {}).text || '') : '',
      at: e.at
    })),
    outOfBoundsCount: log.length
  };
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

// Transient UI held in module memory so it survives re-renders driven by the
// host app's store subscription. Nothing here is persisted.
const ui = {
  pasteOpen: false,   // paste and preview screen visible
  pasteText: '',      // what is in the textarea
  pending: null,      // parsed board awaiting confirmation
  preview: null,      // last parse result shown in the preview
  verdictInput: ''    // last thing checked against the board, re-shown after re-render
};
let memoryState = null; // used only when no api is supplied

const OWNED_KEYS = ['board', 'boardWork', 'oobLog', 'control'];

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Push the next state out through whatever the host gave us.
// Returns true if the host will re-render on its own (store subscription).
function commit(api, next) {
  if (typeof api === 'function') { api(next); return false; }
  if (api && typeof api.commit === 'function') {
    api.commit((s) => {
      OWNED_KEYS.forEach((k) => { if (k in next) s[k] = next[k]; else delete s[k]; });
    });
    return true;
  }
  if (api && typeof api.setState === 'function') { api.setState(next); return false; }
  if (api && typeof api.update === 'function') { api.update(next); return false; }
  memoryState = next;
  return false;
}

function resolveToday(api) {
  if (api && typeof api.today === 'function') {
    try { const t = api.today(); if (t) return t; } catch (e) { /* ignore */ }
  }
  return todayKey();
}

function withWork(st, day, id, on) {
  const next = Object.assign({}, st);
  next.boardWork = Object.assign({}, st.boardWork || {});
  const today = Object.assign({}, next.boardWork[day] || {});
  if (on) today[id] = true; else delete today[id];
  next.boardWork[day] = today;
  return next;
}

export function renderBoard(el, state, api, opts) {
  if (!el) return;
  const o = opts || {};
  if (o.paste) ui.pasteOpen = true;
  const st = state || memoryState || {};
  const board = getBoard(st);
  const loaded = isLoaded(st);
  const day = resolveToday(api);
  const work = (st.boardWork && st.boardWork[day]) || {};
  const log = (st.oobLog && st.oobLog[day]) || [];
  const stats = boardStats(st, day);

  const apply = (next) => {
    const hostRenders = commit(api, next);
    if (!hostRenders) renderBoard(el, next, api);
  };

  // --- markup -------------------------------------------------------------

  const colsHtml = COLUMN_ORDER.map((k) => {
    const col = board.columns[k];
    let lastGroup = null;
    const itemsHtml = col.items.map((it) => {
      const on = !!work[it.id];
      let head = '';
      if ((it.group || null) !== lastGroup) {
        lastGroup = it.group || null;
        if (lastGroup) head = `<p class="board-group">${esc(lastGroup)}</p>`;
      }
      return head + `
        <button type="button" class="board-item${on ? ' worked' : ''}${board.placeholder ? ' stub' : ''}"
                data-item="${esc(it.id)}" aria-pressed="${on ? 'true' : 'false'}">
          <span class="board-item-check" aria-hidden="true">${on ? '✓' : ''}</span>
          <span class="board-item-body">
            <span class="board-item-text">${esc(it.text)}</span>
            ${it.why ? `<span class="board-item-why">${esc(it.why)}</span>` : ''}
          </span>
        </button>`;
    }).join('');
    return `
      <section class="board-col board-col-${k}" data-col="${k}">
        <header class="board-col-head">
          <div class="board-col-letter">${k.toUpperCase()}</div>
          <div class="board-col-titles">
            <h3 class="board-col-title">${esc(col.title)}</h3>
            ${col.purpose ? `<p class="board-col-purpose">${esc(col.purpose)}</p>` : ''}
          </div>
          <div class="board-col-count" aria-label="${stats.columns[k].worked} of ${stats.columns[k].total} worked">
            <strong>${stats.columns[k].worked}</strong><span>/${stats.columns[k].total}</span>
          </div>
        </header>
        <div class="board-items">${itemsHtml || '<p class="board-empty">No items in this column.</p>'}</div>
        ${col.theme ? `<p class="board-theme">${esc(col.theme)}</p>` : ''}
      </section>`;
  }).join('');

  const logHtml = log.length
    ? `<ul class="oob-log-list">${log.slice().reverse().map((e) => {
        const near = e.nearestId ? findItem(board, e.nearestId) : null;
        return `<li class="oob-log-item">
          <span class="oob-log-text">${esc(e.text)}</span>
          ${near ? `<span class="oob-log-near">Nearest board item: ${esc(near.text)}</span>` : ''}
        </li>`;
      }).join('')}</ul>`
    : '<p class="oob-log-empty">Nothing logged out of bounds today.</p>';

  const emptyStateHtml = `
    <section class="board-waiting" role="note">
      <h2 class="board-waiting-title">The game board is waiting on your chart.</h2>
      <p class="board-waiting-body">The three columns are ready. Paste the chart and it fills in. The items shown below are stubs so you can see the shape, nothing more.</p>
      <button type="button" class="board-paste-open btn-primary">Paste the chart</button>
    </section>`;

  const verdictMatch = ui.verdictInput ? matchBoard(board, ui.verdictInput) : null;
  const ctl = ui.verdictInput ? readControl(ui.verdictInput) : null;
  const flagged = !!(ctl && ctl.verdict === 'nocontrol' && ctl.confidence >= 0.55);
  const verdictCls = verdictMatch
    ? ` show ${flagged ? 'nocontrol' : !verdictMatch.loaded ? 'unloaded' : verdictMatch.inBounds ? 'in' : 'out'}`
    : '';

  const oobHtml = `
    <section class="oob" aria-labelledby="oob-title">
      ${fixHtml(st)}
      <h2 id="oob-title" class="oob-title">What is on your mind right now?</h2>
      <p class="oob-sub">${loaded
        ? 'Type it. The board will tell you if it is on the board or out of bounds.'
        : 'Type it. Once the chart is loaded the board will tell you if it is in bounds.'}</p>
      <form class="oob-form" autocomplete="off">
        <label class="visually-hidden" for="oob-input">What is on your mind</label>
        <input id="oob-input" class="oob-input" data-oob="input" type="text" inputmode="text" enterkeyhint="go" maxlength="200" />
        <button type="submit" class="oob-check btn-primary">Check the board</button>
      </form>
      <div class="oob-verdict${verdictCls}" aria-live="polite">${verdictMatch ? (flagged ? controlHtml(ctl) : verdictHtml(verdictMatch, board)) : ''}</div>
      <details class="oob-log"${log.length && verdictMatch && !verdictMatch.inBounds ? ' open' : ''}>
        <summary class="oob-log-summary">Out of bounds today: <strong>${log.length}</strong></summary>
        ${logHtml}
      </details>
    </section>`;

  el.innerHTML = `
    <div class="board${loaded ? '' : ' board-unloaded'}">
      ${loaded ? '' : emptyStateHtml}
      ${ui.pasteOpen ? pasteScreenHtml(ui.pasteText) : ''}
      ${oobHtml}
      <div class="board-cols">${colsHtml}</div>
      ${loaded ? `
      <div class="board-footer">
        <button type="button" class="board-paste-open btn-secondary">Replace the chart</button>
      </div>` : ''}
    </div>`;

  // --- wiring -------------------------------------------------------------

  el.querySelectorAll('.board-item').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-item');
      apply(withWork(st, day, id, !work[id]));
    });
  });

  el.querySelectorAll('.board-paste-open').forEach((b) => {
    b.addEventListener('click', () => {
      ui.pasteOpen = true;
      renderBoard(el, st, api);
      const ta = el.querySelector('.paste-text');
      if (ta) ta.focus();
    });
  });

  wirePasteScreen(el, st, api, apply);

  // Out of bounds check
  const form = el.querySelector('.oob-form');
  const input = el.querySelector('.oob-input');
  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    const m = matchBoard(board, text);
    ui.verdictInput = text;
    const cr = readControl(text);
    const isFlag = cr.verdict === 'nocontrol' && cr.confidence >= 0.55;
    if (isFlag) {
      /* A focus flag is its own record. It is not an out of bounds board miss,
         it is the rep handing their attitude to something they cannot move. */
      const next = Object.assign({}, st);
      next.control = Object.assign({}, st.control || {});
      next.control.log = ((st.control && st.control.log) || []).slice();
      logRead({ control: next.control }, (st.activeRep || null), cr, day);
      apply(next);
      return;
    }
    if (m.loaded && !m.inBounds) {
      // Log it so the pattern can be coached. The host re-render shows the verdict.
      const next = Object.assign({}, st);
      next.oobLog = Object.assign({}, st.oobLog || {});
      const list = (next.oobLog[day] || []).slice();
      list.push({ text, nearestId: m.nearest ? m.nearest.id : null, at: new Date().toISOString() });
      next.oobLog[day] = list;
      apply(next);
      return;
    }
    renderBoard(el, st, api);
    const again = el.querySelector('.oob-input');
    if (again && m.inBounds) again.value = '';
  });

  const mark = el.querySelector('.oob-verdict .oob-mark');
  if (mark && verdictMatch) {
    const id = verdictMatch.inBounds ? verdictMatch.item.id : (verdictMatch.nearest ? verdictMatch.nearest.id : null);
    mark.addEventListener('click', () => {
      ui.verdictInput = '';
      if (id) apply(withWork(st, day, id, true));
      else renderBoard(el, st, api);
    });
  }
  const dismiss = el.querySelector('.oob-verdict .oob-dismiss');
  if (dismiss) dismiss.addEventListener('click', () => { ui.verdictInput = ''; renderBoard(el, st, api); });
}

function fixHtml(st) {
  let f;
  try { f = fixation({ control: st.control || {} }, st.activeRep || null); }
  catch (_) { return ''; }
  if (!f || !f.today) return '';
  const top = f.top;
  const label = top ? subjectLabel(top.subject) : 'Outside your control';
  return `
    <div class="ctl-fix${f.repeating ? ' ctl-fix-hot' : ''}" role="status">
      <span class="ctl-fix-n">${f.today}</span>
      <span class="ctl-fix-t">${f.today === 1
        ? 'thing outside your control today'
        : 'things outside your control today'}${top && top.count > 1
        ? `. ${top.count} of them: ${esc(label.toLowerCase())}.` : '.'}</span>
      ${f.repeating ? '<span class="ctl-fix-flag">Same thought, three times. That is the pattern, not the day.</span>' : ''}
    </div>`;
}

function controlHtml(c) {
  const chain = `
    <ol class="ctl-chain" aria-label="What this costs you">
      <li>Focus goes to something you cannot move</li>
      <li>Attitude drops</li>
      <li>Pace drops</li>
      <li>The door that does open gets the worst version of you</li>
    </ol>`;
  return `
    <div class="oob-verdict-head ctl-head">${esc(subjectLabel(c.subject))}</div>
    <div class="oob-verdict-body">
      <p class="ctl-line">${esc(c.why)}</p>
      ${chain}
      <p class="ctl-redirect-l">Back on the board</p>
      <p class="ctl-redirect">${esc(c.redirect)}</p>
    </div>
    <div class="oob-verdict-actions">
      <button type="button" class="oob-dismiss btn-secondary">Got it, back to work</button>
    </div>`;
}

function verdictHtml(m, board) {
  if (!m.loaded) {
    return `
      <div class="oob-verdict-head">The board has not been loaded yet.</div>
      <div class="oob-verdict-body">
        <p class="oob-verdict-line">Until the real chart is in, there is nothing to check this against. Paste the chart and try again.</p>
      </div>
      <div class="oob-verdict-actions">
        <button type="button" class="board-paste-open btn-secondary">Paste the chart</button>
        <button type="button" class="oob-dismiss btn-secondary">Dismiss</button>
      </div>`;
  }
  if (m.inBounds) {
    return `
      <div class="oob-verdict-head">On the board. That is in bounds.</div>
      <div class="oob-verdict-body">
        <span class="oob-verdict-col">${esc(board.columns[m.column].title)}</span>
        <span class="oob-verdict-item">${esc(m.item.text)}</span>
        ${m.item.why ? `<span class="oob-verdict-why">${esc(m.item.why)}</span>` : ''}
      </div>
      <div class="oob-verdict-actions">
        <button type="button" class="oob-mark btn-secondary">Mark it worked</button>
        <button type="button" class="oob-dismiss btn-secondary">Dismiss</button>
      </div>`;
  }
  const near = m.nearest;
  return `
    <div class="oob-verdict-head">Out of bounds.</div>
    <div class="oob-verdict-body">
      <p class="oob-verdict-line">That is not on the board, so it cannot score. Only board items put points up.</p>
      ${near ? `
      <p class="oob-verdict-line">Nearest board item:</p>
      <span class="oob-verdict-col">${esc(board.columns[m.column].title)}</span>
      <span class="oob-verdict-item">${esc(near.text)}</span>
      ${near.why ? `<span class="oob-verdict-why">${esc(near.why)}</span>` : ''}`
      : '<p class="oob-verdict-line">Pick the board item closest to it and work that.</p>'}
    </div>
    <div class="oob-verdict-actions">
      ${near ? '<button type="button" class="oob-mark btn-secondary">Work that instead</button>' : ''}
      <button type="button" class="oob-dismiss btn-secondary">Dismiss</button>
    </div>`;
}

// ---------------------------------------------------------------------------
// Paste and preview screen
// ---------------------------------------------------------------------------

function pasteScreenHtml(text) {
  return `
    <section class="paste" aria-labelledby="paste-title">
      <div class="paste-head">
        <h2 id="paste-title" class="paste-title">Paste the chart</h2>
        <button type="button" class="paste-close btn-secondary" aria-label="Close">Close</button>
      </div>
      <p class="paste-help">Paste it straight from the spreadsheet, a CSV, a markdown table, or a plain list with a heading above each column. Headers can be D, P, C or Doors, Presentation, Close. Your wording is kept exactly as written.</p>
      <textarea class="paste-text" data-oob="paste" rows="10" spellcheck="false">${esc(text)}</textarea>
      <div class="paste-actions">
        <button type="button" class="paste-preview btn-primary">Preview</button>
      </div>
      <div class="paste-result">${ui.preview ? previewHtml(ui.preview) : ''}</div>
    </section>`;
}

function previewHtml(parsed) {
  const { ok, board, warnings } = parsed;
  const cols = COLUMN_ORDER.map((k) => {
    const col = board.columns[k];
    return `
      <div class="paste-col">
        <div class="paste-col-head">
          <span class="paste-col-letter">${k.toUpperCase()}</span>
          <span class="paste-col-title">${esc(col.title)}</span>
          <span class="paste-col-count">${col.items.length} item${col.items.length === 1 ? '' : 's'}</span>
        </div>
        ${col.items.length
          ? `<ol class="paste-col-items">${col.items.map((it) => `<li>${esc(it.text)}${it.why ? `<small>${esc(it.why)}</small>` : ''}</li>`).join('')}</ol>`
          : '<p class="paste-col-empty">Empty</p>'}
      </div>`;
  }).join('');
  const total = COLUMN_ORDER.reduce((n, k) => n + board.columns[k].items.length, 0);
  return `
    <div class="paste-preview-wrap">
      <h3 class="paste-preview-title">${ok ? `This is how it reads: ${total} item${total === 1 ? '' : 's'} across three columns.` : 'Could not read a board from that.'}</h3>
      ${warnings.length ? `<ul class="paste-warnings">${warnings.map((w) => `<li>${esc(w)}</li>`).join('')}</ul>` : ''}
      ${ok ? `<div class="paste-cols">${cols}</div>` : ''}
      ${ok ? `
      <div class="paste-confirm-actions">
        <button type="button" class="paste-confirm btn-primary">Use this board</button>
        <button type="button" class="paste-cancel btn-secondary">Go back and edit</button>
      </div>
      <p class="paste-confirm-note">Nothing changes until you confirm. Items worked today are kept by position in each column.</p>` : ''}
    </div>`;
}

function wirePasteScreen(el, st, api, apply) {
  const sec = el.querySelector('.paste');
  if (!sec) return;
  const ta = sec.querySelector('.paste-text');
  const result = sec.querySelector('.paste-result');

  ta.addEventListener('input', () => { ui.pasteText = ta.value; });

  sec.querySelector('.paste-close').addEventListener('click', () => {
    ui.pasteOpen = false; ui.pending = null; ui.preview = null;
    renderBoard(el, st, api);
  });

  const wireResult = () => {
    const confirm = result.querySelector('.paste-confirm');
    if (confirm) confirm.addEventListener('click', () => {
      if (!ui.pending) return;
      const next = setBoard(st, ui.pending);
      ui.pasteOpen = false; ui.pending = null; ui.preview = null; ui.pasteText = ''; ui.verdictInput = '';
      apply(next);
    });
    const cancel = result.querySelector('.paste-cancel');
    if (cancel) cancel.addEventListener('click', () => {
      ui.pending = null; ui.preview = null;
      result.innerHTML = '';
      ta.focus();
    });
  };

  sec.querySelector('.paste-preview').addEventListener('click', () => {
    ui.pasteText = ta.value;
    const parsed = boardFromText(ta.value);
    ui.pending = parsed.ok ? parsed.board : null;
    ui.preview = parsed;
    result.innerHTML = previewHtml(parsed);
    wireResult();
    if (typeof result.scrollIntoView === 'function') result.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  wireResult();
}
