/* SOBER GANGSTER — game engine (Recovery Misfits). Locked Up, Covered Up, or Sobered Up.
   v4: an RPG.
     MOVES    3 a day, 10 buttons in 3 rows. SPIRITUAL always helps. WORK adds heat unless you did a
              spiritual move first that day. LIFE feels good now, costs a lot of heat, and leaves a receipt.
     PEOPLE   Pops, Big Ray, Darlene, Mom, Shorty, Ghost. Every move moves somebody's trust.
     RECEIPTS life moves come back a few days later as a morning card.
     STREAKS  3 meetings in a row = Pops offers to sponsor. A week employed = the raise. A car = Give rides.
     CHAPTERS 1 The Bottom Bunk, 2 Clock In or Clock Out, 3 Wheels and Wisdom, 4 Keys to Your Own Place,
              then SOBERED UP. Rent every 7 days grows with you: $100, $140, $175, $250.
   Situations live in situations.js (ChatGPT wrote them, Mike approved). Night cards in cards.js. */

const VERSION = 'v4.0';
const SAVE_KEY = 'sober-gangster-v4';
const ACTION_IDS = ['meeting', 'call', 'help', 'rest', 'rides', 'work', 'betterjob', 'quit', 'argue', 'ignore', 'fkit'];
const ROWS = [
  ['spiritual', 'SPIRITUAL', 'Always helps. Do one first and work adds no heat.', ['meeting', 'call', 'help', 'rest', 'rides']],
  ['work', 'WORK', 'Pays the bills. Adds heat unless you did a spiritual move first today.', ['work', 'betterjob', 'quit']],
  ['life', 'LIFE', 'Feels good right now. Costs a lot of heat, and it comes back.', ['argue', 'ignore', 'fkit']]
];
const ROW_OF = {}; ROWS.forEach(r => r[3].forEach(id => ROW_OF[id] = r[0]));
// base effects (the story bible). h heat, s stress, c cash, n connection; t = trust changes
const MOVES = {
  meeting:   { label: 'Hit a meeting',        line: 'Show up. Shut up. Listen.',   h: -12, s: -8,  c: 0,   n: 8,   t: { pops: 1, ghost: -1 } },
  call:      { label: 'Call sober support',   line: 'Make the damn call.',         h: -10, s: -10, c: 0,   n: 7,   t: { pops: 1, mom: 1, shorty: 1, ghost: -1 } },
  help:      { label: 'Go help someone',      line: 'Get outta your own head.',    h: -8,  s: -5,  c: 0,   n: 12,  t: { shorty: 2, pops: 1, mom: 1 } },
  rest:      { label: 'Rest',                 line: 'Sit your ass down.',          h: -5,  s: -15, c: 0,   n: 1,   t: {} },
  rides:     { label: 'Give rides',           line: 'Get in. We’re going.',        h: -10, s: -4,  c: -8,  n: 12,  t: { shorty: 2, pops: 1, mom: 1 } },
  work:      { label: 'Go to work',           line: 'Clock in. Get paid.',         h: 6,   s: 10,  c: 80,  n: -2,  t: { darlene: 1, ray: 1 } },
  betterjob: { label: 'Look for a better job', line: 'There’s gotta be more.',     h: 5,   s: 8,   c: -10, n: 2,   t: { darlene: -1, mom: 1 } },
  quit:      { label: 'Quit your job',        line: 'Take this job and shove it.', h: 8,   s: -20, c: 0,   n: -5,  t: { darlene: -4, ray: -1, mom: -1 } },
  argue:     { label: 'Argue your point',     line: 'Nah. You’re gonna hear me.',  h: 15,  s: -12, c: 0,   n: -8,  t: { ray: -2, darlene: -2, shorty: -2 } },
  ignore:    { label: 'Put everyone on ignore', line: 'Everybody can kiss my ass.', h: 12,  s: -15, c: 0,   n: -12, t: { pops: -1, mom: -2, shorty: -2, ghost: 1 } },
  fkit:      { label: 'Say f**k it',          line: 'F**k it. I’m done.',          h: 25,  s: -25, c: -20, n: -15, t: { pops: -2, ray: -2, darlene: -2, mom: -2, shorty: -1, ghost: 2 } }
};
const ACTION_LABEL = Object.fromEntries(Object.entries(MOVES).map(([k, v]) => [k, v.label]));

