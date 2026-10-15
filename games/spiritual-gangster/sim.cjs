// Sober Gangster v4 simulator: plays thousands of runs with bots so the odds can be tuned.
// node sim.cjs
const E = require('./engine.js');
const val = (e, end) => -e.h * 1.6 + e.c / 10 - e.s / 3 + e.n / 3 + (end ? 25 : 0);
function smart(s) {
  while (s.actions > 0) {
    let pick = null;
    const ends = ids => { let b = null, bv = -1e9; for (const id of ids) { if (!E.canDo(s, id)) continue; const p = E.preview(s, id); if (!p.end) continue; const v = val(p.e, true); if (v > bv) { bv = v; b = id; } } return b; };
    const spirit = ['meeting', 'call', 'help', 'rest', 'rides'];
    if (s.actions === 3) pick = (s.scen && ends(spirit)) || (s.stress > 70 && E.canDo(s, 'rest') ? 'rest' : s.heat > 50 ? 'call' : 'meeting');
    else if (s.level >= 3 && s.housing !== 'My own place' && s.jar.move < E.NEED.l3 && s.cash >= 150 && E.canDo(s, 'movefund')) pick = 'movefund';
    else if (s.level >= 4 && s.cash >= 400 + 60 * (s.tl || 1) && E.canDo(s, 'bizfund')) pick = 'bizfund';
    else if (s.together && s.loveCold >= ((s.tl || 1) === 1 ? 3 : 1) && E.canDo(s, 'date')) pick = 'date';
    else if (s.arrears > 0 && E.canDo(s, 'double') && s.heat < 60) pick = 'double';
    else if (E.canDo(s, 'work') && s.heat < 70) pick = 'work';
    else if (s.scen) pick = ends(spirit.concat(['betterjob']));
    if (!pick) {
      if (!s.job) pick = 'betterjob';
      else if (s.heat > 30) pick = s.car && s.cash > 60 ? 'rides' : 'call';
      else if (s.stress > 60 && E.canDo(s, 'rest')) pick = 'rest';
      else pick = s.connection < 50 ? 'help' : 'meeting';
    }
    if (!E.canDo(s, pick)) pick = ['call', 'help', 'rest', 'meeting'].find(id => E.canDo(s, id));
    if (!pick) break;
    E.action(s, pick);
  }
}
// a smart PERSON: same plan, but only watches heat once it's obviously bad, and when stress runs high
// the life moves start looking good (1 in 6 moves)
function human(s) {
  const r = () => (E.fresh.__h = ((E.fresh.__h || 11) * 48271) % 2147483647) / 2147483647;
  if (s.stress > 55 && r() < 0.35) { E.action(s, ['argue', 'ignore', 'fkit'][Math.floor(r() * 3)]); }
  else if (s.cash > 90 && s.level >= 2 && r() < 0.15) { E.action(s, s.looks < 4 ? 'look' : s.car ? 'date' : 'carfund'); }
  else if (s.stress > 45 && r() < 0.3) { E.action(s, ['crew', 'ex', 'block', 'bar', 'party', 'ghostlink'][Math.floor(r() * 6)]); }
  if (r() < 0.15) { while (s.actions > 0) { const id = ['meeting', 'call', 'help', 'rest', 'betterjob'][Math.floor(r() * 5)]; if (!E.action(s, id)) break; } return; }
  smart(s);
}
// works hard, skips the spiritual stuff unless heat is bad
function grinder(s) { while (s.actions > 0) { const id = s.heat > 55 ? 'meeting' : s.job ? 'work' : 'betterjob'; if (!E.action(s, id) && !E.action(s, 'call')) break; } }
// a normal person: mostly sensible, blows up now and then
function sloppy(s) {
  const r = () => E.fresh.__r = ((E.fresh.__r || 7) * 48271) % 2147483647;
  while (s.actions > 0) {
    const x = (r() % 100);
    let id = x < 15 ? ['argue', 'ignore', 'fkit', 'crew', 'bar', 'party'][x % 6] : x < 45 ? (s.job ? 'work' : 'betterjob') : ['meeting', 'call', 'help', 'rest'][x % 4];
    if (!E.canDo(s, id)) id = E.ACTION_IDS.find(k => E.canDo(s, k));
    if (!id) break; E.action(s, id);
  }
}
function run(N = 1000, policy = smart, maxTurns = 160) {
  const lv = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }; let locked = 0, won = 0, rel = 0, repo = 0, evict = 0, biz = 0, baby = 0; const winTurn = [], winDay = [], lockTurn = [], chTurn = { 2: [], 3: [], 4: [], 5: [] };
  for (let seed = 1; seed <= N; seed++) {
    const s = E.fresh(seed); s.look = { fig: 'pops', sex: 'guy', done: true }; E.startDay(s, true); let g = 0;
    while (!s.result && !s.lockedUp && g++ < maxTurns) { policy(s); E.endDay(s); if (s.levelUp) { chTurn[s.levelUp].push(s.turn); s.levelUp = null; } if (s.cards.some(c => c.title === 'REPO')) repo++; if (s.cards.some(c => c.title === 'EVICTED')) evict++; s.cards = []; }
    if (s.lockedUp) { locked++; lockTurn.push(s.turn); }
    if (s.result) { won++; winTurn.push(s.turn); winDay.push(s.result.day); }
    rel += s.relapses || 0; if (s.biz) biz++; if (s.baby || s.pregnant) baby++;
    lv[s.level]++;
  }
  const avg = a => a.length ? (a.reduce((x, y) => x + y, 0) / a.length).toFixed(0) : '-';
  return { won: (won / N * 100).toFixed(0) + '%', winTurn: avg(winTurn), winDay: avg(winDay), locked: (locked / N * 100).toFixed(0) + '%', lockTurn: avg(lockTurn), relapsesPerRun: (rel / N).toFixed(2), repo: (repo / N).toFixed(2), evict: (evict / N).toFixed(2), biz: (biz / N * 100).toFixed(0) + '%', baby: (baby / N * 100).toFixed(0) + '%', lv, chTurn: { 2: avg(chTurn[2]), 3: avg(chTurn[3]), 4: avg(chTurn[4]), 5: avg(chTurn[5]) } };
}
if (require.main === module) { console.log('smart  ', JSON.stringify(run(1000, smart))); console.log('human  ', JSON.stringify(run(1000, human))); console.log('grinder', JSON.stringify(run(500, grinder))); console.log('sloppy ', JSON.stringify(run(500, sloppy))); }
module.exports = { run, smart, human, grinder, sloppy };
