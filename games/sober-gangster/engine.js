/* SOBER GANGSTER — game engine (Recovery Misfits). Locked Up, Covered Up, or Sobered Up.
   v3: the day is simple now.
     MORNING  a Life on Life's Terms card (what happened while you slept) sets your heat for the day,
              then a scenario lands (if nothing is already hanging over you).
     DAY      3 moves. Each move does something to the scenario, and every choice costs something.
     NIGHT    food, rent, heat creeps up if you skipped the sober stuff, an ignored scenario adds heat,
              and if heat is over the safe line the cops might show up. Locked up = back to level 1.
   Cards live in cards.js. Every tunable number is in CFG. Buildless; loaded by index.html and test.cjs. */

const VERSION = 'v3.1';
const SAVE_KEY = 'sober-gangster-v3';

const CFG = {
  days: 30,
  actions: 3,
  startCash: 40,
  startStress: 30,
  startConnection: 30,
  food: 12,              // every night
  rent: 210,             // every rentDays
  rentDays: 7,
  bedLossArrears: 420,
  bedLossWarnings: 3,
  balance: { stress: 70, connection: 30 },   // a balanced day: under this stress, at least this connection, heat at or under safe
  supportScale: 0.7,     // sober support inside a scenario: its heat drop is scaled down so it isn't a free win
  heat: {
    start: 10,
    safe: 45,
    maxOdds: 0.4,                 // chance of the cops at heat 100
    noSupport: [0, 4, 7, 10, 13], // nightly heat by days since you did anything sober (caps at the last one)
    noRest: 3,
    maxedStress: 75, maxedStressHeat: 6,
    aloneBelow: 20, aloneHeat: 6,
    repeatShift: [0, 6, 9],       // heat for the 2nd and 3rd shift in one day
    call: -6, callConnection: 3, callSoftens: 0.5
  },
  // moves when nothing is hanging over you
  base: {
    rest:   { h: -5, s: -16, n: 0 },
    responsibility: { h: -5, s: -6, n: 0 },
    support: { h: -12, s: -8, n: 12 },
    help:   { h: -7, s: -6, n: 8, meal: 15, mealBelow: 25 },
    job:    { h: 0, s: 5, n: 0 }
  }
};

