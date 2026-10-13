/* SOBERED UP — game engine (Recovery Misfits)
   Buildless. No dependencies. Loaded by index.html and by test.cjs (node).
   Everything tunable lives in CFG. Cards live in EVENTS.
   v0.2 — build order steps 1 + 2: prototype gaps fixed, heat meter + locked-up game over.
*/

const VERSION = 'v0.2';
const SAVE_KEY = 'sobered-up-v2';

const CFG = {
  days: 30,              // days in a chapter
  actions: 3,            // moves per day
  startCash: 12,
  startStress: 25,
  startConnection: 25,
  food: 6,               // nightly food cost
  rent: 70,              // weekly house fee
  dateRent: 35,          // weekly fee while "Shared with date"
  rentDays: 7,           // rent due every N days
  bedLossArrears: 140,   // owe this much and the bed is gone
  bedLossWarnings: 3,    // this many house warnings and the bed is gone
  nightStress: 6,        // stress added at night without a rest
  nightConnection: -3,   // connection lost every night
  shortFoodStress: 4,
  arrearsStress: 4,
  exhaustStress: 85,     // at this stress...
  exhaustChance: 0.25,   // ...each night has this chance of an exhaustion setback
  exhaustLoss: 40,       // up to this much cash lost, and back to day labor
  cushion: 60,           // emergency-cushion milestone
  restStress: 18,
  dresserBonus: 4,
  repeatShiftStress: 8,
  repeatShiftConnection: -3,
  supportStress: -10,
  supportConnection: 14,
  helpStress: -8,
  helpConnection: 8,
  helpMeal: 12,          // meal help when cash is under helpMealBelow
  helpMealBelow: 20,
  choresStress: -8,
  jobHuntStress: 4,
  heat: {                // THE RISK METER. 0–100.
    start: 10,
    safe: 45,            // at or below this, 0% chance tonight
    maxOdds: 0.35,       // at 100 heat, this chance of getting locked up tonight
    repeatShift: [0, 5, 7],   // heat added for the 2nd, 3rd shift in a day
    noSupport: [0, 0, 4, 8, 12],  // nightly heat by days since last support (caps at last value)
    noRest: 2,           // nightly heat if you didn't rest
    support: -15,
    rest: -5,
    help: -8,
    chores: -3,
    shop: 0
  }
};

const jobs = [
  { name: 'Day labor',  wage: 24, stress: 10 },
  { name: 'Dishwasher', wage: 28, stress: 12 },
  { name: 'Stock crew', wage: 34, stress: 14 },
  { name: 'Maintenance', wage: 40, stress: 15 }
];

// [id, name, price, description]  — description is built from CFG where it mentions numbers
const shop = [
  ['shoes',   'Decent shoes',          28,  'Unlock stock crew and maintenance.'],
  ['phone',   'Working phone',         45,  'People can call you back: unlocks job referrals and support rides.'],
  ['dresser', 'Actual dresser',        32,  'Rest removes ' + CFG.dresserBonus + ' extra stress.'],
  ['pass',    'Bus pass',              24,  'Protects you from missed-bus setbacks.'],
  ['hat',     'A very confident hat',  15,  'Pure style. No magic odds.'],
  ['car',     'Beat-up car',           260, 'Unlock maintenance; repairs can cost $60.'],
  ['couch',   'A non-curb couch',      75,  'Your room finally feels like home.']
];

function fresh(seed = Date.now()) {
  return {
    version: 2,
    seed: seed >>> 0,
    day: 1,
    actions: CFG.actions,
    cash: CFG.startCash,
    stress: CFG.startStress,
    connection: CFG.startConnection,
    heat: CFG.heat.start,
    job: 0,
    housing: 'Sober house',
    items: [],
    arrears: 0,
    warnings: 0,
    chores: 0,
    workToday: 0,
    restToday: false,
    supportToday: false,
    daysSinceSupport: 0,
    missed: 0,
    reminders: [],
    milestones: [],
    log: ['A bed. Twelve bucks. A garbage bag. Let’s build from here.'],
    seen: [],
    event: null,
    court: 0,
    result: null,
    lockedUp: null,       // set to {day, heat, odds} when the lights show up
    goal: 'Steady footing',
    settings: { sound: false, reminders: true },
    lastOutcome: null
  };
}

