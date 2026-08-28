// script.js -- plain-text dialogue for the game.
//
// This file is NOT run as JavaScript. The game loads it as plain text
// and reads it top to bottom, so you can edit it freely without
// worrying about quotes, commas, brackets, or any code syntax.
//
// This file is laid out in the SAME ORDER the player experiences the
// story, top to bottom: outdoor walk, then meeting, then outdoor walk,
// then meeting, and so on, all the way to Harrison Corner. Just read
// straight down the file to read the whole adventure in order.
//
// HOW TO EDIT:
//   - A line starting with // and a name, like "//OutsideAA-level1",
//     starts a new SECTION. Everything below it belongs to that
//     section until the next "//SectionName" line.
//   - A line like "scene-timer: 30" sets how many seconds that
//     MEETING scene (AA-level1, CA-level1, GA-level1, EA-level1,
//     CMA-level1) is allowed to run before Bill and Bob leave --
//     30 means 30 seconds. It's config, not dialogue, so it can go
//     anywhere under that section's "//SectionName" line (top of the
//     section is clearest). If you don't add one, that meeting falls
//     back to the game's default. Change the number any time you add
//     or remove dialogue so the scene has time to finish.
//   - A line like "clock: 20:35:00" sets the HUD "TIME LEFT ON
//     EARTH" story clock the moment that section begins -- it's
//     FICTIONAL story time, purely for the HUD display, and has
//     nothing to do with real elapsed time or scene-timer above.
//     Format is HH:MM:SS. If a section has no clock: line, the clock
//     just keeps counting down from wherever it already was -- it's
//     never reset automatically. You decide these times yourself.
//   - A line like "//[pt1]" starts a new dialogue POINT inside the
//     current section. You can add as many as you want: [pt1], [pt2],
//     [pt3], [pt4]... there's no limit.
//   - Dialogue lines look like:
//         bill: whatever Bill says
//         bob: whatever Bob says
//         crowd: an anonymous meeting-room voice (not Bill, not Bob --
//                someone else in the room). Renders as an unattached
//                bubble somewhere in the meeting, not above either of
//                them. Only meaningful inside a meeting section (AA-level1,
//                CA-level1, etc.) -- there's no "crowd" outdoors.
//         building-dialogue: a speech bubble from the current building
//                itself (whichever meeting building is being approached
//                outdoors, Fresh Threads during that event, or Dry
//                People's Club during its stop) -- not Bill, not Bob,
//                not crowd. It's a bubble anchored to the building/sign,
//                not a character. Only works outdoors where an actual
//                building is on screen; a building-dialogue line inside
//                a meeting's own interior section (AA-level1 etc, which
//                plays once you're already inside) has nothing to
//                anchor to and is simply skipped.
//     "bill:" / "Bill:" / "BILL:" all work the same way -- capitalization
//     doesn't matter. Same for "crowd:" and "building-dialogue:".
//   - The same character can talk multiple times in a row, e.g.:
//         bill: first thing
//         bill: second thing right after
//         bob: my reply
//   - Blank lines are just for readability -- add as many as you like.
//   - About 2 seconds pass between each line (see DIALOGUE_GAP in the
//     game code if that ever needs to change).
//
// To add a new dialogue point, just add a new "//[ptN]" block below
// with your lines under it -- nothing else needs to change. Inside a
// meeting, adding a new [ptN] also adds a new stop/wander beat to that
// meeting's own cinematic automatically -- you don't need to touch any
// game code for that either.
//
// SECTIONS IN THIS FILE, IN STORY ORDER:
//   OutsideAA-level1    -- on the street, walking toward the AA meeting.
//   AA-level1           -- once you step inside the AA meeting. pt1,
//                          pt2, pt3... each fire at their own stop as
//                          Bill and Bob move around the room (walk ->
//                          stop -> dialogue -> pause -> walk -> stop ->
//                          dialogue...).
//   ChangingStore-level1
//                       -- the changing/clothing store (building6),
//                       "Fresh Threads", passed on the walk from AA
//                       toward CA. pt1 plays while Bill and Bob are
//                       still standing outside in their ORIGINAL
//                       clothes, right before they zip inside. pt2
//                       plays right after they come back out in their
//                       NEW outfits.
//   DryPeoplesClub-level1
//                       -- plays once, automatically, when Bill and Bob
//                       reach the Dry People's Club landmark, also on
//                       the walk from AA toward CA. Just a quick
//                       stop-and-talk beat -- no doorway, no entering.
//   OutsideCA-level1    -- the rest of the street walk toward CA.
//   CA-level1           -- once you step inside the CA meeting.
//   OutsideGA-level1    -- on the street, walking toward the GA meeting.
//   GA-level1           -- once you step inside the GA meeting.
//   OutsideEA-level1    -- on the street, walking toward the EA meeting.
//   EA-level1           -- once you step inside the EA meeting.
//   OutsideCMA-level1   -- on the street, walking toward CMA/Harrison
//                          Corner.
//   CMA-level1          -- once you step inside the CMA meeting.
// OutsideAA-level1
clock: 24:00:00

