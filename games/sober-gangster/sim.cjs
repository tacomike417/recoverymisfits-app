const E = require('./engine.js');
function bot(s){
  let n=0;
  while (s.actions) {
    const want = ['phone','shoes','car'].find(i => !s.items.includes(i) && !E.cantBuy(s,i) && s.cash - E.item(i).price >= 100);
    if (want) { E.buy(s, want); continue; }
    let pick=null;
    if (E.jobHuntTarget(s)>s.job && E.canDo(s,'job')) pick='job';
    else if (s.arrears && s.cash>50) pick='responsibility';
    else if (s.day%7===0 && s.chores===0) pick='responsibility';
    else if (s.scen && n===0) {
      // end it the cheapest sensible way
      let bv=-1e9;
      for (const id of E.ACTION_IDS){ if(!E.canDo(s,id)) continue; const {e,end}=E.preview(s,id); if(!end) continue; const v=-e.h*1.5 + e.c/12 - e.s/3 + e.n/4; if(v>bv){bv=v;pick=id;} }
    }
    if (!pick) {
      if (s.heat > 38 && !s.supportToday) pick='support';
      else if (s.stress > 62) pick='rest';
      else if (s.connection < 35 && !s.supportToday) pick='support';
      else pick='work';
    }
    if (!E.canDo(s,pick)) pick = E.ACTION_IDS.find(id=>E.canDo(s,id));
    if (!pick) break;
    E.action(s,pick); n++;
  }
  if (!s.calledToday) E.call(s);
}
function run(N=1000, policy=bot){
  const lv={1:0,2:0,3:0,4:0}; let locked=0, reach4=0; const dayLock=[];
  for (let seed=1; seed<=N; seed++){
    const s=E.fresh(seed); s.look={fig:'pops',sex:'guy',done:true}; E.startDay(s,true); let g=0;
    while(!s.result && !s.lockedUp && g++<60){ policy(s); E.endDay(s); s.levelUp=null; if(s.level===4) {reach4++; break;} }
    if (s.lockedUp){locked++; dayLock.push(s.lockedUp.day);} lv[s.level]++;
  }
  return {lv, reach4: (reach4/N*100).toFixed(0)+'%', locked:(locked/N*100).toFixed(0)+'%', avgLockDay: dayLock.length?(dayLock.reduce((a,b)=>a+b,0)/dayLock.length).toFixed(1):'-'};
}
// a careless player: works every move
function grinder(s){ while(s.actions){ if(!E.action(s,'work')) break; } }
if (require.main === module) { console.log('smart', run()); console.log('grinder', run(500, grinder)); }
module.exports = { run, bot };
