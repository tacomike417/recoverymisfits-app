/* ===========================================================================
   MEME SHARING -- ONE DOOR, USED EVERYWHERE A MEME CAN BE SHARED.

   The Memes tab and the Meme of the Day row in the home-page stack both
   share the same two ways, and they have to behave exactly alike: the same
   square picture with the address printed on it, the same link, the same
   fallbacks. So the how lives here once and both screens call it. A change
   to the picture or the wording is made in this file and nowhere else.

     RMMemeShare.picture({ id, file, img, tell })   send the picture
     RMMemeShare.link({ id, tell })                 send the meme's own link
     RMMemeShare.warm({ id, file, img })            start building the picture
                                                    early (on touch-down)
     RMMemeShare.hasSheet                           true on a phone

   `id` is the meme's number ("051"), `file` its file name ("051.jpg"),
   `img` an <img> already showing the full-size meme if there is one, and
   `tell(message, isBad)` whatever the screen uses to say things.
   ======================================================================== */
(function () {
  "use strict";

  var SITE = "recoverymisfits.org";
  var ORIGIN = "https://recoverymisfits.org";
  var BAND = 100;                     /* the address strip, inside the square */

  function linkFor(id) { return ORIGIN + "/meme/" + id + "/"; }
  function noop() {}

  function loadImg(src) {
    return new Promise(function (resolve, reject) {
      var i = new Image();
      i.decoding = "async";
      i.onload = function () { resolve(i); };
      i.onerror = function () { reject(new Error("could not load " + src)); };
      i.src = src;
    });
  }

  /* ---- THE PICTURE THAT LEAVES ------------------------------------------
     The art in the app stays exactly as it was made. The copy that leaves
     gets a strip along the bottom with the address on it, drawn here rather
     than baked into the files -- so no meme ever has to be re-exported, and
     changing the wording later is one line in this file.

     IT IS A PERFECT SQUARE, strip included. Instagram crops every post to a
     square unless you catch the little expand button, and when the strip hung
     underneath the meme it was the address -- the one thing on the picture
     that leads back here -- that got cut off. Now the meme shrinks a little to
     make room and nothing anywhere can crop the address off. */
  function square(img) {
    return new Promise(function (resolve, reject) {
      var c = document.createElement("canvas");
      var W = 1080, H = 1080;
      var ART = H - BAND;                 /* 980: the meme, still square */
      var AX = (W - ART) / 2;             /* centered, black either side */
      c.width = W; c.height = H;
      var g = c.getContext("2d");

      g.fillStyle = "#0e0e0d";
      g.fillRect(0, 0, W, H);
      g.drawImage(img, AX, 0, ART, ART);

      /* a gold hairline, the same one the app uses to separate things */
      g.fillStyle = "rgba(215,178,83,.42)";
      g.fillRect(0, ART, W, 2);

      g.fillStyle = "#d7b253";
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.font = "800 46px system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif";

      /* Letter-spacing is not a canvas property everywhere yet, so the text is
         spaced by hand where it is not. Same look either way. */
      var y = ART + BAND / 2 + 3;
      if ("letterSpacing" in g) {
        g.letterSpacing = "5px";
        g.fillText(SITE, W / 2, y);
        g.letterSpacing = "0px";
      } else {
        var sp = 5, txt = SITE, total = 0, i;
        for (i = 0; i < txt.length; i++) total += g.measureText(txt[i]).width + sp;
        total -= sp;
        var x = (W - total) / 2;
        g.textAlign = "left";
        for (i = 0; i < txt.length; i++) {
          g.fillText(txt[i], x, y);
          x += g.measureText(txt[i]).width + sp;
        }
      }

      c.toBlob(function (b) {
        if (b) resolve(b); else reject(new Error("canvas gave nothing back"));
      }, "image/jpeg", 0.9);
    });
  }

  /* ONE BUILD PER MEME, KEPT. The first tap on the home page has to fetch
     the full-size meme before it can draw anything, and a phone only lets a
     page open the share sheet for a few seconds after a tap. Building starts
     on touch-down (warm) and the result is kept, so a second tap is instant
     if the first one ran out of time. */
  var cache = {};
  function blobFor(o) {
    if (!cache[o.id]) {
      var ready = (o.img && o.img.complete && o.img.naturalWidth)
        ? Promise.resolve(o.img)
        : loadImg("/assets/memes/" + o.file);
      cache[o.id] = ready.then(square);
      cache[o.id].catch(function () { delete cache[o.id]; });
    }
    return cache[o.id];
  }

  /* Handing over an actual image file is a phone thing. Desktop browsers
     mostly refuse files, so there it becomes a download instead of failing
     in front of somebody. */
  function canSendFiles(f) {
    try {
      return !!(navigator.canShare && navigator.share && navigator.canShare({ files: [f] }));
    } catch (e) { return false; }
  }

  function download(blob, id) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "recovery-misfits-" + id + ".jpg";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  }

  function picture(o) {
    var tell = o.tell || noop;
    tell("Getting it ready…");
    return blobFor(o).then(function (blob) {
      var f = new File([blob], "recovery-misfits-" + o.id + ".jpg", { type: "image/jpeg" });
      if (!canSendFiles(f)) {
        download(blob, o.id);
        tell("Saved to your downloads. The address is printed on it.");
        return;
      }
      return navigator.share({
        files: [f],
        /* Texts and Messenger keep this line and turn it into a link.
           Facebook and Instagram drop it -- which is why the address is
           printed on the picture as well. */
        text: "Recovery Misfits — " + linkFor(o.id)
      }).then(function () { tell(""); }, function (err) {
        /* Backing out of the share sheet is not an error worth shouting about. */
        if (err && err.name === "AbortError") { tell(""); return; }
        /* The phone decided the tap was too long ago. The picture is built
           and kept now, so the next tap goes straight through. */
        if (err && err.name === "NotAllowedError") { tell("Ready — tap share again."); return; }
        download(blob, o.id);
        tell("Saved the image instead — attach it wherever you like.");
      });
    }).catch(function (e) {
      tell("Could not build the share copy. Try again in a second.", true);
      if (window.console) console.error(e);
    });
  }

  function copy(link, tell) {
    var done = function () { tell("Link copied."); };
    var fail = function () { tell("Could not copy — the address is " + link, true); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(link).then(done).catch(fail);
    } else {
      try {
        var t = document.createElement("textarea");
        t.value = link; t.setAttribute("readonly", "");
        t.style.position = "absolute"; t.style.left = "-9999px";
        document.body.appendChild(t); t.select();
        document.execCommand("copy"); t.remove(); done();
      } catch (e) { fail(); }
    }
  }

  /* THE LINK. On a phone this opens the share sheet with the meme's own
     address -- the best way onto Facebook, where it lands as a post with the
     meme on it that somebody can tap straight through. On a desktop there
     is no share sheet, so it copies the address and says so. */
  function link(o) {
    var tell = o.tell || noop;
    var url = linkFor(o.id);
    if (!navigator.share) { copy(url, tell); return; }
    navigator.share({ title: "Recovery Misfits — Meme of the Day", url: url })
      .then(function () { tell(""); })
      .catch(function (err) {
        if (err && (err.name === "AbortError" || err.name === "NotAllowedError")) { tell(""); return; }
        copy(url, tell);
      });
  }

  /* FACEBOOK, FOR A DESKTOP. No share sheet there, so this opens Facebook's
     own share box with the meme's link -- it posts with the meme on it. */
  function facebook(o) {
    window.open("https://www.facebook.com/sharer/sharer.php?u=" + encodeURIComponent(linkFor(o.id)),
                "fbshare", "width=640,height=560,noopener");
  }

  window.RMMemeShare = {
    picture: picture,
    link: link,
    facebook: facebook,
    warm: function (o) { try { blobFor(o); } catch (e) {} },
    linkFor: linkFor,
    hasSheet: !!navigator.share
  };
})();
