#!/usr/bin/env python3
"""UPLOAD THE STARK RECOVERY SPINS (4 Oct 2026, Mike).

"post a spin ... on resources for guys getting sober and back out in the world ... backlog 3
of them, then post one every 3 days."

Reads the 18 videos in ~/Downloads/stark recovery spins and sends each one ONCE, straight to
the video host, in the order below (mixed on purpose: work, food, a meeting, paperwork ...).
The porch-daily function then posts them from the starkrecovery account: the first three at
once, then one every 3 days in the morning until they run out. Safe to run again: a Spin that
already went up is skipped.

It needs the upload password in HOUSE_KEY. The paste command asks for it; it is never
written down here.
"""
import glob, os, sys, time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from upload_house_reels import call, tus_upload, KEY   # the same doors the reels use

FOLDER = sys.argv[1] if len(sys.argv) > 1 else os.path.expanduser("~/Downloads/stark recovery spins")
FIRST = 3001          # Stark Recovery's Spins are numbered from here, clear of everything else
TAG = "Stark Recovery resources. Check before you go."

# the order they go up in: (video number, caption)
ORDER = [
    (1,  "Make a resume with ChatGPT. Four steps."),
    (11, "Find food in Stark County."),
    (16, "Find a meeting tonight. More than one way."),
    (2,  "Write a cover letter for one job."),
    (8,  "Replace your Ohio ID. A state ID is free."),
    (12, "Apply for food assistance from your phone."),
    (3,  "Explain a gap in your work history."),
    (14, "Ride the bus in Stark County."),
    (17, "See a doctor with no insurance."),
    (4,  "Practice the interview."),
    (9,  "Get your birth certificate and Social Security card."),
    (13, "A free hot meal in Canton."),
    (5,  "Job hunting with a record in Ohio."),
    (15, "A cheaper phone bill."),
    (18, "Sign up for Medicaid."),
    (6,  "Job help in Stark County."),
    (10, "Open a low-cost bank account."),
    (7,  "Get an email and a voicemail that works."),
]


def find(num):
    hits = sorted(glob.glob(os.path.join(FOLDER, "stark-recovery-%02d-*.mp4" % num)))
    return hits[0] if hits else None


def main():
    if not KEY:
        sys.exit("No upload password. Run this through the paste command, which asks for it.")
    missing = ["stark-recovery-%02d-..." % num for num, _ in ORDER if find(num) is None]
    if missing:
        sys.exit("Can't find these in %s:\n  %s\nNothing was uploaded." % (FOLDER, "\n  ".join(missing)))
    print("Found all %d Spins.\n" % len(ORDER))
    up = skip = bad = 0
    for i, (num, caption) in enumerate(ORDER):
        n = FIRST + i
        path = find(num)
        tag = "%02d  %s" % (i + 1, os.path.basename(path))
        slot = call({"action": "reel_slot", "n": n, "title": "stark " + os.path.basename(path)[:-4], "caption": caption + " " + TAG})
        if not slot.get("ok"):
            print("%s  ... STOPPED: %s" % (tag, slot.get("error", "no answer")))
            if "password" in str(slot.get("error", "")):
                sys.exit("\nThe upload password didn't match. Nothing was uploaded.")
            bad += 1
            continue
        if slot.get("skip"):
            print("%s  ... already up" % tag); skip += 1; continue
        data = open(path, "rb").read()
        ok, err = False, ""
        for attempt in (1, 2, 3):
            try:
                tus_upload(data, slot, "stark spin %02d" % (i + 1)); ok = True; break
            except Exception as e:
                err = str(e); time.sleep(3 * attempt)
        if not ok:
            print("%s  ... upload failed: %s" % (tag, err)); bad += 1; continue
        done = call({"action": "reel_uploaded", "n": n})
        if done.get("ok"):
            up += 1; print("%s  ... uploaded (%.1f MB)" % (tag, len(data) / 1e6))
        else:
            bad += 1; print("%s  ... uploaded, but the list didn't update: %s" % (tag, done.get("error")))
    st = call({"action": "reel_status", "from": FIRST, "to": FIRST + 999})
    print("\nDONE. %d uploaded now, %d were already up, %d had a problem." % (up, skip, bad))
    print("On the Stark Recovery list:", st.get("counts", st))


if __name__ == "__main__":
    main()
