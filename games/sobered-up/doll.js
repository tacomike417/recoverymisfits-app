/* SOBERED UP — the paper doll.
   Flat, simple, cartoon. Stand-in shapes for now; every layer here maps to one art file later
   (see PARTS-LIST.md). Draws into a 200×300 box. Layers stack back → front:

   hood (behind head) → hair-back → body (skin) → tattoo → pants → shirt → shoes → watch
   → chain → beard → face → hair-front → shades → hat → phone (in hand)

   The look (sex, skin, hair, hairColor, beard, build) comes from s.look.
   What's worn comes from s.items via worn(s, slot) in engine.js. */

const SKIN = [
  { fill: '#f1c9a5', line: '#b8835a' },
  { fill: '#d9a06f', line: '#9a6238' },
  { fill: '#b07248', line: '#6e4226' },
  { fill: '#6f4a30', line: '#3b2416' }
];
const HAIR_COLOR = ['#1d1a16', '#5a3a22', '#c9a04a', '#8a8a8a'];
const HAIR_NAMES = {
  guy:  ['Buzz', 'Short', 'Curly', 'Pulled back'],
  girl: ['Bob', 'Ponytail', 'Long', 'Big curls']
};
const BEARD_NAMES = ['Clean', 'Stubble', 'Goatee', 'Mustache', 'Full beard'];
const BUILD_NAMES = ['Slim', 'Average', 'Solid', 'Chunky'];
const HEIGHT_NAMES = ['Short', 'Average', 'Tall'];
const INK_NAMES = ['No tattoos', 'Already inked'];
const INK = '#292720';