const PEOPLE = [
  { id: 'pops',    name: 'Pops',     role: 'The old-timer. 24 years. Could be your sponsor.', start: 3, say: 'You ain’t the first asshole to get sober. You’re just the newest.' },
  { id: 'ray',     name: 'Big Ray',  role: 'Runs the sober house. Gold chains, cheap cologne.', start: 4, say: 'This ain’t a charity, sweetheart. Rent don’t pay itself.' },
  { id: 'darlene', name: 'Darlene',  role: 'Your boss at the warehouse. Heard every excuse.', start: 5, say: 'I don’t need your life story. I need these boxes on that truck.' },
  { id: 'mom',     name: 'Mom',      role: 'Loves you. Tired of being scared.', start: 3, say: 'I love you. I’m just tired of being scared every time the phone rings.' },
  { id: 'shorty',  name: 'Shorty',   role: 'Your housemate. Loud, funny, 3 months sober.', start: 4, say: 'Man, we both broke. At least we ain’t broke AND wanted.' },
  { id: 'ghost',   name: 'Ghost',    role: 'The plug. The more he trusts you, the worse it gets.', start: 5, say: 'I ain’t asking you to do nothing. Just saying I’m here.' }
];
const person = id => PEOPLE.find(p => p.id === id);

// life moves leave receipts; they come back as a morning card
const RECEIPTS = {
  receipt_parking_lot:     { who: 'darlene', days: 2, title: 'THE PARKING LOT ARGUMENT', text: 'Darlene calls you into the office. Somebody reported that little performance in the parking lot.', h: 8, s: 8, t: { darlene: -1 } },
  receipt_ray_black_book:  { who: 'ray', days: 3, title: 'BIG RAY’S LITTLE BLACK BOOK', text: 'Big Ray suddenly remembers three house rules you’ve supposedly been breaking. He’s writing everything down.', h: 8, s: 8, t: { ray: -1 } },
  receipt_mom_stopped:     { who: 'mom', days: 4, title: 'MOM STOPPED CALLING', text: 'You check your phone. Mom hasn’t called in four days. It feels different when you’re the one who pushed her away.', h: 6, s: 10, t: { mom: -1 } },
  receipt_shorty_heard:    { who: 'shorty', days: 2, title: 'SHORTY HEARD ABOUT IT', text: 'Shorty told the whole house what you said, with a few extra details he pulled straight out of his ass.', h: 6, s: 8, t: { shorty: -1 } },
  receipt_ghost_message:   { who: 'ghost', days: 1, title: 'GHOST GOT THE MESSAGE', text: 'Ghost texts you first thing. Like he can smell a bad decision from three neighborhoods away.', h: 10, s: 6, t: { ghost: 1 } },
  receipt_nobody_answers:  { who: 'pops', days: 3, title: 'NOBODY ANSWERS', text: 'You finally need somebody to talk to. Pops is tired of leaving messages on a phone you never answer.', h: 8, s: 10, t: { pops: -1 } },
  receipt_job_walkout:     { who: 'darlene', days: 5, title: 'THE JOB YOU WALKED OUT ON', text: 'A new employer calls Darlene for a reference. She remembers exactly how you left.', h: 6, s: 10, t: { darlene: -1 } },
  receipt_family_argument: { who: 'mom', days: 3, title: 'THE THINGS YOU SAID', text: 'Your aunt calls. Mom told the whole family what you said to her. Nobody’s saving you a seat at Thanksgiving.', h: 6, s: 10, t: { mom: -1 } },
  receipt_pops_argument:   { who: 'pops', days: 2, title: 'POPS DIDN’T FORGET', text: 'Pops nods at you across the meeting room. Doesn’t come over. Doesn’t have to.', h: 6, s: 8, t: { pops: -1 } }
};
// a life move with no situation on you still leaves a receipt
function baseReceipt(s, id) {
  if (id === 'argue') return s.level >= 4 ? (s.job ? 'receipt_parking_lot' : null) : 'receipt_ray_black_book';
  if (id === 'ignore') return 'receipt_mom_stopped';
  if (id === 'fkit') return 'receipt_ghost_message';
  if (id === 'quit') return 'receipt_job_walkout';
  return null;
}

const STREAKS = {
  sponsor:  { title: 'THREE MEETINGS', text: 'Pops catches you by the coffee pot after the third meeting. “You keep showing up like this, I might actually have to learn your name.”' },
  showing:  { title: 'SEVEN DAYS SHOWING UP', text: 'Seven days of doing something other than making your own life worse. Nobody threw you a parade, but people are starting to recognize your face.' },
  raise:    { title: 'THE RAISE', text: 'Darlene pulls you aside before your shift. “You’re doing good work. Don’t make me regret saying that.” Work pays $100 now.' },
  helping:  { title: 'THREE DAYS HELPING', text: 'Shorty catches you carrying somebody else’s groceries up the stairs. “Man, you really are turning into one of those helpful assholes.”' },
  twoweeks: { title: 'FOURTEEN DAYS', text: 'Two weeks. You still have problems, but for once they’re the kind of problems regular people have.' },
  rent3:    { title: 'THREE RENTS ON TIME', text: 'Three weeks of paying your own way. Big Ray counts the money twice, then looks almost disappointed he can’t complain.' },
  wheels:   { title: 'FIRST SET OF WHEELS', text: 'Keys in your hand. Nobody’s picking you up, nobody’s dropping you off. For the first time in a long time, you’re the one driving. Give rides is unlocked.' },
  thirty:   { title: 'THIRTY DAYS STANDING', text: 'Thirty days ago you had twelve dollars and a bed somebody else owned. Now you’ve got a life worth protecting.' }
};

