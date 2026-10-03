#!/usr/bin/env python3
"""UPLOAD THE DATED RECOVERY MISFITS SPINS (3 Oct 2026, Mike).

"I want to post one a day with the date ones on the right date ... this batch is independent
of that ... have them post in the morning at 4:17am, I'll catch 'em then."

19 Spins, one a morning from 4 Oct to 22 Oct, each on the day written beside it below. The
countdown to the Porch opening lands on the right mornings. Reads the zips sitting loose in
~/Downloads/sober spins (not the ones in "used"), sends each video ONCE, and the porch-daily
function posts each one at 4:17am Eastern on its day. Safe to run again: a Spin that already
went up is skipped. The every-other-day afternoon line is not touched.

It needs the upload password in HOUSE_KEY. The paste command asks for it; it is never
written down here.
"""
import glob, os, sys, time, zipfile

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from upload_house_reels import call, tus_upload, KEY   # the same doors the reels use

FOLDER = sys.argv[1] if len(sys.argv) > 1 else os.path.expanduser("~/Downloads/sober spins")
FIRST = 2001          # the dated batch is numbered from here, clear of the afternoon line (1001+)
TAG = "Good people between meetings."

# day, file, caption
PLAN = [
    ("2026-10-04", "spin-32", "Sunday night. Meeting\u2019s not till Thursday. " + TAG),
    ("2026-10-05", "spin-38", "I\u2019m learning to sit with my feelings. Neither of us is happy about the seating arrangement."),
    ("2026-10-06", "spin-26", "Something\u2019s opening. October 20. " + TAG),
    ("2026-10-07", "spin-33", "90 days. Tell somebody. " + TAG),
    ("2026-10-08", "spin-39", "My resentment list has subfolders."),
    ("2026-10-09", "spin-34", "New town. Same good people. " + TAG),
    ("2026-10-10", "spin-27", "We\u2019re saving you a seat. October 20. " + TAG),
    ("2026-10-11", "spin-40", "Today I chose peace. I would still like everyone to know I was right."),
    ("2026-10-12", "spin-35", "The meeting\u2019s over. The week isn\u2019t. " + TAG),
    ("2026-10-13", "spin-28", "One week. Pull up a chair. " + TAG),
    ("2026-10-14", "spin-41", "I thought I\u2019d reached emotional maturity. Then somebody used my mug."),
    ("2026-10-15", "spin-36", "Good day? Somebody wants to hear it. " + TAG),
    ("2026-10-16", "spin-42", "I surrendered this morning. By lunch I had requested several amendments."),
    ("2026-10-17", "spin-29", "Three days. Almost time. " + TAG),
    ("2026-10-18", "spin-37", "One hour in the room. We\u2019ve got the rest. " + TAG),
    ("2026-10-19", "spin-30", "Tomorrow. The Porch opens. " + TAG),
    ("2026-10-20", "spin-31", "We\u2019re open. Come sit. " + TAG),
    ("2026-10-21", "spin-43", "I\u2019m staying in my lane. I have observations about several adjacent lanes."),
    ("2026-10-22", "spin-24", "Hit me up. Misfit Messages. " + TAG),
]


def find(name):
    """the zips loose in the folder only, so the old spin-24 in "used" is never picked up"""
    want = name + ".mp4"
    loose = os.path.join(FOLDER, want)
    if os.path.isfile(loose):
        return lambda: open(loose, "rb").read()
    for zp in sorted(glob.glob(os.path.join(FOLDER, "*.zip"))):
        try:
            z = zipfile.ZipFile(zp)
        except Exception:
            continue
        for nm in z.namelist():
            if os.path.basename(nm) == want:
                return lambda zp=zp, nm=nm: zipfile.ZipFile(zp).read(nm)
    return None


def main():
    if not KEY:
        sys.exit("No upload password. Run this through the paste command, which asks for it.")
    missing = [name for _, name, _ in PLAN if find(name) is None]
    if missing:
        sys.exit("Can't find these in %s:\n  %s\nNothing was uploaded." % (FOLDER, "\n  ".join(missing)))
    print("Found all %d Spins.\n" % len(PLAN))
    up = skip = bad = 0
    for i, (day, name, caption) in enumerate(PLAN):
        n = FIRST + i
        tag = "%s  %s" % (day, name)
        slot = call({"action": "reel_slot", "n": n, "title": "misfits daily " + name, "caption": caption, "post_on": day})
        if not slot.get("ok"):
            print("%s  ... STOPPED: %s" % (tag, slot.get("error", "no answer")))
            if "password" in str(slot.get("error", "")):
                sys.exit("\nThe upload password didn't match. Nothing was uploaded.")
            if "post_on" in str(slot.get("error", "")):
                sys.exit("\nThe database doesn't have the date column yet. Run porch_44_dated_spins.sql first, then run this again.")
            bad += 1
            continue
        if slot.get("skip"):
            print("%s  ... already up" % tag); skip += 1; continue
        data = find(name)()
        ok, err = False, ""
        for attempt in (1, 2, 3):
            try:
                tus_upload(data, slot, "misfits daily %s" % name); ok = True; break
            except Exception as e:
                err = str(e); time.sleep(3 * attempt)
        if not ok:
            print("%s  ... upload failed: %s" % (tag, err)); bad += 1; continue
        done = call({"action": "reel_uploaded", "n": n})
        if done.get("ok"):
            up += 1; print("%s  ... uploaded (%.1f MB)" % (tag, len(data) / 1e6))
        else:
            bad += 1; print("%s  ... uploaded, but the list didn't update: %s" % (tag, done.get("error")))
    st = call({"action": "reel_status", "from": FIRST})
    print("\nDONE. %d uploaded now, %d were already up, %d had a problem." % (up, skip, bad))
    print("On the dated list:", st.get("counts", st))


if __name__ == "__main__":
    main()