// Make an old / broken save safe to load. Anything we don't recognize → fresh run.
function migrate(raw) {
  if (!raw || typeof raw !== 'object' || raw.version !== 2) return null;
  const f = fresh();
  for (const k of Object.keys(f)) if (raw[k] === undefined) raw[k] = f[k];
  if (!Array.isArray(raw.items)) raw.items = [];
  if (!Array.isArray(raw.log)) raw.log = f.log;
  if (!Array.isArray(raw.seen)) raw.seen = [];
  if (!Array.isArray(raw.milestones)) raw.milestones = [];
  if (!Array.isArray(raw.reminders)) raw.reminders = [];
  if (raw.event && !Array.isArray(raw.event.choices)) raw.event = null;
  // re-link the pending card to the live EVENTS entry so its choices carry functions/flags
  if (raw.event && raw.event.id) {
    const live = EVENTS.find(c => c.id === raw.event.id);
    if (live) raw.event = live;
  }
  return raw;
}

function rng(s) { s.seed = (1664525 * s.seed + 1013904223) >>> 0; return s.seed / 4294967296; }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

function apply(s, e) {
  for (const k of ['cash', 'stress', 'connection', 'arrears', 'heat']) s[k] += e[k] || 0;
  s.stress = clamp(s.stress, 0, 100);
  s.connection = clamp(s.connection, 0, 100);
  s.heat = clamp(s.heat, 0, 100);
  if (e.job !== undefined) s.job = e.job;
  if (e.housing) s.housing = e.housing;
  if (e.court) s.court = s.day + 3;
  if (e.item && !s.items.includes(e.item)) s.items.push(e.item);
  if (e.warning) s.warnings += e.warning;
  if (e.clearWarnings) s.warnings = 0;
  if (e.clearDebt) s.arrears = 0;
}

function record(s, t) { s.log.unshift(t); s.log = s.log.slice(0, 100); }
function choice(label, e = {}, extra = {}) { return { label, e, ...extra }; }
function card(id, title, text, choices, extra = {}) { return { id, title, text, choices, ...extra }; }
function has(s, req) { if (!req) return true; return (Array.isArray(req) ? req : [req]).every(x => s.items.includes(x)); }
function reqText(req) { return (Array.isArray(req) ? req : [req]).join(' + '); }

