/* SPIRITUAL GANGSTER (was Sober Gangster) — game engine (Recovery Misfits). Locked Up, Covered Up, or Sobered Up.
   v4: an RPG.
     MOVES    3 a day, 10 buttons in 3 rows. SPIRITUAL always helps. WORK adds heat unless you did a
              spiritual move first that day. LIFE feels good now, costs a lot of heat, and leaves a receipt.
     PEOPLE   Pops, Big Ray, Darlene, Mom, Shorty, Ghost. Every move moves somebody's trust.
     RECEIPTS life moves come back a few days later as a morning card.
     STREAKS  3 meetings in a row = Pops offers to sponsor. A week employed = the raise. A car = Give rides.
     CHAPTERS 1 The Bottom Bunk, 2 Clock In or Clock Out, 3 Wheels and Wisdom, 4 Keys to Your Own Place,
              then SOBERED UP. Rent every 7 days grows with you: $100, $140, $175, $250.
   Situations live in situations.js (ChatGPT wrote them, Mike approved). Night cards in cards.js. */

const VERSION = 'v7.0';
const SAVE_KEY = 'sober-gangster-v5';
const ACTION_IDS = ['meeting', 'call', 'help', 'rest', 'rides', 'work', 'betterjob', 'double', 'quit', 'argue', 'ignore', 'fkit', 'crew', 'ex', 'ghostlink', 'block', 'bar', 'party', 'look', 'carfund', 'movefund', 'date', 'bizfund'];
const ROWS = [   // top to bottom on the screen (Mike: life, work, spiritual; then people, places and things)
  ['life', 'LIFE', 'Feels good right now. Costs a lot of heat, and it comes back.', ['argue', 'ignore', 'fkit']],
  ['people', 'PEOPLE', 'Fun right now. Tonight gets riskier.', ['crew', 'ex', 'ghostlink']],
  ['places', 'PLACES', 'The best time in weeks. Tonight gets a lot riskier.', ['block', 'bar', 'party']],
  ['things', 'THINGS', 'The look, the car, your own place. Stack it up.', ['look', 'carfund', 'movefund', 'date', 'bizfund']],
  ['work', 'WORK', 'Pays the bills. Adds heat unless you did a spiritual move first today.', ['work', 'betterjob', 'double', 'quit']],
  ['spiritual', 'SPIRITUAL', 'Always helps. Do one first and work adds no heat.', ['meeting', 'call', 'help', 'rest', 'rides']]
];
const ROW_OF = {}; ROWS.forEach(r => r[3].forEach(id => ROW_OF[id] = r[0]));
// v7: the buttons a row shows right now. Things and work change as his life fills up.
function rowIds(s, key) {
  if (key === 'things') return ['look', s.car ? 'date' : 'carfund', s.level >= 4 && s.housing !== 'Sober house' && s.housing !== 'Shelter' ? 'bizfund' : 'movefund'];
  if (key === 'work') return ['work', (s.job || s.biz) && s.wage >= CFG.raiseWage ? 'double' : 'betterjob', 'quit'];
  if (key === 'spiritual') return ['meeting', 'call', 'help', 'rest'].concat(s.car ? ['rides'] : []);
  return ROWS.find(r => r[0] === key)[3];
}
// base effects (the story bible). h heat, s stress, c cash, n connection; t = trust changes
const MOVES = {
  meeting:   { label: 'Hit a meeting',        line: 'Show up. Shut up. Listen.',   h: -12, s: -8,  c: 0,   n: 8,   t: { pops: 1, ghost: -1 } },
  call:      { label: 'Call sober support',   line: 'Make the damn call.',         h: -10, s: -10, c: 0,   n: 7,   t: { pops: 1, mom: 1, shorty: 1, ghost: -1 } },
  help:      { label: 'Go help someone',      line: 'Get outta your own head.',    h: -8,  s: -5,  c: 0,   n: 12,  t: { shorty: 2, pops: 1, mom: 1 } },
  rest:      { label: 'Rest',                 line: 'Sit your ass down.',          h: -5,  s: -15, c: 0,   n: 1,   t: {} },
  rides:     { label: 'Give rides',           line: 'Get in. We’re going.',        h: -10, s: -4,  c: -8,  n: 12,  t: { shorty: 2, pops: 1, mom: 1 } },
  work:      { label: 'Go to work',           line: 'Clock in. Get paid.',         h: 6,   s: 10,  c: 80,  n: -2,  t: { darlene: 1, ray: 1 } },
  betterjob: { label: 'Look for a better job', line: 'There’s gotta be more.',     h: 5,   s: 8,   c: -10, n: 2,   t: { darlene: -1, mom: 1 } },
  quit:      { label: 'Quit your job',        line: 'Take this job and shove it.', h: 8,   s: -20, c: 0,   n: -5,  t: { darlene: -4, ray: -1, mom: -1 } },
  argue:     { label: 'Argue your point',     line: 'Nah. You’re gonna hear me.',  h: 15,  s: -12, c: 0,   n: -8,  t: { ray: -2, darlene: -2, shorty: -2 } },
  ignore:    { label: 'Put everyone on ignore', line: 'Everybody can kiss my ass.', h: 12,  s: -15, c: 0,   n: -12, t: { pops: -1, mom: -2, shorty: -2, ghost: 1 } },
  crew:      { label: 'Hit up the old crew',  line: 'Just like old times.',         h: 4,   s: -20, c: -15, n: 6,   t: { ghost: 1, pops: -1, love: -1 }, risk: 18, wild: { craving: 2, cop: 1 } },
  ex:        { label: 'Text the ex',          line: 'You up?',                     h: 3,   s: -15, c: 0,   n: 4,   t: { mom: -1, love: -3 }, risk: 14, wild: { ex: 4 } },
  ghostlink: { label: 'Kick it with Ghost',   line: 'Just to talk.',               h: 8,   s: -18, c: 0,   n: 3,   t: { ghost: 2, pops: -1, love: -2 }, risk: 25, wild: { ghost: 4, craving: 1 } },
  block:     { label: 'The old block',        line: 'Everybody knows your name.',  h: 8,   s: -15, c: -5,  n: 5,   t: { ghost: 1 }, risk: 16, wild: { cop: 2, ghost: 1 } },
  bar:       { label: 'The bar',              line: 'Just one. For the music.',    h: 6,   s: -22, c: -25, n: 6,   t: { pops: -2, love: -2 }, risk: 28, wild: { craving: 3, cop: 2 } },
  party:     { label: 'The party',            line: 'Best night in weeks.',        h: 5,   s: -25, c: -20, n: 8,   t: { shorty: 1, pops: -1, love: -1 }, risk: 22, wild: { craving: 2, cop: 1 } },
  look:      { label: 'The fresh look',       line: 'Kicks, cut, cologne.',        h: 0,   s: -6,  c: -60, n: 2,   t: { love: 3 } },
  carfund:   { label: 'Stack for the car',    line: 'Put it where you can’t touch it.', h: 0, s: -2, c: -100, n: 0, t: {} },
  movefund:  { label: 'Stack for move-out',   line: 'Your name on a lease.',       h: 0,   s: -2,  c: -100, n: 0, t: { mom: 1 } },
  date:      { label: 'Take Jaz out',         line: 'Put the phone down. Look at her.', h: 0, s: -8, c: -60, n: 4, t: { love: 2 } },
  bizfund:   { label: 'Stack for the business', line: 'A truck, a mower, your name on the door.', h: 0, s: -2, c: -100, n: 0, t: { pops: 1 } },
  double:    { label: 'Pull doubles',         line: 'Sleep is for people who ain’t behind.', h: 8, s: 18, c: 0, n: -5, t: { darlene: 1, love: -1, mom: -1 } },
  fkit:      { label: 'Say f**k it',          line: 'F**k it. I’m done.',          h: 25,  s: -25, c: -20, n: -15, t: { pops: -2, ray: -2, darlene: -2, mom: -2, shorty: -1, ghost: 2 } }
};
const ACTION_LABEL = Object.fromEntries(Object.entries(MOVES).map(([k, v]) => [k, v.label]));

const PEOPLE = [
  { id: 'pops',    name: 'Pops',     role: 'The old-timer. 24 years. Could be your sponsor.', start: 3, say: 'You ain’t the first asshole to get sober. You’re just the newest.' },
  { id: 'ray',     name: 'Big Ray',  role: 'Runs the sober house. Gold chains, cheap cologne.', start: 4, say: 'This ain’t a charity, sweetheart. Rent don’t pay itself.' },
  { id: 'darlene', name: 'Darlene',  role: 'Your boss at the warehouse. Heard every excuse.', start: 5, say: 'I don’t need your life story. I need these boxes on that truck.' },
  { id: 'mom',     name: 'Mom',      role: 'Loves you. Tired of being scared.', start: 3, say: 'I love you. I’m just tired of being scared every time the phone rings.' },
  { id: 'shorty',  name: 'Shorty',   role: 'Your housemate. Loud, funny, 3 months sober.', start: 4, say: 'Man, we both broke. At least we ain’t broke AND wanted.' },
  { id: 'love',    name: 'Jaz',      role: '27. Front desk at a dental office, nails on weekends. Likes effort. Hates the bar, the old crew and the ex.', start: 2, say: 'you cute but them shoes been through a whole court case', guy: { name: 'Marc', role: '29. Auto parts counter, fixes cars on weekends. Likes effort. Hates the bar, the old crew and the ex.', say: 'not big on rescue missions. show up and we good.' } },
  { id: 'ghost',   name: 'Ghost',    role: 'The plug. The more he trusts you, the worse it gets.', start: 5, say: 'I ain’t asking you to do nothing. Just saying I’m here.' }
];
const person = id => PEOPLE.find(p => p.id === id);
// the love interest is Jaz for guy homies and Marc for girl homies
function personFor(s, id) { const p = person(id); return p && p.guy && s.look.sex === 'girl' ? { ...p, ...p.guy } : p; }
function loveSwap(s, t) {
  if (!t || s.look.sex !== 'girl') return t;
  return t.replace(/\bJaz\b/g, 'Marc').replace(/\bJAZ\b/g, 'MARC').replace(/my girl's/g, 'my boy\'s').replace(/\bShe's\b/g, 'He\'s').replace(/\bshe's\b/g, 'he\'s').replace(/\bShe\b/g, 'He').replace(/\bshe\b/g, 'he').replace(/\bher\b/g, 'him').replace(/\bHer\b/g, 'His').replace(/SHE DON'T DATE SCRUBS/g, 'HE DON\'T DATE SCRUBS');
}

