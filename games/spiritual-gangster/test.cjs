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
for (let d = 0; d < 7; d++) { s.actions = 0; s.cash = 400; s.meetToday = true; s.spiritToday = true; s.cash = 300; s.heat = 0; E.endDay(s); }
ok(s.rentDays === 1 && s.rentsOnTime === 1, 'rent paid on day 7');
ok(s.got.includes('sponsor'), '3 meetings in a row: Pops offers');
// every situation has the 10 moves (work/quit may be n/a in chapter 1) and an expire
for (const c of E.SITUATIONS) { ok(c.expire && c.expire.say, c.id + ' expire'); for (const k of ['meeting', 'call', 'help', 'rest', 'betterjob', 'argue', 'ignore', 'fkit']) ok(c.moves[k], c.id + ' ' + k); }
{ // v6: people, places, things
  const t = E.fresh(5); t.look = { fig: 'pops', sex: 'guy', done: true }; E.startDay(t, true); t.scen = null; t.cash = 200;
  const r0 = E.riskOf(t); E.action(t, 'bar'); ok(E.riskOf(t) > r0 + 20 && t.stress < 50, 'the bar is fun now and risky tonight');
  E.action(t, 'carfund'); ok(t.jar.car === 100, 'car fund fills the jar');
  t.jar.car = 850; t.actions = 1; E.action(t, 'carfund'); ok(t.car && t.got.includes('wheels'), 'a full car jar buys the car');
  const g = E.fresh(6); g.look = { fig: 'x', sex: 'girl', done: true }; ok(E.personFor(g, 'love').name === 'Marc' && E.loveSwap(g, 'Jaz said she') === 'Marc said he', 'girl homies get Marc');
  t.trust.love = 8; E.endDay(t); ok(t.together, 'love 8 = together');
}
ok(E.sitById('buy_the_car').moves.call.gives.includes('car'), 'the car can be bought');
// difficulty: about 1 in 3 smart people win, in 30-40 days
E.fresh.__h = 11; const h = S.run(1000, S.human), w = parseInt(h.won);
console.log('smart people:', JSON.stringify(h));
ok(w >= 25 && w <= 50, 'human win rate ' + w + '% should be 25-50%');
ok(+h.winDay >= 35 && +h.winDay <= 60, 'win day ' + h.winDay + ' should be 35-60');
const sm = S.run(500, S.smart); console.log('careful players:', JSON.stringify(sm)); ok(parseInt(sm.won) >= 50, 'a careful player usually makes it');
// the overnight: a fit guy almost never has a worst night; worst needs real risk
{ const E2 = E; let worst = 0; for (let k = 1; k <= 300; k++) { const t = E2.fresh(k); t.look = { fig: 'pops', sex: 'guy', done: true }; t.spirit = 90; t.connection = 70; t.sober = 40; t.heat = 10; t.stress = 20; const r = E2.overnight(t); if (/relapse|locked|missing/.test(r.tier)) worst++; } ok(worst === 0, 'a spiritually fit guy has no worst nights (' + worst + ')'); }
{ let worst = 0; for (let k = 1; k <= 300; k++) { const t = E.fresh(k); t.look = { fig: 'pops', sex: 'guy', done: true }; t.spirit = 0; t.connection = 10; t.heat = 80; t.stress = 85; t.lifeToday = 2; t.trust.ghost = 9; const r = E.overnight(t); if (/relapse|locked|missing/.test(r.tier)) worst++; } ok(worst > 20, 'a guy running on empty is in danger (' + worst + '/300)'); }
console.log('PASS: moves, rows, receipts, rent, streaks, situations, difficulty.');
