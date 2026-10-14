/* SOBERED UP — the paper doll, "vinyl figure" style.
   Drawn in code, on purpose: every part is a shape with numbers behind it, so sliders work
   (beard length, hair length, width, height, brows) and any skin or hair color is possible.
   No outlines. One soft shade on the right, one highlight on the head. Toy proportions: big head, short legs.

   Draws into a 200×300 box, feet on the floor at y=262 (room scales from there).

   s.look = { sex, skin 0–100, hairColor 0–100, hair (style), hairLen 0–100,
              beard (style, guys), beardLen 0–100, width 0–100, height 0–100,
              eyes (style), brows 0–100, nose (style), ink 0/1 }
   What's worn comes from s.items via worn(s, slot) in engine.js. */

const HAIR_NAMES = {
  guy:  ['Buzz', 'Short', 'Curly', 'Slicked back', 'Long', 'Bald'],
  girl: ['Bob', 'Ponytail', 'Long', 'Big curls', 'Buzz', 'Braids']
};
const HEAD_NAMES = ['Oval', 'Round', 'Alien', 'Cabbage Patch', 'Blocky'];
const BEARD_NAMES = ['Clean', 'Stubble', 'Goatee', 'Mustache', 'Full beard'];
const EYE_NAMES = ['Round', 'Chill', 'Narrow', 'Wide'];
const NOSE_NAMES = ['Small', 'Button', 'Big'];
const INK_NAMES = ['No tattoos', 'Already inked'];
// color ramps: a slider from 0 to 100 walks these stops
// natural tones first, then it keeps going: gray, green, blue, purple. Push the slider and see.
const SKIN_RAMP = ['#f7e0c8', '#efc7a4', '#dfa877', '#c4865a', '#a46a44', '#80502f', '#5b3620', '#3d2415', '#8a8f8a', '#7fb36b', '#5ea0c9', '#9a6fc4'];
const EYE_RAMP = ['#3b2314', '#6b4a2b', '#8a7a3a', '#4f8a4a', '#3f7fb5', '#7a8a99', '#b8302a', '#0a0a0a'];
const HAIR_RAMP = ['#15120f', '#2e2019', '#4a2f1c', '#7a4b26', '#a8452a', '#c97a3a', '#d8b25c', '#e8d8a8', '#a3a3a3', '#efefef'];
const VINYL_SHADE = .16;

function lerpColor(a, b, t) {
  const pa = [1, 3, 5].map(i => parseInt(a.slice(i, i + 2), 16)), pb = [1, 3, 5].map(i => parseInt(b.slice(i, i + 2), 16));
  return '#' + pa.map((v, i) => Math.round(v + (pb[i] - v) * t).toString(16).padStart(2, '0')).join('');
}
function ramp(stops, v) {
  const x = Math.max(0, Math.min(100, v || 0)) / 100 * (stops.length - 1);
  const i = Math.min(stops.length - 2, Math.floor(x));
  return lerpColor(stops[i], stops[i + 1], x - i);
}
function darker(hex, k = .78) {
  return '#' + [1, 3, 5].map(i => Math.round(parseInt(hex.slice(i, i + 2), 16) * k).toString(16).padStart(2, '0')).join('');
}
function lighter(hex, k = .25) {
  return '#' + [1, 3, 5].map(i => { const v = parseInt(hex.slice(i, i + 2), 16); return Math.round(v + (255 - v) * k).toString(16).padStart(2, '0'); }).join('');
}

