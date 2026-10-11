#!/usr/bin/env python3
"""UPLOAD THE SH*T MY SPONSOR SAYS VIDEOS to the Porch (10 Oct 2026, Mike).

"make sure these videos are posting on Infinite Pulls and Recovery Misfits the same way.
Like they end up on the feed."

Finds sponsor-says-NN-*.mp4 in ~/Videos/misfits-post (and its posted folder), or the folder
you name, and sends each one ONCE to the video host. The porch-daily function then posts one
a day at 5pm Eastern as a Spin from the shitmysponsorsays account, in episode order, until
they run out. The caption is the one in the matching .txt file.

The videos stay where they are: misfits-post still sends them to Instagram, Facebook,
YouTube and TikTok on its own schedule. This only puts them on the Porch too.

Safe to run again: one that already went up is skipped. New episodes (16, 17...) dropped in
the folder later go up the next time you run it.
Numbers: 6000 + the episode number (sponsor-says-01 is 6001).

It needs the upload password in HOUSE_KEY. The paste command asks for it; it is never
written down here.
"""
import glob, os, re, sys, time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from upload_house_reels import call, tus_upload, KEY   # the same doors the reels use

SRC = sys.argv[1] if len(sys.argv) > 1 else os.path.expanduser("~/Videos/misfits-post")
FIRST = 6000
NAME = re.compile(r"^(?:\d{4}-\d{2}-\d{2} )?(sponsor-says-(\d{2})-[a-z0-9-]+)\.mp4$")   # posted/ adds the date in front


def find():
    got = {}
    for f in sorted(glob.glob(os.path.join(SRC, "*.mp4")) + glob.glob(os.path.join(SRC, "posted", "*.mp4"))):
        m = NAME.match(os.path.basename(f))
        if m and int(m.group(2)) not in got:
            got[int(m.group(2))] = (m.group(1), f)
    return got


def main():
    if not KEY:
        sys.exit("No upload password. Run this through the paste command, which asks for it.")
    eps = find()
    if not eps:
        sys.exit("No sponsor-says videos in %s. Nothing was uploaded." % SRC)
    print("Found %d Sh*t My Sponsor Says videos.\n" % len(eps))
    up = skip = bad = 0
    for num in sorted(eps):
        name, path = eps[num]
        side = os.path.splitext(path)[0] + ".txt"
        caption = open(side).read().strip() if os.path.exists(side) else "SH*T MY SPONSOR SAYS \U0001F624"
        n = FIRST + num
        slot = call({"action": "reel_slot", "n": n, "title": "sponsor " + name, "caption": caption})
        if not slot.get("ok"):
            print("%s  ... STOPPED: %s" % (name, slot.get("error", "no answer")))
            if "password" in str(slot.get("error", "")):
                sys.exit("\nThe upload password didn't match. Nothing more was uploaded.")
            bad += 1; continue
        if slot.get("skip"):
            skip += 1; print("%s  ... already up" % name); continue
        data = open(path, "rb").read()
        ok, err = False, ""
        for attempt in (1, 2, 3):
            try:
                tus_upload(data, slot, "sponsor %d" % num); ok = True; break
            except Exception as e:
                err = str(e); time.sleep(3 * attempt)
        if not ok:
            print("%s  ... upload failed: %s" % (name, err)); bad += 1; continue
        done = call({"action": "reel_uploaded", "n": n})
        if done.get("ok"):
            up += 1; print("%s  ... uploaded (%.1f MB)" % (name, len(data) / 1e6))
        else:
            bad += 1; print("%s  ... uploaded, but the list didn't update: %s" % (name, done.get("error")))
    st = call({"action": "reel_status", "from": FIRST + 1, "to": FIRST + 999}).get("counts", {})
    print("\nDONE: %d uploaded, %d already up, %d with a problem. On the list now: %s" % (up, skip, bad, st))
    if bad:
        sys.exit("Something had a problem. Paste this to Claude.")
    print("The first one goes on the Porch at 5pm Eastern, then one a day.")


if __name__ == "__main__":
    main()
