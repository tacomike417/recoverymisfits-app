/* ===========================================================================
   COMIC PANEL CUTSCENE PLAYER

   Shows a scene from cutscenes.js as comic panels: picture snaps in, sound
   fires, balloons pop, tap to advance.

   WHY PANELS AND NOT VIDEO. A generated video of a room going quiet costs
   hours and comes back melted. Three pictures cut together cost minutes and
   read as film, because the CUT is what tells the story -- door, faces,
   dropped coffee pot, and the brain fills in the rest. That is not a budget
   compromise, it is how comics and movies have always worked.

   HOW TO USE IT
       HalloweenGame.playCutscene("cs1", function () { ...carry on... });

   The callback runs when the scene finishes OR when the player backs out of
   it. Either way it runs exactly once, so whatever comes next can just be
   put in there without guarding.

   IT RUNS ITSELF. Panels advance on their own, like a movie -- nobody has
   to tap through a story to see it. How long a panel stays up is worked out
   from what is actually on it: how long the balloons take to pop, plus
   reading time for the words in them, plus the panel's own beat. A silent
   panel is short. A panel with two lines of dialogue waits long enough to
   read them twice.

   Tapping still works and still means "I am ready" -- mid-balloons it
   brings them all in at once, after that it jumps to the next panel. So a
   fast reader never waits and a slow one is never rushed, which is the same
   deal as before; the difference is that doing nothing now also works.

   Put `secs: 4` on a panel in cutscenes.js to override the timing, or
   `autoplay: false` on the scene to go back to tap-only.

   GETTING OUT. No on-screen back button -- those get missed and they clutter
   a panel. Instead the scene is a history entry, so the phone's own back
   button and the iPhone edge swipe close it and land you exactly where you
   were, still inside the app. Escape does the same on a desktop. A tap
   anywhere advances; a tap during the balloons brings them all in at once,
   so an impatient thumb never has to wait and a slow reader is never rushed.
   ======================================================================== */
