#!/usr/bin/env python3
"""UPLOAD THE HOUSE REELS (2 Oct 2026, Mike).

Reads the reel zips in ~/Downloads/RM-House Accounts (spiritual-misfit-batch-*.zip),
and sends each video ONCE, straight to the video host, in order. The porch-daily
function then posts them as Spins from spiritualmisfit: six to start, then one every
other day. Safe to run again: a reel that already went up is skipped.

It needs the upload password in HOUSE_KEY. The paste command asks for it; it is never
written down here.
"""
import base64, json, os, re, sys, time, zipfile, glob, urllib.request, urllib.error

FN = "https://rlytvfehbglsjfvprtbp.supabase.co/functions/v1/porch-daily"
TUS = "https://video.bunnycdn.com/tusupload"
KEY = os.environ.get("HOUSE_KEY", "")
FOLDER = sys.argv[1] if len(sys.argv) > 1 else os.path.expanduser("~/Downloads/RM-House Accounts")


def call(body):
    body = dict(body, key=KEY)
    req = urllib.request.Request(FN, data=json.dumps(body).encode(), headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return json.loads(r.read().decode() or "{}")
    except urllib.error.HTTPError as e:
        try:
            return json.loads(e.read().decode() or "{}")
        except Exception:
            return {"ok": False, "error": "server said %s" % e.code}
    except Exception as e:
        return {"ok": False, "error": str(e)}


def b64(s):
    return base64.b64encode(s.encode()).decode()


def tus_upload(data, slot, title):
    auth = {"AuthorizationSignature": slot["signature"], "AuthorizationExpire": str(slot["expire"]),
            "VideoId": slot["guid"], "LibraryId": str(slot["library"]), "Tus-Resumable": "1.0.0"}
    h = dict(auth)
    h["Upload-Length"] = str(len(data))
    h["Upload-Metadata"] = "filetype %s,title %s" % (b64("video/mp4"), b64(title))
    req = urllib.request.Request(TUS, data=b"", headers=h, method="POST")
    with urllib.request.urlopen(req, timeout=60) as r:
        loc = r.headers.get("Location")
    if not loc:
        raise RuntimeError("the video host gave no upload address")
    if loc.startswith("/"):
        loc = "https://video.bunnycdn.com" + loc
    h = dict(auth)
    h["Upload-Offset"] = "0"
    h["Content-Type"] = "application/offset+octet-stream"
    req = urllib.request.Request(loc, data=data, headers=h, method="PATCH")
    with urllib.request.urlopen(req, timeout=600) as r:
        got = int(r.headers.get("Upload-Offset") or 0)
    if got != len(data):
        raise RuntimeError("only %s of %s bytes arrived" % (got, len(data)))


def messages(text):
    """'091 \u2014 The Next Step' then the lines under it -> {91: (title, caption)}"""
    out, cur = {}, None
    for line in text.splitlines():
        m = re.match(r"^\s*(\d{1,4})\s+[\u2014\u2013-]+\s+(.+?)\s*$", line)
        if m:
            cur = int(m.group(1)); out[cur] = [m.group(2), []]
        elif cur is not None and line.strip():
            out[cur][1].append(line.strip())
        elif not line.strip():
            cur = None if cur is not None and out[cur][1] else cur
    return {n: (t, (t + ". " + " ".join(ls)).strip()[:480]) for n, (t, ls) in out.items()}


def main():
    if not KEY:
        sys.exit("No upload password. Run this through the paste command, which asks for it.")
    zips = sorted(glob.glob(os.path.join(FOLDER, "spiritual-misfit-batch-*.zip")))
    if not zips:
        sys.exit("No reel zips found in " + FOLDER)
    reels = []
    for zp in zips:
        z = zipfile.ZipFile(zp)
        names = z.namelist()
        msg = {}
        for nm in names:
            if nm.lower().endswith("reel-messages.txt"):
                msg = messages(z.read(nm).decode("utf-8", "replace"))
        for nm in names:
            m = re.search(r"(\d{1,4})\.mp4$", nm, re.I)
            if m:
                n = int(m.group(1)); t, c = msg.get(n, ("Spiritual Misfit", ""))
                reels.append((n, zp, nm, t, c))
    reels.sort()
    print("Found %d reels in %d zip files.\n" % (len(reels), len(zips)))
    up = skip = bad = 0
    for n, zp, nm, title, caption in reels:
        tag = "%03d  %s" % (n, title)
        slot = call({"action": "reel_slot", "n": n, "title": title, "caption": caption})
        if not slot.get("ok"):
            print("%s  ... STOPPED: %s" % (tag, slot.get("error", "no answer")))
            if "password" in str(slot.get("error", "")):
                sys.exit("\nThe upload password didn't match. Nothing was uploaded.")
            bad += 1
            continue
        if slot.get("skip"):
            print("%s  ... already up" % tag); skip += 1; continue
        data = zipfile.ZipFile(zp).read(nm)
        ok = False
        for attempt in (1, 2, 3):
            try:
                tus_upload(data, slot, "house reel %03d" % n); ok = True; break
            except Exception as e:
                err = str(e); time.sleep(3 * attempt)
        if not ok:
            print("%s  ... upload failed: %s" % (tag, err)); bad += 1; continue
        done = call({"action": "reel_uploaded", "n": n})
        if done.get("ok"):
            up += 1; print("%s  ... uploaded (%.1f MB)" % (tag, len(data) / 1e6))
        else:
            bad += 1; print("%s  ... uploaded, but the list didn't update: %s" % (tag, done.get("error")))
    st = call({"action": "reel_status"})
    print("\nDONE. %d uploaded now, %d were already up, %d had a problem." % (up, skip, bad))
    print("On the list:", st.get("counts", st))


if __name__ == "__main__":
    main()
