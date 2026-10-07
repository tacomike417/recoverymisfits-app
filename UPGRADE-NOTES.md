# Recovery Misfits — Upgrade Notes

One list for this project. New ideas and decisions go here.

## ⛔ NO PORCH LAUNCH BEFORE OCTOBER 20, 2026
Mike, 1 Oct 2026: "do not let me launch this before Oct 20. I feel like I need to have you
help me slow down so I don't rush something that is confusing for people."
Launch means taking the Mike-only lock off feed/porch.html. Until Oct 20 it stays locked,
and even then only once the UI update (layout A) is built and has been lived with for a while.

## 🚀 THE LAUNCH LIST (Mike, 3 Oct 2026: "leave it until launch, make a launch list for us")
Everything that has to happen to open the Porch. Nothing here before October 20.

**The week before (Oct 13 to 19)**
- [ ] Close the Gmail plus trick in porch-confirm (name+anything@gmail.com all count as one email). Mike, 3 Oct:
      "leave it until launch." One function deploy.
- [ ] Decide: do brand-new accounts still wait 3 days before they can post? (Today only testers skip the wait.
      On launch day that means a new person can look but not share until day 4.)
- [ ] Decide where the invite link sends new people (Mike, 3 Oct: "we will need to change the url on launch").
- [ ] Welcome crew: a few real people lined up to say hi on day 1.
- [ ] Welcome post written and ready to sit on top.
- [ ] Check an iPhone: alerts, the number on the app icon, install as a web based app.
- [ ] Check the 4:17am dated Spins are still posting on time (they run through Oct 22; five say "October 20").

**Launch day (Oct 20), in this order**
- [ ] account.html: flip PORCH_OPEN to true (opens "Pull up a chair" to everybody).
- [ ] feed/porch.html: take the tester lock off.
- [ ] feed/porch.html: INVITE.url set to the launch address.
- [ ] Sample posts off.
- [ ] Welcome post on top.
- [ ] Beta door (beta.html): switch it off (the off switch is in porch_28_beta_door.sql).
- [ ] Version bump, sw.js VERSION bump, push.
- [ ] Sign up as a brand-new person on a phone, start to finish: email step, picture, first share, house says hi.
- [ ] Home page Porch card says "Come hang out" (it switches by itself on Oct 20; just look).

**The first week after**
- [ ] Watch reports and the new folks rail every day.
- [ ] Founding Misfit badge: decide when the door closes on it.
- [ ] Quick comments (parked from the unclear list).

## 🧺 THE BASKET (6 Oct 2026, Mike: "we pass the basket to keep the site going") — DECIDED, NOT BUILT
"We're self supporting through our own contributions." A menu item called Basket. No ads, no selling
people, and the books open for every member to read. Don't build until Mike says.

**Decided 6 Oct**
- The money belongs to Mike's 501(c)(3) (he says it is alive; general sobriety purpose). TO DO before a
  dollar comes in: confirm it on the IRS lookup, and open the nonprofit's own bank account (Huntington
  or a business account). Never his personal account.
- Site bills = every real bill the site runs on (hosting, database, domain, video storage, Buffer, Claude,
  ChatGPT, and the rest). Nobody gets paid. Mike: "i dont need paid, i do this to stay sober."
  Shared bills count only Recovery Misfits' share (Buffer: 4 of 6 channels = $24 of $36).