const LEVELS = [
  { n: 1, name: 'Fresh off the bus', housing: 'Sober house' },
  { n: 2, name: 'Working',        housing: 'Rented room',     need: { balanced: 5,  job: 1 } },
  { n: 3, name: 'Stacking money', housing: 'First apartment', need: { balanced: 11, job: 2, cash: 350 } },
  { n: 4, name: 'Moved out',      housing: 'My own place',    need: { balanced: 18, job: 3, cash: 500, noDebt: true } }
];
const FIGURES = [
  { id: 'lil-smoke',   name: 'Lil Smoke',   sex: 'guy',  who: 'Early 20s. Neck tattoo. Talks tough, hates the quiet.' },
  { id: 'lady-ink',    name: 'Lady Ink',    sex: 'girl', who: 'Late 20s. Sleeves of ink. Wants her own shop one day.' },
  { id: 'big-country', name: 'Big Country', sex: 'guy',  who: 'Farm boy, 30s. Lost his license. Rides a bike now.' },
  { id: 'suit',        name: 'Suit',        sex: 'guy',  who: '40s. Lost the corner office. Still has the briefcase.' },
  { id: 'pops',        name: 'Pops',        sex: 'guy',  who: '60s. Second chance. Makes the coffee for everybody.' },
  { id: 'soccer-mom',  name: 'Soccer Mom',  sex: 'girl', who: 'Late 30s. Big sunglasses. Wants her kids back.' },
  { id: 'nurse-nikki', name: 'Nurse Nikki', sex: 'girl', who: 'Early 30s. Lost her nursing license. Wants it back.' },
  { id: 'party-girl',  name: 'Party Girl',  sex: 'girl', who: '24. Lots of rings. The party ended. She didn’t.' }
];
const jobs = [
  { name: 'Day labor',   wage: 75,  stress: 10 },
  { name: 'Dishwasher',  wage: 85,  stress: 11 },
  { name: 'Stock crew',  wage: 100, stress: 12 },
  { name: 'Maintenance', wage: 120, stress: 13 }
];
const shop = [
  { id: 'cut',     name: 'Fresh cut',        price: 30,  group: 'feel', feel: 6,  desc: 'Lineup so sharp it has a credit score.' },
  { id: 'trim',    name: 'Beard trim',       price: 20,  group: 'feel', feel: 4,  desc: 'Shape it up. Chin visible again.', guyOnly: true },
  { id: 'hat',     name: 'Flat-bill hat',    price: 35,  group: 'feel', feel: 3,  desc: 'Pure style. No magic odds.' },
  { id: 'shades',  name: 'Sunglasses',       price: 40,  group: 'feel', feel: 3,  desc: 'Nobody can see you squint.' },
  { id: 'tee',     name: 'New white tee',    price: 25,  group: 'feel', feel: 3,  desc: 'Crisp. For about a day.' },
  { id: 'hoodie',  name: 'Hoodie',           price: 60,  group: 'feel', feel: 4,  desc: 'The uniform.' },
  { id: 'jeans',   name: 'Real pants',       price: 55,  group: 'feel', feel: 4,  desc: 'Jeans. With a belt. Look at you.' },
  { id: 'dunks',   name: 'Fresh kicks',      price: 90,  group: 'feel', feel: 8,  desc: 'Clean. Everybody in the house is going to say something.' },
  { id: 'cologne', name: 'Cologne',          price: 45,  group: 'feel', feel: 5,  desc: 'You smell like a job interview.' },
  { id: 'shoes',   name: 'Work boots',       price: 70,  group: 'big', desc: 'Unlocks stock crew and maintenance.' },
  { id: 'phone',   name: 'Cracked phone',    price: 90,  group: 'big', desc: 'People can call you back. Unlocks better work. Also: the plug can text you.' },
  { id: 'phone2',  name: 'New phone',        price: 300, group: 'big', minLevel: 2, feel: 5, desc: 'Buzzes more.', upgrades: 'phone' },
  { id: 'phone3',  name: 'Newest phone',     price: 700, group: 'big', minLevel: 3, feel: 6, desc: 'Buzzes constantly. You love it.', upgrades: 'phone2' },
  { id: 'chain',   name: 'Chain (fake)',     price: 50,  group: 'big', feel: 4, desc: 'Turns your neck green by Thursday.' },
  { id: 'chain2',  name: 'Chain (real)',     price: 600, group: 'big', minLevel: 3, feel: 8, desc: 'Gold. Actual gold.', upgrades: 'chain' },
  { id: 'tattoo',  name: 'Small tattoo',     price: 150, group: 'big', minLevel: 2, feel: 5, desc: 'Something that means something.' },
  { id: 'tattoo2', name: 'Sleeve',           price: 900, group: 'big', minLevel: 3, feel: 10, desc: 'Three sittings. Worth it.', upgrades: 'tattoo' },
  { id: 'watch',   name: 'Watch',            price: 120, group: 'big', minLevel: 2, feel: 3, desc: 'Shows up on time now. Allegedly.' },
  { id: 'pass',    name: 'Bus pass',         price: 60,  group: 'big', desc: 'Two hours of your life back every day. Takes the edge off: −5 stress.' },
  { id: 'bike',    name: 'Bike',             price: 200, group: 'big', minLevel: 2, feel: 4, desc: 'Beats the bus. Beats walking.' },
  { id: 'dresser', name: 'Actual dresser',   price: 80,  group: 'big', desc: 'Taking a breath takes off 4 more stress.' },
  { id: 'car',     name: 'Beater car',       price: 600, group: 'save', minLevel: 2, desc: 'Unlocks maintenance work.' },
  { id: 'car2',    name: 'Nice car',         price: 2500, group: 'save', minLevel: 4, feel: 12, desc: 'The one you park where people can see it.', upgrades: 'car' },
  { id: 'couch',   name: 'A non-curb couch', price: 200, group: 'save', minLevel: 2, feel: 4, desc: 'Your room finally feels like home.' },
  { id: 'tv',      name: 'TV',               price: 300, group: 'save', minLevel: 2, feel: 4, desc: 'Something to not watch.' },
  { id: 'dog',     name: 'The dog',          price: 350, group: 'save', minLevel: 3, feel: 10, desc: 'Vet bills, chewed shoes, and the best welcome home you’ve ever had.' }
];
const SHOP_GROUPS = [['feel', 'FEEL GOOD', 'Cheap. Feels good today.'], ['big', 'BIGGER', 'Opens doors, or just looks right.'], ['save', 'BIG SAVES', 'The stuff you work a month for.']];
const ACTION_IDS = ['work', 'rest', 'responsibility', 'support', 'help', 'job'];