<<<<<<< HEAD
//[pt1]
bill: XXXAnother twenty-four hours, dear friend.
bob: Beats the alternative, bub.
bill: Look at all these meetings!
bob: Recovery got big.
bill: Think they still put out candy bars?
bob: Only one way to find out.

//[pt2]
bob: New duds, new men.
bill: We look dope, buddy.
bob: Extremely dope.
bill: Another meeting?
bob: Maybe this one's got candy.

//[pt3]
building-dialogue: WELCOME HOME
bill: Another fellowship!
bob: Another coffee pot.
bill: Another shot at a candy bar.
bob: Now you're focused.

//[pt4]
building-dialogue: MEETING TONIGHT 8 PM
bill: Meeting number four.
bob: Candy bar number zero.
bill: Stay positive, dear friend.
bob: I'm positive there's no candy.

//[pt5]
bill: Buddy, Akron's dry.
bob: Candy-wise.
bill: I heard there's a good meeting in Canton.
bob: That's a long way for a Snickers.
bill: Harrison Corner. Maybe they still do candy bars.
bob: Get in the car, pal.


//AA-level1
=======
// [pt1]
bill: Another twenty-four hours, dear friend.
bob: Just like old times, bub.
bill: A meeting in Akron. What could possibly have changed?
bob: Probably nothing.
bill: Exactly how I like it.

// AA-level1
>>>>>>> 1f95f90 (Another Day Sober gets its own reading page with a way back)
clock: 21:45:00
scene-timer: 240

// [pt1]
bill: Same Serenity Prayer.
bill: Same Twelve Steps.
bill: Same coffee.
bill: Same old drunks.
bob: Not much has changed, pal.
bill: All is fundamentally well.

// [pt2]
bill: Hold on a damn minute.
bob: What is it?
bill: Where are the chocolate bars?
bob: I don't see any.
bill: Check beside the coffee.
bob: Coffee. Creamer. Sugar packets.
bill: And?
bob: A suspicious amount of napkins.
bill: Prayers, Steps, coffee—and NO chocolate?
bob: Dry as a bone, bub.
bill: Troubling.

// [pt3]
crowd: Hey, look over there!
crowd: Wait...is that...?
crowd: IT IS!
bob: We've been made, pal.
bill: After all these years?
bob: You’re wearing the exact same suit.
bill: Let's get out of these old clothes.

// [pt4]
crowd: Can we get a picture?
crowd: Just one picture!
bill: We seem to be causing a commotion.
bob: That's not why we're here.
bill: No. We came for spiritual growth.
bob: And apparently chocolate.
bill: We ought to get some new duds.
bob: Heck yeah. New duds.

// ChangingStore-level1
clock: 20:18:00

// [pt1]
building-dialogue: FRESH THREADS CO. — WE CAN'T FIX YOU, BUT DAMN, YOU'LL LOOK GOOD!
bill: Fresh Threads Company.
bob: Nobody will recognize us after this.
bill: New century. New men.
bob: Same mission.
bill: Another meeting?
bob: Another shot at chocolate.

// [pt2]
bill: Buddy...we look so dope!
bob: Fo' shizzle.
bill: What's a shizzle?
bob: No idea.
bill: Perfect. They'll never suspect us.
bob: Let's hit another meeting, bub.

// DryPeoplesClub-level1
clock: 19:35:00

// [pt1]
building-dialogue: DRY PEOPLE'S CLUB — "...ALL IS FUNDAMENTALLY WELL..."
bill: Hey! They named a burger after you!
bob: Dang. I haven't had a burger in decades.
bill: Want to stop?
bob: No time. We're up against the clock.
bill: Fine. We'll grab a chocolate bar at the next meeting.
bob: You sound awfully confident.
bill: It's a recovery meeting. Of course they'll have chocolate.

// OutsideCA-level1

// [pt1]
building-dialogue: WELCOME HOME — GOD, GRANT ME THE SERENITY...
bob: New duds, new men.
bill: We look extremely dope, buddy.
bob: Painfully dope.
bill: Think they have chocolate?
bob: Only one way to find out.

// CA-level1
clock: 17:48:00
scene-timer: 125

// [pt1]
bob: We made it.
bill: Good meeting right here.
bob: Any meeting is a good meeting.
bill: Especially one with refreshments.

// [pt2]
crowd: Keep coming back!
bill: Same hope, different room.
bob: Beautiful thing, isn't it?
bill: Sure is. Now where are the chocolate bars?
bob: Did you look over there?

