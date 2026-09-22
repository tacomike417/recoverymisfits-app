#!/usr/bin/env python3
"""
Builds data/tapes.js -- the speaker tapes on audio.html that come from the
Taco Mike 417 YouTube channel.

WHY THIS RUNS AT DEPLOY TIME AND NOT IN THE BROWSER. Two reasons, both worth
remembering before anybody "simplifies" it:

  1. The API key. Called from the page, the key is in the page source, where
     anyone can lift it and spend the daily quota. Here it lives in a GitHub
     secret and never leaves the runner.
  2. The words. A list fetched by JavaScript is a list Google cannot read --
     which is the whole reason the reading pages had to be generated. Baking
     the tapes into a file that ships with the site keeps them readable.

WHAT IT PRODUCES:  window.RM_TAPES = { generated, items:[ ... ] }
Playlists first, then the videos that are not inside any playlist, newest
first. audio.html appends these AFTER its own five hand-kept tapes, whose
order never changes.

IF THIS SCRIPT FAILS -- no key, quota gone, YouTube down -- it writes nothing
and exits 0. The deploy carries on and the page falls back to the five tapes
it has always had. A broken fetch must never take the page down with it.

Quota: about 20 units of the 10,000/day allowance.

Run locally with:  YOUTUBE_API_KEY=... python3 scripts/fetch_tapes.py
"""
import json, os, re, sys, urllib.parse, urllib.request, urllib.error
from datetime import datetime, timezone

API = 'https://www.googleapis.com/youtube/v3/'
CHANNEL_ID = 'UCAZjyq3s1M2j0Hp_m9jgHOg'          # @tacomike417

# ---------------------------------------------------------------------------
# THE TWO LIMITS. Both exist because of one true story, 22 Sep 2026: a
# library playlist was about to go from six tapes to seven hundred.
# ---------------------------------------------------------------------------

# How many of a playlist's talks get written into data/tapes.js. The count on
# the row is always the real one -- this only caps the list that opens under
# it. Seven hundred children is about 63KB of names and ids in a file EVERY
# visitor downloads, on the Listen page and now on the home screen too, for a
# list nobody scrolls to the bottom of. The row still opens the whole playlist
# on YouTube.
MAX_CHILDREN = 150

# How many loose talks can ever reach the feed. Nothing here should trip this
# -- there are about eighty and they only grow one upload at a time. It is a
# stop on the one failure that actually matters: a playlist the API cannot
# see, whose videos then arrive as hundreds of separate rows. If this trips,
# something is wrong upstream and the message below says where to look.
MAX_LOOSE = 150

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_ROOT = os.environ.get('ADS_OUT_ROOT', ROOT)
OUT_PATH = os.path.join(OUT_ROOT, 'data', 'tapes.js')

# ---------------------------------------------------------------------------
# THE SKIP LIST. Everything here is a deliberate choice, not a bug.
# ---------------------------------------------------------------------------

# Already hand-placed in audio.html's own PLAYLISTS array. They keep their
# position at the top of the page; picking them up again here would print
# them twice.
ALREADY_ON_THE_PAGE = {
    'PLxb8I9B3VlNvAKFFZugCC8a7Pq6tkpF7E',   # Joe & Charlie
    'PLvwn9cjv4shDAovzrlf_5k0pW9hF_P8Lf',   # Father Martin - Chalk Talks
    'PLxb8I9B3VlNvBfT34yoa_MU2zay5WTsiA',   # Chuck C - A New Pair of Glasses
    'PLxb8I9B3VlNv7NFjbYLO809xJBBhf7CuE',   # Allen McGinnis
    'PLcWUlHHreIu63jNVOsrx1NiRPv25Q_BPn',   # Danny's Big Book Study
}

# A second Joe & Charlie playlist that was made by mistake on the channel.
SKIP_PLAYLIST_IDS = {
    'PLxb8I9B3VlNuEQmNzgbORIyaB3QZv2s7M',   # "Joe & Charlie Big Book Study"
}