function item(id) { return shop.find(x => x.id === id); }
function has(s, id) { return s.items.includes(id); }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function rng(s) { s.seed = (1664525 * s.seed + 1013904223) >>> 0; return s.seed / 4294967296; }
function record(s, t) { s.log.unshift(t); s.log = s.log.slice(0, 120); }
function badge(s, b) { if (!s.milestones.includes(b)) s.milestones.push(b); }
function levelInfo(n) { return LEVELS[Math.max(1, Math.min(4, n)) - 1]; }

function fresh(seed = Date.now()) {
  return {
    version: 3, seed: seed >>> 0,
    day: 1, actions: CFG.actions,
    cash: CFG.startCash, stress: CFG.startStress, connection: CFG.startConnection, heat: CFG.heat.start,
    job: 0, housing: 'Sober house', level: 1, balanced: 0, levelUp: null,
    items: [], arrears: 0, warnings: 0, chores: 0,
    workToday: 0, restToday: false, supportToday: false, calledToday: false,
    streak: 0, bestStreak: 0, daysSinceSupport: 0,
    flags: [], milestones: [], log: ['A bed. Forty bucks. A garbage bag. Let’s build from here.'],
    scen: null,            // { id, left } — the scenario hanging over you, and how many nights it has left
    seenScen: [],
    night: null,           // id of last night's Life on Life's Terms card (shown this morning)
    show: [],              // what the page still has to pop up this morning: 'night', 'scen'
    lastOutcome: null, result: null, lockedUp: null,
    look: { fig: null, sex: 'guy', done: false },
    settings: { mute: false, introSeen: false }
  };
}
function migrate(raw) {
  if (!raw || typeof raw !== 'object' || raw.version !== 3) return null;
  const f = fresh();
  for (const k of Object.keys(f)) if (raw[k] === undefined) raw[k] = f[k];
  if (!FIGURES.find(x => x.id === raw.look.fig)) raw.look.done = false;
  if (raw.scen && !SCENARIOS.find(x => x.id === raw.scen.id)) raw.scen = null;
  return raw;
}
function restartKeepFigure(s, seed) {
  const n = fresh(seed);
  if (s && s.look && s.look.fig) n.look = { ...s.look, done: true };
  n.settings = { ...n.settings, ...(s && s.settings), introSeen: true };
  startDay(n, true);
  return n;
}

/* ---------- cards ---------- */
function scenById(id) { return SCENARIOS.find(x => x.id === id); }
// the scenario as this player reads it (the two love ones flip for girl homies)
function scenFor(s, id) {
  const base = scenById(id); if (!base) return null;
  const f = s.look.sex === 'girl' && FEMALE[id];
  if (!f) return base;
  const sw = t => f.swap.reduce((a, [re, to]) => a.replace(re, to), t);
  const moves = {};
  for (const k of ACTION_IDS) { const m = base.moves[k]; moves[k] = { ...m, gain: sw(m.gain), lose: sw(m.lose), say: sw(m.say) }; }
  return { ...base, title: f.title || base.title, setup: f.setup || base.setup, moves, expire: { ...base.expire, text: sw(base.expire.text) } };
}
function nightCard(id) { return NIGHTS.find(x => x.id === id); }
function pickNight(s) {
  const pool = NIGHTS.map(c => ({ c, w: c.like(s) })).filter(x => x.w >= 0).map(x => ({ c: x.c, w: 1 + x.w }));
  let r = rng(s) * pool.reduce((a, x) => a + x.w, 0);
  for (const x of pool) { r -= x.w; if (r <= 0) return x.c; }
  return pool[pool.length - 1].c;
}
function pickScen(s) {
  let pool = SCENARIOS.filter(c => !s.seenScen.includes(c.id));
  if (!pool.length) { s.seenScen = []; pool = SCENARIOS.slice(); }
  const c = pool[Math.floor(rng(s) * pool.length)];
  s.seenScen.push(c.id);
  return c;
}
function apply(s, e) {
  s.heat = clamp(s.heat + (e.h || 0), 0, 100);
  s.cash = Math.max(0, s.cash + (e.c || 0));
  s.stress = clamp(s.stress + (e.s || 0), 0, 100);
  s.connection = clamp(s.connection + (e.n || 0), 0, 100);
}

