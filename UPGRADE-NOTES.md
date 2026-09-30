# Recovery Misfits — Upgrade Notes

One list for this project. New ideas and decisions go here.

## How Mike builds
1. Get it working. 2. Get it simple. 3. Make it look really cool.
Always the best, even if it takes time. If something looks half-assed, ask him.

## Direction (30 Sep 2026)
- Our crowd is mostly Facebook people: text-only posts are normal, drama is normal,
  no picture required. The newer generation loves Instagram and reels.
- Be the happy medium: **Facebook reimagined, really cool, but with the same feed a
  brand-new user already knows how to use.**
- Profiles: profile picture + header (cover) photo.
- One feed (the Front Porch) that mixes text posts, photo posts and Sober Spins reels,
  plus a full-screen swipe view for Sober Spins only.

- **The pause (decided 30 Sep 2026):** when a post or comment reads heated, show a gentle
  pause before it posts, e.g. "Want to talk to a friend about this first?" with
  Post anyway / Save as draft. Never blocks, just slows down.
- **Lingo rule:** app copy uses path-neutral words. No sponsor, steps, program or other
  12-step terms in the app's own voice. Members can say whatever they want.

### Porch decisions (30 Sep 2026, from the in-app mockups)
- Feed is **visual like Instagram** (the preview style), but plain posts are welcome.
- Text posts show as the **handwritten cards** from the preview, so the feed stays visual.
- Profile: profile pic, header photo, bio, **their Sober Spins** grid.
  **No coins or Survival Pile on profiles** (too streaky). Members can share them to
  the feed themselves if they want.
- Sober date on profile: **their choice**, show or hide.
- **Porch Light (late-night room): NO.** Mike: it begs people to whine and complain.
- The pause and "what do you need" post tags: keep.
- Lives inside the existing header, top rail (FEED) and grungy bottom menus.
- Top priority: the UI has to be **super intuitive**.
- **Porch look (30 Sep 2026, Mike's call):** back to the ORIGINAL preview look: the Classic
  black and gold, the big rail, posts like Instagram. The post button is a white "Post" pill
  where the preview's "Vote" pill was. (Neon Diner and Clean Slate/light are still in the CSS
  if we ever want a Colors option.)
- **Three kinds of share (30 Sep 2026):** tap Share, pick one: **Say Something** (words, any
  length), **Post a Saying** (short handwritten card, 150 characters, a nod to the slogans on the
  meeting-room wall), **Share a Photo** (up to 4 photos). Sober Spins becomes the 4th later.
  Tag it (optional): Experience / Strength / Hope / A question (no "hard day": keep it positive). Our own line icons, no emojis.
- **The "switch up" (later):** when the rail/top bar goes app-wide, your picture moves up there
  and the "Glad you're here" line comes off every page. Until then it only comes off the Porch.
- No profile picture = initials from the username (grateful_gina -> GG, OneDayJen -> OD).
- Long shares show 6 lines, then **"Pull up a chair · N min read"** opens a full-screen reader.
- Photos lay out like Facebook: 1 keeps its shape (4:5 to 1.91:1), 2 side by side,
  3 = one big + two stacked, 4 = 2x2. Tap to swipe through them full screen.
- **Rule: if Facebook keeps it, so do we.** When unsure how something behaves, do what
  Facebook does, because our people already know it.
- So: header + top rail **slide away when scrolling down, come back on scroll up**;
  the bottom menu **stays put** (Facebook does exactly this).

### Porch build plan (started 30 Sep 2026; lives in /feed/, name can change any time)
- Browse anonymously as-is. **Posting, commenting, reacting, messaging and reporting need a
  confirmed email** ("confirm who you are"). The email is never shown.
- Rated R in public too: cussing OK; hate, slurs, harassment and sexual content blocked.
- SEO: YES for the public app pages (readings, memes, tools). **NO for the Porch and
  profiles**: noindex + robots.txt, so members' posts never show up in Google.
