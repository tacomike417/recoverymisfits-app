#!/usr/bin/env node
/* PICK THE SPIN MUSIC, STEP 1 OF 2 (1 Oct 2026, Mike: "pick 50 happy songs and snip em
 * down ... ukulele, hip hop, rock, and we'll just name them sober, serenity, happy").
 *
 * Runs on YOUR computer. Grabs about 120 of the best-rated free-to-use (CC0) tracks
 * from Freesound in four styles (ukulele, hip hop, rock, happy), cuts each one to a
 * 20-second clip (fade in, fade out, all the same loudness), and makes a page where you
 * tap Keep or Skip. Nothing is uploaded anywhere.
 *
 *   Needs: Node 18+ and ffmpeg   (sudo apt install ffmpeg)
 *   Run:   read -rsp "Paste your Freesound API key, then Enter: " FREESOUND_KEY; echo; \
 *          FREESOUND_KEY="$FREESOUND_KEY" node scripts/pick_music.mjs
 *   Then:  open ~/Downloads/spin-music/picker.html in your browser.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const KEY = process.env.FREESOUND_KEY;
if (!KEY) { console.error('No Freesound key. Run it with the read -rsp line above.'); process.exit(1); }
if (spawnSync('ffmpeg', ['-version']).status !== 0) { console.error('ffmpeg is missing. Run: sudo apt install ffmpeg'); process.exit(1); }

const OUT = path.join(os.homedir(), 'Downloads', 'spin-music');
const CLIPS = path.join(OUT, 'clips');
fs.mkdirSync(CLIPS, { recursive: true });

const STYLES = {
  ukulele: ['ukulele happy', 'ukulele', 'ukulele strum'],
  hiphop: ['hip hop beat', 'boom bap', 'hip hop instrumental'],
  rock: ['rock guitar riff', 'rock instrumental', 'rock drum beat'],
  happy: ['happy upbeat music', 'cheerful music', 'feel good music'],
};
const PER_STYLE = 30, CLIP_S = 20;

async function search(q) {
  const u = new URL('https://freesound.org/apiv2/search/text/');
  u.searchParams.set('query', q);
  u.searchParams.set('filter', 'license:"Creative Commons 0" duration:[20 TO 400]');
  u.searchParams.set('fields', 'id,name,username,duration,previews,avg_rating,num_ratings,license');
  u.searchParams.set('sort', 'rating_desc');
  u.searchParams.set('page_size', '40');
  u.searchParams.set('token', KEY);
  const r = await fetch(u);
  if (!r.ok) throw new Error('Freesound said ' + r.status + (r.status === 401 ? ' (check the key)' : ''));
  return (await r.json()).results || [];
}

const seen = new Set(), picked = [];
for (const [style, qs] of Object.entries(STYLES)) {
  let n = 0;
  for (const q of qs) {
    if (n >= PER_STYLE) break;
    let res = [];
    try { res = await search(q); } catch (e) { console.error(e.message); process.exit(1); }
    for (const x of res) {
      if (n >= PER_STYLE) break;
      if (seen.has(x.id) || !/publicdomain\/zero/.test(String(x.license || '')) || !x.previews?.['preview-hq-mp3']) continue;
      seen.add(x.id); picked.push({ style, ...x }); n++;
    }
  }
  console.log(`${style}: ${n} tracks`);
}

const list = [];
let i = 0;
for (const t of picked) {
  i++;
  const raw = path.join(CLIPS, `raw-${t.id}.mp3`), clip = path.join(CLIPS, `${String(i).padStart(3, '0')}-${t.style}-${t.id}.mp3`);
  process.stdout.write(`\r[${i}/${picked.length}] ${t.name.slice(0, 40).padEnd(40)}`);
  if (!fs.existsSync(clip)) {
    try {
      /* only the first ~75 seconds come down; the clip comes from the early part */
      const r = await fetch(t.previews['preview-hq-mp3'], { headers: { Range: 'bytes=0-1199999' } });
      if (!r.ok) continue;
      fs.writeFileSync(raw, Buffer.from(await r.arrayBuffer()));
    } catch { continue; }
    const start = t.duration > 60 ? 12 : t.duration > 30 ? 4 : 0;
    const len = Math.min(CLIP_S, Math.max(8, Math.floor(t.duration - start)));
    const ff = spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-ss', String(start), '-t', String(len), '-i', raw,
      '-af', `afade=t=in:d=0.4,afade=t=out:st=${len - 1.2}:d=1.2,loudnorm=I=-15:TP=-1.5:LRA=11`,
      '-ac', '2', '-ar', '44100', '-b:a', '128k', clip]);
    try { fs.unlinkSync(raw); } catch {}
    if (ff.status !== 0 || !fs.existsSync(clip)) continue;
  }
  list.push({ n: list.length + 1, style: t.style, freesound: t.id, title: t.name, by: t.username, file: 'clips/' + path.basename(clip),
    rating: Math.round((t.avg_rating || 0) * 10) / 10, votes: t.num_ratings || 0 });
}
console.log(`\nCut ${list.length} clips.`);

/* vague, recovery-flavored names; you can change any of them on the page */
const NAMES = ['Sober', 'Serenity', 'Happy', 'Sunrise', 'Clear Eyes', 'One Day', 'Front Porch', 'Fresh Start', 'Gratitude', 'Easy Does It',
  'Keep Coming', 'Good Morning', 'Steady', 'Lighthouse', 'Daybreak', 'Open Road', 'Coffee First', 'Breathe', 'Lighter', 'Still Here',
  'Showed Up', 'Small Wins', 'Glow Up', 'New Leaf', 'Sunday', 'Back Porch', 'Clean Slate', 'Big Sky', 'Hope', 'Good Company',
  'Moving On', 'Rise', 'Spark', 'Bright Side', 'Free', 'Unstuck', 'Golden', 'Next Right Thing', 'Second Wind', 'Easy',
  'Ride Along', 'Keep Going', 'Daylight', 'Warm', 'Home', 'Shine', 'Upward', 'Calm', 'Joy', 'Thursday Night',
  'Miracle', 'Promises', 'Clarity', 'Courage', 'Roots', 'Wings', 'Brave', 'Lucky', 'Victory Lap', 'Smile'];

