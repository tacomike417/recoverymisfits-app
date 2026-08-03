/*

CHAPTER 5 - TOWN ENGINE V2 Recovery Misfits

Milestone 2: - Loads the full background - Places all seven building
assets - Draws Bill - Draws the title
========================================================== */

(() => {
  "use strict";

function createChapter5Game({ ctx, getWidth, getHeight }) {

    //--------------------------------------------------
    // ASSETS
    //--------------------------------------------------

    function loadImage(path) {
      const image = new Image();
      image.src = path;
      return image;
    }

    const Assets = {
      background: loadImage(
        "assets/players/chapter5/chapter5-background.png"
      ),

      bill: loadImage(
        "assets/players/chapter5/bill-pokemon.png"
      ),

      bar: loadImage(
        "assets/players/chapter5/bar.png"
      ),

      beerhaus: loadImage(
        "assets/players/chapter5/beerhaus.png"
      ),

      liquor: loadImage(
        "assets/players/chapter5/liquor-store.png"
      ),

      pool: loadImage(
        "assets/players/chapter5/pool-hall.png"
      ),

      rock: loadImage(
        "assets/players/chapter5/rock.png"
      ),

      tavern: loadImage(
        "assets/players/chapter5/tavern.png"
      ),

      title: loadImage(
        "assets/players/chapter5/title.png"
      ),

      hospital: loadImage(
        "assets/players/chapter5/hospital.png"
      ),

      corker: loadImage(
        "assets/players/chapter5/chap5-drunk1-corker.png"
      ),

      jigglydrunk: loadImage(
        "assets/players/chapter5/chap5-drunk2-jigglydrunk.png"
      ),

      pukee: loadImage(
        "assets/players/chapter5/chap5-drunk3-pukee.png"
      ),

      barfly: loadImage(
        "assets/players/chapter5/chap5-drunk4-barfly.png"
      ),

      tank: loadImage(
        "assets/players/chapter5/chap5-drunk5-tank.png"
      ),

      drunkachu: loadImage(
        "assets/players/chapter5/chap5-drunk6-drunkachu.png"
      )
    };

    //--------------------------------------------------
    // MAP DATA
    //--------------------------------------------------

    /*
      Each building now has an exact x, y, and on-screen width.
      Height is calculated automatically from the PNG's natural
      aspect ratio, so no artwork is stretched.

      This makes visual tuning predictable: changing width by ten
      pixels always makes that building ten pixels wider.
    */
    const Buildings = [
      {
        // Top-left lot
        id: "rock",
        image: Assets.rock,

        x: 10,
        y: -8,
        width: 174
      },

      {
        // Top-right lot
        id: "beerhaus",
        image: Assets.beerhaus,

        x: 221,
        y: -4,
        width: 132
      },

      {
        // Upper-middle left lot
        id: "pool",
        image: Assets.pool,

        x: 22,
        y: 179,
        width: 140
      },

      {
        // Upper-middle right lot
        id: "tavern",
        image: Assets.tavern,

        x: 196,
        y: 146,
        width: 166
      },

      {
        // Lower-middle left lot
        id: "hospital",
        image: Assets.hospital,

        x: 223,
        y: 543,
        width: 154
      },

      {
        // Lower-middle right lot
        id: "liquor",
        image: Assets.liquor,

        x: 216,
        y: 310,
        width: 158
      },

      {
        // Large bottom-left lot
        id: "bar",
        image: Assets.bar,

        x: 16,
        y: 311,
        width: 170
      }
    ];

    //--------------------------------------------------
    // PLAYER
    //--------------------------------------------------

    const Bill = {
      x: 194,
      y: 742
    };

    //--------------------------------------------------
    // FIRST DRUNK: THE REAL CORKER
    //--------------------------------------------------

    const Corker = {
      x: 104,
      y: 470,
      height: 116,
      state: "wander",
      stateStartedAt: performance.now(),
      nextScurryAt: 0,
      scurryUntil: 0,
      pauseUntil: 0,
      wanderDirection: 1,
      wanderTurnAt: 0,
      nearbySince: 0,
      conversationStep: 0,
      hearts: 1
    };

    //--------------------------------------------------
    // SECOND DRUNK: JIGGLYDRUNK
    //--------------------------------------------------

    const Jigglydrunk = {
      x: 280,
      y: 300,
      height: 126,
      state: "waiting",
      stateStartedAt: performance.now(),
      nearbySince: 0,
      conversationStep: 0,
      hearts: 3,
      direction: 1,
      turnAt: 0,
      drinkAt: 0,
      drinkingUntil: 0,
      tried: false
    };

    //--------------------------------------------------
    // THIRD DRUNK: PUKEE
    //--------------------------------------------------

    const Pukee = {
      x: 92,
      y: 300,
      height: 75,
      state: "waiting",
      stateStartedAt: performance.now(),
      nearbySince: 0,
      conversationStep: 0,
      hearts: 4,
      direction: 1,
      turnAt: 0,
      tried: false
    };


    //--------------------------------------------------
    // FOURTH DRUNK: BARFLY
    //--------------------------------------------------

    const Barfly = {
      x: 0,
      y: 0,
      height: 104,
      state: "waiting",
      stateStartedAt: performance.now(),
      nearbySince: 0,
      conversationStep: 0,
      hearts: 3,
      routeIndex: 0,
      speed: 1.05,
      tried: false
    };

    //--------------------------------------------------
    // FIFTH DRUNK: TANK
    //--------------------------------------------------

    const Tank = {
      x: 0,
      y: 0,
      height: 112,
      state: "waiting",
      stateStartedAt: performance.now(),
      nearbySince: 0,
      conversationStep: 0,
      hearts: 5,
      direction: 1,
      turnAt: 0,
      tried: false
    };


    //--------------------------------------------------
    // FINAL SPECIAL DRUNK: DRUNKACHU
    //--------------------------------------------------

    const Drunkachu = {
      x: 0,
      y: 0,
      height: 100,
      state: "hide",
      stateStartedAt: performance.now(),
      nearbySince: 0,
      conversationStep: 0,
      hearts: 10,
      buildingIndex: 0,
      targetBuildingIndex: 1,
      side: 1,
      nextActionAt: 0,
      moveShoutUntil: 0,
      tried: false
    };

    let gamePhase = "intro";
    let chapterCompleteSignalSent = false;

    let nearbyDrunk = null;
    let isBillMoving = false;
    let friendsSobriety = 0;
    let soberCounterDisplay = 0;
    let hudAnimationStartedAt = 0;
    let corkerTried = false;
    let jigglyTried = false;
    let pukeeTried = false;
    let barflyTried = false;
    let tankTried = false;
    let drunkachuTried = false;
    let triedAnimationStartedAt = 0;
    let triedCharacter = null;

    const HUD_HEIGHT = 26;
    const TRIED_HEIGHT = 34;
    const BOTTOM_UI_HEIGHT = HUD_HEIGHT + TRIED_HEIGHT;
    const HINT_DELAY = 2000;
    const PULSE_DELAY = 4000;

    const DIALOGUE_LINE_DURATION = 4500;
    const SOBER_ROLL_DURATION = 1900;
    const HEART_ROLL_DURATION = 1700;
    const TRIED_ADD_DURATION = 1100;

    function beginGameplay() {
      gamePhase = "playing";
      pointerDown = false;
      pointerX = Bill.x;
      pointerY = Bill.y;
    }

    function signalChapter6() {
      if (chapterCompleteSignalSent) {
        return;
      }

      chapterCompleteSignalSent = true;
      gamePhase = "complete";

      const detail = {
        chapter: 5,
        nextChapter: 6
      };

      window.dispatchEvent(
        new CustomEvent("recovery:chapter-complete", { detail })
      );

      window.dispatchEvent(
        new CustomEvent("recovery:go-to-chapter", { detail })
      );
    }

    //--------------------------------------------------
    // POINTER MOVEMENT
    //--------------------------------------------------

    const WALK_SPEED = 2.42;
    const STOP_DISTANCE = 4;
    const BILL_HALF_WIDTH = 16;
    const BILL_HEIGHT = 66;

    let pointerDown = false;
    let pointerX = Bill.x;
    let pointerY = Bill.y;
    let movementInputReady = false;
    let billStartAligned = false;

    const BUILDING_GLOW_DISTANCE = 42;
    const DRUNK_GLOW_DISTANCE = 52;

    let nearbyBuilding = null;

    function encounterLocked() {
      const lockedStates = [
        "conversation",
        "readyToSober",
        "caught",
        "poof",
        "message",
        "hudSoberRoll",
        "hudHeartRoll",
        "triedAdd"
      ];

      return (
        lockedStates.includes(Corker.state) ||
        lockedStates.includes(Jigglydrunk.state) ||
        lockedStates.includes(Pukee.state) ||
        lockedStates.includes(Barfly.state) ||
        lockedStates.includes(Tank.state) ||
        lockedStates.includes(Drunkachu.state)
      );
    }

    function canBillMove() {
      return gamePhase === "playing" && !encounterLocked();
    }

    function canvasPoint(event) {
      const canvas = ctx.canvas;
      const rect = canvas.getBoundingClientRect();

      return {
        x:
          ((event.clientX - rect.left) / rect.width) *
          getWidth(),
        y:
          ((event.clientY - rect.top) / rect.height) *
          getHeight()
      };
    }

    function updatePointer(event) {
      const point = canvasPoint(event);
      pointerX = point.x;
      pointerY = point.y;
    }

    function handlePointerDown(event) {
      if (gamePhase === "intro") {
        beginGameplay();
        event.preventDefault();
        return;
      }

      if (gamePhase === "ending") {
        signalChapter6();
        event.preventDefault();
        return;
      }

      if (gamePhase !== "playing" || !canBillMove()) {
        pointerDown = false;
        event.preventDefault();
        return;
      }

      pointerDown = true;
      updatePointer(event);

      if (ctx.canvas.setPointerCapture) {
        ctx.canvas.setPointerCapture(event.pointerId);
      }

      event.preventDefault();
    }

    function handlePointerMove(event) {
      if (!pointerDown) {
        return;
      }

      updatePointer(event);
      event.preventDefault();
    }

    function handlePointerUp(event) {
      pointerDown = false;

      if (nearbyDrunk === Corker && Corker.state === "wander") {
        tryTapCorker(event);
      } else if (nearbyDrunk === Jigglydrunk && Jigglydrunk.state === "wander") {
        tryTapJigglydrunk(event);
      } else if (nearbyDrunk === Pukee && Pukee.state === "wander") {
        tryTapPukee(event);
      } else if (nearbyDrunk === Barfly && Barfly.state === "wander") {
        tryTapBarfly(event);
      } else if (nearbyDrunk === Tank && Tank.state === "wander") {
        tryTapTank(event);
      } else if (nearbyDrunk === Drunkachu && Drunkachu.state === "wander") {
        tryTapDrunkachu(event);
      } else if (Corker.state === "readyToSober") {
        tryTapSoberButton(event);
      } else if (Jigglydrunk.state === "readyToSober") {
        tryTapJigglySoberButton(event);
      } else if (Pukee.state === "readyToSober") {
        tryTapPukeeSoberButton(event);
      } else if (Barfly.state === "readyToSober") {
        tryTapBarflySoberButton(event);
      } else if (Tank.state === "readyToSober") {
        tryTapTankSoberButton(event);
      } else if (Drunkachu.state === "readyToSober") {
        tryTapDrunkachuSoberButton(event);
      }

      if (
        ctx.canvas.releasePointerCapture &&
        ctx.canvas.hasPointerCapture &&
        ctx.canvas.hasPointerCapture(event.pointerId)
      ) {
        ctx.canvas.releasePointerCapture(event.pointerId);
      }

      event.preventDefault();
    }

    function installMovementInput() {
      if (movementInputReady) {
        return;
      }

      movementInputReady = true;

      const canvas = ctx.canvas;
      canvas.style.touchAction = "none";

      canvas.addEventListener("pointerdown", handlePointerDown);
      canvas.addEventListener("pointermove", handlePointerMove);
      canvas.addEventListener("pointerup", handlePointerUp);
      canvas.addEventListener("pointercancel", handlePointerUp);
      canvas.addEventListener("pointerleave", (event) => {
        if (
          event.pointerType === "mouse" &&
          (!canvas.hasPointerCapture ||
            !canvas.hasPointerCapture(event.pointerId))
        ) {
          pointerDown = false;
        }
      });
    }

    function updateBillMovement() {
      isBillMoving = false;

      if (!pointerDown || !canBillMove()) {
        return;
      }

      const dx = pointerX - Bill.x;
      const dy = pointerY - Bill.y;
      const distance = Math.hypot(dx, dy);

      if (distance <= STOP_DISTANCE) {
        return;
      }

      const step = Math.min(WALK_SPEED, distance);
      Bill.x += (dx / distance) * step;
      Bill.y += (dy / distance) * step;
      isBillMoving = true;

      Bill.x = Math.max(
        BILL_HALF_WIDTH,
        Math.min(getWidth() - BILL_HALF_WIDTH, Bill.x)
      );

      Bill.y = Math.max(
        BILL_HEIGHT,
        Math.min(getHeight() - BOTTOM_UI_HEIGHT, Bill.y)
      );
    }

    function distanceToBuilding(building) {
      const placement = buildingPlacement(building);

      if (!placement) {
        return Infinity;
      }

      const closestX = Math.max(
        placement.x,
        Math.min(Bill.x, placement.x + placement.width)
      );

      const closestY = Math.max(
        placement.y,
        Math.min(Bill.y, placement.y + placement.height)
      );

      return Math.hypot(
        Bill.x - closestX,
        Bill.y - closestY
      );
    }

    function updateNearbyBuilding() {
      let closestBuilding = null;
      let closestDistance = BUILDING_GLOW_DISTANCE;

      for (const building of Buildings) {
        const distance = distanceToBuilding(building);

        if (distance <= closestDistance) {
          closestDistance = distance;
          closestBuilding = building;
        }
      }

      nearbyBuilding = closestBuilding;
    }

    function corkerPlacement() {
      const image = Assets.corker;

      if (
        !image.complete ||
        image.naturalWidth <= 0 ||
        image.naturalHeight <= 0
      ) {
        return null;
      }

      const aspect = image.naturalWidth / image.naturalHeight;
      const width = Corker.height * aspect;

      return {
        x: Corker.x - width / 2,
        y: Corker.y - Corker.height,
        width,
        height: Corker.height
      };
    }

    function updateNearbyDrunk() {
      if (Corker.state !== "wander") {
        nearbyDrunk = null;
        Corker.nearbySince = 0;
        return;
      }

      const placement = corkerPlacement();

      if (!placement) {
        nearbyDrunk = null;
        Corker.nearbySince = 0;
        return;
      }

      const centerX = placement.x + placement.width / 2;
      const centerY = placement.y + placement.height / 2;
      const distance = Math.hypot(Bill.x - centerX, Bill.y - centerY);
      const isNearby = distance <= DRUNK_GLOW_DISTANCE;

      if (isNearby) {
        nearbyDrunk = Corker;

        if (Corker.nearbySince === 0) {
          Corker.nearbySince = performance.now();
        }
      } else {
        nearbyDrunk = null;
        Corker.nearbySince = 0;
      }
    }

    function jigglyPlacement() {
      const image = Assets.jigglydrunk;

      if (
        !image.complete ||
        image.naturalWidth <= 0 ||
        image.naturalHeight <= 0
      ) {
        return null;
      }

      const aspect = image.naturalWidth / image.naturalHeight;
      const width = Jigglydrunk.height * aspect;

      return {
        x: Jigglydrunk.x - width / 2,
        y: Jigglydrunk.y - Jigglydrunk.height,
        width,
        height: Jigglydrunk.height
      };
    }

    function pukeePlacement() {
      const image = Assets.pukee;

      if (
        !image.complete ||
        image.naturalWidth <= 0 ||
        image.naturalHeight <= 0
      ) {
        return null;
      }

      const aspect = image.naturalWidth / image.naturalHeight;
      const width = Pukee.height * aspect;

      return {
        x: Pukee.x - width / 2,
        y: Pukee.y - Pukee.height,
        width,
        height: Pukee.height
      };
    }

    function barflyPlacement() {
      const image = Assets.barfly;

      if (
        !image.complete ||
        image.naturalWidth <= 0 ||
        image.naturalHeight <= 0
      ) {
        return null;
      }

      const aspect = image.naturalWidth / image.naturalHeight;
      const width = Barfly.height * aspect;

      return {
        x: Barfly.x - width / 2,
        y: Barfly.y - Barfly.height,
        width,
        height: Barfly.height
      };
    }

    function tankPlacement() {
      const image = Assets.tank;

      if (
        !image.complete ||
        image.naturalWidth <= 0 ||
        image.naturalHeight <= 0
      ) {
        return null;
      }

      const aspect = image.naturalWidth / image.naturalHeight;
      const width = Tank.height * aspect;

      return {
        x: Tank.x - width / 2,
        y: Tank.y - Tank.height,
        width,
        height: Tank.height
      };
    }

    function drunkachuPlacement() {
      const image = Assets.drunkachu;

      if (
        !image.complete ||
        image.naturalWidth <= 0 ||
        image.naturalHeight <= 0
      ) {
        return null;
      }

      const aspect = image.naturalWidth / image.naturalHeight;
      const width = Drunkachu.height * aspect;

      return {
        x: Drunkachu.x - width / 2,
        y: Drunkachu.y - Drunkachu.height,
        width,
        height: Drunkachu.height
      };
    }

    function updateNearbyJigglydrunk() {
      if (Jigglydrunk.state !== "wander") {
        Jigglydrunk.nearbySince = 0;
        return;
      }

      const placement = jigglyPlacement();

      if (!placement) {
        Jigglydrunk.nearbySince = 0;
        return;
      }

      const centerX = placement.x + placement.width / 2;
      const centerY = placement.y + placement.height / 2;
      const distance = Math.hypot(Bill.x - centerX, Bill.y - centerY);

      if (distance <= DRUNK_GLOW_DISTANCE + 12) {
        nearbyDrunk = Jigglydrunk;

        if (Jigglydrunk.nearbySince === 0) {
          Jigglydrunk.nearbySince = performance.now();
        }
      } else if (nearbyDrunk === Jigglydrunk) {
        nearbyDrunk = null;
        Jigglydrunk.nearbySince = 0;
      }
    }

    function updateNearbyPukee() {
      if (Pukee.state !== "wander") {
        Pukee.nearbySince = 0;
        return;
      }

      const placement = pukeePlacement();

      if (!placement) {
        Pukee.nearbySince = 0;
        return;
      }

      const centerX = placement.x + placement.width / 2;
      const centerY = placement.y + placement.height / 2;
      const distance = Math.hypot(Bill.x - centerX, Bill.y - centerY);

      if (distance <= DRUNK_GLOW_DISTANCE + 12) {
        nearbyDrunk = Pukee;

        if (Pukee.nearbySince === 0) {
          Pukee.nearbySince = performance.now();
        }
      } else if (nearbyDrunk === Pukee) {
        nearbyDrunk = null;
        Pukee.nearbySince = 0;
      }
    }

    function updateNearbyBarfly() {
      if (Barfly.state !== "wander") {
        Barfly.nearbySince = 0;
        return;
      }

      const placement = barflyPlacement();

      if (!placement) {
        Barfly.nearbySince = 0;
        return;
      }

      const centerX = placement.x + placement.width / 2;
      const centerY = placement.y + placement.height / 2;
      const distance = Math.hypot(Bill.x - centerX, Bill.y - centerY);

      if (distance <= DRUNK_GLOW_DISTANCE + 12) {
        nearbyDrunk = Barfly;

        if (Barfly.nearbySince === 0) {
          Barfly.nearbySince = performance.now();
        }
      } else if (nearbyDrunk === Barfly) {
        nearbyDrunk = null;
        Barfly.nearbySince = 0;
      }
    }

    function updateNearbyTank() {
      if (Tank.state !== "wander") {
        Tank.nearbySince = 0;
        return;
      }

      const placement = tankPlacement();

      if (!placement) {
        Tank.nearbySince = 0;
        return;
      }

      const centerX = placement.x + placement.width / 2;
      const centerY = placement.y + placement.height / 2;
      const distance = Math.hypot(Bill.x - centerX, Bill.y - centerY);

      if (distance <= DRUNK_GLOW_DISTANCE + 12) {
        nearbyDrunk = Tank;

        if (Tank.nearbySince === 0) {
          Tank.nearbySince = performance.now();
        }
      } else if (nearbyDrunk === Tank) {
        nearbyDrunk = null;
        Tank.nearbySince = 0;
      }
    }

    function updateNearbyDrunkachu() {
      if (Drunkachu.state !== "wander") {
        Drunkachu.nearbySince = 0;
        return;
      }

      const placement = drunkachuPlacement();

      if (!placement) {
        Drunkachu.nearbySince = 0;
        return;
      }

      const centerX = placement.x + placement.width / 2;
      const centerY = placement.y + placement.height / 2;
      const distance = Math.hypot(Bill.x - centerX, Bill.y - centerY);

      if (!normalDrunksFinished() &&
          distance <= DRUNK_GLOW_DISTANCE + 18) {
        pointerDown = false;
        nearbyDrunk = null;
        Drunkachu.nearbySince = 0;
        Drunkachu.state = "scurry";
        Drunkachu.stateStartedAt = performance.now();
        Drunkachu.moveShoutUntil = performance.now() + 1200;
        Drunkachu.targetBuildingIndex =
          chooseDifferentDrunkachuBuilding();
        return;
      }

      if (distance <= DRUNK_GLOW_DISTANCE + 12) {
        nearbyDrunk = Drunkachu;

        if (Drunkachu.nearbySince === 0) {
          Drunkachu.nearbySince = performance.now();
        }
      } else if (nearbyDrunk === Drunkachu) {
        nearbyDrunk = null;
        Drunkachu.nearbySince = 0;
      }
    }

    function pointInsidePlacement(point, placement) {
      return (
        point.x >= placement.x &&
        point.x <= placement.x + placement.width &&
        point.y >= placement.y &&
        point.y <= placement.y + placement.height
      );
    }

    function beginCorkerSequence() {
      pointerDown = false;
      nearbyDrunk = null;
      Corker.state = "conversation";
      Corker.conversationStep = 0;
      Corker.stateStartedAt = performance.now();
    }

    function tryTapCorker(event) {
      if (nearbyDrunk !== Corker || Corker.state !== "wander") {
        return false;
      }

      const placement = corkerPlacement();

      if (!placement) {
        return false;
      }

      const point = canvasPoint(event);

      if (!pointInsidePlacement(point, placement)) {
        return false;
      }

      beginCorkerSequence();
      return true;
    }

    function beginJigglySequence() {
      pointerDown = false;
      nearbyDrunk = null;
      Jigglydrunk.state = "conversation";
      Jigglydrunk.conversationStep = 0;
      Jigglydrunk.stateStartedAt = performance.now();
    }

    function beginPukeeSequence() {
      pointerDown = false;
      nearbyDrunk = null;
      Pukee.state = "conversation";
      Pukee.conversationStep = 0;
      Pukee.stateStartedAt = performance.now();
    }

    function beginBarflySequence() {
      pointerDown = false;
      nearbyDrunk = null;
      Barfly.state = "conversation";
      Barfly.conversationStep = 0;
      Barfly.stateStartedAt = performance.now();
    }

    function beginTankSequence() {
      pointerDown = false;
      nearbyDrunk = null;
      Tank.state = "conversation";
      Tank.conversationStep = 0;
      Tank.stateStartedAt = performance.now();
    }

    function beginDrunkachuSequence() {
      pointerDown = false;
      nearbyDrunk = null;
      Drunkachu.state = "conversation";
      Drunkachu.conversationStep = 0;
      Drunkachu.stateStartedAt = performance.now();
    }

    function tryTapJigglydrunk(event) {
      if (
        nearbyDrunk !== Jigglydrunk ||
        Jigglydrunk.state !== "wander"
      ) {
        return false;
      }

      const placement = jigglyPlacement();

      if (!placement) {
        return false;
      }

      const point = canvasPoint(event);

      if (!pointInsidePlacement(point, placement)) {
        return false;
      }

      beginJigglySequence();
      return true;
    }

    function tryTapPukee(event) {
      if (
        nearbyDrunk !== Pukee ||
        Pukee.state !== "wander"
      ) {
        return false;
      }

      const placement = pukeePlacement();

      if (!placement) {
        return false;
      }

      const point = canvasPoint(event);

      if (!pointInsidePlacement(point, placement)) {
        return false;
      }

      beginPukeeSequence();
      return true;
    }

    function tryTapBarfly(event) {
      if (
        nearbyDrunk !== Barfly ||
        Barfly.state !== "wander"
      ) {
        return false;
      }

      const placement = barflyPlacement();

      if (!placement) {
        return false;
      }

      const point = canvasPoint(event);

      if (!pointInsidePlacement(point, placement)) {
        return false;
      }

      beginBarflySequence();
      return true;
    }

    function tryTapTank(event) {
      if (
        nearbyDrunk !== Tank ||
        Tank.state !== "wander"
      ) {
        return false;
      }

      const placement = tankPlacement();

      if (!placement) {
        return false;
      }

      const point = canvasPoint(event);

      if (!pointInsidePlacement(point, placement)) {
        return false;
      }

      beginTankSequence();
      return true;
    }

    function tryTapDrunkachu(event) {
      if (!normalDrunksFinished()) {
        pointerDown = false;
        nearbyDrunk = null;
        Drunkachu.nearbySince = 0;
        Drunkachu.state = "scurry";
        Drunkachu.stateStartedAt = performance.now();
        Drunkachu.moveShoutUntil = performance.now() + 1200;
        Drunkachu.targetBuildingIndex =
          chooseDifferentDrunkachuBuilding();
        return false;
      }

      if (
        nearbyDrunk !== Drunkachu ||
        Drunkachu.state !== "wander"
      ) {
        return false;
      }

      const placement = drunkachuPlacement();

      if (!placement) {
        return false;
      }

      const point = canvasPoint(event);

      if (!pointInsidePlacement(point, placement)) {
        return false;
      }

      beginDrunkachuSequence();
      return true;
    }

    function soberButtonPlacement() {
      const width = 176;
      const height = 42;

      return {
        x: (getWidth() - width) / 2,
        y: getHeight() - BOTTOM_UI_HEIGHT - height - 12,
        width,
        height
      };
    }

    function tryTapSoberButton(event) {
      const point = canvasPoint(event);
      const button = soberButtonPlacement();

      if (!pointInsidePlacement(point, button)) {
        return false;
      }

      Corker.state = "caught";
      Corker.stateStartedAt = performance.now();
      return true;
    }

    function tryTapJigglySoberButton(event) {
      const point = canvasPoint(event);
      const button = soberButtonPlacement();

      if (!pointInsidePlacement(point, button)) {
        return false;
      }

      Jigglydrunk.state = "caught";
      Jigglydrunk.stateStartedAt = performance.now();
      return true;
    }

    function tryTapPukeeSoberButton(event) {
      const point = canvasPoint(event);
      const button = soberButtonPlacement();

      if (!pointInsidePlacement(point, button)) {
        return false;
      }

      Pukee.state = "caught";
      Pukee.stateStartedAt = performance.now();
      return true;
    }

    function tryTapBarflySoberButton(event) {
      const point = canvasPoint(event);
      const button = soberButtonPlacement();

      if (!pointInsidePlacement(point, button)) {
        return false;
      }

      Barfly.state = "caught";
      Barfly.stateStartedAt = performance.now();
      return true;
    }

    function tryTapTankSoberButton(event) {
      const point = canvasPoint(event);
      const button = soberButtonPlacement();

      if (!pointInsidePlacement(point, button)) {
        return false;
      }

      Tank.state = "caught";
      Tank.stateStartedAt = performance.now();
      return true;
    }

    function tryTapDrunkachuSoberButton(event) {
      const point = canvasPoint(event);
      const button = soberButtonPlacement();

      if (!pointInsidePlacement(point, button)) {
        return false;
      }

      Drunkachu.state = "caught";
      Drunkachu.stateStartedAt = performance.now();
      return true;
    }

    function updateCorkerMovement() {
      if (Corker.state !== "wander") {
        return;
      }

      const now = performance.now();
      const dx = Corker.x - Bill.x;
      const dy = Corker.y - Bill.y;
      const distance = Math.hypot(dx, dy);

      if (
        distance < 105 &&
        now >= Corker.nextScurryAt &&
        now >= Corker.pauseUntil
      ) {
        Corker.scurryUntil = now + 520;
        Corker.pauseUntil = Corker.scurryUntil + 720;
        Corker.nextScurryAt = Corker.pauseUntil + 450;
      }

      if (now < Corker.scurryUntil) {
        const safeDistance = Math.max(1, distance);
        Corker.x += (dx / safeDistance) * 2.0;
        Corker.y += (dy / safeDistance) * 1.25;
      } else if (now >= Corker.pauseUntil) {
        if (now >= Corker.wanderTurnAt) {
          Corker.wanderDirection *= -1;
          Corker.wanderTurnAt = now + 1100 + Math.random() * 900;
        }

        Corker.x += Corker.wanderDirection * 0.28;
        Corker.y += Math.sin(now / 420) * 0.12;
      }

      Corker.x = Math.max(55, Math.min(getWidth() - 55, Corker.x));
      Corker.y = Math.max(270, Math.min(getHeight() - 20, Corker.y));
    }

    function updateJigglyMovement() {
      if (Jigglydrunk.state !== "wander") {
        return;
      }

      const now = performance.now();

      if (Jigglydrunk.drinkAt === 0) {
        Jigglydrunk.drinkAt = now + 2400;
      }

      if (now >= Jigglydrunk.drinkAt && now >= Jigglydrunk.drinkingUntil) {
        Jigglydrunk.drinkingUntil = now + 1250;
        Jigglydrunk.drinkAt = Jigglydrunk.drinkingUntil + 2600;
      }

      if (now < Jigglydrunk.drinkingUntil) {
        return;
      }

      if (now >= Jigglydrunk.turnAt) {
        Jigglydrunk.direction *= -1;
        Jigglydrunk.turnAt = now + 1500 + Math.random() * 1000;
      }

      Jigglydrunk.x += Jigglydrunk.direction * 0.34;
      Jigglydrunk.y += Math.sin(now / 310) * 0.1;

      Jigglydrunk.x = Math.max(
        62,
        Math.min(getWidth() - 62, Jigglydrunk.x)
      );

      Jigglydrunk.y = Math.max(
        210,
        Math.min(getHeight() - BOTTOM_UI_HEIGHT - 4, Jigglydrunk.y)
      );
    }

    function updatePukeeMovement() {
      if (Pukee.state !== "wander") {
        return;
      }

      const now = performance.now();

      if (now >= Pukee.turnAt) {
        Pukee.direction *= -1;
        Pukee.turnAt = now + 1300 + Math.random() * 900;
      }

      Pukee.x += Pukee.direction * 0.3;
      Pukee.y += Math.sin(now / 260) * 0.12;

      Pukee.x = Math.max(38, Math.min(182, Pukee.x));
      Pukee.y = Math.max(72, Math.min(205, Pukee.y));
    }

    function updateTankMovement() {
      if (Tank.state !== "wander") {
        return;
      }

      const now = performance.now();

      if (now >= Tank.turnAt) {
        Tank.direction *= -1;
        Tank.turnAt = now + 1300 + Math.random() * 900;
      }

      Tank.x += Tank.direction * 0.22;
      Tank.y += Math.sin(now / 330) * 0.08;

      Tank.x = Math.max(55, Math.min(165, Tank.x));
      Tank.y = Math.max(220, Math.min(350, Tank.y));
    }

    function buildingDoorPoint(buildingId) {
      const building = Buildings.find((item) => item.id === buildingId);
      const placement = building ? buildingPlacement(building) : null;

      if (!placement) {
        return null;
      }

      return {
        x: placement.x + placement.width / 2,
        y: Math.min(
          getHeight() - BOTTOM_UI_HEIGHT - 4,
          placement.y + placement.height + 9
        )
      };
    }

    function updateBarflyMovement() {
      if (Barfly.state !== "wander") {
        return;
      }

      const route = ["bar", "tavern", "liquor"];
      const target = buildingDoorPoint(route[Barfly.routeIndex]);

      if (!target) {
        return;
      }

      const dx = target.x - Barfly.x;
      const dy = target.y - Barfly.y;
      const distance = Math.hypot(dx, dy);

      if (distance < 5) {
        Barfly.routeIndex = (Barfly.routeIndex + 1) % route.length;
        return;
      }

      const step = Math.min(Barfly.speed, distance);
      Barfly.x += (dx / distance) * step;
      Barfly.y += (dy / distance) * step;
    }


    const MIN_DRUNK_SEPARATION = 88;

    function activeNormalDrunks() {
      return [
        Corker,
        Jigglydrunk,
        Pukee,
        Barfly,
        Tank
      ].filter(
        (character) =>
          ![
            "waiting",
            "caught",
            "poof",
            "message",
            "hudSoberRoll",
            "hudHeartRoll",
            "triedAdd"
          ].includes(character.state)
      );
    }

    function keepDrunksSeparated() {
      const characters = activeNormalDrunks();

      for (let pass = 0; pass < 3; pass += 1) {
        for (let i = 0; i < characters.length; i += 1) {
          for (let j = i + 1; j < characters.length; j += 1) {
            const first = characters[i];
            const second = characters[j];
            let dx = second.x - first.x;
            let dy = second.y - first.y;
            let distance = Math.hypot(dx, dy);

            if (distance >= MIN_DRUNK_SEPARATION) {
              continue;
            }

            /*
              Perfectly overlapping coordinates can cause unstable
              interaction targeting. Give the pair a dependable direction.
            */
            if (distance < 0.01) {
              dx = j % 2 === 0 ? 1 : -1;
              dy = i % 2 === 0 ? 0.45 : -0.45;
              distance = Math.hypot(dx, dy);
            }

            const overlap =
              (MIN_DRUNK_SEPARATION - distance) / 2;
            const normalX = dx / distance;
            const normalY = dy / distance;

            first.x -= normalX * overlap;
            first.y -= normalY * overlap;
            second.x += normalX * overlap;
            second.y += normalY * overlap;

            first.x = Math.max(
              36,
              Math.min(getWidth() - 36, first.x)
            );
            second.x = Math.max(
              36,
              Math.min(getWidth() - 36, second.x)
            );

            first.y = Math.max(
              90,
              Math.min(
                getHeight() - BOTTOM_UI_HEIGHT - 6,
                first.y
              )
            );
            second.y = Math.max(
              90,
              Math.min(
                getHeight() - BOTTOM_UI_HEIGHT - 6,
                second.y
              )
            );
          }
        }
      }
    }

    function updateNormalDrunkPopulation() {
      /*
        Start with one normal drunk. Each completed attempt increases the
        number of normal drunks allowed on the map at the same time:

        0 tried = 1 active
        1 tried = 2 active
        2 tried = 3 active
        3 tried = all remaining active
      */
      if (encounterLocked()) {
        return;
      }

      const roster = [
        { character: Corker, tried: corkerTried },
        { character: Jigglydrunk, tried: jigglyTried },
        { character: Pukee, tried: pukeeTried },
        { character: Barfly, tried: barflyTried },
        { character: Tank, tried: tankTried }
      ];

      const triedCount = roster.filter((entry) => entry.tried).length;
      const remainingCount = roster.length - triedCount;
      const desiredActive = Math.min(1 + triedCount, remainingCount);

      const activeCount = roster.filter(
        (entry) =>
          !entry.tried &&
          entry.character.state !== "waiting" &&
          entry.character.state !== "hunt" &&
          entry.character.state !== "returned"
      ).length;

      let needed = Math.max(0, desiredActive - activeCount);
      const now = performance.now();

      for (const entry of roster) {
        if (needed <= 0) {
          break;
        }

        if (!entry.tried && entry.character.state === "waiting") {
          entry.character.state = "wander";
          entry.character.stateStartedAt = now;
          entry.character.nearbySince = 0;

          if (entry.character === Jigglydrunk) {
            Jigglydrunk.turnAt = now + 1200;
            Jigglydrunk.drinkAt = now + 1800;
          } else if (entry.character === Pukee) {
            Pukee.turnAt = now + 1000;
          } else if (entry.character === Barfly) {
            Barfly.routeIndex = 0;
            alignBarflyToBar();
          } else if (entry.character === Tank) {
            Tank.turnAt = now + 1100;
            alignTankToPool();
          }

          needed -= 1;
        }
      }
    }

    function normalDrunksTriedCount() {
      return [
        corkerTried,
        jigglyTried,
        pukeeTried,
        barflyTried,
        tankTried
      ].filter(Boolean).length;
    }

    function drunkachuUnlockedForAppearance() {
      return normalDrunksTriedCount() >= 3;
    }

    function normalDrunksFinished() {
      return corkerTried && jigglyTried && pukeeTried && barflyTried && tankTried;
    }

    function positionDrunkachuAtBuilding(index) {
      const building = Buildings[index % Buildings.length];
      const placement = buildingPlacement(building);

      if (!placement) {
        return;
      }

      /*
        Drunkachu is placed directly inside the building footprint.
        He is not drawn while hiding, so no part of him can show through.
      */
      Drunkachu.x = placement.x + placement.width / 2;
      Drunkachu.y = placement.y + placement.height * 0.72;
    }

    function updateDrunkachuMovement() {
      if (!drunkachuUnlockedForAppearance()) {
        Drunkachu.state = "hidden";
        Drunkachu.nearbySince = 0;

        if (nearbyDrunk === Drunkachu) {
          nearbyDrunk = null;
        }

        return;
      }

      const now = performance.now();

      if (
        [
          "conversation",
          "readyToSober",
          "caught",
          "poof",
          "message",
          "hudSoberRoll",
          "hudHeartRoll",
          "triedAdd",
          "returned"
        ].includes(Drunkachu.state)
      ) {
        return;
      }

      if (Drunkachu.state === "hidden") {
        Drunkachu.buildingIndex =
          Math.floor(Math.random() * Buildings.length);
        positionDrunkachuAtBuilding(Drunkachu.buildingIndex);
        Drunkachu.state = "hidden";
        Drunkachu.stateStartedAt = now;
        Drunkachu.nextActionAt =
          now + 1300 + Math.random() * 1800;
        return;
      }

      if (Drunkachu.state === "hide") {
        /*
          Once every regular Pokémon is finished, Drunkachu finally
          steps out and becomes an ordinary capturable encounter.
        */
        if (normalDrunksFinished() && now >= Drunkachu.nextActionAt) {
          const building = Buildings[Drunkachu.buildingIndex];
          const placement = buildingPlacement(building);

          if (placement) {
            Drunkachu.x =
              placement.x + placement.width / 2;
            Drunkachu.y =
              Math.min(
                getHeight() - BOTTOM_UI_HEIGHT - 4,
                placement.y + placement.height + 8
              );
          }

          Drunkachu.state = "wander";
          Drunkachu.stateStartedAt = now;
          return;
        }

        if (now >= Drunkachu.nextActionAt) {
          let next =
            Math.floor(Math.random() * Buildings.length);

          if (next === Drunkachu.buildingIndex) {
            next = (next + 1) % Buildings.length;
          }

          Drunkachu.targetBuildingIndex = next;
          Drunkachu.state = "scurry";
          Drunkachu.stateStartedAt = now;
          Drunkachu.moveShoutUntil = now + 1200;
        }

        return;
      }

      if (Drunkachu.state === "scurry") {
        const targetBuilding =
          Buildings[Drunkachu.targetBuildingIndex];
        const placement =
          buildingPlacement(targetBuilding);

        if (!placement) {
          return;
        }

        const targetX =
          placement.x + placement.width / 2;
        const targetY =
          placement.y + placement.height * 0.72;
        const dx = targetX - Drunkachu.x;
        const dy = targetY - Drunkachu.y;
        const distance = Math.hypot(dx, dy);
        const speed = 2.25;

        if (distance <= speed + 2) {
          Drunkachu.buildingIndex =
            Drunkachu.targetBuildingIndex;
          positionDrunkachuAtBuilding(
            Drunkachu.buildingIndex
          );
          Drunkachu.state = "hide";
          Drunkachu.stateStartedAt = now;
          Drunkachu.nextActionAt =
            now + 1100 + Math.random() * 1700;
          return;
        }

        Drunkachu.x += (dx / distance) * speed;
        Drunkachu.y += (dy / distance) * speed;
      }
    }

    function updateCorkerSequence() {
      const now = performance.now();
      const elapsed = now - Corker.stateStartedAt;

      if (Corker.state === "conversation") {
        const step = Math.floor(elapsed / DIALOGUE_LINE_DURATION);

        if (step <= 2) {
          Corker.conversationStep = step;
        } else {
          Corker.state = "readyToSober";
          Corker.stateStartedAt = now;
        }

        return;
      }

      if (Corker.state === "caught" && elapsed >= 6800) {
        Corker.state = "poof";
        Corker.stateStartedAt = now;
      } else if (Corker.state === "poof" && elapsed >= 1600) {
        Corker.state = "message";
        Corker.stateStartedAt = now;
      } else if (Corker.state === "message" && elapsed >= 4800) {
        Corker.state = "hudSoberRoll";
        Corker.stateStartedAt = now;
        hudAnimationStartedAt = now;
      } else if (
        Corker.state === "hudSoberRoll" &&
        elapsed >= SOBER_ROLL_DURATION
      ) {
        soberCounterDisplay = 0;
        Corker.state = "hudHeartRoll";
        Corker.stateStartedAt = now;
        hudAnimationStartedAt = now;
      } else if (
        Corker.state === "hudHeartRoll" &&
        elapsed >= HEART_ROLL_DURATION
      ) {
        friendsSobriety += Corker.hearts;
        corkerTried = true;
        triedCharacter = "corker";
        Corker.state = "triedAdd";
        Corker.stateStartedAt = now;
        triedAnimationStartedAt = now;
      } else if (
        Corker.state === "triedAdd" &&
        elapsed >= TRIED_ADD_DURATION
      ) {
        Corker.state = "returned";
        Corker.stateStartedAt = now;
        alignCorkerToBar();

        pointerX = Bill.x;
        pointerY = Bill.y;
      }
    }

    function updateJigglySequence() {
      const now = performance.now();
      const elapsed = now - Jigglydrunk.stateStartedAt;

      if (Jigglydrunk.state === "conversation") {
        const step = Math.floor(elapsed / DIALOGUE_LINE_DURATION);

        if (step <= 3) {
          Jigglydrunk.conversationStep = step;
        } else {
          Jigglydrunk.state = "readyToSober";
          Jigglydrunk.stateStartedAt = now;
        }

        return;
      }

      if (Jigglydrunk.state === "caught" && elapsed >= 6800) {
        Jigglydrunk.state = "poof";
        Jigglydrunk.stateStartedAt = now;
      } else if (
        Jigglydrunk.state === "poof" &&
        elapsed >= 1600
      ) {
        Jigglydrunk.state = "message";
        Jigglydrunk.stateStartedAt = now;
      } else if (
        Jigglydrunk.state === "message" &&
        elapsed >= 4800
      ) {
        Jigglydrunk.state = "hudSoberRoll";
        Jigglydrunk.stateStartedAt = now;
        hudAnimationStartedAt = now;
      } else if (
        Jigglydrunk.state === "hudSoberRoll" &&
        elapsed >= SOBER_ROLL_DURATION
      ) {
        soberCounterDisplay = 0;
        Jigglydrunk.state = "hudHeartRoll";
        Jigglydrunk.stateStartedAt = now;
        hudAnimationStartedAt = now;
      } else if (
        Jigglydrunk.state === "hudHeartRoll" &&
        elapsed >= HEART_ROLL_DURATION
      ) {
        friendsSobriety += Jigglydrunk.hearts;
        jigglyTried = true;
        triedCharacter = "jigglydrunk";
        Jigglydrunk.state = "triedAdd";
        Jigglydrunk.stateStartedAt = now;
        triedAnimationStartedAt = now;
      } else if (
        Jigglydrunk.state === "triedAdd" &&
        elapsed >= TRIED_ADD_DURATION
      ) {
        Jigglydrunk.state = "returned";
        Jigglydrunk.stateStartedAt = now;
        alignJigglyToTavern();

        pointerX = Bill.x;
        pointerY = Bill.y;
      }
    }

    function updatePukeeSequence() {
      const now = performance.now();
      const elapsed = now - Pukee.stateStartedAt;

      if (Pukee.state === "conversation") {
        const step = Math.floor(elapsed / DIALOGUE_LINE_DURATION);

        if (step <= 2) {
          Pukee.conversationStep = step;
        } else {
          Pukee.state = "readyToSober";
          Pukee.stateStartedAt = now;
        }

        return;
      }

      if (Pukee.state === "caught" && elapsed >= 6800) {
        Pukee.state = "poof";
        Pukee.stateStartedAt = now;
      } else if (
        Pukee.state === "poof" &&
        elapsed >= 1600
      ) {
        Pukee.state = "message";
        Pukee.stateStartedAt = now;
      } else if (
        Pukee.state === "message" &&
        elapsed >= 4800
      ) {
        Pukee.state = "hudSoberRoll";
        Pukee.stateStartedAt = now;
        hudAnimationStartedAt = now;
      } else if (
        Pukee.state === "hudSoberRoll" &&
        elapsed >= SOBER_ROLL_DURATION
      ) {
        soberCounterDisplay = 0;
        Pukee.state = "hudHeartRoll";
        Pukee.stateStartedAt = now;
        hudAnimationStartedAt = now;
      } else if (
        Pukee.state === "hudHeartRoll" &&
        elapsed >= HEART_ROLL_DURATION
      ) {
        friendsSobriety += Pukee.hearts;
        pukeeTried = true;
        triedCharacter = "pukee";
        Pukee.state = "triedAdd";
        Pukee.stateStartedAt = now;
        triedAnimationStartedAt = now;
      } else if (
        Pukee.state === "triedAdd" &&
        elapsed >= TRIED_ADD_DURATION
      ) {
        Pukee.state = "returned";
        Pukee.stateStartedAt = now;
        alignPukeeToJazzClub();

        pointerX = Bill.x;
        pointerY = Bill.y;
      }
    }

    function updateTankSequence() {
      const now = performance.now();
      const elapsed = now - Tank.stateStartedAt;

      if (Tank.state === "conversation") {
        const step = Math.floor(elapsed / DIALOGUE_LINE_DURATION);

        if (step <= 2) {
          Tank.conversationStep = step;
        } else {
          Tank.state = "readyToSober";
          Tank.stateStartedAt = now;
        }

        return;
      }

      if (Tank.state === "caught" && elapsed >= 6800) {
        Tank.state = "poof";
        Tank.stateStartedAt = now;
      } else if (
        Tank.state === "poof" &&
        elapsed >= 1600
      ) {
        Tank.state = "message";
        Tank.stateStartedAt = now;
      } else if (
        Tank.state === "message" &&
        elapsed >= 4800
      ) {
        Tank.state = "hudSoberRoll";
        Tank.stateStartedAt = now;
        hudAnimationStartedAt = now;
      } else if (
        Tank.state === "hudSoberRoll" &&
        elapsed >= SOBER_ROLL_DURATION
      ) {
        soberCounterDisplay = 0;
        Tank.state = "hudHeartRoll";
        Tank.stateStartedAt = now;
        hudAnimationStartedAt = now;
      } else if (
        Tank.state === "hudHeartRoll" &&
        elapsed >= HEART_ROLL_DURATION
      ) {
        friendsSobriety += Tank.hearts;
        tankTried = true;
        triedCharacter = "tank";
        Tank.state = "triedAdd";
        Tank.stateStartedAt = now;
        triedAnimationStartedAt = now;
      } else if (
        Tank.state === "triedAdd" &&
        elapsed >= TRIED_ADD_DURATION
      ) {
        Tank.state = "returned";
        Tank.stateStartedAt = now;
        alignTankToPool();

        pointerX = Bill.x;
        pointerY = Bill.y;
      }
    }

    function updateDrunkachuSequence() {
      const now = performance.now();
      const elapsed = now - Drunkachu.stateStartedAt;

      if (Drunkachu.state === "conversation") {
        const step = Math.floor(elapsed / DIALOGUE_LINE_DURATION);

        if (step <= 2) {
          Drunkachu.conversationStep = step;
        } else {
          Drunkachu.state = "readyToSober";
          Drunkachu.stateStartedAt = now;
        }

        return;
      }

      if (Drunkachu.state === "caught" && elapsed >= 6800) {
        Drunkachu.state = "poof";
        Drunkachu.stateStartedAt = now;
      } else if (
        Drunkachu.state === "poof" &&
        elapsed >= 1600
      ) {
        Drunkachu.state = "message";
        Drunkachu.stateStartedAt = now;
      } else if (
        Drunkachu.state === "message" &&
        elapsed >= 4800
      ) {
        Drunkachu.state = "hudSoberRoll";
        Drunkachu.stateStartedAt = now;
        hudAnimationStartedAt = now;
      } else if (
        Drunkachu.state === "hudSoberRoll" &&
        elapsed >= SOBER_ROLL_DURATION
      ) {
        soberCounterDisplay = 0;
        Drunkachu.state = "hudHeartRoll";
        Drunkachu.stateStartedAt = now;
        hudAnimationStartedAt = now;
      } else if (
        Drunkachu.state === "hudHeartRoll" &&
        elapsed >= HEART_ROLL_DURATION
      ) {
        friendsSobriety += Drunkachu.hearts;
        drunkachuTried = true;
        triedCharacter = "drunkachu";
        Drunkachu.state = "triedAdd";
        Drunkachu.stateStartedAt = now;
        triedAnimationStartedAt = now;
      } else if (
        Drunkachu.state === "triedAdd" &&
        elapsed >= TRIED_ADD_DURATION
      ) {
        Drunkachu.state = "returned";
        Drunkachu.stateStartedAt = now;
        pointerDown = false;
        pointerX = Bill.x;
        pointerY = Bill.y;
        gamePhase = "ending";
      }
    }

    function updateBarflySequence() {
      const now = performance.now();
      const elapsed = now - Barfly.stateStartedAt;

      if (Barfly.state === "conversation") {
        const step = Math.floor(elapsed / DIALOGUE_LINE_DURATION);

        if (step <= 2) {
          Barfly.conversationStep = step;
        } else {
          Barfly.state = "readyToSober";
          Barfly.stateStartedAt = now;
        }

        return;
      }

      if (Barfly.state === "caught" && elapsed >= 6800) {
        Barfly.state = "poof";
        Barfly.stateStartedAt = now;
      } else if (
        Barfly.state === "poof" &&
        elapsed >= 1600
      ) {
        Barfly.state = "message";
        Barfly.stateStartedAt = now;
      } else if (
        Barfly.state === "message" &&
        elapsed >= 4800
      ) {
        Barfly.state = "hudSoberRoll";
        Barfly.stateStartedAt = now;
        hudAnimationStartedAt = now;
      } else if (
        Barfly.state === "hudSoberRoll" &&
        elapsed >= SOBER_ROLL_DURATION
      ) {
        soberCounterDisplay = 0;
        Barfly.state = "hudHeartRoll";
        Barfly.stateStartedAt = now;
        hudAnimationStartedAt = now;
      } else if (
        Barfly.state === "hudHeartRoll" &&
        elapsed >= HEART_ROLL_DURATION
      ) {
        friendsSobriety += Barfly.hearts;
        barflyTried = true;
        triedCharacter = "barfly";
        Barfly.state = "triedAdd";
        Barfly.stateStartedAt = now;
        triedAnimationStartedAt = now;
      } else if (
        Barfly.state === "triedAdd" &&
        elapsed >= TRIED_ADD_DURATION
      ) {
        Barfly.state = "returned";
        Barfly.stateStartedAt = now;
        alignBarflyToLiquor();

        pointerX = Bill.x;
        pointerY = Bill.y;
      }
    }

    //--------------------------------------------------
    // DRAW HELPERS
    //--------------------------------------------------

    function drawBackground() {
      const image = Assets.background;

      if (
        !image.complete ||
        image.naturalWidth <= 0 ||
        image.naturalHeight <= 0
      ) {
        ctx.fillStyle = "#608246";
        ctx.fillRect(
          0,
          0,
          getWidth(),
          getHeight()
        );

        return;
      }

      /*
        Draw the ENTIRE source image into the fixed game canvas.

        The generated map is larger than 390 × 780, so drawing it
        at native size only shows the upper-left portion and makes
        the game look heavily zoomed in.
      */
      ctx.save();

      ctx.imageSmoothingEnabled = true;

      ctx.drawImage(
        image,

        0,
        0,
        image.naturalWidth,
        image.naturalHeight,

        0,
        0,
        getWidth(),
        getHeight()
      );

      ctx.restore();
    }

    function buildingPlacement(building) {
      const image = building.image;

      if (
        !image.complete ||
        image.naturalWidth <= 0 ||
        image.naturalHeight <= 0
      ) {
        return null;
      }

      const aspect =
        image.naturalWidth /
        image.naturalHeight;

      return {
        x: building.x,
        y: building.y,
        width: building.width,
        height: building.width / aspect
      };
    }

    function alignCorkerToBar() {
      const bar = Buildings.find((building) => building.id === "bar");
      const placement = bar ? buildingPlacement(bar) : null;

      if (!placement) {
        return;
      }

      /*
        Corker's y value is his foot line. Keep his feet aligned with
        the bottom edge of the Bar artwork so he looks grounded there.
      */
      Corker.y = placement.y + placement.height;

      if (Corker.wanderTurnAt === 0) {
        Corker.wanderTurnAt = performance.now() + 1200;
      }
    }

    function alignJigglyToTavern() {
      const tavern = Buildings.find(
        (building) => building.id === "tavern"
      );

      const placement = tavern ? buildingPlacement(tavern) : null;

      if (!placement) {
        return;
      }

      Jigglydrunk.x = placement.x + placement.width / 2;
      Jigglydrunk.y = placement.y + placement.height + 8;
    }

    function alignPukeeToJazzClub() {
      const jazzClub = Buildings.find(
        (building) => building.id === "rock"
      );

      const placement = jazzClub
        ? buildingPlacement(jazzClub)
        : null;

      if (!placement) {
        return;
      }

      Pukee.x = placement.x + placement.width / 2;
      Pukee.y = Math.min(
        getHeight() - BOTTOM_UI_HEIGHT - 4,
        placement.y + placement.height + 8
      );
    }

    function alignTankToPool() {
      const pool = Buildings.find(
        (building) => building.id === "pool"
      );

      const placement = pool ? buildingPlacement(pool) : null;

      if (!placement) {
        return;
      }

      Tank.x = placement.x + placement.width / 2;
      Tank.y = placement.y + placement.height + 8;
    }

    function alignBarflyToBar() {
      const point = buildingDoorPoint("bar");
      if (!point) return;
      Barfly.x = point.x;
      Barfly.y = point.y;
    }

    function alignBarflyToLiquor() {
      const point = buildingDoorPoint("liquor");
      if (!point) return;
      Barfly.x = point.x;
      Barfly.y = point.y;
    }


    function alignDrunkachuToBuilding() {
      Drunkachu.buildingIndex = Math.floor(Math.random() * Buildings.length);
      Drunkachu.targetBuildingIndex = (Drunkachu.buildingIndex + 1) % Buildings.length;
      Drunkachu.side = Math.random() < 0.5 ? -1 : 1;
      positionDrunkachuAtBuilding(Drunkachu.buildingIndex, false);
    }

    function alignBillToHospital() {
      const hospital = Buildings.find(
        (building) => building.id === "hospital"
      );

      const placement = hospital
        ? buildingPlacement(hospital)
        : null;

      if (!placement) {
        return;
      }

      /*
        Start Bill just outside the center of Towns Hospital,
        with his feet lined up slightly below the building artwork.
      */
      Bill.x = placement.x + placement.width / 2;
      Bill.y = Math.min(
        getHeight() - BOTTOM_UI_HEIGHT,
        placement.y + placement.height + 12
      );

      pointerX = Bill.x;
      pointerY = Bill.y;
      billStartAligned = true;
    }

    function drawBuilding(building) {
      const placement = buildingPlacement(building);

      if (!placement) {
        ctx.save();
        ctx.fillStyle = "rgba(42, 31, 24, 0.72)";
        ctx.fillRect(building.x, building.y, building.width, 80);
        ctx.fillStyle = "#fff1bf";
        ctx.font = "bold 9px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(
          building.id.toUpperCase(),
          building.x + building.width / 2,
          building.y + 40
        );
        ctx.restore();
        return;
      }

      ctx.save();
      ctx.imageSmoothingEnabled = true;

      if (building === nearbyBuilding) {
        ctx.shadowColor = "rgba(255, 221, 92, 0.95)";
        ctx.shadowBlur = 18;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
      }

      ctx.drawImage(
        building.image,
        0,
        0,
        building.image.naturalWidth,
        building.image.naturalHeight,
        placement.x,
        placement.y,
        placement.width,
        placement.height
      );

      ctx.restore();
    }

    function drawBuildings() {
      for (const building of Buildings) {
        drawBuilding(building);
      }
    }

    function drawSpeechBubble(
      x,
      y,
      width,
      lines,
      speakerX,
      speakerY,
      fillColor = "#ffffff"
    ) {
      const lineHeight = 14;
      const padding = 9;
      const height = padding * 2 + lines.length * lineHeight;

      /*
        The bubble's point is calculated from the actual speaker
        coordinates, so it visibly aims at the correct character.
      */
      const tailBaseX = Math.max(
        x + 18,
        Math.min(x + width - 18, speakerX)
      );
      const tailBaseY = y + height;
      const dx = speakerX - tailBaseX;
      const dy = speakerY - tailBaseY;
      const distance = Math.max(1, Math.hypot(dx, dy));
      const tailLength = Math.min(38, distance);
      const tailTipX = tailBaseX + (dx / distance) * tailLength;
      const tailTipY = tailBaseY + (dy / distance) * tailLength;

      ctx.save();
      ctx.fillStyle = fillColor;
      ctx.strokeStyle = "#241b17";
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.roundRect(x, y, width, height, 8);
      ctx.fill();
      ctx.stroke();

      /*
        Seamless speech-bubble tail:
        overlap the triangle into the bubble and do not stroke
        the triangle's top edge.
      */
      ctx.beginPath();
      ctx.moveTo(tailBaseX - 9, tailBaseY - 3);
      ctx.lineTo(tailBaseX + 9, tailBaseY - 3);
      ctx.lineTo(tailTipX, tailTipY);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(tailBaseX - 9, tailBaseY - 3);
      ctx.lineTo(tailTipX, tailTipY);
      ctx.lineTo(tailBaseX + 9, tailBaseY - 3);
      ctx.stroke();

      ctx.fillStyle = "#241b17";
      ctx.font = "bold 10px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      lines.forEach((line, index) => {
        ctx.fillText(
          line,
          x + width / 2,
          y + padding + lineHeight / 2 + index * lineHeight
        );
      });

      ctx.restore();
    }

    function drawLabeledSpeechBubble(
      speaker,
      x,
      y,
      width,
      lines,
      speakerX,
      speakerY
    ) {
      const bubbleFill =
        speaker === "OUR FRIEND" ? "#fff3cf" : "#ffffff";

      drawSpeechBubble(
        x,
        y,
        width,
        lines,
        speakerX,
        speakerY,
        bubbleFill
      );

      ctx.save();
      ctx.font = "bold 9px monospace";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";

      const labelWidth = Math.max(44, speaker.length * 7 + 12);
      const labelX = x + 8;
      const labelY = y - 12;

      ctx.fillStyle = "#000000";
      ctx.fillRect(labelX, labelY, labelWidth, 17);

      ctx.strokeStyle = "#fff8dc";
      ctx.lineWidth = 1;
      ctx.strokeRect(labelX, labelY, labelWidth, 17);

      ctx.fillStyle = "#ffffff";
      ctx.fillText(speaker, labelX + 6, labelY + 8.5);
      ctx.restore();
    }

    function drawPointerFinger() {
      const pointsRight = Corker.x >= Bill.x;
      const finger = pointsRight ? "☞" : "☜";
      const x = Bill.x + (pointsRight ? 21 : -21);
      const y = Bill.y - 46;

      ctx.save();
      ctx.font = "bold 17px serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#fff8dc";
      ctx.strokeStyle = "#211713";
      ctx.lineWidth = 2;
      ctx.strokeText(finger, x, y);
      ctx.fillText(finger, x, y);
      ctx.restore();
    }

    function drawSoberButton() {
      const button = soberButtonPlacement();
      const pulse =
        1 + Math.sin(performance.now() / 180) * 0.035;
      const centerX = button.x + button.width / 2;
      const centerY = button.y + button.height / 2;

      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.scale(pulse, pulse);

      ctx.fillStyle = "#f3d86b";
      ctx.strokeStyle = "#2b1c12";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(
        -button.width / 2,
        -button.height / 2,
        button.width,
        button.height,
        10
      );
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#26180f";
      ctx.font = "bold 13px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("TAP TO SOBER UP", 0, 0);

      ctx.restore();
    }

    function drawCatchRays(centerX, centerY, radius, rotation) {
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(rotation);

      for (let i = 0; i < 18; i += 1) {
        ctx.rotate((Math.PI * 2) / 18);
        ctx.fillStyle =
          i % 2 === 0
            ? "rgba(255, 224, 103, 0.42)"
            : "rgba(255, 255, 255, 0.22)";
        ctx.beginPath();
        ctx.moveTo(12, -7);
        ctx.lineTo(radius, -18);
        ctx.lineTo(radius, 18);
        ctx.lineTo(12, 7);
        ctx.closePath();
        ctx.fill();
      }

      ctx.restore();
    }

    function drawPoofCloud(centerX, centerY, progress) {
      /*
        Cartoon escape poof:
        - tight central burst
        - uneven smoke blobs
        - squash/stretch
        - motion streaks
        - spark shapes
        - upward drift and staggered fading
      */
      const eased = 1 - Math.pow(1 - progress, 3);
      const burst = Math.min(1, progress / 0.34);
      const breakup = Math.max(
        0,
        Math.min(1, (progress - 0.28) / 0.72)
      );
      const driftY = breakup * 28;

      ctx.save();
      ctx.translate(centerX, centerY - driftY);

      /*
        Brief squash-and-stretch center puff.
      */
      const squashX =
        progress < 0.25
          ? 0.6 + burst * 0.9
          : 1.5 - breakup * 0.35;
      const squashY =
        progress < 0.25
          ? 1.35 - burst * 0.55
          : 0.8 + breakup * 0.18;

      ctx.save();
      ctx.scale(squashX, squashY);
      ctx.globalAlpha = Math.max(0, 1 - breakup * 0.82);
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(0, 0, 34 + burst * 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      /*
        Uneven outer smoke blobs with staggered timing.
      */
      const blobs = [
        { angle: -2.75, distance: 58, size: 24, delay: 0.00 },
        { angle: -2.15, distance: 72, size: 19, delay: 0.06 },
        { angle: -1.55, distance: 80, size: 23, delay: 0.10 },
        { angle: -0.95, distance: 68, size: 18, delay: 0.04 },
        { angle: -0.35, distance: 76, size: 25, delay: 0.13 },
        { angle: 0.25, distance: 66, size: 20, delay: 0.08 },
        { angle: 0.85, distance: 74, size: 22, delay: 0.15 },
        { angle: 1.45, distance: 64, size: 18, delay: 0.02 },
        { angle: 2.05, distance: 78, size: 24, delay: 0.11 },
        { angle: 2.65, distance: 70, size: 20, delay: 0.05 }
      ];

      blobs.forEach((blob, index) => {
        const local = Math.max(
          0,
          Math.min(1, (progress - blob.delay) / (1 - blob.delay))
        );

        if (local <= 0) {
          return;
        }

        const travel =
          blob.distance *
          (0.15 + 0.85 * (1 - Math.pow(1 - local, 2)));

        const wobble =
          Math.sin(progress * 18 + index * 1.7) * 5 +
          Math.sin(index * 12.9898 + progress * 7.31) * 4;

        const x =
          Math.cos(blob.angle) * travel +
          Math.cos(blob.angle + Math.PI / 2) * wobble;

        const y =
          Math.sin(blob.angle) * travel +
          Math.sin(blob.angle + Math.PI / 2) * wobble -
          breakup * (8 + index % 3 * 3);

        const radius =
          blob.size *
          (0.48 + Math.sin(local * Math.PI) * 0.76) *
          (0.88 + Math.sin(index * 9.73 + progress * 5.2) * 0.12);

        const alpha =
          Math.sin(Math.min(1, local) * Math.PI) *
          Math.max(0, 1 - breakup * 0.72);

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle =
          index % 3 === 0 ? "#eeeeee" : "#ffffff";
        ctx.beginPath();
        ctx.arc(x, y, Math.max(5, radius), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      /*
        Curved-looking speed streaks radiating away.
      */
      ctx.save();
      ctx.globalAlpha =
        Math.max(0, Math.sin(progress * Math.PI) * 0.9);
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 3;
      ctx.lineCap = "round";

      for (let i = 0; i < 8; i += 1) {
        const angle = (Math.PI * 2 * i) / 8 + 0.22;
        const startDistance = 58 + breakup * 14;
        const endDistance = 92 + breakup * 38;

        ctx.beginPath();
        ctx.moveTo(
          Math.cos(angle) * startDistance,
          Math.sin(angle) * startDistance
        );
        ctx.quadraticCurveTo(
          Math.cos(angle + 0.12) * ((startDistance + endDistance) / 2),
          Math.sin(angle + 0.12) * ((startDistance + endDistance) / 2),
          Math.cos(angle) * endDistance,
          Math.sin(angle) * endDistance
        );
        ctx.stroke();
      }

      ctx.restore();

      /*
        Comic sparks around the cloud.
      */
      ctx.save();
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = "bold 18px sans-serif";

      const sparkAlpha =
        Math.max(0, Math.sin(progress * Math.PI) * 0.95);
      ctx.globalAlpha = sparkAlpha;

      const sparks = [
        { x: -76, y: -52, symbol: "✦" },
        { x: 82, y: -36, symbol: "✧" },
        { x: -64, y: 48, symbol: "✧" },
        { x: 70, y: 58, symbol: "✦" }
      ];

      sparks.forEach((spark, index) => {
        ctx.save();
        ctx.translate(
          spark.x * eased,
          spark.y * eased - breakup * 12
        );
        ctx.rotate(progress * 5 + index);
        ctx.fillStyle =
          index % 2 === 0 ? "#fff4a8" : "#85e9ff";
        ctx.fillText(spark.symbol, 0, 0);
        ctx.restore();
      });

      ctx.restore();

      /*
        Small comic "POOF!" word appearing at the burst.
      */
      if (progress > 0.12 && progress < 0.78) {
        const wordProgress =
          Math.min(1, (progress - 0.12) / 0.22);
        const wordScale =
          0.5 + wordProgress * 0.65 +
          Math.sin(progress * 20) * 0.04;

        ctx.save();
        ctx.translate(0, -8 - breakup * 18);
        ctx.scale(wordScale, wordScale);
        ctx.globalAlpha =
          Math.max(0, 1 - Math.max(0, (progress - 0.56) / 0.22));
        ctx.fillStyle = "#ffffff";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 5;
        ctx.font = "bold 24px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.strokeText("GONE!", 0, 0);
        ctx.fillText("GONE!", 0, 0);
        ctx.restore();
      }

      ctx.restore();
    }

    function drawInteractionRays(centerX, centerY, width, height) {
      const now = performance.now();
      const nearbyElapsed =
        Corker.nearbySince > 0 ? now - Corker.nearbySince : 0;

      const pulsing = nearbyElapsed >= PULSE_DELAY;
      const pulse =
        pulsing
          ? 0.72 + Math.abs(Math.sin(now / 220)) * 0.38
          : 1;

      const radiusX = width * 0.72;
      const radiusY = height * 0.56;

      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(now / 950);

      for (let i = 0; i < 12; i += 1) {
        const angle = (Math.PI * 2 * i) / 12;
        const rayX = Math.cos(angle) * radiusX;
        const rayY = Math.sin(angle) * radiusY;

        ctx.save();
        ctx.translate(rayX, rayY);
        ctx.rotate(angle + Math.PI / 2);

        ctx.globalAlpha = 0.62 + (i % 3) * 0.12;
        ctx.strokeStyle =
          i % 2 === 0 ? "#fff3a6" : "#82e6ff";
        ctx.lineWidth = pulsing ? 3.2 * pulse : 2.5;
        ctx.lineCap = "round";

        ctx.beginPath();
        ctx.moveTo(0, -4);
        ctx.lineTo(0, -13 * pulse);
        ctx.stroke();

        ctx.restore();
      }

      ctx.restore();
    }

    const DISMISSAL_LINES = [
      ["GO AWAY!"],
      ["SCRAM!"],
      ["BEAT IT!"],
      ["I TOLD YA NO!"],
      ["GO FIND SOMEONE ELSE", "TO SOBER UP!"]
    ];

    function drawReturnedDismissal(
      character,
      placement,
      speaker
    ) {
      if (character.state !== "returned") {
        return;
      }

      const centerX =
        placement.x + placement.width / 2;
      const centerY =
        placement.y + placement.height / 2;
      const distance =
        Math.hypot(Bill.x - centerX, Bill.y - centerY);

      if (distance > 92) {
        return;
      }

      /*
        The response changes periodically and keeps repeating while
        Our Friend remains close. It disappears as soon as he leaves.
      */
      const index =
        Math.floor(performance.now() / 1650) %
        DISMISSAL_LINES.length;
      const lines = DISMISSAL_LINES[index];
      const width = lines.length > 1 ? 180 : 124;

      drawLabeledSpeechBubble(
        speaker,
        Math.max(5, character.x - width / 2),
        Math.max(55, placement.y - 66),
        width,
        lines,
        character.x,
        character.y - character.height * 0.35
      );
    }

    function drawCorker() {
      if (
        Corker.state === "caught" ||
        Corker.state === "poof" ||
        Corker.state === "message" ||
        Corker.state === "hudSoberRoll" ||
        Corker.state === "hudHeartRoll" ||
        Corker.state === "triedAdd"
      ) {
        return;
      }

      const placement = corkerPlacement();

      if (!placement) {
        return;
      }

      const now = performance.now();
      const wobble = Math.sin(now / 135) * 0.045;
      const bob = Math.abs(Math.sin(now / 110)) * 2;
      const nearbyElapsed =
        Corker.nearbySince > 0 ? now - Corker.nearbySince : 0;

      ctx.save();
      ctx.translate(Corker.x, Corker.y - Corker.height / 2 - bob);
      ctx.rotate(wobble);
      ctx.imageSmoothingEnabled = false;



      ctx.drawImage(
        Assets.corker,
        0,
        0,
        Assets.corker.naturalWidth,
        Assets.corker.naturalHeight,
        -placement.width / 2,
        -placement.height / 2,
        placement.width,
        placement.height
      );

      ctx.restore();

      if (nearbyDrunk === Corker) {
        drawInteractionRays(
          Corker.x,
          Corker.y - Corker.height / 2,
          placement.width,
          placement.height
        );
      }

      if (
        Corker.state === "wander" &&
        nearbyDrunk === Corker &&
        nearbyElapsed >= HINT_DELAY
      ) {
        drawSpeechBubble(
          Math.max(5, Corker.x - 48),
          Math.max(55, placement.y - 48),
          96,
          ["TAP ME!"],
          Corker.x,
          Corker.y - Corker.height * 0.35,
          "#ffffff"
        );
      }

      if (Corker.state === "conversation") {
        if (Corker.conversationStep === 0) {
          drawLabeledSpeechBubble(
            "CORKER",
            Math.max(5, Corker.x - 78),
            Math.max(55, placement.y - 62),
            156,
            ["BUY ME A BEER!"],
            Corker.x,
            Corker.y - Corker.height * 0.35
          );
        } else if (Corker.conversationStep === 1) {
          drawLabeledSpeechBubble(
            "OUR FRIEND",
            Math.max(5, Bill.x - 104),
            Math.max(55, Bill.y - BILL_HEIGHT - 92),
            208,
            [
              "GOOD NEWS!",
              "I FOUND THE SOLUTION",
              "TO YOUR DRUNKENNESS!"
            ],
            Bill.x,
            Bill.y - BILL_HEIGHT * 0.55
          );
        } else {
          drawLabeledSpeechBubble(
            "CORKER",
            Math.max(5, Corker.x - 88),
            Math.max(55, placement.y - 74),
            176,
            ["THE SOLUTION IS", "MORE BEER!"],
            Corker.x,
            Corker.y - Corker.height * 0.35
          );
        }
      }

      if (Corker.state === "readyToSober") {
        drawLabeledSpeechBubble(
          "CORKER",
          Math.max(5, Corker.x - 88),
          Math.max(55, placement.y - 74),
          176,
          ["THE SOLUTION IS", "MORE BEER!"],
          Corker.x,
          Corker.y - Corker.height * 0.35
        );
        drawSoberButton();
      }
      drawReturnedDismissal(
        Corker,
        placement,
        "CORKER"
      );
    }

    function drawJigglydrunk() {
      if (
        Jigglydrunk.state === "waiting" ||
        Jigglydrunk.state === "caught" ||
        Jigglydrunk.state === "poof" ||
        Jigglydrunk.state === "message" ||
        Jigglydrunk.state === "hudSoberRoll" ||
        Jigglydrunk.state === "hudHeartRoll" ||
        Jigglydrunk.state === "triedAdd"
      ) {
        return;
      }

      const placement = jigglyPlacement();

      if (!placement) {
        return;
      }

      const now = performance.now();
      const drinking = now < Jigglydrunk.drinkingUntil;
      const wobble =
        Math.sin(now / 150) * 0.06 +
        Math.sin(now / 310) * 0.025;
      const bob = Math.abs(Math.sin(now / 125)) * 2.5;
      const drinkTilt = drinking ? -0.13 : 0;

      if (nearbyDrunk === Jigglydrunk) {
        drawInteractionRays(
          Jigglydrunk.x,
          Jigglydrunk.y - Jigglydrunk.height / 2,
          placement.width,
          placement.height
        );
      }

      ctx.save();
      ctx.translate(
        Jigglydrunk.x,
        Jigglydrunk.y - Jigglydrunk.height / 2 - bob
      );
      ctx.rotate(wobble + drinkTilt);
      ctx.imageSmoothingEnabled = false;

      ctx.drawImage(
        Assets.jigglydrunk,
        0,
        0,
        Assets.jigglydrunk.naturalWidth,
        Assets.jigglydrunk.naturalHeight,
        -placement.width / 2,
        -placement.height / 2,
        placement.width,
        placement.height
      );

      ctx.restore();

      /*
        Small foam/slosh accents near the raised pitcher.
      */
      if (drinking) {
        ctx.save();
        ctx.fillStyle = "#fff7d6";

        for (let i = 0; i < 3; i += 1) {
          const t = (now / 210 + i * 0.7) % 1;
          const dropX =
            placement.x + placement.width * 0.17 + i * 4;
          const dropY =
            placement.y + placement.height * 0.13 + t * 15;

          ctx.globalAlpha = 1 - t;
          ctx.beginPath();
          ctx.arc(dropX, dropY, 2.2 - t, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }

      const nearbyElapsed =
        Jigglydrunk.nearbySince > 0
          ? now - Jigglydrunk.nearbySince
          : 0;

      if (
        Jigglydrunk.state === "wander" &&
        nearbyDrunk === Jigglydrunk &&
        nearbyElapsed >= HINT_DELAY
      ) {
        drawSpeechBubble(
          Math.max(5, Jigglydrunk.x - 48),
          Math.max(55, placement.y - 48),
          96,
          ["TAP ME!"],
          Jigglydrunk.x,
          Jigglydrunk.y - Jigglydrunk.height * 0.35,
          "#ffffff"
        );
      }

      if (Jigglydrunk.state === "conversation") {
        if (Jigglydrunk.conversationStep === 0) {
          drawLabeledSpeechBubble(
            "JIGGLYDRUNK",
            Math.max(5, Jigglydrunk.x - 100),
            Math.max(55, placement.y - 76),
            200,
            ["HEY PAL... DRINK A", "COLD ONE WITH ME!"],
            Jigglydrunk.x,
            Jigglydrunk.y - Jigglydrunk.height * 0.35
          );
        } else if (Jigglydrunk.conversationStep === 1) {
          drawLabeledSpeechBubble(
            "OUR FRIEND",
            Math.max(5, Bill.x - 104),
            Math.max(55, Bill.y - BILL_HEIGHT - 92),
            208,
            [
              "GOOD NEWS!",
              "I FOUND THE SOLUTION",
              "TO YOUR DRUNKENNESS!"
            ],
            Bill.x,
            Bill.y - BILL_HEIGHT * 0.55
          );
        } else if (Jigglydrunk.conversationStep === 2) {
          drawLabeledSpeechBubble(
            "JIGGLYDRUNK",
            Math.max(5, Jigglydrunk.x - 105),
            Math.max(55, placement.y - 78),
            210,
            ["SOLUTION? I SEE NO", "PROBLEM HERE!"],
            Jigglydrunk.x,
            Jigglydrunk.y - Jigglydrunk.height * 0.35
          );
        } else {
          drawLabeledSpeechBubble(
            "JIGGLYDRUNK",
            Math.max(5, Jigglydrunk.x - 72),
            Math.max(55, placement.y - 62),
            144,
            ["*BUUUURP!*"],
            Jigglydrunk.x,
            Jigglydrunk.y - Jigglydrunk.height * 0.35
          );
        }
      }

      if (Jigglydrunk.state === "readyToSober") {
        drawLabeledSpeechBubble(
          "JIGGLYDRUNK",
          Math.max(5, Jigglydrunk.x - 72),
          Math.max(55, placement.y - 62),
          144,
          ["*BUUUURP!*"],
          Jigglydrunk.x,
          Jigglydrunk.y - Jigglydrunk.height * 0.35
        );

        drawSoberButton();
      }
      drawReturnedDismissal(
        Jigglydrunk,
        placement,
        "JIGGLYDRUNK"
      );
    }

    function drawPukee() {
      if (
        Pukee.state === "waiting" ||
        Pukee.state === "caught" ||
        Pukee.state === "poof" ||
        Pukee.state === "message" ||
        Pukee.state === "hudSoberRoll" ||
        Pukee.state === "hudHeartRoll" ||
        Pukee.state === "triedAdd"
      ) {
        return;
      }

      const placement = pukeePlacement();
      if (!placement) return;

      const now = performance.now();
      const wobble = Math.sin(now / 120) * 0.07;
      const bob = Math.abs(Math.sin(now / 105)) * 2.5;

      if (nearbyDrunk === Pukee) {
        drawInteractionRays(
          Pukee.x,
          Pukee.y - Pukee.height / 2,
          placement.width,
          placement.height
        );
      }

      ctx.save();
      ctx.translate(Pukee.x, Pukee.y - Pukee.height / 2 - bob);
      ctx.rotate(wobble);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(
        Assets.pukee,
        0, 0,
        Assets.pukee.naturalWidth,
        Assets.pukee.naturalHeight,
        -placement.width / 2,
        -placement.height / 2,
        placement.width,
        placement.height
      );
      ctx.restore();

      const nearbyElapsed =
        Pukee.nearbySince > 0 ? now - Pukee.nearbySince : 0;

      if (
        Pukee.state === "wander" &&
        nearbyDrunk === Pukee &&
        nearbyElapsed >= HINT_DELAY
      ) {
        drawSpeechBubble(
          Math.max(5, Pukee.x - 48),
          Math.max(55, placement.y - 48),
          96,
          ["TAP ME!"],
          Pukee.x,
          Pukee.y - Pukee.height * 0.35,
          "#ffffff"
        );
      }

      if (Pukee.state === "conversation") {
        if (Pukee.conversationStep === 0) {
          drawLabeledSpeechBubble(
            "PUKEE",
            Math.max(5, Pukee.x - 94),
            Math.max(55, placement.y - 68),
            188,
            ["BLEEEEECCCCH!", "GURGLE!"],
            Pukee.x,
            Pukee.y - Pukee.height * 0.35
          );
        } else if (Pukee.conversationStep === 1) {
          drawLabeledSpeechBubble(
            "OUR FRIEND",
            Math.max(5, Bill.x - 104),
            Math.max(55, Bill.y - BILL_HEIGHT - 92),
            208,
            ["GOOD NEWS!", "I FOUND THE SOLUTION", "TO YOUR DRUNKENNESS!"],
            Bill.x,
            Bill.y - BILL_HEIGHT * 0.55
          );
        } else {
          drawLabeledSpeechBubble(
            "PUKEE",
            Math.max(5, Pukee.x - 72),
            Math.max(55, placement.y - 62),
            144,
            ["YAAAAACK!"],
            Pukee.x,
            Pukee.y - Pukee.height * 0.35
          );
        }
      }

      if (Pukee.state === "readyToSober") {
        drawLabeledSpeechBubble(
          "PUKEE",
          Math.max(5, Pukee.x - 72),
          Math.max(55, placement.y - 62),
          144,
          ["YAAAAACK!"],
          Pukee.x,
          Pukee.y - Pukee.height * 0.35
        );
        drawSoberButton();
      }
    }

    function drawDrunkachuGlow(x, y, width, height) {
      const now = performance.now();
      ctx.save();
      ctx.translate(x, y);
      const pulse = 0.85 + Math.sin(now / 210) * 0.12;
      ctx.globalAlpha = 0.50 * pulse;
      const gradient = ctx.createRadialGradient(0, 0, 5, 0, 0, Math.max(width, height) * 0.75);
      gradient.addColorStop(0, "rgba(255, 239, 92, 0.95)");
      gradient.addColorStop(1, "rgba(255, 211, 45, 0)");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(0, 0, Math.max(width, height) * 0.72, 0, Math.PI * 2);
      ctx.fill();
      for (let i = 0; i < 7; i += 1) {
        const angle = now / 900 + i * (Math.PI * 2 / 7);
        const radius = width * (0.48 + 0.09 * Math.sin(now / 260 + i));
        ctx.globalAlpha = 0.55 + 0.35 * Math.sin(now / 180 + i);
        ctx.fillStyle = "#fff6a8";
        ctx.font = "bold 12px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(i % 2 ? "✦" : "✧", Math.cos(angle) * radius, Math.sin(angle) * radius);
      }
      ctx.restore();
    }

    function drawDrunkachuSprite() {
      const placement = drunkachuPlacement();
      if (!placement) return;
      const now = performance.now();
      const bob = Math.abs(Math.sin(now / 95)) * 2;
      const wobble = Math.sin(now / 130) * 0.055;
      drawDrunkachuGlow(Drunkachu.x, Drunkachu.y - Drunkachu.height / 2, placement.width, placement.height);
      ctx.save();
      ctx.translate(Drunkachu.x, Drunkachu.y - Drunkachu.height / 2 - bob);
      ctx.rotate(wobble);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(Assets.drunkachu, 0, 0, Assets.drunkachu.naturalWidth, Assets.drunkachu.naturalHeight, -placement.width / 2, -placement.height / 2, placement.width, placement.height);
      ctx.restore();
    }

    function drawDrunkachuBehindBuildings() {
      /*
        Intentionally blank. Drunkachu is completely invisible
        whenever he is hiding inside a building.
      */
    }

    function drawDrunkachu() {
      if (!drunkachuUnlockedForAppearance()) {
        return;
      }

      if (["hide", "hidden", "peek", "waiting", "caught", "poof", "message", "hudSoberRoll", "hudHeartRoll", "triedAdd", "returned"].includes(Drunkachu.state)) return;
      const placement = drunkachuPlacement();
      if (!placement) return;
      if (nearbyDrunk === Drunkachu) drawInteractionRays(Drunkachu.x, Drunkachu.y - Drunkachu.height / 2, placement.width, placement.height);
      drawDrunkachuSprite();
      const now = performance.now();
      const nearbyElapsed = Drunkachu.nearbySince > 0 ? now - Drunkachu.nearbySince : 0;

      if (Drunkachu.state === "scurry" && now < Drunkachu.moveShoutUntil) {
        drawLabeledSpeechBubble(
          "DRUNKACHU",
          Math.max(5, Drunkachu.x - 72),
          Math.max(55, placement.y - 52),
          144,
          ["PARTAAAY!"],
          Drunkachu.x,
          Drunkachu.y - Drunkachu.height * 0.35
        );
      }

      if (Drunkachu.state === "wander" && nearbyDrunk === Drunkachu && nearbyElapsed >= HINT_DELAY) {
        drawSpeechBubble(Math.max(5, Drunkachu.x - 48), Math.max(55, placement.y - 48), 96, ["TAP ME!"], Drunkachu.x, Drunkachu.y - Drunkachu.height * 0.35, "#fff8ad");
      }
      if (Drunkachu.state === "conversation") {
        if (Drunkachu.conversationStep === 0 || Drunkachu.conversationStep === 2) {
          drawLabeledSpeechBubble("DRUNKACHU", Math.max(5, Drunkachu.x - 82), Math.max(55, placement.y - 64), 164, ["PARTAAAY!"], Drunkachu.x, Drunkachu.y - Drunkachu.height * 0.35);
        } else {
          drawLabeledSpeechBubble("OUR FRIEND", Math.max(5, Bill.x - 104), Math.max(55, Bill.y - BILL_HEIGHT - 92), 208, ["GOOD NEWS!", "I FOUND THE SOLUTION", "TO YOUR DRUNKENNESS!"], Bill.x, Bill.y - BILL_HEIGHT * 0.55);
        }
      }
      if (Drunkachu.state === "readyToSober") {
        drawLabeledSpeechBubble("DRUNKACHU", Math.max(5, Drunkachu.x - 82), Math.max(55, placement.y - 64), 164, ["PARTAAAY!"], Drunkachu.x, Drunkachu.y - Drunkachu.height * 0.35);
        drawSoberButton();
      }
    }

    function drawTank() {
      if (
        Tank.state === "waiting" ||
        Tank.state === "caught" ||
        Tank.state === "poof" ||
        Tank.state === "message" ||
        Tank.state === "hudSoberRoll" ||
        Tank.state === "hudHeartRoll" ||
        Tank.state === "triedAdd"
      ) {
        return;
      }

      const placement = tankPlacement();
      if (!placement) return;

      const now = performance.now();
      const wobble = Math.sin(now / 120) * 0.07;
      const bob = Math.abs(Math.sin(now / 105)) * 2.5;

      if (nearbyDrunk === Tank) {
        drawInteractionRays(
          Tank.x,
          Tank.y - Tank.height / 2,
          placement.width,
          placement.height
        );
      }

      ctx.save();
      ctx.translate(Tank.x, Tank.y - Tank.height / 2 - bob);
      ctx.rotate(wobble);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(
        Assets.tank,
        0, 0,
        Assets.tank.naturalWidth,
        Assets.tank.naturalHeight,
        -placement.width / 2,
        -placement.height / 2,
        placement.width,
        placement.height
      );
      ctx.restore();

      const nearbyElapsed =
        Tank.nearbySince > 0 ? now - Tank.nearbySince : 0;

      if (
        Tank.state === "wander" &&
        nearbyDrunk === Tank &&
        nearbyElapsed >= HINT_DELAY
      ) {
        drawSpeechBubble(
          Math.max(5, Tank.x - 48),
          Math.max(55, placement.y - 48),
          96,
          ["TAP ME!"],
          Tank.x,
          Tank.y - Tank.height * 0.35,
          "#ffffff"
        );
      }

      if (Tank.state === "conversation") {
        if (Tank.conversationStep === 0) {
          drawLabeledSpeechBubble(
            "TANK",
            Math.max(5, Tank.x - 94),
            Math.max(55, placement.y - 68),
            188,
            ["TANK LIKE BEER!"],
            Tank.x,
            Tank.y - Tank.height * 0.35
          );
        } else if (Tank.conversationStep === 1) {
          drawLabeledSpeechBubble(
            "OUR FRIEND",
            Math.max(5, Bill.x - 104),
            Math.max(55, Bill.y - BILL_HEIGHT - 92),
            208,
            ["GOOD NEWS!", "I FOUND THE SOLUTION", "TO YOUR DRUNKENNESS!"],
            Bill.x,
            Bill.y - BILL_HEIGHT * 0.55
          );
        } else {
          drawLabeledSpeechBubble(
            "TANK",
            Math.max(5, Tank.x - 72),
            Math.max(55, placement.y - 62),
            144,
            ["TANK NO LIKE SOBER!"],
            Tank.x,
            Tank.y - Tank.height * 0.35
          );
        }
      }

      if (Tank.state === "readyToSober") {
        drawLabeledSpeechBubble(
          "TANK",
          Math.max(5, Tank.x - 72),
          Math.max(55, placement.y - 62),
          144,
          ["TANK NO LIKE SOBER!"],
          Tank.x,
          Tank.y - Tank.height * 0.35
        );
        drawSoberButton();
      }
      drawReturnedDismissal(
        Tank,
        placement,
        "TANK"
      );
    }

    function drawBarfly() {
      if (
        Barfly.state === "waiting" ||
        Barfly.state === "caught" ||
        Barfly.state === "poof" ||
        Barfly.state === "message" ||
        Barfly.state === "hudSoberRoll" ||
        Barfly.state === "hudHeartRoll" ||
        Barfly.state === "triedAdd"
      ) {
        return;
      }

      const placement = barflyPlacement();
      if (!placement) return;

      const now = performance.now();
      const wobble = Math.sin(now / 120) * 0.07;
      const bob = Math.abs(Math.sin(now / 105)) * 2.5;

      if (nearbyDrunk === Barfly) {
        drawInteractionRays(
          Barfly.x,
          Barfly.y - Barfly.height / 2,
          placement.width,
          placement.height
        );
      }

      ctx.save();
      ctx.translate(Barfly.x, Barfly.y - Barfly.height / 2 - bob);
      ctx.rotate(wobble);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(
        Assets.barfly,
        0, 0,
        Assets.barfly.naturalWidth,
        Assets.barfly.naturalHeight,
        -placement.width / 2,
        -placement.height / 2,
        placement.width,
        placement.height
      );
      ctx.restore();

      const nearbyElapsed =
        Barfly.nearbySince > 0 ? now - Barfly.nearbySince : 0;

      if (
        Barfly.state === "wander" &&
        nearbyDrunk === Barfly &&
        nearbyElapsed >= HINT_DELAY
      ) {
        drawSpeechBubble(
          Math.max(5, Barfly.x - 48),
          Math.max(55, placement.y - 48),
          96,
          ["TAP ME!"],
          Barfly.x,
          Barfly.y - Barfly.height * 0.35,
          "#ffffff"
        );
      }

      if (Barfly.state === "conversation") {
        if (Barfly.conversationStep === 0) {
          drawLabeledSpeechBubble(
            "BARFLY",
            Math.max(5, Barfly.x - 94),
            Math.max(55, placement.y - 68),
            188,
            ["HEY PAL, GOT ANY", "SPARE CHANGE?"],
            Barfly.x,
            Barfly.y - Barfly.height * 0.35
          );
        } else if (Barfly.conversationStep === 1) {
          drawLabeledSpeechBubble(
            "OUR FRIEND",
            Math.max(5, Bill.x - 104),
            Math.max(55, Bill.y - BILL_HEIGHT - 92),
            208,
            ["GOOD NEWS!", "I FOUND THE SOLUTION", "TO YOUR DRUNKENNESS!"],
            Bill.x,
            Bill.y - BILL_HEIGHT * 0.55
          );
        } else {
          drawLabeledSpeechBubble(
            "BARFLY",
            Math.max(5, Barfly.x - 72),
            Math.max(55, placement.y - 62),
            144,
            ["%*@#! THAT!"],
            Barfly.x,
            Barfly.y - Barfly.height * 0.35
          );
        }
      }

      if (Barfly.state === "readyToSober") {
        drawLabeledSpeechBubble(
          "BARFLY",
          Math.max(5, Barfly.x - 72),
          Math.max(55, placement.y - 62),
          144,
          ["%*@#! THAT!"],
          Barfly.x,
          Barfly.y - Barfly.height * 0.35
        );
        drawSoberButton();
      }
      drawReturnedDismissal(
        Barfly,
        placement,
        "BARFLY"
      );

    }

    function drawCorkerCatchSequence() {
      if (
        Corker.state !== "caught" &&
        Corker.state !== "poof" &&
        Corker.state !== "message"
      ) {
        return;
      }

      const centerX = getWidth() / 2;
      const centerY = getHeight() / 2 - 12;
      const elapsed = performance.now() - Corker.stateStartedAt;

      ctx.save();

      if (Corker.state === "poof" && elapsed < 420) {
        const shakeStrength = 4 * (1 - elapsed / 420);
        ctx.translate(
          Math.sin(elapsed / 22) * shakeStrength,
          Math.cos(elapsed / 19) * shakeStrength
        );
      }

      ctx.fillStyle = "rgba(5, 8, 18, 0.84)";
      ctx.fillRect(
        -6,
        -6,
        getWidth() + 12,
        getHeight() + 12
      );

      if (Corker.state === "caught") {
        /*
          Three-part catch illusion:
          1. Corker is pulled toward the center as though entering a collection.
          2. He holds there and begins to shake.
          3. He struggles harder and bursts back out before the poof.
        */
        const pullDuration = 2200;
        const holdDuration = 1700;
        const struggleDuration = 2900;

        const pullProgress = Math.min(1, elapsed / pullDuration);
        const struggleStart = pullDuration + holdDuration;
        const struggleProgress = Math.max(
          0,
          Math.min(1, (elapsed - struggleStart) / struggleDuration)
        );

        drawCatchRays(
          centerX,
          centerY,
          260,
          elapsed / 1800
        );

        ctx.save();
        ctx.translate(centerX, centerY + 22);

        for (let ring = 0; ring < 3; ring += 1) {
          const ringProgress =
            (elapsed / 1200 + ring / 3) % 1;
          ctx.globalAlpha = 1 - ringProgress;
          ctx.strokeStyle =
            ring % 2 === 0 ? "#fff4a8" : "#85e9ff";
          ctx.lineWidth = 4 - ringProgress * 2;
          ctx.beginPath();
          ctx.arc(
            0,
            0,
            24 + ringProgress * 150,
            0,
            Math.PI * 2
          );
          ctx.stroke();
        }

        for (let i = 0; i < 14; i += 1) {
          const angle =
            (Math.PI * 2 * i) / 14 + elapsed / 1300;
          const distance =
            86 + Math.sin(elapsed / 240 + i) * 20;
          const sx = Math.cos(angle) * distance;
          const sy = Math.sin(angle) * distance;

          ctx.save();
          ctx.translate(sx, sy);
          ctx.rotate(angle);
          ctx.fillStyle =
            i % 2 === 0 ? "#fff4a8" : "#85e9ff";
          ctx.font = "bold 18px sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(i % 2 === 0 ? "✦" : "✧", 0, 0);
          ctx.restore();
        }

        ctx.restore();

        const image = Assets.corker;

        /*
          Pull from large to collection-size, then grow slightly while
          struggling out. Horizontal shake increases throughout escape.
        */
        /*
          Fill much more of the screen:
          - zoom in large
          - shrink toward collection size
          - swell dramatically while breaking out
        */
        const zoomIn =
          360 + Math.sin(Math.min(1, elapsed / 900) * Math.PI / 2) * 70;

        const collectionShrink =
          pullProgress * 130;

        const breakoutGrow =
          struggleProgress * 145;

        const baseHeight =
          zoomIn - collectionShrink + breakoutGrow;

        const pulse =
          1 +
          Math.sin(elapsed / 185) *
            (0.045 + struggleProgress * 0.075);

        const height = baseHeight * pulse;
        const width =
          height * (image.naturalWidth / image.naturalHeight);

        const shakeX =
          struggleProgress > 0
            ? Math.sin(elapsed / 38) * (3 + struggleProgress * 16)
            : 0;

        const shakeY =
          struggleProgress > 0
            ? Math.sin(elapsed / 61) * (2 + struggleProgress * 7)
            : 0;

        const bounce =
          Math.abs(Math.sin(elapsed / 260)) * 7;

        ctx.imageSmoothingEnabled = false;

        const struggleTilt =
          struggleProgress > 0
            ? Math.sin(elapsed / 95) * 0.055 * struggleProgress
            : 0;

        ctx.save();
        ctx.translate(centerX, centerY + 34);
        ctx.rotate(struggleTilt);
        ctx.translate(-centerX, -(centerY + 34));

        const breakoutPop =
          struggleProgress > 0.86
            ? 1 + (struggleProgress - 0.86) * 1.55
            : 1;

        const finalWidth = width * breakoutPop;
        const finalHeight = height * breakoutPop;

        ctx.drawImage(
          image,
          centerX - finalWidth / 2 + shakeX,
          centerY - finalHeight / 2 + 34 - bounce + shakeY,
          finalWidth,
          finalHeight
        );

        ctx.restore();

        /*
          Black title panel instead of mauve.
        */
        const bannerY = 68;
        ctx.fillStyle = "#000000";
        ctx.fillRect(10, bannerY, getWidth() - 20, 88);
        ctx.strokeStyle = "#fff4a8";
        ctx.lineWidth = 3;
        ctx.strokeRect(10, bannerY, getWidth() - 20, 88);

        ctx.fillStyle = "#fff4a8";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 5;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        ctx.font = "bold 18px monospace";
        ctx.strokeText("YOU TRIED TO SOBER UP", centerX, 95);
        ctx.fillText("YOU TRIED TO SOBER UP", centerX, 95);

        ctx.font = "bold 27px monospace";
        ctx.strokeText("THE REAL CORKER!", centerX, 132);
        ctx.fillText("THE REAL CORKER!", centerX, 132);

        if (struggleProgress > 0.18) {
          const warningAlpha =
            0.5 + 0.5 * Math.abs(Math.sin(elapsed / 130));

          ctx.globalAlpha = warningAlpha;
          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 13px monospace";
          ctx.fillText(
            "HE'S BREAKING OUT!",
            centerX,
            getHeight() - HUD_HEIGHT - 42
          );
          ctx.globalAlpha = 1;
        }

        if (elapsed < 300) {
          ctx.globalAlpha = 1 - elapsed / 300;
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, getWidth(), getHeight());
          ctx.globalAlpha = 1;
        }
      } else if (Corker.state === "poof") {
        const progress = Math.min(1, elapsed / 1300);
        drawPoofCloud(centerX, centerY, progress);
      } else if (Corker.state === "message") {
        const boxWidth = Math.min(getWidth() - 30, 330);
        const boxHeight = 142;
        const boxX = (getWidth() - boxWidth) / 2;
        const boxY = centerY - boxHeight / 2;

        ctx.fillStyle = "#ffffff";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.roundRect(
          boxX,
          boxY,
          boxWidth,
          boxHeight,
          14
        );
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#000000";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        ctx.font = "bold 18px monospace";
        ctx.fillText(
          "THE REAL CORKER ESCAPED!",
          centerX,
          boxY + 40
        );

        ctx.font = "bold 15px monospace";
        ctx.fillText(
          "HE WENT BACK TO THE BAR.",
          centerX,
          boxY + 78
        );

        ctx.font = "bold 16px monospace";
        ctx.fillText(
          "KEEP TRYIN' TO SOBER 'EM UP!",
          centerX,
          boxY + 112
        );
      }

      ctx.restore();
    }

    function drawJigglyCatchSequence() {
      if (
        Jigglydrunk.state !== "caught" &&
        Jigglydrunk.state !== "poof" &&
        Jigglydrunk.state !== "message"
      ) {
        return;
      }

      const centerX = getWidth() / 2;
      const centerY = getHeight() / 2 - 12;
      const elapsed = performance.now() - Jigglydrunk.stateStartedAt;

      ctx.save();

      if (Jigglydrunk.state === "poof" && elapsed < 420) {
        const shakeStrength = 4 * (1 - elapsed / 420);
        ctx.translate(
          Math.sin(elapsed / 22) * shakeStrength,
          Math.cos(elapsed / 19) * shakeStrength
        );
      }

      ctx.fillStyle = "rgba(5, 8, 18, 0.84)";
      ctx.fillRect(
        -6,
        -6,
        getWidth() + 12,
        getHeight() + 12
      );

      if (Jigglydrunk.state === "caught") {
        /*
          Three-part catch illusion:
          1. Corker is pulled toward the center as though entering a collection.
          2. He holds there and begins to shake.
          3. He struggles harder and bursts back out before the poof.
        */
        const pullDuration = 2200;
        const holdDuration = 1700;
        const struggleDuration = 2900;

        const pullProgress = Math.min(1, elapsed / pullDuration);
        const struggleStart = pullDuration + holdDuration;
        const struggleProgress = Math.max(
          0,
          Math.min(1, (elapsed - struggleStart) / struggleDuration)
        );

        drawCatchRays(
          centerX,
          centerY,
          260,
          elapsed / 1800
        );

        ctx.save();
        ctx.translate(centerX, centerY + 22);

        for (let ring = 0; ring < 3; ring += 1) {
          const ringProgress =
            (elapsed / 1200 + ring / 3) % 1;
          ctx.globalAlpha = 1 - ringProgress;
          ctx.strokeStyle =
            ring % 2 === 0 ? "#fff4a8" : "#85e9ff";
          ctx.lineWidth = 4 - ringProgress * 2;
          ctx.beginPath();
          ctx.arc(
            0,
            0,
            24 + ringProgress * 150,
            0,
            Math.PI * 2
          );
          ctx.stroke();
        }

        for (let i = 0; i < 14; i += 1) {
          const angle =
            (Math.PI * 2 * i) / 14 + elapsed / 1300;
          const distance =
            86 + Math.sin(elapsed / 240 + i) * 20;
          const sx = Math.cos(angle) * distance;
          const sy = Math.sin(angle) * distance;

          ctx.save();
          ctx.translate(sx, sy);
          ctx.rotate(angle);
          ctx.fillStyle =
            i % 2 === 0 ? "#fff4a8" : "#85e9ff";
          ctx.font = "bold 18px sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(i % 2 === 0 ? "✦" : "✧", 0, 0);
          ctx.restore();
        }

        ctx.restore();

        const image = Assets.jigglydrunk;

        /*
          Pull from large to collection-size, then grow slightly while
          struggling out. Horizontal shake increases throughout escape.
        */
        /*
          Fill much more of the screen:
          - zoom in large
          - shrink toward collection size
          - swell dramatically while breaking out
        */
        const zoomIn =
          360 + Math.sin(Math.min(1, elapsed / 900) * Math.PI / 2) * 70;

        const collectionShrink =
          pullProgress * 130;

        const breakoutGrow =
          struggleProgress * 145;

        const baseHeight =
          zoomIn - collectionShrink + breakoutGrow;

        const pulse =
          1 +
          Math.sin(elapsed / 185) *
            (0.045 + struggleProgress * 0.075);

        const height = baseHeight * pulse;
        const width =
          height * (image.naturalWidth / image.naturalHeight);

        const shakeX =
          struggleProgress > 0
            ? Math.sin(elapsed / 38) * (3 + struggleProgress * 16)
            : 0;

        const shakeY =
          struggleProgress > 0
            ? Math.sin(elapsed / 61) * (2 + struggleProgress * 7)
            : 0;

        const bounce =
          Math.abs(Math.sin(elapsed / 260)) * 7;

        ctx.imageSmoothingEnabled = false;

        const struggleTilt =
          struggleProgress > 0
            ? Math.sin(elapsed / 95) * 0.055 * struggleProgress
            : 0;

        ctx.save();
        ctx.translate(centerX, centerY + 34);
        ctx.rotate(struggleTilt);
        ctx.translate(-centerX, -(centerY + 34));

        const breakoutPop =
          struggleProgress > 0.86
            ? 1 + (struggleProgress - 0.86) * 1.55
            : 1;

        const finalWidth = width * breakoutPop;
        const finalHeight = height * breakoutPop;

        ctx.drawImage(
          image,
          centerX - finalWidth / 2 + shakeX,
          centerY - finalHeight / 2 + 34 - bounce + shakeY,
          finalWidth,
          finalHeight
        );

        ctx.restore();

        /*
          Black title panel instead of mauve.
        */
        const bannerY = 68;
        ctx.fillStyle = "#000000";
        ctx.fillRect(10, bannerY, getWidth() - 20, 88);
        ctx.strokeStyle = "#fff4a8";
        ctx.lineWidth = 3;
        ctx.strokeRect(10, bannerY, getWidth() - 20, 88);

        ctx.fillStyle = "#fff4a8";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 5;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        ctx.font = "bold 18px monospace";
        ctx.strokeText("YOU TRIED TO SOBER UP", centerX, 95);
        ctx.fillText("YOU TRIED TO SOBER UP", centerX, 95);

        ctx.font = "bold 27px monospace";
        ctx.strokeText("JIGGLYDRUNK!", centerX, 132);
        ctx.fillText("JIGGLYDRUNK!", centerX, 132);

        if (struggleProgress > 0.18) {
          const warningAlpha =
            0.5 + 0.5 * Math.abs(Math.sin(elapsed / 130));

          ctx.globalAlpha = warningAlpha;
          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 13px monospace";
          ctx.fillText(
            "HE'S BREAKING OUT!",
            centerX,
            getHeight() - HUD_HEIGHT - 42
          );
          ctx.globalAlpha = 1;
        }

        if (elapsed < 300) {
          ctx.globalAlpha = 1 - elapsed / 300;
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, getWidth(), getHeight());
          ctx.globalAlpha = 1;
        }
      } else if (Jigglydrunk.state === "poof") {
        const progress = Math.min(1, elapsed / 1300);
        drawPoofCloud(centerX, centerY, progress);
      } else if (Jigglydrunk.state === "message") {
        const boxWidth = Math.min(getWidth() - 30, 330);
        const boxHeight = 142;
        const boxX = (getWidth() - boxWidth) / 2;
        const boxY = centerY - boxHeight / 2;

        ctx.fillStyle = "#ffffff";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.roundRect(
          boxX,
          boxY,
          boxWidth,
          boxHeight,
          14
        );
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#000000";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        ctx.font = "bold 18px monospace";
        ctx.fillText(
          "JIGGLYDRUNK ESCAPED!",
          centerX,
          boxY + 40
        );

        ctx.font = "bold 15px monospace";
        ctx.fillText(
          "HE WENT BACK TO THE TAVERN.",
          centerX,
          boxY + 78
        );

        ctx.font = "bold 16px monospace";
        ctx.fillText(
          "KEEP TRYIN' TO SOBER 'EM UP!",
          centerX,
          boxY + 112
        );
      }

      ctx.restore();
    }

    function drawPukeeCatchSequence() {
      if (
        Pukee.state !== "caught" &&
        Pukee.state !== "poof" &&
        Pukee.state !== "message"
      ) {
        return;
      }

      const centerX = getWidth() / 2;
      const centerY = getHeight() / 2 - 12;
      const elapsed = performance.now() - Pukee.stateStartedAt;

      ctx.save();

      if (Pukee.state === "poof" && elapsed < 420) {
        const shakeStrength = 4 * (1 - elapsed / 420);
        ctx.translate(
          Math.sin(elapsed / 22) * shakeStrength,
          Math.cos(elapsed / 19) * shakeStrength
        );
      }

      ctx.fillStyle = "rgba(5, 8, 18, 0.84)";
      ctx.fillRect(
        -6,
        -6,
        getWidth() + 12,
        getHeight() + 12
      );

      if (Pukee.state === "caught") {
        /*
          Three-part catch illusion:
          1. Corker is pulled toward the center as though entering a collection.
          2. He holds there and begins to shake.
          3. He struggles harder and bursts back out before the poof.
        */
        const pullDuration = 2200;
        const holdDuration = 1700;
        const struggleDuration = 2900;

        const pullProgress = Math.min(1, elapsed / pullDuration);
        const struggleStart = pullDuration + holdDuration;
        const struggleProgress = Math.max(
          0,
          Math.min(1, (elapsed - struggleStart) / struggleDuration)
        );

        drawCatchRays(
          centerX,
          centerY,
          260,
          elapsed / 1800
        );

        ctx.save();
        ctx.translate(centerX, centerY + 22);

        for (let ring = 0; ring < 3; ring += 1) {
          const ringProgress =
            (elapsed / 1200 + ring / 3) % 1;
          ctx.globalAlpha = 1 - ringProgress;
          ctx.strokeStyle =
            ring % 2 === 0 ? "#fff4a8" : "#85e9ff";
          ctx.lineWidth = 4 - ringProgress * 2;
          ctx.beginPath();
          ctx.arc(
            0,
            0,
            24 + ringProgress * 150,
            0,
            Math.PI * 2
          );
          ctx.stroke();
        }

        for (let i = 0; i < 14; i += 1) {
          const angle =
            (Math.PI * 2 * i) / 14 + elapsed / 1300;
          const distance =
            86 + Math.sin(elapsed / 240 + i) * 20;
          const sx = Math.cos(angle) * distance;
          const sy = Math.sin(angle) * distance;

          ctx.save();
          ctx.translate(sx, sy);
          ctx.rotate(angle);
          ctx.fillStyle =
            i % 2 === 0 ? "#fff4a8" : "#85e9ff";
          ctx.font = "bold 18px sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(i % 2 === 0 ? "✦" : "✧", 0, 0);
          ctx.restore();
        }

        ctx.restore();

        const image = Assets.pukee;

        /*
          Pull from large to collection-size, then grow slightly while
          struggling out. Horizontal shake increases throughout escape.
        */
        /*
          Fill much more of the screen:
          - zoom in large
          - shrink toward collection size
          - swell dramatically while breaking out
        */
        const zoomIn =
          360 + Math.sin(Math.min(1, elapsed / 900) * Math.PI / 2) * 70;

        const collectionShrink =
          pullProgress * 130;

        const breakoutGrow =
          struggleProgress * 145;

        const baseHeight =
          zoomIn - collectionShrink + breakoutGrow;

        const pulse =
          1 +
          Math.sin(elapsed / 185) *
            (0.045 + struggleProgress * 0.075);

        const height = baseHeight * pulse;
        const width =
          height * (image.naturalWidth / image.naturalHeight);

        const shakeX =
          struggleProgress > 0
            ? Math.sin(elapsed / 38) * (3 + struggleProgress * 16)
            : 0;

        const shakeY =
          struggleProgress > 0
            ? Math.sin(elapsed / 61) * (2 + struggleProgress * 7)
            : 0;

        const bounce =
          Math.abs(Math.sin(elapsed / 260)) * 7;

        ctx.imageSmoothingEnabled = false;

        const struggleTilt =
          struggleProgress > 0
            ? Math.sin(elapsed / 95) * 0.055 * struggleProgress
            : 0;

        ctx.save();
        ctx.translate(centerX, centerY + 34);
        ctx.rotate(struggleTilt);
        ctx.translate(-centerX, -(centerY + 34));

        const breakoutPop =
          struggleProgress > 0.86
            ? 1 + (struggleProgress - 0.86) * 1.55
            : 1;

        const finalWidth = width * breakoutPop;
        const finalHeight = height * breakoutPop;

        ctx.drawImage(
          image,
          centerX - finalWidth / 2 + shakeX,
          centerY - finalHeight / 2 + 34 - bounce + shakeY,
          finalWidth,
          finalHeight
        );

        ctx.restore();

        /*
          Black title panel instead of mauve.
        */
        const bannerY = 68;
        ctx.fillStyle = "#000000";
        ctx.fillRect(10, bannerY, getWidth() - 20, 88);
        ctx.strokeStyle = "#fff4a8";
        ctx.lineWidth = 3;
        ctx.strokeRect(10, bannerY, getWidth() - 20, 88);

        ctx.fillStyle = "#fff4a8";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 5;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        ctx.font = "bold 18px monospace";
        ctx.strokeText("YOU TRIED TO SOBER UP", centerX, 95);
        ctx.fillText("YOU TRIED TO SOBER UP", centerX, 95);

        ctx.font = "bold 27px monospace";
        ctx.strokeText("PUKEE!", centerX, 132);
        ctx.fillText("PUKEE!", centerX, 132);

        if (struggleProgress > 0.18) {
          const warningAlpha =
            0.5 + 0.5 * Math.abs(Math.sin(elapsed / 130));

          ctx.globalAlpha = warningAlpha;
          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 13px monospace";
          ctx.fillText(
            "HE'S BREAKING OUT!",
            centerX,
            getHeight() - HUD_HEIGHT - 42
          );
          ctx.globalAlpha = 1;
        }

        if (elapsed < 300) {
          ctx.globalAlpha = 1 - elapsed / 300;
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, getWidth(), getHeight());
          ctx.globalAlpha = 1;
        }
      } else if (Pukee.state === "poof") {
        const progress = Math.min(1, elapsed / 1300);
        drawPoofCloud(centerX, centerY, progress);
      } else if (Pukee.state === "message") {
        const boxWidth = Math.min(getWidth() - 30, 330);
        const boxHeight = 142;
        const boxX = (getWidth() - boxWidth) / 2;
        const boxY = centerY - boxHeight / 2;

        ctx.fillStyle = "#ffffff";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.roundRect(
          boxX,
          boxY,
          boxWidth,
          boxHeight,
          14
        );
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#000000";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        ctx.font = "bold 18px monospace";
        ctx.fillText(
          "PUKEE ESCAPED!",
          centerX,
          boxY + 40
        );

        ctx.font = "bold 15px monospace";
        ctx.fillText(
          "HE WENT BACK TO THE LIQUOR STORE.",
          centerX,
          boxY + 78
        );

        ctx.font = "bold 16px monospace";
        ctx.fillText(
          "KEEP TRYIN' TO SOBER 'EM UP!",
          centerX,
          boxY + 112
        );
      }

      ctx.restore();
    }

    function drawTankCatchSequence() {
      if (
        Tank.state !== "caught" &&
        Tank.state !== "poof" &&
        Tank.state !== "message"
      ) {
        return;
      }

      const centerX = getWidth() / 2;
      const centerY = getHeight() / 2 - 12;
      const elapsed = performance.now() - Tank.stateStartedAt;

      ctx.save();

      if (Tank.state === "poof" && elapsed < 420) {
        const shakeStrength = 4 * (1 - elapsed / 420);
        ctx.translate(
          Math.sin(elapsed / 22) * shakeStrength,
          Math.cos(elapsed / 19) * shakeStrength
        );
      }

      ctx.fillStyle = "rgba(5, 8, 18, 0.84)";
      ctx.fillRect(
        -6,
        -6,
        getWidth() + 12,
        getHeight() + 12
      );

      if (Tank.state === "caught") {
        /*
          Three-part catch illusion:
          1. Corker is pulled toward the center as though entering a collection.
          2. He holds there and begins to shake.
          3. He struggles harder and bursts back out before the poof.
        */
        const pullDuration = 2200;
        const holdDuration = 1700;
        const struggleDuration = 2900;

        const pullProgress = Math.min(1, elapsed / pullDuration);
        const struggleStart = pullDuration + holdDuration;
        const struggleProgress = Math.max(
          0,
          Math.min(1, (elapsed - struggleStart) / struggleDuration)
        );

        drawCatchRays(
          centerX,
          centerY,
          260,
          elapsed / 1800
        );

        ctx.save();
        ctx.translate(centerX, centerY + 22);

        for (let ring = 0; ring < 3; ring += 1) {
          const ringProgress =
            (elapsed / 1200 + ring / 3) % 1;
          ctx.globalAlpha = 1 - ringProgress;
          ctx.strokeStyle =
            ring % 2 === 0 ? "#fff4a8" : "#85e9ff";
          ctx.lineWidth = 4 - ringProgress * 2;
          ctx.beginPath();
          ctx.arc(
            0,
            0,
            24 + ringProgress * 150,
            0,
            Math.PI * 2
          );
          ctx.stroke();
        }

        for (let i = 0; i < 14; i += 1) {
          const angle =
            (Math.PI * 2 * i) / 14 + elapsed / 1300;
          const distance =
            86 + Math.sin(elapsed / 240 + i) * 20;
          const sx = Math.cos(angle) * distance;
          const sy = Math.sin(angle) * distance;

          ctx.save();
          ctx.translate(sx, sy);
          ctx.rotate(angle);
          ctx.fillStyle =
            i % 2 === 0 ? "#fff4a8" : "#85e9ff";
          ctx.font = "bold 18px sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(i % 2 === 0 ? "✦" : "✧", 0, 0);
          ctx.restore();
        }

        ctx.restore();

        const image = Assets.tank;

        /*
          Pull from large to collection-size, then grow slightly while
          struggling out. Horizontal shake increases throughout escape.
        */
        /*
          Fill much more of the screen:
          - zoom in large
          - shrink toward collection size
          - swell dramatically while breaking out
        */
        const zoomIn =
          360 + Math.sin(Math.min(1, elapsed / 900) * Math.PI / 2) * 70;

        const collectionShrink =
          pullProgress * 130;

        const breakoutGrow =
          struggleProgress * 145;

        const baseHeight =
          zoomIn - collectionShrink + breakoutGrow;

        const pulse =
          1 +
          Math.sin(elapsed / 185) *
            (0.045 + struggleProgress * 0.075);

        const height = baseHeight * pulse;
        const width =
          height * (image.naturalWidth / image.naturalHeight);

        const shakeX =
          struggleProgress > 0
            ? Math.sin(elapsed / 38) * (3 + struggleProgress * 16)
            : 0;

        const shakeY =
          struggleProgress > 0
            ? Math.sin(elapsed / 61) * (2 + struggleProgress * 7)
            : 0;

        const bounce =
          Math.abs(Math.sin(elapsed / 260)) * 7;

        ctx.imageSmoothingEnabled = false;

        const struggleTilt =
          struggleProgress > 0
            ? Math.sin(elapsed / 95) * 0.055 * struggleProgress
            : 0;

        ctx.save();
        ctx.translate(centerX, centerY + 34);
        ctx.rotate(struggleTilt);
        ctx.translate(-centerX, -(centerY + 34));

        const breakoutPop =
          struggleProgress > 0.86
            ? 1 + (struggleProgress - 0.86) * 1.55
            : 1;

        const finalWidth = width * breakoutPop;
        const finalHeight = height * breakoutPop;

        ctx.drawImage(
          image,
          centerX - finalWidth / 2 + shakeX,
          centerY - finalHeight / 2 + 34 - bounce + shakeY,
          finalWidth,
          finalHeight
        );

        ctx.restore();

        /*
          Black title panel instead of mauve.
        */
        const bannerY = 68;
        ctx.fillStyle = "#000000";
        ctx.fillRect(10, bannerY, getWidth() - 20, 88);
        ctx.strokeStyle = "#fff4a8";
        ctx.lineWidth = 3;
        ctx.strokeRect(10, bannerY, getWidth() - 20, 88);

        ctx.fillStyle = "#fff4a8";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 5;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        ctx.font = "bold 18px monospace";
        ctx.strokeText("YOU TRIED TO SOBER UP", centerX, 95);
        ctx.fillText("YOU TRIED TO SOBER UP", centerX, 95);

        ctx.font = "bold 27px monospace";
        ctx.strokeText("TANK!", centerX, 132);
        ctx.fillText("TANK!", centerX, 132);

        if (struggleProgress > 0.18) {
          const warningAlpha =
            0.5 + 0.5 * Math.abs(Math.sin(elapsed / 130));

          ctx.globalAlpha = warningAlpha;
          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 13px monospace";
          ctx.fillText(
            "HE'S BREAKING OUT!",
            centerX,
            getHeight() - HUD_HEIGHT - 42
          );
          ctx.globalAlpha = 1;
        }

        if (elapsed < 300) {
          ctx.globalAlpha = 1 - elapsed / 300;
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, getWidth(), getHeight());
          ctx.globalAlpha = 1;
        }
      } else if (Tank.state === "poof") {
        const progress = Math.min(1, elapsed / 1300);
        drawPoofCloud(centerX, centerY, progress);
      } else if (Tank.state === "message") {
        const boxWidth = Math.min(getWidth() - 30, 330);
        const boxHeight = 142;
        const boxX = (getWidth() - boxWidth) / 2;
        const boxY = centerY - boxHeight / 2;

        ctx.fillStyle = "#ffffff";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.roundRect(
          boxX,
          boxY,
          boxWidth,
          boxHeight,
          14
        );
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#000000";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        ctx.font = "bold 18px monospace";
        ctx.fillText(
          "TANK ESCAPED!",
          centerX,
          boxY + 40
        );

        ctx.font = "bold 15px monospace";
        ctx.fillText(
          "HE WENT BACK TO THE POOL HALL.",
          centerX,
          boxY + 78
        );

        ctx.font = "bold 16px monospace";
        ctx.fillText(
          "KEEP TRYIN' TO SOBER 'EM UP!",
          centerX,
          boxY + 112
        );
      }

      ctx.restore();
    }

    function drawBarflyCatchSequence() {
      if (
        Barfly.state !== "caught" &&
        Barfly.state !== "poof" &&
        Barfly.state !== "message"
      ) {
        return;
      }

      const centerX = getWidth() / 2;
      const centerY = getHeight() / 2 - 12;
      const elapsed = performance.now() - Barfly.stateStartedAt;

      ctx.save();

      if (Barfly.state === "poof" && elapsed < 420) {
        const shakeStrength = 4 * (1 - elapsed / 420);
        ctx.translate(
          Math.sin(elapsed / 22) * shakeStrength,
          Math.cos(elapsed / 19) * shakeStrength
        );
      }

      ctx.fillStyle = "rgba(5, 8, 18, 0.84)";
      ctx.fillRect(
        -6,
        -6,
        getWidth() + 12,
        getHeight() + 12
      );

      if (Barfly.state === "caught") {
        /*
          Three-part catch illusion:
          1. Corker is pulled toward the center as though entering a collection.
          2. He holds there and begins to shake.
          3. He struggles harder and bursts back out before the poof.
        */
        const pullDuration = 2200;
        const holdDuration = 1700;
        const struggleDuration = 2900;

        const pullProgress = Math.min(1, elapsed / pullDuration);
        const struggleStart = pullDuration + holdDuration;
        const struggleProgress = Math.max(
          0,
          Math.min(1, (elapsed - struggleStart) / struggleDuration)
        );

        drawCatchRays(
          centerX,
          centerY,
          260,
          elapsed / 1800
        );

        ctx.save();
        ctx.translate(centerX, centerY + 22);

        for (let ring = 0; ring < 3; ring += 1) {
          const ringProgress =
            (elapsed / 1200 + ring / 3) % 1;
          ctx.globalAlpha = 1 - ringProgress;
          ctx.strokeStyle =
            ring % 2 === 0 ? "#fff4a8" : "#85e9ff";
          ctx.lineWidth = 4 - ringProgress * 2;
          ctx.beginPath();
          ctx.arc(
            0,
            0,
            24 + ringProgress * 150,
            0,
            Math.PI * 2
          );
          ctx.stroke();
        }

        for (let i = 0; i < 14; i += 1) {
          const angle =
            (Math.PI * 2 * i) / 14 + elapsed / 1300;
          const distance =
            86 + Math.sin(elapsed / 240 + i) * 20;
          const sx = Math.cos(angle) * distance;
          const sy = Math.sin(angle) * distance;

          ctx.save();
          ctx.translate(sx, sy);
          ctx.rotate(angle);
          ctx.fillStyle =
            i % 2 === 0 ? "#fff4a8" : "#85e9ff";
          ctx.font = "bold 18px sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(i % 2 === 0 ? "✦" : "✧", 0, 0);
          ctx.restore();
        }

        ctx.restore();

        const image = Assets.barfly;

        /*
          Pull from large to collection-size, then grow slightly while
          struggling out. Horizontal shake increases throughout escape.
        */
        /*
          Fill much more of the screen:
          - zoom in large
          - shrink toward collection size
          - swell dramatically while breaking out
        */
        const zoomIn =
          360 + Math.sin(Math.min(1, elapsed / 900) * Math.PI / 2) * 70;

        const collectionShrink =
          pullProgress * 130;

        const breakoutGrow =
          struggleProgress * 145;

        const baseHeight =
          zoomIn - collectionShrink + breakoutGrow;

        const pulse =
          1 +
          Math.sin(elapsed / 185) *
            (0.045 + struggleProgress * 0.075);

        const height = baseHeight * pulse;
        const width =
          height * (image.naturalWidth / image.naturalHeight);

        const shakeX =
          struggleProgress > 0
            ? Math.sin(elapsed / 38) * (3 + struggleProgress * 16)
            : 0;

        const shakeY =
          struggleProgress > 0
            ? Math.sin(elapsed / 61) * (2 + struggleProgress * 7)
            : 0;

        const bounce =
          Math.abs(Math.sin(elapsed / 260)) * 7;

        ctx.imageSmoothingEnabled = false;

        const struggleTilt =
          struggleProgress > 0
            ? Math.sin(elapsed / 95) * 0.055 * struggleProgress
            : 0;

        ctx.save();
        ctx.translate(centerX, centerY + 34);
        ctx.rotate(struggleTilt);
        ctx.translate(-centerX, -(centerY + 34));

        const breakoutPop =
          struggleProgress > 0.86
            ? 1 + (struggleProgress - 0.86) * 1.55
            : 1;

        const finalWidth = width * breakoutPop;
        const finalHeight = height * breakoutPop;

        ctx.drawImage(
          image,
          centerX - finalWidth / 2 + shakeX,
          centerY - finalHeight / 2 + 34 - bounce + shakeY,
          finalWidth,
          finalHeight
        );

        ctx.restore();

        /*
          Black title panel instead of mauve.
        */
        const bannerY = 68;
        ctx.fillStyle = "#000000";
        ctx.fillRect(10, bannerY, getWidth() - 20, 88);
        ctx.strokeStyle = "#fff4a8";
        ctx.lineWidth = 3;
        ctx.strokeRect(10, bannerY, getWidth() - 20, 88);

        ctx.fillStyle = "#fff4a8";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 5;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        ctx.font = "bold 18px monospace";
        ctx.strokeText("YOU TRIED TO SOBER UP", centerX, 95);
        ctx.fillText("YOU TRIED TO SOBER UP", centerX, 95);

        ctx.font = "bold 27px monospace";
        ctx.strokeText("BARFLY!", centerX, 132);
        ctx.fillText("BARFLY!", centerX, 132);

        if (struggleProgress > 0.18) {
          const warningAlpha =
            0.5 + 0.5 * Math.abs(Math.sin(elapsed / 130));

          ctx.globalAlpha = warningAlpha;
          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 13px monospace";
          ctx.fillText(
            "HE'S BREAKING OUT!",
            centerX,
            getHeight() - HUD_HEIGHT - 42
          );
          ctx.globalAlpha = 1;
        }

        if (elapsed < 300) {
          ctx.globalAlpha = 1 - elapsed / 300;
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, getWidth(), getHeight());
          ctx.globalAlpha = 1;
        }
      } else if (Barfly.state === "poof") {
        const progress = Math.min(1, elapsed / 1300);
        drawPoofCloud(centerX, centerY, progress);
      } else if (Barfly.state === "message") {
        const boxWidth = Math.min(getWidth() - 30, 330);
        const boxHeight = 142;
        const boxX = (getWidth() - boxWidth) / 2;
        const boxY = centerY - boxHeight / 2;

        ctx.fillStyle = "#ffffff";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.roundRect(
          boxX,
          boxY,
          boxWidth,
          boxHeight,
          14
        );
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#000000";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        ctx.font = "bold 18px monospace";
        ctx.fillText(
          "BARFLY ESCAPED!",
          centerX,
          boxY + 40
        );

        ctx.font = "bold 15px monospace";
        ctx.fillText(
          "HE WENT BACK TO THE POOL TAVERN.",
          centerX,
          boxY + 78
        );

        ctx.font = "bold 16px monospace";
        ctx.fillText(
          "KEEP TRYIN' TO SOBER 'EM UP!",
          centerX,
          boxY + 112
        );
      }

      ctx.restore();
    }

    function drawDrunkachuCatchSequence() {
      if (
        Drunkachu.state !== "caught" &&
        Drunkachu.state !== "poof" &&
        Drunkachu.state !== "message"
      ) {
        return;
      }

      const centerX = getWidth() / 2;
      const centerY = getHeight() / 2 - 12;
      const elapsed = performance.now() - Drunkachu.stateStartedAt;

      ctx.save();

      if (Drunkachu.state === "poof" && elapsed < 420) {
        const shakeStrength = 4 * (1 - elapsed / 420);
        ctx.translate(
          Math.sin(elapsed / 22) * shakeStrength,
          Math.cos(elapsed / 19) * shakeStrength
        );
      }

      ctx.fillStyle = "rgba(5, 8, 18, 0.84)";
      ctx.fillRect(
        -6,
        -6,
        getWidth() + 12,
        getHeight() + 12
      );

      if (Drunkachu.state === "caught") {
        /*
          Three-part catch illusion:
          1. Corker is pulled toward the center as though entering a collection.
          2. He holds there and begins to shake.
          3. He struggles harder and bursts back out before the poof.
        */
        const pullDuration = 2200;
        const holdDuration = 1700;
        const struggleDuration = 2900;

        const pullProgress = Math.min(1, elapsed / pullDuration);
        const struggleStart = pullDuration + holdDuration;
        const struggleProgress = Math.max(
          0,
          Math.min(1, (elapsed - struggleStart) / struggleDuration)
        );

        drawCatchRays(
          centerX,
          centerY,
          260,
          elapsed / 1800
        );

        ctx.save();
        ctx.translate(centerX, centerY + 22);

        for (let ring = 0; ring < 3; ring += 1) {
          const ringProgress =
            (elapsed / 1200 + ring / 3) % 1;
          ctx.globalAlpha = 1 - ringProgress;
          ctx.strokeStyle =
            ring % 2 === 0 ? "#fff4a8" : "#85e9ff";
          ctx.lineWidth = 4 - ringProgress * 2;
          ctx.beginPath();
          ctx.arc(
            0,
            0,
            24 + ringProgress * 150,
            0,
            Math.PI * 2
          );
          ctx.stroke();
        }

        for (let i = 0; i < 14; i += 1) {
          const angle =
            (Math.PI * 2 * i) / 14 + elapsed / 1300;
          const distance =
            86 + Math.sin(elapsed / 240 + i) * 20;
          const sx = Math.cos(angle) * distance;
          const sy = Math.sin(angle) * distance;

          ctx.save();
          ctx.translate(sx, sy);
          ctx.rotate(angle);
          ctx.fillStyle =
            i % 2 === 0 ? "#fff4a8" : "#85e9ff";
          ctx.font = "bold 18px sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(i % 2 === 0 ? "✦" : "✧", 0, 0);
          ctx.restore();
        }

        ctx.restore();

        const image = Assets.drunkachu;

        /*
          Pull from large to collection-size, then grow slightly while
          struggling out. Horizontal shake increases throughout escape.
        */
        /*
          Fill much more of the screen:
          - zoom in large
          - shrink toward collection size
          - swell dramatically while breaking out
        */
        const zoomIn =
          360 + Math.sin(Math.min(1, elapsed / 900) * Math.PI / 2) * 70;

        const collectionShrink =
          pullProgress * 130;

        const breakoutGrow =
          struggleProgress * 145;

        const baseHeight =
          zoomIn - collectionShrink + breakoutGrow;

        const pulse =
          1 +
          Math.sin(elapsed / 185) *
            (0.045 + struggleProgress * 0.075);

        const height = baseHeight * pulse;
        const width =
          height * (image.naturalWidth / image.naturalHeight);

        const shakeX =
          struggleProgress > 0
            ? Math.sin(elapsed / 38) * (3 + struggleProgress * 16)
            : 0;

        const shakeY =
          struggleProgress > 0
            ? Math.sin(elapsed / 61) * (2 + struggleProgress * 7)
            : 0;

        const bounce =
          Math.abs(Math.sin(elapsed / 260)) * 7;

        ctx.imageSmoothingEnabled = false;

        const struggleTilt =
          struggleProgress > 0
            ? Math.sin(elapsed / 95) * 0.055 * struggleProgress
            : 0;

        ctx.save();
        ctx.translate(centerX, centerY + 34);
        ctx.rotate(struggleTilt);
        ctx.translate(-centerX, -(centerY + 34));

        const breakoutPop =
          struggleProgress > 0.86
            ? 1 + (struggleProgress - 0.86) * 1.55
            : 1;

        const finalWidth = width * breakoutPop;
        const finalHeight = height * breakoutPop;

        ctx.drawImage(
          image,
          centerX - finalWidth / 2 + shakeX,
          centerY - finalHeight / 2 + 34 - bounce + shakeY,
          finalWidth,
          finalHeight
        );

        ctx.restore();

        /*
          Black title panel instead of mauve.
        */
        const bannerY = 68;
        ctx.fillStyle = "#000000";
        ctx.fillRect(10, bannerY, getWidth() - 20, 88);
        ctx.strokeStyle = "#fff4a8";
        ctx.lineWidth = 3;
        ctx.strokeRect(10, bannerY, getWidth() - 20, 88);

        ctx.fillStyle = "#fff4a8";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 5;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        ctx.font = "bold 18px monospace";
        ctx.strokeText("YOU TRIED TO SOBER UP", centerX, 95);
        ctx.fillText("YOU TRIED TO SOBER UP", centerX, 95);

        ctx.font = "bold 27px monospace";
        ctx.strokeText("DRUNKACHU!", centerX, 132);
        ctx.fillText("DRUNKACHU!", centerX, 132);

        if (struggleProgress > 0.18) {
          const warningAlpha =
            0.5 + 0.5 * Math.abs(Math.sin(elapsed / 130));

          ctx.globalAlpha = warningAlpha;
          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 13px monospace";
          ctx.fillText(
            "HE'S BREAKING OUT!",
            centerX,
            getHeight() - HUD_HEIGHT - 42
          );
          ctx.globalAlpha = 1;
        }

        if (elapsed < 300) {
          ctx.globalAlpha = 1 - elapsed / 300;
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, getWidth(), getHeight());
          ctx.globalAlpha = 1;
        }
      } else if (Drunkachu.state === "poof") {
        const progress = Math.min(1, elapsed / 1300);
        drawPoofCloud(centerX, centerY, progress);
      } else if (Drunkachu.state === "message") {
        const boxWidth = Math.min(getWidth() - 30, 330);
        const boxHeight = 142;
        const boxX = (getWidth() - boxWidth) / 2;
        const boxY = centerY - boxHeight / 2;

        ctx.fillStyle = "#ffffff";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.roundRect(
          boxX,
          boxY,
          boxWidth,
          boxHeight,
          14
        );
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#000000";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        ctx.font = "bold 18px monospace";
        ctx.fillText(
          "DRUNKACHU ESCAPED!",
          centerX,
          boxY + 40
        );

        ctx.font = "bold 15px monospace";
        ctx.fillText(
          "HE WENT BACK TO THE POOL HALL.",
          centerX,
          boxY + 78
        );

        ctx.font = "bold 16px monospace";
        ctx.fillText(
          "KEEP TRYIN' TO SOBER 'EM UP!",
          centerX,
          boxY + 112
        );
      }

      ctx.restore();
    }

    function drawTriedCollection() {
      const y = getHeight() - BOTTOM_UI_HEIGHT;
      const labelX = 7;
      const slotStartX = 60;
      const slotWidth = 48;
      const slotHeight = 30;
      const slotGap = 5;
      const maxSlots = 6;
      const now = performance.now();

      ctx.save();

      ctx.fillStyle = "rgba(8, 10, 17, 0.90)";
      ctx.fillRect(0, y, getWidth(), TRIED_HEIGHT);

      ctx.strokeStyle = "rgba(255, 246, 191, 0.58)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(getWidth(), y + 0.5);
      ctx.stroke();

      ctx.fillStyle = "#fff6bf";
      ctx.font = "bold 9px monospace";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText("TRIED:", labelX, y + TRIED_HEIGHT / 2);

      // Keep the original question-mark collection boxes visible.
      for (let i = 0; i < maxSlots; i += 1) {
        const boxX = slotStartX + i * (slotWidth + slotGap);
        const boxY = y + 2;

        const isSpecialSlot = i === maxSlots - 1;

        ctx.fillStyle = isSpecialSlot
          ? "rgba(105, 75, 12, 0.97)"
          : "rgba(25, 30, 42, 0.96)";
        ctx.strokeStyle = isSpecialSlot
          ? "rgba(255, 215, 74, 0.98)"
          : "rgba(255, 246, 191, 0.72)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(boxX, boxY, slotWidth, slotHeight, 4);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = isSpecialSlot
          ? "rgba(255, 228, 102, 0.95)"
          : "rgba(255, 246, 191, 0.52)";
        ctx.font = isSpecialSlot
          ? "bold 17px monospace"
          : "bold 15px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("?", boxX + slotWidth / 2, boxY + slotHeight / 2 + 1);
      }

      function drawTriedPortrait(image, slotIndex, shouldDraw, isAnimating) {
        if (
          !shouldDraw ||
          !image.complete ||
          image.naturalWidth <= 0 ||
          image.naturalHeight <= 0
        ) {
          return;
        }

        const elapsed = now - triedAnimationStartedAt;
        const progress = isAnimating
          ? Math.max(0, Math.min(1, elapsed / TRIED_ADD_DURATION))
          : 1;

        const landing = 1 - Math.pow(1 - progress, 3);
        const bounce =
          isAnimating && progress < 1
            ? Math.sin(progress * Math.PI * 3) * (1 - progress) * 7
            : 0;

        const spriteHeight = 64;
        const spriteWidth =
          spriteHeight * (image.naturalWidth / image.naturalHeight);

        const boxX = slotStartX + slotIndex * (slotWidth + slotGap);
        const targetCenterX = boxX + slotWidth / 2;
        const startX = getWidth() + 30;
        const currentCenterX = startX + (targetCenterX - startX) * landing;
        const drawX = currentCenterX - spriteWidth / 2;
        const drawY = y + TRIED_HEIGHT - spriteHeight + 11 - bounce;

        ctx.save();
        ctx.imageSmoothingEnabled = false;
        ctx.shadowColor = "rgba(0, 0, 0, 0.95)";
        ctx.shadowBlur = 5;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 2;
        ctx.drawImage(image, drawX, drawY, spriteWidth, spriteHeight);
        ctx.restore();

        if (isAnimating && progress > 0.55 && progress < 1) {
          const sparkleProgress = (progress - 0.55) / 0.45;
          ctx.save();
          ctx.globalAlpha = 1 - sparkleProgress;
          ctx.fillStyle = "#fff4a8";
          ctx.font = "bold 13px sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(
            "✦",
            targetCenterX + 10,
            y + 6 - sparkleProgress * 8
          );
          ctx.restore();
        }
      }

      // Collection fills left to right: Corker, Jigglydrunk, Pukee, then future drunks.
      drawTriedPortrait(
        Assets.corker,
        0,
        corkerTried,
        triedCharacter === "corker" && Corker.state === "triedAdd"
      );

      drawTriedPortrait(
        Assets.jigglydrunk,
        1,
        jigglyTried,
        triedCharacter === "jigglydrunk" && Jigglydrunk.state === "triedAdd"
      );

      drawTriedPortrait(
        Assets.pukee,
        2,
        pukeeTried,
        triedCharacter === "pukee" && Pukee.state === "triedAdd"
      );


      drawTriedPortrait(
        Assets.barfly,
        3,
        barflyTried,
        triedCharacter === "barfly" && Barfly.state === "triedAdd"
      );

      drawTriedPortrait(
        Assets.tank,
        4,
        tankTried,
        triedCharacter === "tank" && Tank.state === "triedAdd"
      );

      drawTriedPortrait(
        Assets.drunkachu,
        5,
        drunkachuTried,
        triedCharacter === "drunkachu" && Drunkachu.state === "triedAdd"
      );

      ctx.restore();
    }

    function drawHud() {
      const y = getHeight() - HUD_HEIGHT;
      const now = performance.now();
      const soberRolling =
        Corker.state === "hudSoberRoll" ||
        Jigglydrunk.state === "hudSoberRoll" ||
        Pukee.state === "hudSoberRoll" ||
        Barfly.state === "hudSoberRoll" ||
        Tank.state === "hudSoberRoll" ||
        Drunkachu.state === "hudSoberRoll";

      const heartRolling =
        Corker.state === "hudHeartRoll" ||
        Jigglydrunk.state === "hudHeartRoll" ||
        Pukee.state === "hudHeartRoll" ||
        Barfly.state === "hudHeartRoll" ||
        Tank.state === "hudHeartRoll" ||
        Drunkachu.state === "hudHeartRoll";

      if (soberRolling) {
        const elapsed = now - hudAnimationStartedAt;
        const progress = Math.min(1, elapsed / SOBER_ROLL_DURATION);
        const fakeNumber =
          Math.floor((elapsed / 75) % 10);

        soberCounterDisplay =
          progress < 0.86 ? fakeNumber : 0;
      }

      const rollingHearts =
        Barfly.state === "hudHeartRoll"
          ? Barfly.hearts
          : Pukee.state === "hudHeartRoll"
            ? Pukee.hearts
            : Jigglydrunk.state === "hudHeartRoll"
              ? Jigglydrunk.hearts
              : Corker.hearts;

      const heartPreview =
        heartRolling
          ? friendsSobriety + rollingHearts
          : friendsSobriety;

      ctx.save();
      ctx.fillStyle = "rgba(12, 15, 24, 0.91)";
      ctx.fillRect(0, y, getWidth(), HUD_HEIGHT);

      ctx.strokeStyle = "rgba(255, 246, 191, 0.72)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(getWidth(), y + 0.5);
      ctx.stroke();

      if (soberRolling) {
        const pulse =
          0.5 + 0.5 * Math.abs(Math.sin(now / 95));
        ctx.fillStyle = `rgba(255, 235, 110, ${0.14 + pulse * 0.26})`;
        ctx.fillRect(0, y, getWidth() * 0.49, HUD_HEIGHT);
      }

      if (heartRolling) {
        const pulse =
          0.5 + 0.5 * Math.abs(Math.sin(now / 110));
        ctx.fillStyle = `rgba(220, 52, 65, ${0.12 + pulse * 0.28})`;
        ctx.fillRect(
          getWidth() * 0.49,
          y,
          getWidth() * 0.51,
          HUD_HEIGHT
        );
      }

      ctx.font = "bold 8px monospace";
      ctx.textBaseline = "middle";

      ctx.textAlign = "left";
      ctx.fillStyle = soberRolling ? "#fff08a" : "#fff6bf";
      ctx.fillText(
        `PEOPLE SOBERED UP: ${soberCounterDisplay}`,
        6,
        y + HUD_HEIGHT / 2
      );

      const rightTextX = getWidth() - 6;
      ctx.textAlign = "right";
      ctx.fillStyle = "#fff6bf";
      ctx.fillText(
        `OUR FRIENDS' SOBRIETY:     ${heartPreview}`,
        rightTextX,
        y + HUD_HEIGHT / 2
      );

      ctx.fillStyle =
        friendsSobriety > 0 || heartRolling
          ? "#e53945"
          : "#8e8e8e";

      ctx.font = heartRolling
        ? `bold ${12 + Math.abs(Math.sin(now / 100)) * 5}px sans-serif`
        : "bold 13px sans-serif";

      ctx.fillText(
        "♥",
        rightTextX - 13,
        y + HUD_HEIGHT / 2 + 0.5
      );

      ctx.restore();
    }

    function drawBill() {
      const image = Assets.bill;

      if (
        !image.complete ||
        image.naturalWidth <= 0 ||
        image.naturalHeight <= 0
      ) {
        return;
      }

      /*
        Keep Bill's natural proportions.
      */
      const drawHeight = 66;

      const aspect =
        image.naturalWidth /
        image.naturalHeight;

      const drawWidth =
        drawHeight *
        aspect;

      ctx.save();

      ctx.imageSmoothingEnabled = false;

      const walkBounce = isBillMoving
        ? Math.abs(Math.sin(performance.now() / 85)) * 3
        : 0;

      ctx.drawImage(
        image,
        Bill.x - drawWidth / 2,
        Bill.y - drawHeight - walkBounce,
        drawWidth,
        drawHeight
      );

      ctx.restore();
    }

    let titleCrop = null;

    function getTitleCrop(image) {
      if (titleCrop) {
        return titleCrop;
      }

      const scanCanvas = document.createElement("canvas");
      scanCanvas.width = image.naturalWidth;
      scanCanvas.height = image.naturalHeight;

      const scanCtx = scanCanvas.getContext("2d", {
        willReadFrequently: true
      });

      scanCtx.drawImage(image, 0, 0);

      const pixels = scanCtx.getImageData(
        0,
        0,
        scanCanvas.width,
        scanCanvas.height
      ).data;

      let left = scanCanvas.width;
      let right = -1;
      let top = scanCanvas.height;
      let bottom = -1;

      for (let y = 0; y < scanCanvas.height; y += 1) {
        for (let x = 0; x < scanCanvas.width; x += 1) {
          const alpha = pixels[(y * scanCanvas.width + x) * 4 + 3];

          if (alpha > 12) {
            left = Math.min(left, x);
            right = Math.max(right, x);
            top = Math.min(top, y);
            bottom = Math.max(bottom, y);
          }
        }
      }

      if (right < left || bottom < top) {
        titleCrop = {
          x: 0,
          y: 0,
          width: image.naturalWidth,
          height: image.naturalHeight
        };
      } else {
        titleCrop = {
          x: left,
          y: top,
          width: right - left + 1,
          height: bottom - top + 1
        };
      }

      return titleCrop;
    }

    function drawTitle() {
      const image = Assets.title;

      if (
        image.complete &&
        image.naturalWidth > 0 &&
        image.naturalHeight > 0
      ) {
        const crop = getTitleCrop(image);
        const drawWidth = getWidth() * 0.985;
        const aspect = crop.width / crop.height;
        const drawHeight = drawWidth / aspect;

        ctx.save();
        ctx.imageSmoothingEnabled = true;

        ctx.drawImage(
          image,
          crop.x,
          crop.y,
          crop.width,
          crop.height,
          (getWidth() - drawWidth) / 2,
          2,
          drawWidth,
          drawHeight
        );

        ctx.restore();
        return;
      }

      ctx.save();
      ctx.fillStyle = "#fff6bf";
      ctx.font = "bold 18px monospace";
      ctx.textAlign = "center";
      ctx.fillText(
        "GOTTA SOBER 'EM ALL!",
        getWidth() / 2,
        20
      );
      ctx.restore();
    }

    function drawScreenPanel(title, lines, footer) {
      const width = getWidth();
      const height = getHeight();
      const panelWidth = Math.min(350, width - 28);
      const panelHeight = 250;
      const panelX = (width - panelWidth) / 2;
      const panelY = (height - panelHeight) / 2;

      ctx.save();

      ctx.fillStyle = "rgba(3, 5, 10, 0.82)";
      ctx.fillRect(0, 0, width, height);

      ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
      ctx.shadowBlur = 14;
      ctx.fillStyle = "rgba(18, 22, 34, 0.98)";
      ctx.strokeStyle = "#f4d96b";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(
        panelX,
        panelY,
        panelWidth,
        panelHeight,
        13
      );
      ctx.fill();
      ctx.stroke();

      ctx.shadowBlur = 0;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      ctx.fillStyle = "#ffe778";
      ctx.font = "bold 20px monospace";
      ctx.fillText(
        title,
        width / 2,
        panelY + 43
      );

      ctx.fillStyle = "#fff8dc";
      ctx.font = "bold 13px monospace";

      lines.forEach((line, index) => {
        ctx.fillText(
          line,
          width / 2,
          panelY + 92 + index * 30
        );
      });

      const pulse =
        0.72 +
        Math.abs(Math.sin(performance.now() / 330)) *
          0.28;

      ctx.globalAlpha = pulse;
      ctx.fillStyle = "#ffe778";
      ctx.font = "bold 12px monospace";
      ctx.fillText(
        footer,
        width / 2,
        panelY + panelHeight - 30
      );

      ctx.restore();
    }

    function drawIntroScreen() {
      drawScreenPanel(
        "HOW TO PLAY",
        [
          "MOVE OUR FRIEND AROUND THE MAP",
          "TO FIND DRUNKS TO SOBER UP!"
        ],
        "TAP TO BEGIN"
      );
    }

    function drawEndingScreen() {
      drawScreenPanel(
        "CONGRATULATIONS!",
        [
          "YOU GOT 0 PEOPLE SOBER!",
          "BUT YOU STAYED SOBER!",
          "MAYBE SILKWORTH HAS",
          "SOME IDEAS ON THIS?!?"
        ],
        "TAP TO CONTINUE"
      );
    }

    //--------------------------------------------------
    // GAME CONTRACT
    //--------------------------------------------------

    function reset() {
      ctx.imageSmoothingEnabled = false;
      gamePhase = "intro";
      chapterCompleteSignalSent = false;
      pointerDown = false;
      billStartAligned = false;
      pointerX = Bill.x;
      pointerY = Bill.y;
      nearbyBuilding = null;
      nearbyDrunk = null;
      isBillMoving = false;
      friendsSobriety = 0;
      soberCounterDisplay = 0;
      hudAnimationStartedAt = 0;
      corkerTried = false;
      jigglyTried = false;
      pukeeTried = false;
      barflyTried = false;
      tankTried = false;
      drunkachuTried = false;
      triedAnimationStartedAt = 0;
      triedCharacter = null;

      Corker.x = 104;
      Corker.y = 470;
      Corker.state = "wander";
      Corker.stateStartedAt = performance.now();
      Corker.nextScurryAt = 0;
      Corker.scurryUntil = 0;
      Corker.pauseUntil = 0;
      Corker.wanderDirection = 1;
      Corker.wanderTurnAt = 0;
      Corker.nearbySince = 0;
      Corker.conversationStep = 0;

      Jigglydrunk.x = 280;
      Jigglydrunk.y = 300;
      Jigglydrunk.state = "waiting";
      Jigglydrunk.stateStartedAt = performance.now();
      Jigglydrunk.nearbySince = 0;
      Jigglydrunk.conversationStep = 0;
      Jigglydrunk.direction = 1;
      Jigglydrunk.turnAt = 0;
      Jigglydrunk.drinkAt = 0;
      Jigglydrunk.drinkingUntil = 0;
      Jigglydrunk.tried = false;

      Pukee.x = 92;
      Pukee.y = 300;
      Pukee.state = "waiting";
      Pukee.stateStartedAt = performance.now();
      Pukee.nearbySince = 0;
      Pukee.conversationStep = 0;
      Pukee.direction = 1;
      Pukee.turnAt = 0;
      Pukee.tried = false;

      Barfly.x = 0;
      Barfly.y = 0;
      Barfly.state = "waiting";
      Barfly.stateStartedAt = performance.now();
      Barfly.nearbySince = 0;
      Barfly.conversationStep = 0;
      Barfly.routeIndex = 0;
      Barfly.tried = false;

      Tank.x = 0;
      Tank.y = 0;
      Tank.state = "waiting";
      Tank.stateStartedAt = performance.now();
      Tank.nearbySince = 0;
      Tank.conversationStep = 0;
      Tank.direction = 1;
      Tank.turnAt = 0;
      Tank.tried = false;


      Drunkachu.x = 0;
      Drunkachu.y = 0;
      Drunkachu.state = "hide";
      Drunkachu.stateStartedAt = performance.now();
      Drunkachu.nearbySince = 0;
      Drunkachu.conversationStep = 0;
      Drunkachu.buildingIndex = 0;
      Drunkachu.targetBuildingIndex = 1;
      Drunkachu.side = 1;
      Drunkachu.nextActionAt = 0;
      Drunkachu.moveShoutUntil = 0;
      Drunkachu.tried = false;

      alignJigglyToTavern();
      alignPukeeToJazzClub();
      alignBarflyToBar();
      alignTankToPool();
      alignDrunkachuToBuilding();
      installMovementInput();
    }

    function update() {
      if (gamePhase !== "playing") {
        return;
      }

      if (!billStartAligned) {
        alignBillToHospital();
      }

      if (Corker.state === "wander" && Corker.wanderTurnAt === 0) {
        alignCorkerToBar();
      }

      updateBillMovement();
      updateNormalDrunkPopulation();
      updateCorkerMovement();
      updateJigglyMovement();
      updatePukeeMovement();
      updateBarflyMovement();
      updateTankMovement();
      keepDrunksSeparated();
      updateDrunkachuMovement();
      updateNearbyBuilding();
      updateNearbyDrunk();
      updateNearbyJigglydrunk();
      updateNearbyPukee();
      updateNearbyBarfly();
      updateNearbyTank();
      updateNearbyDrunkachu();
      updateCorkerSequence();
      updateJigglySequence();
      updatePukeeSequence();
      updateBarflySequence();
      updateTankSequence();
      updateDrunkachuSequence();
    }

    function draw() {
      drawBackground();
      drawDrunkachuBehindBuildings();
      drawBuildings();
      drawCorker();
      drawJigglydrunk();
      drawPukee();
      drawBarfly();
      drawTank();
      drawDrunkachu();
      drawBill();
      drawTitle();
      drawCorkerCatchSequence();
      drawJigglyCatchSequence();
      drawPukeeCatchSequence();
      drawBarflyCatchSequence();
      drawTankCatchSequence();
      drawDrunkachuCatchSequence();
      drawTriedCollection();
      drawHud();

      if (gamePhase === "intro") {
        drawIntroScreen();
      } else if (gamePhase === "ending") {
        drawEndingScreen();
      }
    }

    function tap() {
      if (gamePhase === "intro") {
        beginGameplay();
        return true;
      }

      if (gamePhase === "ending") {
        signalChapter6();

        return {
          complete: true,
          chapter: 5,
          nextChapter: 6
        };
      }

      return true;
    }

    return {
      reset,
      update,
      draw,
      tap
    };

  }

  window.RecoveryChapter5Gameplay = {
    createChapterGame: createChapter5Game,
    createChapter5Game
  };
})();