- Checkpoints:
  1. Tables + who-can-see-what (porch_1_tables.sql)
  2. Confirm-your-email (needs an email sender: Resend, free tier)
  3. The porch function: word filter, link check, photo check (Google Vision SafeSearch), the pause
  4. The feed screen: photo posts, handwritten text cards, Proud of you / Me too, comments
  5. Profiles: pic, header, bio, sober date on/off, their Sober Spins
  6. Reports, blocks, moderator screen, freeze on reports
  7. Sober Spins (reels on Bunny)

### Your recovery, your way (sign-up levels, 30 Sep 2026)
Headline on sign-up: **"Your recovery, your way."** Level names: Level 0 (no account),
Level 1 **Anonymous**, Level 2 **I'm comfortable here**.
- **No account:** everything works on this phone (readings, coins, tools). Nothing leaves it.
- **Level 1, fully anonymous:** any made-up username + password. Syncs your sober date and
  settings across phones. Browse the Porch. No posting, photos, comments, reactions or
  messages. No password reset (nothing to send it to). Say all of this plainly.
- **Level 2, confirmed:** confirm an email (never stored, never shown). Post, photos,
  Sober Spins, comment, react, message, report. Forgot password/username works.
- Also covered: move up or back down any time; 18+ and the Porch rules (one screen) to reach
  Level 2; a short wait for brand-new accounts before posting; delete everything any time.
- Forgot password / username for Level 2: match the typed email's fingerprint, email a code.

### Porch vs Facebook/Instagram: what we added (30 Sep 2026)
- Done: follows + notifications, @ suggestions, **Send a share out** (paper plane), **Reply
  to a comment**, **Edit your share or comment**, **Search** people, pop-ups stay above the
  phone keyboard, **New shares pill + pull down to refresh**, **link preview cards**,
  **double-tap = Proud of you**, **Save a share** (ME → Saved shares, private),
  **phone notifications + the number on the app icon** (iPhone: Home Screen app only).
- Safety, done: **Reports screen** for moderators (ME → Reports; danger reports at the top,
  never pause anybody), moderators get a notification per report, **Delete my Porch account**
  (everything incl. photos; app account stays; a paused person's email stays locked),
  deleted shares take their photos with them, 3-day wait now covers reacting/following/
  reporting, spam caps (300 reactions / 50 follows an hour, 20 reports a day), a blocked
  person can't react to your shares.
- Still open: sign-up levels on the account page ("Your recovery, your way"), deleting the
  whole app account (not just the Porch), Messages, Sober Spins, sample posts out and
  the Mike-only lock off at launch.
- Sent links: while the Porch is Mike-only, anybody else who taps one lands on the /feed/ preview.

## THE ONE RULE (30 Sep 2026)
**People in recovery deserve the best.**
Every build decision gets checked against it: no cheap shortcuts, no fake people or
fake content passed off as real, nothing that could hurt somebody on a bad day.

## The social feed (idea — waiting on votes)

Preview is live at /feed/ (made-up people). Votes land in the `feed_votes`
table in the Recovery Misfits Supabase project. Read them with
`supabase/feed_votes_results.sql`.

Nothing below gets built until the votes are in and it's decided.

### Sign-up: the split way (decided 29 Sep 2026)
- **Using the app stays anonymous.** Readings, coins, the Survival Pile,
  Nightly Inventory: no email, no phone, nothing. The morning is the front
  door and it never gets a lock.
- **Posting needs a confirmed email.** Posting, commenting and messaging only.
  It gives reports and bans something to stick to, so a troll can't just make
  a new account every five minutes. A throwaway email is fine.
- **No phone numbers.** They cost money per text, add friction, and feel like a
  real name to people protecting their anonymity.

### Already promised in the preview's safety list
- Anonymity: people in a photo need the poster's OK (the poster's responsibility,
  no automatic blur); no real names needed; sober date shows only if you want.
- No ego stuff: no likes, follower counts, streaks or day counts next to names.
  Just "Proud of you" and "Me too."
- Keeping it kind: report button on every post and comment, block anyone,
  cussing and slurs stopped before posting, links checked for scams and adult
  stuff, account paused after enough reports until a real person looks.
- Who gets in: 18 and up, confirmed email, brand-new accounts wait a few days
  before posting, private messages only between people who follow each other.
- Your stuff: delete a post or your whole account any time; help lines one tap
  away on every screen.