const page = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Pick the Spin music</title><style>
body{margin:0;background:#11110f;color:#f1e7cf;font:15px/1.4 system-ui,sans-serif}
header{position:sticky;top:0;z-index:2;display:flex;gap:12px;align-items:center;flex-wrap:wrap;padding:12px 16px;background:#1a1712;border-bottom:1px solid #2e2a22}
header b{font-size:20px;color:#e0bd6a}#n{font-weight:800}
button{font:800 14px system-ui;border-radius:999px;padding:9px 14px;border:0;cursor:pointer}
.save{background:#e0bd6a;color:#17130b}.f button{background:#25221b;color:#ddd2b8}.f button.on{background:#e0bd6a;color:#17130b}
main{max-width:760px;margin:0 auto;padding:10px 12px 80px}
.r{display:flex;gap:10px;align-items:center;padding:10px;border-bottom:1px solid #26231c}
.r.keep{background:rgba(49,162,76,.14)}.r.skip{opacity:.35}
.r .pl{width:44px;height:44px;border-radius:50%;background:#25221b;color:#fff;font-size:16px}
.r .t{flex:1;min-width:0}.r .t small{display:block;color:#958c78;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.r input{width:140px;padding:8px;border-radius:8px;border:1px solid #3a3428;background:#15130e;color:#fff;font:700 14px system-ui}
.k{background:#31a24c;color:#fff}.s{background:#3a3428;color:#ddd2b8}
.tag{display:inline-block;padding:2px 8px;border-radius:999px;background:#2a2516;color:#e0bd6a;font:800 11px system-ui;text-transform:uppercase;margin-right:6px}
</style></head><body>
<header><b>Pick the Spin music</b><span>Kept: <span id="n">0</span> / 50</span>
<span class="f"><button data-f="all" class="on">All</button><button data-f="ukulele">Ukulele</button><button data-f="hiphop">Hip hop</button><button data-f="rock">Rock</button><button data-f="happy">Happy</button></span>
<button class="save" id="save">Save my list</button></header>
<main id="m"></main>
<script>
const L=${JSON.stringify(list).replace(/</g, '\\u003c')}, NAMES=${JSON.stringify(NAMES)};
const st=JSON.parse(localStorage.getItem('pick')||'{}'); let f='all', cur=null;
const nm=(x)=>st[x.n]&&st[x.n].name||NAMES[(x.n-1)%NAMES.length]+(x.n>NAMES.length?' '+Math.ceil(x.n/NAMES.length):'');
function paint(){const m=document.getElementById('m');m.innerHTML=L.filter(x=>f==='all'||x.style===f).map(x=>{const s=st[x.n]||{};return '<div class="r '+(s.keep===true?'keep':s.keep===false?'skip':'')+'" data-n="'+x.n+'"><button class="pl" data-p="'+x.n+'">▶</button><div class="t"><span class="tag">'+x.style+'</span><b>'+x.title.replace(/</g,'')+'</b><small>by '+x.by+' · rated '+x.rating+' ('+x.votes+')</small></div><input value="'+nm(x).replace(/"/g,'')+'" data-name="'+x.n+'"><button class="k" data-k="'+x.n+'">Keep</button><button class="s" data-s="'+x.n+'">Skip</button></div>';}).join('');
document.getElementById('n').textContent=Object.values(st).filter(s=>s.keep===true).length;}
function save(){localStorage.setItem('pick',JSON.stringify(st));paint();}
document.addEventListener('click',e=>{const t=e.target;
 if(t.dataset.f){f=t.dataset.f;document.querySelectorAll('[data-f]').forEach(b=>b.classList.toggle('on',b===t));paint();return;}
 if(t.dataset.p){const x=L.find(y=>y.n==t.dataset.p);if(cur&&cur.n==x.n&&!cur.a.paused){cur.a.pause();t.textContent='▶';return;}if(cur)cur.a.pause();document.querySelectorAll('.pl').forEach(b=>b.textContent='▶');cur={n:x.n,a:new Audio(x.file)};cur.a.play();t.textContent='❚❚';cur.a.onended=()=>t.textContent='▶';return;}
 if(t.dataset.k){st[t.dataset.k]=Object.assign(st[t.dataset.k]||{},{keep:true});save();return;}
 if(t.dataset.s){st[t.dataset.s]=Object.assign(st[t.dataset.s]||{},{keep:false});save();return;}
 if(t.id==='save'){const keep=L.filter(x=>st[x.n]&&st[x.n].keep===true).map(x=>({name:nm(x),style:x.style,by:x.by,freesound:x.freesound,file:x.file}));
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(keep,null,1)],{type:'application/json'}));a.download='keep.json';a.click();alert('Saved keep.json with '+keep.length+' clips. Put it in Downloads/spin-music (if it is not there already).');}});
document.addEventListener('change',e=>{const n=e.target.dataset.name;if(n){st[n]=Object.assign(st[n]||{},{name:e.target.value.trim()});save();}});
paint();
</script></body></html>`;
fs.writeFileSync(path.join(OUT, 'picker.html'), page);
console.log('Open this in your browser:  ' + path.join(OUT, 'picker.html'));