function dollSVG(s, opts = {}) {
  const L = Object.assign({ sex: 'guy', skin: 40, hairColor: 10, hair: 1, hairLen: 40, beard: 0, beardLen: 40, width: 45, height: 50, eyes: 0, brows: 50, nose: 1, eyeSize: 40, eyeColor: 10, head: 0, headSize: 35, ink: 0 }, s.look || {});
  const own = id => s.items && s.items.includes(id);
  const w = slot => (typeof worn === 'function' ? worn(s, slot) : null);
  const skin = ramp(SKIN_RAMP, L.skin), skin2 = darker(skin, .84), skin3 = darker(skin, .72);
  const hair = ramp(HAIR_RAMP, L.hairColor), hair2 = darker(hair, .75);
  const iris = ramp(EYE_RAMP, L.eyeColor), es = .7 + (L.eyeSize / 100) * 1.3;   // eye size 0.7× → 2×
  const W = .7 + (L.width / 100) * .9;              // 0.7 skinny → 1.6 chunky
  const H = .8 + (L.height / 100) * .45;            // 0.8 short → 1.25 tall
  const hl = L.hairLen / 100, bl = L.beardLen / 100;
  const shirt = w('shirt') || 'tank', pants = w('pants') || 'shorts', shoes = w('shoes') || 'slides';
  const phone = w('phone'), chain = w('chain'), tattoo = w('tattoo');
  const stress = s.stress || 0, heat = s.heat || 0;
  const guy = L.sex === 'guy';
  const beardStyle = guy ? L.beard : 0;
  const uid = 'd' + Math.floor(Math.random() * 1e6);
  const g = [];

  // geometry
  const cx = 100, headY = 72;
  // head shape: pick one, then the size slider blows it up (scales around the neck)
  const HS = [[40, 48], [46, 46], [48, 50], [46, 48], [44, 46]][L.head] || [42, 46];
  const headRx = HS[0] + (W - 1) * 3, headRy = HS[1];
  const headPath = L.head === 2
    ? `M${cx - headRx} ${headY - 8} C${cx - headRx} ${headY - headRy - 18} ${cx + headRx} ${headY - headRy - 18} ${cx + headRx} ${headY - 8} C${cx + headRx} ${headY + 30} ${cx + 16} ${headY + headRy} ${cx} ${headY + headRy + 4} C${cx - 16} ${headY + headRy} ${cx - headRx} ${headY + 30} ${cx - headRx} ${headY - 8} z`
    : L.head === 3
    ? `M${cx - headRx + 12} ${headY - 22} C${cx - headRx + 12} ${headY - headRy - 10} ${cx + headRx - 12} ${headY - headRy - 10} ${cx + headRx - 12} ${headY - 22} C${cx + headRx + 8} ${headY + 6} ${cx + headRx} ${headY + headRy + 2} ${cx} ${headY + headRy + 4} C${cx - headRx} ${headY + headRy + 2} ${cx - headRx - 8} ${headY + 6} ${cx - headRx + 12} ${headY - 22} z`
    : L.head === 4
    ? `M${cx - headRx + 10} ${headY - headRy} h${headRx * 2 - 20} q10 0 10 10 v${headRy * 2 - 20} q0 10 -10 10 h-${headRx * 2 - 20} q-10 0 -10 -10 v-${headRy * 2 - 20} q0 -10 10 -10 z`
    : `M${cx - headRx} ${headY} a${headRx} ${headRy} 0 1 0 ${headRx * 2} 0 a${headRx} ${headRy} 0 1 0 -${headRx * 2} 0 z`;
  const hsz = .8 + (L.headSize / 100) * .7;          // 0.8 → 1.5
  // where the top of the skull really is for this shape, so hair and hats sit ON the head, not across it
  const crownDy = [0, 0, -15, -4, -2][L.head] || 0;
  const headScale = `translate(${cx - cx * hsz} ${(headY + headRy) - (headY + headRy) * hsz}) scale(${hsz})`;
  const shW = 34 * W;                                // half shoulder width
  const armW = 16 * Math.max(.85, W);
  const lax = cx - shW - armW / 2 + 2, rax = cx + shW + armW / 2 - 2;
  const legW = 18 * Math.max(.9, W), legGap = 3;
  const torsoTop = 118, torsoBot = 204, legBot = 250, footY = 262;
  const shade = `url(#${uid}sh)`;

  g.push(`<defs><linearGradient id="${uid}sh" x1="0" x2="1"><stop offset=".5" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="${VINYL_SHADE}"/></linearGradient>
  <clipPath id="${uid}head"><path d="${headPath}"/></clipPath></defs>`);

  // ---- hair, BACK layer (behind body and head). Length slider really swings these.
  const back = [];
  const longBack = (len, wobble = 0) => `<path d="M${cx - headRx - 4} ${headY - 10} q-${6 + wobble} ${len * .55} ${10} ${len} q${headRx - 6} ${12 + wobble} ${headRx * 2 - 12} 0 q${16 + wobble} -${len * .45} ${-6} -${len} z" fill="${hair}"/>`;
  if (guy) {
    if (L.hair === 3) back.push(`<path d="M${cx - 32} ${headY - 16} q-2 ${26 + hl * 40} 32 ${30 + hl * 44} q34 -4 32 -${30 + hl * 44} z" fill="${hair}"/>`);
    if (L.hair === 4) back.push(longBack(60 + hl * 110, 4));
  } else {
    if (L.hair === 0) back.push(longBack(40 + hl * 50));
    if (L.hair === 1) { const len = 50 + hl * 110; back.push(`<path d="M${cx + 24} ${headY - 30} q${30 + hl * 10} 20 ${16 + hl * 14} ${len} q-8 12 -20 4 q-6 -${len * .55} -${8} -${len * .9} z" fill="${hair}"/><circle cx="${cx + 30}" cy="${headY - 26}" r="7" fill="#aa4635"/>`); }
    if (L.hair === 2) back.push(longBack(70 + hl * 120, 6));
    if (L.hair === 3) { const r = 13 + hl * 7, rx0 = headRx + 8 + hl * 10, ry = headRy + 4 + hl * 22; for (let i = 0; i < 11; i++) { const a = -Math.PI * 1.05 + i * (Math.PI * 1.1 / 10) * 2; const rr = r * (i % 2 ? 1 : .8); back.push(`<circle cx="${cx + Math.cos(a) * rx0}" cy="${headY + 4 + Math.sin(a) * ry}" r="${rr}" fill="${i % 2 ? hair : hair2}"/>`); } back.push(`<ellipse cx="${cx}" cy="${headY + 4}" rx="${rx0 - 2}" ry="${ry - 2}" fill="${hair}"/>`); }
    if (L.hair === 5) { const len = 50 + hl * 110; for (const side of [-1, 1]) { back.push(`<path d="M${cx + side * (headRx - 6)} ${headY} q${side * 14} ${len * .5} ${side * 6} ${len} q-${side * 10} 10 -${side * 16} 0 q-${side * 4} -${len * .5} ${side * 2} -${len} z" fill="${hair}"/>`); for (let k = 1; k < 5; k++) back.push(`<path d="M${cx + side * (headRx - 12)} ${headY + k * len / 5} q${side * 10} 4 ${side * 20} 0" fill="none" stroke="${hair2}" stroke-width="2.5"/>`); } }
  }
  g.push(`<g transform="${headScale}"><g transform="translate(0 ${crownDy})">`, ...back, '</g></g>');

  // ---- legs + feet
  const lx = cx - legW - legGap / 2, rx = cx + legGap / 2;
  const legFill = pants === 'jeans' ? '#3b4f7a' : skin;
  const leg = (x) => `<rect x="${x}" y="${torsoBot - 8}" width="${legW}" height="${legBot - torsoBot + 8}" rx="${legW / 3}" fill="${legFill}"/><rect x="${x}" y="${torsoBot - 8}" width="${legW}" height="${legBot - torsoBot + 8}" rx="${legW / 3}" fill="${shade}"/>`;
  g.push(leg(lx), leg(rx));
  if (pants === 'jeans') g.push(`<path d="M${lx + legW / 2} ${torsoBot} v${legBot - torsoBot - 6} M${rx + legW / 2} ${torsoBot} v${legBot - torsoBot - 6}" stroke="#2f405f" stroke-width="1.5"/><path d="M${lx + 3} ${legBot - 10} h${legW - 6} M${rx + 3} ${legBot - 10} h${legW - 6}" stroke="#2f405f" stroke-width="2"/>`);
  if (pants === 'shorts') g.push(`<path d="M${lx - 2} ${torsoBot - 10} h${legW * 2 + legGap + 4} v26 q0 4 -4 4 h-${legW - 2} v-4 h-${legGap + 2} v4 h-${legW - 2} q-4 0 -4 -4 z" fill="#6f7a6b"/><path d="M${lx + 3} ${torsoBot - 2} v10 M${rx + legW - 3} ${torsoBot - 2} v10" stroke="#5a6457" stroke-width="2"/>`);
  const foot = (x, flip) => {
    const d = flip ? 1 : -1;
    if (shoes === 'dunks') return `<path d="M${x - 1} ${legBot - 4} h${legW + 2} q${d * 9} 2 ${d * 8} 10 l0 6 q0 3 -3 3 h-${legW + d * 8 + 2} q-3 0 -3 -3 v-12 q0 -4 4 -4z" fill="#f6f1e6"/><path d="M${x - 3} ${legBot + 11} h${legW + d * 10 + 6}" stroke="#d8d2c4" stroke-width="3"/><path d="M${x + 2} ${legBot + 6} q${d * 6} -6 ${d * 10} -2" fill="none" stroke="#aa4635" stroke-width="3" stroke-linecap="round"/>`;
    if (shoes === 'shoes') return `<path d="M${x - 1} ${legBot - 8} h${legW + 2} q${d * 8} 0 ${d * 7} 7 v11 q0 4 -4 4 h-${legW + d * 9} q-4 0 -4 -4 v-14 q0 -4 4 -4z" fill="#6b4a2b"/><path d="M${x - 3} ${legBot + 12} h${legW + d * 9 + 6}" stroke="#3d2a18" stroke-width="3"/>`;
    return `<path d="M${x - 1} ${legBot + 4} h${legW + 2} q${d * 6} 0 ${d * 6} 4 v3 q0 2 -2 2 h-${legW + d * 7} q-3 0 -3 -3 v-2 q0 -4 3 -4z" fill="#3a3a3a"/><path d="M${x + 1} ${legBot + 2} h${legW}" stroke="#aa4635" stroke-width="4"/>`;
  };
  g.push(foot(lx, false), foot(rx, true));

  // ---- arms (skin)
  const arm = (x) => `<rect x="${x - armW / 2}" y="${torsoTop + 6}" width="${armW}" height="70" rx="${armW / 2}" fill="${skin}"/><rect x="${x - armW / 2}" y="${torsoTop + 6}" width="${armW}" height="70" rx="${armW / 2}" fill="${shade}"/>`;
  g.push(arm(lax), arm(rax));
  if (L.ink === 1) g.push(`<path d="M${lax - 4} 158 l4 5 l4 -5 M${lax - 4} 168 h8 M${lax - 3} 176 l3 4 l3 -4 M${lax - 4} 186 q4 -4 8 0" fill="none" stroke="#2a241f" stroke-width="2.2" stroke-linecap="round"/>`);
  if (tattoo === 'tattoo') g.push(`<path d="M${rax - 4} 164 l4 5 l4 -5 M${rax - 4} 173 h8" fill="none" stroke="#2a241f" stroke-width="2.2" stroke-linecap="round"/>`);
  if (tattoo === 'tattoo2') g.push(`<rect x="${rax - armW / 2}" y="${torsoTop + 6}" width="${armW}" height="70" rx="${armW / 2}" fill="#2a241f" opacity=".3"/><path d="M${rax - 5} 136 q5 6 10 0 M${rax - 5} 150 q5 6 10 0 M${rax - 5} 164 q5 6 10 0 M${rax - 5} 178 q5 6 10 0" fill="none" stroke="#2a241f" stroke-width="2.2"/>`);
  g.push(`<circle cx="${lax}" cy="${torsoTop + 82}" r="${9 * Math.max(.9, W)}" fill="${skin}"/><circle cx="${rax}" cy="${torsoTop + 82}" r="${9 * Math.max(.9, W)}" fill="${skin}"/><circle cx="${rax}" cy="${torsoTop + 82}" r="${9 * Math.max(.9, W)}" fill="${shade}"/>`);
  if (own('watch')) g.push(`<rect x="${lax - armW / 2 - 1}" y="${torsoTop + 68}" width="${armW + 2}" height="7" rx="2" fill="#e6b94d"/><rect x="${lax - 4}" y="${torsoTop + 69}" width="8" height="5" rx="1" fill="#2a241f"/>`);

  // ---- torso + shirt  (chunky = belly)
  const belly = Math.max(0, W - 1) * 14;
  const torso = `M${cx - shW} ${torsoTop} q${shW} -10 ${shW * 2} 0 q${8 + belly} 44 ${2 + belly * .4} ${torsoBot - torsoTop} h-${shW * 2 + 4 + belly * .8} q-${6 + belly} -42 ${2 + belly * .4} -${torsoBot - torsoTop} z`;
  const shirtFill = shirt === 'hoodie' ? '#4a4f5a' : shirt === 'tee' ? '#f6f1e6' : '#e9e2d2';
  if (shirt === 'tank') {
    g.push(`<path d="${torso}" fill="${skin}"/><path d="${torso}" fill="${shade}"/>`);
    const tank = `M${cx - shW + 8} ${torsoTop - 2} h10 q-2 18 ${shW - 18} 18 q${shW - 18} 0 ${shW - 18} -18 h10 l${3 + belly * .4} ${torsoBot - torsoTop + 2} h-${shW * 2 + 2 + belly * .8} z`;
    g.push(`<path d="${tank}" fill="${shirtFill}"/><path d="${tank}" fill="${shade}"/>`);
  } else {
    g.push(`<path d="${torso}" fill="${shirtFill}"/><path d="${torso}" fill="${shade}"/>`);
    const sleeveLen = shirt === 'hoodie' ? 72 : 30;
    const sleeve = (x) => `<rect x="${x - armW / 2 - 2}" y="${torsoTop + 2}" width="${armW + 4}" height="${sleeveLen}" rx="${armW / 2 + 2}" fill="${shirtFill}"/><rect x="${x - armW / 2 - 2}" y="${torsoTop + 2}" width="${armW + 4}" height="${sleeveLen}" rx="${armW / 2 + 2}" fill="${shade}"/>`;
    g.push(sleeve(lax), sleeve(rax));
    if (shirt === 'tee') g.push(`<path d="M${cx - 12} ${torsoTop - 2} q12 10 24 0" fill="none" stroke="#d8d2c4" stroke-width="3"/>`);
    if (shirt === 'hoodie') g.push(`<path d="M${cx - 20 * W} 168 h${40 * W} v22 h-${40 * W} z" fill="#3d4250"/><path d="M${cx - 6} ${torsoTop + 4} v18 M${cx + 6} ${torsoTop + 4} v18" stroke="#f5ead2" stroke-width="2.5" stroke-linecap="round"/><path d="M${cx - 24} ${torsoTop} q24 16 48 0" fill="none" stroke="#3d4250" stroke-width="7"/>`);
  }
  if (chain === 'chain') g.push(`<path d="M${cx - 18} ${torsoTop + 2} q18 22 36 0" fill="none" stroke="#b5b5b5" stroke-width="3" stroke-linecap="round"/>`);
  if (chain === 'chain2') g.push(`<path d="M${cx - 20} ${torsoTop + 2} q20 26 40 0" fill="none" stroke="#e6b94d" stroke-width="5" stroke-linecap="round"/><circle cx="${cx}" cy="${torsoTop + 15}" r="5" fill="#e6b94d"/><circle cx="${cx}" cy="${torsoTop + 15}" r="2" fill="#c99a2e"/>`);

  // ---- neck + head
  g.push(`<rect x="${cx - 11 - (W - 1) * 4}" y="${headY + headRy - 12}" width="${22 + (W - 1) * 8}" height="22" rx="5" fill="${skin2}"/>`);
  g.push(`<g transform="${headScale}">`);
  g.push(`<path d="${headPath}" fill="${skin}"/><path d="${headPath}" fill="${shade}"/>`);
  g.push(`<circle cx="${cx - headRx + 1}" cy="${headY + 4}" r="7" fill="${skin}"/><circle cx="${cx + headRx - 1}" cy="${headY + 4}" r="7" fill="${skin}"/><circle cx="${cx + headRx - 1}" cy="${headY + 4}" r="7" fill="${shade}"/><circle cx="${cx - headRx + 1}" cy="${headY + 4}" r="3" fill="${skin2}"/><circle cx="${cx + headRx - 1}" cy="${headY + 4}" r="3" fill="${skin3}"/>`);
  // cheeks (a little life)
  g.push(`<ellipse cx="${cx - 24}" cy="${headY + 12}" rx="8" ry="4" fill="#c25a3c" opacity=".14"/><ellipse cx="${cx + 24}" cy="${headY + 12}" rx="8" ry="4" fill="#c25a3c" opacity=".14"/>`);

  // ---- beard (guys). Rounded, never a point. Length goes from "box beard" to "down the chest".
  const chin = headY + headRy, trimmed = own('trim');
  if (beardStyle === 1) g.push(`<path d="M${cx - 36} ${headY + 8} q0 36 36 38 q36 -2 36 -38 q-12 22 -36 20 q-24 2 -36 -20z" fill="#2a241f" opacity=".22" clip-path="url(#${uid}head)"/>`);
  if (beardStyle === 2) { const len = 4 + bl * 24 * (trimmed ? .6 : 1), hw = 12 + bl * 5; g.push(`<path d="M${cx - hw} ${chin - 16} q${hw} 6 ${hw * 2} 0 l0 ${len} q0 ${12 + len * .2} -${hw} ${12 + len * .2} q-${hw} 0 -${hw} -${12 + len * .2} z" fill="${hair}"/><path d="M${cx - 11} ${headY + 12} q11 5 22 0 l0 7 q-11 4 -22 0z" fill="${hair}"/>`); }
  if (beardStyle === 3) { const sz = 11 + bl * 12; g.push(`<path d="M${cx - sz} ${headY + 15} q${sz} -9 ${sz * 2} 0 q-${sz * .35} ${sz * .7} -${sz} ${sz * .55} q-${sz * .65} ${sz * .15} -${sz} -${sz * .55}z" fill="${hair}"/>`); }
  if (beardStyle === 4) { const len = 2 + bl * 40 * (trimmed ? .5 : 1), hw = headRx + 2; g.push(`<path d="M${cx - hw} ${headY + 6} q0 ${30} 6 ${40} l0 ${len} q0 ${22 + len * .1} ${hw - 6} ${22 + len * .1} q${hw - 6} 0 ${hw - 6} -${22 + len * .1} l0 -${len} q6 -10 6 -40 q-14 26 -${hw} 24 q-${hw - 14} 2 -${hw} -24z" fill="${hair}"/><path d="M${cx - 20} ${headY + 46 + len * .5} q20 14 40 0" fill="none" stroke="${hair2}" stroke-width="2.5" opacity=".7"/>`); }

  // ---- face
  const ey = headY - 2, ex = 17;
  const mouthY = headY + 23;
  const mouth = stress >= 90 ? `M${cx - 11} ${mouthY + 5} q11 -9 22 0` : stress >= 70 ? `M${cx - 10} ${mouthY + 2} h20` : `M${cx - 12} ${mouthY} q12 12 24 0`;
  const mouthColor = (beardStyle === 2 || beardStyle === 4) ? lighter(skin, .3) : '#2a241f';
  g.push(`<path d="${mouth}" fill="none" stroke="${mouthColor}" stroke-width="3" stroke-linecap="round"/>`);
  if (!own('shades')) {
    const eye = (x) => {
      const t = `transform="translate(${x} ${ey}) scale(${es}) translate(${-x} ${-ey})"`;
      if (L.eyes === 1) return `<g ${t}><path d="M${x - 7} ${ey} q7 -8 14 0 q-7 6 -14 0z" fill="#fff"/><circle cx="${x + 1}" cy="${ey + 1}" r="3.4" fill="${iris}"/><circle cx="${x + 1}" cy="${ey + 1}" r="1.8" fill="#111"/><path d="M${x - 8} ${ey - 1} q8 -8 16 0" fill="none" stroke="${skin3}" stroke-width="2"/></g>`;
      if (L.eyes === 2) return `<g ${t}><path d="M${x - 7} ${ey} q7 -5 14 0 q-7 5 -14 0z" fill="#fff"/><circle cx="${x + 1}" cy="${ey}" r="2.8" fill="${iris}"/><circle cx="${x + 1}" cy="${ey}" r="1.5" fill="#111"/></g>`;
      if (L.eyes === 3) return `<g ${t}><ellipse cx="${x}" cy="${ey}" rx="7.5" ry="9" fill="#fff"/><circle cx="${x + 1}" cy="${ey + 1}" r="5" fill="${iris}"/><circle cx="${x + 1}" cy="${ey + 1}" r="2.6" fill="#111"/><circle cx="${x + 3}" cy="${ey - 1}" r="1.6" fill="#fff"/></g>`;
      return `<g ${t}><ellipse cx="${x}" cy="${ey}" rx="6" ry="7" fill="#fff"/><circle cx="${x + 1}" cy="${ey + 1}" r="3.8" fill="${iris}"/><circle cx="${x + 1}" cy="${ey + 1}" r="2" fill="#111"/><circle cx="${x + 2.5}" cy="${ey - .5}" r="1.2" fill="#fff"/></g>`;
    };
    g.push(eye(cx - ex), eye(cx + ex));
  }
  const bw = 2.5 + (L.brows / 100) * 5, browTilt = stress >= 70 ? 6 : 0;
  g.push(`<path d="M${cx - ex - 9} ${ey - 12 + browTilt} q9 -${4 + bw * .4} 18 -${browTilt ? -2 : 0}" fill="none" stroke="${hair}" stroke-width="${bw}" stroke-linecap="round"/><path d="M${cx + ex - 9} ${ey - 12 - (browTilt ? -2 : 0)} q9 -${4 + bw * .4} 18 ${browTilt}" fill="none" stroke="${hair}" stroke-width="${bw}" stroke-linecap="round"/>`);
  const nose = L.nose === 0 ? `<path d="M${cx - 1} ${headY + 5} q-3 7 2 9" fill="none" stroke="${skin3}" stroke-width="2.5" stroke-linecap="round"/>`
    : L.nose === 2 ? `<path d="M${cx - 3} ${headY + 2} q-7 10 2 14 q8 -2 6 -8" fill="${skin2}"/>`
    : `<circle cx="${cx}" cy="${headY + 11}" r="4.5" fill="${skin2}"/>`;
  g.push(nose);
  if (heat >= 80) g.push(`<path d="M${cx + headRx - 8} ${headY - 26} q7 11 0 13 q-7 -2 0 -13" fill="#7fb3e6"/>`);

  // ---- hair, FRONT layer (shifted to the crown of whatever head shape is picked)
  g.push(`<g transform="translate(0 ${crownDy})">`);
  const topY = headY - headRy;
  const cap = (ext, bang) => `<path d="M${cx - headRx} ${headY - 4 + ext} q0 -${headRy + 4 + ext + hl * 6} ${headRx} -${headRy + 4 + ext + hl * 6} q${headRx} 0 ${headRx} ${headRy + 4 + ext + hl * 6} q-${bang} -${18 + hl * 8} -${headRx} -${22 + hl * 8} q-${headRx - bang} 4 -${headRx} ${22 + hl * 8}z" fill="${hair}"/>`;
  if (guy) {
    if (L.hair === 0) g.push(`<path d="M${cx - headRx + 2} ${headY - 14} q2 -32 ${headRx - 2} -32 q${headRx - 2} 0 ${headRx - 2} 32 q-18 -14 -${headRx - 2} -14 q-${headRx - 4} 0 -${headRx - 2} 14z" fill="${hair}" opacity=".9"/>`);
    if (L.hair === 1) g.push(cap(0, 10), `<path d="M${cx + 10} ${topY - 2 - hl * 6} q10 2 18 10" fill="none" stroke="${hair2}" stroke-width="2.5" opacity=".6"/>`);
    if (L.hair === 2) { g.push(cap(0, 8)); const n = 8, r = 11 + hl * 7; for (let i = 0; i < n; i++) { const a = -Math.PI * .95 + i * (Math.PI * .9 / (n - 1)); g.push(`<circle cx="${cx + Math.cos(a) * (headRx - 2)}" cy="${headY - 6 + Math.sin(a) * (headRy - 2 + hl * 12)}" r="${r}" fill="${i % 2 ? hair : hair2}"/>`); } }
    if (L.hair === 3) g.push(cap(0, 2), `<path d="M${cx - 26} ${topY + 2} q26 -8 52 0 M${cx - 30} ${topY + 10} q30 -8 60 0" fill="none" stroke="${hair2}" stroke-width="2" opacity=".6"/>`);
    if (L.hair === 4) g.push(cap(2, 12));
    if (L.hair === 5 && hl > .06) {
      // bald: nothing at "short". Slide it long and the sides grow out into Rick-style spikes.
      const len = 8 + hl * 75, spikes = 3 + Math.round(hl * 4);
      for (const side of [-1, 1]) {
        const bx = cx + side * (headRx - 6), by = headY - 6;
        for (let i = 0; i < spikes; i++) {
          const t = i / Math.max(1, spikes - 1);
          const ang = (-20 - t * 85) * Math.PI / 180;            // from out-sideways up toward the top
          const l = len * (0.6 + 0.4 * Math.sin(t * Math.PI));
          const tipX = bx + side * Math.cos(ang) * l, tipY = by + Math.sin(ang) * l;
          const w = 8 + hl * 12;
          g.push(`<path d="M${bx - side * 2} ${by - w} Q${bx + side * Math.cos(ang) * l * .55} ${by + Math.sin(ang) * l * .4 - w * .5} ${tipX} ${tipY} Q${bx + side * Math.cos(ang) * l * .55} ${by + Math.sin(ang) * l * .4 + w * .8} ${bx - side * 2} ${by + w} z" fill="${i % 2 ? hair : hair2}"/>`);
        }
      }
      if (hl > .5) g.push(`<path d="M${cx - 2} ${headY - headRy + 2} q${-6 - hl * 10} -${10 + hl * 26} ${2 - hl * 14} -${16 + hl * 30} q${hl * 10} ${8 + hl * 14} ${4 + hl * 10} ${14 + hl * 26} z" fill="${hair}"/>`);
    }
    if (own('cut') && L.hair !== 4 && L.hair !== 5) g.push(`<path d="M${cx - 32} ${headY - 26 - hl * 8} h64" stroke="${hair2}" stroke-width="2.5" stroke-linecap="round"/>`);
  } else {
    if (L.hair === 0) g.push(cap(2, 14));
    if (L.hair === 1) g.push(cap(0, 10));
    if (L.hair === 2) g.push(cap(2, 14));
    if (L.hair === 3) g.push(cap(0, 6));
    if (L.hair === 4) g.push(`<path d="M${cx - headRx + 2} ${headY - 14} q2 -32 ${headRx - 2} -32 q${headRx - 2} 0 ${headRx - 2} 32 q-18 -14 -${headRx - 2} -14 q-${headRx - 4} 0 -${headRx - 2} 14z" fill="${hair}" opacity=".9"/>`);
    if (L.hair === 5) g.push(cap(0, 4), `<path d="M${cx} ${topY + 2} v${headRy}" stroke="${hair2}" stroke-width="2" opacity=".6"/>`);
  }

  g.push('</g>');
  // ---- shades
  if (own('shades')) g.push(`<path d="M${cx - 32} ${ey - 2} h64" stroke="#2a241f" stroke-width="3"/><rect x="${cx - 32}" y="${ey - 9}" width="26" height="16" rx="7" fill="#2a241f"/><rect x="${cx + 6}" y="${ey - 9}" width="26" height="16" rx="7" fill="#2a241f"/><path d="M${cx - 28} ${ey - 5} h8 M${cx + 10} ${ey - 5} h8" stroke="#fff" stroke-width="2" opacity=".45"/>`);

  // ---- hat (flat bill)
  g.push(`<g transform="translate(0 ${crownDy})">`);
  if (own('hat')) g.push(`<path d="M${cx - headRx - 1} ${headY - 18} q0 -42 ${headRx + 1} -42 q${headRx + 1} 0 ${headRx + 1} 42 z" fill="#aa4635"/><path d="M${cx - headRx - 1} ${headY - 18} q0 -42 ${headRx + 1} -42 q${headRx + 1} 0 ${headRx + 1} 42 z" fill="${shade}"/><path d="M${cx - 6} ${headY - 23} h${headRx + 24} q7 0 7 6 q0 6 -7 6 h-${headRx + 24} z" fill="#aa4635"/><path d="M${cx - headRx - 1} ${headY - 18} h${headRx * 2 + 2}" stroke="#8c3328" stroke-width="3"/><circle cx="${cx}" cy="${headY - 58}" r="3" fill="#8c3328"/>`);

  g.push('</g>');
  // ---- the one highlight (vinyl)
  g.push(`<ellipse cx="${cx - 22}" cy="${headY - 30}" rx="9" ry="4" fill="#fff" opacity=".35" transform="rotate(-28 ${cx - 22} ${headY - 30})"/>`);
  g.push('</g>');   // end of the head group

  // ---- phone (right hand)
  if (phone === 'phone') g.push(`<rect x="${rax - 6}" y="${torsoTop + 72}" width="13" height="22" rx="3" fill="#343b38"/><path d="M${rax - 2} ${torsoTop + 76} l4 7 l-3 6" fill="none" stroke="#9fb0ad" stroke-width="1.5"/>`);
  if (phone === 'phone2') g.push(`<rect x="${rax - 7}" y="${torsoTop + 70}" width="15" height="25" rx="4" fill="#1c1c1c"/><rect x="${rax - 4}" y="${torsoTop + 74}" width="9" height="16" rx="1" fill="#3a6fb0"/>`);
  if (phone === 'phone3') g.push(`<rect x="${rax - 8}" y="${torsoTop + 68}" width="17" height="28" rx="5" fill="#111"/><rect x="${rax - 5}" y="${torsoTop + 72}" width="11" height="19" rx="1" fill="#e6b94d"/>`);

  const scale = `translate(${cx - cx * H} ${footY - footY * H}) scale(${H})`;
  return `<g ${opts.transform ? 'transform="' + opts.transform + '"' : ''}><g transform="${scale}">${g.join('')}</g></g>`;
}

