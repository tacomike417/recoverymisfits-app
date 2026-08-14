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
//     "bill:" / "Bill:" / "BILL:" all work the same way -- capitalization
//     doesn't matter. Same for "crowd:".
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

//[pt1]
bill: man this is awesome
bob: no doubt

//[pt2]
bill: this is a second dialogue
bob: looks like a second dialogue to me buddy!

//[pt3]
bill: man this is awesome
bill: this is a second saying after the first.
bob: bill and I can have multiple lines each.

//[pt4]
bill: write pt4 outdoor dialogue here
bob: write bob's pt4 reply here

//[pt5]
bill: write pt5 outdoor dialogue here
bob: write bob's pt5 reply here


//AA-level1

//[pt1]
bill: well this looks familiar
bob: there's a lot more people than I expected

//[pt2]
crowd: Hey... aren't you guys...?
bill: uh oh
bob: keep moving

//[pt3]
bill: write AA meeting pt3 dialogue here
bob: write bob's AA meeting pt3 reply here


//CA-level1

//[pt1]
bill: write CA meeting dialogue here
bob: write bob's CA reply here

//[pt2]
bill: write CA meeting pt2 dialogue here
bob: write bob's CA meeting pt2 reply here

//[pt3]
bill: write CA meeting pt3 dialogue here
bob: write bob's CA meeting pt3 reply here


//GA-level1

//[pt1]
bill: write GA meeting dialogue here
bob: write bob's GA reply here

//[pt2]
bill: write GA meeting pt2 dialogue here
bob: write bob's GA meeting pt2 reply here

//[pt3]
bill: write GA meeting pt3 dialogue here
bob: write bob's GA meeting pt3 reply here


//EA-level1

//[pt1]
bill: write EA meeting dialogue here
bob: write bob's EA reply here

//[pt2]
bill: write EA meeting pt2 dialogue here
bob: write bob's EA meeting pt2 reply here

//[pt3]
bill: write EA meeting pt3 dialogue here
bob: write bob's EA meeting pt3 reply here


//CMA-level1

//[pt1]
bill: write CMA meeting dialogue here
bob: write bob's CMA reply here

//[pt2]
bill: write CMA meeting pt2 dialogue here
bob: write bob's CMA meeting pt2 reply here

//[pt3]
bill: write CMA meeting pt3 dialogue here
bob: write bob's CMA meeting pt3 reply here


//ChangingStore-level1

//[pt1]
bill: CHANGING STORE BEFORE BILL
bob: CHANGING STORE BEFORE BOB

//[pt2]
bill: CHANGING STORE AFTER BILL
bob: CHANGING STORE AFTER BOB


//DryPeoplesClub-level1

//[pt1]
bill: write Dry Peoples Club dialogue here
bob: write bob's Dry Peoples Club reply here