// MORNING. first = the very first day (no night card yet).
function startDay(s, first = false, picked = null) {
  s.show = [];
  if (!first) {
    const n = picked || pickNight(s);
    s.night = n.id; apply(s, { h: n.heat, s: n.stress });
    record(s, 'Night: ' + n.title + ' (heat ' + (n.heat > 0 ? '+' : '') + n.heat + ').');
    s.show.push('night');
  }
  if (!s.scen) {
    const c = pickScen(s);
    s.scen = { id: c.id, left: c.days };
    apply(s, { h: c.now });
    if (SCEN_SETS[c.id] && !s.flags.includes(SCEN_SETS[c.id])) s.flags.push(SCEN_SETS[c.id]);
    record(s, 'New trouble: ' + c.title + ' (heat +' + c.now + ').');
    s.show.push('scen');
  } else s.show.push('scen');   // still hanging over you: show it again
}

/* ---------- moves ---------- */
function jobHuntTarget(s) {
  if (!has(s, 'phone')) return Math.max(s.job, 1);
  if (has(s, 'car')) return 3;
  if (has(s, 'shoes')) return 2;
  return 1;
}
function rentDue() { return CFG.rent; }
function nextRentDay(s) { return Math.ceil(s.day / CFG.rentDays) * CFG.rentDays; }

// what a move will do right now — the page shows this on the button before you tap it
function preview(s, id) {
  const H = CFG.heat, j = jobs[Math.max(0, s.job)];
  let e, end = false, scen = null;
  if (s.scen) {
    scen = scenFor(s, s.scen.id); const m = scen.moves[id];
    e = { h: m.h, c: m.c, s: m.s, n: m.n }; end = m.end;
    if (id === 'support') e.h = Math.round(m.h * CFG.supportScale);
    if (id === 'work') e.c = j.wage;
  } else {
    const b = CFG.base[id] || {};
    e = { h: b.h || 0, c: 0, s: b.s || 0, n: b.n || 0 };
    if (id === 'work') { e.c = j.wage; e.s = j.stress; }
    if (id === 'help' && s.cash < b.mealBelow) e.c = b.meal;
  }
  if (id === 'work' && s.workToday) { e.h += H.repeatShift[Math.min(s.workToday, H.repeatShift.length - 1)]; e.s += 6; e.n -= 3; }
  if (id === 'rest' && has(s, 'dresser')) e.s -= 4;
  return { e, end, scen };
}
function canDo(s, id) {
  if (s.actions < 1 || s.result || s.lockedUp) return false;
  const { e } = preview(s, id);
  return s.cash + (e.c || 0) >= 0;
}
// do it. returns { say, gain, lose, end, e } for the result pop-up, or null.
function action(s, id) {
  if (!canDo(s, id)) return null;
  const { e, end, scen } = preview(s, id);
  s.actions--;
  apply(s, e);
  if (id === 'work') s.workToday++;
  if (id === 'rest') s.restToday = true;
  if (id === 'support' || id === 'help') { s.supportToday = true; s.daysSinceSupport = 0; }
  if (id === 'responsibility') {
    s.chores++; s.warnings = Math.max(0, s.warnings - 1);
    const pay = Math.min(s.cash, s.arrears); s.cash -= pay; s.arrears -= pay;
  }
  if (id === 'job') { const t = jobHuntTarget(s); if (t > s.job) { s.job = t; record(s, 'New job: ' + jobs[t].name + '.'); } }
  let out;
  if (scen) {
    const m = scen.moves[id], g = SCEN_GIVES[scen.id + '.' + id];
    if (g) { if (g.item && !has(s, g.item)) s.items.push(g.item); if (g.debt) s.arrears += g.debt; if (g.flag && !s.flags.includes(g.flag)) s.flags.push(g.flag); if (g.unflag) s.flags = s.flags.filter(f => f !== g.unflag); }
    if (end) { s.scen = null; badge(s, 'Dealt with: ' + scen.title.toLowerCase() + '.'); }
    record(s, scen.title + ' — ' + ACTION_LABEL[id] + '. ' + m.say);
    out = { say: m.say, gain: m.gain, lose: m.lose, end, e, title: scen.title };
  } else {
    const says = { work: jobs[Math.max(0, s.job)].name + '. Clocked in, clocked out.', rest: 'You sat with it. The world kept turning.', responsibility: 'Chores done. Bills looked at. Bed kept.', support: 'A meeting, a coffee, the truth out loud.', help: 'You asked. Somebody showed up.', job: s.job ? 'Working as ' + jobs[s.job].name.toLowerCase() + ' now.' : 'Nothing better yet.' };
    record(s, says[id]);
    out = { say: says[id], gain: '', lose: '', end: false, e, title: ACTION_LABEL[id] };
  }
  s.lastOutcome = out.say;
  return out;
}
const ACTION_LABEL = { work: 'Work a shift', rest: 'Take a breath', responsibility: 'Handle your stuff', support: 'Sober support', help: 'Ask for help', job: 'Better work' };