// The room. 440×220, same vinyl look as the doll: no outlines, soft shade, one highlight.
// The doll stands in the middle; bought room items show up around them.
function roomSVG(s) {
  const own = id => s.items.includes(id);
  const uid = 'r' + Math.floor(Math.random() * 1e6);
  const p = [];
  p.push(`<defs>
    <linearGradient id="${uid}wall" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#e3cfae"/><stop offset="1" stop-color="#d2bb95"/></linearGradient>
    <linearGradient id="${uid}floor" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#a9784e"/><stop offset="1" stop-color="#8e6239"/></linearGradient>
    <linearGradient id="${uid}sky" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#9fd0e8"/><stop offset="1" stop-color="#d9eef7"/></linearGradient>
    <linearGradient id="${uid}sh" x1="0" x2="1"><stop offset=".5" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".16"/></linearGradient>
    <linearGradient id="${uid}dn" x1="0" x2="0" y1="0" y2="1"><stop offset=".4" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".18"/></linearGradient>
  </defs>`);
  const sh = `url(#${uid}sh)`, dn = `url(#${uid}dn)`;
  // wall + baseboard + floor planks
  p.push(`<rect width="440" height="220" fill="url(#${uid}wall)"/>`);
  p.push(`<rect y="158" width="440" height="6" fill="#c9b48f"/><rect y="164" width="440" height="56" fill="url(#${uid}floor)"/>`);
  for (let x = -20; x < 460; x += 44) p.push(`<path d="M${x} 164 l-14 56" stroke="#7d5531" stroke-width="1.5" opacity=".5"/>`);
  // rug
  p.push(`<ellipse cx="220" cy="206" rx="86" ry="11" fill="#9a4a3a" opacity=".55"/><ellipse cx="220" cy="206" rx="70" ry="8" fill="#b35a46" opacity=".5"/>`);
  // window: frame, sky, what's outside
  p.push(`<rect x="18" y="14" width="98" height="112" rx="4" fill="#f0e2c4"/><rect x="24" y="20" width="86" height="100" rx="2" fill="url(#${uid}sky)"/>`);
  if (own('car2')) p.push(`<path d="M30 96 l10 -14 h42 l10 14 h6 v18 h-74 z" fill="#c43e2e"/><path d="M42 84 h36 l6 12 h-48 z" fill="#8fc3dd"/><circle cx="44" cy="114" r="6" fill="#2a241f"/><circle cx="84" cy="114" r="6" fill="#2a241f"/><circle cx="44" cy="114" r="2.5" fill="#9a9a9a"/><circle cx="84" cy="114" r="2.5" fill="#9a9a9a"/>`);
  else if (own('car')) p.push(`<path d="M32 98 l8 -12 h40 l8 12 h6 v16 h-70 z" fill="#8b8f7a"/><path d="M44 88 h32 l5 10 h-42 z" fill="#b9c9cf"/><circle cx="44" cy="114" r="5" fill="#2a241f"/><circle cx="80" cy="114" r="5" fill="#2a241f"/><path d="M52 90 l10 6" stroke="#5f6354" stroke-width="2"/><rect x="60" y="100" width="10" height="4" fill="#6b6f60"/>`);
  else p.push(`<path d="M24 90 q14 -22 28 -8 q10 -24 24 -6 q12 -20 34 2 v42 h-86 z" fill="#7f9a86"/><circle cx="92" cy="40" r="9" fill="#fff4c2"/>`);
  p.push(`<rect x="66" y="20" width="4" height="100" fill="#f0e2c4"/><rect x="24" y="68" width="86" height="4" fill="#f0e2c4"/><rect x="18" y="124" width="98" height="6" rx="2" fill="#e2cf9f"/>`);
  // bed (vinyl: no outline, blanket fold, pillow, soft shade)
  p.push(`<rect x="266" y="150" width="152" height="12" rx="3" fill="#6b4a2b"/><rect x="266" y="150" width="152" height="12" rx="3" fill="${sh}"/>`);
  p.push(`<rect x="262" y="128" width="160" height="32" rx="8" fill="#b14b3a"/><rect x="262" y="128" width="160" height="32" rx="8" fill="${dn}"/><path d="M262 140 h160" stroke="#8f3a2c" stroke-width="3"/>`);
  p.push(`<rect x="268" y="118" width="46" height="18" rx="7" fill="#f5ead2"/><rect x="268" y="118" width="46" height="18" rx="7" fill="${sh}"/>`);
  p.push(`<rect x="270" y="162" width="8" height="22" rx="3" fill="#4e3620"/><rect x="408" y="162" width="8" height="22" rx="3" fill="#4e3620"/>`);
  // dresser or garbage bag
  if (own('dresser')) {
    p.push(`<rect x="18" y="116" width="76" height="70" rx="4" fill="#b78845"/><rect x="18" y="116" width="76" height="70" rx="4" fill="${sh}"/>`);
    for (const y of [124, 146, 168]) p.push(`<rect x="24" y="${y}" width="64" height="16" rx="3" fill="#a3773a"/><circle cx="56" cy="${y + 8}" r="2.5" fill="#f5ead2"/>`);
    if (own('tv')) p.push(`<rect x="26" y="88" width="60" height="30" rx="3" fill="#1c1c1c"/><rect x="30" y="92" width="52" height="22" rx="1" fill="#3a6fb0"/><rect x="30" y="92" width="52" height="22" rx="1" fill="${dn}"/><path d="M38 98 q10 -4 20 2 q8 6 18 0" fill="none" stroke="#9fd0e8" stroke-width="2" opacity=".6"/>`);
  } else {
    p.push(`<path d="M36 192 q-26 -12 -10 -40 q6 -16 22 -14 q10 2 18 16 q22 30 4 40 z" fill="#4a463c"/><path d="M36 192 q-26 -12 -10 -40 q6 -16 22 -14 q10 2 18 16 q22 30 4 40 z" fill="${sh}"/><path d="M40 140 l16 -10" stroke="#f5ead2" stroke-width="4" stroke-linecap="round"/><ellipse cx="38" cy="156" rx="6" ry="3" fill="#fff" opacity=".18" transform="rotate(-20 38 156)"/>`);
    if (own('tv')) p.push(`<rect x="112" y="146" width="54" height="32" rx="3" fill="#1c1c1c"/><rect x="116" y="150" width="46" height="24" rx="1" fill="#3a6fb0"/><rect x="116" y="150" width="46" height="24" rx="1" fill="${dn}"/><rect x="128" y="178" width="22" height="6" rx="2" fill="#2a241f"/>`);
  }
  if (own('couch')) p.push(`<rect x="300" y="166" width="124" height="26" rx="8" fill="#d9a23a"/><rect x="300" y="166" width="124" height="26" rx="8" fill="${dn}"/><rect x="306" y="156" width="112" height="18" rx="8" fill="#e6b94d"/><rect x="296" y="160" width="14" height="30" rx="6" fill="#c8902c"/><rect x="414" y="160" width="14" height="30" rx="6" fill="#c8902c"/>`);
  if (own('bike')) p.push(`<g transform="translate(102 150)"><circle cx="0" cy="26" r="14" fill="none" stroke="#2a241f" stroke-width="3.5"/><circle cx="44" cy="26" r="14" fill="none" stroke="#2a241f" stroke-width="3.5"/><circle cx="0" cy="26" r="4" fill="#2a241f"/><circle cx="44" cy="26" r="4" fill="#2a241f"/><path d="M0 26 l14 -22 h22 l8 22 M14 4 l8 22 l-22 0 M22 4 h-8" fill="none" stroke="#c43e2e" stroke-width="3.5" stroke-linecap="round"/><path d="M10 2 h8" stroke="#2a241f" stroke-width="3"/></g>`);
  // shadow + the doll
  p.push(`<ellipse cx="222" cy="206" rx="40" ry="6" fill="#000" opacity=".16"/>`);
  p.push(dollSVG(s, { transform: 'translate(160 58) scale(0.56)' }));
  // the dog (vinyl)
  if (own('dog')) p.push(`<g transform="translate(248 170)"><ellipse cx="18" cy="18" rx="19" ry="11" fill="#b07248"/><ellipse cx="18" cy="18" rx="19" ry="11" fill="${sh}"/><circle cx="37" cy="9" r="9" fill="#b07248"/><path d="M31 2 q-2 -9 5 -6 z M43 2 q2 -9 -5 -6 z" fill="#8a5636"/><circle cx="41" cy="8" r="1.8" fill="#2a241f"/><circle cx="45" cy="11" r="2" fill="#2a241f"/><path d="M0 14 q-10 -8 -4 -16" fill="none" stroke="#b07248" stroke-width="4" stroke-linecap="round"/><rect x="6" y="26" width="5" height="8" rx="2" fill="#8a5636"/><rect x="24" y="26" width="5" height="8" rx="2" fill="#8a5636"/><ellipse cx="18" cy="34" rx="18" ry="3" fill="#000" opacity=".12"/></g>`);
  return p.join('');
}

if (typeof module !== 'undefined') module.exports = { dollSVG, roomSVG, HAIR_NAMES, HEAD_NAMES, BEARD_NAMES, EYE_NAMES, NOSE_NAMES, INK_NAMES, SKIN_RAMP, HAIR_RAMP, EYE_RAMP, ramp };
