/* ===========================================================================
   THE CUTSCENES — what happens, in order.

   THIS FILE IS THE STORY. cutscene-player.js is the machine that shows it.
   Nothing in here is code you have to be careful with: it is a list of
   panels, and each panel is a picture, a sound, and who says what.

   To change a line, change the text. To reorder, move the block. To cut a
   panel, delete it. Nothing else needs touching.

   PANEL FIELDS
     img      picture file in assets/cutscenes/<scene id>/
     sound    a file in assets/audio/, or leave it out for silence
     bed      a quiet sound that loops UNDER the panel (room tone)
     hold     milliseconds before the "tap to continue" nudge appears.
              Default is 1400. Make it longer for a panel with a lot of
              reading, shorter for a punchline.
     lines    who says what, in order. Each line:
                who   "bill" | "bob" | "crowd" | "world"
                text  the words. Keep them short -- these are balloons on a
                      phone, not paragraphs.
                at    roughly where the balloon sits: "top-left",
                      "top-right", "top", "mid-left", "mid-right"
                wait  ms after the panel lands before this balloon pops.
                      Default staggers them automatically.

   THE RULE FROM CUTSCENES.md: the gag gets SHORTER every time it repeats.
   CS1 runs long on purpose. CS4 and CS5 should be two or three panels.
   ======================================================================== */
window.HalloweenCutscenes = {

  cs1: {
    title: "AA — the recognition",
    panels: [

      { img: "cs1-p1-walking-up.webp",
        sound: "cs1-steps.mp3",
        hold: 2200,
        lines: [
          { who: "bill", text: "Dear friend. After all these years.", at: "top-left" },
          { who: "bob",  text: "Let's see if they kept the place up.", at: "top-right" }
        ] },

      /* THE CUT THAT DOES THE WORK. No transition, no easing -- the room is
         just suddenly there, staring. This is the panel the whole scene is
         built around, so it gets the gasp. */
      { img: "cs1-p2-the-room.webp",
        sound: "cs1-gasp.mp3",
        hold: 1600,
        lines: [
          { who: "crowd", text: "...HOLY SHIT, IT'S THE GUYS.", at: "top" }
        ] },

      { img: "cs1-p3-coffee-pot.webp",
        sound: "cs1-glass.mp3",
        hold: 900,
        lines: [] },            /* no words. it is a coffee pot exploding. */

      /* SILENCE HERE IS THE JOKE. Right after the crash, nothing. Do not
         put a sound on this panel. */
      { img: "cs1-p4-green-guy.webp",
        hold: 1500,
        lines: [
          { who: "world", text: "I think I'm going to throw up.", at: "top" }
        ] },

      { img: "cs1-p5-we-could-go.webp",
        bed: "cs1-murmur.mp3",
        hold: 2400,
        lines: [
          { who: "bill", text: "We could go.",     at: "top-left"  },
          { who: "bob",  text: "We could go now.", at: "top-right", wait: 1500 }
        ] }
    ]
  }

};