// life moves leave receipts; they come back as a morning card
const RECEIPTS = {
  receipt_parking_lot:     { who: 'darlene', days: 2, title: 'THE PARKING LOT ARGUMENT', text: 'Darlene calls you into the office. Somebody reported that little performance in the parking lot.', h: 8, s: 8, t: { darlene: -1 } },
  receipt_ray_black_book:  { who: 'ray', days: 3, title: 'BIG RAY’S LITTLE BLACK BOOK', text: 'Big Ray suddenly remembers three house rules you’ve supposedly been breaking. He’s writing everything down.', h: 8, s: 8, t: { ray: -1 } },
  receipt_mom_stopped:     { who: 'mom', days: 4, title: 'MOM STOPPED CALLING', text: 'You check your phone. Mom hasn’t called in four days. It feels different when you’re the one who pushed her away.', h: 6, s: 10, t: { mom: -1 } },
  receipt_shorty_heard:    { who: 'shorty', days: 2, title: 'SHORTY HEARD ABOUT IT', text: 'Shorty told the whole house what you said, with a few extra details he pulled straight out of his ass.', h: 6, s: 8, t: { shorty: -1 } },
  receipt_ghost_message:   { who: 'ghost', days: 1, title: 'GHOST GOT THE MESSAGE', text: 'Ghost texts you first thing. Like he can smell a bad decision from three neighborhoods away.', h: 10, s: 6, t: { ghost: 1 } },
  receipt_nobody_answers:  { who: 'pops', days: 3, title: 'NOBODY ANSWERS', text: 'You finally need somebody to talk to. Pops is tired of leaving messages on a phone you never answer.', h: 8, s: 10, t: { pops: -1 } },
  receipt_job_walkout:     { who: 'darlene', days: 5, title: 'THE JOB YOU WALKED OUT ON', text: 'A new employer calls Darlene for a reference. She remembers exactly how you left.', h: 6, s: 10, t: { darlene: -1 } },
  receipt_family_argument: { who: 'mom', days: 3, title: 'THE THINGS YOU SAID', text: 'Your aunt calls. Mom told the whole family what you said to her. Nobody’s saving you a seat at Thanksgiving.', h: 6, s: 10, t: { mom: -1 } },
  receipt_pops_argument:   { who: 'pops', days: 2, title: 'POPS DIDN’T FORGET', text: 'Pops nods at you across the meeting room. Doesn’t come over. Doesn’t have to.', h: 6, s: 8, t: { pops: -1 } }
};
// a life move with no situation on you still leaves a receipt
function baseReceipt(s, id) {
  if (id === 'argue') return s.level >= 4 ? (s.job ? 'receipt_parking_lot' : null) : 'receipt_ray_black_book';
  if (id === 'ignore') return 'receipt_mom_stopped';
  if (id === 'fkit') return 'receipt_ghost_message';
  if (id === 'quit') return 'receipt_job_walkout';
  return null;
}

const STREAKS = {
  sponsor:  { title: 'THREE MEETINGS', text: 'Pops catches you by the coffee pot after the third meeting. “You keep showing up like this, I might actually have to learn your name.”' },
  showing:  { title: 'SEVEN DAYS SHOWING UP', text: 'Seven days of doing something other than making your own life worse. Nobody threw you a parade, but people are starting to recognize your face.' },
  raise:    { title: 'THE RAISE', text: 'Darlene pulls you aside before your shift. “You’re doing good work. Don’t make me regret saying that.” Work pays $100 now.' },
  helping:  { title: 'THREE DAYS HELPING', text: 'Shorty catches you carrying somebody else’s groceries up the stairs. “Man, you really are turning into one of those helpful assholes.”' },
  twoweeks: { title: 'FOURTEEN DAYS', text: 'Two weeks. You still have problems, but for once they’re the kind of problems regular people have.' },
  rent3:    { title: 'THREE RENTS ON TIME', text: 'Three weeks of paying your own way. Big Ray counts the money twice, then looks almost disappointed he can’t complain.' },
  wheels:   { title: 'FIRST SET OF WHEELS', text: 'Keys in your hand. Nobody’s picking you up, nobody’s dropping you off. For the first time in a long time, you’re the one driving. Give rides is unlocked.' },
  chip1:    { chip: '24', title: '24 HOURS', text: 'One whole day. Somebody at the meeting hands you a chip. It weighs nothing. You hold onto it like it weighs a ton.' },
  chip7:    { chip: '7', title: 'ONE WEEK CHIP', text: 'Seven days. You don’t say much when they call your name. You don’t have to.' },
  chip14:   { chip: '14', title: 'TWO WEEK CHIP', text: 'Two weeks. Pops says the hard part is it never stops being one day at a time. He says it like good news.' },
  chip30:   { chip: '30', title: '30 DAY CHIP', text: 'Thirty days. The whole room claps. You almost leave. You stay. That’s the whole program right there. From here, a turn is a whole week.' },
  chip60:   { chip: '60', title: '60 DAY CHIP', text: 'Sixty days. Pops shakes your hand and holds on a beat too long. “Now the real work starts. Life’s about to get busy.”' },
  chip90:   { chip: '90', title: '90 DAY CHIP', text: 'Ninety days. Big Ray says it in front of the house: “Most of y’all won’t see this one.” From here, a turn is a whole month.' },
  chip180:  { chip: '6', unit: 'MONTHS', title: 'SIX MONTH CHIP', text: 'Six months. Mom came to the meeting. Sat in the back. Cried at the wrong part. You didn’t mind.' },
  chip270:  { chip: '9', unit: 'MONTHS', title: 'NINE MONTH CHIP', text: 'Nine months. Somebody new is sitting in your old chair with a trash bag and a thousand-yard stare. You bring them a coffee.' },
  chip365:  { chip: '1', unit: 'YEAR', title: 'ONE YEAR', text: 'One year. You stand up. The room stands up with you.' },
  sponsee:  { title: 'DRE ASKED', text: 'Dre catches you after the meeting, shoes shuffling. “Pops said ask you. Will you… you know. Sponsor me.” You hear Pops laughing from the coffee pot.' },
  biz:      { title: 'OPEN FOR BUSINESS', text: 'A used truck, a mower that starts on the third pull, and your name on a magnet sign. Shorty says it looks like a ransom note. It’s a business. Work pays what YOU charge now.' },
  biz2:     { title: 'SECOND TRUCK', text: 'Two trucks. A trailer. Dre runs the second crew and only lost one rake. People call YOU for work now.' },
  biz3:     { title: 'THE BIG ACCOUNT', text: 'The property manager signed for all twelve lots. You’re the guy who shows up. Turns out that was the whole secret.' },
  lead:     { title: 'LEAD', text: 'Darlene hands you the clipboard. “Don’t let it go to your head.” It goes to your head a little. Work pays $120 a shift.' },
  love:     { title: 'TOGETHER', text: 'Jaz texts first now. Good morning texts, “you eat?”, a picture of a dog she saw. You are somebody’s person. Don’t blow it.' },
  thirty:   { title: 'THIRTY DAYS STANDING', text: 'Thirty days ago you had twelve dollars and a bed somebody else owned. Now you’ve got a life worth protecting.' },
  baby:     { title: 'THE BABY', text: 'Six pounds, nine ounces. Ten fingers. Jaz asleep, finally. You hold a person who has never once seen you drunk. Keep it that way.' }
};

const CFG = {
  actions: 3,
  startCash: 12, startStress: 35, startConnection: 20,
  food: 12, rentDays: 7,
  rent: [0, 100, 140, 150, 175, 175],   // a week: sober house bed, then your own room ($750 a month)
  wage: 72, raiseWage: 96, lowTrustWage: 54, leadWage: 120,   // take-home for a shift: $13/hr part time, then $16/hr
  shiftMoves: 2,               // a shift eats most of your day: 2 of your 3 moves
  bills: { bus: 20, fees: 25, phone: 15, car: 35, utilities: 35, pregnant: 30, baby: 60, support: 45 },   // a week: bus fare (no car), court fees, phone, car insurance+gas, lights, the baby, child support
  jobless: 8,                  // stress every morning with no job (after day 1)
  moveIn: 1200, carJar: 900, bizJar: 2500,   // first+last+deposit on a room; the car stack; a used truck and a mower   // the car stack buys a used car at $900 (Shorty's Honda deal is $400 if it comes up)                 // deposit + keys on a room of your own (first rent comes on rent day)
  heat: {
    start: 10, safe: 45, maxOdds: 0.5,
    noSpirit: [0, 3, 6, 9, 12], // nightly heat by days without a spiritual move
    maxedStress: 75, maxedStressHeat: 5,
    aloneBelow: 15, aloneHeat: 5,
    ghostHigh: 4,               // nightly heat while Ghost's trust is 8+
    street: 8                   // every night, no matter what: life on life's terms
  },
  maxTrust: 10
};
const LEVELS = [
  { n: 1, name: 'The Bottom Bunk',        housing: 'Sober house' },
  { n: 2, name: 'Clock In or Clock Out',  housing: 'Sober house' },
  { n: 3, name: 'Wheels and Wisdom',      housing: 'Sober house' },
  { n: 4, name: 'Keys to Your Own Place', housing: 'My own place' },
  { n: 5, name: 'Giving It Back',         housing: 'My own place' }
];