/* Choice flags:
   cost: actions used · risk/good/bad/note: disclosed roll · requires: item(s) · network: min connection
   reminder: callback tomorrow · miss: counts a missed call · clear: clears warnings · remove: lose an item
   badge: milestone text · rest: counts as tonight's rest · resolveCourt: closes the hearing
   e.heat: moves the heat meter (+ rushing / risky, − showing up)
*/
const EVENTS = [
  card('hours', 'WE NEED YOU FULL TIME', 'Real money. A schedule that looks like a hostage situation.', [
    choice('Take the extra shift', { cash: 36, stress: 18, connection: -6, heat: 8 }, { cost: 1 }),
    choice('Ask for manageable hours', { cash: 16, stress: 5 }),
    choice('Keep your breathing room', { connection: 3, heat: -2 })
  ]),
  card('curtains', 'NINE DAYS. ALREADY CURTAINS.', 'Your new date offers a place to stay. Kind person. Very fast timeline.', [
    choice('Move in for now', { housing: 'Shared with date', stress: 6, heat: 18 }, { risk: .35, bad: { housing: 'Temporary shelter', stress: 15, heat: 10 }, good: { cash: 30 }, note: '35% chance plans fall apart; shelter stays available. Rushing it adds heat either way.' }),
    choice('Keep dating. Keep your bed.', { connection: 6, heat: -3 })
  ]),
  card('call', 'YOUR SUPPORT IS CALLING', 'You were about to pretend your phone was in a lake.', [
    choice('Answer', { stress: -12, connection: 12, heat: -6 }, { cost: 1 }),
    choice('Call back tomorrow', {}, { reminder: true }),
    choice('Let it ring', { connection: -5, heat: 4 }, { miss: true })
  ]),
  card('wallet', 'THE WALLET IN THE COUCH', 'A wallet with $80. Your brain starts a very creative accounting department.', [
    choice('Return it', { connection: 10, heat: -4 }, { risk: .25, good: { cash: 20 }, bad: {}, note: '25% chance of a $20 thank-you.' }),
    choice('Keep the cash', { cash: 80, stress: 20, connection: -12, heat: 20 }, { risk: .3, bad: { court: true, stress: 10 }, good: {}, note: '30% chance the owner reports the theft; court date in 3 days. Heat +20 either way.' })
  ]),
  card('bus', 'THE BUS LEAVES WITHOUT YOU', 'You made eye contact. The bus chose violence.', [
    choice('Walk and breathe', { stress: 6 }),
    choice('Use your pass / catch the next one', { stress: 1 }, { requires: 'pass' }),
    choice('Call for a ride', { connection: -3 }, { network: 35, requires: 'phone' }),
    choice('Pay for a ride', { cash: -12 })
  ]),
  card('tip', 'A CUSTOMER LEFT A TIP', 'The receipt says thank you. Your rent envelope agrees.', [
    choice('Put $45 away', { cash: 45, stress: -3 })
  ]),
  card('repair', 'WRECKED THE CAR', 'Another driver clips your parked car. Nobody is hurt. The repair estimate is not so lucky.', [
    choice('Repair it', { cash: -60, stress: 8 }),
    choice('Use the bus while saving', { stress: 12 }, { remove: 'car' }),
    choice('Ask your network for repair help', { cash: -20, connection: -5 }, { network: 50 })
  ], { requires: 'car', type: 'setback' }),
  card('cut', 'LOST THE JOB', 'The business cuts staff. This was not a personal failure.', [
    choice('Take a day-labor lead', { job: 0, stress: 10 }),
    choice('Ask your network for a referral', { job: 1, stress: 3 }, { network: 40, requires: 'phone' })
  ], { type: 'setback' }),
  card('rules', 'HOUSE RULES VIOLATION', 'You skipped your agreed chores. The house manager wants a plan, not a speech.', [
    choice('Make it right', { stress: -4 }, { cost: 1, clear: true }),
    choice('Ask for a workable plan', { connection: 5, stress: -2 }, { cost: 1, clear: true }),
    choice('Brush it off', { stress: 8, warning: 1, heat: 6 })
  ], { type: 'risk' }),
  card('grant', 'THE EMERGENCY GRANT', 'A local fund has a little help available. Paperwork: the final boss.', [
    choice('Complete the form', { cash: 110, stress: -8 }, { cost: 1 }),
    choice('Keep moving', { connection: 2 })
  ]),
  card('overtime', 'DOUBLE PAY, DOUBLE EYEBAGS', 'A one-off shift needs covering.', [
    choice('Take it', { cash: 64, stress: 24, connection: -5, heat: 10 }, { cost: 2 }),
    choice('Split the shift', { cash: 28, stress: 10 }, { cost: 1 }),
    choice('Pass', { stress: -4 })
  ]),
  card('groceries', 'GROCERIES BEFORE A HAT', 'Actual food. Very suspicious adult behavior.', [
    choice('Stock the fridge', { cash: -12, stress: -10 }, { badge: 'Bought groceries before buying a hat.' }),
    choice('Community meal', { stress: -4, connection: 4 }, { cost: 1 })
  ]),
  card('friend', 'A FRIEND NEEDS AN EAR', 'No grand rescue. Just ten minutes of listening.', [
    choice('Listen', { connection: 10, stress: -3, heat: -5 }, { cost: 1 }),
    choice('Set a kind boundary', { connection: 3 }),
    choice('Dodge it', { connection: -4 })
  ]),
  card('sleep', 'YOUR PILLOW FILED A COMPLAINT', 'You have been running on caffeine and stubbornness.', [
    choice('Take a proper rest', { stress: -20, heat: -4 }, { cost: 1, rest: true }),
    choice('Keep grinding', { stress: 10, heat: 8 }, { risk: .3, bad: { cash: -24, stress: 8 }, good: { cash: 16 }, note: '30% chance of a costly work mistake.' })
  ], { type: 'risk' }),
  card('birthday', 'YOU WERE INVITED', 'Someone remembered your birthday. You are not just a crisis with shoes.', [
    choice('Show up', { connection: 12, stress: -8, heat: -4 }, { cost: 1 }),
    choice('Send a warm thanks', { connection: 4 })
  ]),
  card('laundry', 'ALL YOUR SOCKS HAVE UNIONIZED', 'The laundry pile has demands.', [
    choice('Wash them', { cash: -5, stress: -7 }, { cost: 1 }),
    choice('Use the house laundry slot', { stress: -3 }, { cost: 1 })
  ]),
  card('phonebill', 'PHONE BILL SURPRISE', 'A confusing charge. At least the hold music is terrible.', [
    choice('Dispute it', { stress: 4 }, { cost: 1, risk: .7, good: { cash: 18 }, bad: {}, note: '70% chance of an $18 credit.' }),
    choice('Pay and move on', { cash: -18, stress: 3 })
  ], { requires: 'phone' }),
  card('yard', 'THE YARD SALE FIND', 'A dresser with all its drawers. Luxury.', [
    choice('Buy it', { cash: -16, item: 'dresser' }),
    choice('Keep your cash', {})
  ]),
  card('rain', 'RAIN THROUGH THE CEILING', 'The house roof leaks. Your clothes found the swimming pool.', [
    choice('Dry everything together', { stress: 5, connection: 5 }, { cost: 1 }),
    choice('Replace damaged basics', { cash: -18, stress: 4 })
  ], { type: 'setback' }),
  card('referral', 'SOMEONE PUT IN A GOOD WORD', 'Your support network knows a kitchen manager. They called your phone. You had one.', [
    choice('Take the interview', { job: 1, stress: 3 }, { cost: 1 }),
    choice('Keep the current work', { connection: 3 })
  ], { network: 30, requires: 'phone' }),
  card('concert', 'A CHEAP CONCERT', 'You are allowed to have a life you actually enjoy.', [
    choice('Go with a friend', { cash: -10, stress: -14, connection: 6 }, { cost: 1 }),
    choice('Free music in the park', { stress: -8 }, { cost: 1 })
  ]),
  card('loan', 'CAN YOU SPOT ME FORTY?', 'A friend is struggling. Your rent also exists.', [
    choice('Lend it', { cash: -40, connection: 5 }, { risk: .5, good: { cash: 40 }, bad: { stress: 5 }, note: '50% chance it is repaid immediately; otherwise it stays a gift.' }),
    choice('Offer practical help', { connection: 6, heat: -3 }, { cost: 1 }),
    choice('Kindly say no', { stress: -2 })
  ]),
  card('bonus', 'PAYROLL GOT SOMETHING RIGHT', 'A small attendance bonus. No confetti in the envelope, sadly.', [
    choice('Accept the $55', { cash: 55 })
  ]),
  card('hat', 'THE HAT OF DESTINY', 'It will not solve your problems. It is an excellent hat.', [
    choice('Buy it', { cash: -12, item: 'hat' }),
    choice('Admire and leave', { stress: -2 })
  ]),
  card('walk', 'THE WALK THAT HELPED', 'Ten minutes outside. No invoice. No motivational speech.', [
    choice('Take the long route', { stress: -12, heat: -3 }, { cost: 1 }),
    choice('Share a quick walk', { stress: -8, connection: 5, heat: -3 }, { cost: 1 })
  ]),
  card('argument', 'THE ROOMMATE ARGUMENT', 'Someone ate your leftovers. Diplomacy has entered the chat.', [
    choice('Talk it through', { stress: -5, connection: 5 }, { cost: 1 }),
    choice('Cool off first', { stress: -3 }),
    choice('Start a shouting match', { stress: 12, warning: 1, heat: 8 })
  ]),
  card('shift', 'SHIFT CANCELLED', 'Your boss texts: no work today. Bills did not get the text.', [
    choice('Find a small side job', { cash: 18, stress: 8 }, { cost: 1 }),
    choice('Use the time to rest', { stress: -12, heat: -3 }, { cost: 1, rest: true })
  ], { type: 'setback' }),
  card('found', 'THE COAT POCKET JACKPOT', 'Your own forgotten money. Past-you briefly did something useful.', [
    choice('Pocket $30', { cash: 30 })
  ]),
  card('forms', 'FORMS WITH MORE FORMS', 'Housing paperwork asks for a document you already sent.', [
    choice('Sort it out', { stress: -6 }, { cost: 1 }),
    choice('Ask for help', { stress: -8, connection: 4 }, { cost: 1 })
  ]),
  card('date', 'A GOOD SECOND DATE', 'Coffee. Honest conversation. Nobody brought a moving truck.', [
    choice('Make time', { cash: -6, stress: -8, connection: 8 }, { cost: 1 }),
    choice('Schedule next week', { connection: 3 })
  ]),
  card('foodbank', 'THE FOOD PANTRY', 'Useful help. You do not have to earn the right to eat.', [
    choice('Pick up supplies', { cash: 12, stress: -4 }, { cost: 1 }),
    choice('Go with a housemate', { cash: 8, connection: 6 }, { cost: 1 })
  ]),
  card('tools', 'BORROWED TOOLS', 'A neighbor offers a paid fix-it job. The instructions are optimistic.', [
    choice('Give it a try', { stress: 8 }, { cost: 1, risk: .65, good: { cash: 55 }, bad: { cash: -15 }, note: '65% chance of $55 pay; 35% chance of $15 supplies wasted.' }),
    choice('Ask someone experienced', { cash: 22, connection: 3 }, { cost: 1, network: 35 })
  ]),
  card('training', 'PAID TRAINING SLOT', 'A stock crew position has a real opening.', [
    choice('Attend training', { job: 2, stress: 5 }, { cost: 1, requires: 'shoes' }),
    choice('Keep the flyer', {})
  ]),
  card('family', 'THE FAMILY TEXT', 'A cautious hello. Trust grows in small installments.', [
    choice('Reply honestly', { connection: 8, stress: -4, heat: -2 }),
    choice('Take space kindly', { stress: -4 })
  ]),
  card('ticket', 'THE OLD TRAFFIC TICKET', 'A notice about an unpaid ticket from before this run. Handle it and it stays small.', [
    choice('Pay the $25', { cash: -25 }),
    choice('Arrange a hearing', { court: true, stress: 5 }),
    choice('Ask for paperwork help', { court: true, connection: 4 }, { cost: 1 })
  ]),
  card('sale', 'THE TOO-GOOD DEAL', 'A stranger offers a phone from a mysterious trunk.', [
    choice('Risk $20', { cash: -20, heat: 5 }, { risk: .3, good: { item: 'phone' }, bad: { stress: 8 }, note: '30% working phone; 70% useless brick. Trunk deals add a little heat.' }),
    choice('Save for a shop phone', {})
  ]),
  card('mentor', 'SOMEONE REMEMBERS YOUR NAME', 'A maintenance supervisor needs help.', [
    choice('Try the job', { job: 3, stress: 5 }, { cost: 1, requires: 'car' }),
    choice('Ask for a kitchen lead', { job: 1 }, { cost: 1 })
  ]),
  card('hobby', 'YOU USED TO LIKE DRAWING', 'A cheap sketchbook. Something that belongs to you beyond surviving.', [
    choice('Start again', { cash: -5, stress: -12 }, { cost: 1, badge: 'Made time for something you enjoy.' }),
    choice('Borrow supplies', { stress: -7, connection: 3 }, { cost: 1 })
  ]),
  card('savings', 'A BORING BEAUTIFUL EVENING', 'Nothing exploded. Nothing urgent. Weirdly wonderful.', [
    choice('Stay in and reset', { stress: -10, heat: -4 }, { cost: 1, rest: true }),
    choice('Have coffee with your people', { connection: 8, stress: -5, heat: -5 }, { cost: 1 })
  ]),
  card('windfall', 'THE BIG LITTLE BREAK', 'A neighborhood cleanup fund picks your name for a $150 starter grant. Free draw, no entry fee.', [
    choice('Accept the help', { cash: 150, stress: -10 })
  ])
];

