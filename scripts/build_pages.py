#!/usr/bin/env python3
"""
Generates static, crawlable pages for every reading in data/readings.json:

    /another-day-sober/MM-DD/<slug>/index.html

Also regenerates:
    /another-day-sober/index.html   (a plain archive list of every reading)
    /sitemap.xml                    (all reading URLs + homepage)

...injects the reading calendar into another-day-sober.html, between the
CALENDAR:START / CALENDAR:END markers that file carries, and bakes today's
reading into the TODAY card on the home page.

Run manually with:  python3 scripts/build_pages.py
Runs automatically in .github/workflows/deploy.yml on every push to main,
with ADS_OUT_ROOT pointed at the throwaway _site folder.

WHY THESE PAGES EXIST AT ALL, since it is easy to forget and then "simplify"
it away: another-day-sober.html paints its reading with JavaScript after the
page has loaded. A crawler does not wait for that, so to Google that screen
is nineteen words and an empty box -- which is why Search Console was calling
the site's pages soft 404s. These 365 pages carry the same readings with the
words already IN the HTML. That is the whole point, and it is why the
template below must never be "improved" into fetching its own content.
"""
import json, re, os, html, datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
READINGS_PATH = os.path.join(ROOT, 'data', 'readings.json')
# OUT_ROOT is where the whole rendered site gets written. Defaults to ROOT
# for local preview (generates alongside your source files, gitignored).
# The deploy workflow overrides this to a throwaway build directory so
# nothing generated ever gets committed.
OUT_ROOT = os.environ.get('ADS_OUT_ROOT', ROOT)
OUT_DIR = os.path.join(OUT_ROOT, 'another-day-sober')
SITE_URL = 'https://recoverymisfits.org'

MONTH_NAMES = ['January','February','March','April','May','June',
               'July','August','September','October','November','December']

# THE SAME LEADING-DATE RULE assets/daily-reading.js USES, character for
# character. It has to be: that file builds the share link by slugifying the
# title in the browser, and this file builds the folder that link has to land
# in. When the two disagreed, the two days whose titles say "Dec 24" and
# "Dec 25" instead of "December 24" got a share link that 404'd -- the browser
# stripped the abbreviation and made "long-day", this script kept it and made
# "dec-24-long-day". Three letters of a month, an optional rest of the word,
# an optional dot, an optional year, then the dash.
MONTHS3 = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec']
LEADING_DATE_RE = re.compile(
    r'^(' + '|'.join(MONTHS3) + r')[a-z]*\.?\s+\d{1,2}(?:,?\s*\d{4})?\s*[-–—]\s*',
    re.IGNORECASE
)

DAYS_IN_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]


def slugify(title):
    # strip a leading "Month Day - " prefix so the slug isn't redundant
    # with the /MM-DD/ path segment it'll sit under
    stripped = LEADING_DATE_RE.sub('', title).strip()
    if not stripped:
        stripped = title
    s = stripped.lower()
    s = re.sub(r"[’'\"]", '', s)
    s = re.sub(r'[^a-z0-9]+', '-', s)
    s = re.sub(r'-+', '-', s).strip('-')
    return s or 'reading'


def headline(title):
    """The title with its own date prefix taken off."""
    return LEADING_DATE_RE.sub('', title).strip() or title


def dateline(title, label):
    """The words that go on the brush stroke above the headline.

    Normally it is the date the title already carries -- "September 15". Five
    of the readings do not carry one, and rather than leave the stroke empty
    the date is built from the MM-DD the reading is filed under, so all 365
    look the same."""
    m = LEADING_DATE_RE.match(title)
    if m:
        return re.sub(r'\s*[-–—]\s*$', '', m.group(0)).strip()
    mm, _, dd = label.partition('-')
    try:
        return '%s %d' % (MONTH_NAMES[int(mm) - 1], int(dd))
    except (ValueError, IndexError):
        return ''


def meta_description(body):
    text = re.sub(r'\s+', ' ', body).strip()
    if len(text) > 155:
        text = text[:152].rsplit(' ', 1)[0] + '...'
    return text


def body_html(body, indent='    '):
    paragraphs = body.split('\n\n')
    return '\n'.join(
        '%s<p>%s</p>' % (indent, html.escape(p.strip()).replace('\n', '<br>'))
        for p in paragraphs if p.strip()
    )