function dollSVG(s, opts = {}) {
  const L = Object.assign({ sex: 'guy', skin: 1, hair: 1, hairColor: 0, beard: 0, build: 1, height: 1, ink: 0 }, s.look || {});
  // height: short / average / tall → the whole doll scales from the feet (feet stay at y=282)
  const hs = [0.9, 1, 1.08][L.height] || 1;
  const own = id => s.items && s.items.includes(id);
  const w = slot => (typeof worn === 'function' ? worn(s, slot) : null);
  const skin = SKIN[L.skin] || SKIN[1];
  const hc = HAIR_COLOR[L.hairColor] || HAIR_COLOR[0];
  const wide = [-3, 0, 6, 12][L.build] || 0;       // slim / average / solid / chunky = torso and arm width
  const shirt = w('shirt') || 'tank';
  const pants = w('pants') || 'shorts';
  const shoes = w('shoes') || 'slides';
  const phone = w('phone');
  const chain = w('chain');
  const tattoo = w('tattoo');
  const stress = s.stress || 0, heat = s.heat || 0;
  const beard = L.sex === 'guy' ? (own('trim') && L.beard === 4 ? 1.5 : L.beard) : 0;   // 0 clean 1 stubble 2 goatee 3 mustache 4 full (1.5 = trimmed full)
  const S = `stroke="${INK}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"`;
  const g = [];

  // ---- hood (behind head)
  if (shirt === 'hoodie') g.push(`<path d="M70 104 Q72 40 100 36 Q128 40 130 104 Z" fill="#4a4f5a" ${S}/>`);

  // ---- hair, back layer
  if (L.sex === 'girl') {
    if (L.hair === 1) g.push(`<path d="M118 56 Q140 70 128 120 Q118 130 112 110 Q116 80 110 62 Z" fill="${hc}" ${S}/>`);
    if (L.hair === 2) g.push(`<path d="M72 60 Q60 110 74 150 L126 150 Q140 110 128 60 Z" fill="${hc}" ${S}/>`);
    if (L.hair === 3) g.push(`<path d="M66 70 Q50 110 70 135 Q85 150 100 140 Q115 150 130 135 Q150 110 134 70 Z" fill="${hc}" ${S}/>`);
  } else if (L.hair === 3) {
    g.push(`<circle cx="100" cy="46" r="11" fill="${hc}" ${S}/>`);
  }

  // ---- body: legs, arms, neck, head (skin)
  g.push(`<path d="M80 180 h18 v90 h-18 z M102 180 h18 v90 h-18 z" fill="${skin.fill}" ${S}/>`);                       // legs
  g.push(`<rect x="${52 - wide}" y="104" width="16" height="80" rx="8" fill="${skin.fill}" ${S}/>`);                       // left arm
  g.push(`<rect x="${132 + wide}" y="104" width="16" height="80" rx="8" fill="${skin.fill}" ${S}/>`);                      // right arm
  g.push(`<circle cx="${60 - wide}" cy="188" r="9" fill="${skin.fill}" ${S}/><circle cx="${140 + wide}" cy="188" r="9" fill="${skin.fill}" ${S}/>`); // hands
  g.push(`<rect x="91" y="84" width="18" height="24" fill="${skin.fill}" ${S}/>`);                                        // neck
  g.push(`<ellipse cx="100" cy="62" rx="27" ry="31" fill="${skin.fill}" ${S}/>`);                                         // head

  // ---- starting ink (left arm) — picked at the start, not bought
  if (L.ink === 1) g.push(`<path d="M${55 - wide} 140 l5 6 l5 -6 M${56 - wide} 152 h8 M${57 - wide} 162 l3 5 l3 -5" fill="none" stroke="${INK}" stroke-width="2.5"/>`);
  // ---- tattoo (right arm, before the shirt so sleeves can cover the top of it)
  if (tattoo === 'tattoo') g.push(`<path d="M${136 + wide} 150 l4 6 l4 -6 M${137 + wide} 160 h6" fill="none" stroke="${INK}" stroke-width="2.5"/>`);
  if (tattoo === 'tattoo2') g.push(`<rect x="${133 + wide}" y="108" width="14" height="72" rx="7" fill="${INK}" opacity=".35"/><path d="M${136 + wide} 120 q4 6 8 0 M${136 + wide} 135 q4 6 8 0 M${136 + wide} 150 q4 6 8 0 M${136 + wide} 165 q4 6 8 0" fill="none" stroke="${INK}" stroke-width="2.5"/>`);

  // ---- pants
  if (pants === 'jeans') g.push(`<path d="M78 178 h44 v92 h-20 v-60 h-4 v60 h-20 z" fill="#3b4f7a" ${S}/><path d="M78 184 h44" stroke="${INK}" stroke-width="3"/>`);
  else g.push(`<path d="M78 178 h44 v48 h-20 v-14 h-4 v14 h-20 z" fill="#6f7a6b" ${S}/>`);

  // ---- shirt
  const tx = 68 - wide, tw = 64 + wide * 2;
  if (shirt === 'hoodie') {
    g.push(`<rect x="${tx}" y="100" width="${tw}" height="86" rx="10" fill="#4a4f5a" ${S}/>`);
    g.push(`<rect x="${50 - wide}" y="102" width="20" height="80" rx="10" fill="#4a4f5a" ${S}/><rect x="${130 + wide}" y="102" width="20" height="80" rx="10" fill="#4a4f5a" ${S}/>`);
    g.push(`<path d="M${80 - wide} 150 h${40 + wide * 2} v24 h-${40 + wide * 2} z" fill="#3d4250" ${S}/><path d="M94 104 v20 M106 104 v20" stroke="#f5ead2" stroke-width="2.5"/>`);
  } else if (shirt === 'tee') {
    g.push(`<rect x="${tx}" y="100" width="${tw}" height="86" rx="10" fill="#f6f1e6" ${S}/>`);
    g.push(`<rect x="${50 - wide}" y="102" width="20" height="30" rx="8" fill="#f6f1e6" ${S}/><rect x="${130 + wide}" y="102" width="20" height="30" rx="8" fill="#f6f1e6" ${S}/>`);
  } else { // tank — straps, shoulders showing
    g.push(`<path d="M${tx + 8} 100 h10 v12 h${tw - 36} v-12 h10 v86 h-${tw - 16} z" fill="#e9e2d2" ${S}/>`);
  }

  // ---- shoes
  if (shoes === 'dunks') g.push(`<path d="M74 268 h28 l6 14 h-36 z M98 268 h28 l6 14 h-36 z" fill="#f6f1e6" ${S}/><path d="M80 274 l12 4 M104 274 l12 4" stroke="#aa4635" stroke-width="4"/>`);
  else if (shoes === 'shoes') g.push(`<path d="M76 262 h22 v20 h-26 z M100 262 h22 v20 h-22 l-4 0 z" fill="#6b4a2b" ${S}/>`);
  else g.push(`<path d="M76 272 h24 v8 h-28 z M100 272 h24 v8 h-24 z" fill="#3a3a3a" ${S}/><path d="M80 272 h16 M104 272 h16" stroke="#aa4635" stroke-width="4"/>`);

  // ---- watch (left wrist)
  if (own('watch')) g.push(`<rect x="${52 - wide}" y="172" width="16" height="8" fill="#e6b94d" ${S}/>`);

  // ---- chain
  if (chain === 'chain') g.push(`<path d="M80 108 Q100 136 120 108" fill="none" stroke="#9a9a9a" stroke-width="3"/>`);
  if (chain === 'chain2') g.push(`<path d="M78 108 Q100 142 122 108" fill="none" stroke="#e6b94d" stroke-width="5"/><circle cx="100" cy="124" r="4" fill="#e6b94d" stroke="${INK}" stroke-width="2"/>`);

  // ---- beard
  if (beard === 1) g.push(`<path d="M78 70 Q80 94 100 96 Q120 94 122 70 Q112 86 100 86 Q88 86 78 70 Z" fill="${INK}" opacity=".28"/>`);
  if (beard === 1.5) g.push(`<path d="M76 66 Q78 96 100 98 Q122 96 124 66 Q114 84 100 84 Q86 84 76 66 Z" fill="${hc}" ${S}/>`);
  if (beard === 2) g.push(`<path d="M90 84 Q90 100 100 102 Q110 100 110 84 Q100 90 90 84 Z" fill="${hc}" ${S}/><path d="M92 70 q8 5 16 0 l0 8 q-8 4 -16 0 z" fill="${hc}" ${S}/>`);
  if (beard === 3) g.push(`<path d="M86 72 q14 -8 28 0 q-6 6 -14 4 q-8 2 -14 -4 z" fill="${hc}" ${S}/>`);
  if (beard === 4) g.push(`<path d="M74 62 Q74 104 100 108 Q126 104 126 62 Q116 82 100 80 Q84 82 74 62 Z" fill="${hc}" ${S}/>`);

  // ---- face
  const mouth = stress >= 90 ? 'M90 80 q10 -7 20 0' : stress >= 70 ? 'M90 78 h20' : 'M89 76 q11 9 22 0';
  g.push(`<path d="${mouth}" fill="none" stroke="${INK}" stroke-width="3"/>`);
  if (beard === 4 || beard === 1.5) g.push(`<path d="M92 76 q8 4 16 0" fill="none" stroke="${INK}" stroke-width="2"/>`);
  g.push(`<circle cx="89" cy="60" r="3" fill="${INK}"/><circle cx="111" cy="60" r="3" fill="${INK}"/>`);
  g.push(`<path d="M83 52 h12 M105 52 h12" stroke="${INK}" stroke-width="3" ${stress >= 70 ? 'transform="rotate(-8 89 52)"' : ''}/>`);
  if (heat >= 80) g.push(`<path d="M126 46 q5 8 0 10 q-5 -2 0 -10" fill="#7fb3e6" stroke="#2f5fb3" stroke-width="2"/>`);

  // ---- hair, front layer
  const lineup = own('cut');
  if (L.sex === 'guy') {
    if (L.hair === 0) g.push(`<path d="M73 56 Q74 32 100 30 Q126 32 127 56 Q114 46 100 46 Q86 46 73 56 Z" fill="${hc}" ${S}/>`);
    if (L.hair === 1) g.push(`<path d="M72 58 Q70 26 100 26 Q130 26 128 58 L124 48 Q112 40 100 40 Q88 40 76 48 Z" fill="${hc}" ${S}/>`);
    if (L.hair === 2) g.push(`<path d="M72 58 Q66 28 100 24 Q134 28 128 58 Q122 44 100 44 Q78 44 72 58 Z" fill="${hc}" ${S}/><circle cx="76" cy="38" r="7" fill="${hc}" ${S}/><circle cx="90" cy="28" r="8" fill="${hc}" ${S}/><circle cx="110" cy="28" r="8" fill="${hc}" ${S}/><circle cx="124" cy="38" r="7" fill="${hc}" ${S}/>`);
    if (L.hair === 3) g.push(`<path d="M73 56 Q72 30 100 28 Q128 30 127 56 Q112 44 100 44 Q88 44 73 56 Z" fill="${hc}" ${S}/>`);
    if (lineup) g.push(`<path d="M76 ${L.hair === 2 ? 50 : 48} h48" stroke="${INK}" stroke-width="3"/>`);
  } else {
    if (L.hair === 0) g.push(`<path d="M70 60 Q70 26 100 26 Q130 26 130 60 L132 86 Q124 90 122 72 Q116 44 100 44 Q84 44 78 72 Q76 90 68 86 Z" fill="${hc}" ${S}/>`);
    if (L.hair === 1) g.push(`<path d="M73 58 Q72 28 100 28 Q128 28 127 58 Q114 44 100 44 Q86 44 73 58 Z" fill="${hc}" ${S}/>`);
    if (L.hair === 2) g.push(`<path d="M72 60 Q72 26 100 26 Q128 26 128 60 Q118 44 100 44 Q82 44 72 60 Z" fill="${hc}" ${S}/>`);
    if (L.hair === 3) g.push(`<path d="M68 62 Q62 22 100 22 Q138 22 132 62 Q118 42 100 42 Q82 42 68 62 Z" fill="${hc}" ${S}/><circle cx="72" cy="40" r="9" fill="${hc}" ${S}/><circle cx="128" cy="40" r="9" fill="${hc}" ${S}/><circle cx="100" cy="24" r="9" fill="${hc}" ${S}/>`);
  }

  // ---- shades
  if (own('shades')) g.push(`<path d="M80 60 h40" stroke="${INK}" stroke-width="3"/><rect x="79" y="55" width="17" height="11" rx="4" fill="${INK}"/><rect x="104" y="55" width="17" height="11" rx="4" fill="${INK}"/>`);

  // ---- hat (flat bill)
  if (own('hat')) g.push(`<path d="M74 48 Q74 24 100 24 Q126 24 126 48 Z" fill="#aa4635" ${S}/><path d="M100 46 h50 v8 h-50 z" fill="#aa4635" ${S}/><path d="M74 46 h52" stroke="${INK}" stroke-width="3"/>`);

  // ---- phone (right hand)
  if (phone === 'phone') g.push(`<rect x="${134 + wide}" y="176" width="13" height="22" rx="2" fill="#343b38" ${S}/><path d="M${138 + wide} 180 l5 8 l-3 6" fill="none" stroke="#9fb0ad" stroke-width="1.5"/>`);
  if (phone === 'phone2') g.push(`<rect x="${133 + wide}" y="174" width="15" height="26" rx="3" fill="#1c1c1c" ${S}/><rect x="${136 + wide}" y="178" width="9" height="16" fill="#3a6fb0"/>`);
  if (phone === 'phone3') g.push(`<rect x="${132 + wide}" y="172" width="17" height="28" rx="4" fill="#111" ${S}/><rect x="${135 + wide}" y="176" width="11" height="19" fill="#e6b94d"/>`);

  const scale = hs === 1 ? '' : `translate(${100 - 100 * hs} ${282 - 282 * hs}) scale(${hs})`;
  return `<g ${opts.transform ? 'transform="' + opts.transform + '"' : ''}><g ${scale ? 'transform="' + scale + '"' : ''}>${g.join('')}</g></g>`;
}

