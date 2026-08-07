(function() {
  var DATA_URL = "/data/readings.json";
  var FORCE_LABEL = ""; // e.g. "03-03" for testing

  var container = document.getElementById("dailyPostWidget");
  if (!container) return;

  container.innerHTML =
    '<div id="dp-card" class="dp-card">' +
      '<div class="dp-loading" id="dp-loading">Loading today\u2019s post\u2026</div>' +
      '<div class="dp-header" id="dp-header" style="display:none;">' +
        '<div class="dp-brandblock">' +
          '<div class="dp-brandtitle">\uD83D\uDCD6 Another Day Sober</div>' +
          '<div class="dp-subtitle">one day at a time</div>' +
          '<div class="dp-divider"></div>' +
        '</div>' +
        '<div class="dp-texttab" id="dp-textsize" style="display:none;">' +
          '<button class="dp-tabbtn" id="dp-text-smaller" type="button" aria-label="Make text smaller">A\u2212</button>' +
          '<button class="dp-tabbtn" id="dp-text-bigger" type="button" aria-label="Make text bigger">A+</button>' +
          '<button class="dp-tabbtn dp-tabbtn-secondary" id="dp-text-reset" type="button" aria-label="Reset text size">\u21BA</button>' +
        '</div>' +
        '<div class="dp-title" id="dp-title"></div>' +
      '</div>' +
      '<div class="dp-readingwrap">' +
        '<div class="dp-content" id="dp-content"></div>' +
      '</div>' +
      '<div class="dp-pass" id="dp-pass" style="display:none;">' +
        '<div class="dp-pass-label">PASS IT ON</div>' +
        '<div class="dp-actions" id="dp-actions">' +
          '<a class="dp-btn" id="dp-fb" href="#" target="_blank" rel="noopener">Facebook</a>' +
          '<button class="dp-btn" id="dp-sms" type="button">Text</button>' +
          '<button class="dp-btn dp-btn-secondary" id="dp-copy" type="button">Copy link</button>' +
          '<button class="dp-btn dp-btn-ig" id="dp-image" type="button">Share image</button>' +
          '<span class="dp-copied" id="dp-copied" style="display:none;"></span>' +
        '</div>' +
      '</div>' +
      '<div class="dp-error" id="dp-error" style="display:none;"></div>' +
    '</div>';

  var root = container;
  function $(sel){ return root.querySelector(sel); }

  var loadingEl   = $("#dp-loading");
  var headerEl    = $("#dp-header");
  var titleEl     = $("#dp-title");
  var contentEl   = $("#dp-content");
  var passEl      = $("#dp-pass");
  var actionsEl   = $("#dp-actions");
  var errorEl     = $("#dp-error");

  var textSizeWrap = $("#dp-textsize");
  var btnSmaller   = $("#dp-text-smaller");
  var btnBigger    = $("#dp-text-bigger");
  var btnReset     = $("#dp-text-reset");

  // --- TEXT SIZE (same key/range as the old Blogger widget, so returning
  //     visitors keep their saved preference) ---
  var STORAGE_KEY = "dp_reading_size_px";
  var MIN = 14, MAX = 24, STEP = 2, DEFAULT = 16;

  function setReadingSize(px) {
    px = Math.max(MIN, Math.min(MAX, px));
    document.documentElement.style.setProperty("--dp-reading-size", px + "px");
    try { localStorage.setItem(STORAGE_KEY, String(px)); } catch(e) {}
  }

  function getSavedSize() {
    try {
      var v = localStorage.getItem(STORAGE_KEY);
      var n = parseInt(v, 10);
      if (!isNaN(n)) return n;
    } catch(e) {}
    return DEFAULT;
  }

  setReadingSize(getSavedSize());

  if (btnSmaller) btnSmaller.onclick = function() { setReadingSize(getSavedSize() - STEP); };
  if (btnBigger)  btnBigger.onclick  = function() { setReadingSize(getSavedSize() + STEP); };
  if (btnReset)   btnReset.onclick   = function() {
    try { localStorage.removeItem(STORAGE_KEY); } catch(e) {}
    setReadingSize(DEFAULT);
  };

  function getTodayLabel() {
    var d = new Date();
    return String(d.getMonth()+1).padStart(2,"0") + "-" + String(d.getDate()).padStart(2,"0");
  }

  function showError(msg) {
    if (loadingEl) loadingEl.style.display = "none";
    if (errorEl) { errorEl.style.display = "block"; errorEl.textContent = msg; }
  }

  function canNativeShare() {
    return typeof navigator !== "undefined" &&
           typeof navigator.share === "function" &&
           /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || "");
  }

  function copyText(text, cb) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function(){ cb(true); }).catch(function(){ fallback(); });
    } else {
      fallback();
    }
    function fallback() {
      try {
        var ta = document.createElement("textarea");
        ta.value = text;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        ta.setSelectionRange(0, ta.value.length);
        var ok = document.execCommand("copy");
        document.body.removeChild(ta);
        cb(!!ok);
      } catch(e) {
        cb(false);
      }
    }
  }

  function escapeHtml(s){
    return (s || "").replace(/[&<>"']/g, function(m){
      return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m];
    });
  }

  function bodyToHtml(body){
    return (body || "")
      .split(/\n\s*\n/)
      .map(function(p){ return "<p>" + escapeHtml(p).replace(/\n/g, "<br>") + "</p>"; })
      .join("");
  }

  var html2canvasPromise = null;
  function loadHtml2Canvas(){
    if (window.html2canvas) return Promise.resolve(window.html2canvas);
    if (html2canvasPromise) return html2canvasPromise;
    html2canvasPromise = new Promise(function(resolve, reject){
      var s = document.createElement("script");
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
      s.onload = function(){ resolve(window.html2canvas); };
      s.onerror = reject;
      document.head.appendChild(s);
    });
    return html2canvasPromise;
  }

  var params = new URLSearchParams(window.location.search);
  var overrideLabel = params.get("reading");
  var label = FORCE_LABEL || overrideLabel || getTodayLabel();

  fetch(DATA_URL, { cache: "no-store" })
    .then(function(res){ return res.json(); })
    .then(function(readings){
      var entry = readings[label];
      if (!entry) { showError("No post found with label: " + label); return; }

      var postTitle = entry.title || "(Untitled)";
      var postUrl = window.location.origin + window.location.pathname + "?reading=" + label;
      var shareMessage = "Check this out: " + postTitle + " " + postUrl;

      if (titleEl) titleEl.textContent = postTitle;
      if (contentEl) contentEl.innerHTML = bodyToHtml(entry.body);

      var fb = $("#dp-fb");
      var smsBtn = $("#dp-sms");
      var copyBtn = $("#dp-copy");
      var imageBtn = $("#dp-image");
      var copiedEl = $("#dp-copied");

      if (fb) {
        fb.href = "https://www.facebook.com/sharer/sharer.php?u=" + encodeURIComponent(postUrl);
      }

      if (smsBtn) {
        smsBtn.textContent = canNativeShare() ? "Text" : "Copy text";
        smsBtn.onclick = function() {
          if (canNativeShare()) {
            navigator.share({ title: postTitle, text: "Check this out: " + postTitle, url: postUrl })
              .catch(function(){ /* user canceled, ignore */ });
            return;
          }
          copyText(shareMessage, function(ok) {
            showCopied(ok ? "Message copied." : "Copy failed\u2014tap and hold to copy.");
          });
        };
      }

      if (copyBtn) {
        copyBtn.onclick = function() {
          copyText(postUrl, function(ok){
            showCopied(ok ? "Copied." : "Copy failed\u2014tap and hold to copy.");
          });
        };
      }

      if (imageBtn) {
        imageBtn.onclick = function() {
          showCopied("Building image\u2026");
          var card = $("#dp-card");
          var tab = $("#dp-textsize");
          var prevDisplay = tab ? tab.style.display : "";
          if (tab) tab.style.display = "none";
          loadHtml2Canvas().then(function(html2canvas){
            return html2canvas(card, { backgroundColor: "#ffffff", scale: 2 });
          }).then(function(canvas){
            if (tab) tab.style.display = prevDisplay;
            canvas.toBlob(function(blob){
              var file = new File([blob], "another-day-sober-" + label + ".png", { type: "image/png" });
              if (navigator.canShare && navigator.canShare({ files: [file] })) {
                navigator.share({ files: [file], title: postTitle, text: postTitle })
                  .then(function(){ showCopied("Shared."); })
                  .catch(function(){ showCopied(""); });
              } else {
                var a = document.createElement("a");
                a.href = URL.createObjectURL(blob);
                a.download = "another-day-sober-" + label + ".png";
                a.click();
                showCopied("Image downloaded \u2014 attach it in Instagram from your gallery.");
              }
            }, "image/png");
          }).catch(function(){
            if (tab) tab.style.display = prevDisplay;
            showCopied("Could not build image on this device.");
          });
        };
      }

      if (loadingEl) loadingEl.style.display = "none";
      if (headerEl) headerEl.style.display  = "block";
      if (textSizeWrap) textSizeWrap.style.display = "flex";
      if (passEl) passEl.style.display = "block";
      if (actionsEl) actionsEl.style.display = "flex";

      function showCopied(msg) {
        if (!copiedEl) return;
        if (!msg) { copiedEl.style.display = "none"; return; }
        copiedEl.style.display = "inline";
        copiedEl.textContent = msg;
        clearTimeout(copiedEl._t);
        copiedEl._t = setTimeout(function(){ copiedEl.style.display = "none"; }, 2200);
      }
    })
    .catch(function(){
      showError("Reading data failed to load. Check the file path or try again.");
    });
})();
