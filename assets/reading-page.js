(function() {
  var data = window.__ADS_STATIC_PAGE__;
  if (!data) return;

  var root = document.getElementById("dp-card");
  if (!root) return;
  function $(sel){ return root.querySelector(sel); }

  var textSizeWrap = $("#dp-textsize");
  var btnSmaller   = $("#dp-text-smaller");
  var btnBigger    = $("#dp-text-bigger");
  var btnReset     = $("#dp-text-reset");

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

  function canNativeShare() {
    return typeof navigator !== "undefined" &&
           typeof navigator.share === "function" &&
           /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || "");
  }

  function copyText(text, cb) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function(){ cb(true); }).catch(function(){ fallback(); });
    } else { fallback(); }
    function fallback() {
      try {
        var ta = document.createElement("textarea");
        ta.value = text; ta.setAttribute("readonly", "");
        ta.style.position = "fixed"; ta.style.left = "-9999px";
        document.body.appendChild(ta); ta.select(); ta.setSelectionRange(0, ta.value.length);
        var ok = document.execCommand("copy");
        document.body.removeChild(ta);
        cb(!!ok);
      } catch(e) { cb(false); }
    }
  }

  var smsBtn = $("#dp-sms");
  var copyBtn = $("#dp-copy");
  var imageBtn = $("#dp-image");
  var copiedEl = $("#dp-copied");

  function showCopied(msg) {
    if (!copiedEl) return;
    if (!msg) { copiedEl.style.display = "none"; return; }
    copiedEl.style.display = "inline";
    copiedEl.textContent = msg;
    clearTimeout(copiedEl._t);
    copiedEl._t = setTimeout(function(){ copiedEl.style.display = "none"; }, 2200);
  }

  var shareMessage = "Check this out: " + data.title + " " + data.url;

  if (smsBtn) {
    smsBtn.textContent = canNativeShare() ? "Text" : "Copy text";
    smsBtn.onclick = function() {
      if (canNativeShare()) {
        navigator.share({ title: data.title, text: "Check this out: " + data.title, url: data.url })
          .catch(function(){});
        return;
      }
      copyText(shareMessage, function(ok) {
        showCopied(ok ? "Message copied." : "Copy failed\u2014tap and hold to copy.");
      });
    };
  }

  if (copyBtn) {
    copyBtn.onclick = function() {
      copyText(data.url, function(ok){
        showCopied(ok ? "Copied." : "Copy failed\u2014tap and hold to copy.");
      });
    };
  }

  if (imageBtn) {
    imageBtn.onclick = function() {
      showCopied("Building image\u2026");
      var tab = textSizeWrap;
      var prevDisplay = tab ? tab.style.display : "";
      if (tab) tab.style.display = "none";
      var loadPromise = window.html2canvas
        ? Promise.resolve(window.html2canvas)
        : new Promise(function(resolve, reject){
            var s = document.createElement("script");
            s.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
            s.onload = function(){ resolve(window.html2canvas); };
            s.onerror = reject;
            document.head.appendChild(s);
          });
      loadPromise.then(function(html2canvas){
        return html2canvas(root, { backgroundColor: "#ffffff", scale: 2 });
      }).then(function(canvas){
        if (tab) tab.style.display = prevDisplay;
        canvas.toBlob(function(blob){
          var file = new File([blob], "another-day-sober-" + data.label + ".png", { type: "image/png" });
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            navigator.share({ files: [file], title: data.title, text: data.title })
              .then(function(){ showCopied("Shared."); })
              .catch(function(){ showCopied(""); });
          } else {
            var a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = "another-day-sober-" + data.label + ".png";
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
})();
