// node test.cjs — Sober Gangster v4 checks
const E = require('./engine.js'), S = require('./sim.cjs');
const ok = (c, m) => { if (!c) { console.error('FAIL: ' + m); process.exit(1); } };
let s = E.restartKeepFigure(null, 3); s.look = { fig: 'lady-ink', sex: 'girl', done: true };
ok(s.cash === 12 && s.scen && s.scen.id === 'first_job', 'day 1: $12 and the first job lands');
ok(E.whyNot(s, 'work') === 'no job' && E.whyNot(s, 'rides') === 'need a car', 'work and rides locked');
E.action(s, 'meeting');
const p = E.preview(s, 'betterjob'); ok(p.zeroed && p.e.h === 0 && p.end, 'spiritual first zeroes work heat; better job ends it');
E.action(s, 'betterjob'); ok(s.job && !s.scen, 'hired');
ok(E.whyNot(s, 'rest') === '', 'rest ok'); E.action(s, 'rest'); ok(E.whyNot(s, 'rest') === 'no moves left', 'out of moves');
// life move leaves a receipt that comes back
s = E.restartKeepFigure(null, 4); s.scen = null; E.action(s, 'fkit'); ok(s.receipts.some(r => r.id === 'receipt_ghost_message'), 'f**k it leaves a receipt');
ok(s.trust.ghost === 7 && s.trust.pops === 1, 'trust moves');
E.endDay(s); ok(s.cards.some(c => c.kind === 'receipt'), 'receipt came back next morning');
// rent day + streaks
s = E.restartKeepFigure(null, 5);
for (let d = 0; d < 7; d++) { s.actions = 0; s.meetToday = true; s.spiritToday = true; s.cash = 300; s.heat = 0; E.endDay(s); }
ok(s.rentDays === 1 && s.rentsOnTime === 1, 'rent paid on day 7');
ok(s.got.includes('sponsor'), '3 meetings in a row: Pops offers');
// every situation has the 10 moves (work/quit may be n/a in chapter 1) and an expire
for (const c of E.SITUATIONS) { ok(c.expire && c.expire.say, c.id + ' expire'); for (const k of ['meeting', 'call', 'help', 'rest', 'betterjob', 'argue', 'ignore', 'fkit']) ok(c.moves[k], c.id + ' ' + k); }
ok(E.sitById('buy_the_car').moves.call.gives.includes('car'), 'the car can be bought');
// difficulty: about 1 in 3 smart people win, in 30-40 days
E.fresh.__h = 11; const h = S.run(1000, S.human), w = parseInt(h.won);
console.log('smart people:', JSON.stringify(h));
ok(w >= 25 && w <= 45, 'human win rate ' + w + '% should be 25-45%');
ok(+h.winDay >= 30 && +h.winDay <= 40, 'win day ' + h.winDay + ' should be 30-40');
console.log('PASS: moves, rows, receipts, rent, streaks, situations, difficulty.');
