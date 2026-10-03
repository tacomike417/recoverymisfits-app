#!/usr/bin/env python3
"""UPLOAD THE RECOVERY MISFITS SPINS (3 Oct 2026, Mike).

"25-40 sober spins that belong to the recoverymisfits account ... I want them all to have
music ... post one every other day around 4:17pm."

Reads the 34 Spins in ~/Downloads/sober spins and sends each one ONCE, straight to the video
host, in the order below. The porch-daily function then posts them from recoverymisfits: one
every other day at 4:17pm Eastern until they run out. Safe to run again: a Spin that already
went up is skipped.

Where it looks:
  spin-01 .. spin-25   in the folders and zips inside ~/Downloads/sober spins
  the nine named ones  in ~/Downloads/sober spins/with-music  (the same videos with the
                       real song on them; the originals had a thin made-up tune)

It needs the upload password in HOUSE_KEY. The paste command asks for it; it is never
written down here.
"""
import glob, os, sys, time, zipfile

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from upload_house_reels import call, tus_upload, KEY   # the same doors the reels use

FOLDER = sys.argv[1] if len(sys.argv) > 1 else os.path.expanduser("~/Downloads/sober spins")
FIRST = 1001          # recoverymisfits' Spins are numbered from here, so they never mix with the reels
TAG = "Good people between meetings."

# the order they go up in: three from the numbered set, then one of the named ones
ORDER = [
    ("spin-01", "Post a Spin. Somebody gets it. " + TAG),
    ("spin-02", "I got you. " + TAG),
    ("spin-03", "Call me. " + TAG),
    ("recovery-misfits-a-phone-call-away-final", "A phone call away. " + TAG),
    ("spin-04", "Face to face. " + TAG),
    ("spin-05", "Late-night chat. " + TAG),
    ("spin-06", "Share a win. " + TAG),
    ("recovery-misfits-connection-between-meetings", "Connection between meetings."),
    ("spin-07", "Bad day. " + TAG),
    ("spin-08", "Share your experience. " + TAG),
    ("spin-09", "Borrow some strength. " + TAG),
    ("recovery-misfits-find-hope-find-your-people", "Find hope. Find your people."),
    ("spin-10", "There\u2019s hope in here. " + TAG),
    ("spin-11", "Find your people. " + TAG),
    ("spin-12", "Join a group. " + TAG),
    ("recovery-misfits-give-it-a-spin-comic", "Your recovery. Your way. Give it a spin."),
    ("spin-13", "Between meetings. " + TAG),
    ("spin-14", "Every path counts. " + TAG),
    ("spin-15", "Anonymous. " + TAG),
    ("recovery-misfits-good-people-between-meetings", TAG),
    ("spin-16", "Private. " + TAG),
    ("spin-17", "A reading every morning. " + TAG),
    ("spin-18", "Recovery can be funny. " + TAG),
    ("recovery-misfits-graphical-lettering", "Your recovery. Your way."),
    ("spin-19", "Thinking about you. " + TAG),
    ("spin-20", "Pull up a chair. " + TAG),
    ("spin-21", "Good people everywhere. " + TAG),
    ("recovery-misfits-old-wisdom-new-connections", "Old wisdom. New connections."),
    ("spin-22", "Go to your meeting. " + TAG),
    ("spin-23", "Come sit on the Porch. " + TAG),
    ("spin-24", "Messenger check-ins. " + TAG),
    ("recovery-misfits-one-post-can-change-everything-corrected", "One post can change everything. You don\u2019t have to do this alone."),
    ("spin-25", "It\u2019s free. Come hang out. " + TAG),
    ("recovery-misfits-we-do", "We do. " + TAG),
]


def find(name):
    """-> a function that returns the video's bytes, or None if it isn't anywhere"""
    want = name + ".mp4"
    if name.startswith("spin-"):
        hits = sorted(glob.glob(os.path.join(FOLDER, "**", want), recursive=True))
        hits = [h for h in hits if os.sep + "posted" + os.sep not in h]
        if hits:
            return lambda: open(hits[0], "rb").read()
        for zp in sorted(glob.glob(os.path.join(FOLDER, "*.zip"))):
            try:
                z = zipfile.ZipFile(zp)
            except Exception:
                continue
            for nm in z.namelist():
                if os.path.basename(nm) == want:
                    return lambda zp=zp, nm=nm: zipfile.ZipFile(zp).read(nm)
        return None
    path = os.path.join(FOLDER, "with-music", want)
    return (lambda: open(path, "rb").read()) if os.path.isfile(path) else None


def main():
    if not KEY:
        sys.exit("No upload password. Run this through the paste command, which asks for it.")
    missing = [name for name, _ in ORDER if find(name) is None]
    if missing:
        sys.exit("Can't find these in %s:\n  %s\nNothing was uploaded." % (FOLDER, "\n  ".join(missing)))
    print("Found all %d Spins.\n" % len(ORDER))
    up = skip = bad = 0
    for i, (name, caption) in enumerate(ORDER):
        n = FIRST + i
        tag = "%02d  %s" % (i + 1, name)
        slot = call({"action": "reel_slot", "n": n, "title": "misfits " + name, "caption": caption})
        if not slot.get("ok"):
            print("%s  ... STOPPED: %s" % (tag, slot.get("error", "no answer")))
            if "password" in str(slot.get("error", "")):
                sys.exit("\nThe upload password didn't match. Nothing was uploaded.")
            bad += 1
            continue
        if slot.get("skip"):
            print("%s  ... already up" % tag); skip += 1; continue
        data = find(name)()
        ok, err = False, ""
        for attempt in (1, 2, 3):
            try:
                tus_upload(data, slot, "misfits spin %02d" % (i + 1)); ok = True; break
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
    print("On the Recovery Misfits list:", st.get("counts", st))


if __name__ == "__main__":
    main()