const FIGURES = [
  { id: 'lil-smoke',   name: 'Lil Smoke',   sex: 'guy',  who: 'Early 20s. Neck tattoo. Talks tough, hates the quiet.' },
  { id: 'lady-ink',    name: 'Lady Ink',    sex: 'girl', who: 'Late 20s. Sleeves of ink. Wants her own shop one day.' },
  { id: 'big-country', name: 'Big Country', sex: 'guy',  who: 'Farm boy, 30s. Lost his license. Rides a bike now.' },
  { id: 'suit',        name: 'Suit',        sex: 'guy',  who: '40s. Lost the corner office. Still has the briefcase.' },
  { id: 'pops',        name: 'Pops',        sex: 'guy',  who: '60s. Second chance. Makes the coffee for everybody.' },
  { id: 'soccer-mom',  name: 'Soccer Mom',  sex: 'girl', who: 'Late 30s. Big sunglasses. Wants her kids back.' },
  { id: 'nurse-nikki', name: 'Nurse Nikki', sex: 'girl', who: 'Early 30s. Lost her nursing license. Wants it back.' },
  { id: 'party-girl',  name: 'Party Girl',  sex: 'girl', who: '24. Lots of rings. The party ended. She didn’t.' }
];
const jobs = [
  { name: 'Day labor',   wage: 75,  stress: 10 },
  { name: 'Dishwasher',  wage: 85,  stress: 11 },
  { name: 'Stock crew',  wage: 100, stress: 12 },
  { name: 'Maintenance', wage: 120, stress: 13 }
];
const shop = [
  { id: 'cut',     name: 'Fresh cut',        price: 30,  group: 'feel', feel: 6,  desc: 'Lineup so sharp it has a credit score.' },
  { id: 'trim',    name: 'Beard trim',       price: 20,  group: 'feel', feel: 4,  desc: 'Shape it up. Chin visible again.', guyOnly: true },
  { id: 'hat',     name: 'Flat-bill hat',    price: 35,  group: 'feel', feel: 3,  desc: 'Pure style. No magic odds.' },
  { id: 'shades',  name: 'Sunglasses',       price: 40,  group: 'feel', feel: 3,  desc: 'Nobody can see you squint.' },
  { id: 'tee',     name: 'New white tee',    price: 25,  group: 'feel', feel: 3,  desc: 'Crisp. For about a day.' },
  { id: 'hoodie',  name: 'Hoodie',           price: 60,  group: 'feel', feel: 4,  desc: 'The uniform.' },
  { id: 'jeans',   name: 'Real pants',       price: 55,  group: 'feel', feel: 4,  desc: 'Jeans. With a belt. Look at you.' },
  { id: 'dunks',   name: 'Fresh kicks',      price: 110, group: 'feel', feel: 8,  desc: 'Clean. Everybody in the house is going to say something.' },
  { id: 'cologne', name: 'Cologne',          price: 45,  group: 'feel', feel: 5,  desc: 'You smell like a job interview.' },
  { id: 'shoes',   name: 'Work boots',       price: 70,  group: 'big', desc: 'Unlocks stock crew and maintenance.' },
  { id: 'phone',   name: 'Cracked phone',    price: 120,  group: 'big', desc: 'People can call you back. Unlocks better work. Also: the plug can text you.' },
  { id: 'phone2',  name: 'New phone',        price: 450, group: 'big', minLevel: 2, feel: 5, desc: 'Buzzes more.', upgrades: 'phone' },
  { id: 'phone3',  name: 'Newest phone',     price: 1000, group: 'big', minLevel: 3, feel: 6, desc: 'Buzzes constantly. You love it.', upgrades: 'phone2' },
  { id: 'chain',   name: 'Chain (fake)',     price: 50,  group: 'big', feel: 4, desc: 'Turns your neck green by Thursday.' },
  { id: 'chain2',  name: 'Chain (real)',     price: 900, group: 'big', minLevel: 3, feel: 8, desc: 'Gold. Actual gold.', upgrades: 'chain' },
  { id: 'tattoo',  name: 'Small tattoo',     price: 180, group: 'big', minLevel: 2, feel: 5, desc: 'Something that means something.' },
  { id: 'tattoo2', name: 'Sleeve',           price: 1200, group: 'big', minLevel: 3, feel: 10, desc: 'Three sittings. Worth it.', upgrades: 'tattoo' },
  { id: 'watch',   name: 'Watch',            price: 120, group: 'big', minLevel: 2, feel: 3, desc: 'Shows up on time now. Allegedly.' },
  { id: 'pass',    name: 'Bus pass',         price: 60,  group: 'big', desc: 'Two hours of your life back every day. Takes the edge off: −5 stress.' },
  { id: 'bike',    name: 'Bike',             price: 250, group: 'big', minLevel: 2, feel: 4, desc: 'Beats the bus. Beats walking.' },
  { id: 'dresser', name: 'Actual dresser',   price: 80,  group: 'big', desc: 'Taking a breath takes off 4 more stress.' },
  { id: 'car',     name: 'Beater car',       price: 1200, group: 'save', minLevel: 3, desc: 'Wheels. Unlocks Give rides.' },
  { id: 'car2',    name: 'Nice car',         price: 4500, group: 'save', minLevel: 4, feel: 12, desc: 'The one you park where people can see it.', upgrades: 'car' },
  { id: 'couch',   name: 'A non-curb couch', price: 250, group: 'save', minLevel: 2, feel: 4, desc: 'Your room finally feels like home.' },
  { id: 'tv',      name: 'TV',               price: 300, group: 'save', minLevel: 2, feel: 4, desc: 'Something to not watch.' },
  { id: 'dog',     name: 'The dog',          price: 450, group: 'save', minLevel: 3, feel: 10, desc: 'Vet bills, chewed shoes, and the best welcome home you’ve ever had.' }
];
const SHOP_GROUPS = [['feel', 'FEEL GOOD', 'Cheap. Feels good today.'], ['big', 'BIGGER', 'Opens doors, or just looks right.'], ['save', 'BIG SAVES', 'The stuff you work a month for.']];



function item(id) { return shop.find(x => x.id === id); }
function has(s, id) { return s.items.includes(id); }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function rng(s) { s.seed = (1664525 * s.seed + 1013904223) >>> 0; return s.seed / 4294967296; }
function record(s, t) { s.log.unshift(t); s.log = s.log.slice(0, 150); s.logN = (s.logN || 0) + 1; }
function badge(s, b) { if (!s.milestones.includes(b)) s.milestones.push(b); }
function levelInfo(n) { return LEVELS[Math.max(1, Math.min(5, n)) - 1]; }
function rentDue(s) { return s.level >= 4 && s.housing === 'Sober house' ? CFG.rent[3] : CFG.rent[Math.min(s.level, 5)]; }
function billsDue(s) { const b = weeklyBills(s); return b.total - b.rent; }
const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
function dayName(s, d = s.day) { return DAYS[(d - 1) % 7]; }
function weekend(s) { return (s.tl || 1) === 1 && (s.day - 1) % 7 === 6; }   // the warehouse runs Mon-Sat; Sunday it's closed (day turns only)
/* ---------- v7: ONE YEAR. Time speeds up as he gets sober time. ----------
   Under 30 days sober: one DAY a turn. 30-89: one WEEK a turn. 90+: one MONTH a turn.
   A relapse puts him back on day turns until he has 30 days again. He keeps his life. */
const SCALE = { 1: { kind: 'day', shifts: 1, weeks: 0 }, 7: { kind: 'week', shifts: 6, weeks: 1 }, 30: { kind: 'month', shifts: 24, weeks: 4 } };
function turnLenFor(sober) { return sober < 30 ? 1 : sober < 90 ? 7 : 30; }
function turnKind(s) { return SCALE[s.tl || 1].kind; }
function shiftsIn(s) { return SCALE[s.tl || 1].shifts; }    // shifts in one work move
function weeksIn(s) { return SCALE[s.tl || 1].weeks; }      // rent periods charged at the end of this turn (day turns: on rent day)
function turnLabel(s) { const k = turnKind(s); return k === 'day' ? 'DAY ' + s.day : k === 'week' ? 'WEEK ' + Math.ceil(s.day / 7) : 'MONTH ' + Math.ceil(s.day / 30); }
function rentEvent(s) { return (s.tl || 1) > 1 || s.day % CFG.rentDays === 0; }
// what he owes every week, item by item (v7: the squeeze)
function weeklyBills(s) {
  const b = { rent: rentDue(s), bus: s.car ? 0 : CFG.bills.bus, fees: CFG.bills.fees, phone: s.items.some(i => /^phone/.test(i)) ? CFG.bills.phone : 0 };
  if (s.car) b.car = CFG.bills.car;
  if (s.level >= 4 && s.housing === 'My own place') b.utilities = CFG.bills.utilities;
  if (s.support) b.support = s.support;
  if (s.baby) b.baby = CFG.bills.baby; else if (s.pregnant) b.baby = CFG.bills.pregnant;
  b.total = Object.entries(b).reduce((a, [k, v]) => k === 'total' ? a : a + v, 0);
  return b;
}
function billsDueNow(s) { return weeklyBills(s).total * Math.max(1, weeksIn(s)); }
function extraShift(s) { const c = s.scen && sitById(s.scen.id); return !!(c && c.moves.work && c.moves.work.c > 80); }
function nextRentDay(s) { return Math.ceil(s.day / CFG.rentDays) * CFG.rentDays; }

function fresh(seed = Date.now()) {
  return {
    version: 5, seed: seed >>> 0,
    day: 1, actions: CFG.actions,
    cash: CFG.startCash, stress: CFG.startStress, connection: CFG.startConnection, heat: CFG.heat.start,
    job: false, wage: CFG.wage, level: 1, housing: 'Sober house', levelUp: null,
    sponsor: false, car: false,
    trust: Object.fromEntries(PEOPLE.map(p => [p.id, p.start])),
    items: [], arrears: 0, flags: [], milestones: [], got: [],
    log: ['Twelve bucks. A bottom bunk. A garbage bag. Let’s build from here.'],
    // today
    spiritToday: false, supportToday: false, restToday: false, meetToday: false, helpToday: false, workToday: 0, zeroedToday: false,
    // streaks + counts
    streak: 0, bestStreak: 0, daysSinceSupport: 0, meetStreak: 0, helpStreak: 0,
    meetings: 0, shifts: 0, employedDays: 0, searchPts: 0,
    rentDays: 0, rentsOnTime: 0, rentsL4: 0, coolDays: 0, standing: 0,
    jar: { car: 0, move: 0, biz: 0 }, riskToday: 0, wildBoost: {}, looks: 0, together: false,
    // v7
    tl: 1, turn: 1, behind: 0, lightsOff: false, loveCold: 0, togetherTurns: 0, biz: 0, bizMonths: 0, bizJobs: 0, support: 0, pregnant: false, pregDay: 0, baby: false, sponsee: false, seenCards: [],
    spirit: SPIRIT.start, sober: 0, relapses: 0, lifeToday: 0, reveal: null, asleep: null, missingDay: false,
    receipts: [],          // { id, due }
    cards: [],             // morning cards waiting: { kind, title, text, h, s, c, n, t }
    scen: null, seenScen: [],
    night: null, show: [],
    lastOutcome: null, result: null, lockedUp: null,
    look: { fig: null, sex: 'guy', done: false },
    settings: { mute: false, introSeen: false }
  };
}
function migrate(raw) {
  if (!raw || typeof raw !== 'object' || raw.version !== 5) return null;
  const f = fresh();
  for (const k of Object.keys(f)) if (raw[k] === undefined) raw[k] = f[k];
  if (!FIGURES.find(x => x.id === raw.look.fig)) raw.look.done = false;
  if (raw.scen && !SITUATIONS.find(x => x.id === raw.scen.id)) raw.scen = null;
  if (raw.jar && raw.jar.biz === undefined) raw.jar.biz = 0;
  if (!raw.tl) raw.tl = turnLenFor(raw.sober || 0);
  return raw;
}
function restartKeepFigure(s, seed) {
  const n = fresh(seed);
  if (s && s.look && s.look.fig) n.look = { ...s.look, done: true };
  n.settings = { ...n.settings, ...(s && s.settings), introSeen: true };
  startDay(n, true);
  return n;
}

/* ---------- people ---------- */
function trustUp(s, t) {
  const out = {};
  for (const [k, v] of Object.entries(t || {})) {
    if (!(k in s.trust) || !v) continue;
    if (k === 'darlene' && !s.job && !s.flags.includes('darlene_introduced')) continue;
    if (k === 'ray' && s.level >= 4) continue;
    const was = s.trust[k]; s.trust[k] = clamp(was + v, 0, CFG.maxTrust);
    if (s.trust[k] !== was) out[k] = s.trust[k] - was;
  }
  return out;
}

