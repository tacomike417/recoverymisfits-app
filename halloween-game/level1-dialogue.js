/* ==========================================================================
   level1-dialogue.js

   Dialogue data for Level 1 (AA / CA / EA / CMA).

   This file only holds dialogue data. It does NOT contain any gameplay
   logic, so it is safe to edit without touching chapter1-gameplay.js.

   STRUCTURE
   --------------------------------------------------------------------------
   Each fellowship (aa, ca, ea, cma) has TWO dialogue arrays:

     walking  -- plays OUTSIDE, while Bill and Bob are walking toward
                 that meeting.

     inside   -- plays AFTER they've entered the building, once the
                 indoor scene begins.

   Both use the exact same entry format, so you edit them the same way.
   Leave either array empty and gameplay just continues -- nothing breaks.

   MOCK DIALOGUE NOTE
   --------------------------------------------------------------------------
   The "aa" section below is currently filled with obvious placeholder
   test lines (NOT final story dialogue) so the bubble system -- size,
   wrap, timing, speaker positioning -- can be tested during gameplay.
   Delete/replace them with real dialogue whenever you're ready. The
   other three fellowships are left blank; copy the "aa" shape into them
   whenever you want to test further or start writing for real.

   ENTRY FORMAT
   --------------------------------------------------------------------------
   {
       speaker: "bill",              // "bill" or "bob" (internal id only --
                                      // names are never shown on screen)
       text: "Whatever he says.",    // the line that appears in the bubble
       delay: 2.0                    // seconds after the PREVIOUS line's
                                      // bubble finishes before this one
                                      // appears (first entry: seconds after
                                      // the scene begins)
   }

   NOTES
   --------------------------------------------------------------------------
   - Only one dialogue bubble is ever shown at a time, so "delay" is
     measured from when the previous bubble disappears, not from when it
     appeared.
   - If you omit "delay" entirely, chapter1-gameplay.js falls back to a
     sensible default.
   - "speaker" just decides which character the bubble is anchored to and
     is never printed as a name in the UI.
   - You can add extra fields to an entry for your own notes -- the
     gameplay code only reads speaker/text/delay and ignores anything else.
   ========================================================================== */

window.HalloweenGame = window.HalloweenGame || {};

window.HalloweenGame.level1Dialogue = {

    aa: {
        walking: [
            {
                speaker: "bill",
                text: "This is a test line.",
                delay: 2.0
            },
            {
                speaker: "bob",
                text: "This is Bob answering.",
                delay: 2.0
            },
            {
                speaker: "bill",
                text: "We are still walking.",
                delay: 2.0
            },
            {
                speaker: "bob",
                text: "Yep, still walking.",
                delay: 2.0
            }
        ],

        inside: [
            {
                speaker: "bill",
                text: "Inside meeting test line.",
                delay: 1.5
            },
            {
                speaker: "bob",
                text: "Inside response test line.",
                delay: 1.5
            }
        ]
    },

    ca: {
        walking: [

        ],
        inside: [

        ]
    },

    ea: {
        walking: [

        ],
        inside: [

        ]
    },

    cma: {
        walking: [

        ],
        inside: [

        ]
    }

};