// The court card. Missing the hearing no longer means a jail chapter: it's a big heat spike (a warrant is out).
function courtCard() {
  return card('court', 'COURT DATE', 'Your pending case is on the calendar. Showing up gives you options.', [
    choice('Attend and arrange a plan', { cash: -15, stress: -8, heat: -6 }, { cost: 1, resolveCourt: true }),
    choice('Ask your network to come', { stress: -12, heat: -8 }, { cost: 1, network: 30, resolveCourt: true }),
    choice('Knowingly miss the hearing', { stress: 15, heat: 15 }, { risk: .5, good: { court: true }, bad: { heat: 25 }, note: '50% chance a warrant goes out (+25 more heat); otherwise a new hearing in 3 days. Heat +15 either way.', resolveCourt: true })
  ]);
}
function callbackCard() {
  return card('callback', 'YOU SAID TOMORROW', 'Your callback reminder is here. The person still cares.', [
    choice('Call back', { stress: -12, connection: 12, heat: -6 }, { cost: 1, badge: 'Answered a call you wanted to dodge.' }),
    choice('Let it go', { connection: -6, heat: 4 }, { miss: true })
  ]);
}

// Pressure-card chance: 8% + 0.5pt per stress over 45 + 0.5pt per connection under 30 (+ 0.3pt per heat over 50), capped 45%.
function danger(s) {
  return Math.min(.45, .08 + Math.max(0, s.stress - 45) * .005 + Math.max(0, 30 - s.connection) * .005 + Math.max(0, s.heat - 50) * .003);
}

