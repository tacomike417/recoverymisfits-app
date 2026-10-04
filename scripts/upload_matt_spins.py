#!/usr/bin/env python3
"""UPLOAD WELCOME MATT'S THREE PINNED SPINS (4 Oct 2026, Mike).

"he is just in his own world having a good time on recovery misfits and loves everyone ...
i am going to pin the three up on his profile."

Reads the three videos out of ~/Downloads/welcome-matt-all-three.zip (or a folder you name),
sends each one ONCE to the video host, waits for them to finish processing, then knocks on
porch-daily so they go up on the welcomematt profile, already pinned. Safe to run again.

It needs the upload password in HOUSE_KEY. The paste command asks for it; it is never
written down here.
"""
import glob, io, os, sys, time, zipfile

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from upload_house_reels import call, tus_upload, KEY   # the same doors the reels use

SRC = sys.argv[1] if len(sys.argv) > 1 else os.path.expanduser("~/Downloads/welcome-matt-all-three.zip")
FIRST = 4001
ORDER = [
    ("welcome-matt-03", "I saved you a seat. Misfits welcome. You belong here. \U0001F49B"),
    ("welcome-matt-02", "One day at a time, friend. Today counts. Beep boop. \U0001F49B"),
    ("welcome-matt-01", "Welcome to the party. Pull up a chair. Glad you're here. \U0001F49B"),
]   # the last one is dated newest, so "Welcome to the party" sits first on his profile


def load(prefix):
    if os.path.isdir(SRC):
        hits = sorted(glob.glob(os.path.join(SRC, prefix + "*.mp4")))
        return (os.path.basename(hits[0]), open(hits[0], "rb").read()) if hits else (None, None)
    with zipfile.ZipFile(SRC) as z:
        for name in sorted(z.namelist()):
            if os.path.basename(name).startswith(prefix) and name.endswith(".mp4"):
                return os.path.basename(name), z.read(name)
    return None, None


def main():
    if not KEY:
        sys.exit("No upload password. Run this through the paste command, which asks for it.")
    if not os.path.exists(SRC):
        sys.exit("Can't find %s. Nothing was uploaded." % SRC)
    vids = [load(p) for p, _ in ORDER]
    if any(v[0] is None for v in vids):
        sys.exit("One of the three videos is missing from %s. Nothing was uploaded." % SRC)
    print("Found all 3 Spins.\n")
    bad = 0
    for i, ((prefix, caption), (name, data)) in enumerate(zip(ORDER, vids)):
        n = FIRST + i
        slot = call({"action": "reel_slot", "n": n, "title": "matt " + name[:-4], "caption": caption})
        if not slot.get("ok"):
            print("%s  ... STOPPED: %s" % (name, slot.get("error", "no answer")))
            if "password" in str(slot.get("error", "")):
                sys.exit("\nThe upload password didn't match. Nothing was uploaded.")
            bad += 1; continue
        if slot.get("skip"):
            print("%s  ... already up" % name); continue
        ok, err = False, ""
        for attempt in (1, 2, 3):
            try:
                tus_upload(data, slot, "matt spin %d" % (i + 1)); ok = True; break
            except Exception as e:
                err = str(e); time.sleep(3 * attempt)
        if not ok:
            print("%s  ... upload failed: %s" % (name, err)); bad += 1; continue
        done = call({"action": "reel_uploaded", "n": n})
        if done.get("ok"):
            print("%s  ... uploaded (%.1f MB)" % (name, len(data) / 1e6))
        else:
            bad += 1; print("%s  ... uploaded, but the list didn't update: %s" % (name, done.get("error")))
    if bad:
        sys.exit("\n%d had a problem. Nothing was posted. Paste this to Claude." % bad)
    print("\nWaiting for the video host to finish (a few minutes at most) ...")
    for _ in range(12):
        time.sleep(30)
        out = call({})
        m = out.get("matt") or {}
        st = call({"action": "reel_status", "from": FIRST, "to": FIRST + 999}).get("counts", {})
        print("  ", m, st)
        if not st.get("queued"):
            print("\nDONE. All three are on Matt's profile, pinned.")
            return
    print("\nNot all up yet. They will go up on their own at the top of the hour.")


if __name__ == "__main__":
    main()