(function () {
    "use strict";

    var ASSET_IMG = "assets/cutscenes/";
    var ASSET_SND = "assets/audio/";

    /* Same base-URL resolution the rest of the game uses, so these load
       through the identical path as every working image. */
    function url(p) {
        try { return new URL(p, document.baseURI).href; } catch (e) { return p; }
    }

    /* ---- the one stylesheet, injected once -------------------------------
       THE STAGE IS ALWAYS 9:16. Phones are not all the same shape, so
       instead of cropping the art (which would eat the headroom the
       balloons live in) the stage is fitted inside the screen and the rest
       goes black. Letterboxing a comic panel reads as deliberate. It also
       means a balloon placed at "top-left" is in the same place on every
       phone, which is the part that actually matters. */
    var CSS = [
        "@font-face{font-family:'BangersCS';src:url('" + url("assets/fonts/Bangers-Regular.ttf") + "') format('truetype');font-display:swap}",
        ".rmcs{position:fixed;inset:0;z-index:99999;background:#000;display:flex;",
          "align-items:center;justify-content:center;overflow:hidden;",
          "-webkit-tap-highlight-color:transparent;touch-action:manipulation;",
          "opacity:0;transition:opacity .18s ease}",
        ".rmcs.in{opacity:1}",
        ".rmcs-stage{position:relative;aspect-ratio:941/1672;height:100%;max-width:100%;",
          "width:auto;overflow:hidden;background:#000}",
        "@supports not (aspect-ratio:1/1){.rmcs-stage{height:100%;width:56.28vh}}",
        ".rmcs-art{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;",
          "display:block;will-change:transform,opacity}",
        /* THE SNAP. Not a fade -- a hard arrival. The panel lands slightly
           big and settles, which reads as a page being dealt down. */
        "@keyframes rmcs-snap{0%{transform:scale(1.07) rotate(.5deg);opacity:0}",
          "12%{opacity:1}100%{transform:scale(1) rotate(0deg);opacity:1}}",
        ".rmcs-art.play{animation:rmcs-snap .34s cubic-bezier(.2,.9,.25,1) both}",
        /* balloons */
        ".rmcs-b{position:absolute;max-width:62%;padding:10px 14px 12px;",
          "background:#fff;color:#111;border:3px solid #111;border-radius:18px;",
          "box-shadow:4px 5px 0 rgba(0,0,0,.85);",
          "font-family:'BangersCS','Comic Sans MS','Trebuchet MS',sans-serif;",
          "font-size:clamp(15px,3.6vh,26px);line-height:1.12;letter-spacing:.4px;",
          "opacity:0;transform:scale(.7);pointer-events:none}",
        "@keyframes rmcs-pop{0%{opacity:0;transform:scale(.7)}",
          "60%{opacity:1;transform:scale(1.06)}100%{opacity:1;transform:scale(1)}}",
        ".rmcs-b.pop{animation:rmcs-pop .22s ease-out both}",
        ".rmcs-b.bob{background:#eaf2ff}",
        /* the crowd gets the jagged one -- it is a room shouting, not a person */
        ".rmcs-b.crowd{background:#fff3c4;border-width:4px;transform:rotate(-1.5deg) scale(.7);",
          "clip-path:polygon(0 8%,6% 0,18% 7%,32% 1%,46% 8%,60% 1%,74% 8%,88% 1%,100% 9%,",
          "96% 26%,100% 44%,95% 62%,100% 80%,90% 92%,76% 86%,62% 96%,48% 88%,34% 97%,",
          "20% 88%,8% 96%,0 82%,5% 62%,0 44%,5% 26%);padding:20px 24px;max-width:78%;",
          "box-shadow:none;border:0;outline:0}",
        "@keyframes rmcs-pop-crowd{0%{opacity:0;transform:rotate(-1.5deg) scale(.7)}",
          "60%{opacity:1;transform:rotate(-1.5deg) scale(1.08)}",
          "100%{opacity:1;transform:rotate(-1.5deg) scale(1)}}",
        ".rmcs-b.crowd.pop{animation:rmcs-pop-crowd .24s ease-out both}",
        ".rmcs-b.world{background:#111;color:#fff;border-color:#fff;box-shadow:4px 5px 0 rgba(255,255,255,.25)}",
        /* placements, in percentages of the stage */
        ".rmcs-b.at-top-left{left:5%;top:5%}",
        ".rmcs-b.at-top-right{right:5%;top:5%}",
        ".rmcs-b.at-top{left:50%;top:6%;transform-origin:50% 0;margin-left:-39%}",
        ".rmcs-b.at-top.crowd{margin-left:-39%}",
        ".rmcs-b.at-mid-left{left:5%;top:38%}",
        ".rmcs-b.at-mid-right{right:5%;top:38%}",
        /* the nudge -- appears only once the panel has had its moment */
        ".rmcs-next{position:absolute;right:16px;bottom:18px;",
          "font-family:'BangersCS','Comic Sans MS',sans-serif;font-size:14px;",
          "letter-spacing:1.5px;color:#fff;opacity:0;transition:opacity .3s ease;",
          "text-shadow:0 2px 6px #000;pointer-events:none}",
        ".rmcs-next.on{opacity:.8;animation:rmcs-blink 1.6s ease-in-out infinite}",
        "@keyframes rmcs-blink{0%,100%{opacity:.85}50%{opacity:.35}}",
        /* THE TIMER LINE. A panel that moves on by itself needs to say so,
           or the first one feels like the app skipped. A hairline creeping
           across the bottom is enough -- you stop noticing it by panel two,
           which is exactly right. */
        ".rmcs-timer{position:absolute;left:0;bottom:0;height:3px;width:100%;",
          "background:rgba(255,255,255,.1)}",
        ".rmcs-timer i{display:block;height:100%;width:0;background:#e9c46a;",
          "box-shadow:0 0 8px rgba(233,196,106,.6)}",
        ".rmcs-timer i.run{transition:width linear}",
        /* progress pips, so nobody wonders how much is left */
        ".rmcs-pips{position:absolute;left:16px;bottom:20px;display:flex;gap:6px}",
        ".rmcs-pip{width:7px;height:7px;border-radius:50%;background:rgba(255,255,255,.28)}",
        ".rmcs-pip.on{background:#fff}",
        "@media (prefers-reduced-motion:reduce){",
          ".rmcs-art.play,.rmcs-b.pop,.rmcs-b.crowd.pop{animation-duration:.01ms}",
          ".rmcs-next.on{animation:none}}"
    ].join("");

    /* HOW LONG A PANEL STAYS UP.
       Guessing one number for every panel is what makes auto-advancing
       cutscenes feel wrong -- the silent ones drag and the talky ones clip.
       So it is measured instead: the beat after the art lands, the time the
       last balloon takes to arrive, reading time for every word on the
       panel, and then the panel's own hold.

       220ms a word is deliberately generous. Comfortable adult reading is
       nearer 200 and these are five-word balloons where the last word
       lands as you finish the first, so erring long costs nothing and
       erring short means somebody misses a joke. */
    var MS_PER_WORD = 220;
    function panelMs(p) {
        if (p.secs != null) return p.secs * 1000;          /* hand-set wins */
        var lines = p.lines || [];
        var lastPop = 0, words = 0;
        lines.forEach(function (ln, i) {
            var w = ln.wait == null ? (360 + i * 1100) : ln.wait;
            if (w > lastPop) lastPop = w;
            words += String(ln.text || "").split(/\s+/).filter(Boolean).length;
        });
        var read = words * MS_PER_WORD;
        var hold = p.hold == null ? 1400 : p.hold;
        var total = lastPop + read + hold;
        /* A wordless panel still needs a beat to register -- the coffee pot
           is the whole joke and it cannot be gone before it is seen. */
        return Math.max(lines.length ? 1800 : 1500, total);
    }

    var styled = false;
    function injectCss() {
        if (styled) return;
        styled = true;
        var s = document.createElement("style");
        s.setAttribute("data-rmcs", "1");
        s.textContent = CSS;
        document.head.appendChild(s);
    }

    /* ---- sound ------------------------------------------------------------
       ONE ELEMENT PER FILE, REUSED. Making a new Audio() per panel leaks
       elements on a long scene and, on iOS, burns through the small number
       of audio objects a page is allowed before it quietly stops playing
       anything. Sound is decoration here: if a file is missing or the
       browser refuses to play it, the scene carries on without it and never
       blocks on the promise. */
    var sounds = {};
    function sfx(file, opts) {
        if (!file) return null;
        opts = opts || {};
        var a = sounds[file];
        if (!a) {
            a = new Audio(url(ASSET_SND + file));
            a.preload = "auto";
            sounds[file] = a;
        }
        a.loop = !!opts.loop;
        a.volume = opts.volume == null ? 1 : opts.volume;
        try { a.currentTime = 0; } catch (e) {}
        var p = a.play();
        if (p && p.catch) p.catch(function () {});   /* autoplay refused -- fine */
        return a;
    }
    function hush(a) {
        if (!a) return;
        try { a.pause(); a.currentTime = 0; } catch (e) {}
    }
    function preload(scene) {
        scene.panels.forEach(function (p) {
            if (p.img) { var i = new Image(); i.src = url(ASSET_IMG + scene.id + "/" + p.img); }
            [p.sound, p.bed].forEach(function (f) {
                if (f && !sounds[f]) {
                    var a = new Audio(url(ASSET_SND + f));
                    a.preload = "auto";
                    sounds[f] = a;
                }
            });
        });
    }

    /* ---- the player ------------------------------------------------------ */
    function play(sceneId, onDone) {
        var scenes = window.HalloweenCutscenes || {};
        var scene = scenes[sceneId];
        if (!scene || !scene.panels || !scene.panels.length) {
            /* NOTHING TO SHOW IS NOT A CRASH. A missing scene means the game
               moves straight on to whatever came after it -- better a beat
               that does not happen than a black screen nobody can leave. */
            if (window.console) console.warn("cutscene: no scene named " + sceneId);
            if (onDone) onDone();
            return;
        }
        scene.id = scene.id || sceneId;
        injectCss();
        preload(scene);

        var root = document.createElement("div");
        root.className = "rmcs";
        root.setAttribute("role", "dialog");
        root.setAttribute("aria-label", scene.title || "Story scene");

        var stage = document.createElement("div");
        stage.className = "rmcs-stage";
        var art = document.createElement("img");
        art.className = "rmcs-art";
        art.alt = "";
        stage.appendChild(art);

        var pips = document.createElement("div");
        pips.className = "rmcs-pips";
        scene.panels.forEach(function () {
            var d = document.createElement("span");
            d.className = "rmcs-pip";
            pips.appendChild(d);
        });
        stage.appendChild(pips);

        var nudge = document.createElement("div");
        nudge.className = "rmcs-next";
        nudge.textContent = "TAP TO SKIP";
        stage.appendChild(nudge);

        var timer = document.createElement("div");
        timer.className = "rmcs-timer";
        var timerFill = document.createElement("i");
        timer.appendChild(timerFill);
        stage.appendChild(timer);

        var autoplay = scene.autoplay !== false;
        if (!autoplay) timer.style.display = "none";

        root.appendChild(stage);
        document.body.appendChild(root);
        requestAnimationFrame(function () { root.classList.add("in"); });

        var idx = -1;
        var timers = [];
        var pending = [];        /* balloons not popped yet on this panel */
        var bed = null;
        var closed = false;

        function clearTimers() {
            timers.forEach(clearTimeout);
            timers = [];
        }
        function later(fn, ms) { timers.push(setTimeout(fn, ms)); }

        function showBalloon(b) {
            b.el.classList.add("pop");
            if (b.done) return;
            b.done = true;
        }
        function flushBalloons() {
            pending.forEach(showBalloon);
            pending = [];
        }

        function panel(n) {
            clearTimers();
            pending = [];
            var p = scene.panels[n];
            if (!p) { finish(); return; }

            /* bed: only restart it when it actually changes, so room tone
               runs continuously across panels instead of retriggering */
            if (p.bed) {
                if (!bed || bed.src.indexOf(p.bed) === -1) {
                    hush(bed);
                    bed = sfx(p.bed, { loop: true, volume: 0.35 });
                }
            } else if (bed) {
                hush(bed);
                bed = null;
            }

            /* wipe the previous panel's balloons */
            [].slice.call(stage.querySelectorAll(".rmcs-b")).forEach(function (e) {
                e.parentNode.removeChild(e);
            });

            art.classList.remove("play");
            /* reflow so the animation restarts on an element that is already
               in the DOM -- without this the second panel just appears */
            void art.offsetWidth;
            art.src = url(ASSET_IMG + scene.id + "/" + p.img);
            art.classList.add("play");

            if (p.sound) sfx(p.sound, { volume: 1 });

            [].slice.call(pips.children).forEach(function (d, i) {
                d.classList.toggle("on", i <= n);
            });

            nudge.classList.remove("on");

            var lines = p.lines || [];
            lines.forEach(function (ln, i) {
                var el = document.createElement("div");
                el.className = "rmcs-b " + (ln.who || "bill") + " at-" + (ln.at || "top-left");
                el.textContent = ln.text;
                stage.appendChild(el);
                var b = { el: el, done: false };
                pending.push(b);
                var wait = ln.wait == null ? (360 + i * 1100) : ln.wait;
                later(function () {
                    showBalloon(b);
                    pending = pending.filter(function (x) { return x !== b; });
                }, wait);
            });

            /* KEEP TWO BALLOONS OFF EACH OTHER.
               "top-left" and "top-right" only stay apart while both lines
               are short. Bill saying "Dear friend. After all these years."
               takes the whole width, and Bob's reply landed on top of it.
               Rather than hand-tuning a position per line -- which breaks
               again the moment the wording changes -- each balloon is
               measured in order and pushed below anything it lands on.
               offsetWidth/offsetHeight are used because they are layout
               boxes and ignore the pop animation's transform. */
            var placed = [];
            [].slice.call(stage.querySelectorAll(".rmcs-b")).forEach(function (el) {
                var box = { l: el.offsetLeft, t: el.offsetTop,
                            r: el.offsetLeft + el.offsetWidth,
                            b: el.offsetTop + el.offsetHeight };
                var moved = true, guard = 0;
                while (moved && guard++ < 8) {
                    moved = false;
                    placed.forEach(function (o) {
                        var hit = box.l < o.r && box.r > o.l && box.t < o.b && box.b > o.t;
                        if (hit) {
                            var h = box.b - box.t;
                            box.t = o.b + 10;
                            box.b = box.t + h;
                            moved = true;
                        }
                    });
                }
                if (box.t !== el.offsetTop) {
                    el.style.top = box.t + "px";
                    el.style.bottom = "auto";
                }
                placed.push(box);
            });

            var last = lines.length ? Math.max.apply(null, lines.map(function (ln, i) {
                return ln.wait == null ? (360 + i * 1100) : ln.wait;
            })) : 0;

            /* THE PANEL RUNS ITSELF. The line across the bottom is the panel's
               own clock, driven by one CSS transition rather than a
               requestAnimationFrame loop -- the browser runs it on the
               compositor, so it stays smooth while the art is still decoding
               and it costs nothing on an old phone. */
            var ms = panelMs(p);
            if (autoplay) {
                timerFill.classList.remove("run");
                timerFill.style.transitionDuration = "0s";
                timerFill.style.width = "0%";
                void timerFill.offsetWidth;
                timerFill.classList.add("run");
                timerFill.style.transitionDuration = ms + "ms";
                timerFill.style.width = "100%";
                later(advance, ms);
                later(function () { nudge.classList.add("on"); }, Math.min(1200, ms * 0.35));
            } else {
                later(function () { nudge.classList.add("on"); }, last + (p.hold == null ? 1400 : p.hold));
            }
        }

        /* `byHand` is set when a tap caused this, so the auto-advance timer
           can call the same function without being mistaken for a tap. */
        function advance(byHand) {
            if (closed) return;
            if (byHand && pending.length) {
                /* impatient thumb: bring the rest of the balloons in now and
                   give the panel a short beat to read them, instead of
                   jumping off the words that just appeared */
                flushBalloons();
                if (autoplay) {
                    clearTimers();
                    var rest = 1500;
                    timerFill.classList.remove("run");
                    timerFill.style.transitionDuration = "0s";
                    void timerFill.offsetWidth;
                    timerFill.classList.add("run");
                    timerFill.style.transitionDuration = rest + "ms";
                    timerFill.style.width = "100%";
                    later(advance, rest);
                }
                return;
            }
            pending = [];
            if (idx >= scene.panels.length - 1) { finish(); return; }
            idx += 1;
            panel(idx);
        }

        var ranDone = false;
        function runDone() {
            if (ranDone) return;
            ranDone = true;
            if (onDone) { try { onDone(); } catch (e) { if (window.console) console.error(e); } }
        }

        function teardown() {
            if (closed) return;
            closed = true;
            clearTimers();
            hush(bed);
            root.classList.remove("in");
            setTimeout(function () {
                if (root.parentNode) root.parentNode.removeChild(root);
            }, 220);
            document.removeEventListener("keydown", onKey, true);
            window.removeEventListener("popstate", onPop);
        }

        /* Reached the end normally -- drop our history entry on the way out
           so the phone's back button does not walk back into a finished
           scene. */
        function finish() {
            if (closed) return;
            teardown();
            if (history.state && history.state.rmcs === sceneId) {
                popping = true;
                history.back();
            }
            runDone();
        }

        var popping = false;
        function onPop() {
            if (popping) { popping = false; return; }
            teardown();      /* phone back / edge swipe */
            runDone();
        }
        function onKey(e) {
            if (e.key === "Escape") { e.preventDefault(); finish(); }
            else if (e.key === " " || e.key === "Enter" || e.key === "ArrowRight") {
                e.preventDefault(); advance(true);
            }
        }

        /* THE SCENE IS A HISTORY ENTRY. This is what makes the phone's own
           back button close it instead of leaving the game. */
        try { history.pushState({ rmcs: sceneId }, ""); } catch (e) {}
        window.addEventListener("popstate", onPop);
        document.addEventListener("keydown", onKey, true);
        root.addEventListener("click", function (e) { e.preventDefault(); advance(true); });

        advance();   /* first panel */
    }

    window.HalloweenGame = window.HalloweenGame || {};
    window.HalloweenGame.playCutscene = play;
})();
