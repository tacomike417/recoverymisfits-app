/* The On Awakening passage must not change. Ever.
 *
 * WHY THIS FILE EXISTS
 *
 * This is the 1938 Original Manuscript, pages 39-40, reproduced as a
 * historical document. It is not app copy. Nobody gets to tidy it, and that
 * includes tidying it by accident:
 *
 *   - It contains real typos from the manuscript -- "curcumstances",
 *     "undisiplined" -- which a spellcheck, an editor, or a well-meaning
 *     model will all want to fix.
 *   - It contains two bare "^" marks, which look like stray characters and
 *     are not.
 *   - It lives inside a JavaScript array, so it passes through string
 *     escaping every time the page is rewritten. The first attempt at that
 *     rewrite broke on 'Humbly say to yourself many times each day "Thy will
 *     be done."' -- the quotation marks ended the string and the whole page
 *     stopped running. A test that only counted words would have missed it;
 *     a browser caught it. This one hashes the text, so any change at all
 *     shows up.
 *
 * If this fails and you MEANT to change the passage, update EXPECTED_SHA
 * below and say so in the commit message. If you did not mean to change it,
 * something ate part of a historical document and it needs putting back.
 *
 * Run:  node tools/on-awakening-text-test.mjs
 */

import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';

const FILE = path.join(process.cwd(), 'on-awakening.html');

/* The passage as it stood on 19 September 2026, lifted from the page this
   one replaced without a character altered. */
const EXPECTED_WORDS = 573;
const EXPECTED_SHA = 'a8a97d93d3199d6ab0710763210c64705c56feda217d1a19576f041a8d8dc125';
const EXPECTED_CARETS = 2;
const MUST_CONTAIN = [
  'curcumstances',              // manuscript typo. Not a mistake. Leave it.
  'undisiplined',               // ditto
  '"Thy will be done."',        // the line that broke the first rewrite
  '"Faith without works is dead."',
  'It works - it really does. Try it.'
];

let pass = 0, fail = 0;
const note = (ok, msg) => { ok ? pass++ : fail++; console.log((ok ? '  ok  ' : '  FAIL') + '  ' + msg); };

console.log('\nOn Awakening — the passage\n');

const src = readFileSync(FILE, 'utf8');
const block = src.match(/var PASSAGE_HTML = \[\n([\s\S]*?)\n {2}\]\.join\(""\);/);

if (!block) {
  console.log('  FAIL  could not find PASSAGE_HTML in on-awakening.html');
  console.log('\n0 pass, 1 fail\n');
  process.exit(1);
}

/* Parsed as real JavaScript, which is the point: if the escaping is broken
   the page would not run, and neither will this. */
let paras;
try {
  paras = eval('[' + block[1] + ']');
  note(true, 'the passage array is valid JavaScript');
} catch (e) {
  note(false, 'the passage array does not parse: ' + e.message);
  console.log('\n' + pass + ' pass, ' + fail + ' fail\n');
  process.exit(1);
}

note(Array.isArray(paras) && paras.length === 4, `four paragraphs (found ${paras.length})`);

const html = paras.join('');
const text = html.replace(/<[^>]+>/g, ' ');
const words = text.split(/\s+/).filter(Boolean);

note(words.length === EXPECTED_WORDS,
  `${EXPECTED_WORDS} words (found ${words.length})`);

const sha = createHash('sha256').update(words.join(' ')).digest('hex');
note(sha === EXPECTED_SHA,
  'the text is unchanged, to the character' +
  (sha === EXPECTED_SHA ? '' : `\n        expected ${EXPECTED_SHA}\n        found    ${sha}`));

const carets = (text.match(/\^/g) || []).length;
note(carets === EXPECTED_CARETS, `both ^ marks survive (found ${carets})`);

MUST_CONTAIN.forEach((frag) => {
  note(text.includes(frag), `still contains ${JSON.stringify(frag)}`);
});

/* The region gate is not decoration either -- this reading is US-only for
   copyright reasons, and a redesign is exactly when a guard like that gets
   quietly dropped. */
note(/get\.geojs\.io/.test(src), 'the US-only region check is still here');
note(/\.catch\(showContent\)/.test(src), 'the region check still fails OPEN');
/* WORTH BEING HONEST ABOUT: keeping the passage in a JS array does NOT hide
   it. The old page's comment claimed it was not "sitting in the page source
   for anyone who fetches the raw HTML" -- but the script is IN the same HTML
   file, so view-source shows it either way. What the gate actually does is
   stop a normal visitor outside the US reading it in the app, which is the
   thing it was for. The array matters for a different reason: it keeps the
   text in ONE place, so it cannot be half-edited in the markup and half in
   the script. That is what this checks. */
const marker = 'Next, think about the twenty-four hours';
const hits = src.split(marker).length - 1;
note(hits === 1, `the passage exists in exactly one place in the file (found ${hits})`);

console.log(`\n${pass} pass, ${fail} fail\n`);
process.exit(fail ? 1 : 0);