function call(s) {
  if (s.result || s.lockedUp || s.calledToday) return false;
  apply(s, { h: CFG.heat.call, n: CFG.heat.callConnection });
  s.calledToday = true;
  record(s, 'Sober call. Two minutes. Heat ' + CFG.heat.call + '.');
  return true;
}
function buy(s, id) {
  if (cantBuy(s, id)) return false;
  const p = item(id);
  s.actions--; s.cash -= p.price; s.items.push(id);
  apply(s, { s: -(p.feel || 0) - (id === 'pass' ? 5 : 0) });
  record(s, 'Bought ' + p.name + '.');
  return true;
}
function cantBuy(s, id) {
  const p = item(id);
  if (!p) return 'no such thing';
  if (has(s, id)) return 'owned';
  if (p.guyOnly && s.look.sex !== 'guy') return 'n/a';
  if ((p.minLevel || 1) > s.level) return 'level ' + p.minLevel;
  if (p.upgrades && !has(s, p.upgrades)) return 'needs ' + item(p.upgrades).name.toLowerCase() + ' first';
  if (s.result || s.lockedUp) return 'chapter over';
  if (s.actions < 1) return 'no moves left today';
  if (s.cash < p.price) return 'short $' + (p.price - s.cash);
  return '';
}

/* ---------- levels ---------- */
function nextNeeds(s) {
  const L = LEVELS[s.level]; if (!L) return [];
  const a = [], n = L.need;
  if (s.balanced < n.balanced) a.push((n.balanced - s.balanced) + ' more balanced day' + (n.balanced - s.balanced === 1 ? '' : 's'));
  if (s.job < n.job) a.push(jobs[n.job].name.toLowerCase() + ' job');
  if (n.cash && s.cash < n.cash) a.push('$' + n.cash + ' saved');
  if (n.noDebt && s.arrears > 0) a.push('rent paid up');
  return a;
}
function checkLevel(s) {
  let up = false;
  while (s.level < 4 && !nextNeeds(s).length) {
    s.level++; up = true;
    if (s.housing !== 'Temporary shelter') s.housing = levelInfo(s.level).housing;
    badge(s, 'Level ' + s.level + ': ' + levelInfo(s.level).name + '.');
    record(s, 'LEVEL UP: ' + levelInfo(s.level).name + '.');
  }
  if (up) s.levelUp = s.level;
  return up;
}

/* ---------- night ---------- */
function lockOdds(s) { const h = CFG.heat; return s.heat <= h.safe ? 0 : Math.min(h.maxOdds, (s.heat - h.safe) / (100 - h.safe) * h.maxOdds); }
function heatWords(s) { return s.heat <= CFG.heat.safe ? 'You’re good.' : s.heat < 70 ? 'Watch it.' : 'Tonight’s a gamble.'; }