/* ---------- words for girl homies ---------- */
function forSex(s, t, who) {
  if (!t || s.look.sex !== 'girl') return t;
  if (who === 'love' || /\bJaz\b/.test(t)) t = loveSwap(s, t);
  return t.replace(/another man's underwear/g, 'somebody else’s underwear');
}

/* ---------- situations ---------- */
function sitById(id) { return SITUATIONS.find(x => x.id === id); }
function scenFor(s, id) { const c = sitById(id); return c && c.girl && s.look.sex === 'girl' ? { ...c, ...c.girl } : c; }
function sitOK(s, c) {
  if (c.need && !c.need.every(k => needOK(s, k))) return false;
  if (c.id === 'first_job') return !s.job;
  if (c.id === 'buy_the_car') return !s.car;
  if (c.id === 'car_trouble') return s.car;
  if (['darlene_raise', 'payday_pocket', 'ghost_warehouse', 'saturday_shift'].includes(c.id)) return s.job;
  if (c.who === 'ray' && s.level >= 4) return false;
  if (c.id === 'love_first_date') return s.seenScen.includes('love_dingy_shoes') && s.trust.love >= 3;
  if (c.id === 'love_birthday_bar') return s.seenScen.includes('love_first_date') && s.trust.love >= 4;
  return true;
}
// v7 situation requirements (the "need" list on a situation)
function needOK(s, k) {
  switch (k) {
    case 'soberhouse': return s.housing === 'Sober house';
    case 'ownplace': return s.housing === 'My own place';
    case 'together': return s.together;
    case 'notogether': return !s.together;
    case 'car': return s.car;
    case 'job': return !!s.job;
    case 'sponsor': return s.sponsor;
    case 'sponsee': return s.sponsee;
    case 'nosponsee': return !s.sponsee;
    case 'biz': return !!s.biz;
    case 'nobiz': return !s.biz;
    case 'bizseed': return s.flags.includes('bizseed') && !s.biz;
    case 'pregnant': return s.pregnant && !s.baby;
    case 'notpregnant': return !s.pregnant && !s.baby;
    case 'baby': return s.baby;
    case 'popssick': return s.flags.includes('pops_sick');
    case 'popswell': return !s.flags.includes('pops_sick');
    case 'trip': return s.flags.includes('trip_in');
    case 'notrip': return !s.flags.includes('trip_in');
    case 'lead': return s.flags.includes('lead');
    case 'nolead': return !s.flags.includes('lead');
    case 'raise': return s.wage >= CFG.raiseWage;
    case 'sober45': return s.sober >= 45;
    case 'sober150': return s.sober >= 150;
    case 'sober200': return s.sober >= 200;
    case 'sober300': return s.sober >= 300;
    case 'year': return s.sober >= 330;
    default: return s.flags.includes(k);
  }
}
function pickScen(s) {
  // the very first morning, and any morning you're out of work with 3 job leads, the job finds you
  if (!s.job && (s.day === 1 || s.searchPts >= 3)) { s.searchPts = 0; return sitById('first_job'); }
  // v7: the pool is this chapter's situations at this turn's pace (day / week / month). Chapter 4 and 5 share the month pool.
  const kind = turnKind(s), ch = s.level;
  const inCh = c => c.late ? c.ch <= ch : ch >= 4 ? c.ch >= 4 && c.ch <= ch : c.ch === ch;
  const paced = c => c.late ? kind !== 'day' : (c.scale || 'day') === kind;
  let pool = SITUATIONS.filter(c => inCh(c) && paced(c) && sitOK(s, c) && !s.seenScen.includes(c.id));
  if (!pool.length) pool = SITUATIONS.filter(c => inCh(c) && sitOK(s, c) && !s.seenScen.includes(c.id));
  if (!pool.length && ch >= 2) pool = SITUATIONS.filter(c => c.ch >= 2 && c.ch < ch && paced(c) && sitOK(s, c) && !s.seenScen.includes(c.id));
  if (!pool.length) { s.seenScen = s.seenScen.filter(id => !SITUATIONS.some(c => inCh(c) && c.id === id && !c.once)); pool = SITUATIONS.filter(c => inCh(c) && sitOK(s, c) && !s.seenScen.includes(c.id)); }
  if (!pool.length) return null;
  const g = s.trust.ghost, w = c => (c.who === 'ghost' ? (g >= 8 ? 3 : g <= 2 ? 0.3 : 1) : 1) * (c.weight || 1);
  let r = rng(s) * pool.reduce((a, c) => a + w(c), 0);
  for (const c of pool) { r -= w(c); if (r <= 0) { s.seenScen.push(c.id); return c; } }
  s.seenScen.push(pool[0].id); return pool[0];
}
function nightCard(id) { return NIGHTS.find(x => x.id === id); }
function pickNight(s) {
  const pool = NIGHTS.map(c => ({ c, w: c.like(s) })).filter(x => x.w >= 0).map(x => ({ c: x.c, w: 1 + x.w }));
  let r = rng(s) * pool.reduce((a, x) => a + x.w, 0);
  for (const x of pool) { r -= x.w; if (r <= 0) return x.c; }
  return pool[pool.length - 1].c;
}
function apply(s, e) {
  s.heat = clamp(s.heat + (e.h || 0), 0, 100);
  s.cash = Math.max(0, s.cash + (e.c || 0));
  s.stress = clamp(s.stress + (e.s || 0), 0, 100);
  s.connection = clamp(s.connection + (e.n || 0), 0, 100);
}
function card(s, c) { s.cards.push(c); }

// MORNING
function startDay(s, first = false, picked = null) {
  s.show = [];
  if (!first) {
    if (s.reveal) s.show.push('reveal');
    if (!s.job) { apply(s, { s: CFG.jobless }); }
  }
  // receipts that came due
  const due = s.receipts.filter(r => r.due <= s.day);
  s.receipts = s.receipts.filter(r => r.due > s.day);
  for (const r of due) {
    const R = RECEIPTS[r.id]; if (!R) continue;
    apply(s, R); trustUp(s, R.t);
    if (r.id === 'receipt_ghost_message' && !s.flags.includes('oldcontact')) s.flags.push('oldcontact');
    card(s, { kind: 'receipt', rid: r.id, who: R.who, title: R.title, text: R.text, h: R.h, s: R.s, t: R.t });
    record(s, 'It came back: ' + R.title + '.');
  }
  // v7: wreckage from the old life shows up on month turns, once each
  if (!first && turnKind(s) === 'month' && s.level >= 4) {
    const W = WRECKAGE.filter(w => !s.seenCards.includes(w.id) && (!w.need || w.need(s)));
    if (W.length && rng(s) < 0.3) { const w = W[Math.floor(rng(s) * W.length)]; s.seenCards.push(w.id); w.hit(s); card(s, { kind: 'news', title: w.title, text: w.text(s), c: w.c || 0, s: w.s || 0 }); record(s, w.title + '.'); }
  }
  if (!s.scen) {
    const c = pickScen(s);
    if (c) { s.scen = { id: c.id, left: c.days, fresh: true }; apply(s, { h: c.now }); record(s, 'New trouble: ' + c.title + '.'); if (c.id === 'trip_moves_in' && !s.flags.includes('trip_in')) s.flags.push('trip_in'); }
  } else s.scen.fresh = false;
  if (s.scen) s.show.push('scen');
}

// v7: the old life sends a bill
const WRECKAGE = [
  { id: 'collections', title: 'COLLECTIONS', c: -300, s: 10, text: s => 'A letter with a red stripe. A credit card from the old life, sold to a collections outfit that calls six times a day. $300 to make it stop.', hit: s => { const pay = Math.min(s.cash, 300); s.cash -= pay; s.arrears += 300 - pay; apply(s, { s: 10 }); } },
  { id: 'courtfine', title: 'THE COURT REMEMBERS', c: -250, s: 8, text: s => 'A fine from a case you barely remember. Pay $250 or the license gets flagged. The judge does not care that you’re a different person now.', hit: s => { const pay = Math.min(s.cash, 250); s.cash -= pay; s.arrears += 250 - pay; apply(s, { s: 8 }); } },
  { id: 'support', title: 'THE COUNTY', s: 12, text: s => 'The county found your paycheck. Back support and fees: $' + CFG.bills.support + ' a week out of every check, starting now. You wanted to be the kind of person who pays it. Here’s your chance.', hit: s => { s.support = CFG.bills.support; apply(s, { s: 12 }); }, need: s => !!(s.job || s.biz) },
  { id: 'ghost_debt', title: 'GHOST’S MATH', c: -200, s: 10, text: s => 'Ghost pulls up outside your place. Your new place. “You know you still owe me from back then, right? $200. I ain’t pressed. I’m just saying I know where you live now.”', hit: s => { const pay = Math.min(s.cash, 200); s.cash -= pay; if (pay < 200) trustUp(s, { ghost: 2 }); apply(s, { s: 10, h: 6 }); } }
];

/* ---------- moves ---------- */
function moveLine(s, id) {
  const c = s.scen && sitById(s.scen.id);
  return c && c.moves[id] ? { c, m: c.moves[id] } : { c, m: null };
}
// what a move does right now. The page shows this before you tap.
function preview(s, id) {
  const B = MOVES[id], { c, m } = moveLine(s, id);
  const e = m ? { h: m.h, s: m.s, c: m.c, n: m.n } : { h: B.h, s: B.s, c: B.c, n: B.n };
  let t = m ? m.trust : B.t;
  let zeroed = false, note = '';
  const sh = shiftsIn(s);
  if (id === 'work' || id === 'double') {
    const w = s.biz ? bizPay(s) : s.trust.darlene <= 2 ? CFG.lowTrustWage : s.wage;
    e.c = (m && m.c > 80 && sh === 1 ? Math.max(Math.round(m.c * 0.9), w) : w) * sh;   // the situation's extra shift pays a little more
    if (id === 'double') { e.c = Math.round(e.c * 1.5); if (!m) e.h = MOVES.double.h; }
    if (s.trust.darlene <= 2 && !s.biz) note = 'Darlene cut your hours.';
    if (s.biz) note = 'Your business. You set the price.';
  }
  if (['crew', 'block', 'bar', 'party', 'betterjob'].includes(id) && sh > 1) e.c = e.c * (sh === 6 ? 4 : 12);   // a week or a month of it
  if (id === 'rides' && !m) Object.assign(e, { h: B.h, s: B.s, c: B.c, n: B.n });
  if (id === 'betterjob' && s.cash < -e.c) e.c = -s.cash;   // broke: you walk to the interviews
  if (id === 'carfund' || id === 'movefund' || id === 'bizfund') { const jar = id === 'carfund' ? 'car' : id === 'movefund' ? 'move' : 'biz', goal = id === 'carfund' ? CFG.carJar : id === 'movefund' ? NEED.l3 : CFG.bizJar; e.c = -Math.min(100 * sh, s.cash, goal - s.jar[jar]); }
  if (id === 'look' && s.looks >= 3) { t = { love: 1 }; e.s = -3; }
  if (id === 'date' && !s.together) { t = { love: 1 }; e.c = -40; e.n = 3; }
  if (ROW_OF[id] === 'work' && e.h > 0 && s.spiritToday) { e.h = 0; zeroed = true; }
  if (id === 'meeting' && s.workToday) note = 'The meeting was during your shift.';
  if (id === 'call' && (s.sponsor || s.trust.pops >= 8)) { e.h -= 5; note = 'Your sponsor picks up. −5 more heat.'; }
  else if (id === 'call' && s.trust.pops <= 1) { e.h = Math.round(e.h / 2); note = 'Pops let it ring. Half the help.'; }
  return { e, t, end: !!(m && m.end), gives: m ? m.gives : [], say: m ? forSex(s, m.say) : null, scen: m ? c : null, zeroed, note };
}
// '' = you can do it, otherwise why not
function whyNot(s, id) {
  if (s.result || s.lockedUp) return 'game over';
  if (s.actions < 1) return 'no moves left';
  if ((id === 'work' || id === 'double') && s.actions < CFG.shiftMoves) return 'a shift takes 2 moves';
  if ((id === 'work' || id === 'double') && weekend(s) && !extraShift(s)) return 'closed sundays';
  if ((id === 'work' || id === 'quit' || id === 'double') && !s.job && !s.biz) return 'no job';
  if (id === 'double' && s.workToday) return 'already worked';
  if (id === 'meeting' && s.workToday) return 'during your shift';
  if (id === 'bizfund' && s.biz >= 3) return 'maxed out';
  if (id === 'date' && s.trust.love <= 0) return s.look.sex === 'girl' ? 'marc’s done' : 'jaz is done';
  if (id === 'rides' && !s.car) return 'need a car';
  if (id === 'rest' && s.restToday) return 'rested today';
  if (id === 'carfund' && s.car) return 'got wheels';
  if (id === 'movefund' && s.level < 3) return 'chapter 3';
  if (id === 'movefund' && s.jar.move >= NEED.l3) return 'stacked';
  if (id === 'movefund' && s.level >= 4 && s.housing === 'My own place') return 'stacked';
  if ((id === 'carfund' || id === 'movefund' || id === 'bizfund') && s.cash < 20) return 'need $20';
  const { e } = preview(s, id);
  if (ROW_OF[id] !== 'life' && s.cash + (e.c || 0) < 0) return 'need $' + (-e.c);   // f**k it is always on the table
  return '';
}
function canDo(s, id) { return !whyNot(s, id); }
const BASE_SAY = {
  meeting: 'Folding chair, bad coffee, the truth out loud. You sat there and let it land.',
  call: 'You made the call. Two minutes in, your shoulders came down.',
  help: 'You got out of your own head and into somebody else’s mess. It helped you more than them.',
  rest: 'You sat your ass down. The world kept turning without you.',
  rides: 'You picked people up and got them where they were going. Some of them talked the whole way.',
  work: 'Clocked in, clocked out. Boxes on the truck, money in your pocket.',
  betterjob: 'Applications, waiting rooms, a guy who said he’d call. One more lead in the pile.',
  quit: 'You walked out. Felt like freedom for about an hour. Rent didn’t quit.',
  argue: 'You said your piece. Loud. Felt good for about four seconds.',
  ignore: 'Phone face down. Door shut. The quiet felt great until it didn’t.',
  fkit: 'You said f**k it. Twenty bucks gone, and the old life smiled at you.',
  crew: 'The old crew. Same jokes, same corner, same look in everybody’s eyes. You laughed harder than you have in months.',
  ex: 'You texted the ex. Felt like home. That’s the problem with home.',
  ghostlink: 'You sat in Ghost’s car “just to talk.” He didn’t offer. He didn’t have to.',
  block: 'The old block. Everybody knows your name, and half of them know your old number.',
  bar: 'You ordered a soda at the bar. The bartender poured it like a joke. The music was good. The smell was better. That’s the problem.',
  party: 'Best night in weeks. Loud music, real laughs, and red cups everywhere you looked.',
  look: 'Fresh look. You caught yourself in a window and almost didn’t recognize the person looking back.',
  carfund: 'You put money in the car stack, where your hands can’t get to it.',
  movefund: 'You put money in the move-out stack. A lease with your name on it is getting real.'
};
function action(s, id) {
  if (!canDo(s, id)) return null;
  const p = preview(s, id), row = ROW_OF[id];
  s.actions -= id === 'work' || id === 'double' ? CFG.shiftMoves : 1;
  apply(s, p.e);
  if (row === 'spiritual') { s.spiritToday = true; s.supportToday = true; s.daysSinceSupport = 0; s.spirit = clamp(s.spirit + (SPIRIT[id] || 0), 0, 100); }
  if (row === 'life') { s.lifeToday = (s.lifeToday || 0) + 1; s.spirit = clamp(s.spirit + SPIRIT.life, 0, 100); }
  if (row === 'people' || row === 'places') {
    s.riskToday = (s.riskToday || 0) + (MOVES[id].risk || 0); s.spirit = clamp(s.spirit + SPIRIT.street, 0, 100);
    for (const [k, v] of Object.entries(MOVES[id].wild || {})) s.wildBoost[k] = (s.wildBoost[k] || 0) + v;
    if (id === 'ghostlink' && !s.flags.includes('oldcontact')) s.flags.push('oldcontact');
  }
  if (id === 'carfund') { s.jar.car -= p.e.c; if (s.jar.car >= CFG.carJar && !s.car) { s.car = true; s.jar.car = 0; if (!s.items.includes('car')) s.items.push('car'); got(s, 'wheels'); badge(s, 'Bought a car with your own stack.'); } }
  if (id === 'movefund') { s.jar.move -= p.e.c; if (s.level >= 4 && s.jar.move >= NEED.l3 && s.housing !== 'My own place') { s.jar.move = 0; s.housing = 'My own place'; s.lightsOff = false; s.behind = 0; badge(s, 'Got your own place back.'); record(s, 'Signed a new lease. Your own door again.'); } }
  if (id === 'bizfund') { s.jar.biz -= p.e.c; if (s.jar.biz >= CFG.bizJar) { s.jar.biz = 0; s.biz = Math.min(3, (s.biz || 0) + 1); got(s, s.biz === 1 ? 'biz' : s.biz === 2 ? 'biz2' : 'biz3'); badge(s, s.biz === 1 ? 'Started the landscaping business.' : 'Grew the business.'); if (s.biz === 1) { s.job = true; s.wage = Math.max(s.wage, CFG.raiseWage); } } }
  if (id === 'date' || id === 'look') { s.loveCold = 0; }
  if (id === 'look') { s.looks++; const nx = LOOK_ITEMS.find(i => !s.items.includes(i)); if (nx) s.items.push(nx); }
  if (id === 'meeting') { s.meetToday = true; s.meetings++; }
  if (id === 'help' || id === 'rides') s.helpToday = true;
  if (id === 'rest') s.restToday = true;
  if (id === 'work' || id === 'double') { s.workToday++; s.shifts++; if (s.biz && turnKind(s) === 'month') s.bizMonths++; }
  if (id === 'betterjob') s.searchPts++;
  if (id === 'quit') { if (s.biz) { s.biz = 0; s.jar.biz = 0; record(s, 'Shut the business down.'); } s.job = false; s.employedDays = 0; record(s, 'Quit the job.'); }
  if (p.zeroed) s.zeroedToday = true;
  let gotReceipt = false;
  for (const g of p.gives || []) {
    if (g === 'first_job' || g === 'work_unlocked') { if (!s.job) { s.job = true; s.employedDays = 0; record(s, 'Hired at the warehouse. Darlene’s your boss.'); badge(s, 'Got hired.'); } }
    else if (g === 'darlene_introduced') { if (!s.flags.includes(g)) s.flags.push(g); }
    else if (g === 'unemployed') { s.job = false; s.employedDays = 0; }
    else if (g === 'car') { if (!s.car) { s.car = true; if (!s.items.includes('car')) s.items.push('car'); got(s, 'wheels'); badge(s, 'Bought a car.'); } }
    else if (g === 'sponsor_active') { if (!s.sponsor) { s.sponsor = true; badge(s, 'Pops is your sponsor.'); } }
    else if (g === 'lead') { if (!s.flags.includes('lead')) { s.flags.push('lead'); s.wage = CFG.leadWage; got(s, 'lead'); } }
    else if (g === 'sponsee') { if (!s.sponsee) { s.sponsee = true; got(s, 'sponsee'); badge(s, 'Sponsoring Dre.'); } }
    else if (g === 'pregnant') { if (!s.pregnant) { s.pregnant = true; s.pregDay = s.day; badge(s, loveSwap(s, 'Jaz is pregnant.')); record(s, loveSwap(s, 'Jaz is pregnant.')); } }
    else if (g === 'bizseed') { if (!s.flags.includes(g)) { s.flags.push(g); s.jar.biz = Math.max(s.jar.biz, 300); } }
    else if (g === 'trip_out') { s.flags = s.flags.filter(f => f !== 'trip_in'); }
    else if (g === 'moved_back') { s.housing = 'Sober house'; s.lightsOff = false; s.behind = 0; record(s, 'Gave up the apartment. Back at Big Ray’s.'); }
    else if (g === 'car_sold') { s.car = false; s.items = s.items.filter(i => i !== 'car' && i !== 'car2'); }
    else if (g === 'bigjob') { s.bizJobs++; if (!s.flags.includes(g)) s.flags.push(g); }
    else if (g === 'baby_born') { if (!s.baby) { s.baby = true; s.pregnant = false; got(s, 'baby'); apply(s, { n: 10 }); trustUp(s, { mom: 2 }); } }
    else if (g === 'love_touch') { s.loveCold = 0; }
    else if (g === 'job_search_point') { if (id !== 'betterjob') s.searchPts++; }
    else if (RECEIPTS[g]) { gotReceipt = true; queueReceipt(s, g); }
    else if (!s.flags.includes(g)) s.flags.push(g);
  }
  const td = trustUp(s, p.t);
  if (row === 'life' && !gotReceipt) { const r = baseReceipt(s, id); if (r) queueReceipt(s, r); }
  if (id === 'quit' && !gotReceipt) queueReceipt(s, 'receipt_job_walkout');
  if (row === 'life' && id !== 'argue' && !s.flags.includes('oldcontact') && s.trust.ghost >= 7) s.flags.push('oldcontact');
  const say = p.say || BASE_SAY[id];
  let title = MOVES[id].label;
  if (p.scen) {
    title = p.scen.title;
    if (p.end) { s.scen = null; badge(s, 'Dealt with: ' + p.scen.title.toLowerCase() + '.'); if (p.scen.who === 'love') s.loveCold = 0; }
    record(s, p.scen.title + ' — ' + MOVES[id].label + '. ' + say);
  } else record(s, MOVES[id].label + '. ' + say);
  (s.today ||= []).push(say);
  s.lastOutcome = say;
  return { say, e: p.e, end: p.end, title, trust: td, zeroed: p.zeroed, note: p.note, still: !!(p.scen && !p.end) };
}
function queueReceipt(s, id) {
  const R = RECEIPTS[id]; if (!R || s.receipts.some(r => r.id === id)) return;
  s.receipts.push({ id, due: s.day + Math.min(R.days, s.tl || 1) });
}
function got(s, id) {
  if (s.got.includes(id)) return false;
  s.got.push(id); const S = STREAKS[id];
  card(s, { kind: S.chip ? 'chip' : 'streak', chip: S.chip, unit: S.unit, title: S.title, text: loveSwap(s, S.text) });
  badge(s, S.title.charAt(0) + S.title.slice(1).toLowerCase() + '.');
  return true;
}

/* ---------- shop ---------- */
function buy(s, id) {
  if (cantBuy(s, id)) return false;
  const p = item(id);
  s.actions--; s.cash -= p.price; s.items.push(id);
  apply(s, { s: -(p.feel || 0) - (id === 'pass' ? 5 : 0) });
  if (id === 'car' && !s.car) { s.car = true; got(s, 'wheels'); }
  record(s, 'Bought ' + p.name + '.');
  return true;
}
function cantBuy(s, id) {
  const p = item(id);
  if (!p) return 'no such thing';
  if (has(s, id)) return 'owned';
  if (p.guyOnly && s.look.sex !== 'guy') return 'n/a';
  if ((p.minLevel || 1) > s.level) return 'level ' + p.minLevel;
  if (p.upgrades && !has(s, p.upgrades)) return 'needs ' + item(p.upgrades).name.toLowerCase() + ' first';
  if (s.result || s.lockedUp) return 'game over';
  if (s.actions < 1) return 'no moves left today';
  if (s.cash < p.price) return 'short $' + (p.price - s.cash);
  return '';
}

/* ---------- chapters ---------- */
// the business pays per "shift": more as it grows
function bizPay(s) { return Math.round(CFG.raiseWage * [1, 1.3, 1.8, 2.4][Math.min(3, s.biz || 0)]); }
const employed = s => !!(s.job || s.biz);
// what's left before the next chapter (or the win at level 5)
function nextNeeds(s) {
  const a = [];
  if (s.level === 1) {
    if (!s.job) a.push('get hired');
    if (s.meetings < 3) a.push((3 - s.meetings) + ' meeting' + (3 - s.meetings === 1 ? '' : 's'));
    if (s.rentDays < 1) a.push('rent day');
  } else if (s.level === 2) {
    if (!s.job || s.employedDays < 7) a.push((7 - (s.job ? s.employedDays : 0)) + ' days working');
    if (s.wage < CFG.raiseWage) a.push('the raise');
    if (s.rentsOnTime < 2) a.push((2 - s.rentsOnTime) + ' rent' + (2 - s.rentsOnTime === 1 ? '' : 's') + ' on time');
    if (s.cash < NEED.l2) a.push('$' + NEED.l2 + ' saved');
    if (s.sober < 30) a.push('the 30 day chip');
  } else if (s.level === 3) {
    if (!s.sponsor) a.push('a sponsor');
    if (!s.car) a.push('a car');
    if (!s.job) a.push('a job');
    if (s.connection < 60) a.push('connection 60');
    if (s.jar.move < NEED.l3) a.push('$' + (NEED.l3 - s.jar.move) + ' more in the move-out stack');
    if (s.sober < 90) a.push('the 90 day chip');
  } else if (s.level === 4) {
    if (s.rentsL4 < WIN.rents) a.push((WIN.rents - s.rentsL4) + ' rent' + (WIN.rents - s.rentsL4 === 1 ? '' : 's') + ' on time');
    if (!employed(s)) a.push('a job');
    if (s.connection < 60) a.push('connection 60');
    if (s.coolDays < WIN.cool) a.push((WIN.cool - s.coolDays) + ' cool month' + (WIN.cool - s.coolDays === 1 ? '' : 's'));
    if (s.sober < 180) a.push('the 6 month chip');
  } else {
    if (!employed(s)) a.push('a job');
    if (s.housing !== 'My own place') a.push('your own place');
    if (s.connection < 60) a.push('connection 60');
    if (s.arrears) a.push('pay off the $' + s.arrears);
    if (s.sober < WIN.standing) a.push((WIN.standing - s.sober) + ' more days sober');
  }
  return a;
}
const WIN = { rents: 1, cool: 2, standing: 365 };
const NEED = { l2: 150, l3: 1200 };   // cash to leave chapter 2, and the move-in money to leave chapter 3 (first, last, deposit)
function checkLevel(s) {
  if (s.level >= 5) {
    if (!nextNeeds(s).length) { s.result = { won: true, day: s.day }; badge(s, 'ONE YEAR.'); record(s, 'ONE YEAR. Day ' + s.day + '.'); }
    return false;
  }
  if (nextNeeds(s).length) return false;
  s.level++;
  if (s.level === 4) { s.jar.move = Math.max(0, s.jar.move - CFG.moveIn); s.housing = 'My own place'; s.rentsL4 = 0; record(s, 'Signed the lease. First, last and deposit: $' + CFG.moveIn + '.'); }
  badge(s, 'Chapter ' + s.level + ': ' + levelInfo(s.level).name + '.');
  record(s, 'NEW CHAPTER: ' + levelInfo(s.level).name + '.');
  s.levelUp = s.level;
  return true;
}

/* ---------- night ---------- */

/* ---------- v5: THE LITTLE BASTARD HAS A MIND OF HIS OWN ----------
   After your 3 moves, he's on his own overnight. What he does depends on how you've been raising him:
   FOUNDATION (spiritual energy most of all, then sober time, people, a sponsor) against
   RISK (heat, stress, life moves today, Ghost, being alone, being broke).
   Good choices really do protect him. The worst outcomes (relapse, locked up) can only happen when RISK is high:
   no unfair random game overs. */
const NIGHT = { pGoodShift: -15, pGoodSoft: 12, worstAt: 40, worstCap: 0.4 };   // tuned with sim.cjs
const LOOK_ITEMS = ['cut', 'dunks', 'cologne', 'jeans', 'hoodie', 'tee', 'hat', 'shades'];
const SPIRIT = { street: -6, meeting: 12, call: 8, help: 10, rest: 5, rides: 10, life: -12, nightly: -12, start: 20 };
function foundation(s) {
  return 0.4 * s.spirit + 0.15 * s.connection + 20 * Math.min(s.sober, 60) / 60 + (s.sponsor ? 5 : 0) + (s.trust.pops >= 8 ? 3 : 0);
}
function riskOf(s) {
  const c = s.scen && sitById(s.scen.id);
  return (s.riskToday || 0) + 0.5 * s.heat + 0.4 * s.stress + 10 * (s.lifeToday || 0) + (s.trust.ghost >= 7 ? 10 : 0) + (s.connection < 20 ? 8 : 0) + (c && c.who === 'ghost' ? 8 : 0) + (s.cash < CFG.food ? 6 : 0) + (s.spirit < 20 ? 10 : 0);
}
// the wild cards. text uses "he"; girl homies get "she" (sheHe()).
const WILD = {
  craving: { time: '1:12 AM', title: 'THE CRAVING',
    w: s => 1 + Math.max(0, 60 - s.spirit) / 20 + (s.stress > 60 ? 1 : 0),
    good:   { text: 'Woke up at 1 AM wanting it bad. Called Pops instead. Pops picked up, mumbled something about God and coffee, and stayed on till it passed.', e: { h: -5, s: -5 }, t: { pops: 1 }, sp: 5 },
    shaky:  { text: 'Laid there white-knuckling it till sunrise. Didn’t use. Didn’t sleep either.', e: { s: 10 } },
    bad:    { text: 'Walked to the corner store at 2 AM “for chips.” Stood in front of the cooler for twenty minutes. Walked out with chips. Barely.', e: { h: 8, s: 12 }, sp: -10 },
    worst:  { relapse: true, text: 'Woke up at 1 AM wanting it. Didn’t call anybody. Went and got it.' } },
  ex: { time: '3:17 AM', title: 'THE EX',
    w: s => 1 + (s.stress > 55 ? 1 : 0),
    good:   { text: 'The ex texted: “You awake?” He left it on read. Then texted Pops: “my ex just hit me up.” Pops: “Go back to sleep. Proud of you.”', e: { s: -3 }, t: { pops: 1 }, sp: 3 },
    shaky:  { text: 'The ex texted: “You awake?” He typed “hey” and deleted it nine times. Never sent it. Never slept.', e: { s: 8 } },
    bad:    { text: 'The ex texted: “You awake?” He went over there. Nothing good happens at 3 AM, and nothing good did. Made it home by six, sober and sick about it.', e: { h: 10, s: 15 }, t: { mom: -1 }, sp: -15 },
    worst:  { relapse: true, text: 'The ex texted: “You awake?” He went over there. They had something. He said yes.' } },
  cop: { time: '12:46 AM', title: 'THE COP',
    w: s => Math.max(0, s.heat - 30) / 12, worstNeeds: s => s.heat >= 60,
    good:   { text: 'A cruiser rolled up while he was walking home. Hands out of pockets, “yes sir, no sir,” showed his ID. Cop let him go. That’s growth.', e: { h: -5 } },
    shaky:  { text: 'A cop stopped him on the walk home. He mouthed off a little. Got a warning and a name the cop is going to remember.', e: { h: 12, s: 6 } },
    bad:    { text: 'A cop stopped him at 12:46. He argued for ten minutes. Got a citation and a court fine.', e: { h: 18, s: 10, c: -40 } },
    worst:  { locked: true, text: 'A cop stopped him at 12:46. Arguing at 2 AM wasn’t enough. He threw a punch.' } },
  ghost: { time: '2:11 AM', title: 'THE GHOST',
    w: s => s.trust.ghost / 3 + (s.flags.includes('oldcontact') ? 2 : 0) + ((s.scen && sitById(s.scen.id) || {}).who === 'ghost' ? 2 : 0),
    good:   { text: 'Ghost pulled up outside at 2:11, honking. He turned off the light and texted Pops instead. Ghost gave up after twenty minutes.', e: { h: -3 }, t: { ghost: -2, pops: 1 }, sp: 3 },
    shaky:  { text: 'Ghost pulled up at 2:11. He went out to the curb “just to talk.” Twenty minutes in the passenger seat. Came back in empty-handed and shaking.', e: { h: 12, s: 8 }, t: { ghost: 1 } },
    bad:    { missing: true, text: 'Ghost pulled up at 2:11. He went out to the car. Nobody saw him come back.' },
    worst:  { relapse: true, text: 'Ghost pulled up at 2:11. He got in the car. You know the rest.' } },
  newcomer: { time: '11:28 PM', title: 'THE PHONE CALL',
    w: s => s.spirit / 35 + (s.sober >= 14 ? 1 : 0),
    good:   { text: 'Dre, the new kid from the house, called at 11:28, scared out of his mind. He answered and talked Dre down for an hour. Nobody told him to.', e: { n: 8, s: -3 }, t: { pops: 1, shorty: 1 }, sp: 8 },
    shaky:  { text: 'Phone rang at 11:28. Dre, the new kid. He saw who it was and let it ring. Felt like garbage about it all night.', e: { s: 5 }, sp: -3 } },
  bonus: { time: '6:15 AM', title: 'THE PAYCHECK',
    w: s => s.job ? 0.6 : 0,
    good:   { text: 'Found an extra $25 in the paycheck. “Well, would you look at that. Somebody thinks I’m employable.”', e: { c: 25, s: -4 }, t: { darlene: 1 } },
    bad:    { text: 'Extra $25 in the paycheck and a bad idea to go with it. Blew it on nothing before sunrise.', e: { s: 5 } } },
  mom: { time: '10:40 PM', title: 'MOM CALLED',
    w: s => s.trust.mom >= 5 ? 0.8 : 0.25,
    good:   { text: 'Mom called late just to say goodnight. They talked for forty minutes. She laughed twice.', e: { n: 6, s: -6 }, t: { mom: 1 }, sp: 3 },
    shaky:  { text: 'Mom called at 10:40. He was too tired and too ashamed to pick up. She left a voicemail anyway.', e: { s: 4 }, t: { mom: -1 } } },
  ceiling: { time: '4:03 AM', title: 'THE CEILING',
    w: s => s.stress / 35,
    good:   { text: 'Couldn’t sleep, so he got up and read meeting literature on the floor till his eyes gave out.', e: { s: -3 }, sp: 5 },
    shaky:  { text: 'Stared at the ceiling till 4 AM. The committee in his head had a full agenda.', e: { s: 8 } } }
};
const TIERS = ['good', 'shaky', 'bad', 'worst'];
function sheHe(s, t) {
  if (!t || s.look.sex !== 'girl') return t;
  return t.replace(/\bhe\b/g, 'she').replace(/\bHe\b/g, 'She').replace(/\bhim\b/g, 'her').replace(/\bhis\b/g, 'her').replace(/\bHis\b/g, 'Her').replace(/\bhimself\b/g, 'herself').replace(/\byour guy\b/gi, 'your girl');
}
// tonight's danger, in words (what the evening shows)
function nightOutlook(s) {
  const edge = foundation(s) - riskOf(s);
  return edge >= 25 ? 'good' : edge >= 5 ? 'okay' : edge >= -15 ? 'shaky' : 'bad';
}
// the chance something really bad happens tonight (shown as %; never a promise)
function lockOdds(s) {
  if (s.heat >= 100) return 1;
  const R = riskOf(s); if (R < 55) return 0;
  const pBad = 1 - 1 / (1 + Math.exp(-(foundation(s) - R + 5) / 12));
  return Math.min(0.5, Math.round(pBad * Math.min(0.35, (R - 55) / 60) * 100) / 100 + (s.heat >= 60 ? 0.03 : 0));
}
function relapse(s) {
  const had = s.sober; s.sober = 0; s.relapses = (s.relapses || 0) + 1; s.spirit = 0;
  apply(s, { h: 15, s: 15, c: -Math.min(s.cash, 40) });
  trustUp(s, { pops: -1, mom: -2, shorty: -1, ghost: 2 });
  if (s.job) trustUp(s, { darlene: -2 });
  s.got = s.got.filter(g => !/^chip|^twoweeks$|^thirty$/.test(g));
  if (s.together) trustUp(s, { love: s.pregnant ? -3 : -2 });
  if (s.sponsee) { apply(s, { s: 8 }); }
  if (!s.flags.includes('oldcontact')) s.flags.push('oldcontact');
  record(s, 'Relapsed. ' + had + ' days, gone.' + (had >= 30 ? ' Back to one day at a time.' : ''));
}
// THE NIGHT, resolved exactly once. Returns the morning reveal.
function overnight(s) {
  if (s.heat >= 100) { s.lockedUp = { day: s.day, heat: s.heat, odds: 100, why: 'heat' }; return { tier: 'locked', time: '4:40 AM', title: 'THEY CAME FOR HIM', text: 'Too much heat for too long. Red and blue in the window at 4:40 AM.' }; }
  const F = foundation(s), R = riskOf(s), edge = F - R;
  const pool = Object.entries(WILD).map(([id, c]) => [id, Math.max(0, c.w(s)) + ((s.wildBoost || {})[id] || 0)]);
  pool.push(['quiet', 5 + Math.max(0, edge) / 10]);
  let r = rng(s) * pool.reduce((a, x) => a + x[1], 0), id = 'quiet';
  for (const [k, w] of pool) { r -= w; if (r <= 0) { id = k; break; } }
  if (id === 'quiet') {
    const n = pickNight(s); apply(s, { h: n.heat, s: n.stress });
    return { tier: n.heat <= 0 ? 'good' : 'shaky', time: '', title: n.title, text: n.text, dream: true, e: { h: n.heat, s: n.stress } };
  }
  const c = WILD[id], pGood = 1 / (1 + Math.exp(-(edge + NIGHT.pGoodShift) / NIGHT.pGoodSoft));
  let tier = 'good';
  if (rng(s) >= pGood) {
    const canWorst = c.worst && R >= NIGHT.worstAt && (!c.worstNeeds || c.worstNeeds(s));
    const pWorst = canWorst ? Math.min(NIGHT.worstCap, (R - NIGHT.worstAt) / 60) : 0, x = rng(s);
    tier = x < pWorst ? 'worst' : (R > 35 && x < pWorst + 0.5 && c.bad) ? 'bad' : c.shaky ? 'shaky' : 'bad';
  }
  if (!c[tier]) tier = c.shaky ? 'shaky' : 'good';
  const o = c[tier], out = { id, wt: tier, tier, time: c.time, title: c.title, text: sheHe(s, o.text), e: o.e || {}, t: o.t || {} };
  if (o.e) apply(s, o.e);
  if (o.t) out.t = trustUp(s, o.t);
  if (o.sp) s.spirit = clamp(s.spirit + o.sp, 0, 100);
  if (o.relapse) { relapse(s); out.tier = 'relapse'; }
  if (o.locked) { s.lockedUp = { day: s.day, heat: s.heat, odds: 0, why: id }; out.tier = 'locked'; }
  if (o.missing) {
    out.tier = 'missing';
    const back = rng(s) < 1 / (1 + Math.exp(-(F - 30) / 10));   // decided now so a refresh can't change it
    out.after = back
      ? { tier: 'shaky', time: '4:52 PM', text: sheHe(s, 'The door opens at 4:52 PM. He’s sober. Sat in Ghost’s car all night, said no to everything, and walked home at noon. “I’m okay. I’m not okay. But I’m sober.”'), e: { s: 10, h: 5 } }
      : { tier: 'relapse', time: '4:52 PM', text: sheHe(s, 'The door opens at 4:52 PM. You can tell before he says a word. He used. He’s home, he’s alive, and he’s ashamed.') };
    if (back) apply(s, out.after.e); else relapse(s);
    s.missingDay = true;
  }
  record(s, c.title + ': ' + out.text);
  return out;
}

function heatWords(s) { return s.heat <= CFG.heat.safe ? 'You’re good.' : s.heat < 70 ? 'Watch it.' : s.heat < 100 ? 'Tonight’s a gamble.' : 'They’re coming.'; }

function endDay(s) {
  if (s.result || s.lockedUp) return false;
  const H = CFG.heat, n0 = s.logN || 0, nightDay = s.day;
  // debt first, then food
  if (s.arrears && s.cash) { const pay = Math.min(s.cash, s.arrears); s.cash -= pay; s.arrears -= pay; if (!s.arrears && s.housing === 'Shelter') { s.housing = levelInfo(s.level).housing; record(s, 'Debt paid. You got your bed back.'); } }
  const tl = s.tl || 1, food = CFG.food * tl;
  if (s.cash >= food) s.cash -= food;
  else if (s.trust.shorty >= 8 && tl === 1) { s.cash = 0; record(s, 'Broke. Shorty split his dinner with you.'); }
  else { s.cash = 0; apply(s, { s: 12, n: -3 }); record(s, tl === 1 ? 'Couldn’t eat tonight.' : 'Ate like it was the old days: whatever was free.'); }
  // the spiritual stuff
  if (s.spiritToday) { s.streak++; s.bestStreak = Math.max(s.bestStreak, s.streak); }
  else { s.streak = 0; s.daysSinceSupport++; const add = H.noSpirit[Math.min(s.daysSinceSupport, H.noSpirit.length - 1)]; if (add) { apply(s, { h: add }); record(s, s.daysSinceSupport + ' day' + (s.daysSinceSupport === 1 ? '' : 's') + ' with nothing spiritual: +' + add + ' heat.'); } }
  s.meetStreak = s.meetToday ? s.meetStreak + 1 : 0;
  s.helpStreak = s.helpToday ? s.helpStreak + 1 : 0;
  if (s.meetStreak >= 3 && !s.got.includes('sponsor')) { trustUp(s, { pops: 2 }); if (s.trust.pops >= 5) { s.sponsor = true; } got(s, 'sponsor'); if (!s.sponsor) record(s, 'Pops offered. He wants more trust first.'); }
  if (s.meetStreak >= 3 && !s.sponsor && s.trust.pops >= 5) { s.sponsor = true; badge(s, 'Pops is your sponsor.'); }
  if (s.helpStreak >= 3 && got(s, 'helping')) { trustUp(s, { shorty: 2 }); apply(s, { n: 5 }); }
  if (s.streak >= 7 && got(s, 'showing')) apply(s, { h: -15 });
  if (s.stress >= H.maxedStress) apply(s, { h: H.maxedStressHeat });
  if (s.connection < H.aloneBelow) apply(s, { h: H.aloneHeat });
  if (s.trust.ghost >= 8) apply(s, { h: H.ghostHigh });
  if (s.housing === 'Shelter') apply(s, { h: 5, s: 5 });
  apply(s, { h: H.street });
  apply(s, { n: -2 });
  // the situation you left hanging
  if (s.scen) {
    const c = sitById(s.scen.id);
    apply(s, { h: c.daily }); s.scen.left--;
    if (s.scen.left <= 0) {
      const x = c.expire; apply(s, x); trustUp(s, x.trust);
      card(s, { kind: 'expired', title: c.title, text: forSex(s, x.say), h: x.h, s: x.s, c: x.c, n: x.n, t: x.trust });
      record(s, c.title + ' — you let it ride. ' + x.say);
      s.scen = null;
    }
  }
  // work
  if (s.job) {
    s.employedDays++;
    if (s.trust.darlene <= 0) { s.job = false; s.employedDays = 0; card(s, { kind: 'news', title: 'DARLENE LET YOU GO', text: 'She didn’t yell. She just handed you a check and said don’t come back. Look for a better job to find another one.', s: 15 }); apply(s, { s: 15 }); record(s, 'Fired.'); }
    else if (s.level >= 2 && s.wage < CFG.raiseWage && s.employedDays >= 7 && s.shifts >= 5) { s.wage = CFG.raiseWage; got(s, 'raise'); trustUp(s, { darlene: 1 }); }
  }
  // v7: the squeeze. Jaz needs time. Lights-off and the shelter wear on him. The baby comes.
  if (s.together) {
    s.togetherTurns++;
    if (s.loveCold >= (tl === 1 ? 4 : 2)) { trustUp(s, { love: -1 }); if (s.loveCold === (tl === 1 ? 4 : 2)) card(s, { kind: 'news', who: 'love', title: 'YOU STILL ALIVE?', text: loveSwap(s, 'Jaz: “you still alive? asking for me.” She’s not mad. That’s worse. Take her out. Put her first for one turn.'), s: 6 }); apply(s, { s: 6 }); }
    s.loveCold++;
  } else s.loveCold = 0;
  if (s.lightsOff) apply(s, { s: 6, h: 4 });
  if (s.pregnant && !s.baby && s.day - s.pregDay >= 240 && !s.flags.includes('baby_due')) s.flags.push('baby_due');
  if (s.pregnant && !s.baby && s.day - s.pregDay >= 300) { s.baby = true; s.pregnant = false; got(s, 'baby'); apply(s, { n: 10, s: 10 }); trustUp(s, { mom: 2, love: 1 }); }
  // rent day
  const own = s.housing === 'My own place', wks = Math.max(1, weeksIn(s)), periodWord = tl === 1 ? 'RENT DAY' : tl === 7 ? 'END OF THE WEEK' : 'END OF THE MONTH';
  if (rentEvent(s) && s.housing === 'Shelter') {
    // the debt is frozen while he's out: the shelter charges nothing, Big Ray just waits for what's owed
    s.rentDays++;
    card(s, { kind: 'rent', title: periodWord + ': SHELTER', text: 'No rent at the shelter. Big Ray still has your name on a list: you owe him $' + s.arrears + '. Pay it off and the bed is yours again.' + (employed(s) ? '' : ' That means a job.') });
  } else if (rentEvent(s)) {
    const B = weeklyBills(s), due = B.total * wks, paid = Math.min(s.cash, due);
    const list = [['rent', own ? 'rent' : 'Big Ray'], ['utilities', 'lights and water'], ['car', 'the car'], ['bus', 'the bus'], ['fees', 'court fees'], ['phone', 'the phone'], ['support', 'child support'], ['baby', s.baby ? 'the baby' : 'baby stuff']].filter(([k]) => B[k]).map(([k, w]) => w + ' $' + B[k] * wks).join(', ');
    s.cash -= paid; s.rentDays++;
    if (paid === due && !s.arrears) {
      s.rentsOnTime++; if (s.level >= 4) s.rentsL4++; s.behind = 0; if (s.lightsOff) { s.lightsOff = false; record(s, 'Lights back on.'); }
      apply(s, { s: -8, h: -5 }); trustUp(s, own ? { mom: 1 } : { ray: 2, mom: 1 });
      card(s, { kind: 'rent', title: periodWord + ': PAID', text: RENT_TALK[Math.min(s.level, 4)] + ' ' + list + '. You paid all $' + due + '.', h: -5, s: -8 });
      if (s.rentsOnTime >= 3) got(s, 'rent3');
    } else {
      s.arrears += due - paid; s.rentsOnTime = 0; if (s.level >= 4) s.rentsL4 = 0; s.behind++;
      const soft = s.trust.ray >= 8 && !own;
      const e = soft ? { s: 10, h: 6, n: -2 } : { s: 20, h: 12, n: -5 };
      apply(s, e); trustUp(s, own ? { mom: -1 } : { ray: -3, mom: -1 });
      card(s, { kind: 'rent', title: periodWord + ': SHORT', text: RENT_TALK[Math.min(s.level, 4)] + ' Due: ' + list + '. You had $' + paid + ' of $' + due + '. You owe $' + s.arrears + '.' + (soft ? ' Ray likes you, so he’ll wait. Barely.' : ''), ...e });
      // the squeeze: what gets taken
      if (s.car && s.behind >= 2) { s.car = false; s.items = s.items.filter(i => i !== 'car' && i !== 'car2'); card(s, { kind: 'news', title: 'REPO', text: 'A flatbed at 5 AM. Two guys who’ve done this a thousand times. The car’s gone. The debt isn’t. Give rides is locked till you’ve got wheels again.', s: 15 }); apply(s, { s: 15 }); record(s, 'The car got repo’d.'); }
      if (own && !s.lightsOff && s.behind >= 1) { s.lightsOff = true; card(s, { kind: 'news', title: 'LIGHTS OFF', text: 'A pink notice on the door, then a click. No lights, no hot water, phone charging at the gas station. Every turn like this wears on him. Catch up and they come back on.', s: 10 }); }
      if (own && s.behind >= 3) { s.housing = 'Sober house'; s.lightsOff = false; s.behind = 0; s.arrears = Math.min(s.arrears, 300); card(s, { kind: 'news', who: 'ray', title: 'EVICTED', text: 'Three behind. The landlord changed the locks while you were at work. Big Ray took you back, bottom bunk, $150 a week, like you never left. “Told you the world don’t care how sober you are.” Stack for move-out to get your own door again.', s: 20, h: 10 }); apply(s, { s: 20, h: 10 }); record(s, 'Evicted. Back at Big Ray’s.'); }
      if (!own && s.arrears >= 2 * due && s.housing !== 'Shelter') { s.housing = 'Shelter'; const why = !s.job ? 'Pops didn’t sugarcoat it: “Meetings keep you sober. They don’t pay Big Ray. Faith without works, kid. Go get a job.”'
        : s.trust.darlene <= 2 ? 'Pops didn’t sugarcoat it: “Darlene cut your hours because you keep giving her reasons. Show up, and the money shows up.”'
        : 'Pops didn’t sugarcoat it: “You’re working, but the money’s leaking out somewhere. More shifts, less spending, till you’re caught up.”';
      card(s, { kind: 'news', who: 'pops', title: 'LOST THE BED', text: 'You owe Big Ray $' + s.arrears + ', two weeks behind. Your stuff is in a garbage bag on the porch. Shelter tonight. ' + why + ' The debt stops growing while you’re out. Pay it off and the bed is yours again.' }); record(s, 'Lost the bed.'); }
    }
  }
  // the love story
  if (!s.together && s.trust.love >= 8) { s.together = true; got(s, 'love'); apply(s, { n: 10, s: -10 }); }
  else if (s.together && s.trust.love <= 2) { s.together = false; s.got = s.got.filter(g => g !== 'love'); card(s, { kind: 'news', who: 'love', title: 'IT’S OVER', text: loveSwap(s, 'Jaz sent one text: “i can’t keep doing this.” Then nothing. You keep checking anyway.'), s: 15 }); apply(s, { s: 15 }); record(s, loveSwap(s, 'Jaz ended it.')); }
  if (s.together) apply(s, { s: -3 });
  // OVERNIGHT: he's on his own now
  const rv = overnight(s);
  s.reveal = { ...rv, day: nightDay, facts: s.log.slice(0, Math.max(0, (s.logN || 0) - n0)).reverse().filter(x => !/^(THE |MOM CALLED|NEW CHAPTER)/.test(x)) };
  if (s.lockedUp) { record(s, 'Night ' + nightDay + ': locked up.'); return true; }
  s.spirit = clamp(s.spirit + SPIRIT.nightly, 0, 100);
  s.standing++;
  const relapsed = rv.tier === 'relapse' || (rv.after && rv.after.tier === 'relapse');
  if (!relapsed) s.sober += tl;
  for (const [n, id] of [[1, 'chip1'], [7, 'chip7'], [14, 'chip14'], [30, 'chip30'], [60, 'chip60'], [90, 'chip90'], [180, 'chip180'], [270, 'chip270'], [365, 'chip365']]) if (s.sober >= n) got(s, id);
  if (s.sober >= 14) got(s, 'twoweeks') && apply(s, { s: -20, h: -10 });
  if (s.sober >= 30) got(s, 'thirty');
  s.coolDays = s.heat <= H.safe ? s.coolDays + 1 : 0;
  checkLevel(s);
  if (s.result) return true;
  s.day += tl; s.turn = (s.turn || 1) + 1; s.tl = turnLenFor(s.sober);
  s.actions = s.missingDay ? 1 : CFG.actions; s.missingDay = false; s.lifeToday = 0; s.riskToday = 0; s.wildBoost = {};
  s.spiritToday = false; s.supportToday = false; s.restToday = false; s.meetToday = false; s.helpToday = false; s.workToday = 0; s.zeroedToday = false; s.lastOutcome = null; s.today = [];
  startDay(s, false);
  return true;
}
const RENT_TALK = [
  '',
  'Big Ray’s in the hallway like the IRS with a gold chain. “I don’t care how spiritual you got this week. Where’s my money?”',
  'Ray wants $140 now because you’ve got income. Almost two days of wages, while he tells you how lucky you are.',
  '$150 to share one refrigerator with seventeen grown adults. Every rent day is another reason to get the hell out.',
  'No Big Ray. No house meeting. Just you, a landlord who expects payment, and keys nobody can take as long as you handle your shit.'
];

if (typeof module !== 'undefined') {
  const C = require('./cards.js'), S = require('./situations.js');
  Object.assign(globalThis, C, S);
  module.exports = { relapse, rowIds, turnKind, turnLenFor, shiftsIn, weeksIn, turnLabel, weeklyBills, billsDueNow, rentEvent, bizPay, employed, needOK, WRECKAGE, LOOK_ITEMS, personFor, loveSwap, NIGHT, SPIRIT, WILD, foundation, riskOf, overnight, nightOutlook, sheHe, NEED, DAYS, dayName, weekend, extraShift, billsDue, VERSION, SAVE_KEY, CFG, WIN, LEVELS, FIGURES, shop, SHOP_GROUPS, ACTION_IDS, ACTION_LABEL, MOVES, ROWS, ROW_OF, PEOPLE, RECEIPTS, STREAKS, person, item, has, fresh, migrate, restartKeepFigure, startDay, scenFor, sitById, nightCard, preview, whyNot, canDo, action, buy, cantBuy, nextNeeds, checkLevel, lockOdds, heatWords, endDay, levelInfo, rentDue, nextRentDay, ...C, ...S };
}
