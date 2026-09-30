/* control.js  (owner: main)
 *
 * The control layer. Decides whether what a rep typed puts their focus on
 * something they control or something they do not.
 *
 * The board matcher answers "is this on the chart". This answers a harder
 * question: "is this yours to act on". Those are different. "Nobody is
 * answering the doors" touches the Doors column by keyword and is still the
 * single most destructive thing a rep can be thinking, because it hands their
 * attitude to whoever is or is not home.
 *
 * Three layers, in order of confidence:
 *   1. Corpus match, phrase level, from control-corpus.js
 *   2. Structural read, who is the sentence making responsible
 *   3. Lexical fallback, subject markers and fixation markers
 *
 * Layer 2 is the one that generalises. It looks for the grammatical subject
 * of the complaint. If the actor is an occupant, the market, the weather, the
 * company, a competitor, the price, or luck, the rep has handed their focus
 * away. If the actor is the rep, it is theirs, even when it is self critical.
 *
 * No storage APIs. No network. Runs offline on a phone.
 */

import { CORPUS, THEMES } from "./control-corpus.js";

/* ------------------------------------------------------------------ */
/* normalise                                                           */
/* ------------------------------------------------------------------ */

const CONTRACTIONS = [
  [/\bain'?t\b/g, "is not"], [/\bcan'?t\b/g, "can not"], [/\bwon'?t\b/g, "will not"],
  [/\bdon'?t\b/g, "do not"], [/\bdoesn'?t\b/g, "does not"], [/\bdidn'?t\b/g, "did not"],
  [/\bisn'?t\b/g, "is not"], [/\baren'?t\b/g, "are not"], [/\bwasn'?t\b/g, "was not"],
  [/\bweren'?t\b/g, "were not"], [/\bhaven'?t\b/g, "have not"], [/\bhasn'?t\b/g, "has not"],
  [/\bnobody'?s\b/g, "nobody is"], [/\bnothing'?s\b/g, "nothing is"],
  [/\bthey'?re\b/g, "they are"], [/\bthey'?ve\b/g, "they have"],
  [/\bi'?m\b/g, "i am"], [/\bi'?ve\b/g, "i have"], [/\bi'?ll\b/g, "i will"],
  [/\bit'?s\b/g, "it is"], [/\bthat'?s\b/g, "that is"], [/\bthere'?s\b/g, "there is"],
  [/\bgonna\b/g, "going to"], [/\bgotta\b/g, "got to"], [/\bwanna\b/g, "want to"],
  [/\bcuz\b|\bcus\b|\bcoz\b/g, "because"], [/\bu\b/g, "you"], [/\bppl\b/g, "people"],
  [/\bno one\b/g, "nobody"], [/\bnoone\b/g, "nobody"], [/\bevery one\b/g, "everyone"],
  [/\bfuckin'?\b|\bfckin'?\b|\bfuggin'?\b/g, "fucking"],
];

export function normalise(s) {
  let t = String(s == null ? "" : s).toLowerCase();
  t = t.replace(/[\u2018\u2019\u02BC]/g, "'").replace(/[\u201C\u201D]/g, '"');
  CONTRACTIONS.forEach(([re, to]) => { t = t.replace(re, to); });
  t = t.replace(/[^a-z0-9'\s]/g, " ").replace(/\s+/g, " ").trim();
  return t;
}

const STOP = new Set(["the", "a", "an", "of", "to", "and", "is", "are", "am", "be",
  "was", "were", "it", "this", "that", "these", "those", "in", "on", "at", "for",
  "with", "as", "so", "but", "or", "if", "then", "just", "very", "really", "here"]);

export function words(s) {
  return normalise(s).split(" ").filter((w) => w && !STOP.has(w));
}

/* ------------------------------------------------------------------ */
/* layer 3 lexicon                                                     */
/* ------------------------------------------------------------------ */

/* Who the sentence hands responsibility to. */
const ACTORS = {
  occupant: ["nobody", "no body", "everybody", "everyone", "they", "them", "these people",
    "homeowner", "homeowners", "customer", "customers", "resident", "residents",
    "renters", "renter", "tenant", "tenants", "old lady", "old man", "dude", "lady",
    "guy", "kid", "dog", "dogs", "hoa", "neighbor", "neighbors",
    "people", "anyone", "anybody", "folks", "person", "somebody",
    "mf", "mfs", "mofos", "dudes", "clowns", "houses", "house", "door", "doors"],
  market: ["area", "neighborhood", "hood", "turf", "street", "block", "territory",
    "zone", "map", "subdivision", "complex", "apartments", "community", "town", "city",
    "market", "route", "section", "loop", "cul de sac", "side of town"],
  weather: ["weather", "rain", "raining", "rained", "hot", "heat", "cold", "freezing",
    "wind", "windy", "snow", "storm", "humid", "sun", "dark", "sunset"],
  company: ["company", "corporate", "office", "app", "system", "portal", "tablet",
    "promo", "promotion", "offer", "install", "installs", "installer", "tech", "techs",
    "scheduling", "credit check", "billing", "network", "footprint", "map data"],
  competitor: ["spectrum", "xfinity", "comcast", "att", "at t", "verizon", "tmobile",
    "starlink", "competitor", "other company", "cable company", "their provider"],
  price: ["price", "pricing", "cost", "expensive", "cheaper", "rate", "bill", "deal",
    "promo price", "too much", "budget", "broke", "money", "prices", "afford"],
  leadership: ["manager", "boss", "lead", "supervisor", "brian", "leadership", "upline"],
  teammate: ["teammate", "partner", "other rep", "other reps", "rest of the team",
    "everybody else", "other guys"],
  luck: ["luck", "lucky", "unlucky", "karma", "universe", "meant to be", "my day",
    "bad day", "rough day", "cursed", "jinxed"],
};

/* The rep pointing at themself. */
const SELF = ["i", "me", "my", "myself", "mine", "im", "i am",
  /* Subjectless self criticism. "Failing to discover what they need" has no
     pronoun, and it is still the rep talking about the rep. */
  "failing", "failing to", "forgetting", "forgetting to", "need to", "have to",
  "should", "gotta", "got to", "stopped", "keep", "kept", "trying to", "working on"];

/* Board vocabulary, the rep naming something they can act on. */
const BOARD_ACTS = ["knock", "knocking", "knocked", "door", "doors", "pace", "smile",
  "smiling", "eye contact", "enthusiasm", "urgency", "step back", "pitch", "tone",
  "inflection", "conviction", "structure", "rapport", "discover", "present",
  "presentation", "ask", "asking", "asked", "close", "closing", "confidence",
  "assume", "air", "agree", "address", "acknowledge", "ignore", "return",
  "feel felt found", "indifference", "follow up", "wrap up", "ticket", "install log",
  "focus", "attitude", "work ethic", "effort", "reps", "talk to everyone",
  "assuming", "presenting", "following up", "addressing", "discovering",
  "acknowledging", "agreeing", "ignoring", "returning", "stepping back",
  "skipping", "rushing", "slowing down", "resetting", "smiled", "greeted",
  "kiss", "sixty forty", "60 40", "law of averages", "see factors"];

/* Fixation, the grammar of being stuck on it. */
const FIXATION = ["nobody", "nothing", "never", "always", "every single", "all of them",
  "not one", "zero", "none", "waste of time", "pointless", "no point", "whats the point",
  "what is the point", "why bother", "cant win", "can not win", "impossible", "dead",
  "hopeless", "sucks", "trash", "garbage", "bullshit", "stupid", "hate", "tired of",
  "sick of", "over it", "done with", "screwed", "fucked", "worst",
  "ruining", "ruined", "ruins", "killing", "killin", "kills me", "everything",
  "bs", "some bs", "on some bs", "dry", "slow as", "nothin", "aint nobody",
  "aint no", "not a single", "wasting", "wasted", "brutal", "rough out here",
  "over here", "again", "typical", "same shit", "cant catch a break",
  "dogshit", "dog shit", "wack", "ass", "tripping", "trippin", "horrible",
  "terrible", "awful", "miserable", "pathetic", "joke", "clown", "cooked"];

/* Hedged blame. "Seems like the good streets went to someone else" carries no
   complaint word and is still the rep handing their day to the turf draw. The
   hedge is the tell: you only speculate about causes you cannot touch. Counts
   as fixation grammar whenever an outside actor is in the same sentence. */
const HEDGE = ["seems like", "seems", "seem like", "feels like", "feel like",
  "looks like", "look like", "i guess", "guess", "guessing", "i suppose",
  "suppose", "maybe", "probably", "i bet", "i wonder", "wondering", "wonder if",
  "i assume", "assume that", "must be", "no wonder", "figures", "of course",
  "why does", "why do", "why is", "why are", "why cant", "why can not",
  "is it even", "whats the use", "what is the use", "how am i supposed",
  "any point", "the point", "worth it", "when will", "when is", "how do we",
  "how are we", "what am i supposed", "who even", "does anyone"];

/* Plain movement and logistics. A rep narrating where they are is not fixating,
   even though street, map and turf are all outside their control. */
const MOTION = ["heading", "headed", "walking", "walked", "driving", "drove",
  "parked", "parking", "crossed", "crossing", "checking", "checked", "looking at",
  "on my way", "started", "starting", "finished", "logging", "logged", "entering",
  "sent", "submitted", "grabbing", "eating", "charging", "meeting", "shift",
  "called", "calling", "texted", "texting", "emailed", "messaged", "pinged"];

/* Resolution, the rep turning back to the board inside the same sentence. */
/* Forward action. The rep is already moving. This resolves on its own, no board
   keyword required, because "nobody is home, moving on" is the whole lesson. */
const RESOLUTION_MOVE = ["still going", "keep knocking", "keep going", "keep moving",
  "moving on", "move on", "next door", "next one", "on to the next", "onto the next",
  "back to it", "back at it", "so i am going to", "so i will", "i will just",
  "i am just going to", "going to keep", "gonna keep", "keep pushing", "keep grinding",
  "still out here", "still knocking", "not stopping", "keep it moving", "press on"];

/* Dismissal. Sounds like letting go, often is not. "They are never home anyway"
   is fixation wearing a shrug. Needs a real board action beside it to clear. */
const RESOLUTION_SHRUG = ["anyway", "any way", "regardless", "doesnt matter",
  "does not matter", "not my problem", "whatever", "oh well", "who cares"];

const RESOLUTION = RESOLUTION_MOVE.concat(RESOLUTION_SHRUG);

/* Plural tolerant. "street" must match "streets", "price" must match "prices",
   without writing every form into every lexicon. */
function has(hay, list) {
  return list.filter((p) => {
    const esc = p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp("(^| )" + esc + "(s|es)?( |$)");
    return re.test(hay);
  });
}

/* ------------------------------------------------------------------ */
/* layer 1, corpus                                                     */
/* ------------------------------------------------------------------ */

let INDEX = null;
function index() {
  if (INDEX) return INDEX;
  INDEX = CORPUS.map((e) => ({
    e, norm: normalise(e.text), set: new Set(words(e.text)),
  }));
  return INDEX;
}

function jaccard(a, b) {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  a.forEach((w) => { if (b.has(w)) inter += 1; });
  return inter / (a.size + b.size - inter);
}

function corpusMatch(input) {
  const norm = normalise(input);
  const set = new Set(words(input));
  let best = null;
  for (const row of index()) {
    if (row.norm === norm) return { entry: row.e, sim: 1, exact: true };
    let sim = jaccard(set, row.set);
    /* containment bonus, a rep often types the phrase plus noise */
    if (norm.includes(row.norm) && row.norm.length > 8) sim = Math.max(sim, 0.82);
    if (!best || sim > best.sim) best = { entry: row.e, sim, exact: false };
  }
  return best && best.sim >= 0.52 ? best : null;
}

/* ------------------------------------------------------------------ */
/* layer 2, structural read                                            */
/* ------------------------------------------------------------------ */

function structural(input) {
  const n = " " + normalise(input) + " ";
  const found = {};
  let externalHits = 0;
  Object.keys(ACTORS).forEach((k) => {
    const hits = has(n, ACTORS[k]);
    if (hits.length) { found[k] = hits; externalHits += hits.length; }
  });
  const selfHits = has(n, SELF);
  const boardHits = has(n, BOARD_ACTS);
  const fixHits = has(n, FIXATION);
  const resHits = has(n, RESOLUTION);
  const moveHits = has(n, RESOLUTION_MOVE);
  const hedgeHits = has(n, HEDGE);
  const motionHits = has(n, MOTION);

  /* Who does the sentence make responsible. Position matters: whoever shows up
     first is usually the grammatical subject of the complaint. */
  let firstExternal = Infinity, firstSelf = Infinity, subject = null;
  Object.keys(found).forEach((k) => {
    found[k].forEach((p) => {
      const i = n.indexOf(" " + p + " ");
      if (i > -1 && i < firstExternal) { firstExternal = i; subject = k; }
    });
  });
  selfHits.forEach((p) => {
    const i = n.indexOf(" " + p + " ");
    if (i > -1 && i < firstSelf) firstSelf = i;
  });

  return {
    found, subject, externalHits,
    selfHits, boardHits, fixHits, resHits, moveHits, hedgeHits, motionHits,
    selfFirst: firstSelf < firstExternal,
    externalFirst: firstExternal < firstSelf,
  };
}

/* ------------------------------------------------------------------ */
/* the call                                                            */
/* ------------------------------------------------------------------ */

/* Returns:
 * { verdict: 'nocontrol'|'control'|'neutral'|'unknown',
 *   confidence: 0..1, subject, theme, why, redirect, source, structure } */
export function readControl(input) {
  const raw = String(input == null ? "" : input).trim();
  const out = {
    input: raw, verdict: "unknown", confidence: 0, subject: null,
    theme: null, why: "", redirect: "", source: "none", structure: null,
  };
  if (!raw || words(raw).length === 0) return out;

  const st = structural(raw);
  out.structure = st;

  /* One word, and that word is something they cannot move. There is no other
     reading of it. A rep who types only "rain" is not reporting weather. */
  const solo = words(raw);
  if (solo.length <= 2 && st.externalHits && !st.boardHits.length &&
      !st.selfHits.length && !st.motionHits.length && !st.moveHits.length) {
    out.verdict = "nocontrol";
    out.confidence = 0.68;
    out.subject = st.subject;
    out.source = "solo";
    out.why = explain(out, st);
    out.redirect = redirect(out, st);
    return out;
  }

  /* Layer 1. A phrase we have literally seen before. */
  const cm = corpusMatch(raw);
  if (cm && (cm.exact || cm.sim >= 0.66)) {
    out.verdict = cm.entry.label;
    out.subject = cm.entry.subject || st.subject;
    out.theme = cm.entry.theme || null;
    out.confidence = cm.exact ? 0.98 : 0.62 + cm.sim * 0.3;
    out.source = "corpus";
  }

  /* Layer 2. Reason about it. This can override a weak corpus hit. */
  if (out.source === "none" || out.confidence < 0.8) {
    const sc = score(st);
    if (out.source === "none" || sc.confidence > out.confidence) {
      out.verdict = sc.verdict;
      out.confidence = sc.confidence;
      out.subject = sc.subject || out.subject;
      out.source = out.source === "corpus" ? "corpus+read" : "read";
      if (cm && cm.entry.theme && !out.theme) out.theme = cm.entry.theme;
    }
  }

  /* Resolution clause wins. Naming the uncontrollable and then turning back to
     the board is exactly what we are teaching, so it must never be flagged. */
  if (out.verdict === "nocontrol" &&
      (st.moveHits.length || (st.resHits.length && st.boardHits.length))) {
    out.verdict = "control";
    out.confidence = Math.max(0.72, out.confidence * 0.9);
    out.source += "+resolution";
    out.why = "You named it and turned straight back to the board. That is the move.";
  }

  if (!out.why) out.why = explain(out, st);
  out.redirect = redirect(out, st);
  return out;
}

function score(st) {
  let ext = 0, own = 0;
  ext += st.externalHits * 1.15;
  ext += st.fixHits.length * 1.4;
  /* A hedge only counts against the rep when there is an outside actor to
     hedge about. On its own it is just how people talk. */
  const hedged = st.hedgeHits.length && st.externalHits ? st.hedgeHits.length : 0;
  ext += hedged * 1.5;
  if (st.externalFirst && st.externalHits) ext += 1.1;
  if (st.subject === "occupant" || st.subject === "market") ext += 0.6;

  own += st.boardHits.length * 1.25;
  /* A possessive does not transfer control. "My luck", "my turf", "my area"
     are still things the rep cannot move, so the self credit is withdrawn when
     the only thing they claim is an uncontrollable and no board action. */
  const falseOwnership = !st.boardHits.length && !st.motionHits.length &&
    ["luck", "weather", "market", "occupant"].indexOf(st.subject) > -1;
  own += falseOwnership ? 0 : st.selfHits.length * 0.55;
  if (falseOwnership) ext += 1.2;
  if (st.selfFirst && st.selfHits.length && !falseOwnership) own += 0.7;
  /* Self criticism is control. "I am not asking for the business" is the most
     useful sentence a rep can type, and it must never read as a flag. */
  if (st.selfHits.length && st.boardHits.length) own += 1.5;
  if (falseOwnership) own = Math.max(0, own - 0.7);
  own += st.resHits.length * 1.0;

  const total = ext + own;
  if (st.moveHits.length && st.externalHits) {
    return { verdict: "control", confidence: 0.7, subject: "self" };
  }
  if (total < 1.2) return { verdict: "neutral", confidence: 0.4, subject: st.subject };
  /* Naming an outside thing is not the same as fixating on it. No fixation
     grammar and a weak external read means it is an observation, not a flag.
     Being wrong here costs the most, because it flags an honest rep in red. */
  /* Pure movement or logistics narration clears, even with turf words in it. */
  if (st.motionHits.length && !st.fixHits.length && !hedged && ext < 3.6) {
    return { verdict: "neutral", confidence: 0.5, subject: st.subject };
  }
  if (ext > own && ext < 2.4 && st.fixHits.length === 0 && !hedged) {
    return { verdict: "neutral", confidence: 0.45, subject: st.subject };
  }
  if (ext > own) {
    return {
      verdict: "nocontrol",
      confidence: Math.min(0.95, 0.5 + (ext - own) / (total + 1.6)),
      subject: st.subject,
    };
  }
  if (own > ext) {
    return {
      verdict: "control",
      confidence: Math.min(0.95, 0.5 + (own - ext) / (total + 1.6)),
      subject: st.selfHits.length ? "self" : "process",
    };
  }
  return { verdict: "neutral", confidence: 0.45, subject: st.subject };
}

/* ------------------------------------------------------------------ */
/* the consequence copy                                                */
/* ------------------------------------------------------------------ */

const CHAIN = "Focus goes there, attitude drops, pace drops. Then the door that does open gets the worst version of you.";

const BY_SUBJECT = {
  occupant: {
    label: "Who answers is not yours",
    why: "You cannot make anyone open a door. " + CHAIN,
    redirect: "Knock the next one. Step back two or three steps. Smile before it opens.",
  },
  market: {
    label: "The turf is not yours",
    why: "The map was set before you got out of the truck. " + CHAIN,
    redirect: "Law of averages does not care which street it is. Talk to everyone on this one.",
  },
  weather: {
    label: "The weather is not yours",
    why: "It is the same weather for everyone out here. " + CHAIN,
    redirect: "Pace is still yours. So is the smile when the door opens.",
  },
  company: {
    label: "That one is not yours",
    why: "Systems, installs and promos sit above your pay grade today. " + CHAIN,
    redirect: "Submit the ticket, then get back on the doors. Nothing else moves it.",
  },
  competitor: {
    label: "Their offer is not yours",
    why: "You cannot price a competitor from a porch. " + CHAIN,
    redirect: "Run your pitch. Conviction beats a price sheet more often than you think.",
  },
  price: {
    label: "The price is not yours",
    why: "You did not set it and you cannot change it today. " + CHAIN,
    redirect: "Feel, felt, found. Then ask again. Close two to three times.",
  },
  leadership: {
    label: "That call was not yours",
    why: "Turf and decisions come from above you. " + CHAIN,
    redirect: "Put it in a ticket and let it go. The board is where your day gets won.",
  },
  teammate: {
    label: "Their numbers are not yours",
    why: "Nothing on another rep's sheet moves yours. " + CHAIN,
    redirect: "Your D, your P, your asks. That is the whole scoreboard.",
  },
  luck: {
    label: "Luck is not a strategy",
    why: "Law of averages is the only luck out here, and it runs on door count. " + CHAIN,
    redirect: "More doors. That is the entire fix.",
  },
  product: {
    label: "The product is not yours",
    why: "You sell what is on the truck. " + CHAIN,
    redirect: "Gather and discover. Find the need this product actually fits.",
  },
};

function explain(out, st) {
  if (out.verdict === "nocontrol") {
    const b = BY_SUBJECT[out.subject];
    return b ? b.why : "That sits outside your control. " + CHAIN;
  }
  if (out.verdict === "control") {
    if (st.selfHits.length && st.boardHits.length) {
      return "That is yours and it is on the board. Naming it is how it gets fixed.";
    }
    return "That is on the board. It is yours to run.";
  }
  return "Nothing on the board and nothing costing you focus. Carry on.";
}

function redirect(out, st) {
  if (out.verdict !== "nocontrol") return "";
  const b = BY_SUBJECT[out.subject];
  return b ? b.redirect : "Get back on the board. Doors, pitch, ask.";
}

export function subjectLabel(subject) {
  const b = BY_SUBJECT[subject];
  return b ? b.label : "Outside your control";
}

/* ------------------------------------------------------------------ */
/* fixation tracking                                                   */
/* ------------------------------------------------------------------ */

/* Same thought, over and over, is the real signal. One bad moment is human.
   Four in a day is a pattern and the manager should see it. */
export function ensureControl(state) {
  if (!state) return null;
  if (!state.control || typeof state.control !== "object") state.control = {};
  if (!Array.isArray(state.control.log)) state.control.log = [];
  state.control.log = state.control.log.slice(-400);
  return state.control;
}

/* Local calendar day. The UTC date rolls over at 8pm Eastern, which used to
   reset the repeat count every evening while reps were still knocking. */
function localDay() {
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

export function logRead(state, repId, read, dayKey) {
  const c = ensureControl(state);
  if (!c || !read || read.verdict === "unknown") return;
  c.log.push({
    id: "c" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
    rep: repId || null, day: dayKey || localDay(),
    v: read.verdict, subject: read.subject || null, theme: read.theme || null,
    text: String(read.input).slice(0, 160), at: new Date().toISOString(),
  });
  c.log = c.log.slice(-400);
}

export function fixation(state, repId, dayKey) {
  const c = ensureControl(state);
  const day = dayKey || localDay();
  const mine = c.log.filter((e) => e.v === "nocontrol" && (!repId || e.rep === repId));
  const todayList = mine.filter((e) => e.day === day);
  const bySubject = {};
  todayList.forEach((e) => {
    const k = e.subject || "other";
    bySubject[k] = (bySubject[k] || 0) + 1;
  });
  let top = null;
  Object.keys(bySubject).forEach((k) => {
    if (!top || bySubject[k] > top.count) top = { subject: k, count: bySubject[k] };
  });
  return {
    today: todayList.length,
    total: mine.length,
    top,
    repeating: !!(top && top.count >= 3),
    themes: THEMES,
  };
}
