#!/usr/bin/env python3
"""UPLOAD THE ORIGINAL MANUSCRIPT SHORTS for realmrhyde (4 Oct 2026, Mike).

"set up your auto poster for realmrhyde and have them shoot out every morning at 6:13am."

Reads the 30 videos in ~/Downloads/manuscript-shorts (or a folder you name), sends each one ONCE
to the video host, in order. The porch-daily function then posts one a morning at 6:13 Eastern
from the realmrhyde account. Safe to run again: one that already went up is skipped. To add more
later, put them at the END of SHORTS below.

It needs the upload password in HOUSE_KEY. The paste command asks for it; it is never written
down here.
"""
import glob, os, sys, time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from upload_house_reels import call, tus_upload, KEY   # the same doors the reels use

SRC = sys.argv[1] if len(sys.argv) > 1 else os.path.expanduser("~/Downloads/manuscript-shorts")
FIRST = 5001
SHORTS = [
    [
        "manuscript-01-half-measures-will-avail-you",
        "Half measures will avail you nothing. You stand at the turning point. #originalmanuscript"
    ],
    [
        "manuscript-02-you-are-going-to-know",
        "You are going to know a new freedom and happiness. #originalmanuscript"
    ],
    [
        "manuscript-03-but-there-exists-among-us",
        "But there exists among us a fellowship, a friendliness, and an understanding which is indescribably wonderful. #originalmanuscript"
    ],
    [
        "manuscript-04-rarely-have-we-seen-a",
        "Rarely have we seen a person fail who has thoroughly followed our directions. #originalmanuscript"
    ],
    [
        "manuscript-05-simple-but-not-easy-a",
        "Simple, but not easy; a price had to be paid. #originalmanuscript"
    ],
    [
        "manuscript-06-you-will-not-regret-the",
        "You will not regret the past nor wish to shut the door on it. #originalmanuscript"
    ],
    [
        "manuscript-07-we-learned-that-we-had",
        "We learned that we had to fully concede to our innermost selves that we were alcoholics. This is the first step in recovery. #originalmanuscript"
    ],
    [
        "manuscript-08-we-absolutely-insist-on-enjoying",
        "We absolutely insist on enjoying life. #originalmanuscript"
    ],
    [
        "manuscript-09-remember-that-you-are-dealing",
        "Remember that you are dealing with alcohol - cunning, baffling, powerful! Without help it is too much for you. #originalmanuscript"
    ],
    [
        "manuscript-10-you-will-comprehend-the-word",
        "You will comprehend the word serenity and know peace. #originalmanuscript"
    ],
    [
        "manuscript-11-frequent-contact-with-newcomers-and",
        "Frequent contact with newcomers and with each other is the bright spot of our lives. #originalmanuscript"
    ],
    [
        "manuscript-12-lack-of-power-that-was",
        "Lack of power, that was our dilemma. #originalmanuscript"
    ],
    [
        "manuscript-13-no-matter-how-far-down",
        "No matter how far down the scale you have gone, you will see how your experience can benefit others. #originalmanuscript"
    ],
    [
        "manuscript-14-we-claim-spiritual-progress-rather",
        "We claim spiritual progress rather than spiritual perfection. #originalmanuscript"
    ],
    [
        "manuscript-15-the-feeling-of-having-shared",
        "The feeling of having shared in a common peril is one element in the powerful cement which binds us. #originalmanuscript"
    ],
    [
        "manuscript-16-that-feeling-of-uselessness-and",
        "That feeling of uselessness and self-pity will disappear. #originalmanuscript"
    ],
    [
        "manuscript-17-some-of-us-have-tried",
        "Some of us have tried to hold on to our old ideas and the result was nil until we let go absolutely. #originalmanuscript"
    ],
    [
        "manuscript-18-cling-to-the-thought-that",
        "Cling to the thought that, in God's hands, the dark past is the greatest possession you have. #originalmanuscript"
    ],
    [
        "manuscript-19-fear-of-people-and-of",
        "Fear of people and of economic insecurity will leave you. #originalmanuscript"
    ],
    [
        "manuscript-20-we-are-like-men-who",
        "We are like men who have lost their legs; they never grow new ones. #originalmanuscript"
    ],
    [
        "manuscript-21-selfishness-self-centeredness-that-we",
        "Selfishness - self-centeredness! That, we think, is the root of our troubles. #originalmanuscript"
    ],
    [
        "manuscript-22-to-watch-people-come-back",
        "To watch people come back to life, to see them help others, to watch loneliness vanish, to see a fellowship grow up about you, to have a host of friends - this is an experience you must not miss. #originalmanuscript"
    ],
    [
        "manuscript-23-you-will-intuitively-know-how",
        "You will intuitively know how to handle situations which used to baffle you. #originalmanuscript"
    ],
    [
        "manuscript-24-scales-of-pride-and-prejudice",
        "Scales of pride and prejudice fell from my eyes. A new world came into view. #originalmanuscript"
    ],
    [
        "manuscript-25-first-of-all-quit-playing",
        "First of all, quit playing God yourself. #originalmanuscript"
    ],
    [
        "manuscript-26-we-have-found-much-of",
        "We have found much of heaven and we have been rocketed into a fourth dimension of existence, of which we had not even dreamed. #originalmanuscript"
    ],
    [
        "manuscript-27-love-and-tolerance-of-others",
        "Love and tolerance of others is your code. #originalmanuscript"
    ],
    [
        "manuscript-28-if-you-have-decided-you",
        "If you have decided you want what we have and are willing to go to any length to get it - then you are ready to follow directions. #originalmanuscript"
    ],
    [
        "manuscript-29-the-most-satisfactory-years-of",
        "The most satisfactory years of your existence lie ahead. #originalmanuscript"
    ],
    [
        "manuscript-30-we-shall-be-with-you",
        "We shall be with you, in the Fellowship of The Spirit, and you will surely meet some of us as you trudge the Road of Happy Destiny. #originalmanuscript"
    ]
]


