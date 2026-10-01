# Recovery Misfits — Upgrade Notes

One list for this project. New ideas and decisions go here.

## ⛔ NO PORCH LAUNCH BEFORE OCTOBER 20, 2026
Mike, 1 Oct 2026: "do not let me launch this before Oct 20. I feel like I need to have you
help me slow down so I don't rush something that is confusing for people."
Launch means taking the Mike-only lock off feed/porch.html. Until Oct 20 it stays locked,
and even then only once the UI update (layout A) is built and has been lived with for a while.

## How Mike builds
1. Get it working. 2. Get it simple. 3. Make it look really cool.
Always the best, even if it takes time. If something looks half-assed, ask him.

## Direction (30 Sep 2026)
- Our crowd is mostly Facebook people: text-only posts are normal, drama is normal,
  no picture required. The newer generation loves Instagram and reels.
- Be the happy medium: **Facebook reimagined, really cool, but with the same feed a
  brand-new user already knows how to use.**
- Profiles: profile picture + header (cover) photo.
- One feed (the Front Porch) that mixes text posts, photo posts and Misfits Moments reels,
  plus a full-screen swipe view for Moments only.

- **The pause (decided 30 Sep 2026):** when a post or comment reads heated, show a gentle
  pause before it posts, e.g. "Want to talk to a friend about this first?" with
  Post anyway / Save as draft. Never blocks, just slows down.
- **Lingo rule:** app copy uses path-neutral words. No sponsor, steps, program or other
  12-step terms in the app's own voice. Members can say whatever they want.

### Porch decisions (30 Sep 2026, from the in-app mockups)
- Feed is **visual like Instagram** (the preview style), but plain posts are welcome.
- Text posts show as the **handwritten cards** from the preview, so the feed stays visual.
- Profile: profile pic, header photo, bio, **their Misfits Moments** grid.
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
  meeting-room wall), **Share a Photo** (up to 4 photos). Misfits Moments becomes the 4th later.
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
  5. Profiles: pic, header, bio, sober date on/off, their Moments
  6. Reports, blocks, moderator screen, freeze on reports
  7. Misfits Moments (reels on Bunny)

### Your recovery, your way (sign-up levels, 30 Sep 2026)
Headline on sign-up: **"Your recovery, your way."** Level names: Level 0 (no account),
Level 1 **Anonymous**, Level 2 **I'm comfortable here**.
- **No account:** everything works on this phone (readings, coins, tools). Nothing leaves it.
- **Level 1, fully anonymous:** any made-up username + password. Syncs your sober date and
  settings across phones. Browse the Porch. No posting, photos, comments, reactions or
  messages. No password reset (nothing to send it to). Say all of this plainly.
- **Level 2, confirmed:** confirm an email (never stored, never shown). Post, photos,
  Moments, comment, react, message, report. Forgot password/username works.
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
  whole app account (not just the Porch), sample posts out and
  the Mike-only lock off at launch.
- Sent links: while the Porch is Mike-only, anybody else who taps one lands on the /feed/ preview.

### Sober Spins (v20, 30 Sep 2026)
- Short videos, 15 seconds max, built like Jeff's Infinite Loops: a SOBER SPINS row at the
  top of the Porch, a full-screen player (swipe up for the next one, tap pauses, double-tap is
  Proud of you, sound pill), and the maker (photos or clips, styles, words, stickers).
- **Respin**: puts somebody's Spin on your profile with a ↻ label, and tells them.
- **Free music**: Freesound tracks marked CC0 (nobody owns them), picked in the maker's ♫ tab.
- Each Spin has a hidden Porch share behind it (need = 'moment'), so comments, reports
  and notifications work the same way. The feed itself never shows those shares.
- Videos: Bunny Stream library 767051 (Premium Encoding, MP4 fallback, 720p only).
  The phone shrinks each video to 720p, then sends it straight to Bunny. SafeSearch checks the thumbnail.
- A Spin lasts 30 days; pin up to 3 to keep them. Limit of 10 a day. Deleting your Porch
  account deletes your Spins and their videos.