# ===========================================================================
# THE CALENDAR
#
# Every day cell is a REAL <a href>, written into the HTML here rather than
# drawn by JavaScript in the browser. That is the only reason the calendar is
# generated at all: a picker built in JS is invisible to a crawler, and these
# 365 pages had already spent months in Search Console as "Discovered --
# currently not indexed" precisely because nothing linked to them.
#
# All twelve months are in the markup at once and CSS shows one at a time, so
# every reading is one real link away from every other. It gzips to almost
# nothing -- the same forty characters over and over.
#
# NO WEEKDAY PADDING IS WRITTEN HERE, on purpose. These readings are
# perpetual: "September 15" is not tied to a year, so there is no correct
# weekday to bake in. The browser pads the grid for the year it is actually
# being read in; with JavaScript off it stays a tidy seven-wide run of dates,
# which is all a crawler needs anyway.
# ===========================================================================

CAL_DOW = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']


def calendar_html(readings):
    months = []
    for mi in range(12):
        mm = '%02d' % (mi + 1)
        cells = []
        for day in range(1, DAYS_IN_MONTH[mi] + 1):
            label = '%s-%02d' % (mm, day)
            entry = readings.get(label)
            if not entry:
                # A date with no reading filed under it is still drawn, so the
                # month keeps its shape -- it just is not a link.
                cells.append('        <span class="cal-day is-empty" aria-hidden="true">%d</span>' % day)
                continue
            title = headline(str(entry.get('title', '')).strip())
            href = '/another-day-sober/%s/%s/' % (label, slugify(str(entry.get('title', ''))))
            cells.append(
                '        <a class="cal-day" href="%s" data-day="%d" title="%s">%d</a>'
                % (href, day, html.escape(title, quote=True), day)
            )
        months.append(
            '      <div class="cal-grid" data-month="%d"%s role="grid">\n%s\n      </div>'
            % (mi + 1, '' if mi == 0 else ' hidden', '\n'.join(cells))
        )

    dow = ''.join('<span>%s</span>' % d for d in CAL_DOW)
    return """    <nav class="cal" id="cal" aria-label="Every reading, by date">
      <div class="cal-head">
        <button class="cal-arrow" id="calPrev" type="button" aria-label="Previous month">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
        <h2 class="cal-month" id="calMonth">January</h2>
        <button class="cal-arrow" id="calNext" type="button" aria-label="Next month">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
      </div>
      <div class="cal-dow" aria-hidden="true">%s</div>
%s
    </nav>""" % (dow, '\n'.join(months))


CAL_START = '<!-- CALENDAR:START -->'
CAL_END = '<!-- CALENDAR:END -->'


def inject_calendar(path, cal):
    """Drop the generated calendar between the markers in a hand-written page.

    Only ever run against the BUILD copy. When OUT_ROOT is ROOT -- somebody
    running this locally to preview -- the source file is left alone, because
    writing 365 generated links into a file that is under version control is
    how generated output ends up committed."""
    if not os.path.exists(path):
        print('  ! %s not found; calendar not injected' % os.path.basename(path))
        return False
    with open(path, encoding='utf-8') as f:
        page = f.read()
    if CAL_START not in page or CAL_END not in page:
        print('  ! %s has no CALENDAR markers; calendar not injected'
              % os.path.basename(path))
        return False
    head, _, rest = page.partition(CAL_START)
    _, _, tail = rest.partition(CAL_END)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(head + CAL_START + '\n' + cal + '\n    ' + CAL_END + tail)
    return True


PAGE_TEMPLATE = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{title} | Another Day Sober | Recovery Misfits</title>
<meta name="description" content="{description}">
<link rel="canonical" href="{canonical}">
<meta name="theme-color" content="#0e0e0d">
<meta property="og:type" content="article">
<meta property="og:site_name" content="Recovery Misfits">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{description}">
<meta property="og:url" content="{canonical}">
<meta name="twitter:card" content="summary">
<link rel="icon" href="/icon-192.png">
<link rel="apple-touch-icon" href="/icon-192.png">

<!-- PAINT SOMETHING IMMEDIATELY, same as the app screen: an external
     stylesheet blocks the first paint, and a white flash on the way into a
     dark page is the cheapest thing on the site to get rid of. -->
