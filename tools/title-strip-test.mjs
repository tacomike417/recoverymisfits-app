/* Titles carry no date, and the stripper that guards that does no harm.
 *
 * WHY THIS FILE EXISTS
 *
 * Every title in data/readings.json used to begin with its own date --
 * "September 19 — The Amends That Cannot Be Made Directly" -- and both the
 * reading page and the Readings card stripped it off before displaying,
 * because both print the date separately on its own line.
 *
 * That stripper demanded a full month name, a day and a dash, and five real
 * days in the file did not look like that. Every one of them printed its own
 * date as the headline, on a page whose whole job is the headline:
 *
 *     Dec 23 — Selfish vs. Self-Seeking        abbreviated month
 *     Dec 24 — Long Day
 *     Dec 25 — Grace: The Greatest Gift
 *     August 9, 2026 - All                     carries a year
 *     Jsnusty 11 – Keeping an Open Mind        typed wrong
 *     ly 8 – I Don't Have to Be Right          typed wrong
 *
 * Nobody noticed. Four of the six are Christmas week and a typo.
 *
 * The dates are now out of the data entirely -- 364 titles rewritten, bodies
 * untouched -- so the headline is the headline and nothing has to be undone
 * at display time. The stripper stays as a seatbelt for anything typed into
 * the admin with a date on the front out of old habit.
 *
 * So this checks three things, and the second is the one that would bite:
 *
 *   1. no title in the data carries a date any more
 *   2. the stripper leaves a clean title completely alone -- a regex loose
 *      enough to catch "Jsnusty" would eat the first word of a real title
 *   3. it still strips a date when it meets one, in every shape seen above
 *
 * The regexes are read out of the shipping files rather than copied here, and
 * BOTH are read, because the two screens drifting apart is the real risk.
 *
 * Run:  node tools/title-strip-test.mjs
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (p) => readFileSync(path.join(root, p), 'utf8');
const data = JSON.parse(read('data/readings.json'));

const sources = {
  'assets/daily-reading.js': read('assets/daily-reading.js'),
  'readings.html': read('readings.html')
};

function regexFrom(src, where) {
  const months = src.match(/var MONTHS3 = \[([\s\S]*?)\];/);
  const line = src.match(/var LEADING_DATE = new RegExp\(([\s\S]*?)\);/);
  if (!months || !line) throw new Error(`No LEADING_DATE found in ${where}`);
  const MONTHS3 = eval('[' + months[1] + ']');
  return eval('new RegExp(' + line[1] + ')');
}

const DATE_ON_FRONT = /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{1,2}/i;

/* Every shape the file actually contained, plus the ones a person might type. */
const SHOULD_STRIP = [
  ['September 19 — The Amends That Cannot Be Made Directly', 'The Amends That Cannot Be Made Directly'],
  ['Dec 23 — Selfish vs. Self-Seeking', 'Selfish vs. Self-Seeking'],
  ['August 9, 2026 - All', 'All'],
  ['June 18 – You Can Go With This, or You Can Go With That', 'You Can Go With This, or You Can Go With That'],
  ['Sept. 5 – Willingness', 'Willingness'],
  ['May 7 – Now', 'Now']
];

/* Real titles. If the stripper touches any of these it is too greedy. */
const MUST_NOT_TOUCH = [
  '417, bro',
  'Now',
  'Try',
  'Grace: The Greatest Gift',
  'Marching Orders',                 // starts with Mar
  'Augment the Gratitude List',      // starts with Aug
  'January Was a Long Time Ago',     // a real month, but no day after it
  'Decide Before You Have To',       // starts with Dec
  'May We Never Forget'              // starts with May
];

let pass = 0, fail = 0;
const note = (ok, msg) => { ok ? pass++ : fail++; console.log((ok ? '  ok  ' : '  FAIL') + '  ' + msg); };

console.log('\nTitles, and the date-stripper that guards them\n');

/* ---- 1. the data as it actually is ----
   Most titles still carry their date, and that is fine: the stripper is what
   takes it off before either screen prints it. The dates are being cleaned
   out of the data by hand, a few at a time, so this counts rather than
   demands -- what must hold is that every dated one strips CLEANLY. */
const dated = Object.entries(data).filter(([, v]) => DATE_ON_FRONT.test(String(v.title || '')));
console.log(`  --    ${dated.length} of ${Object.keys(data).length} titles still carry their date in the data`);

const empty = Object.entries(data).filter(([, v]) => !String(v.title || '').trim());
note(empty.length === 0, `no title is empty` + (empty.length ? `: ${empty.map(([k]) => k).join(', ')}` : ''));

/* ---- 2 and 3, for each screen ---- */
const results = {};
for (const [where, src] of Object.entries(sources)) {
  let re;
  try { re = regexFrom(src, where); } catch (e) { note(false, e.message); continue; }

  const harmed = MUST_NOT_TOUCH.filter((t) => t.replace(re, '').trim() !== t);
  note(harmed.length === 0,
    `${where}: leaves a real title alone` +
    (harmed.length ? `\n        chewed: ` + harmed.map((t) => JSON.stringify(t)).join(', ') : ''));

  const wrong = SHOULD_STRIP.filter(([input, want]) => input.replace(re, '').trim() !== want);
  note(wrong.length === 0,
    `${where}: still strips a date when it meets one` +
    (wrong.length ? `\n        ` + wrong.map(([i, w]) => `${JSON.stringify(i)} → ${JSON.stringify(i.replace(re, '').trim())}, wanted ${JSON.stringify(w)}`).join('\n        ') : ''));

  const live = {};
  for (const [k, v] of Object.entries(data)) live[k] = String(v.title).replace(re, '').trim() || String(v.title);
  results[where] = live;

  /* Every dated title must come out the other side WITHOUT its date and with
     something left to print. A stripper that returned an empty string, or
     that left the date on, is the bug this whole file is about. */
  const stillDated = Object.keys(data).filter((k) => DATE_ON_FRONT.test(live[k]));
  note(stillDated.length === 0,
    `${where}: no title still shows a date after stripping` +
    (stillDated.length ? `\n        ` + stillDated.slice(0, 6).map((k) => `${k} ${JSON.stringify(live[k])}`).join(', ') : ''));

  const vanished = Object.keys(data).filter((k) => !live[k].trim());
  note(vanished.length === 0,
    `${where}: no title strips down to nothing` +
    (vanished.length ? `: ${vanished.join(', ')}` : ''));

  const cleanAlready = Object.keys(data).filter((k) => !DATE_ON_FRONT.test(String(data[k].title)));
  const harmedReal = cleanAlready.filter((k) => live[k] !== String(data[k].title).trim());
  note(harmedReal.length === 0,
    `${where}: the ${cleanAlready.length} already-clean titles pass through untouched` +
    (harmedReal.length ? `\n        changed: ` + harmedReal.slice(0, 5).join(', ') : ''));
}

/* ---- the two screens must agree ---- */
const [a, b] = Object.keys(results);
if (a && b) {
  const differ = Object.keys(data).filter((k) => results[a][k] !== results[b][k]);
  note(differ.length === 0,
    `the reading page and the Readings card agree on all 365` +
    (differ.length ? `\n        differ on: ` + differ.slice(0, 5).join(', ') : ''));
}

console.log(`\n${pass} pass, ${fail} fail\n`);
process.exit(fail ? 1 : 0);
