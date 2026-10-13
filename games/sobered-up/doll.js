/* SOBERED UP — the paper doll, "vinyl figure" style.
   Drawn in code, on purpose: every part is a shape with numbers behind it, so sliders work
   (beard length, hair length, width, height) and any skin or hair color is possible.
   No outlines. One soft shade on the right, one highlight on the head. Toy proportions: big head, short legs.

   Draws into a 200×300 box, feet on the floor at y=262 (room scales from there).

   s.look = { sex, skin 0–100, hairColor 0–100, hair (style index), hairLen 0–100,
              beard (style index, guys), beardLen 0–100, width 0–100, height 0–100, ink 0/1 }
   What's worn comes from s.items via worn(s, slot) in engine.js. */

const HAIR_NAMES = {
  guy:  ['Buzz', 'Short', 'Curly', 'Slicked back', 'Long'],
  girl: ['Bob', 'Ponytail', 'Long', 'Big curls', 'Buzz']
};
const BEARD_NAMES = ['Clean', 'Stubble', 'Goatee', 'Mustache', 'Full beard'];
const INK_NAMES = ['No tattoos', 'Already inked'];
// color ramps: a slider from 0 to 100 walks these stops
const SKIN_RAMP = ['#f7e0c8', '#efc7a4', '#dfa877', '#c4865a', '#a46a44', '#80502f', '#5b3620', '#3d2415'];
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