// [pt3]
bill: Candy?
bob: Coffee.
bill: Candy?
bob: Sugar packets.
bill: Chocolate?
bob: Powdered creamer.
bill: Again?!
bob: We're zero for two, bub.
bill: That’s not a coincidence.
bob: It could absolutely be a coincidence.
bill: That's what a coincidence wants you to think.

// OutsideGA-level1

// [pt1]
building-dialogue: WELCOME HOME
bill: Another fellowship.
bob: Another coffee pot.
bill: Another chance at a chocolate bar.
bob: You've stopped pretending this is about the meeting.
bill: Recovery first.
bob: And chocolate?
bill: A very close first-and-a-half.

// GA-level1
clock: 14:52:00
scene-timer: 140

// [pt1]
bill: Nice place.
bob: Don't start.
bill: I didn't say anything.
bob: Your eyes said chocolate.
bill: My eyes are hungry.

// [pt2]
crowd: Just for today!
bill: I like these folks.
bob: Me too, pal.
bill: They seem trustworthy.
bob: Why wouldn't they be?
bill: We'll know when we see the snack table.

// [pt3]
bill: Well?
bob: Coffee. Creamer. Napkins.
bill: Chocolate?
bob: Nothing.
bill: Check underneath.
bob: Underneath what?
bill: Everything!
bob: Three meetings. Zero bars.
bill: Somebody is removing chocolate from recovery.
bob: That's a pretty big leap.
bill: Wake up, Bob. The trail is getting colder.
bob: The chocolate trail?
bill: Precisely.
bob: The plot thickens.
bill: Unlike that coffee.

// OutsideEA-level1

// [pt1]
building-dialogue: MEETING TONIGHT — 8 P.M.
bill: Meeting number four.
bob: Chocolate bar number zero.
bill: Stay positive, dear friend.
bob: I'm positive there won't be any.
bill: That's exactly the attitude Big Chocolate wants.
bob: Who is Big Chocolate?
bill: I don't know yet.

// EA-level1
clock: 11:40:00
scene-timer: 150

// [pt1]
bill: Cozy.
bob: Very.
bill: Feels promising.
bob: For recovery or chocolate?
bill: Yes.

// [pt2]
crowd: You are not alone.
bob: That's a good message.
bill: Sure is, dear friend.
bob: You weren't listening, were you?
bill: I heard every word.
bob: What did they say?
bill: Something about not being alone.
bob: You got lucky.

// [pt3]
bill: Well?
bob: Nothing.
bill: You looked everywhere?
bob: Even under the coffee table.
bill: Behind the books?
bob: Nothing.
bill: Inside the tissue box?
bob: Why would chocolate be—
bill: INSIDE THE TISSUE BOX, BOB.
bob: Empty.
bill: Four meetings. No chocolate.
bob: Now I'm concerned.
bill: Thank God. I was beginning to think I was alone.
bob: You're not alone.
bill: That was a good message.

// OutsideCMA-level1

// [pt1]
bill: Buddy, Akron's dry.
bob: Candy-wise.
bill: This goes deeper than we thought.
bob: How deep can missing chocolate go?
bill: I heard there's an old-school meeting in Canton.
bob: That's a long walk for a snack.
bill: Harrison Corner. Maybe they still read the part we wrote about chocolate.
bob: And if they don't have any?
bill: Then this isn't an oversight.
bob: What is it?
bill: A crisis.
bob: Tighten up the shoelace express, pal.

// CMA-level1
clock: 07:55:00
scene-timer: 200

// [pt1]
crowd: Welcome to Off the Bubble!
bill: Canton, dear friend.
bob: The promised land.
bill: Don't get ahead of yourself.
bob: I can almost smell the chocolate.
bill: That's the coffee.
bob: Damn.

// [pt2]
crowd: No matter what!
crowd: Keep coming back!
bill: Good meeting.
bob: Real good meeting, bub.
bill: Old-school recovery.
bob: This has to be the place.

// [pt3]
bill: All right. Where are they?
bob: Coffee.
bill: Bob.
bob: Books.
bill: Bob.
bob: A bowl of hard candy.
bill: Chocolate bars, Bob.
bob: No chocolate bars.
bill: IN CANTON?!
bob: Not even Canton.
<<<<<<< HEAD
bill: Where'd the candy bars go?!
bob: I don't know, pal.
bill: This is SERIOUS.
bob: Five meetings. Two cities. Zero candy.
bill: Something must be done.
bob: Here we go.

=======
bill: Five meetings.
bob: Two cities.
bill: Countless pots of coffee.
bob: Zero chocolate bars.
bill: This isn't bad hospitality.
bob: Then what is it?
bill: A message.
bob: What kind of message?
bill: Recovery has lost its chocolate.
bob: That's our purpose, isn't it?
bill: Obviously.
bob: What do we do now?
bill: We find out who took it—
bob: And?
bill: We put the chocolate back in recovery.
bob: Let's go, bub.
>>>>>>> 1f95f90 (Another Day Sober gets its own reading page with a way back)
