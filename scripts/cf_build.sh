#!/usr/bin/env bash
# CLOUDFLARE PAGES BUILD (1 Oct 2026, Mike: "the memes aren't working on the front page").
#
# The site moved from GitHub Pages to Cloudflare Pages, but Cloudflare was
# publishing the repo as-is. The GitHub workflow (deploy.yml) used to run
# build_pages.py on every push, and that script writes the files the site
# depends on but that are never committed:
#   /data/meme-days.json      which meme runs on which day (front page + Memes tab)
#   /meme/<id>/               one share page per meme
#   /another-day-sober/...    the 365 reading pages Google reads, + sitemap.xml
# With no build, all of those were missing.
#
# This does the same thing deploy.yml does, for Cloudflare.
# Cloudflare settings:  Build command  bash scripts/cf_build.sh
#                       Build output   _site
set -e
rm -rf _site
mkdir _site
# everything except git/CI internals and the source-only folders (same list as deploy.yml)
tar --exclude=./.git --exclude=./.github --exclude=./_site --exclude=./scripts -cf - . | tar -xf - -C _site
# Pillow is only needed if a meme was added without its share card; never fail the build over it
python3 -m pip install --quiet pillow >/dev/null 2>&1 || true
ADS_OUT_ROOT="$PWD/_site" python3 scripts/build_pages.py
# speaker tapes: allowed to fail quietly, exactly like deploy.yml
ADS_OUT_ROOT="$PWD/_site" python3 scripts/fetch_tapes.py || true
echo "Built into _site"