function dollSVG(s, opts = {}) {
  const L = Object.assign({ sex: 'guy', skin: 40, hairColor: 10, hair: 1, hairLen: 40, beard: 0, beardLen: 40, width: 45, height: 50, ink: 0 }, s.look || {});
  const own = id => s.items && s.items.includes(id);
  const w = slot => (typeof worn === 'function' ? worn(s, slot) : null);
  const skin = ramp(SKIN_RAMP, L.skin), skin2 = darker(skin, .82);
  const hair = ramp(HAIR_RAMP, L.hairColor);
  const W = .8 + (L.width / 100) * .6;              // 0.8 skinny → 1.4 chunky (torso + arms + legs)
  const H = .88 + (L.height / 100) * .26;           // 0.88 short → 1.14 tall
  const hl = L.hairLen / 100, bl = L.beardLen / 100;
  const shirt = w('shirt') || 'tank', pants = w('pants') || 'shorts', shoes = w('shoes') || 'slides';
  const phone = w('phone'), chain = w('chain'), tattoo = w('tattoo');
  const stress = s.stress || 0, heat = s.heat || 0;
  const guy = L.sex === 'guy';
  const beardStyle = guy ? L.beard : 0;
  const uid = 'd' + Math.floor(Math.random() * 1e6);
  const g = [];

  // geometry
  const cx = 100, headY = 72, headRx = 42, headRy = 46;
  const shW = 36 * W;                                // half shoulder width
  const armX = cx + shW + 3 * W, armW = 17 * W;      // arm center x (right side; left mirrors)
  const legW = 19 * Math.max(.9, W), legGap = 3;
  const torsoTop = 118, torsoBot = 204, legBot = 250, footY = 262;

  const shade = `url(#${uid}sh)`;
  g.push(`<defs><linearGradient id="${uid}sh" x1="0" x2="1"><stop offset=".5" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="${VINYL_SHADE}"/></linearGradient>
  <clipPath id="${uid}head"><ellipse cx="${cx}" cy="${headY}" rx="${headRx}" ry="${headRy}"/></clipPath></defs>`);

  // ---- hair, back layer (behind the head)
  const hairBack = [];
  if (guy) {
    if (L.hair === 3) hairBack.push(`<path d="M${cx - 30} ${headY - 20} q0 ${30 + hl * 18} 30 ${34 + hl * 18} q30 -4 30 -${34 + hl * 18} z" fill="${hair}"/>`);
    if (L.hair === 4) hairBack.push(`<path d="M${cx - 40} ${headY - 10} q-6 ${50 + hl * 50} 10 ${64 + hl * 50} h60 q16 -14 10 -${64 + hl * 50} z" fill="${hair}"/>`);
  } else {
    if (L.hair === 0) hairBack.push(`<path d="M${cx - 44} ${headY - 10} q-4 ${40 + hl * 28} 8 ${48 + hl * 28} h72 q12 -8 8 -${48 + hl * 28} z" fill="${hair}"/>`);
    if (L.hair === 1) hairBack.push(`<path d="M${cx + 26} ${headY - 24} q30 10 ${14 + hl * 10} ${70 + hl * 60} q-12 10 -18 -2 q4 -40 -10 -${50 + hl * 40} z" fill="${hair}"/>`);
    if (L.hair === 2) hairBack.push(`<path d="M${cx - 44} ${headY - 10} q-8 ${70 + hl * 70} 10 ${90 + hl * 70} h68 q18 -20 10 -${90 + hl * 70} z" fill="${hair}"/>`);
    if (L.hair === 3) { for (let i = 0; i < 7; i++) { const a = -Math.PI * .95 + i * (Math.PI * 1.9 / 6); hairBack.push(`<circle cx="${cx + Math.cos(a) * (headRx + 8)}" cy="${headY + 6 + Math.sin(a) * (headRy + 4 + hl * 14)}" r="${16 + hl * 6}" fill="${hair}"/>`); } }
  }
  g.push(...hairBack);

  // ---- legs + feet
  const lx = cx - legW - legGap / 2, rx = cx + legGap / 2;
  const legFill = pants === 'jeans' ? '#3b4f7a' : skin;
  g.push(`<rect x="${lx}" y="${torsoBot - 8}" width="${legW}" height="${legBot - torsoBot + 8}" rx="${legW / 3}" fill="${legFill}"/><rect x="${rx}" y="${torsoBot - 8}" width="${legW}" height="${legBot - torsoBot + 8}" rx="${legW / 3}" fill="${legFill}"/>`);
  g.push(`<rect x="${lx}" y="${torsoBot - 8}" width="${legW}" height="${legBot - torsoBot + 8}" rx="${legW / 3}" fill="${shade}"/><rect x="${rx}" y="${torsoBot - 8}" width="${legW}" height="${legBot - torsoBot + 8}" rx="${legW / 3}" fill="${shade}"/>`);
  if (pants === 'shorts') g.push(`<path d="M${lx - 2} ${torsoBot - 10} h${legW * 2 + legGap + 4} v${26} q0 4 -4 4 h-${legW - 2} v-4 h-${legGap + 2} v4 h-${legW - 2} q-4 0 -4 -4 z" fill="#6f7a6b"/>`);
  // feet
  const foot = (x, flip) => {
    if (shoes === 'dunks') return `<path d="M${x} ${legBot - 2} h${legW} q${flip ? 10 : 2} 2 ${flip ? 8 : 4} 8 l1 6 q0 2 -2 2 h-${legW + (flip ? 8 : 4) + 2} q-3 0 -3 -4 v-8 q0 -4 4 -4 z" fill="#f6f1e6"/><path d="M${x + 2} ${legBot + 10} h${legW + 2} " stroke="#aa4635" stroke-width="3"/>`;
    if (shoes === 'shoes') return `<path d="M${x - 1} ${legBot - 6} h${legW + 2} q${flip ? 8 : 2} 0 ${flip ? 8 : 4} 6 v10 q0 4 -4 4 h-${legW + (flip ? 10 : 6)} q-4 0 -4 -4 v-12 q0 -4 4 -4z" fill="#6b4a2b"/>`;
    return `<path d="M${x - 1} ${legBot + 4} h${legW + 2} q${flip ? 6 : 2} 0 ${flip ? 6 : 3} 4 v2 q0 2 -2 2 h-${legW + (flip ? 8 : 5)} q-3 0 -3 -3 v-1 q0 -4 3 -4z" fill="#3a3a3a"/><path d="M${x + 1} ${legBot + 2} h${legW}" stroke="#aa4635" stroke-width="4"/>`;
  };
  g.push(foot(lx, false), foot(rx, true));

  // ---- arms (skin) — hoodie/tee sleeves get drawn over the top later
  const arm = (x) => `<rect x="${x - armW / 2}" y="${torsoTop + 6}" width="${armW}" height="${70}" rx="${armW / 2}" fill="${skin}"/><rect x="${x - armW / 2}" y="${torsoTop + 6}" width="${armW}" height="70" rx="${armW / 2}" fill="${shade}"/>`;
  const lax = cx - shW - 3 * W, rax = armX;
  g.push(arm(lax), arm(rax));
  // starting ink (left forearm) + bought tattoos (right arm)
  if (L.ink === 1) g.push(`<path d="M${lax - 4} 160 l4 5 l4 -5 M${lax - 4} 170 h8 M${lax - 3} 178 l3 4 l3 -4" fill="none" stroke="#2a241f" stroke-width="2.2" stroke-linecap="round"/>`);
  if (tattoo === 'tattoo') g.push(`<path d="M${rax - 4} 164 l4 5 l4 -5 M${rax - 4} 173 h8" fill="none" stroke="#2a241f" stroke-width="2.2" stroke-linecap="round"/>`);
  if (tattoo === 'tattoo2') g.push(`<rect x="${rax - armW / 2}" y="${torsoTop + 6}" width="${armW}" height="70" rx="${armW / 2}" fill="#2a241f" opacity=".3"/><path d="M${rax - 5} 136 q5 6 10 0 M${rax - 5} 150 q5 6 10 0 M${rax - 5} 164 q5 6 10 0 M${rax - 5} 178 q5 6 10 0" fill="none" stroke="#2a241f" stroke-width="2.2"/>`);
  // hands
  g.push(`<circle cx="${lax}" cy="${torsoTop + 82}" r="${9 * Math.max(.9, W)}" fill="${skin}"/><circle cx="${rax}" cy="${torsoTop + 82}" r="${9 * Math.max(.9, W)}" fill="${skin}"/>`);
  if (own('watch')) g.push(`<rect x="${lax - armW / 2 - 1}" y="${torsoTop + 68}" width="${armW + 2}" height="7" rx="2" fill="#e6b94d"/>`);

  // ---- torso + shirt
  const torso = `M${cx - shW} ${torsoTop} q${shW} -10 ${shW * 2} 0 q${6 * W} 44 ${2 * W} ${torsoBot - torsoTop} h-${shW * 2 + 4 * W} q-${4 * W} -42 ${2 * W} -${torsoBot - torsoTop} z`;
  const shirtFill = shirt === 'hoodie' ? '#4a4f5a' : shirt === 'tee' ? '#f6f1e6' : '#e9e2d2';
  if (shirt === 'tank') {
    g.push(`<path d="${torso}" fill="${skin}"/><path d="${torso}" fill="${shade}"/>`);
    g.push(`<path d="M${cx - shW + 8} ${torsoTop - 2} h10 q-2 16 ${shW - 18} 16 q${shW - 18} 0 ${shW - 18} -16 h10 l${3 * W} ${torsoBot - torsoTop + 2} h-${shW * 2 + 2 * W} z" fill="${shirtFill}"/>`);
    g.push(`<path d="M${cx - shW + 8} ${torsoTop - 2} h10 q-2 16 ${shW - 18} 16 q${shW - 18} 0 ${shW - 18} -16 h10 l${3 * W} ${torsoBot - torsoTop + 2} h-${shW * 2 + 2 * W} z" fill="${shade}"/>`);
  } else {
    g.push(`<path d="${torso}" fill="${shirtFill}"/><path d="${torso}" fill="${shade}"/>`);
    const sleeveLen = shirt === 'hoodie' ? 72 : 30;
    const sleeve = (x) => `<rect x="${x - armW / 2 - 2}" y="${torsoTop + 2}" width="${armW + 4}" height="${sleeveLen}" rx="${armW / 2 + 2}" fill="${shirtFill}"/><rect x="${x - armW / 2 - 2}" y="${torsoTop + 2}" width="${armW + 4}" height="${sleeveLen}" rx="${armW / 2 + 2}" fill="${shade}"/>`;
    g.push(sleeve(lax), sleeve(rax));
    if (shirt === 'hoodie') g.push(`<path d="M${cx - 20 * W} 168 h${40 * W} v22 h-${40 * W} z" fill="#3d4250"/><path d="M${cx - 6} ${torsoTop + 4} v18 M${cx + 6} ${torsoTop + 4} v18" stroke="#f5ead2" stroke-width="2.5" stroke-linecap="round"/><path d="M${cx - 22} ${torsoTop + 2} q22 14 44 0" fill="none" stroke="#3d4250" stroke-width="6"/>`);
  }
  // chain
  if (chain === 'chain') g.push(`<path d="M${cx - 18} ${torsoTop + 4} q18 22 36 0" fill="none" stroke="#b5b5b5" stroke-width="3" stroke-linecap="round"/>`);
  if (chain === 'chain2') g.push(`<path d="M${cx - 20} ${torsoTop + 4} q20 26 40 0" fill="none" stroke="#e6b94d" stroke-width="5" stroke-linecap="round"/><circle cx="${cx}" cy="${torsoTop + 17}" r="4" fill="#e6b94d"/>`);

  // ---- neck + head
  g.push(`<rect x="${cx - 11}" y="${headY + headRy - 12}" width="22" height="22" rx="5" fill="${skin2}"/>`);
  g.push(`<ellipse cx="${cx}" cy="${headY}" rx="${headRx}" ry="${headRy}" fill="${skin}"/><ellipse cx="${cx}" cy="${headY}" rx="${headRx}" ry="${headRy}" fill="${shade}"/>`);
  // ears
  g.push(`<circle cx="${cx - headRx + 1}" cy="${headY + 4}" r="7" fill="${skin}"/><circle cx="${cx + headRx - 1}" cy="${headY + 4}" r="7" fill="${skin}"/><circle cx="${cx + headRx - 1}" cy="${headY + 4}" r="7" fill="${shade}"/>`);

  // ---- beard (guys)
  const bTop = headY + 10, chin = headY + headRy;
  const trimmed = own('trim');
  if (beardStyle === 1) g.push(`<path d="M${cx - 34} ${bTop} q0 ${34} 34 ${36} q34 -2 34 -36 q-12 22 -34 20 q-22 2 -34 -20z" fill="#2a241f" opacity=".22" clip-path="url(#${uid}head)"/>`);
  if (beardStyle === 2) { const len = 10 + bl * 22 * (trimmed ? .6 : 1); g.push(`<path d="M${cx - 13} ${chin - 14} q13 6 26 0 q4 ${len} -13 ${len + 6} q-17 -6 -13 -${len + 6}z" fill="${hair}"/><path d="M${cx - 10} ${headY + 12} q10 5 20 0 l0 7 q-10 4 -20 0z" fill="${hair}"/>`); }
  if (beardStyle === 3) { const sz = 10 + bl * 10; g.push(`<path d="M${cx - sz} ${headY + 14} q${sz} -8 ${sz * 2} 0 q-${sz * .4} ${sz * .6} -${sz} ${sz * .5} q-${sz * .6} ${sz * .1} -${sz} -${sz * .5}z" fill="${hair}"/>`); }
  if (beardStyle === 4) { const len = 8 + bl * 34 * (trimmed ? .55 : 1); g.push(`<path d="M${cx - 40} ${bTop} q-2 ${30 + len * .5} 40 ${42 + len} q42 -${12 + len * .5} 40 -${42 + len} q-14 24 -40 22 q-26 2 -40 -22z" fill="${hair}"/>`); }

  // ---- face
  const ey = headY - 2, ex = 17;
  const mouthY = headY + 22;
  const mouth = stress >= 90 ? `M${cx - 10} ${mouthY + 4} q10 -8 20 0` : stress >= 70 ? `M${cx - 10} ${mouthY + 2} h20` : `M${cx - 11} ${mouthY} q11 10 22 0`;
  g.push(`<path d="${mouth}" fill="none" stroke="${beardStyle >= 2 && beardStyle !== 3 ? skin : '#2a241f'}" stroke-width="3" stroke-linecap="round"/>`);
  if (!own('shades')) {
    g.push(`<ellipse cx="${cx - ex}" cy="${ey}" rx="6" ry="7" fill="#fff"/><ellipse cx="${cx + ex}" cy="${ey}" rx="6" ry="7" fill="#fff"/>`);
    g.push(`<circle cx="${cx - ex + 1}" cy="${ey + 1}" r="3.6" fill="#2a241f"/><circle cx="${cx + ex + 1}" cy="${ey + 1}" r="3.6" fill="#2a241f"/>`);
    g.push(`<circle cx="${cx - ex + 2.5}" cy="${ey - .5}" r="1.2" fill="#fff"/><circle cx="${cx + ex + 2.5}" cy="${ey - .5}" r="1.2" fill="#fff"/>`);
  }
  const browTilt = stress >= 70 ? 6 : 0;
  g.push(`<path d="M${cx - ex - 9} ${ey - 12 + browTilt} q9 -5 18 0" fill="none" stroke="${hair}" stroke-width="4" stroke-linecap="round"/><path d="M${cx + ex - 9} ${ey - 12} q9 -5 18 ${browTilt}" fill="none" stroke="${hair}" stroke-width="4" stroke-linecap="round"/>`);
  g.push(`<path d="M${cx - 2} ${headY + 4} q-4 8 2 10" fill="none" stroke="${skin2}" stroke-width="2.5" stroke-linecap="round"/>`);   // nose
  if (heat >= 80) g.push(`<path d="M${cx + headRx - 6} ${headY - 24} q6 10 0 12 q-6 -2 0 -12" fill="#7fb3e6"/>`);

  // ---- hair, front layer
  const top = headY - headRy;
  if (guy) {
    if (L.hair === 0) g.push(`<path d="M${cx - 40} ${headY - 14} q2 -30 40 -30 q38 0 40 30 q-18 -14 -40 -14 q-22 0 -40 14z" fill="${hair}" opacity=".9"/>`);
    if (L.hair === 1) g.push(`<path d="M${cx - 42} ${headY - 8} q-2 -${40 + hl * 8} 42 -${40 + hl * 8} q44 0 42 ${40 + hl * 8} q-4 -6 -10 -8 q-14 -14 -32 -14 q-18 0 -32 14 q-6 2 -10 8z" fill="${hair}"/>`);
    if (L.hair === 2) { g.push(`<path d="M${cx - 42} ${headY - 6} q-4 -38 42 -38 q46 0 42 38 q-14 -18 -42 -18 q-28 0 -42 18z" fill="${hair}"/>`); for (let i = 0; i < 6; i++) { const a = -Math.PI * .92 + i * (Math.PI * .84 / 5); g.push(`<circle cx="${cx + Math.cos(a) * 36}" cy="${headY - 8 + Math.sin(a) * (34 + hl * 10)}" r="${12 + hl * 5}" fill="${hair}"/>`); } }
    if (L.hair === 3) g.push(`<path d="M${cx - 42} ${headY - 6} q0 -42 42 -42 q42 0 42 42 q-6 -16 -42 -22 q-36 6 -42 22z" fill="${hair}"/><path d="M${cx - 30} ${top + 6} q30 -8 60 0" fill="none" stroke="${darker(hair, .7)}" stroke-width="2" opacity=".6"/>`);
    if (L.hair === 4) g.push(`<path d="M${cx - 44} ${headY} q-2 -46 44 -46 q46 0 44 46 q-10 -20 -44 -22 q-34 2 -44 22z" fill="${hair}"/>`);
    if (own('cut') && L.hair !== 4) g.push(`<path d="M${cx - 30} ${headY - 24} h60" stroke="${darker(hair, .6)}" stroke-width="2.5" stroke-linecap="round" opacity=".8"/>`);
  } else {
    if (L.hair === 0) g.push(`<path d="M${cx - 44} ${headY - 4} q-2 -44 44 -44 q46 0 44 44 q-6 -22 -44 -24 q-38 2 -44 24z" fill="${hair}"/>`);
    if (L.hair === 1) g.push(`<path d="M${cx - 42} ${headY - 6} q0 -42 42 -42 q42 0 42 42 q-8 -18 -42 -22 q-34 4 -42 22z" fill="${hair}"/>`);
    if (L.hair === 2) g.push(`<path d="M${cx - 44} ${headY} q-2 -48 44 -48 q46 0 44 48 q-10 -22 -44 -26 q-34 4 -44 26z" fill="${hair}"/>`);
    if (L.hair === 3) g.push(`<path d="M${cx - 44} ${headY - 4} q-4 -44 44 -44 q48 0 44 44 q-12 -20 -44 -22 q-32 2 -44 22z" fill="${hair}"/>`);
    if (L.hair === 4) g.push(`<path d="M${cx - 40} ${headY - 14} q2 -30 40 -30 q38 0 40 30 q-18 -14 -40 -14 q-22 0 -40 14z" fill="${hair}" opacity=".9"/>`);
  }

  // ---- shades
  if (own('shades')) g.push(`<path d="M${cx - 30} ${ey - 2} h60" stroke="#2a241f" stroke-width="3"/><rect x="${cx - 30}" y="${ey - 8}" width="24" height="15" rx="6" fill="#2a241f"/><rect x="${cx + 6}" y="${ey - 8}" width="24" height="15" rx="6" fill="#2a241f"/><path d="M${cx - 26} ${ey - 5} h8" stroke="#fff" stroke-width="2" opacity=".5"/>`);

  // ---- hat (flat bill)
  if (own('hat')) g.push(`<path d="M${cx - 42} ${headY - 18} q0 -40 42 -40 q42 0 42 40 z" fill="#aa4635"/><path d="M${cx - 42} ${headY - 18} q0 -40 42 -40 q42 0 42 40 z" fill="${shade}"/><path d="M${cx - 4} ${headY - 22} h${60} q6 0 6 6 q0 6 -6 6 h-${60} z" fill="#aa4635"/><path d="M${cx - 42} ${headY - 18} h84" stroke="#8c3328" stroke-width="3"/>`);

  // ---- phone (right hand)
  if (phone === 'phone') g.push(`<rect x="${rax - 6}" y="${torsoTop + 72}" width="13" height="22" rx="3" fill="#343b38"/><path d="M${rax - 2} ${torsoTop + 76} l4 7 l-3 6" fill="none" stroke="#9fb0ad" stroke-width="1.5"/>`);
  if (phone === 'phone2') g.push(`<rect x="${rax - 7}" y="${torsoTop + 70}" width="15" height="25" rx="4" fill="#1c1c1c"/><rect x="${rax - 4}" y="${torsoTop + 74}" width="9" height="16" rx="1" fill="#3a6fb0"/>`);
  if (phone === 'phone3') g.push(`<rect x="${rax - 8}" y="${torsoTop + 68}" width="17" height="28" rx="5" fill="#111"/><rect x="${rax - 5}" y="${torsoTop + 72}" width="11" height="19" rx="1" fill="#e6b94d"/>`);

  // ---- the one highlight (vinyl)
  g.push(`<ellipse cx="${cx - 22}" cy="${headY - 30}" rx="9" ry="4" fill="#fff" opacity=".35" transform="rotate(-28 ${cx - 22} ${headY - 30})"/>`);

  const scale = `translate(${cx - cx * H} ${footY - footY * H}) scale(${H})`;
  return `<g ${opts.transform ? 'transform="' + opts.transform + '"' : ''}><g transform="${scale}">${g.join('')}</g></g>`;
}

