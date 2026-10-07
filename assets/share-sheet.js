/* ===========================================================================
   THE SHARE SHEET -- ONE SHEET FOR EVERY SHARE BUTTON (v232, 7 Oct 2026).

   Mike: "anywhere we have a share button for like memes, coins, etc, i want
   to think of a clever way to have it share to the porch, facebook instagram,
   tik tok etc, like include us in the sharing not keep us separate."

   So every share button opens THIS, and it looks the same everywhere:
     a little preview of what is going out
     THE PORCH, first and biggest
     then Facebook, Instagram, TikTok, Text, Copy link
     and a switch: "Put it on the Porch too" when it is sent out

   HOW A PAGE USES IT
     RMShare.open({
       title: "Meme of the Day",          the bold line in the preview
       sub:   "October 7",                the small line under it (optional)
       thumb: "/assets/memes/051.jpg",    a picture for the preview (optional)
       picture: function () { return Promise<Blob>; },   the picture that LEAVES
       porchPicture: function () { ... },  the picture the Porch gets (optional; else `picture`)
       name:  "recovery-misfits-051.jpg",  file name for the picture
       link:  "https://recoverymisfits.org/meme/051/",   optional; no link = no Copy link
       text:  "Recovery Misfits",          the words that ride along
       porch: true                         false hides the Porch row and the switch
     });

   WHAT A WEB PAGE CAN AND CAN'T DO. A page cannot post straight into Instagram
   or TikTok. Those two hand the picture to the phone's own share menu, where
   the apps are. Facebook opens its own share box when there is a link. Text
   opens the phone's messages with the link in it.

   NOTHING POSTS TO THE PORCH BY ITSELF. The Porch row (and the switch) open a
   new share on the Porch with the picture already in it. They still tap Share.

   THE ICONS are plain ones in our own colors, not the companies' logos.

   Phone first, 393 wide. The phone's back button closes the sheet.
   ======================================================================== */
