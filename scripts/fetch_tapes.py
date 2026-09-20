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
SKIP_TITLE_RE = re.compile(r'crossing\s*bridges', re.IGNORECASE)


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
        try:
            for it in paged('playlistItems', part='contentDetails',
                            playlistId=pid, maxResults=50):
                vid = it.get('contentDetails', {}).get('videoId')
                if vid:
                    in_a_playlist.add(vid)
        except urllib.error.HTTPError as e:
            print('  ! could not read playlist %s (%s)' % (pid, e.code), file=sys.stderr)

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

    loose.sort(key=lambda v: v['at'], reverse=True)

    # ---- how long each one runs ------------------------------------------
    durations = {}
    ids = [v['id'] for v in loose]
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

    items = playlists + videos

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

    print('Wrote %s: %d playlists + %d loose videos = %d tapes.'
          % (OUT_PATH, len(playlists), len(videos), len(items)))


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
