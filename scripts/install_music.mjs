#!/usr/bin/env node
/* PICK THE SPIN MUSIC, STEP 2 OF 2 (1 Oct 2026). Takes the clips you kept on the picker
 * page (keep.json) and puts them in the app: assets/spin-music/<name>.mp3 (cut to 15 seconds) plus
 * assets/spin-music/list.json, which the Spin maker's Music tab reads.
 *
 *   Run from the repo:  node scripts/install_music.mjs
 *   (looks for keep.json in ~/Downloads/spin-music/ or ~/Downloads/)
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const SRC = path.join(os.homedir(), 'Downloads', 'spin-music');
const keepPath = [path.join(SRC, 'keep.json'), path.join(os.homedir(), 'Downloads', 'keep.json')].find((p) => fs.existsSync(p));
if (!keepPath) { console.error('No keep.json yet. Tap "Save my list" on the picker page first.'); process.exit(1); }
const keep = JSON.parse(fs.readFileSync(keepPath, 'utf8'));
if (!keep.length) { console.error('keep.json is empty. Tap Keep on some clips first.'); process.exit(1); }

const DEST = path.join(process.cwd(), 'assets', 'spin-music');
if (!fs.existsSync(path.join(process.cwd(), 'feed', 'porch.html'))) { console.error('Run this from ~/Projects/recoverymisfits-app'); process.exit(1); }
fs.rmSync(DEST, { recursive: true, force: true });
fs.mkdirSync(DEST, { recursive: true });

const used = new Set(), list = [];
for (const k of keep) {
  const from = path.join(SRC, k.file);
  if (!fs.existsSync(from)) { console.warn('Missing ' + k.file + ', skipped'); continue; }
  let slug = String(k.name || 'track').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'track';
  let s = slug, n = 2; while (used.has(s)) s = slug + '-' + n++;
  used.add(s);
  /* Spins are 15 seconds max, so each clip is cut to 15 with a soft fade at the end
     (1 Oct 2026, Mike). No ffmpeg? The 20-second clip goes in as it is. */
  const to = path.join(DEST, s + '.mp3');
  const ff = spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', from, '-t', '15', '-af', 'afade=t=out:st=13.6:d=1.4', '-ac', '2', '-ar', '44100', '-b:a', '128k', to]);
  if (ff.status !== 0 || !fs.existsSync(to)) fs.copyFileSync(from, to);
  list.push({ id: s, name: k.name, style: k.style, by: k.by, freesound: k.freesound, file: '/assets/spin-music/' + s + '.mp3' });
}
fs.writeFileSync(path.join(DEST, 'list.json'), JSON.stringify(list, null, 1));
const mb = list.reduce((a, t) => a + fs.statSync(path.join(DEST, t.id + '.mp3')).size, 0) / 1048576;
console.log(`Put ${list.length} clips in assets/spin-music (${mb.toFixed(1)} MB). Now push.`);