(function () {
  "use strict";
  if (window.RMShare) return;

  var KEY_TOO = "rm_share_porch_too";
  var el = null, cur = null, blobP = null, porchP = null, pushed = false, waiting = null;

  function tooOn() { try { return localStorage.getItem(KEY_TOO) !== "0"; } catch (e) { return true; } }
  function setToo(v) { try { localStorage.setItem(KEY_TOO, v ? "1" : "0"); } catch (e) {} }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  var CSS =
    "#rmShare{position:fixed;inset:0;z-index:2147483000;display:none;font-family:system-ui,-apple-system,'Segoe UI',Roboto,Arial,sans-serif}" +
    "#rmShare.on{display:block}" +
    "#rmShare *{box-sizing:border-box}" +
    "#rmShare .rs-dim{position:absolute;inset:0;background:rgba(0,0,0,.62);opacity:0;transition:opacity .2s}" +
    "#rmShare.in .rs-dim{opacity:1}" +
    "#rmShare .rs-sheet{position:absolute;left:0;right:0;bottom:0;max-width:520px;margin:0 auto;max-height:92%;overflow-y:auto;padding:10px 18px calc(22px + env(safe-area-inset-bottom,0px));border-radius:26px 26px 0 0;background:#f7f1e3;color:#1b1a17;box-shadow:0 -10px 40px rgba(0,0,0,.6);transform:translateY(105%);transition:transform .28s cubic-bezier(.2,.9,.3,1)}" +
    "#rmShare.in .rs-sheet{transform:none}" +
    "#rmShare .rs-grab{width:44px;height:5px;border-radius:3px;background:#cfc5ad;margin:0 auto 14px}" +
    "#rmShare .rs-x{position:absolute;right:14px;top:14px;width:38px;height:38px;border:0;border-radius:50%;background:#e9e0cc;color:#1b1a17;font:700 16px Arial,sans-serif;cursor:pointer}" +
    "#rmShare h3{margin:0 0 12px;font:800 20px/1.2 Arial,sans-serif;color:#1b1a17}" +
    "#rmShare .rs-prev{display:flex;gap:12px;align-items:center;padding:10px;border-radius:16px;background:#fffdf7;border:1px solid #e2d8c2;margin-bottom:14px}" +
    "#rmShare .rs-prev img,#rmShare .rs-prev i{flex:none;width:64px;height:64px;border-radius:10px;object-fit:cover;background:linear-gradient(160deg,#caa24a,#5a4520)}" +
    "#rmShare .rs-prev b{display:block;font:700 15px/1.25 Arial,sans-serif}" +
    "#rmShare .rs-prev small{color:#6e675b;font:13px Arial,sans-serif}" +
    "#rmShare .rs-porch{display:flex;align-items:center;gap:14px;width:100%;padding:14px 16px;border-radius:18px;background:#1b1a17;color:#f1e7cf;border:2px solid #d8b45b;text-align:left;cursor:pointer;font-family:Arial,sans-serif}" +
    "#rmShare .rs-porch:active{transform:scale(.985)}" +
    "#rmShare .rs-badge{flex:none;width:48px;height:48px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#f3d98c,#b88f2f);display:grid;place-items:center;color:#17130b}" +
    "#rmShare .rs-badge svg{width:26px;height:26px;fill:none;stroke:currentColor;stroke-width:2.200;stroke-linecap:round;stroke-linejoin:round}" +
    "#rmShare .rs-porch b{display:block;font-size:18px}" +
    "#rmShare .rs-porch small{color:#b7b0a2;font-size:13px}" +
    "#rmShare .rs-porch em{margin-left:auto;flex:none;font-style:normal;padding:10px 16px;border-radius:999px;background:#d8b45b;color:#17130b;font:800 14px Arial,sans-serif}" +
    "#rmShare .rs-lab{margin:18px 2px 10px;font:800 11.500px Arial,sans-serif;letter-spacing:1.500px;color:#6e675b}" +
    "#rmShare .rs-row{display:flex;justify-content:space-between;gap:4px}" +
    "#rmShare .rs-app{flex:1;min-width:0;padding:0;border:0;background:none;color:#1b1a17;font:700 11.500px Arial,sans-serif;text-align:center;cursor:pointer}" +
    "#rmShare .rs-app[hidden]{display:none}" +
    "#rmShare .rs-app span{position:relative;display:grid;place-items:center;width:56px;height:56px;border-radius:50%;margin:0 auto 6px;background:#1b1a17;color:#f1e7cf;transition:transform .12s}" +
    "#rmShare .rs-app:active span{transform:scale(.9)}" +
    "#rmShare .rs-app.lite span{background:#e9e0cc;color:#1b1a17}" +
    "#rmShare .rs-app svg{width:27px;height:27px;fill:none;stroke:currentColor;stroke-width:1.900;stroke-linecap:round;stroke-linejoin:round}" +
    "#rmShare .rs-app .rs-f{font:900 30px/1 Georgia,'Times New Roman',serif}" +
    "#rmShare .busy span::after,#rmShare .rs-porch.busy .rs-badge::after{content:'';position:absolute;inset:-4px;border-radius:50%;border:3px solid rgba(216,180,91,.3);border-top-color:#d8b45b;animation:rsSpin .7s linear infinite}" +
    "#rmShare .rs-porch .rs-badge{position:relative}" +
    "@keyframes rsSpin{to{transform:rotate(360deg)}}" +
    "#rmShare .rs-too{display:flex;align-items:center;gap:10px;width:100%;margin-top:18px;padding:12px 14px;border-radius:14px;background:#fffdf7;border:1px solid #e2d8c2;color:#1b1a17;font:14.500px/1.3 Arial,sans-serif;text-align:left;cursor:pointer}" +
    "#rmShare .rs-too[hidden]{display:none}" +
    "#rmShare .rs-too small{display:block;color:#6e675b;font-size:13px}" +
    "#rmShare .rs-sw{margin-left:auto;flex:none;width:46px;height:28px;border-radius:14px;background:#cfc5ad;position:relative;transition:background .15s}" +
    "#rmShare .rs-sw::after{content:'';position:absolute;left:3px;top:3px;width:22px;height:22px;border-radius:50%;background:#fff;transition:transform .15s}" +
    "#rmShare .rs-too.on .rs-sw{background:#d8b45b}" +
    "#rmShare .rs-too.on .rs-sw::after{transform:translateX(18px)}" +
    "#rmShare .rs-say{min-height:20px;margin:12px 2px 0;color:#1b1a17;font:700 14px/1.35 Arial,sans-serif;text-align:center}" +
    "#rmShare .rs-say.bad{color:#a3261c}" +
    "#rmShare .rs-hint{margin:10px 2px 0;color:#6e675b;font:12.500px/1.35 Arial,sans-serif;text-align:center}";

  var ICO = {
    porch: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.500 10.500 12 4l9.500 6.500"/><path d="M5 9.500V20M19 9.500V20M2.500 20h19"/><path d="M9.500 20v-5.500h5V20"/></svg>',
    cam: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.500" y="6.500" width="17" height="13" rx="3"/><circle cx="12" cy="13" r="3.400"/><path d="M8.500 6.500l1.200-2h4.600l1.200 2"/></svg>',
    note: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 17.500V5l8-1.500V15"/><circle cx="7.500" cy="17.500" r="2.500"/><circle cx="15.500" cy="15" r="2.500"/></svg>',
    msg: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4.500c4.700 0 8.500 3.100 8.500 7s-3.800 7-8.500 7c-1 0-2-.100-2.900-.400L4.500 19.500l1.200-3.600A6.300 6.300 0 0 1 3.500 11.500c0-3.900 3.800-7 8.500-7z"/></svg>',
    link: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 14a4 4 0 0 0 5.700 0l3-3a4 4 0 0 0-5.700-5.700l-1 1"/><path d="M14 10a4 4 0 0 0-5.700 0l-3 3a4 4 0 0 0 5.700 5.700l1-1"/></svg>'
  };

  function build() {
    if (el) return;
    var st = document.createElement("style"); st.textContent = CSS; document.head.appendChild(st);
    el = document.createElement("div"); el.id = "rmShare"; el.setAttribute("role", "dialog"); el.setAttribute("aria-modal", "true"); el.setAttribute("aria-label", "Share this");
    el.innerHTML =
      '<div class="rs-dim" data-rs="x"></div>' +
      '<div class="rs-sheet"><div class="rs-grab"></div><button type="button" class="rs-x" data-rs="x" aria-label="Close">&#10005;</button>' +
      "<h3>Share this</h3>" +
      '<div class="rs-prev" id="rsPrev"></div>' +
      '<button type="button" class="rs-porch" data-rs="porch" id="rsPorch"><span class="rs-badge">' + ICO.porch + "</span><span><b>The Porch</b><small>Share it with the misfits</small></span><em>Share</em></button>" +
      '<div class="rs-lab" id="rsLab">OR SEND IT OUT</div>' +
      '<div class="rs-row">' +
        '<button type="button" class="rs-app" data-rs="fb"><span><i class="rs-f" aria-hidden="true">f</i></span>Facebook</button>' +
        '<button type="button" class="rs-app" data-rs="ig"><span>' + ICO.cam + "</span>Instagram</button>" +
        '<button type="button" class="rs-app" data-rs="tt"><span>' + ICO.note + "</span>TikTok</button>" +
        '<button type="button" class="rs-app" data-rs="sms"><span>' + ICO.msg + "</span>Text</button>" +
        '<button type="button" class="rs-app lite" data-rs="copy" id="rsCopy"><span>' + ICO.link + "</span>Copy link</button>" +
      "</div>" +
      '<button type="button" class="rs-too" data-rs="too" id="rsToo" role="switch"><span><b>Put it on the Porch too</b><small>when I send it out</small></span><span class="rs-sw"></span></button>' +
      '<p class="rs-say" id="rsSay" role="status" aria-live="polite"></p>' +
      '<p class="rs-hint" id="rsHint"></p></div>';
    document.body.appendChild(el);
    el.addEventListener("click", onTap);
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && el.classList.contains("on")) close(); });
  }

  function $(id) { return document.getElementById(id); }
  function say(t, bad) { var s = $("rsSay"); if (!s) return; s.textContent = t || ""; s.classList.toggle("bad", !!bad); }
  function busy(b, on) { if (b) b.classList.toggle("busy", !!on); }

  function open(o) {
    build();
    cur = o || {}; blobP = null; porchP = null; waiting = null;
    $("rsPrev").innerHTML = (cur.thumb ? '<img src="' + esc(cur.thumb) + '" alt="">' : "<i></i>") +
      "<div><b>" + esc(cur.title || "Recovery Misfits") + "</b>" + (cur.sub ? "<small>" + esc(cur.sub) + "</small>" : "") + "</div>";
    var canPorch = cur.porch !== false && !!window.RMToPorch;
    $("rsPorch").hidden = !canPorch; $("rsPorch").style.display = canPorch ? "" : "none";
    $("rsLab").textContent = canPorch ? "OR SEND IT OUT" : "SEND IT OUT";
    $("rsToo").hidden = !canPorch;
    paintToo();
    $("rsCopy").hidden = !cur.link;
    $("rsHint").textContent = navigator.share ? "Instagram and TikTok open your phone's share menu with the picture ready." : "On a computer, Instagram and TikTok save the picture so you can add it there.";
    say("");
    el.querySelectorAll(".busy").forEach(function (b) { b.classList.remove("busy"); });
    el.classList.add("on");
    requestAnimationFrame(function () { requestAnimationFrame(function () { el.classList.add("in"); }); });
    try { history.pushState({ rmShare: 1 }, ""); pushed = true; } catch (e) { pushed = false; }
    /* start building the picture NOW: a phone only lets a page open its share menu for a few
       seconds after a tap, so the picture has to be ready before the tap, not after it */
    try { getBlob(); } catch (e) {}
  }
  function hide() {
    if (!el) return;
    el.classList.remove("in");
    setTimeout(function () { if (!el.classList.contains("in")) el.classList.remove("on"); }, 260);
    cur = null; waiting = null;
  }
  function close() { if (pushed) { pushed = false; try { history.back(); return; } catch (e) {} } hide(); }
  function paintToo() { var on = tooOn(); $("rsToo").classList.toggle("on", on); $("rsToo").setAttribute("aria-checked", on ? "true" : "false"); }

  function getBlob() {
    if (!blobP) {
      if (!cur || !cur.picture) return Promise.reject(new Error("no picture"));
      blobP = Promise.resolve().then(cur.picture);
      blobP.catch(function () { blobP = null; });
    }
    return blobP;
  }
  function getPorchBlob() {
    if (!cur) return Promise.reject(new Error("closed"));
    if (!cur.porchPicture) return getBlob();
    if (!porchP) { porchP = Promise.resolve().then(cur.porchPicture); porchP.catch(function () { porchP = null; }); }
    return porchP;
  }
  function fileOf(blob) {
    var name = (cur && cur.name) || "recovery-misfits.jpg";
    return new File([blob], name, { type: blob.type || "image/jpeg" });
  }
  function canFiles(f) { try { return !!(navigator.canShare && navigator.share && navigator.canShare({ files: [f] })); } catch (e) { return false; } }
  function download(blob) {
    var u = URL.createObjectURL(blob), a = document.createElement("a");
    a.href = u; a.download = (cur && cur.name) || "recovery-misfits.jpg";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(u); }, 4000);
  }
  function words() { var t = (cur && cur.text) || "Recovery Misfits"; return cur && cur.link ? t + " " + cur.link : t; }

  /* ---- THE PORCH ---- */
  function toPorch(btn) {
    var o = cur; if (!o) return;
    busy(btn, true); say("Getting it ready for the Porch…");
    getPorchBlob().then(function (blob) {
      say("Opening the Porch…");
      pushed = false;                                   /* we are leaving the page; nothing to step back from */
      return window.RMToPorch({ blob: blob, name: o.name || "recovery-misfits.jpg" });
    }).catch(function () { busy(btn, false); say("Couldn't get the picture. Try again.", true); });
  }

  /* after it has gone out: the Porch too, when the switch is on */
  function sentOut(what) {
    if (!cur) return;
    if (cur.porch !== false && window.RMToPorch && tooOn()) {
      say("Sent" + (what ? " to " + what : "") + " ✓  Now the Porch…");
      var b = $("rsPorch");
      setTimeout(function () { if (cur) toPorch(b); }, 900);
    } else {
      say("Sent" + (what ? " to " + what : "") + " ✓");
      setTimeout(function () { if (cur) close(); }, 1100);
    }
  }
  /* things that open another app or window: we find out they are done when the person comes back */
  function whenBack(what) {
    waiting = what;
    var left = false, done = false;
    var fin = function () { if (done) return; done = true; document.removeEventListener("visibilitychange", vis); window.removeEventListener("blur", blur); window.removeEventListener("focus", focus); if (waiting === what && cur) sentOut(what); };
    var vis = function () { if (document.visibilityState === "hidden") left = true; else if (left) fin(); };
    var blur = function () { left = true; };
    var focus = function () { if (left) setTimeout(fin, 250); };
    document.addEventListener("visibilitychange", vis); window.addEventListener("blur", blur); window.addEventListener("focus", focus);
    setTimeout(function () { if (!left && !done) { done = true; document.removeEventListener("visibilitychange", vis); window.removeEventListener("blur", blur); window.removeEventListener("focus", focus); } }, 20000);
  }

  /* ---- THE PICTURE, THROUGH THE PHONE'S SHARE MENU (Instagram, TikTok, and Facebook/Text with no link) ---- */
  function pictureOut(btn, what) {
    busy(btn, true); say("Getting it ready…");
    getBlob().then(function (blob) {
      var f = fileOf(blob);
      if (!canFiles(f)) {
        download(blob); busy(btn, false);
        say("Saved the picture. Add it in " + what + " from your downloads.");
        return;
      }
      say("");
      return navigator.share({ files: [f], text: words() }).then(function () { busy(btn, false); sentOut(""); }, function (err) {
        busy(btn, false);
        if (err && err.name === "AbortError") { say(""); return; }
        if (err && err.name === "NotAllowedError") { say("Ready. Tap " + what + " again."); return; }
        download(blob); say("Saved the picture instead. Add it in " + what + ".");
      });
    }).catch(function () { busy(btn, false); say("Couldn't make the picture. Try again in a second.", true); });
  }

  function copyLink(btn) {
    var link = cur && cur.link; if (!link) return;
    var ok = function () { say("Link copied ✓"); }, bad = function () { say("The link is " + link); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(link).then(ok, bad);
    else {
      try { var t = document.createElement("textarea"); t.value = link; t.setAttribute("readonly", ""); t.style.position = "absolute"; t.style.left = "-9999px"; document.body.appendChild(t); t.select(); document.execCommand("copy"); t.remove(); ok(); }
      catch (e) { bad(); }
    }
  }

  function onTap(e) {
    var b = e.target.closest("[data-rs]"); if (!b || !cur) { if (b && b.dataset.rs === "x") close(); return; }
    var k = b.dataset.rs;
    if (k === "x") return close();
    if (k === "too") { setToo(!tooOn()); return paintToo(); }
    if (b.classList.contains("busy")) return;
    if (k === "porch") return toPorch(b);
    if (k === "copy") return copyLink(b);
    if (k === "ig") return pictureOut(b, "Instagram");
    if (k === "tt") return pictureOut(b, "TikTok");
    if (k === "fb") {
      if (!cur.link) return pictureOut(b, "Facebook");
      /* with a link, Facebook's own share box posts it with the picture on it and a tap leads back here */
      say("Opening Facebook…");
      window.open("https://www.facebook.com/sharer/sharer.php?u=" + encodeURIComponent(cur.link), "fbshare", "width=640,height=560,noopener");
      return whenBack("Facebook");
    }
    if (k === "sms") {
      if (!cur.link) return pictureOut(b, "a text");
      say("Opening your messages…");
      var body = encodeURIComponent(words());
      /* iPhone wants sms:&body= and Android wants sms:?body= ; this spelling works on both */
      location.href = "sms:" + (/iPad|iPhone|iPod/.test(navigator.userAgent) ? "&" : "?") + "body=" + body;
      return whenBack("a text");
    }
  }

  /* THE PHONE'S BACK BUTTON CLOSES THE SHEET, and only the sheet. This file is loaded before each page's own
     script, so this listener runs first and stops the page from also closing whatever is underneath. */
  window.addEventListener("popstate", function (e) {
    if (el && el.classList.contains("on") && pushed) { pushed = false; hide(); e.stopImmediatePropagation(); }
  });

  window.RMShare = { open: open, close: close };
})();
