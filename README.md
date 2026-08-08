# Another Day Sober — self-hosted setup

## How this works now

`data/readings.json` and `scripts/build_pages.py` are the only source of truth.
Nothing generated ever gets committed to the repo. On every push to `main`
(including every save from the admin panel), `.github/workflows/deploy.yml`:

1. Copies your whole repo into a throwaway `_site/` folder
2. Runs `scripts/build_pages.py` against it, which generates one real static
   page per reading at `/another-day-sober/MM-DD/slug/`, an archive page at
   `/another-day-sober/`, and `/sitemap.xml`
3. Deploys `_site/` straight to GitHub Pages

If you ever want to change what a reading page looks like, edit the
`PAGE_TEMPLATE` string in `scripts/build_pages.py` and push — every one of
the 311 pages rebuilds and redeploys automatically. You never touch a
generated file by hand, and none of them live in your git history.

## 1. One-time repo setting change

Pages needs to be told to deploy from the Action instead of a branch:

**Repo → Settings → Pages → Build and deployment → Source → GitHub Actions**

(It's currently set to "Deploy from a branch" if you've been using the
plain GitHub Pages setup so far.)

## 2. Files to add to `tacomike417/recoverymisfits-app`

```
data/readings.json              <- 311 readings, keyed by MM-DD (source of truth)
data/drafts.json                <- 3 undated drafts to place later
admin/index.html                <- private editor
assets/reading-widget.css       <- shared card styling
assets/reading-widget.js        <- homepage widget (today's reading)
assets/reading-page.js          <- per-reading static page behavior (share/text-size)
scripts/build_pages.py          <- generates the SEO pages at deploy time
.github/workflows/deploy.yml    <- builds + deploys the whole site on every push
.gitignore                      <- keeps locally-generated preview output out of git
index.html                      <- your homepage, iframe swapped for the widget
```

If you already have a `.gitignore`, append the three lines from mine rather
than overwriting it.

## 3. Homepage (index.html)

Same as before — the widget fetches `/data/readings.json`, shows today's
reading, and its share/copy-link buttons now point at the reading's real
permalink (`/another-day-sober/08-07/resentment/`) instead of a query
string, so anything shared is the SEO-friendly, crawlable URL.

## 4. Admin panel (admin/index.html)

Unchanged from before — visit `https://recoverymisfits.org/admin/`, unlock
with a GitHub fine-grained token (Contents: read/write, scoped to just this
repo), edit or add readings. Saving there pushes straight to `main`, which
triggers the build-and-deploy Action above — usually live within a minute
or two (slightly longer than before since it's rebuilding the whole site,
not just committing one JSON file).

**Creating the token** (one-time):
1. GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token
2. Resource owner: `tacomike417`. Repository access: only `recoverymisfits-app`
3. Permissions → Contents → Read and write
4. Set an expiration, generate, copy it (starts with `github_pat_`)

The token lives only in that browser tab's session storage — never
committed, never sent anywhere but GitHub's API.

## 5. Previewing locally before you push

```bash
python3 scripts/build_pages.py
```

Generates `another-day-sober/` and `sitemap.xml` right in your working
folder so you can open them in a browser and check the layout. They're
gitignored, so this is safe to run anytime — nothing gets committed by
running it.

## 6. Known content gaps worth checking manually

- 28 November/December posts had no Blogger label at all — their dates
  were recovered by reading the date out of the title text itself, so
  it's worth double-checking those line up.
- `data/drafts.json` has 3 posts with no date yet: "Alcoholic Bomb" (was
  fighting for Feb 7), "Main Character" (was fighting for Jun 18), "No"
  (was fighting for Apr 27).