### Shape
- The morning reading stays the front page, always. The feed lives on its own
  spot on the rail: INVITE · FEED · MY PILE · MY COINS · TODAY.
- A recovery app, not an AA app. Anyone on any path is welcome. The feel is
  about 75% AA, 25% other paths.
- "New Misfits · say hi" row of faces and names only, with no counts.
- The open question: does a feed pull people away from the quiet morning part?

### What people said (29 Sep 2026, face to face)
- They love the idea.
- Focus on the **reels (Sober Spins)** first.
- They want **quotes in the reels**: the short text-over-video "quote memes" everybody shares.
- So the first thing to build could be a **Sober Spin maker**: pick a background
  (your own clip or photo, or one of ours), pick or type a quote, choose a text style,
  add music, done. It posts to the Front Porch AND saves/shares as a 9:16 video for
  Facebook, Instagram and TikTok, which also markets the app for free.
- Quote sources to decide: members' own words, the daily readings, a curated quote
  library we write ourselves. Check rights before using anyone else's text.

### Content rules (decided 30 Sep 2026)
Our crowd is **rated R, not rated X.**
- **Messages (private):** looser. Adults talking like adults, cussing is fine.
  Still blocked: sexual/porn content, threats, slurs, and scam/porn links.
- **Comments and public posts:** auto-moderated, stricter. Hate speech, slurs, harassment,
  sexual content and "dumb shit" never post. Mike is not dealing with it by hand.
  Casual cussing in public: _decide._
- **Photos/reels in public:** no nudity or sexual content.
- **Photos in private messages (decided 30 Sep 2026):** spicy/sexy pics are OK between
  adults. Only full nudity is blocked. Racy photos show blurred with "Tap to see",
  like Instagram, so nobody gets one they didn't ask for.
- **Treat members like adults (Mike, 30 Sep 2026):** let people act like adults, and let
  reports handle the consequences when they don't. Filters stop the worst stuff; reports
  handle the rest.
- Auto-moderation catches it BEFORE it posts; reports cover what slips through.

### Words (decided 29 Sep 2026)
| Thing | What we call it |
|---|---|
| Feed | **The Front Porch** |
| Post | **Share** |
| Short videos (Loops on Infinite Pulls) | **Sober Spins** (one is a Sober Spin; named 30 Sep 2026, replaces Misfits Moments) |
| Collection | My Pile + My Coins |
| Profile | Profile |
| Follow | Follow |
| Messages | Messages |
| Reactions | **Proud of you** / **Me too** |
| Moderators | Moderators |
| Shop | Shop |
| Invite | Invite. "Pass it on" can show up inside it, but the button has to say Invite so it's obvious |
| Welcome message | Welcome message |

Plain words everywhere else. Recovery words only where they make it warmer
without making it confusing.

## Hosting plan (29 Sep 2026)
- Expecting ~10,000 monthly users by end of year.
- Website: move from GitHub Pages to **Cloudflare Pages** (free, unlimited bandwidth).
  GitHub stays the code home; Cloudflare auto-deploys on every push.
- Domain stays registered at **Porkbun**; only its nameservers point to Cloudflare.
  Check any email (MX) records come across, and keep `.well-known/` for the Android app.
- Reels (Sober Spins): **Bunny Stream**, reusing Infinite Pulls' Loops code.
  15-second cap, 720p max, auto-delete after 30 days.
- Logins and posts: Supabase.
- Rough monthly cost: ~$80 at 10k users, ~$300 to $3,000 at 100k depending on how much
  people scroll. At that size, human moderators become the real cost.

## Money (30 Sep 2026)
- Always free. Fully self-supporting through members' own contributions.
- **No ads, ever. No rehab/treatment-center money, no selling data, no paywalls,
  no donor badges.** (Mike already ruled out ads.)
- Down the road: a "chip in" basket, an honest monthly cost meter, and merch
  (real Recovery Misfits coins, stickers, shirts via print-on-demand).
- **Overages go to a recovery nonprofit**, chosen by the community. The idea:
  this app is owned by recovery.

## Install
- 29 Sep 2026: the Install button installs our own app (the PWA), not Google
  Play. Moving away from Google Play.