- Keep 3 months of bills as a cushion. Anything above that is extra, and extra goes to a charity.
- The charity: members suggest (real contact info, not just "give it to the intergroup"), members vote,
  most votes wins. Mike checks each one is a real registered charity before it goes on the ballot.
  One vote per confirmed member. No names on suggestions, no running tally until the vote closes.
  ONCE A YEAR (Mike, 6 Oct, his wife's call: "yearly"). Idea on the table: tie it to the site's birthday,
  October 20: the vote opens, the year's books go up, the gift goes out. At year's end keep 3 months of
  bills, everything above that goes. The monthly books still show every dollar in between.
- Giving: any amount, one time, with quick buttons ($1, $2, $5). No monthly subscription.
- Members only. It lives inside the Porch. Outsiders are never asked.
- The page shows: what the site costs on a sliding scale by member count (0 to 100, 101 to 250, ...),
  a plain explanation (this costs money, this is how we stay away from ads, the tradition behind it,
  and that Recovery Misfits is not AA), one Give button, and the books by month and year:
  given, bills paid, cushion, extra, and where the extra went.
- No donor names, no badges, no thank-you lists. Giving stays invisible.

**Still open**
- "Never show zeros": on day one nothing has been given. Show the bills first, the total only once there is one.
- Google Play has rules for donations inside apps (friendlier to registered nonprofits). Check before the
  Android app shows the Give button.
- Which payment company (it never touches our pages: no card numbers on the site, no emails stored).
- THE MENU SHUFFLE: DONE in v219 (see the bottom of this file). Still open: where Basket goes. The new
  "You" spot (bottom right) or the "More on the shelf" box on Today are the two candidates.

## ☀️ "YOUR FRIENDS SHARED", ONCE A MORNING (4 Oct 2026, Mike)
- [x] One phone alert a day at 8:30am Eastern to anybody with a friend who shared since yesterday morning:
      "3 friends shared on the Porch". Nobody gets one on a day none of their friends shared. Group shares and the
      house accounts do not count. Built in porch-push ({ digest: "friends" }); the knock is porch_46_friends_digest.sql
      (cron job porch-friends-digest, 12:30 and 13:30 UTC so it is 8:30 summer and winter).
      Stop it: select cron.unschedule('porch-friends-digest');

- [x] v158 (4 Oct): the Porch tour has a "Turn on alerts" step, right after "Say something" (now 5 steps). The button asks the
      phone for alerts right there; on an iPhone in a browser tab it shows the Home Screen steps. The after-hello pop-up
      does not also ask while the tour is walking them through. (feed/tour.js, Porch.alertsState / alertsOn.)

## 🗂️ THE SHARE DESK (4 Oct 2026, Mike: "i dont want to get confused on if i have shared it yet")
- [x] v159: /feed/share-desk.html, in the menu as "Share desk". MODERATORS ONLY (locked by sign-in, checked again in the
      database; no password in the code because this repo is public). Lists every Spin and picture post by recoverymisfits,
      newest first. "Get the video / picture" hands it to the phone's Share menu. Tick Instagram and Facebook ("I did it");
      when both are ticked it moves to DONE. "Skip this one" archives without sharing. "Put it back" undoes.
      It does not post anywhere by itself. Table: porch_share_desk (porch_47_share_desk.sql).
- [ ] Same desk for Infinite Pulls (Loops).

## 🤖 WELCOME MATT, THE GREETER ROBOT (4 Oct 2026, Mike: "I love Welcome Matt lol")
A humble worker robot who took the greeter job. He says plainly that he is a robot.
- [x] Name welcomematt, shows as "Welcome Matt". Line: "Greeter robot. I set up the chairs, hold the door, and say hi. Glad you're here."
- [x] Picture: assets/house/welcomematt/avatar.webp (Mike's art; the big one is in Downloads as welcomematt-full.jpg).
- [x] v160: on the tester lists (account.html, feed/porch.html) and the house lists (porch.html HOUSE, porch-push, porch_house()).
- [x] Account made and set up (porch_48, 4 Oct).
- [x] v161 + porch_49_matt_greets.sql: WHAT HE DOES.
      * A first share: Recovery Misfits still comments right away (porch_41); Matt adds his own 2 to 8 minutes later
        (one of ten lines). Mike: "Both comment."
      * Everybody new: one message from Matt 1 to 20 hours after joining: "Beep boop. Welcome to the Porch! I'm Matt, the
        greeter robot. I can't fix much, but I can point you to the coffee. Take a look around, there's a lot of good
        sobriety here." + yellow heart.
      * NOBODY CAN REPLY TO HIM (Mike: "i dont want people to message him"). A chat with Matt has no typing box and says
        "Matt is a robot. He can't read replies."
      * A second message 2 to 6 hours later: "invite a friend if you think the Porch would help" with a link
        (/feed/porch.html?invite=1 opens the invite card). It only goes out FROM OCTOBER 20 ON; before launch an invited
        friend cannot get in. Nothing to flip on launch day, the date is in the SQL.
      * Job: porch-matt-greets, every 2 minutes. Stop him: select cron.unschedule('porch-matt-greets');
      * People who were here before 4 Oct get nothing late.

## 🏠 STARK RECOVERY SPINS (4 Oct 2026, Mike)
"resources for guys getting sober and back out in the world ... professional and kind of dry ... same format as the logo."
- [x] 18 how-to Spins (resume, cover letter, the gap, interview, a record, job help, email/voicemail, ID, birth certificate +
      Social Security card, bank account, food, SNAP, a hot meal, the bus, phone bill, a meeting, a doctor, Medicaid).
      Claude made the videos (not ChatGPT) so every word and number is exact: navy cards in the logo's colors, one step a card,
      about 30 seconds, Mike's "corporate calm" track. End card: recoverymisfits.org/u/starkrecovery, "Check before you go."
- [x] Every local fact was read on the organization's own page on 4 Oct 2026; sources are in
      ~/Downloads/stark-recovery-18-scripts.txt. Local places are worded "Starting place:". Mike confirmed 2-1-1 and the bus fare.
- [x] Posting: scripts/upload_stark_spins.py sends them up (numbers 3001+); porch-daily starkSpins() posts from starkrecovery:
      the first THREE at once, then one every 3 days in the morning (first knock after 7am Eastern).
- [ ] RECHECK THE FACTS every few months (fees, addresses, hours). A wrong address on a card is worse than no card.
- [ ] Still unconfirmed: OhioMeansJobs walk-ins and hours (the card says "Call before you go").

## 📝 THE BIG LIST (brainstorm 1 Oct 2026, Mike: "we're doing all this stuff")
Order isn't set.

**Finish first**
- [x] Spin music: pick the 50 clips (picker page), install them, push (done 1 Oct: 50 clips, 15 seconds)
- [x] Play Store app rebuild (dropped: the Play Store app is parked on purpose, the web based app is the real one)
- [ ] (on THE LAUNCH LIST) close the Gmail plus hole in porch-confirm (name+anything@gmail.com counts as a new email
      today, so one Gmail can confirm many accounts). Left open on purpose while Mike tests with plus emails.
      The email step itself was tested for real on 3 Oct (test link: /feed/porch.html?testemail=1) and worked.
- [ ] (on THE LAUNCH LIST) change the invite link (Mike, 3 Oct: "we will need to change the url on launch"). INVITE.url in
      feed/porch.html points at /feed/porch.html for the testers; at launch point it where new people land.
- [ ] WELCOME CREW (Mike, 3 Oct: "Number two will come"): a few real people get a "New here" list each day and
      one tap to go say hi. The house comment, the new folks rail and house accounts accepting friend requests
      are done (v141, porch_41). Later idea: a "Porch Greeter" card for welcoming 10 new people.
- [ ] Day 1 checklist: flip the lock, sample posts off, welcome post on top, a few people ready to share
- [x] Groups get their own address: recoverymisfits.org/groups/<name> (v84, 2 Oct). Picked when the group is
      started, Keeper can change it. The address page shows only the group's name and what it's for.
- [x] GROUPS tab shows how many new shares are waiting in your groups (v84, 2 Oct), and a number on each group.
- [x] Comments on the paper look under every share, with an "Add a comment" line; heart button and
      tap-to-reply in the comments window (v84, 2 Oct).
- [x] No dead ends on the Porch (v84, 2 Oct): arrow on pages you browse, X on things you can cancel.
- [x] THE PORCH TOUR (v88, 2 Oct): pops up the first time somebody lands on the Porch signed in. One thing
      per screen with a real screenshot and a gold ring on what to tap: add your picture, say something,
      make a Spin, put your Spin on YouTube, then "want to see what else you can do?". Every step has a
      button that opens the real screen. A "Getting started" strip sits above the feed until the three
      are done, and "How the Porch works" is in the account menu. Files: feed/tour.js, feed/tour/*.webp
      (real screenshots; retake them if those screens change a lot).
- [x] THE BETA DOOR (v86, 2 Oct): recoverymisfits.org/beta.html. Anybody who opens that link is let
      into the Porch on that phone, and on their first signed-in visit becomes a beta tester (can post
      right away, 60-second Spins, friends with tacomike417). NOT the launch: no link, no Porch.
      Brakes in supabase/porch_28_beta_door.sql: a cap of 25 testers and an off switch.
- [x] Longer Spins (v85, 2 Oct): Spins stay 15 seconds; an upgraded account gets 60. "Need longer Spins?"
      in the Spin maker lets people apply. Mike sees each ask on the Reports screen with their numbers
      (Spins, shares, comments, days here) and taps "Give them 60" or "Not yet". Beta testers start with 60.
      Needs supabase/porch_27_long_spins.sql run and the spins function deployed.
- [ ] IDEA (Mike, 1 Oct, brainstorm, not decided): Share from the Daily Stack to the Porch. Own stuff
      (Another Day Sober, the meme, On Awakening) goes in as a card that opens the page in the app.
      Outside readings (Daily Reflections, Twenty-Four Hours) go in as a link card with the date, never
      their words. Build it hidden behind the tester lock so it goes live Oct 20 with the Porch.
      Open question: meme as a picture post, a Spin with music, or let them pick.
- [ ] IDEA (1 Oct): fill Spins with our own stuff instead of outside videos: a house account posts a meme
      + music Spin and a daily-reading Spin each day; a "Spin of the day" prompt. Outside video sources
      looked at and passed on: KLIPY, GIPHY Clips, OpenWeb Ninja, ViralHog.

**Before the doors open**
- [x] "Need help now?": already there, the Call 988 line at the bottom of the post screen.
      Mike likes it where it is; not on the menu. "They'll find it."
- [x] Porch rules page people agree to once (done 1 Oct, v62: shown once before your first post, read again from Edit profile)
- [x] Privacy policy + terms (done 1 Oct: recoverymisfits.org/privacy, linked from sign-up and Edit profile)
- [x] "Delete my app account" button (done 1 Oct: bottom of the account page, tap twice)
- [x] Forgot password (done 1 Oct: Sign In > Forgot your password?, works for anybody who
      confirmed an email on the Porch; level 1 accounts with no email still can't reset)
- [x] Blocked people list (done 1 Oct: Edit profile > Blocked & muted)
- [x] Mute somebody without blocking them (done 1 Oct: ⋯ on a share or Spin)

**Like the big apps**
- [x] Calls in Messages: one-on-one video and voice, friends only, never recorded
      (built 1 Oct, v70; database step 23). STILL TO DO: turn on the Cloudflare relay and paste
      its two keys, then test a real call between two phones. A "restrictor" (limits) can come
      later if the bill ever needs it.
      Rings as a phone alert (web apps can't do a full-screen ring on iPhone).
      Group calls later. Ringtone gets built with it.
      A small Call 988 line at the bottom of the call screen, same as the post screen.
      THE MONEY (checked 1 Oct 2026, Cloudflare's own pricing pages): calls need Cloudflare's
      relay (TURN) for phones that can't connect directly. First 1,000 GB a month is free,
      then 5 cents a GB. Only relayed calls count; direct ones cost nothing. A relayed video
      call is roughly 1 GB an hour (estimate), so the free part covers about 1,000 hours of
      relayed video a month, and after that it's about a nickel an hour. No per-minute fees.
- [x] Groups (done 1 Oct, v65: Groups tab, group pages, apply to start one, Mike approves).
      Trusted starters (step 21): tacomike417, fire_l0ve, krazyk226 skip the active test, to seed
      feeder groups. Still takes two, and Mike still approves each one.
      Still to come inside groups: Events (parked), Spins tab, group cover photos.
      Mike's rules (1 Oct): Groups get their own tab (mockup A).
      Two people start a group: a Keeper and a Co-keeper (not "admin" or "moderator").
      Starting a group is a privilege you earn: the Keeper is an ACTIVE member with 30
      days on the Porch and APPLIES for the group. The Co-keeper is active too and taps "I'm in".
      "Active" (between us, the app never shows the numbers): picture + bio, 5+ shares,
      10+ comments on other people's shares, showed up 8+ different days in the last 30,
      not paused, nothing taken down in the last 30 days. Hearts don't count.
      Then Mike approves EVERY group before it opens. No self-centered crazy groups.
      Only members see what's shared in a group. Moderators can look in on any group.
      Nobody shares for 90 days = it closes (heads-up at 75 days). Closed is not erased.
      No sober-date rule. Events and group chat live inside groups (built after).
- [ ] PARKED until there are some users (Mike, 1 Oct): Events: "Thursday 7pm speaker meeting,
      who's going" with I'm going
- [x] Group chats in Messages (done 1 Oct, v66: friends only, 12 people at the most; database step 22).
      A chat room INSIDE a Group: no (Mike, 1 Oct). Shares and comments are the one place to talk.
- [ ] PARKED (Mike, 1 Oct): Voice messages in Messages (hold to talk)
- [x] Sounds: a ding for new messages and notifications while the app is open, on every page
      (done 1 Oct, v69; Sounds on/off is in the Notifications panel). The ringtone for video
      calls gets built with calls.
- [ ] PARKED (Mike, 1 Oct): Topics/hashtags (#gratitude) + a Discover tab
- [ ] PARKED (Mike, 1 Oct): Polls
- [x] Reshare somebody's post to your friends (v72, 1 Oct). Not from groups, not your own, once each.
- [ ] PARKED (Mike, 1 Oct): Disappearing photos in Messages: opens once for 10 seconds, then gone for good
      (deleted off the server). A web app can't stop screenshots (Snapchat can't
      either, it only tells you), so: no saving, the photo blurs if they leave the
      app, and the viewer's own @name is stamped across it.
- [ ] PARKED (Mike, 1 Oct): Live / audio rooms (biggest and hardest to keep safe, later)
- [ ] PARKED (Mike, 1 Oct): Counts on profiles (likes, friends): Mike, 1 Oct: doesn't think these break the
      ego rule. Tentative, decide later.

## 📅 THE DATED SPINS (3 Oct 2026): one a morning at 4:17am, 4 Oct to 22 Oct, from recoverymisfits

Mike shares each one out to Facebook and Instagram from the Porch during his morning time. This batch is its
own line (numbers 2001+, porch_44, scripts/upload_misfit_daily.py). The every-other-day 4:17pm line (1001+) is
not changed, except the old spin-24 (Facebook Messenger logo) came off it.

Oct 4 Sunday night · 5 sit with my feelings · 6 SOMETHING'S OPENING · 7 90 days · 8 resentment subfolders ·
9 New town · 10 SAVING YOU A SEAT · 11 chose peace · 12 meeting's over · 13 ONE WEEK · 14 my mug · 15 Good day? ·
16 surrendered · 17 THREE DAYS · 18 One hour in the room · 19 TOMORROW · 20 WE'RE OPEN · 21 my lane ·
22 Hit me up, Misfit Messages (the corrected spin-24)

- If the launch date moves, the five countdown Spins (Oct 6, 10, 13, 17, 19) say October 20 on them.

## 🔎 THE UNCLEAR LIST: DECIDED (3 Oct 2026, Mike went down it one by one)

"Go over the whole site and tag anything with ambiguity." 37 things were tagged; these are his calls.
[ ] = decided, not built yet. [x] = built.

EVERYWHERE
- [x] Tagline is "Good people between meetings". Fix the Porch page title and the coming-soon page ("Good company").
- LEFT AS IS after all: the sober bar's "SIGN IN" (see "What the build turned up"). The "?" coin STAYS (a blank coin looked like a hole).
- [x] Bottom bar: the "Share" tab becomes "Invite"; the screen it opens is titled "Invite a friend".
- [x] Bottom bar: the "Audio" tab becomes "Listen".
- LEFT AS IS: "share" meaning a post. "Porch" as a tab name. Spins/Respin and Misfit Messages wording.

HOME
- [x] Top card gets a small label: "Another Day Sober · today's reading".
- [x] Under Your Daily Stack: "Your readings for today. Tap Edit to pick which ones." The stack itself does not change.
      Mike: "it's my app and I use it daily".
- [x] Under Your Corner: "Your milestones and coins."
- [x] Recovery Basics comes OFF completely (Season Watch and "Another One" go with it). "I never liked it."
- [x] In its place, a small Porch card with the porch icon: "THE PORCH · OUR COMMUNITY / Good people between
      meetings. / Opens October 20. → See what's coming". From launch day it switches itself to "→ Come hang out".
- [x] "MAKE CARD" becomes "MAKE MY CARD"; small line "A picture of your date and days. No name on it."
- [x] The Book Shelf (Big Book + Also on the shelf) moves off the home page onto the Tools page.

READING PAGE
- [x] "BACK TO READINGS" becomes "BACK", a true back (home or the Porch, wherever they came from).
- [x] "EVERY READING" becomes "ALL 365 READINGS".

LISTEN (was Audio)
- [x] "Watch" on each row becomes "Play".
- [x] Take out the Speaker Tapes / Audiobooks switch IF it only repeats the three big buttons. Check first.

FUN
- [x] A small "GAME" tag on both cards.

TOOLS
- [x] Fear Compass: "Send" becomes "Next".
- [ ] Burn Pad: faint words in the To box: "Who's this about? (a person, a place, yourself)".
- LEFT AS IS: "About this tool" stays at the bottom.

COINS, PILE, SOBER DATE, MEME
- [x] Coins, signed out: "Set your sober date and every coin you've already earned shows up here."
- [x] Survival Pile: add "Celebration cards you earn along the way. A new one shows up on certain days."
- [x] Sober date page with no date: one button, "SET MY SOBER DATE".
- [ ] Meme page: delete the paragraph that explains buttons that aren't there.

SIGN-UP
- [x] No more "Level". "Look around · FREE" and "Pull up a chair · ALSO FREE", everywhere in sign-up.
- [x] Page title "Your Anonymous Account" becomes "Your Account".
- [x] Coming-soon page says October 20, not "the end of October".

THE PORCH
- [x] Finding: one name, "Find people" ("Find" on the small profile button). "Find friends" comes out of the menu.
- [x] Inviting: one name, "Invite a friend" ("Invite" on the small profile button).
- [x] Profile name box: "Name people see (optional)" + "Leave it blank and people see your username."
- [x] "Alerts" is the one word for the setting. "Buzz" only as the friendly word. No "notifications".
- [x] What a Spin is: the selfie misfit slides into "Give it a spin" (v149). No red dot.
- [x] "Me too" comes off. The row is Love this · Comment · Reshare · (send), the first three in words.
- [x] Members only: "Only people signed in to Recovery Misfits can see your profile and shares."
      Public: "Anyone with the link can see them, signed in or not."
- [x] BETA TESTER badge becomes "FOUNDING MISFIT".
- LEFT AS IS: the WINS tab on profiles.

WHAT THE BUILD TURNED UP (v151): four things on the list were my mistake, read off the page wrong.
- Sober bar "SIGN IN" was LEFT AS IS. Signed out, that button really does go to sign in / sign up (a 21 Sep rule:
  "the button goes where it says it goes"). "SET DATE" would have been the lie.
- Fear Compass "Send" is not a word on the screen. It is an arrow button; only the hidden name read "Send". The
  hidden name is "Next" now.
- Burn Pad's To box already had faint words: "Who's it for? (optional)". Left as is.
- The Meme page paragraph is RIGHT on a phone: the buttons there say "Share this one" and "Share the link". They
  only read Save the image / Copy the link on a computer. Paragraph left in. Mike can still say delete it.
- "Every Reading" only shows before the daily build; on the live site that spot is the month calendar.

ITS OWN BUILD, AFTER THE WORDING
- [x] (v155: sober date card, meme page, reading pages, Survival Pile card. NOT yet: the two small share
      icons on the home page's Meme of the Day row.) "Share to the Porch" as the FIRST choice everywhere the site has a share button (sober date card, meme,
      today's reading, a coin, a Survival Pile card). Opens a new Porch post with the picture in it; nothing posts
      by itself. Shown to everybody now; before launch it lands on the "Opens October 20" page. Mike: "let the
      user get a little hungry to wonder what the porch is".
- [ ] LATER: quick comments (one-tap replies), now that "Me too" is gone.
- JUST A QUESTION, NOT A TO-DO: mass email isn't possible (emails are never kept). A buzz to everybody or a
  pinned post could do that job.

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

### Photos: scan, face boxes, and the OK button (1 Oct 2026, Porch v45, Mike)
- The promise from the preview's safety list: **people in a photo need the poster's OK.**
- Every photo (profile picture, header, shares, Messages) gets scanned after you pick it: a gold line sweeps it and a box goes around each face.
  No faces = "All clear ✓" and it carries on. A face = "Is this you?" (profile picture/header, one face) or "Did everyone in this photo say OK?", and they push "Yes, it's me" / "Yes, everyone said OK", or pick a different photo.
- The server checks again (Google Vision) and won't take a photo with a face unless that OK came with it. It never checks WHO a face is.
- Spins: the post screen has "Other people are in this Spin, and they all said OK". Without it, a Spin whose picture shows 2+ faces is turned away.
- Profile pictures and headers: move and zoom before the scan.

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

## v91 (2 Oct 2026): the tour walks them through it
- [x] First screen points at the ? button: tap it any time and the tour comes back.
- [x] Each step's gold button (Add it now, Say something now, Make one now, Share it now) starts THE COACH in feed/tour.js: a gold ring and one short line on the real button to tap next, on the real screens. It moves on by itself and never blocks a tap.
- [x] Done: the tour comes back on the next step. Backed out: it comes back on the same step.
- [ ] Not yet tried on a real phone: a real picture upload, a real recording, and the phone's own share list.

## v92 (2 Oct 2026): Spins show in the Porch feed
- [x] Mike picked mockup B: a square picture with a play button, "Tap to watch". A tap opens the Spin player. Love this, Me too, Comment and Send work on it like any share.
- [x] Every Spin shows in the feed by itself (Everyone and Friends). No SQL: each Spin already had a share row.
- [ ] Not yet seen with a real Spin on a phone.

## v93 (2 Oct 2026): cleanup
- [x] Sample posts and sample people are off for everybody. The "Show sample posts" switch is gone.
- [ ] Real test posts and Spins in the database: Mike picks what goes.

## v94 (2 Oct 2026): names nobody can take
- [x] supabase/porch_29_names_taken.sql: recoverymisfits, admin, mod, staff, slurs and X-rated words can't be used in a new account name or a profile NAME. Reads past tricks (Rec0very.M1sfits). People who already have a name keep it.
- [x] House accounts: `insert into name_passes values ('thename');` lets that one name sign up one time.
- [ ] Mike runs the SQL.

## v95 (2 Oct 2026): the house account
- [x] supabase/porch_30_house_account.sql: recoverymisfits, no email, can post, tester, 60-second Spins, moderator, shows as "Recovery Misfits". Run it, add the user in Supabase, run it again.
- [x] recoverymisfits is on the beta tester list in account.html and feed/porch.html.

## The house account posts the Meme of the Day at 6am (2 Oct 2026)
- [x] supabase/functions/porch-daily: posts today's meme from recoverymisfits, once a day, never before 6am Eastern. Reads the site's own /data/meme-days.json.
- [x] supabase/porch_31_daily_meme.sql: the 6am timer.
- [ ] Mike deploys the function, then runs the SQL.

## v97 (2 Oct 2026): the account switcher
- [x] Hold a finger on the Account button in the bottom rail (every page): a sheet lists every account signed in on this phone, tap one to switch, or Add account. No password again.
- [x] Also in the Porch menu (Switch account) and on the account page (Switch or Add Account).
- [x] Each account keeps its own sober date; a house account never wears somebody's.
- [x] Signing out of one account hands the phone to the next one on the list.
- [x] spiritual_misfit is on the beta tester list (v96).
- [ ] Not yet tried on a real phone: the long press itself.

## v98 (2 Oct 2026): the daily prayer, from spiritual_misfit
- [x] data/prayers.json: the 365 prayers, one per date. Edit a line and push to change one.
- [x] supabase/functions/porch-daily now also posts the day's prayer at 7am Eastern from spiritual_misfit, as a saying card, a different background each day.
- [x] Saying cards can show up to 200 characters (people still write 150 at most).
- [x] supabase/porch_33_daily_prayer.sql: the timer, now meme at 6 and prayer at 7.
- [ ] Mike: push, deploy porch-daily, run porch_33.
- [ ] Six prayers say drink or drinking (Jan 11, Mar 17, Jun 6, Jun 18, Oct 23, Dec 9). Mike decides if that stays.

## v99 (2 Oct 2026): two new saying cards
- [x] A black chalkboard in a wood frame, and a neon sign on a brick wall. 14 cards now, for everybody's sayings and the daily prayer.
- [ ] Mike: push, then deploy BOTH functions (porch and porch-daily) so the two new cards are allowed.

## v100 (2 Oct 2026): switching accounts no longer pops the coin
- [x] Each account keeps its own record of the last coin and Survival Pile card it was shown (assets/account.js, coins.js). A real milestone still pops.

## v101 (2 Oct 2026): the account page
- [x] "Set up my profile" no longer shows for a profile that is already set up. The page asks the Porch (picture, bio or name) instead of trusting a note one browser kept.
- [x] On the account page, the Account button in the bottom bar opens the switcher. There is also a Switch pill next to "Signed in as".
- [x] Desktop: holding the mouse on the Account button no longer gets cancelled by the browser trying to drag the link.

## v102 (2 Oct 2026)
- [x] "Your app account" is off the Porch menu. Everything it led to is already closer: sober date on the bottom bar, Sign out and Switch account in the menu, Delete my account in Edit profile. The account page itself stays (sign up, sign in, add account).

## v103 (2 Oct 2026): the Porch menu, smaller and on paper
- [x] Paper color, two buttons to a line, about half the height. Notifications (it's the bell) and My coins are off it. Switch account has the round arrows, Sign out is in red, Reports is a small button for moderators only.

## v104 (2 Oct 2026): every pop-up menu on paper
- [x] All the sheets that slide up from the bottom are the paper color now: the three-dot menu, the share sheet, sign-in prompts, the rules, comments, photo choices, the account switcher. Full screens and the tutorial stay dark.

## v105 (2 Oct 2026)
- [x] The prayer account is `spiritualmisfit`, no underscore (Mike: "i dont want an underscore"). Lines above that say spiritual_misfit mean this account.

## v106 (2 Oct 2026): your picture shows
- [x] The switcher now asks for pictures as the signed-in person, so Members-only profiles show their face.
- [x] The Account button in the bottom bar wears your picture on every page, not only the Porch.
- [x] On the Porch, the picture and menu come back if the bar gets rebuilt (it does after an account switch).

## v107 (2 Oct 2026): more cards, and a picker you can see
- [x] The card picker is two rows now, Colors and Paper and Fun, with every card in sight (it was one row you had to swipe, and a desktop can't swipe).
- [x] Five new cards: parchment, notebook paper, galaxy with neon purple writing, blush pink with dots, cotton candy. The chalkboard lost its wood border. 19 cards.
- [ ] Mike: push, then deploy BOTH functions (porch and porch-daily).

## v108 (2 Oct 2026): Use my location
- [x] It WAS saving; the page said it didn't. Database jobs that hand nothing back answer with an empty reply, and the page choked on that. Fixed for every such job (location on and off, long-Spin yes/no, and others).
- [x] Clearer messages: blocked in the browser, couldn't find you, or this device has no location.
- [ ] Not yet tried on a real phone or the Play Store app.

## v109 (2 Oct 2026)
- [x] The "Alerts on iPhone" six-step screen no longer pops up after somebody posts. It is still under the bell, in Alerts.

## The house account posts a joke every other day at noon (2 Oct 2026)
- [x] data/moments.json: Mike's 150 Moments of Questionable Serenity, in order, then it starts over.
- [x] supabase/functions/porch-daily posts one from recoverymisfits every other day at noon Eastern, as a saying card.
- [x] supabase/porch_34_daily_moments.sql: the timer with the noon knock.
- [ ] Mike: push, deploy porch-daily, run porch_34.

## The reels for Spiritual Misfit (2 Oct 2026)
- [x] scripts/upload_house_reels.py: sends the 100 reels from ~/Downloads/RM-House Accounts to the video host once, in order. Safe to run again.
- [x] supabase/functions/porch-daily: posts them as Spins from spiritualmisfit. Six to start (dated one a day going back), then one every other day at 5pm Eastern until they run out. House Spins don't expire.
- [x] supabase/porch_35_house_reels.sql: the waiting list and the 5pm knock.
- [ ] Mike: run porch_35, then the paste command (it asks him to make up an upload password).
- [ ] Not tested against the real video host yet. The upload was tested against a stand-in.

## v110 (2 Oct 2026): a third house account
- [x] shitmysponsorsays, shown as "Shit My Sponsor Says". Made on the site the normal way, then supabase/porch_36_sponsor_account.sql sets it up. On the tester lists.

## Two more house lists (2 Oct 2026)
- [x] Shit My Sponsor Says: data/sponsor.json, 200 lines on the yellow legal pad card from shitmysponsorsays. Ten to start, then two days on and one off at 7am Eastern.
- [x] Spiritual Misfit picture memes: data/spiritual-memes.json and assets/house/spiritualmisfit/. Five to start, then one a day at noon Eastern. 94 of the 100: numbers 005, 046, 057, 063, 080 and 092 arrived damaged.
- [ ] Mike: make the shitmysponsorsays account on the site, run porch_36, push, deploy porch-daily.

## Welcome Matt's pinned Spins (4 Oct 2026)
- Three dancing-robot Spins (welcome to the party / one day at a time / saved you a seat), made in ChatGPT.
- `scripts/upload_matt_spins.py` uploads them (numbers 4001 and up); `porch-daily` posts them from welcomematt, already pinned.
- To swap one later: unpin and delete it as Matt, then upload a new one with the next number.

## Hashtags + Tag a group (4 Oct 2026, v162)
- A #word in a share, a comment or a Spin's words is a tag. Tap it: one page with everything that has it. `supabase/porch_50_tags.sql` keeps the list.
- Typing # shows a picker: the tags people use most, then a starter list (path-neutral, in `feed/porch.html` STARTER_TAGS).
- TAG A GROUP: in a new share, an edit, a win and a Spin. Only open (anybody can join) groups you're in. Shows as a button under it that opens the group. Checked on the server (porch + spins functions).
- Not done yet: hashtags on a card-style share (the words on the picture) are counted but can't be tapped; reshares can't tag a group; no way to change the group on a Spin after it's posted.

## SOBER RIOT + group pictures (4 Oct 2026, v163)
- SOBER RIOT: the soberriot account (house account) and the open group recoverymisfits.org/groups/sober-riot, kept by soberriot and recoverymisfits (`porch_51_sober_riot.sql`). Art in `assets/house/soberriot/` (avatar, cover, logo).
- A share on the Porch tagged with a group counts as the group being used, so a tagged group does not close after 90 quiet days.
- GROUP PICTURES: any group can have a picture and a banner. Keepers (and moderators) tap Edit on the banner, or the ⋯ menu. Shows in the Groups list, the group page and the GROUP button under tagged shares (`porch_52_group_pictures.sql`, porch function `group_picture`).
- STILL TO DO for SOBER RIOT: the memes (ChatGPT is drawing them from `sober-riot-300-lines.txt`), then the timer that posts a few a day from soberriot, each tagged to the group.

## A group belongs to its keepers and members (4 Oct 2026, v165)
- Mike: "just keeper and co keeper and who they choose, i dont need to be a part of everything."
- A site moderator who has NOT joined a group can no longer read it, see who is in it, take people out, or change its address, picture or banner (`porch_53_groups_belong_to_keepers.sql`, porch function, page).
- A moderator still: looks at a new group before it opens, can close or reopen a group, and sees a group share only if somebody reports it.
- The wording on the Groups screens no longer says moderators can look in.

## The group page shows its tagged Porch shares (4 Oct 2026, v166)
- Shares out on the Porch that are tagged with a group show on that group's page under ON THE PORCH, to everybody, joined or not. So a newcomer who taps the GROUP button never lands in an empty room.
- What members share inside the group is still members only, under IN THE GROUP.
- SOBER RIOT memes: 60 in line (`data/sober-riot.json`), 3 a day. New batches from ChatGPT go in `Downloads`, Claude adds them.

## Photo stickers + Polaroid collage (4 Oct 2026, v167)
- `feed/photo-fun.js`. In Share a photo: ✨ Add stickers (Words, Stickers, My days; up to 8; drag, pinch or pull the corner; Done bakes them into the photo), and Make a collage (2 to 4 photos as Polaroids on a wood table, corkboard or black, a hashtag across them, Shuffle, Undo).
- All on the phone. What posts is one ordinary photo, so the photo check and everything else is unchanged.
- Fonts: `assets/fonts/dancing-script-700.woff2`, `permanent-marker-400.woff2` (both free to use).
- NOT DONE YET: writing a few words on each Polaroid (it was in the mockup); the collage hashtag is only in the picture, it is not added to the words under the share; stickers on photos in Messages.

## The share screen, simpler (4 Oct 2026, v168)
- Mike: "the full post ... its really what you should be editing, and the small post container is the preview hanging out on the right with share button by it." You now build the real post (your words, photos, tag pill and group button show on it as you add them).
- One row of buttons at the bottom: Photos, Stickers, Collage, Card, Tags. A small number shows when you've used one.
- TAGS is one sheet: what you're bringing, tag a group, and hashtags to tap.
- The little Preview by Share opens HOW IT'LL LOOK for every kind of share, with its own Share button.
- Adding a photo to a words share makes it a photo share; taking the last photo off makes it words again. "Just words / Make a card" is now the Card button.
- Class names to know: the button row is `.ctools` (NOT `.cbar`, that is the comments bar) and a greyed button is `.off` (NOT `.dim`, that is the dark overlay).

## The numbers (4 Oct 2026, v169)
- Mike reversed the old "no counts anywhere" rule: "its what makes social media social media."
- VIEWS on Spins, counted the most liberal honest way: every play and every loop, by anybody, the maker included, signed in or not. Shown on the Spin, on its tile in the feed and on profile tiles (`porch_54_counts.sql`, `porch_spin_view`).
- HEARTS, COMMENTS and RESHARES show as numbers next to their icons on every share (hidden at zero). FRIENDS count shows on profiles; the list itself stays private.
- NOT DONE, ON PURPOSE: nothing is multiplied and no hearts are made up. Mike asked about 3x; Claude said no to that part and Mike is talking to his sponsor about it.

- 4 Oct 2026: SOBER RIOT memes 121-220 added (no version bump, nothing on the page changed). The line is now 220 memes, about 73 days at 3 a day. The first-50 look-alikes are spread thin through the rest. ChatGPT lines 221-371 are still unmade; Mike has them in a zip for later.

## Share photos: two big buttons (4 Oct 2026, v171)
- [x] "Share photos" (was "Share a photo") opens on two big picture buttons: TAKE A PICTURE / PICK FROM MY PHONE. No picker pops open by itself anymore.
- [x] One picture goes straight to the share screen. 2 to 4 pictures come up already made into a collage, with one switch under it: COLLAGE / SWIPE THROUGH. "+ Photos" now adds to a collage (up to 4). The bottom "Collage" button is now "Look" and only shows while it is a collage.
- [x] Clear headers: SAY SOMETHING, SHARE PHOTOS, MAKE A CARD, EDIT SHARE (was "NEW SHARE" for all).
- [x] "Celebrate a win" is off the + menu (Mike: coins and piles already have share all over them). The win layer and `openWin` code are still in porch.html, just unreachable; old wins still show on profiles.
- [x] v172: Spin view counts are just the eye and the number, no word "views".
- [x] v173: the "Welcome to the Porch" tour never pops up by itself anymore (it was every visit until "Don't show me this again" was ticked; that checkbox is gone). Still opens from the menu, "How the Porch works", and from the small Getting started strip.
- [x] v174: sticker editor on iPhone: the Words and Stickers lists were squashed ("menus all jacked up"); rows are a fixed height now. NOT tested on a real iPhone from here; Mike to confirm.

## Filters (4 Oct 2026, v175)
- [x] A Filters button on the share screen (photo shares only, not when editing an old share): Normal, Black & White, Glow, Golden Hour, Pop, Faded. Tap one and see it on the picture; it goes on every picture in the share, collage included.
- Done by hand on the pixels in porch.html (`filtImg`, `FILT`), because iPhone's canvas has no built-in filters. `photos` stays unfiltered; `shownPhotos()` is what is shown and sent.
- Known and left: the filter goes over stickers too (Black & White makes the stickers gray). No face-aware "sparkly eyes" filter; that needs a face-tracking add-on and is its own project.

## Poof: a disappearing picture in Messages (4 Oct 2026, v176)
- What it is: one picture in a one-on-one chat, opened ONCE, 10 seconds, then gone. 💨 button in the chat, next to the camera.
- Mike's rules, all enforced by the database (`porch_55_poof.sql`, `porch_poof_can`): friends, at least 5 messages EACH way (Poofs and unsent ones don't count), and BOTH people have flipped Poof on. It starts OFF. Not in group chats.
- The switch: the Poof sheet (opens from the 💨 button, and from Edit profile > POOF > "What's a Poof?"). Table `porch_poof`; only you can read your own switch. The other person's switch is only told to you once the rapport is there.
- Picture rule = the Messages rule ("today's rule", Mike): spicy is fine, FULL NUDITY IS BLOCKED (`dmPhoto` in the porch function). Mike decided NOT to loosen this: there is no way to check age, and "I don't want this to turn into some porn site."
- Where the picture lives: bucket `porch-poof`, private with NO read policy, so no phone can read it. `poof_open` hands it over once inside the answer (no link). Opened Poofs come off the server 15 minutes later (`poofSweep`), unopened ones after a day.
- Reporting: "Report this" on the picture, or tap "Poof opened" in the chat within 15 minutes. A reported Poof is KEPT and shows on the moderator reports screen under that person ("Reported Poof:"); it comes off the server when a moderator handles the report.
- Known and left: screenshots can't be stopped on a web based app (the sheet says so). A phone still on an old version shows a Poof as a broken picture until it updates. If full nudity is ever wanted: it needs an age-estimate service first, and a lawyer's look (NCMEC reporting duty).
- [x] v177: the 💨 button is in every one-on-one chat with a friend from the first message (dim until ready). Until Poof is ready for the two of them it opens the sheet: what Poof is, the switch, and a line saying what is left ("opens up once you've each sent 5 messages", "they don't have it on yet").
- [x] v178: hearts, comments and reshares always show a number on every share, 0 included (they were blank at zero). A reshare now reads "username" with "💛 reshared" under it.
- [x] v179: NEVER A ZERO. Hearts, comments, reshares and Spin views only show a number at 2 and up, on the feed and in the Spin player (`showN` in porch.html). Under 2 the icon stands alone (the Spin player shows its word: Love, Talk, Respin). Hearts are pink (#ff5fa2). This replaces v178's "0 included".

## Profile row: Active now + Friends + Groups (4 Oct 2026, v180)
- [x] Under the name on every profile: "Active now" (green dot) or "Active 2h ago", then Friends and Groups counts. Mike: no followers ("you either are their friend ... or you're not"); on for everybody, no off switch. Coins and Survival Pile stay off (they give away the sober date).
- `porch_56_profile_stats.sql`: `porch_seen` (no phone can read it), `porch_ping()` (the page calls it every 3 minutes while showing), `porch_profile_stats(user)`. Last-on time is only told to signed-in people, never to someone blocked.
- Never a zero applies: a count shows at 2 and up. House accounts never show Active. Nothing shown after 7 days away.
- Not done: green dots on avatars elsewhere (feed, Messages, friends list). Profile only for now.
- [x] v181: Share moved to the right end of the bottom row on the share screen (always on screen). A Share shows in the top bar only while the keyboard is up, since the bottom row hides then. The "Look" button is gone (Mike: a collage is wood, "what you get is what you get"); that also drops the hashtag strip on the collage, Corkboard/Black, and Shuffle. Stickers and Filters only show once there is a picture.

## realmrhyde: an Original Manuscript short every morning at 6:13 (4 Oct 2026, v182)
- The 30 shorts (1938 original manuscript lines, words on screen + music) are in `~/Downloads/manuscript-shorts`. Made here with a small page + ffmpeg; the wording was checked against anonpress.org's copy through a reader tool, not letter by letter.
- Porch: `scripts/upload_hyde_spins.py` sends them to the video host (numbers 5001+). `porch-daily` > `hydeSpins` posts ONE a morning from realmrhyde at the first knock at or after 6:13am Eastern (never after noon, never two in a day). `porch_57_realmrhyde.sql` makes it a house account and adds the 6:13 knock (`porch-hyde-613`, 10:13 and 11:13 world time to cover the clock change).
- YouTube: `~/Downloads/manuscript-shorts/schedule_youtube.py` uploads them to @tacomike417 with the dev station's sign-in and tells YouTube to publish one a day at 6:13am Eastern. YouTube allows about 6 uploads a day through this door, so it takes 5 runs; it keeps its own list of what went up.
- They run out after 30 days. Mike chose the realmrhyde account posting on the Porch (not a group).
- [x] v183: LINK CARDS. (1) The preview card for a link now shows while you write and on the Preview screen (porch function action `link_preview`; same safety check as posting). (2) A YouTube link (watch, youtu.be, shorts, live) gets a thumbnail with a play button and PLAYS IN THE POST (youtube-nocookie embed); the title comes from YouTube itself. Old posts with a YouTube link get the play button too. Still no card when the share has a photo.
- [x] v183 also fixed a real bug found on the way: two functions were both named `previewHTML` (link card and profile preview), so the second replaced the first and a link card on a share was drawing as a profile card. The link one is `linkCardHTML` now.
- [x] 4 Oct, after v183: on the live site the link check answered "Links can't be checked right now" for every link, so NO link could be posted or previewed. YouTube links now skip the two outside checks (`TRUSTED` in the porch function). The function also reports which check is down (`why`, on the `link_preview` action only) so the real cause can be found; other links stay blocked until that check is fixed.
- [x] 4 Oct: the cause was Google's scam check (Web Risk) answering 403 on the key. Mike chose Cloudflare's family filter as the ONE outside link check; the Google check is no longer called. All links can post again.
- [x] 5 Oct: Welcome our new folks shows people with NO profile picture too (initials). `porch_58_new_folks_initials.sql`. Was pictures-only since porch_43; Mike couldn't find a buddy who had just joined.

## Choppy Spins fixed (5 Oct 2026, v184)
- Found: a member's uploaded Spin played at 25 frames a second with about 1 in 6 frames missing (everyone else's house Spins are 30). The re-make on the phone (`shrink` in spins.js, WebCodecs) was dropping frames.
- [x] The phone no longer re-makes a normal video. The original goes straight to the video host, which converts it on its servers. Only a file over 80 MB is still re-made on the phone, and then the frames are counted; under 97% kept and the original goes up instead.
- Cost: uploads are bigger (a 15-second phone video is about 20 to 40 MB instead of about 6), so the "Uploading your Spin" bar takes longer on a slow connection.
- Spins already posted are not repaired; they have to be uploaded again.
- [x] v185: Spins upload in the background. No bar or percentages. A card says "You did it!" and to keep browsing; a card with **Watch it** when it's live (with the pop sound); a red card if it failed. The upload only runs while the Porch page is open, so the browser asks before leaving mid-upload. NOT done: a bell/phone alert when it's ready (the card only shows if they're still on the Porch).
- [x] v186: a profile is ONE grid under the Spins row: their shares, the coins/wins they shared, and their RESHARES (the tile shows the share they passed along, with a small reshare mark bottom right). The WINS tab is gone. Still not on a profile: shares made inside a group.
- [x] v187: tapping a name now ALWAYS shows that profile. Bug: a screen that was already open underneath (a profile, when the friends list was opened from it) got redrawn down below instead of coming to the front. `open()` now raises a screen that is already in the pile. Fixes names tapped in the friends list, comments, tag pages and groups opened over a profile.
- [x] 5 Oct: SHARE DESK checked on the live site (it works: 1 to share, 5 done). Two gaps fixed: (1) it only listed recoverymisfits; now a picker at the top switches between recoverymisfits and realmrhyde. (2) no YouTube tick; videos now have YouTube / Instagram / Facebook (`porch_59_share_desk_youtube.sql`). realmrhyde's are done when YouTube is ticked; recoverymisfits' still need Instagram + Facebook. On a computer \"Get the video\" downloads the file; the share menu with YouTube only exists on a phone.

## BEFORE OCT 20: THE SOCIAL LIST (5 Oct 2026, Mike: "make a list, we'll start working on these one by one")
- [ ] 1. WHO TO FOLLOW ON DAY ONE. "Find your people" is switched off (SU_FIND). A new person finishes sign-up with nobody to follow.
- [ ] 2. "YOUR VIDEO IS UP" ALERT. A bell alert and a phone alert when a Spin finishes uploading, so it is really obvious. (v185 only shows a card while the Porch is open.)
- [ ] 3. SEE WHO LOVED IT. Tap the heart count, see the names.
- [ ] 4. WHAT'S POPULAR. A most-loved / top of the week spot.
- [ ] 5. PIN A SHARE to the top of your profile.
- [ ] 6. TRY POOF between two real accounts on two real phones (never done).
- [x] v189 (5 Oct): ONE BIG VIEWS NUMBER on every profile (eye + number, 2 and up). Profile opens + shares seen on a screen + Spin plays. `porch_60_profile_views.sql`. Your own profile opens don't count; everything else does, every time.

## 5 Oct 2026: SIGN UP IS ONE HONEST SCREEN (v190)
Mike: "Not for alcoholics, they want straight forward right out the gate. If they detect games they'll bail."
- account.html: sign-up used to be seven screens. Now one: "Here's the deal. No games." then name, password, email (only if you want to post), one tick (18 or older + house rules), I'm In.
- Typed an email: the next screen is the 6-digit code (same porch-confirm door the Porch uses). "Do This Later" is the way out.
- No email: the write-it-down card, like before. Then the sober date (can skip).
- The old "18 and up" and "pick a level" screens are still in the page but never shown.
- UNTIL OCT 20: the email box only shows on a beta phone. Everyone else sees "Posting opens October 20" in the deal box and gets in to read. Flipping PORCH_OPEN in account.html turns the email box on for everybody.
- NOT TESTED LIVE YET: checked the layout at phone width and that the tick is enforced. Nobody has made a real account or received a real code through this screen. Test on a beta phone before telling anyone.
- The Porch still offers "Confirm an email" when somebody with no email goes to post. They were told on the sign-up screen, so it is not a surprise.
- v191: "Your sober date is for you and only you" is now said in three places: the sign-up deal box, the date picker on every page (it used to say "Saved only on this device"), and the date step after sign-up (already there).

## 5 Oct 2026: OUTSIDERS CAN'T NOSE AROUND (v192, SQL step 61)
Mike: "On the site everything is fair game if you have the level 2 account. What I don't want is outsiders to be able to nose around."
The mission, in his words: a recovery network for people in recovery, by people in recovery, where a boss googling your name before an interview does not find your recovery story.
- SQL step 61 (porch_61_confirmed_read.sql): an account with no confirmed email reads only the house accounts and Public profiles, the same as somebody not signed in. Posts, profiles, comments, Spins, who-loved-what, the new folks row and most active are all covered. Enforced in the database, not just hidden on the screen.
- Porch: a no-email account sees a gold line "You're seeing the house posts" with an Add my email button.
- Sign-up deal box reworded to match: name + password = readings, tools, counter, house posts. Email = the Porch.
- Already true before today: the Porch is closed to search engines, profiles start Members only, no real name asked, no email kept.
- STILL TO CHECK (not done): the smaller counting functions (profile stats, post counts, friend count, top tags, groups list) still answer for a no-email account. They give numbers, not names or words. And the optional profile-name box: can members search by it.
- STILL OPEN: a member who picks Public and shares a Spin to Facebook puts their @name and picture on Facebook. Nothing warns them at that moment.
- TESTED on a pretend Porch (four kinds of people), NOT on the live one.
- v193: the sober date line is shorter ("Just for you. Nobody sees it unless you share it.") and sits ABOVE the wheels in the date picker. It came off the date step screen. "Not Right Now" is now a small link lower down: "Nah, I'm good, take me to The Porch" (or "take me home" when that is where it goes).
- v194: the account screen is in order: 1. Pick My Sober Date, 2. Set Up My Profile, then lower the small "Nah, I'm good, take me to The Porch" link, then Sign Out. Gone: the "One more thing" box, the syncing line, and the big Switch or Add Account button (the Switch pill up top still does it). "Nah, I'm good" now goes to the plain Porch (not the profile screens) whenever the Porch is open for them.
- v195: buttons 1 and 2 on the account screen each have their number in a gold circle beside them.
- v196: "Delete my account" on the account page is pushed far below Sign Out, off the first screen. It stays because the privacy policy points to it and the Play Store requires it.
- v197: "Delete my account" is off the account page for good (Mike: "it's in edit profile, that's enough"). The one in Edit profile on the Porch deletes the whole account, app and Porch. The privacy policy now points there. TO CHECK: that a no-email account can reach Edit profile, since it is their only way to delete.
- v198: signing in no longer shoots the coin (or the pile card) at you. What a phone has shown is remembered on that phone only, so a private window, a new phone or cleared data made an old coin look new. Signing in now marks it quietly. A real new milestone still pops. NOT TESTED LIVE.
- v199: THE FRONT DOOR. A member with a sober date and a profile who signs back in now gets: picture + name, the day count strip, a big gold Porch card ("Pull up a chair") with up to four recent pictures from their friends' shares, today's reading, the next Survival Pile card (days only, never which card), My profile, Sign Out. Rows with nothing to show are left out. Anybody with a date or profile still to do gets the numbered 1 and 2 screen. NOT TESTED LIVE: drawn at phone width with stand-in data only. The friends' pictures, the reading title and the pile countdown have not been seen with real data.
- v200: the tagline is "Good people between meetings" everywhere. Fixed the last five spots that still said "Good company": the beta invite page, shared Spin links (two places), shared profile links, and the new front door. The invite line on the Porch now says "could use some good people". LEFT ALONE: Matt the greeter says "You're in good company here" (it lives in the database, step 49), and a song in the Spin music list is titled "Good Company".

## 5 Oct 2026: FRIENDS SHOW ON PROFILES, ONE RULE (v201, SQL step 62)
Mike: "by being on a recovery site, means most likely you are in recovery, and that's as far as anonymity goes ... showing the list isn't harmful. I'd say just show it." And: "public people can show up, non public no ... one rule."
- THE ONE RULE for the whole site: inside, among confirmed members, everything is fair game. Outside, a person only ever shows up if they chose Public themselves. Being on somebody else's Public page never shows a locked person.
- SQL step 62 (porch_friends_of): a confirmed member sees all of a person's friends. Anybody else only sees a Public profile's Public friends. Blocks, breaks, frozen and house accounts are left out. The friends table itself is still locked.
- Porch: the FRIENDS strip and "See all" now show on everybody's profile, not just your own. The friends number opens the same list. Somebody who only sees Public friends sees that count, not the full one.
- Already true (checked in the rules, not changed): a locked person's comment on a Public post does not show to outsiders, and outsiders never see who loved or reshared anything.
- NOT DONE: the shared-link pages (recoverymisfits.org/name) still show no friends at all, which is the safe side. TO CHECK: that nothing locked leaks through the shared Spin and profile link pages.
- TESTED on a pretend Porch (confirmed, no-email, outsider, own page, public and locked friends). NOT on the live one.
- v202: while a profile is open on the Porch, the address bar shows recoverymisfits.org/<name> (yours and everybody else's). Going back restores the Porch address. A signed-in member who opens or reloads a /<name> link goes straight to that profile in the app. NOT TESTED LIVE: watch the phone's back button and a reload while on a profile.

## v203 (5 Oct 2026) - the outside profile page is now "the big invite"
- `functions/u/[handle].js`: what a non-member sees at recoverymisfits.org/<name> for a PUBLIC profile.
  Big cover, picture and name in the middle, Founding Misfit + Misfit since, bio, a gold "Pull up a chair" box
  with an I'm In button, up to 5 Spins, then a "The rest is inside" tile. Members-only profiles are unchanged.
- `supabase/porch_63_public_card_name.sql`: the public card also hands over the name people see and the join date
  (Public profiles only). Until it is run the page still works and shows @name with no "since".
- Not on the outside page yet: Public friends strip, shares grid. Spins there still open the Spin link page.

## IDEAS, parked (5 Oct 2026) - Mike is thinking, nothing built
- "Go say hi to ___" card: the app hands a member one person a day to go to (brand new, been away, or posted and
  got nothing back). Mike: recovery is "I go to you", not "you come to me". His worry: a new person who reaches
  out and hears nothing back. Possible answer: only people who've been around get the card, new people never do
  and are never told anyone was sent. Keep it from feeling like a dating app (no big photo, hello out in the open).
- Dropped: the Porch Light ("rough night" button). Wrong direction, it has people waiting to be rescued.
- **PASS THE COIN - Mike likes it. BRING IT UP AT 300 MEMBERS.** When someone hits a milestone and chooses to
  share it, their coin goes around; members hold it and leave one line; it comes back with every name and line
  on it, theirs to keep in the Survival Pile. Mockup: the "Pass the Coin" design (2 phone screens). Still his to
  call: how long it goes around (guessed one day) and whether the finished coin is private (guessed yes).
  Waiting on 300 so a coin never comes back near empty.

## v204 (6 Oct 2026) - links on a profile
- Edit profile has one "+ Add a link" box (like YouTube): paste any link, the app works out what it is
  (Instagram, Facebook, TikTok, YouTube, X, Snapchat, Podcast, or a plain website). 5 at most. Plain icons, not logos.
- MEMBERS ONLY, always: links never show on the outside page, even for a Public profile. They live in their own
  table (`porch_links`) that only the step 64 functions can reach.
- Earn it: 30 days on the Porch before adding links. Founding misfits and house accounts can right away.
  Under 30 days the box says "Links open up after 30 days on the Porch. N days to go."
- `supabase/porch_64_profile_links.sql` has to be run. Until then the Links box just doesn't show.

## v205 (6 Oct 2026) - no links in the bio
- Mike: "in the bio don't allow links." A bio shows as plain words now, never tappable, on profiles and in the preview.
- A bio with a web address in it doesn't save. Edit profile says "No links in the bio. Add it under Links, right below."
  Same check on the sign-up walk.
- This is checked in the app, not in the database. A bio saved before today that has an address in it still shows,
  as plain words. Could add a database check later if anybody works around it.

## v206 (6 Oct 2026) - ASK ME ABOUT + MY SONG (built; mockup: the "Ask me about" design)
- **Ask me about**: up to 3 conversation starters under the bio. Members only. Type anything (Mike: "if they want
  to act a fool they can"). Edit profile is a fill-in-the-blank with a changing example. No links allowed in them.
- Tap a starter. Friends: Messages opens with the first line typed. Not friends yet: a paper sheet, the note already
  written, one Send. It goes as a friend request with the note on it. One note per person until they answer.
- The other person gets ONE alert with the note, "New this week" when they are, and **Be Friends and Reply** /
  **Not Now**. Yes makes them friends and the note is the first message. Not Now is quiet, the asker still sees
  "Requested".
- SAME DOORS: every friend request button now says Be Friends / Not Now (was Confirm / Delete).
- A brand-new account (under 3 days) can send an Ask, 3 a day. Plain Add Friend keeps its 3-day wait. (Mike picked this.)
- **My song**: type a song, pick it from a short list, done. No pasting. Shows as a small record under the bio.
  Tap it: Play on YouTube (a search for that exact song), Apple Music, Spotify. Also shows on the outside page of a
  Public profile (YouTube link only).
- The song list comes from Apple's free song search, straight from the phone. Only the title and artist are kept.
  NO cover art and NO sound: Apple's rules only allow their art and previews on pages that promote Apple. The Apple
  Music button is there partly for that reason.
- Files: `supabase/porch_65_ask_and_song.sql` (run it), `supabase/functions/porch/index.ts` (deploy it: new
  `ask_send` action), `feed/porch.html`, `functions/u/[handle].js`.
- NOT DONE / OPEN:
  - The phone buzz for an Ask still says "sent you a friend request" (porch-push not touched).
  - Tap a starter to find other misfits who wrote the same thing: later, when there are more people.
  - Only show starters on people who've been on lately, so a new person isn't left waiting? Not built.
  - The YouTube tap is a search, not one hand-picked video.
  - Not tried on the live site yet: the song lookup from a real phone, and a real Ask between two accounts.

## v207 (6 Oct 2026) - song lookup backup
- Mike got "song lookup isn't working" on first try. It worked from his computer's Chrome with his account
  (typed, picked, saved), so the code path is good. Best guess: Apple's limit of about 20 lookups a minute from one
  connection, or his phone blocking Apple. Not confirmed.
- Now three tries in order: Apple from the phone, our own `functions/api/song.js` (asks Apple from the server,
  answers kept a day), then Apple the script way. Waits 0.7s after typing and needs 3 letters, so fewer lookups.
  A search already done this visit is answered from memory.
- His song got set to Simple Man / Lynyrd Skynyrd during that test. He can change it in Edit profile.

## v208 (6 Oct 2026) - links are just icons
- Mike: "we just need to display the icons, this is getting bloated." On a profile, links are small round icons
  in one row (no words). In Edit profile they are small chips in one row (icon, name, X), not a tall list.
  Still 5 links at most.

## v209 (6 Oct 2026) - song lookup, second pass
- Found: Apple answers a normal browser fine, but Mike's test tab was pretending to be an iPhone and Apple did not
  answer that. And our own `/api/song` got a "no" from Apple too (503). So real iPhones would have had no song list.
- `/api/song` now asks Apple the way a normal browser does, and if Apple still says no it asks Deezer's song list.
  `/api/song?q=simple+man&why=1` shows what each one answered.
- STILL TO CONFIRM on the live site after the push (Claude checks before Mike tries again).

## v210 (6 Oct 2026) - MY SONG IS PARKED
- Mike: "park this whole music thing for now until we figure it out, seems like we are pushing something janky."
- Hidden everywhere: Edit profile, profiles, the outside page. One switch in two files: `SONG_ON = false` in
  `feed/porch.html` and in `functions/u/[handle].js`. Flip both to true to bring it back. Nothing was deleted;
  songs already saved (Mike's test one) stay in the database, not shown.
- What has to be figured out first: a song lookup that answers every phone.
  - Apple's free list answers a desktop browser but not an iPhone, and said no to our server.
  - `functions/api/song.js` (asks Apple, then Deezer, from the server) is written but NEVER CONFIRMED live.
    `/api/song?q=simple+man&why=1` shows what each list answered.
  - YouTube's search would give the exact video, but it's about 100 lookups a day free and shares Mike's key.
- Ask me about, links as icons, Be Friends / Not Now: all still on.

## v211 (6 Oct 2026) - THE FEED WAS BROKEN v206 to v210. Fixed.
- Claude named a new function `loadMore` (for the Ask me about box). The feed already had a `loadMore` that fetches
  posts, so the new one replaced it and the feed sat on gray blocks forever. Renamed the new one `loadAskBox`.
- Lesson for next time: before adding a function to porch.html, check the name isn't already there, and look at
  the FEED after every change, not just the screen that changed.

## v212 (6 Oct 2026) - "View my profile" matches the profile
- The preview in Edit profile now also shows the Founding Misfit badge, the Ask me about pills and the link icons.
  Still not in the preview: the friends row, the Active now / friends / groups numbers, and the Spins and shares.

## v213 (6 Oct 2026) - a small sheet before a link opens
- Tapping a link icon on a profile (or in the preview) slides up a sheet with what it is, the address, and an
  Open button. Mike picked this over jumping straight to the page.

## v214 + v215 (6 Oct 2026) - an Ask is easier to follow, both ends
- Mike tested a real Ask (realmrhyde -> tacomike417). It arrived, but tapping the phone buzz landed on the
  asker's profile, not on the note.
- `supabase/functions/porch-push/index.ts` (DEPLOY IT): the buzz for an Ask says "wants to ask you about ___",
  shows the note, and a tap opens Alerts, where the note and Be Friends and Reply are.
- The asker's profile shows a gold-edged card with their note until it's answered.
- **Messages has a Sent tab** (Mike: "a sent messages tab to keep track"). Asks you sent that are still waiting:
  who, what about, your note, how long ago, and Take it back. The tabs only show when something is waiting.
  When they say yes the note moves to Messages as the first message.

## v216 (6 Oct 2026) - Poof icon and tip, report or block on an Ask, 988 in chats
- **Poof icon**: Mike picked option 3 from his sheet (the puff cloud with sparkles). Drawn as our own little
  cloud, sparkle and dots; replaces the wind emoji on the chat's Poof button.
- **Poof tip**: when a one-on-one chat opens, a paper bubble points at the cloud: "This is Poof. A picture that
  disappears after it's opened..." and what's left to do (turn it on, both say yes, trade a few messages).
  Once a day at most, gone in 7 seconds or on a tap.
- **Report or block right on an Ask**: a small "Report or block" link on the Ask alert and on the asker's profile
  card. It opens the same menu a chat's dots open. Blocking takes the request away.
- **988 in chats**: one small line under the typing box in every chat: "Having a hard time? A real person
  answers. Call 988". Same words as the post screen.

## v217 (6 Oct 2026) - the Sent tab is always there
- Mike: "where are my sent messages." The Messages / Sent pills now always show at the top of Messages. Sent with
  nothing in it says "Nothing waiting" and what shows up there. A red count sits on Sent when asks are waiting.
- Leaving a group chat already existed: the dots at the top right of a group chat, "Leave this chat" at the
  bottom, tap twice. Nothing changed there.

## v218 (6 Oct 2026) - Give it a spin on your own profile
- The gold camera on your profile faded out and the ring went red, but nobody slid in: that tile was missing the
  drawing of the misfit taking a selfie. It has him now, same as the one in the feed's Spins row.

## v219 (6 Oct 2026) - the bottom bar: Today, Porch, +, Invite, You
- Mike: "I keep hitting that share button to get to account, it's intuitive, that's just how social media has it."
- THE BAR IS FIVE NOW: Today, Porch, + (middle), Invite, You (bottom right). You is the old Account button moved off
  the brass rail. It kept its id (rmAccountBtn), so your picture, hold-to-switch, and the Porch menu all still work.
- LISTEN, FUN AND TOOLS came off the bar. They are three big tiles on the Today page in a box called "More on the
  shelf", under the stack and above the memes. On those three pages the Today tab stays lit.
- THE + opens the share dial (Give it a spin, Share photos, Say something). On the Porch it opens right there, and
  the choices now rise from the middle. On any other page it goes to the Porch and opens it (porch.html?new=1).
  The floating + on the Porch is switched off.
- THE COIN RAIL: coin on the left, day count in the middle, Sober Since on the right. The plate graphic did not
  change. The wheels are bigger so the count looks crammed again. "Glad you're here" is gone.
- NOT TESTED ON A PHONE YET. Checked in a phone-size browser: the bar, the rail at 2, 4 and 5 digits, a 320px phone,
  and Today lit on Tools. The + dial on the live Porch still needs a look after the push.
- Could do later: a one-time note for regulars, "Listen, Fun and Tools moved to Today."


## v220 (6 Oct 2026) - the + works every time, and opens like Jeff's
- THE BUG: the + in the bar opened the share choices and a second piece of code closed them in the same tap, so it
  only worked once in a few tries. Fixed.
- THE LOOK (Mike: "make it a little fancy for us drunks"): the three choices spring out of the + as brass coins,
  the way the + on Infinite Pulls fans out. Give it a spin goes up, Say something left, Share photos right. A gold
  ring bursts from the button, the page behind goes soft, each coin gets a slow shine, and the + turns into an X.
- It opens above everything now, so it also works while you are looking at a profile.

## v221 (7 Oct 2026) - a way out of the photo check
- Mike: "there's a dead end when a photo is not allowed." The photo check screen (Checking your photo, 1 face found,
  Can't use this one) has an X at the top left now. It just leaves. "Pick a different photo" still opens the chooser.
- WHY A NORMAL SELFIE WAS REFUSED: Google's picture checker scores every photo for "adult" and for "racy" (its word
  for bare skin or revealing clothes). The Porch refuses adult = likely, or racy = very likely. A close-up of two
  people in summer clothes can score racy = very likely with nothing wrong in it. The rule is in
  supabase/functions/porch/index.ts (photoOk and the "scan" action). Whether to loosen it is Mike's call.

## v222 (7 Oct 2026) - the honor system: photos loosened, a report hides the post
- Mike: "we need to loosen up that rule that is going to piss off so many people ... we have to use the honor
  system and trust these guys will do the next right thing. but let the report button definitely flag and take
  down the post until it has been moderated."
- PHOTOS: Google's "racy" score no longer blocks anything. A photo is refused only when Google is very sure it is
  nudity, or very sure it is gore. Same line for the Porch and for messages. (porch function: photoOk and "scan".)
- REPORTS: ONE report on a share or a comment hides it for everybody right away. The moderators' Reports screen
  says "hidden until you look" and the buttons are "Keep it down" and "It's fine, put it back".
- NOT hidden by a report: "Somebody might be in danger" (a cry for help stays up), anything a moderator posted,
  and a report on a whole profile.
- KNOWN TRADE-OFF: any one confirmed member can hide any one post until a moderator looks. The caps that were
  already there still apply (20 reports a day, the 3-day wait). The owner is not told their post was hidden.
- SQL: supabase/old sql/porch_66_report_holds.sql. Function: porch (redeploy).

## v223 (7 Oct 2026) - add or take off photos when you edit a share, and the 988 line moved
- Mike: "went to edit, didn't find add more photos like expected." Edit Share has the Photos button now (4 at most)
  and each picture has an X. New pictures get the same check as on a new share. Pictures taken off are deleted from
  storage. Not on a reshare, a Spin, a coin share or a card. Stickers, filters and collage are still new-share only.
- Mike: "that 988 is easily confused for a text input box. move it to the bottom ... make it a different color."
  On the share screen it sits at the bottom, over the row of buttons, in blue, and "Call 988" looks like a button.
- Function: porch (redeploy). No SQL.