// THE ODDS. Chance the lights show up tonight. 0 at or below CFG.heat.safe, CFG.heat.maxOdds at 100.
function lockOdds(s) {
  const h = CFG.heat;
  if (s.heat <= h.safe) return 0;
  return Math.min(h.maxOdds, (s.heat - h.safe) / (100 - h.safe) * h.maxOdds);
}
function heatLabel(s) {
  if (s.heat <= CFG.heat.safe) return 'Cool';
  if (s.heat < 60) return 'Warm';
  if (s.heat < 80) return 'Hot';
  return 'Burning';
}

function draw(s) {
  if (s.court && s.day >= s.court) { s.event = courtCard(); return; }
  if (s.reminders.includes(s.day)) { s.reminders = s.reminders.filter(d => d !== s.day); s.event = callbackCard(); return; }
  let pool = EVENTS.filter(c => has(s, c.requires) && (!c.network || s.connection >= c.network) && !s.seen.includes(c.id));
  if (!pool.length) { s.seen = []; pool = EVENTS.filter(c => has(s, c.requires)); }
  const risk = rng(s) < danger(s);
  let eligible = pool.filter(c => risk ? c.type === 'risk' : c.type !== 'risk');
  if (!eligible.length) eligible = pool;
  const c = eligible[Math.floor(rng(s) * eligible.length)];
  s.event = c; s.seen.push(c.id);
}

