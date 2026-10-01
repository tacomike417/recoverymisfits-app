#!/usr/bin/env python3
"""STAMP EVERY SCRIPT AND STYLESHEET WITH THIS DEPLOY'S VERSION (1 Oct 2026).

Phones hang on to .js and .css files for hours. Pages are always fresh, so a
change to nav.js (the bottom bar) could take hours to show up on somebody's
phone, and nobody is going to clear their cache. Mike: "corinna and konner are
never going to do that."

So every build rewrites the built pages so each local script/stylesheet link
carries this deploy's version:  <script src="/nav.js">  ->  <script src="/nav.js?v=ab12cd3">
A new deploy means a new address, and a phone has never seen that address, so
it fetches the new file the next time the page opens. Runs on the _site copy
only; nothing in the repo changes.
"""
import os, re, sys, time

root = sys.argv[1] if len(sys.argv) > 1 else '_site'
ver = (os.environ.get('CF_PAGES_COMMIT_SHA') or '')[:7] or time.strftime('%Y%m%d%H%M')
pat = re.compile(r'''(<(?:script|link)\b[^>]*?\b(?:src|href)=)(["'])((?!https?:|//|data:)[^"'?#]+\.(?:js|css))\2''', re.I)
n = files = 0
for d, _, fs in os.walk(root):
    for f in fs:
        if not f.endswith('.html'):
            continue
        p = os.path.join(d, f)
        with open(p, encoding='utf-8', errors='surrogateescape') as fh:
            s = fh.read()
        s2, k = pat.subn(lambda m: m.group(1) + m.group(2) + m.group(3) + '?v=' + ver + m.group(2), s)
        if k:
            with open(p, 'w', encoding='utf-8', errors='surrogateescape') as fh:
                fh.write(s2)
            n += k; files += 1
print('Stamped %d script/style links in %d pages with v=%s' % (n, files, ver))
