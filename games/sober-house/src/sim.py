# Headless balance simulator: plays N full games of You vs Big Ray in a real browser page
# with all waits removed. usage: python3 sim6.py path/to/index.html N [greedy|random|mixed]
import sys, os, json, tempfile
from playwright.sync_api import sync_playwright
src, N, strat = sys.argv[1], int(sys.argv[2]), (sys.argv[3] if len(sys.argv) > 3 else 'greedy')
h = open(src).read().replace('const sleep=', 'var sleep=')
DRIVER = r"""
<script>
sleep=()=>Promise.resolve(); banner=async()=>{}; sfx=()=>{}; floats=()=>{};
try{localStorage.setItem('sh_intro1','1');localStorage.setItem('sh_games','9')}catch(e){}
window.SIM={res:[],want:null,strat:'__STRAT__'};
ask=function(html,buttons){ const L=buttons.map(b=>b[0]);
  if(L.includes('Play again')){ const [a,b]=S.p; let w=null; const alive=S.p.filter(x=>x.cash>=0);
    if(alive.length===1) w=alive[0]; else if(a.cash!==b.cash) w=a.cash>b.cash?a:b; else if(a.beds!==b.beds) w=a.beds>b.beds?a:b;
    SIM.res.push({w:w?(w===S.p[0]?'you':'ray'):'tie',you:a.cash,ray:b.cash}); return Promise.resolve(2); }
  if(SIM.want && L.includes(SIM.want)){ const k=L.indexOf(SIM.want); SIM.want=null; return Promise.resolve(k); }
  const t=L.findIndex(x=>x.startsWith('Throw down'));
  if(t>=0) return Promise.resolve(SIM.strat==='random'?(Math.random()<.5?t:L.length-1):t);
  const p=L.findIndex(x=>x.startsWith('Pay $')); if(p>=0) return Promise.resolve(S.p[0].cash>=275?p:p+1);
  return Promise.resolve(0); };
async function one(){
  newGame(['You','Big Ray'],true);
  let guard=0;
  while(S && guard++<20000){
    await new Promise(r=>setTimeout(r,0));
    if(!S) break;
    if(S.turn===0 && !S.lock && S.plays>0){
      const p=S.p[0], o=S.p[1]; let i, toss=false;
      const greedy = SIM.strat==='greedy' || (SIM.strat==='mixed' && Math.random()<.5);
      if(greedy){ const r=botPick(p,o); i=r.i; toss=r.toss; }
      else { const ok=p.hand.map((c,k)=>[c,k]).filter(([c])=>playable(c,p)); if(ok.length){ i=ok[Math.random()*ok.length|0][1]; } else { i=p.hand.findIndex(c=>!c.react); if(i<0)i=0; toss=true; } }
      if(!toss && !playable(p.hand[i],p)) toss=true;
      if(toss && p.hand.some(c=>playable(c,p))){ i=p.hand.findIndex(c=>playable(c,p)); toss=false; }
      SIM.want=toss?'Toss it':'Play card';
      await tapCard(i);
    }
  }
}
window.runSim=async n=>{ for(let k=0;k<n;k++) await one(); return SIM.res; };
</script>
""".replace('__STRAT__', strat)
h = h.replace('</body>', DRIVER + '</body>')
d = os.path.dirname(os.path.abspath(src))
tmp = os.path.join(d, '_sim.html'); open(tmp, 'w').write(h)
errs = []
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page()
    pg.route('**/*.mp3', lambda r: r.abort()); pg.route('**/fonts.g*/**', lambda r: r.abort())
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto('file://' + tmp)
    res = pg.evaluate(f'runSim({N})', )
    b.close()
os.remove(tmp)
n = len(res); ray = sum(r['w'] == 'ray' for r in res); you = sum(r['w'] == 'you' for r in res)
avg = lambda k: sum(r[k] for r in res) / max(1, n)
print(json.dumps({'file': src, 'strategy': strat, 'games': n, 'ray_win_pct': round(100 * ray / max(1, n), 1),
                  'you_win_pct': round(100 * you / max(1, n), 1), 'avg_you': round(avg('you')), 'avg_ray': round(avg('ray')), 'errors': errs[:3]}))
