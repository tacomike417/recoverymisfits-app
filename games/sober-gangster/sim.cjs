// Sober Gangster v4 simulator: plays thousands of runs with bots so the odds can be tuned.
// node sim.cjs
const E = require('./engine.js');
const val = (e, end) => -e.h * 1.6 + e.c / 10 - e.s / 3 + e.n / 3 + (end ? 25 : 0);
function smart(s) {
  let n = 0;
  while (s.actions > 0) {
    let pick = null;
    // the morning spiritual move: a meeting builds the sponsor streak; rest if stress is cooked
    if (n === 0) pick = s.stress > 70 && E.canDo(s, 'rest') ? 'rest' : 'meeting';
    // deal with the situation the best non-life way
    if (!pick && s.scen) {
      let bv = -1e9;
      for (const id of E.ACTION_IDS) { if (E.ROW_OF[id] === 'life' || !E.canDo(s, id)) continue; const p = E.preview(s, id); if (!p.end) continue; const v = val(p.e, true); if (v > bv) { bv = v; pick = id; } }
      if (pick && s.cash + E.preview(s, pick).e.c < 30 && pick !== 'betterjob') pick = null;
    }
    if (!pick) {
      if (s.heat > 40) pick = s.car && s.cash > 40 ? 'rides' : 'call';
      else if (s.stress > 68 && E.canDo(s, 'rest')) pick = 'rest';
      else if (s.connection < 45 && s.level >= 3) pick = s.car && s.cash > 40 ? 'rides' : 'help';
      else if (s.job) pick = 'work';
      else pick = 'betterjob';
    }
    if (!E.canDo(s, pick)) pick = ['call', 'help', 'rest', 'meeting'].find(id => E.canDo(s, id));
    if (!pick) break;
    E.action(s, pick); n++;
  }
}
// a smart PERSON: same plan, but only watches heat once it's obviously bad, and when stress runs high
// the life moves start looking good (1 in 6 moves)
function human(s) {
  const r = () => (E.fresh.__h = ((E.fresh.__h || 11) * 48271) % 2147483647) / 2147483647;
  let n = 0;
  while (s.actions > 0) {
    let pick = null;
    if (s.stress > 55 && r() < 0.17) pick = ['argue', 'ignore', 'fkit'][Math.floor(r() * 3)];
    if (!pick && n === 0 && r() < 0.8) pick = s.stress > 70 && E.canDo(s, 'rest') ? 'rest' : 'meeting';
    if (!pick && s.scen && r() < 0.7) {
      let bv = -1e9;
      for (const id of E.ACTION_IDS) { if (E.ROW_OF[id] === 'life' || !E.canDo(s, id)) continue; const p = E.preview(s, id); if (!p.end) continue; const v = val(p.e, true); if (v > bv) { bv = v; pick = id; } }
    }
    if (!pick) {
      if (s.heat > 55) pick = 'call';
      else if (s.stress > 75 && E.canDo(s, 'rest')) pick = 'rest';
      else if (s.job) pick = 'work';
      else pick = 'betterjob';
    }
    if (!E.canDo(s, pick)) pick = ['call', 'help', 'meeting', 'rest'].find(id => E.canDo(s, id));
    if (!pick) break;
    E.action(s, pick); n++;
  }
}
// works hard, skips the spiritual stuff unless heat is bad
function grinder(s) { while (s.actions > 0) { const id = s.heat > 55 ? 'meeting' : s.job ? 'work' : 'betterjob'; if (!E.action(s, id) && !E.action(s, 'call')) break; } }
// a normal person: mostly sensible, blows up now and then
function sloppy(s) {
  const r = () => E.fresh.__r = ((E.fresh.__r || 7) * 48271) % 2147483647;
  while (s.actions > 0) {
    const x = (r() % 100);
    let id = x < 15 ? ['argue', 'ignore', 'fkit'][x % 3] : x < 45 ? (s.job ? 'work' : 'betterjob') : ['meeting', 'call', 'help', 'rest'][x % 4];
    if (!E.canDo(s, id)) id = E.ACTION_IDS.find(k => E.canDo(s, k));
    if (!id) break; E.action(s, id);
  }
}
function run(N = 1000, policy = smart) {
  const lv = { 1: 0, 2: 0, 3: 0, 4: 0 }; let locked = 0, won = 0; const winDay = [], lockDay = [], chDay = { 2: [], 3: [], 4: [] };
  for (let seed = 1; seed <= N; seed++) {
    const s = E.fresh(seed); s.look = { fig: 'pops', sex: 'guy', done: true }; E.startDay(s, true); let g = 0;
    while (!s.result && !s.lockedUp && g++ < 70) { policy(s); E.endDay(s); if (s.levelUp) { chDay[s.levelUp].push(s.day); s.levelUp = null; } s.cards = []; }
    if (s.lockedUp) { locked++; lockDay.push(s.lockedUp.day); }
    if (s.result) { won++; winDay.push(s.result.day); }
    lv[s.level]++;
  }
  const avg = a => a.length ? (a.reduce((x, y) => x + y, 0) / a.length).toFixed(0) : '-';
  return { won: (won / N * 100).toFixed(0) + '%', winDay: avg(winDay), locked: (locked / N * 100).toFixed(0) + '%', lockDay: avg(lockDay), lv, chDay: { 2: avg(chDay[2]), 3: avg(chDay[3]), 4: avg(chDay[4]) } };
}
if (require.main === module) { console.log('smart  ', JSON.stringify(run(1000, smart))); console.log('human  ', JSON.stringify(run(1000, human))); console.log('grinder', JSON.stringify(run(500, grinder))); console.log('sloppy ', JSON.stringify(run(500, sloppy))); }
module.exports = { run, smart, human, grinder, sloppy };