const CFG = {
  actions: 3,
  startCash: 12, startStress: 35, startConnection: 20,
  food: 12, rentDays: 7,
  rent: [0, 100, 140, 175, 250],
  wage: 80, raiseWage: 100, lowTrustWage: 60,
  jobless: 8,                  // stress every morning with no job (after day 1)
  moveIn: 500,                 // first and last when you get your own place
  heat: {
    start: 10, safe: 45, maxOdds: 0.55,
    noSpirit: [0, 3, 6, 9, 12], // nightly heat by days without a spiritual move
    maxedStress: 75, maxedStressHeat: 5,
    aloneBelow: 15, aloneHeat: 5,
    ghostHigh: 4,               // nightly heat while Ghost's trust is 8+
    street: 12                  // every night, no matter what: life on life's terms
  },
  maxTrust: 10
};
const LEVELS = [
  { n: 1, name: 'The Bottom Bunk',        housing: 'Sober house' },
  { n: 2, name: 'Clock In or Clock Out',  housing: 'Sober house' },
  { n: 3, name: 'Wheels and Wisdom',      housing: 'Sober house' },
  { n: 4, name: 'Keys to Your Own Place', housing: 'My own place' }
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
  { id: 'car',     name: 'Beater car',       price: 600, group: 'save', minLevel: 3, desc: 'Wheels. Unlocks Give rides.' },
  { id: 'car2',    name: 'Nice car',         price: 2500, group: 'save', minLevel: 4, feel: 12, desc: 'The one you park where people can see it.', upgrades: 'car' },
  { id: 'couch',   name: 'A non-curb couch', price: 200, group: 'save', minLevel: 2, feel: 4, desc: 'Your room finally feels like home.' },
  { id: 'tv',      name: 'TV',               price: 300, group: 'save', minLevel: 2, feel: 4, desc: 'Something to not watch.' },
  { id: 'dog',     name: 'The dog',          price: 350, group: 'save', minLevel: 3, feel: 10, desc: 'Vet bills, chewed shoes, and the best welcome home you’ve ever had.' }
];
const SHOP_GROUPS = [['feel', 'FEEL GOOD', 'Cheap. Feels good today.'], ['big', 'BIGGER', 'Opens doors, or just looks right.'], ['save', 'BIG SAVES', 'The stuff you work a month for.']];



function item(id) { return shop.find(x => x.id === id); }
function has(s, id) { return s.items.includes(id); }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function rng(s) { s.seed = (1664525 * s.seed + 1013904223) >>> 0; return s.seed / 4294967296; }
function record(s, t) { s.log.unshift(t); s.log = s.log.slice(0, 150); }
function badge(s, b) { if (!s.milestones.includes(b)) s.milestones.push(b); }
function levelInfo(n) { return LEVELS[Math.max(1, Math.min(4, n)) - 1]; }
function rentDue(s) { return CFG.rent[s.level]; }
function nextRentDay(s) { return Math.ceil(s.day / CFG.rentDays) * CFG.rentDays; }

function fresh(seed = Date.now()) {
  return {
    version: 4, seed: seed >>> 0,
    day: 1, actions: CFG.actions,
    cash: CFG.startCash, stress: CFG.startStress, connection: CFG.startConnection, heat: CFG.heat.start,
    job: false, wage: CFG.wage, level: 1, housing: 'Sober house', levelUp: null,
    sponsor: false, car: false,
    trust: Object.fromEntries(PEOPLE.map(p => [p.id, p.start])),
    items: [], arrears: 0, flags: [], milestones: [], got: [],
    log: ['Twelve bucks. A bottom bunk. A garbage bag. Let’s build from here.'],
    // today
    spiritToday: false, supportToday: false, restToday: false, meetToday: false, helpToday: false, workToday: 0, zeroedToday: false,
    // streaks + counts
    streak: 0, bestStreak: 0, daysSinceSupport: 0, meetStreak: 0, helpStreak: 0,
    meetings: 0, shifts: 0, employedDays: 0, searchPts: 0,
    rentDays: 0, rentsOnTime: 0, rentsL4: 0, coolDays: 0, standing: 0,
    receipts: [],          // { id, due }
    cards: [],             // morning cards waiting: { kind, title, text, h, s, c, n, t }
    scen: null, seenScen: [],
    night: null, show: [],
    lastOutcome: null, result: null, lockedUp: null,
    look: { fig: null, sex: 'guy', done: false },
    settings: { mute: false, introSeen: false }
  };
}
function migrate(raw) {
  if (!raw || typeof raw !== 'object' || raw.version !== 4) return null;
  const f = fresh();
  for (const k of Object.keys(f)) if (raw[k] === undefined) raw[k] = f[k];
  if (!FIGURES.find(x => x.id === raw.look.fig)) raw.look.done = false;
  if (raw.scen && !SITUATIONS.find(x => x.id === raw.scen.id)) raw.scen = null;
  return raw;
}
function restartKeepFigure(s, seed) {
  const n = fresh(seed);
  if (s && s.look && s.look.fig) n.look = { ...s.look, done: true };
  n.settings = { ...n.settings, ...(s && s.settings), introSeen: true };
  startDay(n, true);
  return n;
}

