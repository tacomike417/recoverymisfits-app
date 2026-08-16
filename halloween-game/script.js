// script.js -- plain-text dialogue for the game.
//
// This file is NOT run as JavaScript. The game loads it as plain text
// and reads it top to bottom, so you can edit it freely without
// worrying about quotes, commas, brackets, or any code syntax.
//
// HOW TO EDIT:
//   - A line starting with // and a name, like "//Outside-level1",
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
// SECTIONS IN THIS FILE:
//   Outside-level1  -- plays on the street, one point per meeting
//                      you're walking toward (pt1 before the AA meeting,
//                      pt2 before CA, pt3 before GA, pt4 before EA,
//                      pt5 before CMA/Harrison Corner).
//   AA-level1, CA-level1, GA-level1, EA-level1, CMA-level1
//                      -- each plays once you step inside that meeting.
//                      pt1, pt2, pt3 each fire at their own stop as Bill
//                      and Bob move around the room (walk -> stop ->
//                      dialogue -> pause -> walk -> stop -> dialogue...).
//   ChangingStore-level1
//                      -- plays at the changing/clothing store (building6)
//                      on the way to CA. pt1 plays while Bill and Bob are
//                      still standing outside in their ORIGINAL clothes,
//                      right before they zip inside. pt2 plays right
//                      after they come back out in their NEW outfits.
//   DryPeoplesClub-level1
//                      -- plays once, automatically, when Bill and Bob
//                      reach the Dry People's Club landmark on the way to
//                      CA. Just a quick stop-and-talk beat -- no doorway,
//                      no entering.
//
// Everything below pt1 in each meeting section, all of
// ChangingStore-level1, and all of DryPeoplesClub-level1 is currently a
// PLACEHOLDER -- swap in real lines whenever you're ready. Nothing else
// in the file needs to change when you do.

//Outside-level1
clock: 24:00:00

//[pt1]
bill: Another twenty-four hours, dear friend.
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
clock: 21:45:00
scene-timer: 105

//[pt1]
bill: Look at this crowd, dear friend.
bob: Recovery sure got popular.
bill: Beautiful thing.
bob: Sure is, bub.

//[pt2]
crowd: Wait... is that THEM?
crowd: It IS!
bob: We've been made, pal.
bill: So much for anonymity.

//[pt3]
crowd: Can we get a picture?
bill: They're watching us instead of the meeting.
bob: That's not why we're here.
bill: No, buddy. This is their recovery.
bob: New duds?
bill: New duds.

//[pt4]
bill: We'll slip out and let them have their meeting.
bob: Good call, bub.
bill: Also...
bob: No candy bars.
bill: You noticed.
bob: I always notice.


//ChangingStore-level1
clock: 20:18:00

//[pt1]
building-dialogue: FRESH THREADS CO.
bill: Fresh Threads!
bob: New duds, pal.
bill: Let's get inconspicuous.
bob: With your face? Good luck.

//[pt2]
bill: Buddy... we look dope.
bob: Dope as hell, bub.
bill: Is that how they say it?
bob: No idea.
bill: Perfect.
bob: Let's hit another meeting.


//DryPeoplesClub-level1
clock: 19:35:00

//[pt1]
building-dialogue: DRY PEOPLE'S CLUB
bill: Hey! They got a Dr. Bob's Double Burger!
bob: Mmmmm... burgers.
bill: It's named after you!
bob: Then I want royalties.
bill: We need candy.
bob: I can have two dreams.


//CA-level1
clock: 17:48:00
scene-timer: 80

//[pt1]
bob: Nobody recognized us.
bill: Told you. Dope.
bob: Don't wear it out.

//[pt2]
crowd: Keep coming back!
bill: Same hope, different room.
bob: Recovery's recovery, pal.

//[pt3]
bill: Candy?
bob: Coffee.
bill: Candy?
bob: Sugar packets.
bill: Again?!
bob: We're two for two, bub.


//GA-level1
clock: 14:52:00
scene-timer: 80

//[pt1]
bill: Nice place.
bob: Don't start.
bill: I didn't say anything.
bob: Your eyes said candy.

//[pt2]
crowd: Just for today.
bill: I like these folks.
bob: Me too, pal.

//[pt3]
bill: Well?
bob: Coffee. Creamer. Napkins.
bill: Candy?
bob: Nothing.
bill: Three meetings?!
bob: The plot thickens.


//EA-level1
clock: 11:40:00
scene-timer: 80

//[pt1]
bill: Cozy.
bob: Very.
bill: Feels promising.
bob: For recovery or candy?
bill: Yes.

//[pt2]
crowd: You're not alone.
bob: That's a good message.
bill: Sure is, dear friend.

//[pt3]
bill: Well?
bob: Nothing.
bill: You looked?
bob: Under the coffee table.
bill: Four meetings. No candy.
bob: Now I'm concerned.


//CMA-level1
clock: 07:55:00
scene-timer: 90

//[pt1]
crowd: Welcome to Off the Bubble!
bill: Canton, dear friend.
bob: The promised land.
bill: Don't get ahead of yourself.

//[pt2]
crowd: No matter what!
crowd: Keep coming back!
bill: Good meeting.
bob: Real good meeting, bub.

//[pt3]
bill: All right. Where are they?
bob: Coffee.
bill: Bob.
bob: Books.
bill: Bob.
bob: No candy bars.
bill: IN CANTON?!
bob: Not even Canton.
bill: Where'd the candy bars go?!
bob: I don't know, pal.
bill: This is SERIOUS.
bob: Five meetings. Two cities. Zero candy.
bill: Something must be done.
bob: Here we go.