// The room. 440×220. The doll stands in the middle; bought room items show up around them.
function roomSVG(s) {
  const own = id => s.items.includes(id);
  const p = [];
  p.push(`<path d="M0 0h440v220H0z" fill="#d8c39f"/><path d="M0 162h440v58H0z" fill="#bd8b5d" stroke="${INK}" stroke-width="3"/>`);
  // window (with the car outside if you have one)
  p.push(`<path d="M22 16h88v110H22z" fill="#cfe3ea" stroke="${INK}" stroke-width="4"/>`);
  if (own('car2')) p.push(`<path d="M30 92 l10 -14 h40 l10 14 h8 v18 h-76 z" fill="#aa4635" stroke="${INK}" stroke-width="3"/><circle cx="44" cy="110" r="6" fill="${INK}"/><circle cx="84" cy="110" r="6" fill="${INK}"/>`);
  else if (own('car')) p.push(`<path d="M30 94 l8 -12 h38 l8 12 h6 v16 h-68 z" fill="#8b8f7a" stroke="${INK}" stroke-width="3"/><circle cx="42" cy="110" r="5" fill="${INK}"/><circle cx="78" cy="110" r="5" fill="${INK}"/><path d="M52 86 l10 6" stroke="${INK}" stroke-width="2"/>`);
  else p.push(`<path d="M24 68l20-19 21 8 23-29 20 42" fill="#799081"/>`);
  p.push(`<path d="M66 17v107M24 66h85" stroke="${INK}" stroke-width="3"/>`);
  // bed
  p.push(`<path d="M268 145h146v34H268z" fill="#a94736" stroke="${INK}" stroke-width="4"/><path d="M270 135h45v18h-45z" fill="#f5ead2" stroke="${INK}" stroke-width="3"/><path d="M277 179v21m130-21v21" stroke="${INK}" stroke-width="6"/>`);
  // dresser or garbage bag
  if (own('dresser')) {
    p.push(`<path d="M20 118h72v73H20z" fill="#b78845" stroke="${INK}" stroke-width="4"/><path d="M21 141h70m-70 24h70" stroke="${INK}" stroke-width="3"/><circle cx="56" cy="130" r="3"/><circle cx="56" cy="154" r="3"/><circle cx="56" cy="178" r="3"/>`);
    if (own('tv')) p.push(`<rect x="28" y="92" width="56" height="30" rx="2" fill="#1c1c1c" stroke="${INK}" stroke-width="3"/><rect x="32" y="96" width="48" height="22" fill="#3a6fb0"/>`);
  } else {
    p.push(`<path d="M31 195q-25-15-7-44l13-15 25 4q35 45 12 58z" fill="#49453b" stroke="${INK}" stroke-width="4"/><path d="M36 141l18-8" stroke="${INK}" stroke-width="5"/>`);
    if (own('tv')) p.push(`<rect x="118" y="150" width="50" height="28" rx="2" fill="#1c1c1c" stroke="${INK}" stroke-width="3"/><rect x="122" y="154" width="42" height="20" fill="#3a6fb0"/><path d="M130 178 v8 h26 v-8" fill="none" stroke="${INK}" stroke-width="3"/>`);
  }
  if (own('couch')) p.push(`<path d="M300 190v-22q0-15 17-15h93q17 0 17 15v22z" fill="#e6b94d" stroke="${INK}" stroke-width="4"/>`);
  if (own('bike')) p.push(`<g transform="translate(98 152)"><circle cx="0" cy="26" r="14" fill="none" stroke="${INK}" stroke-width="3"/><circle cx="44" cy="26" r="14" fill="none" stroke="${INK}" stroke-width="3"/><path d="M0 26 l14 -22 h22 l8 22 M14 4 l8 22 l-22 0 M22 4 h-8" fill="none" stroke="#aa4635" stroke-width="3"/></g>`);
  // the doll
  p.push(dollSVG(s, { transform: 'translate(150 22) scale(0.6)' }));
  // the dog, at your feet
  if (own('dog')) p.push(`<g transform="translate(236 168)"><ellipse cx="18" cy="18" rx="18" ry="11" fill="#b07248" stroke="${INK}" stroke-width="3"/><circle cx="36" cy="10" r="9" fill="#b07248" stroke="${INK}" stroke-width="3"/><path d="M30 2 l-2 -8 l6 4 M40 2 l2 -8 l-6 4" fill="#b07248" stroke="${INK}" stroke-width="2"/><circle cx="40" cy="9" r="1.8" fill="${INK}"/><path d="M0 14 q-10 -8 -4 -16" fill="none" stroke="${INK}" stroke-width="3"/><path d="M8 28 v6 M26 28 v6" stroke="${INK}" stroke-width="3"/></g>`);
  p.push(`<ellipse cx="210" cy="206" rx="46" ry="6" fill="#29272030"/>`);
  return p.join('');
}

if (typeof module !== 'undefined') module.exports = { dollSVG, roomSVG, SKIN, HAIR_COLOR, HAIR_NAMES, BEARD_NAMES, BUILD_NAMES, HEIGHT_NAMES, INK_NAMES };