def main():
    if not KEY:
        sys.exit("No upload password. Run this through the paste command, which asks for it.")
    if not os.path.isdir(SRC):
        sys.exit("Can't find the folder %s. Nothing was uploaded." % SRC)
    missing = [n for n, _ in SHORTS if not os.path.exists(os.path.join(SRC, n + ".mp4"))]
    if missing:
        sys.exit("These are missing from %s, so nothing was uploaded:\n  %s" % (SRC, "\n  ".join(missing)))
    print("Found all %d shorts.\n" % len(SHORTS))
    up = skip = bad = 0
    for i, (name, caption) in enumerate(SHORTS):
        n = FIRST + i
        slot = call({"action": "reel_slot", "n": n, "title": "hyde " + name, "caption": caption})
        if not slot.get("ok"):
            print("%s  ... STOPPED: %s" % (name, slot.get("error", "no answer")))
            if "password" in str(slot.get("error", "")):
                sys.exit("\nThe upload password didn't match. Nothing more was uploaded.")
            bad += 1; continue
        if slot.get("skip"):
            skip += 1; print("%s  ... already up" % name); continue
        data = open(os.path.join(SRC, name + ".mp4"), "rb").read()
        ok, err = False, ""
        for attempt in (1, 2, 3):
            try:
                tus_upload(data, slot, "hyde %d" % (i + 1)); ok = True; break
            except Exception as e:
                err = str(e); time.sleep(3 * attempt)
        if not ok:
            print("%s  ... upload failed: %s" % (name, err)); bad += 1; continue
        done = call({"action": "reel_uploaded", "n": n})
        if done.get("ok"):
            up += 1; print("%s  ... uploaded (%.1f MB)" % (name, len(data) / 1e6))
        else:
            bad += 1; print("%s  ... uploaded, but the list didn't update: %s" % (name, done.get("error")))
    st = call({"action": "reel_status", "from": FIRST, "to": FIRST + 999}).get("counts", {})
    print("\nDONE: %d uploaded, %d already up, %d with a problem. On the list now: %s" % (up, skip, bad, st))
    if bad:
        sys.exit("Something had a problem. Paste this to Claude.")
    print("The first one posts tomorrow at 6:13am Eastern, then one every morning.")


if __name__ == "__main__":
    main()