- Files: feed/spins/spins.js, feed/spins/spin-maker.js, feed/spins/stickers/,
  supabase/porch_12_spins.sql, supabase/functions/spins.

### Beta testers + the Porch tab (1 Oct 2026, Porch v24)
- Beta testers, who have the full Porch: **tacomike417, fire_l0ve, krazyk226**, plus
  misfit_tester (Mike's second account). They're all friends with each other
  (supabase/porch_13_beta.sql). To add one, put the name in the lock list in
  feed/porch.html AND in porch_testers.
- The bottom bar's **Memes** tab became **Porch**. Memes are still on Today and at /meme.html.
  Testers land on the Porch; everybody else gets feed/soon.html ("Good company between
  meetings. The Recovery Misfits community opens at the end of October.").
- SPINS is in the Porch's top row. The face on the coin rail's Account well is bigger, and
  the Spin maker is restyled in black and gold.

### The 5-second rule (1 Oct 2026, Mike)
"Nobody reads anymore." Even Jeff asked "can I upload a video?" On the Porch side, people
have to know what to do in 5 seconds, not 10. The first screen of the Spin maker is now
just GIVE IT A SPIN with two big doors, RECORD and UPLOAD (video or photos). Tabs and the
preview show up only once there's a clip.

### House rules for SQL files (1 Oct 2026, Mike)
- The newest SQL step sits right in supabase/. Every older one moves to supabase/old sql/,
  so the one to run is the only one there.
- Beta testers (porch_testers) can post right away with no email confirmation
  (porch_15_testers_post.sql). Everyone else still confirms an email once.

### Spins go viral (1 Oct 2026, Porch v37, Mike: "lets do all the viral stuff")
- **@name on every Spin:** the maker burns "@handle" over RECOVERY MISFITS into the video, so a Spin posted to Reels/TikTok points back. New Spins only; the meme Spins from scripts/post_spins.mjs don't have it.
- **Respins ride the story row:** a respun Spin jumps back to the front with a gold ↻ badge and the respinner's name.
- **Use this sound:** the ♫ line on a Spin is a button that opens the maker with that track already on.
- **Share links are /s/<id>:** functions/s/[id].js (Cloudflare Pages Function) gives texts and Messenger a picture preview and plays the Spin for anybody. New here = "Join Recovery Misfits"; has an account = "More Spins on the Porch". Needs SQL step 16 (porch_spin_card).
- Spin links inside Porch messages show as "▶ Watch the Spin" and play right there.
- Note: a Spin link can be watched by people outside the beta. The Porch itself stays locked until Oct 20.

### Profiles + privacy (1 Oct 2026, Porch v42, Mike: "protecting their level of anonymity is paramount")
- **Sign-up = pick your level first** (account.html): Level 1 Anonymous / Level 2 I'm comfortable here. Then username + password, then sober date.
  Level 2 then goes to **/feed/porch.html?setup=1**: confirm email, picture + header + bio, who can see you, find your people, then your profile.
- **Level 2 is testers-only until launch.** account.html has `PORCH_OPEN = false` and its own copy of the tester list. **At launch: flip PORCH_OPEN to true AND remove the Porch's tester lock.**
- **Sober date is never on a profile.** SQL 18 wiped porch_members.sober_date and blocks it for good. It only lives in the person's own app account (profiles, own-row only). People see it only if they share a coin, Survival Pile or post themselves.
- **Who can see my profile:** Members only (default; anyone signed in to the app, including Level 1) or Public (anybody with the link). Members-only hides profile, shares, comments, Spins and shared Spin links from anybody not signed in.
- **Profile links:** recoverymisfits.org/u/<name> (functions/u/[handle].js). Members-only and no-such-person show the same "For members" page.
- **Find friends near me:** phone location rounded to ~7 miles, in porch_places (nobody can read it), only names/faces come back, shuffled daily, confirmed members only, 5 moves a day, delete any time (Edit profile). Most active = most shares + comments in 2 weeks.
- Private review done 1 Oct: anon can't call the near-me/most-active functions, can't read reactions/respins/hearts, can't see comments on members-only posts; pictures can only be set through the porch function.

### LATER: Spin face filters (1 Oct 2026, parked until the UI is worked out)
- The selfie camera, the 8 characters, their voices and the face tracking are already in
  spin-maker.js. The filter art isn't: the pictures live in Jeff's project
  (tcg-sandbox/assets/loops/lenses/), so filters show blank for now.
- Options when it's time: copy Jeff's generic pieces, make a recovery-themed pack (I write
  the prompt list for ChatGPT), or both.

### Taglines for the community side (1 Oct 2026, Mike)
- **"Good company between meetings"**: the Porch's tagline. It's in the page title, the
  link preview, and the heading of the sign-in sheet.
- **"Give it a spin"**: the Make-a-Spin button and the empty-Spins message.
- **"Sober Spins"**: the name of the short videos.
- Use them in the UI update too, for example under the logo and on the speed dial's Spin
  button.

### Porch rule: experience, strength and hope (1 Oct 2026, Mike, firm)
"We share experience, strength and hope. Not opinion, strength and hope." Opinions can
hurt people, and in recovery we're not in the people-hurting business anymore. The
doctors get to be the doctors, the lawyers the lawyers and the counselors the counselors.
Here, we're people in recovery helping each other out. It's at the top of THE PORCH
RULES that people agree to when they confirm their email, plus a rule: "Share what
happened to you, not what somebody else ought to do. No medical, legal or counseling
advice."

### UI UPDATE: saved to come back to (1 Oct 2026)
- Mike: "our ui is just super confusing and cluttered. It needs reorganized big time." He
  wants a **+ speed dial** that fans out to make a post or a Spin.
- Mockups: `Claude outputs/ui-update.html` (3 layouts in phone frames, dial open).
  - **A, Instagram clean** (Claude's pick): Porch rail gone. Search, Messages and the bell
    become icons up top. Spins become story circles. Coins and Invite move into ME. The dial
    sits bottom right.
  - **B, Porch | Spins**: one switch between the feed and a full Spins wall. The dial sits
    bottom center.
  - **C, Slim rail**: FEED / SPINS / FRIENDS only.
- Dial buttons (proposed; Mike only decided "Make a Spin" for sure): Make a Spin,
  Share a photo, Say something, Celebrate a win (coin + days).
- **BUILT 1 Oct 2026 (Porch v23).** Celebrate a win shares a coin you've earned (only coins up to your sober date) on its spotlight. The porch function accepts `coin` for that. Compose has a Just words / A saying card switch, so Post a Saying is still one tap away.
- **DECIDED 1 Oct 2026: layout A.** Real-pixel mockup: `Claude outputs/porch-layout-A.html`.
  The dial has: Give it a spin, Share a photo, Say something, Celebrate a win. The coin
  rail and bottom nav stay where they are. Coins and Invite move into the Account menu,
  and New Misfits moves behind Search.

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
- Focus on the **reels (Misfits Moments)** first.
- They want **quotes in the reels**: the short text-over-video "quote memes" everybody shares.
- So the first thing to build could be a **Misfits Moments maker**: pick a background
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
| Short videos (Loops on Infinite Pulls) | **Misfits Moments** |
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
- **Cloudflare has to BUILD the site, not just copy it** (fixed 1 Oct 2026): set
  Build command `bash scripts/cf_build.sh` and Build output `_site`. Without it there
  are no memes on the front page, no /meme/<id>/ share pages, and no reading pages or
  sitemap for Google. **Daily rebuild:** GitHub's 5:20am schedule (.github/workflows/
  deploy.yml) now just calls Cloudflare's deploy hook, which is stored in the GitHub secret
  CF_DEPLOY_HOOK. GitHub Pages isn't used anymore. The speaker tapes read YOUTUBE_API_KEY
  from Cloudflare's Variables and secrets.
- Domain stays registered at **Porkbun**; only its nameservers point to Cloudflare.
  Check any email (MX) records come across, and keep `.well-known/` for the Android app.
- Reels (Misfits Moments): **Bunny Stream**, reusing Infinite Pulls' Loops code.
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