// The room. 440×220. The doll stands in the middle; bought room items show up around them.
function roomSVG(s) {
  const own = id => s.items.includes(id);
  const INK = '#292720';
  const p = [];
  p.push(`<path d="M0 0h440v220H0z" fill="#d8c39f"/><path d="M0 162h440v58H0z" fill="#bd8b5d" stroke="${INK}" stroke-width="3"/>`);
  p.push(`<path d="M22 16h88v110H22z" fill="#cfe3ea" stroke="${INK}" stroke-width="4"/>`);
  if (own('car2')) p.push(`<path d="M30 92 l10 -14 h40 l10 14 h8 v18 h-76 z" fill="#aa4635" stroke="${INK}" stroke-width="3"/><circle cx="44" cy="110" r="6" fill="${INK}"/><circle cx="84" cy="110" r="6" fill="${INK}"/>`);
  else if (own('car')) p.push(`<path d="M30 94 l8 -12 h38 l8 12 h6 v16 h-68 z" fill="#8b8f7a" stroke="${INK}" stroke-width="3"/><circle cx="42" cy="110" r="5" fill="${INK}"/><circle cx="78" cy="110" r="5" fill="${INK}"/><path d="M52 86 l10 6" stroke="${INK}" stroke-width="2"/>`);
  else p.push(`<path d="M24 68l20-19 21 8 23-29 20 42" fill="#799081"/>`);
  p.push(`<path d="M66 17v107M24 66h85" stroke="${INK}" stroke-width="3"/>`);
  p.push(`<path d="M268 145h146v34H268z" fill="#a94736" stroke="${INK}" stroke-width="4"/><path d="M270 135h45v18h-45z" fill="#f5ead2" stroke="${INK}" stroke-width="3"/><path d="M277 179v21m130-21v21" stroke="${INK}" stroke-width="6"/>`);
  if (own('dresser')) {
    p.push(`<path d="M20 118h72v73H20z" fill="#b78845" stroke="${INK}" stroke-width="4"/><path d="M21 141h70m-70 24h70" stroke="${INK}" stroke-width="3"/><circle cx="56" cy="130" r="3"/><circle cx="56" cy="154" r="3"/><circle cx="56" cy="178" r="3"/>`);
    if (own('tv')) p.push(`<rect x="28" y="92" width="56" height="30" rx="2" fill="#1c1c1c" stroke="${INK}" stroke-width="3"/><rect x="32" y="96" width="48" height="22" fill="#3a6fb0"/>`);
  } else {
    p.push(`<path d="M31 195q-25-15-7-44l13-15 25 4q35 45 12 58z" fill="#49453b" stroke="${INK}" stroke-width="4"/><path d="M36 141l18-8" stroke="${INK}" stroke-width="5"/>`);
    if (own('tv')) p.push(`<rect x="118" y="150" width="50" height="28" rx="2" fill="#1c1c1c" stroke="${INK}" stroke-width="3"/><rect x="122" y="154" width="42" height="20" fill="#3a6fb0"/><path d="M130 178 v8 h26 v-8" fill="none" stroke="${INK}" stroke-width="3"/>`);
  }
  if (own('couch')) p.push(`<path d="M300 190v-22q0-15 17-15h93q17 0 17 15v22z" fill="#e6b94d" stroke="${INK}" stroke-width="4"/>`);
  if (own('bike')) p.push(`<g transform="translate(98 152)"><circle cx="0" cy="26" r="14" fill="none" stroke="${INK}" stroke-width="3"/><circle cx="44" cy="26" r="14" fill="none" stroke="${INK}" stroke-width="3"/><path d="M0 26 l14 -22 h22 l8 22 M14 4 l8 22 l-22 0 M22 4 h-8" fill="none" stroke="#aa4635" stroke-width="3"/></g>`);
  p.push(`<ellipse cx="220" cy="206" rx="46" ry="6" fill="#29272030"/>`);
  p.push(dollSVG(s, { transform: 'translate(150 30) scale(0.67)' }));
  if (own('dog')) p.push(`<g transform="translate(246 168)"><ellipse cx="18" cy="18" rx="18" ry="11" fill="#b07248" stroke="${INK}" stroke-width="3"/><circle cx="36" cy="10" r="9" fill="#b07248" stroke="${INK}" stroke-width="3"/><path d="M30 2 l-2 -8 l6 4 M40 2 l2 -8 l-6 4" fill="#b07248" stroke="${INK}" stroke-width="2"/><circle cx="40" cy="9" r="1.8" fill="${INK}"/><path d="M0 14 q-10 -8 -4 -16" fill="none" stroke="${INK}" stroke-width="3"/><path d="M8 28 v6 M26 28 v6" stroke="${INK}" stroke-width="3"/></g>`);
  return p.join('');
}

if (typeof module !== 'undefined') module.exports = { dollSVG, roomSVG, HAIR_NAMES, BEARD_NAMES, INK_NAMES, SKIN_RAMP, HAIR_RAMP, ramp };
