/* PORCH SOUNDS (1 Oct 2026, Mike: "sound notifications for new messages"). A soft
 * two-note ding when a message or notification comes in while the app is open, and a
 * quieter pop for a new message in the chat you're looking at. Made right here with the
 * phone's own sound maker, so there's no sound file to download.
 *
 *   RMSound.ding()   something new came in
 *   RMSound.pop()    a new message in the open chat
 *   RMSound.on()     are sounds on?        RMSound.set(true|false)
 *
 * Phones only let a page make noise after it's been touched once, so the first tap
 * anywhere wakes the sound up. Until then these quietly do nothing.
 * (The phone's own alert sound, when the app is closed, is the phone's to pick.)
 */
(function () {
  'use strict';
  if (window.RMSound) return;
  var KEY = 'rm_sounds', ctx = null, last = 0;
  function on() { try { return localStorage.getItem(KEY) !== 'off'; } catch (e) { return true; } }
  function set(v) { try { localStorage.setItem(KEY, v ? 'on' : 'off'); } catch (e) {} }
  function wake() {
    try {
      if (!ctx) { var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return; ctx = new AC(); }
      if (ctx.state === 'suspended') ctx.resume();
    } catch (e) {}
  }
  ['pointerdown', 'keydown', 'touchend'].forEach(function (ev) { document.addEventListener(ev, wake, { passive: true }); });
  function note(freq, at, len, vol) {
    var o = ctx.createOscillator(), g = ctx.createGain(), t = ctx.currentTime + at;
    o.type = 'sine'; o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    o.connect(g); g.connect(ctx.destination);
    o.start(t); o.stop(t + len + 0.05);
  }
  function play(notes) {
    if (!on() || !ctx || ctx.state !== 'running' || document.hidden) return;
    var now = Date.now(); if (now - last < 1200) return;      /* never a pile of dings */
    last = now;
    try { notes.forEach(function (n) { note(n[0], n[1], n[2], n[3]); }); } catch (e) {}
  }
  window.RMSound = {
    on: on, set: set,
    ding: function () { play([[880, 0, 0.32, 0.16], [1318.5, 0.11, 0.5, 0.13]]); },
    pop: function () { play([[660, 0, 0.16, 0.1]]); }
  };
})();