# Personal. Never goes on the site, whatever it gets renamed to next.
# Matched against playlist AND video titles.
#
# "500 Pound Gorilla" is here for a different reason: one chapter of that
# audiobook got uploaded to the channel on its own, filename and all, and the
# whole book is already on audio.html under AUDIOBOOKS. It does not need a
# second home in the tape list. The match is on the book, not the filename,
# so if the other sixteen chapters ever go up they stay out too.
SKIP_TITLE_RE = re.compile(
    r'crossing\s*bridges|500\s*pound\s*gorilla', re.IGNORECASE)

# ---------------------------------------------------------------------------
# SERIES. A talk given in thirteen parts is one tape, not thirteen.
#
# The 12 & 12 went up as thirteen separate uploads and Sandy Beach's 12 Steps
# & Stories as twelve, and loose on the page they drowned everything else.
# Neither is a playlist on the channel, so YouTube cannot tell us they belong
# together -- their titles have to.
#
# The rule is deliberately narrow: strip a trailing part number, and if three
# or more titles are identical once it is gone, they are a series. Checked
# against all 106 loose videos -- it catches those two and nothing else.
# Titles that merely share a speaker are NOT a series and stay separate.
# ---------------------------------------------------------------------------
SERIES_TAIL_RE = re.compile(
    r'[\s\-\u2013\u2014_:,.()\[\]]*'
    r'(?:\b(?:part|pt|talk|step|session|tape|disc|cd|vol|volume|chapter|ch|no|number|episode|ep)\b'
    r'[\s\-\u2013\u2014_#.]*)?'
    r'#?\s*(\d{1,3})\s*(?:\s*(?:of|/|-)\s*\d{1,3})?\s*'
    r'[\s\-\u2013\u2014_:,.()\[\]]*$',
    re.IGNORECASE)

SERIES_MIN = 3


def series_stem(title):
    """('AA Twelve Steps & Twelve Traditions', 5) or (None, 0).

    Strips at most two trailing numbers, because "12 Steps & Stories - Talk 5
    of 12" carries one in the name itself and one at the end."""
    stem = re.sub(r'\.mp3$', '', title.strip(), flags=re.IGNORECASE).strip()
    first = 0
    for _ in range(2):
        m = SERIES_TAIL_RE.search(stem)
        if not m:
            break
        if not first:
            first = int(m.group(1))
        stem = stem[:m.start()].strip()
    if not first or len(normalize(stem)) < 6:
        return None, 0
    return stem, first


def short_part(title, stem, n):
    """'AA ... Traditions-Step-5' under the stem 'AA ... Traditions' -> 'Step 5'."""
    t = re.sub(r'\.mp3$', '', title.strip(), flags=re.IGNORECASE).strip()
    if t.lower().startswith(stem.lower()):
        rest = t[len(stem):].strip(' \t-\u2013\u2014_:,.|')
        # "Step-5" is a filename talking, not a person. "Step 5" is the person.
        rest = re.sub(r'(?<=[A-Za-z])[-_](?=\d)', ' ', rest)
        rest = re.sub(r'\s+', ' ', rest).strip()
        if rest:
            return rest
    return t or ('Part %d' % n)


def normalize(s):
    s = s.lower().replace('\u2019', '').replace("'", '').replace('"', '')
    return re.sub(r'[^a-z0-9]+', ' ', s).strip()


def api(endpoint, **params):
    params['key'] = KEY
    url = API + endpoint + '?' + urllib.parse.urlencode(params)
    with urllib.request.urlopen(url, timeout=30) as r:
        return json.loads(r.read().decode('utf-8'))


def paged(endpoint, **params):
    """Walk every page of a list endpoint."""
    token = None
    while True:
        if token:
            params['pageToken'] = token
        data = api(endpoint, **params)
        for item in data.get('items', []):
            yield item
        token = data.get('nextPageToken')
        if not token:
            return


def best_thumb(snippet):
    t = snippet.get('thumbnails') or {}
    for size in ('medium', 'high', 'standard', 'default'):
        if size in t and t[size].get('url'):
            return t[size]['url']
    return None


def pretty_duration(iso):
    """PT1H12M4S -> 1:12:04. Anything unparseable comes back empty."""
    m = re.match(r'^P(?:\d+D)?T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$', iso or '')
    if not m:
        return ''
    h, mi, s = (int(x) if x else 0 for x in m.groups())
    if h:
        return '%d:%02d:%02d' % (h, mi, s)
    return '%d:%02d' % (mi, s)