function endDay(s) {
  if (s.result || s.lockedUp) return false;
  const H = CFG.heat;
  s.cash -= Math.min(s.cash, CFG.food);
  if (!s.restToday) apply(s, { h: H.noRest, s: 5 });
  if (!s.supportToday && !s.calledToday) s.daysSinceSupport++;
  if (!s.supportToday) {
    const add = Math.round(H.noSupport[Math.min(s.daysSinceSupport, H.noSupport.length - 1)] * (s.calledToday ? H.callSoftens : 1));
    if (add) { apply(s, { h: add }); record(s, s.daysSinceSupport + ' day' + (s.daysSinceSupport === 1 ? '' : 's') + ' without the sober stuff: +' + add + ' heat.'); }
  }
  if (s.stress >= H.maxedStress) apply(s, { h: H.maxedStressHeat });
  if (s.connection < H.aloneBelow) apply(s, { h: H.aloneHeat });
  apply(s, { n: -3 });
  // the scenario you left hanging
  if (s.scen) {
    const c = scenFor(s, s.scen.id);
    apply(s, { h: c.daily }); s.scen.left--;
    record(s, c.title + ': still on you. +' + c.daily + ' heat.');
    if (s.scen.left <= 0) {
      apply(s, { h: c.expire.h, s: c.expire.s, n: c.expire.n });
      record(s, c.title + ' — you let it ride. ' + c.expire.text);
      s.expired = { title: c.title, text: c.expire.text, h: c.expire.h };
      s.scen = null;
    }
  }
  // rent
  if (s.day % CFG.rentDays === 0) {
    const paid = Math.min(s.cash, CFG.rent); s.cash -= paid; s.arrears += CFG.rent - paid;
    record(s, 'Rent: $' + paid + ' paid' + (s.arrears ? ', $' + s.arrears + ' owed.' : '.'));
    if (s.chores === 0) { s.warnings++; record(s, 'House warning: a week without handling your stuff.'); }
    s.chores = 0;
  }
  if (s.arrears > 0) apply(s, { s: 4 });
  if (s.warnings >= CFG.bedLossWarnings || s.arrears >= CFG.bedLossArrears) { s.housing = 'Temporary shelter'; s.warnings = 0; record(s, 'Lost the bed. Shelter tonight. Asking for help gets it back.'); }
  // the roll
  const odds = lockOdds(s);
  if (odds > 0 && rng(s) < odds) { s.lockedUp = { day: s.day, heat: s.heat, odds: Math.round(odds * 100) }; record(s, 'Night ' + s.day + ': red and blue in the window. Locked up.'); return true; }
  if (s.stress < CFG.balance.stress && s.connection >= CFG.balance.connection && s.heat <= H.safe) s.balanced++;
  checkLevel(s);
  if (s.supportToday || s.calledToday) { s.streak++; s.bestStreak = Math.max(s.bestStreak, s.streak); }
  else s.streak = 0;
  const tonight = pickNight(s);   // drawn from how you lived today, before today's flags reset
  s.day++; s.actions = CFG.actions;
  s.workToday = 0; s.restToday = false; s.supportToday = false; s.calledToday = false; s.lastOutcome = null;
  if (s.day > CFG.days) { s.result = score(s); record(s, 'Thirty days. A chapter built, not a verdict.'); return true; }
  startDay(s, false, tonight);
  return true;
}
function score(s) {
  return { level: s.level, housing: s.housing === 'Temporary shelter' ? 35 : Math.max(40, 100 - Math.round(s.arrears / 5)), income: 40 + s.job * 15, support: Math.round(s.connection), wellbeing: 100 - Math.round(s.stress) };
}

if (typeof module !== 'undefined') {
  const C = require('./cards.js');
  Object.assign(globalThis, C);
  module.exports = { VERSION, SAVE_KEY, CFG, LEVELS, FIGURES, jobs, shop, SHOP_GROUPS, ACTION_IDS, ACTION_LABEL, item, has, fresh, migrate, restartKeepFigure, startDay, scenFor, nightCard, preview, canDo, action, call, buy, cantBuy, nextNeeds, checkLevel, lockOdds, heatWords, endDay, score, jobHuntTarget, levelInfo, ...C };
}