function allowed(s, c) {
  return s.actions >= (c.cost || 0) && has(s, c.requires) && (!c.network || s.connection >= c.network) && s.cash + (c.e.cash || 0) >= 0;
}

function choose(s, i) {
  const c = s.event.choices[i];
  if (!allowed(s, c)) return false;
  const title = s.event.title;
  s.actions -= c.cost || 0;
  apply(s, c.e);
  if (c.resolveCourt) s.court = 0;
  let out = '';
  if (c.risk !== undefined) {
    const good = rng(s) < c.risk;
    apply(s, good ? c.good : c.bad);
    out = good ? ' The favorable outcome landed.' : ' The setback landed.';
  }
  if (c.remove) s.items = s.items.filter(x => x !== c.remove);
  if (c.clear) s.warnings = 0;
  if (c.reminder) s.reminders.push(s.day + 1);
  if (c.miss) s.missed++;
  if (c.rest) s.restToday = true;
  if (c.badge) badge(s, c.badge);
  record(s, title + ': ' + c.label + '.' + out);
  s.lastOutcome = title + ': ' + c.label + '.' + out;
  s.event = null;
  return true;
}

function badge(s, b) { if (!s.milestones.includes(b)) s.milestones.push(b); }

// What "Find better work" gets you. Needs a phone to get called back for anything above dishwasher.
function jobHuntTarget(s) {
  if (!s.items.includes('phone')) return 1;
  if (s.items.includes('car')) return 3;
  if (s.items.includes('shoes')) return 2;
  return 1;
}

