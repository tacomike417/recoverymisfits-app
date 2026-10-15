// node test.cjs — rules checks + 1000 simulated smart players (should be about 1 in 3 reaching Moved Out).
const assert = require('node:assert/strict');
const E = require('./engine.js');
const { run } = require('./sim.cjs');
assert.equal(E.NIGHTS.length, 12); assert.equal(E.SCENARIOS.length, 10);
for (const c of E.SCENARIOS) for (const id of E.ACTION_IDS) assert(c.moves[id], c.id + ' has ' + id);
// first morning: a scenario, no night card
let s = E.fresh(1); s.look = { fig: 'pops', sex: 'guy', done: true }; E.startDay(s, true);
assert(s.scen); assert.deepEqual(s.show, ['scen']);
// a move that ends it clears it
const id = E.ACTION_IDS.find(k => E.scenById ? 0 : E.preview(s, k).end && E.canDo(s, k));
if (id) { E.action(s, id); assert.equal(s.scen, null); }
// next morning: night card + new scenario
s.actions = 0; E.endDay(s); assert.equal(s.show[0], 'night'); assert(s.night); assert(s.scen);
// ignoring a scenario adds heat every night and it expires
s = E.fresh(2); s.look = { fig: 'pops', sex: 'guy', done: true }; E.startDay(s, true); const sc = s.scen.id, days = s.scen.left;
for (let i = 0; i < days; i++) { s.heat = 0; s.supportToday = true; E.endDay(s); s.lockedUp = null; }
assert(s.expired && s.log.some(l => l.includes('you let it ride')));
// girl homies get her version of the love scenarios
s = E.fresh(3); s.look = { fig: 'lady-ink', sex: 'girl', done: true };
assert(E.scenFor(s, 'shoes').setup.includes("don't date girls")); assert(!E.scenFor(s, 'shoes').moves.support.lose.includes('Girl'));
// heat odds, lock-up, restart keeps the homie at level 1
s = E.fresh(4); s.heat = 100; assert.equal(E.lockOdds(s), E.CFG.heat.maxOdds); s.heat = E.CFG.heat.safe; assert.equal(E.lockOdds(s), 0);
s = E.fresh(5); s.look = { fig: 'suit', sex: 'guy', done: true }; s.level = 3; const r = E.restartKeepFigure(s, 9); assert.equal(r.level, 1); assert.equal(r.look.fig, 'suit'); assert(r.scen);
// shop gating
s = E.fresh(6); s.cash = 2000; assert.equal(E.cantBuy(s, 'dog'), 'level 3'); s.level = 3; assert.equal(E.cantBuy(s, 'dog'), '');
// simulated players
const res = run(1000); console.log('smart players:', JSON.stringify(res));
const pct = parseInt(res.reach4); assert(pct >= 20 && pct <= 50, 'about 1 in 3 smart players reach Moved Out (got ' + pct + '%)');
console.log('PASS: cards, morning, scenarios end + expire, girl versions, heat odds, restart, shop, difficulty.');