/* ---------- people ---------- */
function trustUp(s, t) {
  const out = {};
  for (const [k, v] of Object.entries(t || {})) {
    if (!(k in s.trust) || !v) continue;
    if (k === 'darlene' && !s.job && !s.flags.includes('darlene_introduced')) continue;
    if (k === 'ray' && s.level >= 4) continue;
    const was = s.trust[k]; s.trust[k] = clamp(was + v, 0, CFG.maxTrust);
    if (s.trust[k] !== was) out[k] = s.trust[k] - was;
  }
  return out;
}

/* ---------- words for girl homies ---------- */
function forSex(s, t) {
  if (!t || s.look.sex !== 'girl') return t;
  return t.replace(/another man's underwear/g, 'somebody else’s underwear');
}

/* ---------- situations ---------- */
function sitById(id) { return SITUATIONS.find(x => x.id === id); }
function scenFor(s, id) { return sitById(id); }
function sitOK(s, c) {
  if (c.id === 'first_job') return !s.job;
  if (c.id === 'buy_the_car') return !s.car;
  if (c.id === 'car_trouble') return s.car;
  if (['darlene_raise', 'payday_pocket', 'ghost_warehouse', 'saturday_shift'].includes(c.id)) return s.job;
  if (c.who === 'ray' && s.level >= 4) return false;
  return true;
}
function pickScen(s) {
  // the very first morning, and any morning you're out of work with 3 job leads, the job finds you
  if (!s.job && (s.day === 1 || s.searchPts >= 3)) { s.searchPts = 0; return sitById('first_job'); }
  const ch = Math.min(s.level, 3);
  let pool = SITUATIONS.filter(c => (s.level >= 4 ? c.ch >= 2 : c.ch === ch) && sitOK(s, c) && !s.seenScen.includes(c.id));
  if (!pool.length) { s.seenScen = s.seenScen.filter(id => !SITUATIONS.some(c => c.ch === ch && c.id === id)); pool = SITUATIONS.filter(c => (s.level >= 4 ? c.ch >= 2 : c.ch === ch) && sitOK(s, c)); }
  if (!pool.length) return null;
  const g = s.trust.ghost, w = c => c.who === 'ghost' ? (g >= 8 ? 3 : g <= 2 ? 0.3 : 1) : 1;
  let r = rng(s) * pool.reduce((a, c) => a + w(c), 0);
  for (const c of pool) { r -= w(c); if (r <= 0) { s.seenScen.push(c.id); return c; } }
  s.seenScen.push(pool[0].id); return pool[0];
}
function nightCard(id) { return NIGHTS.find(x => x.id === id); }
function pickNight(s) {
  const pool = NIGHTS.map(c => ({ c, w: c.like(s) })).filter(x => x.w >= 0).map(x => ({ c: x.c, w: 1 + x.w }));
  let r = rng(s) * pool.reduce((a, x) => a + x.w, 0);
  for (const x of pool) { r -= x.w; if (r <= 0) return x.c; }
  return pool[pool.length - 1].c;
}
function apply(s, e) {
  s.heat = clamp(s.heat + (e.h || 0), 0, 100);
  s.cash = Math.max(0, s.cash + (e.c || 0));
  s.stress = clamp(s.stress + (e.s || 0), 0, 100);
  s.connection = clamp(s.connection + (e.n || 0), 0, 100);
}
function card(s, c) { s.cards.push(c); }

// MORNING
function startDay(s, first = false, picked = null) {
  s.show = [];
  if (!first) {
    const n = picked || pickNight(s);
    s.night = n.id; apply(s, { h: n.heat, s: n.stress });
    record(s, 'Night: ' + n.title + '.');
    s.show.push('night');
    if (!s.job) { apply(s, { s: CFG.jobless }); }
  }
  // receipts that came due
  const due = s.receipts.filter(r => r.due <= s.day);
  s.receipts = s.receipts.filter(r => r.due > s.day);
  for (const r of due) {
    const R = RECEIPTS[r.id]; if (!R) continue;
    apply(s, R); trustUp(s, R.t);
    if (r.id === 'receipt_ghost_message' && !s.flags.includes('oldcontact')) s.flags.push('oldcontact');
    card(s, { kind: 'receipt', who: R.who, title: R.title, text: R.text, h: R.h, s: R.s, t: R.t });
    record(s, 'It came back: ' + R.title + '.');
  }
  if (!s.scen) {
    const c = pickScen(s);
    if (c) { s.scen = { id: c.id, left: c.days, fresh: true }; apply(s, { h: c.now }); record(s, 'New trouble: ' + c.title + '.'); }
  } else s.scen.fresh = false;
  if (s.scen) s.show.push('scen');
}

/* ---------- moves ---------- */
function moveLine(s, id) {
  const c = s.scen && sitById(s.scen.id);
  return c && c.moves[id] ? { c, m: c.moves[id] } : { c, m: null };
}
// what a move does right now. The page shows this before you tap.
function preview(s, id) {
  const B = MOVES[id], { c, m } = moveLine(s, id);
  const e = m ? { h: m.h, s: m.s, c: m.c, n: m.n } : { h: B.h, s: B.s, c: B.c, n: B.n };
  const t = m ? m.trust : B.t;
  let zeroed = false, note = '';
  if (id === 'work') {
    const w = s.trust.darlene <= 2 ? CFG.lowTrustWage : s.wage;
    e.c = m && m.c > CFG.wage ? Math.max(m.c, w) : w;
    if (s.trust.darlene <= 2) note = 'Darlene cut your hours.';
  }
  if (id === 'rides' && !m) Object.assign(e, { h: B.h, s: B.s, c: B.c, n: B.n });
  if (ROW_OF[id] === 'work' && e.h > 0 && s.spiritToday) { e.h = 0; zeroed = true; }
  if (id === 'call' && (s.sponsor || s.trust.pops >= 8)) { e.h -= 5; note = 'Your sponsor picks up. −5 more heat.'; }
  else if (id === 'call' && s.trust.pops <= 1) { e.h = Math.round(e.h / 2); note = 'Pops let it ring. Half the help.'; }
  return { e, t, end: !!(m && m.end), gives: m ? m.gives : [], say: m ? forSex(s, m.say) : null, scen: m ? c : null, zeroed, note };
}
// '' = you can do it, otherwise why not
function whyNot(s, id) {
  if (s.result || s.lockedUp) return 'game over';
  if (s.actions < 1) return 'no moves left';
  if ((id === 'work' || id === 'quit') && !s.job) return 'no job';
  if (id === 'rides' && !s.car) return 'need a car';
  if (id === 'rest' && s.restToday) return 'rested today';
  const { e } = preview(s, id);
  if (ROW_OF[id] !== 'life' && s.cash + (e.c || 0) < 0) return 'need $' + (-e.c);   // f**k it is always on the table
  return '';
}
function canDo(s, id) { return !whyNot(s, id); }
const BASE_SAY = {
  meeting: 'Folding chair, bad coffee, the truth out loud. You sat there and let it land.',
  call: 'You made the call. Two minutes in, your shoulders came down.',
  help: 'You got out of your own head and into somebody else’s mess. It helped you more than them.',
  rest: 'You sat your ass down. The world kept turning without you.',
  rides: 'You picked people up and got them where they were going. Some of them talked the whole way.',
  work: 'Clocked in, clocked out. Boxes on the truck, money in your pocket.',
  betterjob: 'Applications, waiting rooms, a guy who said he’d call. One more lead in the pile.',
  quit: 'You walked out. Felt like freedom for about an hour. Rent didn’t quit.',
  argue: 'You said your piece. Loud. Felt good for about four seconds.',
  ignore: 'Phone face down. Door shut. The quiet felt great until it didn’t.',
  fkit: 'You said f**k it. Twenty bucks gone, and the old life smiled at you.'
};
function action(s, id) {
  if (!canDo(s, id)) return null;
  const p = preview(s, id), row = ROW_OF[id];
  s.actions--;
  apply(s, p.e);
  if (row === 'spiritual') { s.spiritToday = true; s.supportToday = true; s.daysSinceSupport = 0; }
  if (id === 'meeting') { s.meetToday = true; s.meetings++; }
  if (id === 'help' || id === 'rides') s.helpToday = true;
  if (id === 'rest') s.restToday = true;
  if (id === 'work') { s.workToday++; s.shifts++; }
  if (id === 'betterjob') s.searchPts++;
  if (id === 'quit') { s.job = false; s.employedDays = 0; record(s, 'Quit the job.'); }
  if (p.zeroed) s.zeroedToday = true;
  let gotReceipt = false;
  for (const g of p.gives || []) {
    if (g === 'first_job' || g === 'work_unlocked') { if (!s.job) { s.job = true; s.employedDays = 0; record(s, 'Hired at the warehouse. Darlene’s your boss.'); badge(s, 'Got hired.'); } }
    else if (g === 'darlene_introduced') { if (!s.flags.includes(g)) s.flags.push(g); }
    else if (g === 'unemployed') { s.job = false; s.employedDays = 0; }
    else if (g === 'car') { if (!s.car) { s.car = true; if (!s.items.includes('car')) s.items.push('car'); got(s, 'wheels'); badge(s, 'Bought a car.'); } }
    else if (g === 'sponsor_active') { if (!s.sponsor) { s.sponsor = true; badge(s, 'Pops is your sponsor.'); } }
    else if (g === 'job_search_point') { if (id !== 'betterjob') s.searchPts++; }
    else if (RECEIPTS[g]) { gotReceipt = true; queueReceipt(s, g); }
    else if (!s.flags.includes(g)) s.flags.push(g);
  }
  const td = trustUp(s, p.t);
  if (row === 'life' && !gotReceipt) { const r = baseReceipt(s, id); if (r) queueReceipt(s, r); }
  if (id === 'quit' && !gotReceipt) queueReceipt(s, 'receipt_job_walkout');
  if (row === 'life' && id !== 'argue' && !s.flags.includes('oldcontact') && s.trust.ghost >= 7) s.flags.push('oldcontact');
  const say = p.say || BASE_SAY[id];
  let title = MOVES[id].label;
  if (p.scen) {
    title = p.scen.title;
    if (p.end) { s.scen = null; badge(s, 'Dealt with: ' + p.scen.title.toLowerCase() + '.'); }
    record(s, p.scen.title + ' — ' + MOVES[id].label + '. ' + say);
  } else record(s, MOVES[id].label + '. ' + say);
  s.lastOutcome = say;
  return { say, e: p.e, end: p.end, title, trust: td, zeroed: p.zeroed, note: p.note, still: !!(p.scen && !p.end) };
}
function queueReceipt(s, id) {
  const R = RECEIPTS[id]; if (!R || s.receipts.some(r => r.id === id)) return;
  s.receipts.push({ id, due: s.day + R.days });
}
function got(s, id) {
  if (s.got.includes(id)) return false;
  s.got.push(id); const S = STREAKS[id];
  card(s, { kind: 'streak', title: S.title, text: S.text });
  badge(s, S.title.charAt(0) + S.title.slice(1).toLowerCase() + '.');
  return true;
}

/* ---------- shop ---------- */
function buy(s, id) {
  if (cantBuy(s, id)) return false;
  const p = item(id);
  s.actions--; s.cash -= p.price; s.items.push(id);
  apply(s, { s: -(p.feel || 0) - (id === 'pass' ? 5 : 0) });
  if (id === 'car' && !s.car) { s.car = true; got(s, 'wheels'); }
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
  if (s.result || s.lockedUp) return 'game over';
  if (s.actions < 1) return 'no moves left today';
  if (s.cash < p.price) return 'short $' + (p.price - s.cash);
  return '';
}

/* ---------- chapters ---------- */
// what's left before the next chapter (or the win at level 4)
function nextNeeds(s) {
  const a = [];
  if (s.level === 1) {
    if (!s.job) a.push('get hired');
    if (s.meetings < 3) a.push((3 - s.meetings) + ' meeting' + (3 - s.meetings === 1 ? '' : 's'));
    if (s.rentDays < 1) a.push('rent day');
  } else if (s.level === 2) {
    if (!s.job || s.employedDays < 7) a.push((7 - (s.job ? s.employedDays : 0)) + ' days working');
    if (s.wage < CFG.raiseWage) a.push('the raise');
    if (s.rentsOnTime < 2) a.push((2 - s.rentsOnTime) + ' rent' + (2 - s.rentsOnTime === 1 ? '' : 's') + ' on time');
    if (s.cash < 400) a.push('$400 saved');
  } else if (s.level === 3) {
    if (!s.sponsor) a.push('a sponsor');
    if (!s.car) a.push('a car');
    if (!s.job) a.push('a job');
    if (s.connection < 60) a.push('connection 60');
    if (s.cash < 750) a.push('$750 saved');
  } else {
    if (s.rentsL4 < WIN.rents) a.push((WIN.rents - s.rentsL4) + ' rent' + (WIN.rents - s.rentsL4 === 1 ? '' : 's') + ' on time');
    if (!s.job) a.push('a job');
    if (s.connection < 60) a.push('connection 60');
    if (s.coolDays < WIN.cool) a.push((WIN.cool - s.coolDays) + ' cool days');
    if (s.standing < WIN.standing) a.push('day ' + WIN.standing + ' standing');
  }
  return a;
}
const WIN = { rents: 2, cool: 10, standing: 30 };
function checkLevel(s) {
  if (s.level >= 4) {
    if (!nextNeeds(s).length) { s.result = { won: true, day: s.day }; badge(s, 'SOBERED UP.'); record(s, 'SOBERED UP. Day ' + s.day + '.'); }
    return false;
  }
  if (nextNeeds(s).length) return false;
  s.level++;
  if (s.level === 4) { s.cash -= Math.min(s.cash, CFG.moveIn); s.housing = 'My own place'; s.rentsL4 = 0; record(s, 'Signed the lease. First and last: $' + CFG.moveIn + '.'); }
  badge(s, 'Chapter ' + s.level + ': ' + levelInfo(s.level).name + '.');
  record(s, 'NEW CHAPTER: ' + levelInfo(s.level).name + '.');
  s.levelUp = s.level;
  return true;
}

/* ---------- night ---------- */
function lockOdds(s) { const h = CFG.heat; if (s.heat >= 100) return 1; return s.heat <= h.safe ? 0 : Math.min(h.maxOdds, (s.heat - h.safe) / (100 - h.safe) * h.maxOdds); }
function heatWords(s) { return s.heat <= CFG.heat.safe ? 'You’re good.' : s.heat < 70 ? 'Watch it.' : s.heat < 100 ? 'Tonight’s a gamble.' : 'They’re coming.'; }

function endDay(s) {
  if (s.result || s.lockedUp) return false;
  const H = CFG.heat;
  // debt first, then food
  if (s.arrears && s.cash) { const pay = Math.min(s.cash, s.arrears); s.cash -= pay; s.arrears -= pay; if (!s.arrears && s.housing === 'Shelter') { s.housing = levelInfo(s.level).housing; record(s, 'Debt paid. You got your bed back.'); } }
  if (s.cash >= CFG.food) s.cash -= CFG.food;
  else if (s.trust.shorty >= 8) { s.cash = 0; record(s, 'Broke. Shorty split his dinner with you.'); }
  else { s.cash = 0; apply(s, { s: 12, n: -3 }); record(s, 'Couldn’t eat tonight.'); }
  // the spiritual stuff
  if (s.spiritToday) { s.streak++; s.bestStreak = Math.max(s.bestStreak, s.streak); }
  else { s.streak = 0; s.daysSinceSupport++; const add = H.noSpirit[Math.min(s.daysSinceSupport, H.noSpirit.length - 1)]; if (add) { apply(s, { h: add }); record(s, s.daysSinceSupport + ' day' + (s.daysSinceSupport === 1 ? '' : 's') + ' with nothing spiritual: +' + add + ' heat.'); } }
  s.meetStreak = s.meetToday ? s.meetStreak + 1 : 0;
  s.helpStreak = s.helpToday ? s.helpStreak + 1 : 0;
  if (s.meetStreak >= 3 && !s.got.includes('sponsor')) { trustUp(s, { pops: 2 }); if (s.trust.pops >= 5) { s.sponsor = true; } got(s, 'sponsor'); if (!s.sponsor) record(s, 'Pops offered. He wants more trust first.'); }
  if (s.meetStreak >= 3 && !s.sponsor && s.trust.pops >= 5) { s.sponsor = true; badge(s, 'Pops is your sponsor.'); }
  if (s.helpStreak >= 3 && got(s, 'helping')) { trustUp(s, { shorty: 2 }); apply(s, { n: 5 }); }
  if (s.streak >= 7 && got(s, 'showing')) apply(s, { h: -15 });
  if (s.stress >= H.maxedStress) apply(s, { h: H.maxedStressHeat });
  if (s.connection < H.aloneBelow) apply(s, { h: H.aloneHeat });
  if (s.trust.ghost >= 8) apply(s, { h: H.ghostHigh });
  if (s.housing === 'Shelter') apply(s, { h: 5, s: 5 });
  apply(s, { h: H.street });
  apply(s, { n: -2 });
  // the situation you left hanging
  if (s.scen) {
    const c = sitById(s.scen.id);
    apply(s, { h: c.daily }); s.scen.left--;
    if (s.scen.left <= 0) {
      const x = c.expire; apply(s, x); trustUp(s, x.trust);
      card(s, { kind: 'expired', title: c.title, text: forSex(s, x.say), h: x.h, s: x.s, c: x.c, n: x.n, t: x.trust });
      record(s, c.title + ' — you let it ride. ' + x.say);
      s.scen = null;
    }
  }
  // work
  if (s.job) {
    s.employedDays++;
    if (s.trust.darlene <= 0) { s.job = false; s.employedDays = 0; card(s, { kind: 'news', title: 'DARLENE LET YOU GO', text: 'She didn’t yell. She just handed you a check and said don’t come back. Look for a better job to find another one.', s: 15 }); apply(s, { s: 15 }); record(s, 'Fired.'); }
    else if (s.level >= 2 && s.wage < CFG.raiseWage && s.employedDays >= 7 && s.shifts >= 5) { s.wage = CFG.raiseWage; got(s, 'raise'); trustUp(s, { darlene: 1 }); }
  }
  // rent day
  if (s.day % CFG.rentDays === 0) {
    const due = rentDue(s), paid = Math.min(s.cash, due);
    s.cash -= paid; s.rentDays++;
    if (paid === due && !s.arrears) {
      s.rentsOnTime++; if (s.level >= 4) s.rentsL4++;
      apply(s, { s: -8, h: -5 }); trustUp(s, { ray: 2, mom: 1 });
      card(s, { kind: 'rent', title: 'RENT DAY: PAID', text: RENT_TALK[s.level] + ' You paid all $' + due + '.', h: -5, s: -8 });
      if (s.rentsOnTime >= 3) got(s, 'rent3');
    } else {
      s.arrears += due - paid; s.rentsOnTime = 0; if (s.level >= 4) s.rentsL4 = 0;
      const soft = s.trust.ray >= 8 && s.level < 4;
      const e = soft ? { s: 10, h: 6, n: -2 } : { s: 20, h: 12, n: -5 };
      apply(s, e); trustUp(s, { ray: -3, mom: -1 });
      card(s, { kind: 'rent', title: 'RENT DAY: SHORT', text: RENT_TALK[s.level] + ' You had $' + paid + ' of $' + due + '. You owe $' + s.arrears + '.' + (soft ? ' Ray likes you, so he’ll wait. Barely.' : ''), ...e });
      if (s.arrears >= 2 * due && s.housing !== 'Shelter') { s.housing = 'Shelter'; card(s, { kind: 'news', title: 'LOST THE BED', text: 'You owe two weeks. Your stuff is in a garbage bag on the porch. Shelter tonight. Pay what you owe and the bed is yours again.' }); record(s, 'Lost the bed.'); }
    }
  }
  s.standing++;
  if (s.standing >= 14) got(s, 'twoweeks') && apply(s, { s: -20, h: -10 });
  if (s.standing >= 30) got(s, 'thirty');
  // the roll
  const odds = lockOdds(s);
  if (odds > 0 && (odds >= 1 || rng(s) < odds)) { s.lockedUp = { day: s.day, heat: s.heat, odds: Math.round(odds * 100) }; record(s, 'Night ' + s.day + ': red and blue in the window. Locked up.'); return true; }
  s.coolDays = s.heat <= H.safe ? s.coolDays + 1 : 0;
  checkLevel(s);
  if (s.result) return true;
  const tonight = pickNight(s);
  s.day++; s.actions = CFG.actions;
  s.spiritToday = false; s.supportToday = false; s.restToday = false; s.meetToday = false; s.helpToday = false; s.workToday = 0; s.zeroedToday = false; s.lastOutcome = null;
  startDay(s, false, tonight);
  return true;
}
const RENT_TALK = [
  '',
  'Big Ray’s in the hallway like the IRS with a gold chain. “I don’t care how spiritual you got this week. Where’s my money?”',
  'Ray wants $140 now because you’ve got income. Almost two days of wages, while he tells you how lucky you are.',
  '$175 to share one refrigerator with seventeen grown adults. Every rent day is another reason to get the hell out.',
  'No Big Ray. No house meeting. Just you, a landlord who expects payment, and keys nobody can take as long as you handle your shit.'
];

if (typeof module !== 'undefined') {
  const C = require('./cards.js'), S = require('./situations.js');
  Object.assign(globalThis, C, S);
  module.exports = { VERSION, SAVE_KEY, CFG, WIN, LEVELS, FIGURES, shop, SHOP_GROUPS, ACTION_IDS, ACTION_LABEL, MOVES, ROWS, ROW_OF, PEOPLE, RECEIPTS, STREAKS, person, item, has, fresh, migrate, restartKeepFigure, startDay, scenFor, sitById, nightCard, preview, whyNot, canDo, action, buy, cantBuy, nextNeeds, checkLevel, lockOdds, heatWords, endDay, levelInfo, rentDue, nextRentDay, ...C, ...S };
}