function action(s, id) {
  if (s.event || s.actions < 1 || s.result || s.lockedUp) return false;
  s.actions--;
  const H = CFG.heat;
  if (id === 'work') {
    const j = jobs[Math.max(0, s.job)];
    const extraHeat = H.repeatShift[Math.min(s.workToday, H.repeatShift.length - 1)];
    apply(s, { cash: j.wage, stress: j.stress + (s.workToday ? CFG.repeatShiftStress : 0), connection: s.workToday ? CFG.repeatShiftConnection : 0, heat: extraHeat });
    s.workToday++;
    record(s, j.name + ': +$' + j.wage + '.' + (extraHeat ? ' Another shift: +' + extraHeat + ' heat.' : ''));
  }
  if (id === 'rest') {
    apply(s, { stress: -CFG.restStress - (s.items.includes('dresser') ? CFG.dresserBonus : 0), heat: H.rest });
    s.restToday = true;
    record(s, 'Rested. The world kept turning.');
  }
  if (id === 'support') {
    apply(s, { stress: CFG.supportStress, connection: CFG.supportConnection, heat: H.support });
    s.missed = 0; s.supportToday = true; s.daysSinceSupport = 0;
    record(s, 'Coffee and honest conversation.');
  }
  if (id === 'help') {
    apply(s, { cash: s.cash < CFG.helpMealBelow ? CFG.helpMeal : 0, stress: CFG.helpStress, connection: CFG.helpConnection, heat: H.help });
    if (s.housing === 'Temporary shelter') { s.housing = 'Sober house'; s.warnings = 0; }
    record(s, 'Asked for help. A meal, a plan, a way forward.');
  }
  if (id === 'responsibility') {
    s.chores++;
    s.warnings = Math.max(0, s.warnings - 1);
    const pay = Math.min(s.cash, s.arrears);
    s.cash -= pay; s.arrears -= pay;
    apply(s, { stress: CFG.choresStress, heat: H.chores });
    record(s, 'Chores handled; $' + pay + ' arrears paid.');
  }
  if (id === 'job') {
    s.job = Math.max(s.job, jobHuntTarget(s));
    apply(s, { stress: CFG.jobHuntStress });
    record(s, 'Job secured: ' + jobs[s.job].name + '.');
  }
  if (s.cash >= CFG.cushion) badge(s, 'Built a $' + CFG.cushion + ' emergency cushion.');
  return true;
}

