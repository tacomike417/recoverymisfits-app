#!/usr/bin/env python3
"""
Generates static, crawlable pages for every reading in data/readings.json:

    /another-day-sober/MM-DD/<slug>/index.html

Also regenerates:
    /another-day-sober/index.html   (archive/index of every reading)
    /sitemap.xml                    (all reading URLs + homepage)

Run manually with:  python3 scripts/build_pages.py
Also runs automatically via .github/workflows/build-readings.yml on every
push to main that touches data/readings.json (i.e. every admin panel save).
"""
import json, re, os, html
from datetime import datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
READINGS_PATH = os.path.join(ROOT, 'data', 'readings.json')
# OUT_ROOT is where the whole rendered site gets written. Defaults to ROOT
# for local preview (generates alongside your source files, gitignored).
# The deploy workflow overrides this to a throwaway build directory so
# nothing generated ever gets committed.
OUT_ROOT = os.environ.get('ADS_OUT_ROOT', ROOT)
OUT_DIR = os.path.join(OUT_ROOT, 'another-day-sober')
SITE_URL = 'https://recoverymisfits.org'

MONTHS = ['january','february','march','april','may','june','july',
          'august','september','october','november','december']
LEADING_DATE_RE = re.compile(
    r'^(' + '|'.join(MONTHS) + r')\s+\d{1,2}\s*[-–—]\s*',
    re.IGNORECASE
)

def slugify(title):
    # strip a leading "Month Day – " prefix so the slug isn't redundant
    # with the /MM-DD/ path segment it'll sit under
    stripped = LEADING_DATE_RE.sub('', title).strip()
    if not stripped:
        stripped = title
    s = stripped.lower()
    s = re.sub(r"[’'\"]", '', s)
    s = re.sub(r'[^a-z0-9]+', '-', s)
    s = re.sub(r'-+', '-', s).strip('-')
    return s or 'reading'

def meta_description(body):
    text = re.sub(r'\s+', ' ', body).strip()
    if len(text) > 155:
        text = text[:152].rsplit(' ', 1)[0] + '...'
    return text

def body_html(body):
    paragraphs = body.split('\n\n')
    return '\n'.join(
        f'<p>{html.escape(p).replace(chr(10), "<br>")}</p>' for p in paragraphs if p.strip()
    )

