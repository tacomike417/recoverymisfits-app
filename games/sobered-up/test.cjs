// node test.cjs — 900 seeded runs across three play styles, plus regression checks.
const assert = require('node:assert/strict');
const E = require('./engine.js');

assert.equal(E.EVENTS.length, 40, '40 cards');

const outcomes = { balanced: [], grind: [], social: [] };
const locked = { balanced: 0, grind: 0, social: 0 };
for (const strategy of Object.keys(outcomes)) for (let seed = 1; seed <= 300; seed++) {
  const s = E.fresh(seed); let guard = 0;
  while (!s.result && !s.lockedUp && guard++ < 100) {
    if (s.event) {
      const opts = s.event.choices.map((c, i) => ({ c, i })).filter(x => E.allowed(s, x.c));
      const safe = opts.filter(x => !x.c.e.warning && (strategy === 'grind' || !(x.c.e.heat > 0)));
      const x = (safe.length ? safe : opts).sort((a, b) => ((b.c.e.cash||0)+(b.c.e.connection||0)-(b.c.e.stress||0)) - ((a.c.e.cash||0)+(a.c.e.connection||0)-(a.c.e.stress||0)))[0];
      assert(x, 'no choice day ' + s.day);
      E.choose(s, x.i);
    }
    while (s.actions) {
      let a;
      if (s.cash < 15) a = 'work';
      else if (s.arrears || s.warnings || (s.day % 7 === 0 && s.chores === 0)) a = 'responsibility';
      else if (strategy === 'grind') a = 'work';
      else if (s.workToday === 0) a = 'work';
      else if (strategy === 'social' && s.connection < 85) a = 'support';
      else if (s.heat > E.CFG.heat.safe && !s.supportToday) a = 'support';
      else if (s.stress > 30) a = 'rest';
      else if (s.connection < 75) a = 'support';
      else if (s.chores === 0) a = 'responsibility';
      else if (E.jobHuntTarget(s) > s.job) a = 'job';
      else a = 'rest';
      E.action(s, a);
    }
    E.endDay(s);
    assert(s.cash >= 0); assert(s.stress >= 0 && s.stress <= 100); assert(s.connection >= 0 && s.connection <= 100); assert(s.heat >= 0 && s.heat <= 100);
  }
  assert(s.result || s.lockedUp, 'run ended');
  if (s.lockedUp) locked[strategy]++; else outcomes[strategy].push({ cash: s.cash, heat: s.heat, ...s.result });
}
for (const [k, v] of Object.entries(outcomes)) {
  const avg = v.length ? Object.fromEntries(Object.keys(v[0]).map(key => [key, Math.round(v.reduce((a, b) => a + b[key], 0) / v.length)])) : {};
  console.log(k.padEnd(9), 'locked up ' + Math.round(locked[k] / 3) + '%', JSON.stringify(avg));
}

// heat → odds
let s = E.fresh(1); s.heat = E.CFG.heat.safe; assert.equal(E.lockOdds(s), 0);
s.heat = 100; assert.equal(E.lockOdds(s), E.CFG.heat.maxOdds);
// forced lock-up: heat 100, run nights until it hits (within 40 tries at 35%)
s = E.fresh(3); s.heat = 100; let n = 0;
while (!s.lockedUp && n++ < 40) { s.heat = 100; s.event = null; E.endDay(s); }
assert(s.lockedUp, 'lock-up fires'); assert(!E.action(s, 'work'), 'no actions after lock-up'); assert(!E.endDay(s));
// safe heat never locks up
s = E.fresh(4); for (let i = 0; i < 29; i++) { s.event = null; s.heat = 0; E.action(s, 'support'); E.endDay(s); } assert(!s.lockedUp);
// court: missing the hearing spikes heat, no jail
s = E.fresh(7); s.day = 10; s.court = 10; E.draw(s); assert.equal(s.event.id, 'court'); s.event.choices[2].risk = 0; const h0 = s.heat; E.choose(s, 2); assert(s.heat >= h0 + 40); assert.equal(s.court, 0);
// callback
s = E.fresh(); s.event = E.EVENTS.find(c => c.id === 'call'); E.choose(s, 1); E.endDay(s); assert.equal(s.event.id, 'callback');
// card rest counts as tonight's rest
s = E.fresh(); s.event = E.EVENTS.find(c => c.id === 'sleep'); E.choose(s, 0); assert(s.restToday);
// phone gates: referral card and ride need a phone
s = E.fresh(); s.connection = 60; assert(!E.allowed(s, E.EVENTS.find(c => c.id === 'bus').choices[2])); s.items.push('phone'); assert(E.allowed(s, E.EVENTS.find(c => c.id === 'bus').choices[2]));
s = E.fresh(); s.items = ['shoes']; assert.equal(E.jobHuntTarget(s), 1); s.items.push('phone'); assert.equal(E.jobHuntTarget(s), 2);
// shop
s = E.fresh(); s.cash = 28; assert(E.buy(s, 'shoes')); assert.equal(s.cash, 0);
// migrate
assert.equal(E.migrate(null), null); assert.equal(E.migrate({ version: 1 }), null);
const m = E.migrate({ version: 2, day: 5 }); assert.equal(m.day, 5); assert.equal(m.heat, E.CFG.heat.start);
console.log('PASS: 900 seeded runs, bounds, heat/lock-up, court heat spike, callbacks, card rest, phone gates, shop, migrate.');