function buy(s, id) {
  const p = shop.find(x => x[0] === id);
  if (!p || s.event || s.result || s.lockedUp || s.actions < 1 || s.cash < p[2] || s.items.includes(id)) return false;
  s.actions--; s.cash -= p[2]; s.items.push(id);
  apply(s, { heat: CFG.heat.shop });
  record(s, 'Bought ' + p[1] + '.');
  if (id === 'couch') badge(s, 'A couch nobody found on the curb.');
  return true;
}

function score(s) {
  return {
    housing: s.housing === 'Temporary shelter' ? 35 : Math.max(40, 100 - s.arrears),
    income: s.job < 0 ? 10 : 40 + s.job * 15,
    support: Math.round(s.connection),
    wellbeing: 100 - Math.round(s.stress)
  };
}

function rentDue(s) { return s.housing === 'Shared with date' ? CFG.dateRent : CFG.rent; }
function nextRentDay(s) { return Math.ceil(s.day / CFG.rentDays) * CFG.rentDays; }

function endDay(s) {
  if (s.event || s.result || s.lockedUp) return false;
  const H = CFG.heat;

  // exhaustion setback (warned on screen)
  if (s.stress >= CFG.exhaustStress && rng(s) < CFG.exhaustChance) {
    const loss = Math.min(s.cash, CFG.exhaustLoss);
    s.cash -= loss; s.job = 0;
    record(s, 'Exhaustion cost you a shift: $' + loss + ' in missed pay / replacement travel, and back to day labor.');
  }
  // food
  const food = Math.min(s.cash, CFG.food);
  s.cash -= food;
  if (food < CFG.food) apply(s, { stress: CFG.shortFoodStress });
  // night
  if (!s.restToday) apply(s, { stress: CFG.nightStress, heat: H.noRest });
  apply(s, { connection: CFG.nightConnection });
  // heat from not showing up
  if (!s.supportToday) {
    s.daysSinceSupport++;
    const add = H.noSupport[Math.min(s.daysSinceSupport, H.noSupport.length - 1)];
    if (add) { apply(s, { heat: add }); record(s, s.daysSinceSupport + ' days without support: +' + add + ' heat.'); }
  }
  // rent
  if (s.day % CFG.rentDays === 0) {
    const rent = rentDue(s), paid = Math.min(s.cash, rent);
    s.cash -= paid; s.arrears += rent - paid;
    if (paid === rent) badge(s, 'Paid rent without borrowing.');
    record(s, 'Rent day: $' + paid + ' paid; $' + s.arrears + ' owed.');
    if (s.chores === 0) { s.warnings++; record(s, 'House warning: a week without handling responsibilities.'); }
    s.chores = 0;
  }
  if (s.arrears > 0) apply(s, { stress: CFG.arrearsStress });
  if (s.warnings >= CFG.bedLossWarnings || s.arrears >= CFG.bedLossArrears) {
    s.housing = 'Temporary shelter';
    record(s, 'House bed lost after repeated warnings / two weeks of fees owed. Shelter and ask-for-help stay open.');
    s.warnings = 0;
  }

  // THE ROLL. Odds were on screen all day.
  const odds = lockOdds(s);
  if (odds > 0 && rng(s) < odds) {
    s.lockedUp = { day: s.day, heat: s.heat, odds: Math.round(odds * 100) };
    record(s, 'Night ' + s.day + ': red and blue in the window. Locked up.');
    return true;
  }

  s.day++; s.actions = CFG.actions;
  s.workToday = 0; s.restToday = false; s.supportToday = false; s.lastOutcome = null;
  if (s.day > CFG.days) { s.result = score(s); record(s, 'Thirty days. A chapter built, not a verdict.'); }
  else draw(s);
  return true;
}

if (typeof module !== 'undefined') module.exports = { VERSION, SAVE_KEY, CFG, jobs, shop, fresh, migrate, action, endDay, choose, buy, EVENTS, score, draw, allowed, lockOdds, heatLabel, danger, jobHuntTarget, rentDue, nextRentDay };