<style>html{{background:#0e0e0d}}body{{background:#0e0e0d;color:#eee6d5;margin:0}}</style>
<link rel="stylesheet" href="/assets/daily-reading.css">
</head>

<!-- data-prerendered is the one that matters: it tells daily-reading.js the
     reading is ALREADY on the page and it must not fetch or repaint it.
     data-rm-nav lights the Home tab, the same as the app screen. -->
<body data-rm-nav="index.html" data-reading="{label}" data-prerendered>

<div id="rm-topbar"></div>
<script src="/topbar.js" defer></script>

<div class="sheet">
<img class="tape tl" src="/assets/pages/d-tape-tl.webp" alt="" aria-hidden="true">
<img class="tape tr" src="/assets/pages/d-tape-tr.webp" alt="" aria-hidden="true">
<img class="tape bl" src="/assets/pages/d-tape-bl.webp" alt="" aria-hidden="true">
<img class="tape br" src="/assets/pages/d-tape-br.webp" alt="" aria-hidden="true">

<main>

  <header class="pub">
    <img class="art" src="/assets/pages/d-book.webp" alt="" aria-hidden="true" width="122" height="111">
    <div>
      <p class="name">Another Day Sober</p>
      <p class="tag">one day at a time</p>
      <img class="rule" src="/assets/pages/d-rule.webp" alt="" aria-hidden="true" width="297" height="17">
    </div>
  </header>

  <div class="controls">
    <button class="ctl" id="smaller" type="button" aria-label="Make the text smaller">A&minus;</button>
    <button class="ctl" id="bigger"  type="button" aria-label="Make the text bigger">A+</button>
    <button class="ctl" id="speak"   type="button" aria-pressed="false" aria-label="Read this aloud">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4zm12.5 3a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4zM14 2.2v2.1a7.8 7.8 0 0 1 0 15.4v2.1a9.9 9.9 0 0 0 0-19.6z"/></svg>
    </button>
  </div>

  <p class="dateline" id="dateline"{dateline_hidden}>
    <img src="/assets/pages/d-swash.webp" alt="" aria-hidden="true">
    <span id="dateText">{dateline}</span>
  </p>

  <!-- THE READING'S OWN NAME IS THE h1 ON THIS PAGE, not the publication's.
       On the app screen the masthead is the h1, because that screen is the
       publication. This page is one reading, and a search result for it
       should be headed by the reading. -->
  <h1 class="title" id="title">{title}</h1>
  <img class="titlerule" src="/assets/pages/d-titlerule.webp" alt="" aria-hidden="true" width="471" height="20">

  <article class="reading" id="reading">
{body}
  </article>

  <div class="foot">
    <img class="rule" src="/assets/pages/d-sharerule.webp" alt="" aria-hidden="true" width="676" height="8">
    <button class="share" id="share" type="button">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 16V3m0 0L8 7m4-4 4 4M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" stroke-linecap="round" stroke-linejoin="round"/></svg>
      Share this reading
    </button>
    <p class="say" id="say" role="status" aria-live="polite"></p>
    <a class="back" href="/">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" stroke-linecap="round" stroke-linejoin="round"/></svg>
      Back to Readings
    </a>
  </div>

{calendar}

</main>
</div>

<div class="tailroom"></div>

<div id="rm-bottom-nav"></div>
<script src="/nav.js" defer></script>
<script src="/assets/daily-reading.js" defer></script>

</body>
</html>
"""

INDEX_TEMPLATE = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>All Readings | Another Day Sober | Recovery Misfits</title>
<meta name="description" content="Every Another Day Sober daily recovery reading, browsable by date.">
<link rel="canonical" href="{site}/another-day-sober/">
<meta name="theme-color" content="#0e0e0d">
<link rel="icon" href="/icon-192.png">
<style>html{{background:#0e0e0d}}body{{background:#0e0e0d;color:#eee6d5;margin:0}}</style>
<link rel="stylesheet" href="/assets/daily-reading.css">
<style>
  .wrap{{max-width:620px;margin:0 auto;padding:22px 20px 0;position:relative;z-index:1}}
  .wrap h1{{font-family:var(--display);font-weight:600;font-size:28px;line-height:1.06;
           color:#fff;margin:0 0 3px}}
  .wrap .sub{{font-family:var(--ui);font-weight:800;font-size:10px;letter-spacing:1.9px;
             text-transform:uppercase;color:var(--gold);margin:0 0 18px}}
  .wrap ul{{list-style:none;padding:0;margin:0}}
  .wrap li{{border-bottom:1px solid rgba(238,230,213,.1)}}
  .wrap li a{{display:flex;gap:12px;align-items:baseline;min-height:44px;padding:11px 2px;
             color:var(--ivory);text-decoration:none;font-family:var(--ui);
             font-weight:600;font-size:14px;line-height:1.3}}
  .wrap li a:active{{background:rgba(238,230,213,.06)}}
  .wrap li .d{{flex:0 0 auto;color:var(--gold);font-size:11px;font-weight:800;
              letter-spacing:.9px;font-variant-numeric:tabular-nums}}
</style>
</head>
<body data-rm-nav="index.html">
  <div id="rm-topbar"></div>
  <script src="/topbar.js" defer></script>
  <div class="wrap">
    <h1>Another Day Sober</h1>
    <p class="sub">All {count} readings</p>
    <ul>
{items}
    </ul>
    <a class="back" href="/" style="margin:22px auto 0">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" stroke-linecap="round" stroke-linejoin="round"/></svg>
      Back to Readings
    </a>
  </div>
  <div class="tailroom"></div>
  <div id="rm-bottom-nav"></div>
  <script src="/nav.js" defer></script>
</body>
</html>
"""


MOVED_MAP_PATH = os.path.join(ROOT, 'data', 'blogspot-map.json')

MOVED_JS = """/* GENERATED BY scripts/build_pages.py -- DO NOT EDIT BY HAND.

   This file is loaded by the old Blogger theme at recoverymisfits.blogspot.com
   and does two things on every old post:

     1. rewrites that post's rel=canonical to point at the same reading here,
        so the ranking the blogspot built over the years moves to this site
        instead of competing with it. For years both sites carried the same
        365 readings word for word, and Google kept picking the older one.

     2. tells the reader, in plain words, that the reading moved -- with a
        link to the same reading, not a generic homepage.

   It deliberately does NOT redirect. Anyone who lands on an old link gets to
   see where they are and choose.

   The map is data/blogspot-map.json: Blogger's slug -> "MM-DD/our-slug".
   Blogger's slugs do not match ours (it drops small words, and a handful of
   posts have slugs like "417-bro" and "lack-of-power" with no date in them
   at all), so the pairing was worked out once and written down rather than
   guessed at runtime. Four old posts are retired duplicates with no twin
   here; those fall through to the archive. */
(function () {
  var MAP = %(map)s;
  var SITE = "%(site)s";
  var ARCHIVE = SITE + "/another-day-sober/";

  var m = location.pathname.match(/\/([^\/]+)\.html$/);
  var slug = m ? m[1] : null;
  var target, isReading = false;
  if (slug && MAP[slug]) { target = SITE + "/another-day-sober/" + MAP[slug] + "/"; isReading = true; }
  else if (slug)         { target = ARCHIVE; }
  else                   { target = SITE + "/"; }

  /* BLOGGER WRITES ITS OWN CANONICAL AFTER THIS FILE RUNS.

     This sits at the top of <head>, above Blogger's all-head-content. On the
     first pass there is nothing to rewrite, so we add ours -- and a moment
     later Blogger adds a second one pointing back at itself. Two canonicals
     that disagree and Google throws BOTH away, which would have made this
     entire file do nothing at all while looking like it worked.

     So: set it once now, because early is better, and again once the head
     has finished parsing, keeping one and dropping the rest. */
  function setCanonical() {
    var links = document.querySelectorAll('link[rel="canonical"]');
    var keep = links[0] || null;
    for (var i = 1; i < links.length; i++) {
      if (links[i].parentNode) links[i].parentNode.removeChild(links[i]);
    }
    if (!keep) {
      keep = document.createElement("link");
      keep.setAttribute("rel", "canonical");
      (document.head || document.documentElement).appendChild(keep);
    }
    keep.setAttribute("href", target);
  }
  setCanonical();

  function banner() {
    if (document.getElementById("rm-moved")) return;
    var box = document.createElement("div");
    box.id = "rm-moved";
    box.setAttribute("role", "note");
    box.style.cssText = "position:relative;z-index:9999;margin:0;padding:18px 16px;" +
      "background:#0e0e0d;color:#eee6d5;text-align:center;font:16px/1.5 " +
      "system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;" +
      "border-bottom:3px solid #d7b253";
    var what = isReading ? "This reading has a new home." : "Recovery Misfits has moved.";
    var cta  = isReading ? "Read it on RecoveryMisfits.org" : "Go to RecoveryMisfits.org";
    box.innerHTML =
      '<strong style="display:block;font-size:19px;margin-bottom:4px">' + what + '</strong>' +
      '<span style="display:block;margin-bottom:12px;color:#aaa497">' +
        'Another Day Sober now lives at recoverymisfits.org &mdash; all 365 readings, ' +
        'a sober date counter, and the speaker tapes.</span>' +
      '<a href="' + target + '" style="display:inline-block;padding:11px 20px;' +
        'border:1px solid #d7b253;border-radius:999px;color:#d7b253;' +
        'text-decoration:none;font-weight:700">' + cta + '</a>';
    var b = document.body;
    if (b) b.insertBefore(box, b.firstChild);
  }

  function ready() { setCanonical(); banner(); }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", ready);
  } else {
    ready();
  }
  /* One last sweep after everything, in case a widget adds its own. */
  window.addEventListener("load", setCanonical);
})();
"""


def write_moved_js(out_root):
    """The script the old Blogger theme loads. One line in the theme, the whole
    map over here, so fixing a pairing never means editing Blogger again."""
    if not os.path.exists(MOVED_MAP_PATH):
        print('  ! data/blogspot-map.json missing; blogspot-moved.js not written')
        return False
    with open(MOVED_MAP_PATH, encoding='utf-8') as f:
        mapping = json.load(f)
    js = MOVED_JS % {
        'map': json.dumps({k: v for k, v in mapping.items() if v}, separators=(',', ':')),
        'site': SITE_URL,
    }
    with open(os.path.join(out_root, 'blogspot-moved.js'), 'w', encoding='utf-8') as f:
        f.write(js)
    print('blogspot-moved.js written (%d old posts mapped).'
          % sum(1 for v in mapping.values() if v))
    return True


def excerpt(body):
    """The reading's own first sentence, cut at a word if it runs long.

    Same rule, same length, as the script at the bottom of index.html that
    fills this card in the browser -- so the baked copy and the fetched copy
    are the same words and the card never appears to change under somebody
    the moment their signal comes back.

    NO LOOKBEHIND in the regex, for the same reason the browser copy has
    none: Safari could not parse one until 16.4 and it is a syntax error, not
    a runtime one. Python does not care, but the two have to stay identical
    or this note stops being true."""
    body = str(body).strip()
    m = re.match(r'[\s\S]*?[.!?](?=\s|$)', body)
    first = (m.group(0) if m else body).strip()
    if len(first) > 96:
        first = re.sub(r'\s+\S*$', '', first[:93]) + '\u2026'
    return first


def bake_homepage(out_root, readings):
    """Put today's real reading on the front page's TODAY card.

    The home page is the Readings screen, and the card at the top of it is
    filled in by a fetch in the browser. A crawler does not wait for that, and
    neither does a phone with no signal: both of them got the words "Opening
    today's reading..." on the one page the whole site points at.

    So the build writes that day's heading, date and opening sentence straight
    into the file, and stamps the section with data-for. The workflow runs once
    a morning, so the baked copy is at most a few hours behind; the inline
    guard in index.html throws it out the moment the reader's own date
    disagrees, and the fetch puts the right one up as it always did. Nobody
    sees the wrong day. A crawler sees a page with a reading on it.

    THE FULL TEXT IS NOT BAKED IN HERE ON PURPOSE. This is a card that opens
    the reading, not the reading. The words themselves live on
    another-day-sober.html and on the 366 generated pages, each of which is
    canonical to itself -- baking the whole reading onto the front page as
    well would put the same text at two URLs every single day.
    """
    path = os.path.join(out_root, 'index.html')
    if not os.path.exists(path):
        print('  ! index.html not found; homepage not baked')
        return False

    today = datetime.datetime.utcnow().strftime('%m-%d')
    r = readings.get(today)
    if r is None:                      # Feb 29 in a year without one
        return False

    raw = str(r.get('title', '')).strip()
    body = str(r.get('body', ''))
    title = headline(raw)
    desc = meta_description(body)
    first = excerpt(body)

    mi, dd = int(today[:2]), int(today[3:])
    datetext = '%s %d' % (MONTH_NAMES[mi - 1], dd)

    with open(path, encoding='utf-8') as f:
        page = f.read()

    def sub(pattern, repl, why):
        # re.S because some of these span lines
        new, n = re.subn(pattern, lambda m: repl, page, count=1, flags=re.S)
        if not n:
            print('  ! homepage: could not set %s' % why)
        return new

    page = sub(r'<title>.*?</title>',
               '<title>%s &mdash; Another Day Sober | Recovery Misfits</title>'
               % html.escape(title), 'title')
    page = sub(r'<meta name="description" content="[^"]*">',
               '<meta name="description" content="%s">' % html.escape(desc, quote=True),
               'description')
    page = sub(r'<meta property="og:title" content="[^"]*">',
               '<meta property="og:title" content="%s &mdash; Another Day Sober">'
               % html.escape(title, quote=True), 'og:title')
    page = sub(r'<meta property="og:description" content="[^"]*">',
               '<meta property="og:description" content="%s">'
               % html.escape(desc, quote=True), 'og:description')

    page = sub(r'<section class="today" data-for="[^"]*">',
               '<section class="today" data-for="%s">' % today, 'today stamp')
    page = sub(r'<h2 class="k" id="todayTitle">.*?</h2>',
               '<h2 class="k" id="todayTitle">%s</h2>' % html.escape(title),
               'today heading')
    page = sub(r'<p class="date" id="todayDate">.*?</p>',
               '<p class="date" id="todayDate">%s</p>' % html.escape(datetext),
               'today date')
    page = sub(r'<p class="quote" id="todayQuote">.*?</p>',
               '<p class="quote" id="todayQuote">%s</p>' % html.escape(first),
               'today excerpt')

    """A CANONICAL THAT POINTS AT THE READING'S OWN PAGE WOULD BE WRONG.
       The homepage is a different thing that happens to quote the same words
       today -- tomorrow it quotes other words. It stays canonical to itself
       and the reading page stays canonical to itself."""

    with open(path, 'w', encoding='utf-8') as f:
        f.write(page)
    print('Homepage TODAY card baked with %s (%s).' % (today, title))
    return True


# ===========================================================================
# MEME OF THE DAY -- ONE PAGE PER DAY, EACH WITH ITS OWN LINK PREVIEW
#
#     /meme/MM-DD/index.html
#
# WHY. Somebody shares a meme link on Facebook or in a text. For that link to
# show up as the meme -- and not as a gray bar with a web address on it --
# the page it points at has to carry that meme in its og:image, written into
# the HTML, because Facebook's previewer does not run JavaScript. And for the
# friend who taps it to see the meme they were sent, not today's, the page
# has to know which day it is. So: one copy of meme.html per day, with the
# day and the preview baked in. Same trick as the reading pages above.
#
# THE PREVIEW PICTURE IS A 1200x630 CARD, not the meme. Facebook draws link
# previews wide and crops a square picture to fit -- which on a meme takes
# off the top line and the punchline. The card puts the whole square in the
# middle of a dark wide frame so nothing gets cut. The cards are made by
# scripts/make_meme_thumbs.py and committed, same as the thumbnails.
#
# THESE ARE NOT IN THE SITEMAP on purpose. A page that is one picture and no
# words is exactly what Search Console calls a soft 404, and that fight has
# already been had once on this site.
# ===========================================================================

MEMES_PATH = os.path.join(ROOT, 'data', 'memes.json')
OG_W, OG_H = 1200, 630


def meme_card(src, dst):
    """The wide link-preview card: the whole meme, centered on the app's black,
    with the same gold hairline the app puts around it."""
    from PIL import Image, ImageDraw
    im = Image.open(src).convert('RGB')
    side = OG_H - 40                          # 20px of black above and below
    im = im.resize((side, side), Image.LANCZOS)
    card = Image.new('RGB', (OG_W, OG_H), (14, 14, 13))
    x, y = (OG_W - side) // 2, 20
    card.paste(im, (x, y))
    d = ImageDraw.Draw(card)
    d.rectangle([x - 2, y - 2, x + side + 1, y + side + 1], outline=(150, 126, 64), width=2)
    card.save(dst, 'JPEG', quality=86, optimize=True, progressive=True)


def build_memes(out_root):
    src_page = os.path.join(out_root, 'meme.html')
    if not os.path.exists(MEMES_PATH) or not os.path.exists(src_page):
        print('  ! memes.json or meme.html missing; meme pages not built')
        return 0
    with open(MEMES_PATH, encoding='utf-8') as f:
        dates = json.load(f).get('dates', {})
    with open(src_page, encoding='utf-8') as f:
        template = f.read()

    # One card per meme FILE, not per date -- the same meme sits on several
    # dates until there are 366 of them.
    #
    # THE CARDS ARE COMMITTED, made by scripts/make_meme_thumbs.py alongside
    # the thumbnails -- so the deploy does not need Pillow. A meme added
    # without re-running that script gets its card drawn here if Pillow
    # happens to be around, and otherwise falls back to the square meme.
    og_dir = os.path.join(out_root, 'assets', 'memes', 'og')
    cards, drawn, missing = {}, 0, 0
    for name in sorted(set(dates.values())):
        dst = os.path.join(og_dir, name)
        if not os.path.exists(dst):
            src = os.path.join(ROOT, 'assets', 'memes', name)
            try:
                os.makedirs(og_dir, exist_ok=True)
                meme_card(src, dst)
                drawn += 1
            except Exception:
                missing += 1
                continue
        cards[name] = ('/assets/memes/og/%s' % name, OG_W, OG_H)
    print('Meme preview cards: %d ready (%d drawn at build).' % (len(cards), drawn))
    if missing:
        print('  ! %d memes have no preview card -- run scripts/make_meme_thumbs.py' % missing)

    def preview(name):
        return cards.get(name) or ('/assets/memes/%s' % name, 1080, 1080)

    def bake(page, day, name, url):
        img, w, h = preview(name)
        label = '%s %d' % (MONTH_NAMES[int(day[:2]) - 1], int(day[3:]))
        title = 'Recovery Meme of the Day — %s' % label
        swaps = [
            (r'<title>.*?</title>',
             '<title>%s | Recovery Misfits</title>' % html.escape(title)),
            (r'<link rel="canonical" href="[^"]*">',
             '<link rel="canonical" href="%s">' % url),
            (r'<meta property="og:title" content="[^"]*">',
             '<meta property="og:title" content="%s">' % html.escape(title, quote=True)),
            (r'<meta property="og:url" content="[^"]*">',
             '<meta property="og:url" content="%s">' % url),
            (r'<meta property="og:image" content="[^"]*">',
             '<meta property="og:image" content="%s%s">\n'
             '<meta property="og:image:width" content="%d">\n'
             '<meta property="og:image:height" content="%d">' % (SITE_URL, img, w, h)),
            (r'<meta property="og:image:alt" content="[^"]*">',
             '<meta property="og:image:alt" content="%s">'
             % html.escape('Recovery Misfits meme for ' + label, quote=True)),
        ]
        for pat, repl in swaps:
            page, n = re.subn(pat, lambda m: repl, page, count=1, flags=re.S)
            if not n:
                print('  ! meme page %s: could not set %s' % (day, pat[:30]))
        return page

    count = 0
    for day, name in sorted(dates.items()):
        if not re.match(r'^\d\d-\d\d$', day):
            continue
        url = '%s/meme/%s/' % (SITE_URL, day)
        page = bake(template, day, name, url)
        page = page.replace('data-meme-day=""', 'data-meme-day="%s"' % day, 1)
        d = os.path.join(out_root, 'meme', day)
        os.makedirs(d, exist_ok=True)
        with open(os.path.join(d, 'index.html'), 'w', encoding='utf-8') as f:
            f.write(page)
        count += 1

    # /meme.html ITSELF gets today's preview, so the plain link shows a
    # picture too. The workflow runs every morning, so this is at most a few
    # hours behind; its canonical stays /meme.html because it is "today's",
    # not any one day's.
    today = datetime.datetime.utcnow().strftime('%m-%d')
    if today in dates:
        page = bake(template, today, dates[today], '%s/meme.html' % SITE_URL)
        page = re.sub(r'<title>.*?</title>',
                      '<title>Meme of the Day — Recovery Misfits</title>', page, count=1)
        page = re.sub(r'<meta property="og:title" content="[^"]*">',
                      '<meta property="og:title" content="Recovery Meme of the Day — Recovery Misfits">',
                      page, count=1)
        with open(src_page, 'w', encoding='utf-8') as f:
            f.write(page)

    print('Generated %d meme pages under /meme/.' % count)
    return count


def main():
    with open(READINGS_PATH, encoding='utf-8') as f:
        readings = json.load(f)

    os.makedirs(OUT_DIR, exist_ok=True)
    urls = ['%s/' % SITE_URL]
    index_items = []
    cal = calendar_html(readings)

    for label in sorted(readings.keys()):
        r = readings[label]
        raw = str(r.get('title', '')).strip()
        body = str(r.get('body', ''))
        title = headline(raw)
        slug = slugify(raw)
        line = dateline(raw, label)
        page_dir = os.path.join(OUT_DIR, label, slug)
        os.makedirs(page_dir, exist_ok=True)
        canonical = '%s/another-day-sober/%s/%s/' % (SITE_URL, label, slug)

        html_out = PAGE_TEMPLATE.format(
            title=html.escape(title),
            description=html.escape(meta_description(body)),
            canonical=canonical,
            label=label,
            dateline=html.escape(line),
            dateline_hidden='' if line else ' hidden',
            body=body_html(body),
            calendar=cal,
        )
        with open(os.path.join(page_dir, 'index.html'), 'w', encoding='utf-8') as f:
            f.write(html_out)

        urls.append(canonical)
        index_items.append(
            '      <li><a href="/another-day-sober/%s/%s/">'
            '<span class="d">%s</span><span>%s</span></a></li>'
            % (label, slug, label, html.escape(title))
        )

    with open(os.path.join(OUT_DIR, 'index.html'), 'w', encoding='utf-8') as f:
        f.write(INDEX_TEMPLATE.format(
            site=SITE_URL, items='\n'.join(index_items), count=len(readings)))
    urls.append('%s/another-day-sober/' % SITE_URL)

    # THE LANDING PAGE THE QR CODES POINT AT. It is the only page on the site
    # outside these readings whose words are actually in the HTML rather than
    # painted in by JavaScript afterwards, so it is the only other one worth
    # a crawler's time -- and nothing on the site links to it, which is how
    # the readings ended up as orphans in the first place.
    urls.append('%s/app/' % SITE_URL)

    # lastmod on every entry. The readings themselves are perpetual, but the
    # site is rebuilt each morning and a sitemap with no dates gives a crawler
    # no reason to come back and look.
    stamp = datetime.date.today().isoformat()
    sitemap = ['<?xml version="1.0" encoding="UTF-8"?>',
               '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for u in urls:
        sitemap.append('  <url><loc>%s</loc><lastmod>%s</lastmod></url>' % (u, stamp))
    sitemap.append('</urlset>')
    with open(os.path.join(OUT_ROOT, 'sitemap.xml'), 'w', encoding='utf-8') as f:
        f.write('\n'.join(sitemap))

    if os.path.abspath(OUT_ROOT) == os.path.abspath(ROOT):
        print('Local preview: leaving another-day-sober.html alone '
              '(the calendar is injected into the build copy only).')
    else:
        if inject_calendar(os.path.join(OUT_ROOT, 'another-day-sober.html'), cal):
            print('Calendar injected into another-day-sober.html.')
        # NO CALENDAR ON THE FRONT PAGE. It used to get one, back when the
        # front page was the reading itself and already loaded
        # daily-reading.css and daily-reading.js -- which is where the
        # calendar's 90 lines of CSS and 110 of behavior live. The Readings
        # screen loads neither, and copying both into it is how two versions
        # of the same thing start drifting apart. The front page links to
        # /another-day-sober/ instead, which lists all 365 as real links, so a
        # crawler is still one hop from every reading.
        bake_homepage(OUT_ROOT, readings)
        write_moved_js(OUT_ROOT)
        build_memes(OUT_ROOT)

    print('Generated %d reading pages, an archive index, and sitemap.xml with %d URLs.'
          % (len(readings), len(urls)))


if __name__ == '__main__':
    main()