def main():
    # ---- the playlists ----------------------------------------------------
    playlists = []
    in_a_playlist = set()
    for pl in paged('playlists', part='snippet,contentDetails',
                    channelId=CHANNEL_ID, maxResults=50):
        pid = pl['id']
        title = pl['snippet']['title'].strip()
        count = pl.get('contentDetails', {}).get('itemCount', 0)

        # Every video inside a playlist is spoken for, even when the playlist
        # itself is skipped -- otherwise skipping the duplicate Joe & Charlie
        # would dump its 34 videos onto the page as loose tapes.
        #
        # The children are kept as well as counted: the page opens a playlist
        # into this list so somebody can pick one talk instead of starting at
        # the top of fourteen.
        children = []
        seen_child = set()
        try:
            for it in paged('playlistItems', part='snippet,contentDetails',
                            playlistId=pid, maxResults=50):
                vid = it.get('contentDetails', {}).get('videoId')
                if not vid:
                    continue
                # EVERY video in the playlist is spoken for, however many
                # there are -- this set is what keeps them out of the feed,
                # so it is filled before any cap is applied.
                in_a_playlist.add(vid)
                if vid in seen_child:
                    # The same talk added to the playlist twice. It happens,
                    # and it printed twice in the opened list.
                    continue
                seen_child.add(vid)
                if len(children) >= MAX_CHILDREN:
                    continue
                name = (it.get('snippet', {}).get('title') or '').strip()
                if name and name not in ('Private video', 'Deleted video'):
                    children.append({'id': vid, 'title': name})
        except urllib.error.HTTPError as e:
            print('  ! could not read playlist %s (%s)' % (pid, e.code), file=sys.stderr)

        if len(seen_child) > MAX_CHILDREN:
            print('  . %s has %d talks; writing the first %d into the file, '
                  'the row opens all of them on YouTube.'
                  % (title, len(seen_child), MAX_CHILDREN))

        if pid in ALREADY_ON_THE_PAGE or pid in SKIP_PLAYLIST_IDS:
            print('  - skipping playlist: %s' % title)
            continue
        if SKIP_TITLE_RE.search(title):
            print('  - skipping playlist (personal): %s' % title)
            continue

        playlists.append({
            'kind': 'playlist',
            'id': pid,
            'title': title,
            'sub': '%d video%s' % (count, '' if count == 1 else 's'),
            'count': count,
            'thumb': best_thumb(pl['snippet']),
            'videos': children,
        })

    # ---- every video on the channel --------------------------------------
    ch = api('channels', part='contentDetails', id=CHANNEL_ID)
    uploads = ch['items'][0]['contentDetails']['relatedPlaylists']['uploads']

    uploaded = []
    for it in paged('playlistItems', part='snippet,contentDetails',
                    playlistId=uploads, maxResults=50):
        vid = it.get('contentDetails', {}).get('videoId')
        sn = it.get('snippet', {})
        if not vid:
            continue
        uploaded.append({
            'id': vid,
            'title': sn.get('title', '').strip(),
            'thumb': best_thumb(sn),
            'at': it['contentDetails'].get('videoPublishedAt', ''),
        })

    # ---- the loose ones ---------------------------------------------------
    loose = []
    for v in uploaded:
        if v['id'] in in_a_playlist:
            continue
        if not v['title'] or v['title'] in ('Private video', 'Deleted video'):
            continue
        if SKIP_TITLE_RE.search(v['title']):
            print('  - skipping video (personal): %s' % v['title'])
            continue
        loose.append(v)

    # THE GUARD. If this trips, a playlist has gone missing rather than a
    # hundred tapes having been uploaded one at a time.
    #
    # THE API ONLY LISTS A CHANNEL'S *PUBLIC* PLAYLISTS. An unlisted or
    # private playlist is invisible here, so its videos are never marked as
    # spoken for and every one of them arrives as its own row -- which is
    # exactly what a library playlist set to Unlisted would do to the feed.
    # The fix is on YouTube, not in this file: set the playlist to Public.
    if len(loose) > MAX_LOOSE:
        print('  ! %d loose talks, which is more than the %d this expects.\n'
              '    A playlist is probably set to Unlisted or Private -- the API\n'
              '    cannot see those, so their videos land in the feed one by one.\n'
              '    Keeping the newest %d and dropping the rest for now.'
              % (len(loose), MAX_LOOSE, MAX_LOOSE), file=sys.stderr)
        loose = loose[:MAX_LOOSE]

    # ---- the series ------------------------------------------------------
    stems = {}
    for v in loose:
        stem, n = series_stem(v['title'])
        if not stem:
            continue
        stems.setdefault(normalize(stem), {'label': stem, 'members': []})\
             ['members'].append((n, v))

    groups, spoken_for = [], set()
    for g in stems.values():
        if len(g['members']) < SERIES_MIN:
            continue
        g['members'].sort(key=lambda pair: pair[0])      # part 1, 2, 3 ...
        kids = [pair[1] for pair in g['members']]
        for v in kids:
            spoken_for.add(v['id'])
        groups.append({
            'kind': 'group',
            'id': 'grp_' + re.sub(r'[^a-z0-9]+', '-', normalize(g['label']))[:48],
            'title': g['label'],
            'sub': '%d parts' % len(kids),
            'count': len(kids),
            'thumb': kids[0]['thumb'],
            # INSIDE A CONTAINER CALLED "AA Twelve Steps & Twelve Traditions",
            # thirteen rows that each begin "AA Twelve Steps & Twelve
            # Traditions - " tell you nothing. The shared stem comes off and
            # what is left -- "Step 1", "Step 2" -- is the part you are
            # actually choosing between.
            'videos': [{'id': k['id'], 'title': short_part(k['title'], g['label'], i + 1)}
                       for i, k in enumerate(kids)],
        })
        print('  + series: %s (%d parts)' % (g['label'], len(kids)))

    groups.sort(key=lambda g: g['title'].lower())
    loose = [v for v in loose if v['id'] not in spoken_for]
    loose.sort(key=lambda v: v['at'], reverse=True)

    # ---- how long each one runs ------------------------------------------
    durations = {}
    ids = [v['id'] for v in loose]
    for holder in groups + playlists:                 # the children too
        ids.extend(k['id'] for k in holder.get('videos', []))
    ids = list(dict.fromkeys(ids))                    # de-duped, order kept
    for i in range(0, len(ids), 50):
        for d in api('videos', part='contentDetails',
                     id=','.join(ids[i:i + 50]), maxResults=50).get('items', []):
            durations[d['id']] = pretty_duration(
                d.get('contentDetails', {}).get('duration', ''))

    videos = [{
        'kind': 'video',
        'id': v['id'],
        'title': v['title'],
        'sub': durations.get(v['id']) or 'Speaker tape',
        'thumb': v['thumb'],
    } for v in loose]

    # Every child gets its run time too, so the opened list reads the same
    # as the outer one.
    for holder in groups + playlists:
        for k in holder.get('videos', []):
            k['sub'] = durations.get(k['id']) or ''

    # Playlists first, then the series, then the single talks newest first.
    items = playlists + groups + videos

    os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
    payload = {
        'generated': datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'),
        'items': items,
    }
    with open(OUT_PATH, 'w', encoding='utf-8') as f:
        f.write('/* Generated by scripts/fetch_tapes.py -- do not edit by hand. */\n')
        f.write('window.RM_TAPES = ')
        json.dump(payload, f, ensure_ascii=False, indent=1)
        f.write(';\n')

    print('Wrote %s: %d playlists + %d series + %d single talks = %d rows.'
          % (OUT_PATH, len(playlists), len(groups), len(videos), len(items)))


if __name__ == '__main__':
    KEY = os.environ.get('YOUTUBE_API_KEY', '').strip()
    if not KEY:
        print('No YOUTUBE_API_KEY set -- leaving data/tapes.js alone. '
              'The page falls back to its five built-in tapes.', file=sys.stderr)
        sys.exit(0)
    try:
        main()
    except Exception as e:
        # A failed fetch must never fail the deploy. The page still has its
        # five tapes; it just does not learn about any new ones today.
        print('Tape fetch failed (%s: %s) -- leaving data/tapes.js alone.'
              % (type(e).__name__, e), file=sys.stderr)
        sys.exit(0)