PAGE_TEMPLATE = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title} | Another Day Sober | Recovery Misfits</title>
<meta name="description" content="{description}">
<link rel="canonical" href="{canonical}">
<meta property="og:type" content="article">
<meta property="og:title" content="{title} | Another Day Sober">
<meta property="og:description" content="{description}">
<meta property="og:url" content="{canonical}">
<meta name="theme-color" content="#000000">
<link rel="manifest" href="/manifest.json">
<link rel="icon" href="/icon-192.png">
<link rel="stylesheet" href="/assets/reading-widget.css">
<style>
  body{{margin:0;font-family:Roboto,Arial,sans-serif;background:#fff;padding-bottom:120px;}}
  .frameWrap{{width:100%;padding:16px;box-sizing:border-box;background:#fff;}}
  .adsp-nav{{max-width:560px;margin:0 auto 10px;font-size:13px;}}
  .adsp-nav a{{color:#8a2b2b;text-decoration:none;font-weight:700;}}
  .adsp-nav a:hover{{text-decoration:underline;}}
</style>
</head>
<body>
  <div id="rm-topbar"></div>
  <script src="/topbar.js" defer></script>

  <div class="frameWrap">
    <div class="adsp-nav"><a href="/another-day-sober/">&larr; All readings</a></div>
    <div id="dp-card" class="dp-card">
      <div class="dp-header" id="dp-header">
        <div class="dp-brandblock">
          <div class="dp-brandtitle">\U0001F4D6 Another Day Sober</div>
          <div class="dp-subtitle">one day at a time</div>
          <div class="dp-divider"></div>
        </div>
        <div class="dp-texttab" id="dp-textsize">
          <button class="dp-tabbtn" id="dp-text-smaller" type="button" aria-label="Make text smaller">A&minus;</button>
          <button class="dp-tabbtn" id="dp-text-bigger" type="button" aria-label="Make text bigger">A+</button>
          <button class="dp-tabbtn dp-tabbtn-secondary" id="dp-text-reset" type="button" aria-label="Reset text size">&#8634;</button>
        </div>
        <div class="dp-title" id="dp-title">{title}</div>
      </div>
      <div class="dp-readingwrap">
        <div class="dp-content" id="dp-content">
{body}
        </div>
      </div>
      <div class="dp-pass" id="dp-pass">
        <div class="dp-pass-label">PASS IT ON</div>
        <div class="dp-actions" id="dp-actions">
          <a class="dp-btn" id="dp-fb" href="https://www.facebook.com/sharer/sharer.php?u={canonical_enc}" target="_blank" rel="noopener">Facebook</a>
          <button class="dp-btn" id="dp-sms" type="button">Text</button>
          <button class="dp-btn dp-btn-secondary" id="dp-copy" type="button">Copy link</button>
          <button class="dp-btn dp-btn-ig" id="dp-image" type="button">Share image</button>
          <span class="dp-copied" id="dp-copied" style="display:none;"></span>
        </div>
      </div>
    </div>
  </div>

  <div id="rm-bottom-nav"></div>
  <script src="/nav.js" defer></script>
  <script>
    window.__ADS_STATIC_PAGE__ = {{
      title: {title_json},
      url: {canonical_json},
      label: {label_json}
    }};
  </script>
  <script src="/assets/reading-page.js" defer></script>
</body>
</html>
"""

INDEX_TEMPLATE = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>All Readings | Another Day Sober | Recovery Misfits</title>
<meta name="description" content="Every Another Day Sober daily recovery reading, browsable by date.">
<link rel="canonical" href="{site}/another-day-sober/">
<link rel="stylesheet" href="/assets/reading-widget.css">
<style>
  body{{margin:0;font-family:Roboto,Arial,sans-serif;background:#fff;padding-bottom:120px;}}
  .wrap{{max-width:680px;margin:0 auto;padding:20px 16px;}}
  h1{{font-family:'Cormorant Garamond',serif;font-style:italic;font-size:32px;margin:0 0 4px;}}
  .sub{{color:#666;font-size:13px;letter-spacing:.1em;text-transform:uppercase;margin-bottom:20px;}}
  ul{{list-style:none;padding:0;margin:0;}}
  li{{border-bottom:1px solid #eee;padding:12px 0;}}
  li a{{color:#1f1f1f;text-decoration:none;font-weight:700;font-size:15px;}}
  li a:hover{{text-decoration:underline;}}
  li .d{{color:#999;font-size:12px;margin-right:10px;font-weight:700;}}
</style>
</head>
<body>
  <div id="rm-topbar"></div>
  <script src="/topbar.js" defer></script>
  <div class="wrap">
    <h1>\U0001F4D6 Another Day Sober</h1>
    <div class="sub">All readings</div>
    <ul>
{items}
    </ul>
  </div>
  <div id="rm-bottom-nav"></div>
  <script src="/nav.js" defer></script>
</body>
</html>
"""

def main():
    with open(READINGS_PATH, encoding='utf-8') as f:
        readings = json.load(f)

    os.makedirs(OUT_DIR, exist_ok=True)
    urls = [f'{SITE_URL}/']
    index_items = []

    for label in sorted(readings.keys()):
        r = readings[label]
        title = r['title']
        body = r['body']
        slug = slugify(title)
        page_dir = os.path.join(OUT_DIR, label, slug)
        os.makedirs(page_dir, exist_ok=True)
        canonical = f'{SITE_URL}/another-day-sober/{label}/{slug}/'

        html_out = PAGE_TEMPLATE.format(
            title=html.escape(title),
            description=html.escape(meta_description(body)),
            canonical=canonical,
            canonical_enc=canonical.replace(':', '%3A').replace('/', '%2F'),
            canonical_json=json.dumps(canonical),
            title_json=json.dumps(title),
            label_json=json.dumps(label),
            body=body_html(body),
        )
        with open(os.path.join(page_dir, 'index.html'), 'w', encoding='utf-8') as f:
            f.write(html_out)

        urls.append(canonical)
        index_items.append(
            f'      <li><a href="/another-day-sober/{label}/{slug}/"><span class="d">{label}</span>{html.escape(title)}</a></li>'
        )

    with open(os.path.join(OUT_DIR, 'index.html'), 'w', encoding='utf-8') as f:
        f.write(INDEX_TEMPLATE.format(site=SITE_URL, items='\n'.join(index_items)))
    urls.append(f'{SITE_URL}/another-day-sober/')

    sitemap = ['<?xml version="1.0" encoding="UTF-8"?>',
               '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for u in urls:
        sitemap.append(f'  <url><loc>{u}</loc></url>')
    sitemap.append('</urlset>')
    with open(os.path.join(OUT_ROOT, 'sitemap.xml'), 'w', encoding='utf-8') as f:
        f.write('\n'.join(sitemap))

    print(f'Generated {len(readings)} reading pages, an archive index, and sitemap.xml with {len(urls)} URLs.')

if __name__ == '__main__':
    main()
