/*
  CHAPTER 5 GAMEPLAY
  Working With Others — handheld RPG-style rebuild

  Mobile:
    Press and slide to move Bill.
    Quick-tap near a doorway to talk.
    Tap to advance dialogue.
*/

(() => {
  "use strict";

  function createChapter5Game({
    ctx,
    getWidth,
    getHeight,
    playClickFeedback,
    playPickupFeedback,
    setGameState
  }) {
    const DURATION_MS = 120000;

    const TITLE_HEIGHT = 34;
    const STATUS_HEIGHT = 58;
    const DIALOGUE_HEIGHT = 150;
    const EXPERIENCE_HEIGHT = 38;

    /*
      Door magnet:
      Get Bill reasonably close to a doorway and the game helps
      line him up. Once he is very close, he snaps into place.
    */
    const DOOR_MAGNET_RANGE = 54;
    const DOOR_SNAP_RANGE = 18;
    const DOOR_MAGNET_STRENGTH = 6.2;
    const DOOR_RELEASE_DISTANCE = 88;

    const keys = { left:false, right:false, up:false, down:false };
    const touch = {
      active:false, pointerId:null,
      startX:0, startY:0, currentX:0, currentY:0,
      startedAt:0, dragged:false
    };

    /*
      CHAPTER 5 ARTWORK

      Linux paths are case-sensitive. The user's actual folder is:
      assets/Players/chapter5/
    */
    function loadImage(path) {
      const image = new Image();
      image.src = path;
      return image;
    }

    const chapter5Art = {
      background: loadImage(
        "assets/Players/chapter5/chapter5-background.png"
      ),

      bill: loadImage(
        "assets/Players/chapter5/bill-pokemon.png"
      ),

      buildings: {
        bar: loadImage(
          "assets/Players/chapter5/bar.png"
        ),

        beerhaus: loadImage(
          "assets/Players/chapter5/beerhaus.png"
        ),

        pool: loadImage(
          "assets/Players/chapter5/pool-hall.png"
        ),

        liquor: loadImage(
          "assets/Players/chapter5/liquor-store.png"
        ),

        rock: loadImage(
          "assets/Players/chapter5/rock.png"
        ),

        tavern: loadImage(
          "assets/Players/chapter5/tavern.png"
        )
      }
    };

    const player = {
      x:184,
      y:420,

      /*
        Logical collision size. The artwork is drawn larger than
        this so Bill is easy to see without becoming hard to steer.
      */
      width:24,
      height:32,

      speed:150,
      velocityX:0,
      velocityY:0,
      acceleration:8.5,
      friction:7.5,
      facing:"down",
      step:0,
      stepClock:0
    };

    const traits = ["ACCEPTANCE","EMPATHY","COMPASSION","HONESTY"];

    /*
      IMAGE-BASED TOWN MAP

      x/y/width/height control where the PNG is drawn.
      collisionInset keeps Bill from catching on decorative edges.
      doorX/doorY are the exact talking positions on the fixed map.
    */
    const buildings = [
      {
        id:"bar",
        name:"BAR",
        speaker:"BARTENDER",
        image:chapter5Art.buildings.bar,

        x:34,
        y:66,
        width:158,
        height:150,

        collisionInset:{
          left:19,
          right:19,
          top:21,
          bottom:25
        },

        doorX:111,
        doorY:196,

        replies:[
          "BUDDY...\nI'M THE BARTENDER.",
          "YOU BUYING\nOR PREACHING?",
          "YOU'RE BLOCKING\nTHE DART BOARD.",
          "I JUST POURED\nMY FIRST ONE.",
          "WHO LET\nTHIS GUY IN?"
        ]
      },

      {
        id:"beerhaus",
        name:"THE BEER HAUS",
        speaker:"BEER HAUS REGULAR",
        image:chapter5Art.buildings.beerhaus,

        x:261,
        y:60,
        width:118,
        height:134,

        collisionInset:{
          left:15,
          right:15,
          top:22,
          bottom:23
        },

        doorX:320,
        doorY:178,

        replies:[
          "I'M JUST HERE\nFOR THE PRETZELS.",
          "ONE MORE STEIN,\nTHEN I'LL LISTEN.",
          "THIS IS MY\nQUIET NIGHT.",
          "I'M NOT DRUNK.\nI'M FESTIVE.",
          "ASK THE GUY\nWITH THE TUBA."
        ]
      },

      {
        id:"pool",
        name:"POOL HALL",
        speaker:"POOL PLAYER",
        image:chapter5Art.buildings.pool,

        x:42,
        y:286,
        width:125,
        height:119,

        collisionInset:{
          left:15,
          right:15,
          top:18,
          bottom:20
        },

        doorX:104,
        doorY:389,

        replies:[
          "RACK 'EM.\nDON'T PREACH.",
          "YOU'RE IN\nMY SHOT.",
          "I CAN QUIT.\nI JUST DON'T\nWANT TO.",
          "ASK ME AGAIN\nMONDAY.",
          "EVERYBODY\nDRINKS."
        ]
      },

      {
        id:"liquor",
        name:"LIQUOR STORE",
        speaker:"STORE CLERK",
        image:chapter5Art.buildings.liquor,

        x:226,
        y:238,
        width:158,
        height:172,

        collisionInset:{
          left:18,
          right:18,
          top:23,
          bottom:25
        },

        doorX:304,
        doorY:391,

        replies:[
          "THIS IS A\nLIQUOR STORE.",
          "NEXT CUSTOMER!",
          "YOU BUYING\nANYTHING?",
          "CHEAP BOOZE.\nEXPENSIVE ADVICE.",
          "WRONG PLACE,\nPAL."
        ]
      },

      {
        id:"rock",
        name:"ROCK CLUB",
        speaker:"ROCK CLUB PATRON",
        image:chapter5Art.buildings.rock,

        x:24,
        y:483,
        width:179,
        height:174,

        collisionInset:{
          left:20,
          right:20,
          top:23,
          bottom:25
        },

        doorX:113,
        doorY:637,

        replies:[
          "CAN'T HEAR YOU!",
          "THE BAND'S\nABOUT TO START.",
          "I'M WITH\nTHE DRUMMER.",
          "SOBER?\nAT A ROCK SHOW?",
          "COME BACK AFTER\nTHE ENCORE."
        ]
      },

      {
        id:"tavern",
        name:"TAVERN",
        speaker:"TAVERN PATRON",
        image:chapter5Art.buildings.tavern,

        x:258,
        y:564,
        width:125,
        height:137,

        collisionInset:{
          left:15,
          right:15,
          top:20,
          bottom:23
        },

        doorX:320,
        doorY:684,

        replies:[
          "I DON'T HAVE A\nDRINKING PROBLEM.",
          "I HAVE A\nBROTHER-IN-LAW\nPROBLEM.",
          "I'LL QUIT\nTOMORROW.",
          "BEAT IT!",
          "I'M NOT READY."
        ]
      }
    ];

    let active = false;
    let phase = "intro";
    let previousNow = 0;
    let remainingMs = DURATION_MS;
    let nearbyBuilding = null;
    let dialogue = null;
    let attempts = 0;
    let hearts = 3;
    let litPersonIndex = -1;
    let litPersonUntil = 0;
    let resultStage = 0;
    let resultStageAt = 0;

    /*
      After a conversation, that doorway temporarily releases Bill.
      It remains ignored until he has moved a comfortable distance away.
    */
    let releasedDoorId = null;

    const learned = {
      ACCEPTANCE:0,
      EMPATHY:0,
      COMPASSION:0,
      HONESTY:0
    };

    function safeClick() {
      try { playClickFeedback?.(); } catch (_error) {}
    }

    function safePickup(strength=2) {
      try { playPickupFeedback?.(strength); } catch (_error) {}
    }

    function mapBottom() {
      /*
        Keep Bill above the permanent status and experience strips.
        Dialogue appears over the map only while movement is paused.
      */
      return (
        getHeight() -
        STATUS_HEIGHT -
        EXPERIENCE_HEIGHT -
        6
      );
    }

    function reset(now=performance.now()) {
      ctx.imageSmoothingEnabled = false;

      active = true;
      phase = "intro";
      previousNow = now;
      remainingMs = DURATION_MS;
      nearbyBuilding = null;
      dialogue = null;
      attempts = 0;
      hearts = 3;
      litPersonIndex = -1;
      litPersonUntil = 0;
      resultStage = 0;
      resultStageAt = 0;
      releasedDoorId = null;

      for (const trait of traits) learned[trait] = 0;

      player.x = getWidth()/2 - player.width/2;
      player.y = mapBottom() - player.height - 18;
      player.velocityX = 0;
      player.velocityY = 0;
      player.facing = "down";
      player.step = 0;
      player.stepClock = 0;

      touch.active = false;
      touch.pointerId = null;
      touch.dragged = false;
    }

    function doorRect(building) {
      return {
        x:building.doorX - 14,
        y:building.doorY - 11,
        width:28,
        height:22
      };
    }

    function buildingRect(building) {
      const inset = building.collisionInset;

      return {
        x:
          building.x +
          inset.left,

        y:
          building.y +
          inset.top,

        width:
          building.width -
          inset.left -
          inset.right,

        height:
          building.height -
          inset.top -
          inset.bottom
      };
    }

    function playerRectAt(x=player.x,y=player.y) {
      return {
        x:x+5, y:y+10,
        width:player.width-10,
        height:player.height-11
      };
    }

    function overlaps(a,b) {
      return (
        a.x < b.x+b.width &&
        a.x+a.width > b.x &&
        a.y < b.y+b.height &&
        a.y+a.height > b.y
      );
    }

    function blocked(x,y) {
      const test = playerRectAt(x,y);

      for (const building of buildings) {
        if (overlaps(test,buildingRect(building))) return true;
      }

      return false;
    }

    function playerCenter() {
      return {
        x:player.x + player.width/2,
        y:player.y + player.height/2
      };
    }

    function doorwayStandPoint(building) {
      const door = doorRect(building);

      return {
        x:
          door.x +
          door.width / 2 -
          player.width / 2,

        y:
          door.y +
          door.height +
          7
      };
    }

    function nearestDoorMagnet() {
      const center = playerCenter();
      let best = null;
      let bestDistance = Infinity;

      /*
        Once Bill walks far enough away from the last doorway,
        that doorway becomes magnetic again.
      */
      if (releasedDoorId) {
        const releasedBuilding = buildings.find(
          (building) => building.id === releasedDoorId
        );

        if (releasedBuilding) {
          const releasedStand = doorwayStandPoint(releasedBuilding);
          const releasedDistance = Math.hypot(
            center.x - (releasedStand.x + player.width / 2),
            center.y - (releasedStand.y + player.height / 2)
          );

          if (releasedDistance >= DOOR_RELEASE_DISTANCE) {
            releasedDoorId = null;
          }
        } else {
          releasedDoorId = null;
        }
      }

      for (const building of buildings) {
        if (building.id === releasedDoorId) {
          continue;
        }

        const stand = doorwayStandPoint(building);
        const standCenterX = stand.x + player.width / 2;
        const standCenterY = stand.y + player.height / 2;

        const distance = Math.hypot(
          center.x - standCenterX,
          center.y - standCenterY
        );

        if (
          distance <= DOOR_MAGNET_RANGE &&
          distance < bestDistance
        ) {
          best = {
            building,
            stand,
            distance
          };

          bestDistance = distance;
        }
      }

      return best;
    }

    function applyDoorMagnet(dt) {
      if (dialogue) {
        return;
      }

      const magnet = nearestDoorMagnet();

      if (!magnet) {
        return;
      }

      const dx = magnet.stand.x - player.x;
      const dy = magnet.stand.y - player.y;

      /*
        Very close: snap Bill neatly to the center of the doorway
        and stop his drift.
      */
      if (magnet.distance <= DOOR_SNAP_RANGE) {
        player.x = magnet.stand.x;
        player.y = magnet.stand.y;
        player.velocityX = 0;
        player.velocityY = 0;
        player.facing = "up";
        return;
      }

      /*
        Nearby: gently pull him toward the talking position.
        This is strong enough to help but weak enough that the
        player still feels in control.
      */
      const pull = Math.min(
        1,
        DOOR_MAGNET_STRENGTH * dt
      );

      const nextX = player.x + dx * pull;
      const nextY = player.y + dy * pull;

      if (!blocked(nextX, player.y)) {
        player.x = nextX;
      }

      if (!blocked(player.x, nextY)) {
        player.y = nextY;
      }

      player.facing = "up";
    }

    function findNearbyBuilding() {
      const center = playerCenter();
      let best = null;
      let bestDistance = Infinity;

      for (const building of buildings) {
        const stand = doorwayStandPoint(building);
        const standCenterX = stand.x + player.width / 2;
        const standCenterY = stand.y + player.height / 2;

        const distance = Math.hypot(
          center.x - standCenterX,
          center.y - standCenterY
        );

        if (
          distance < 46 &&
          distance < bestDistance
        ) {
          best = building;
          bestDistance = distance;
        }
      }

      return best;
    }

    function chooseTrait() {
      const minimum = Math.min(...traits.map(t=>learned[t]));
      const choices = traits.filter(t=>learned[t]===minimum);
      return choices[Math.floor(Math.random()*choices.length)];
    }

    function beginDialogue(building) {
      if (!building || dialogue) return false;

      dialogue = {
        building,
        page:0,
        reply:building.replies[
          Math.floor(Math.random()*building.replies.length)
        ],
        trait:chooseTrait()
      };

      safeClick();
      return true;
    }

    function finishDialogue(now) {
      const building = dialogue.building;
      const trait = dialogue.trait;

      /*
        Let go of this doorway immediately after the exchange.
        It will not attract Bill again until he walks away.
      */
      releasedDoorId = building.id;

      attempts += 1;
      hearts = Math.min(8,hearts+1);
      learned[trait] = Math.min(5,learned[trait]+1);

      litPersonIndex = attempts % 6;
      litPersonUntil = now + 650;

      const door = doorRect(building);
      const p = playerCenter();
      let dx = p.x - (door.x+door.width/2);
      let dy = p.y - (door.y+door.height/2);
      const length = Math.hypot(dx,dy) || 1;

      dx /= length;
      dy /= length;

      let nextX = player.x + dx*48;
      let nextY = player.y + dy*48;

      if (blocked(nextX,nextY)) {
        nextX = player.x;
        nextY = player.y + 34;
      }

      player.x = Math.max(4,Math.min(getWidth()-player.width-4,nextX));
      player.y = Math.max(
        TITLE_HEIGHT+4,
        Math.min(mapBottom()-player.height-4,nextY)
      );

      dialogue = null;
      safePickup(2);
    }

    function advanceDialogue(now) {
      if (!dialogue) return false;
      safeClick();

      if (dialogue.page < 2) dialogue.page += 1;
      else finishDialogue(now);

      return true;
    }

    function movePlayer(moveX,moveY,dt) {
      const hasInput = Boolean(moveX || moveY);

      if (hasInput) {
        const length = Math.hypot(moveX,moveY) || 1;
        moveX /= length;
        moveY /= length;

        if (Math.abs(moveX)>Math.abs(moveY)) {
          player.facing = moveX<0 ? "left" : "right";
        } else {
          player.facing = moveY<0 ? "up" : "down";
        }

        const targetVelocityX = moveX*player.speed;
        const targetVelocityY = moveY*player.speed;
        const accelerationAmount = Math.min(1,player.acceleration*dt);

        player.velocityX +=
          (targetVelocityX-player.velocityX)*accelerationAmount;

        player.velocityY +=
          (targetVelocityY-player.velocityY)*accelerationAmount;
      } else {
        const frictionAmount = Math.max(0,1-player.friction*dt);
        player.velocityX *= frictionAmount;
        player.velocityY *= frictionAmount;

        if (Math.abs(player.velocityX)<1) player.velocityX = 0;
        if (Math.abs(player.velocityY)<1) player.velocityY = 0;
      }

      const nextX = player.x + player.velocityX*dt;
      const nextY = player.y + player.velocityY*dt;

      if (!blocked(nextX,player.y)) {
        player.x = nextX;
      } else {
        player.velocityX = 0;
      }

      if (!blocked(player.x,nextY)) {
        player.y = nextY;
      } else {
        player.velocityY = 0;
      }

      player.x = Math.max(4,Math.min(getWidth()-player.width-4,player.x));
      player.y = Math.max(
        TITLE_HEIGHT+4,
        Math.min(mapBottom()-player.height-4,player.y)
      );

      const speedNow = Math.hypot(player.velocityX,player.velocityY);

      if (speedNow>8) {
        player.stepClock += dt*(5+speedNow/35);
        player.step = Math.floor(player.stepClock)%2;
      } else {
        player.stepClock = 0;
        player.step = 0;
      }
    }

    function update(now) {
      const dt = Math.min(0.05,Math.max(0,(now-previousNow)/1000));
      previousNow = now;

      if (phase==="intro") return;

      if (phase==="results") {
        if (!resultStageAt) resultStageAt = now;

        if (resultStage===0 && now-resultStageAt>=1000) {
          resultStage = 1;
          resultStageAt = now;
        } else if (resultStage===1 && now-resultStageAt>=1300) {
          resultStage = 2;
          resultStageAt = now;
        }

        return;
      }

      if (phase!=="playing") return;

      if (!dialogue) {
        remainingMs = Math.max(0,remainingMs-dt*1000);
      }

      if (remainingMs<=0) {
        phase = "results";
        resultStage = 0;
        resultStageAt = now;
        dialogue = null;
        touch.active = false;
        return;
      }

      if (dialogue) {
        nearbyBuilding = null;
        return;
      }

      let moveX = 0;
      let moveY = 0;

      if (keys.left) moveX -= 1;
      if (keys.right) moveX += 1;
      if (keys.up) moveY -= 1;
      if (keys.down) moveY += 1;

      if (touch.active) {
        const dx = touch.currentX-touch.startX;
        const dy = touch.currentY-touch.startY;
        const distance = Math.hypot(dx,dy);

        if (distance>6) {
          const power = Math.min(1,(distance-6)/34);
          moveX += (dx/distance)*power;
          moveY += (dy/distance)*power;
        }
      }

      movePlayer(moveX,moveY,dt);
      applyDoorMagnet(dt);
      nearbyBuilding = findNearbyBuilding();

      if (now>=litPersonUntil) litPersonIndex = -1;
    }

    function drawBackground() {
      const width = getWidth();
      const height = getHeight();
      const image = chapter5Art.background;

      ctx.fillStyle = "#728f47";
      ctx.fillRect(0,0,width,height);

      if (
        image.complete &&
        image.naturalWidth > 0
      ) {
        ctx.save();
        ctx.imageSmoothingEnabled = true;

        ctx.drawImage(
          image,
          0,
          0,
          width,
          height
        );

        ctx.restore();
      }
    }

    function drawBuildingImage(building) {
      const image = building.image;

      if (
        !image.complete ||
        image.naturalWidth <= 0
      ) {
        /*
          Clear fallback only while an image is still loading.
        */
        ctx.fillStyle = "rgba(54,40,29,.85)";
        ctx.fillRect(
          building.x,
          building.y,
          building.width,
          building.height
        );

        ctx.fillStyle = "#fff5cf";
        ctx.textAlign = "center";
        ctx.font = "bold 10px monospace";
        ctx.fillText(
          building.name,
          building.x + building.width/2,
          building.y + building.height/2
        );

        return;
      }

      ctx.save();
      ctx.imageSmoothingEnabled = true;

      ctx.drawImage(
        image,
        building.x,
        building.y,
        building.width,
        building.height
      );

      ctx.restore();
    }

    function drawEasterEggs(now) {
      /*
        Tiny code-drawn details only—no extra art files required.
      */

      // Stray cat by the liquor store.
      const catBlink =
        Math.floor(now/650)%5===0;

      ctx.fillStyle = "#9f552d";
      ctx.fillRect(371,420,7,5);
      ctx.fillRect(368,417,3,3);
      ctx.fillRect(375,417,3,3);
      ctx.fillRect(377,423,5,2);

      if (!catBlink) {
        ctx.fillStyle = "#f3d95c";
        ctx.fillRect(370,420,1,1);
        ctx.fillRect(375,420,1,1);
      }

      // One tiny hidden Misfit peeking near the Beer Haus.
      ctx.fillStyle = "#47316c";
      ctx.beginPath();
      ctx.arc(372,210,4,0,Math.PI*2);
      ctx.fill();

      ctx.fillStyle = "#fff";
      ctx.fillRect(370,209,1,1);
      ctx.fillRect(373,209,1,1);
    }

    function drawBillFallback(x,y,bob) {
      ctx.fillStyle = "#7b2d24";
      ctx.fillRect(x+4,y+2+bob,14,6);
      ctx.fillRect(x+2,y+6+bob,18,4);

      ctx.fillStyle = "#e7b27e";
      ctx.fillRect(x+6,y+9+bob,10,8);

      ctx.fillStyle = "#5a341f";
      ctx.fillRect(x+4,y+16+bob,14,10);

      ctx.fillStyle = "#271a15";
      ctx.fillRect(x+4,y+25+bob,5,4);
      ctx.fillRect(x+14,y+25+bob,5,4);
    }

    function drawBill() {
      const x = Math.round(player.x);
      const y = Math.round(player.y);
      const moving =
        Math.hypot(
          player.velocityX,
          player.velocityY
        ) > 8;

      const bob = moving && player.step ? 1 : 0;

      /*
        Draw the shadow separately so the PNG itself can stay
        completely transparent.
      */
      ctx.save();
      ctx.globalAlpha = 0.25;
      ctx.fillStyle = "#162016";
      ctx.beginPath();
      ctx.ellipse(
        x + player.width / 2,
        y + player.height - 1,
        13,
        5,
        0,
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.restore();

      const billImage = chapter5Art.bill;

      if (
        billImage.complete &&
        billImage.naturalWidth > 0
      ) {
        /*
          The generated artwork is larger and more detailed than a
          traditional Game Boy sprite. Draw it at a modern readable
          size while keeping the old-school pixel look.

          A single front-facing image is being used for now. The
          movement bob gives it life until directional frames are
          created later.
        */
        /*
          Preserve the PNG's natural aspect ratio and make Bill
          about twenty percent larger than the previous version.
        */
        const drawHeight = 65;
        const aspect =
          billImage.naturalWidth /
          billImage.naturalHeight;

        const drawWidth =
          drawHeight *
          aspect;

        const drawX =
          x +
          player.width/2 -
          drawWidth/2;

        const drawY =
          y +
          player.height -
          drawHeight +
          bob;

        ctx.save();
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(
          billImage,
          drawX,
          drawY,
          drawWidth,
          drawHeight
        );
        ctx.restore();
      } else {
        drawBillFallback(x,y,bob);
      }
    }

    function drawTitle(now) {
      const width = getWidth();
      const sparkle =
        Math.floor(now/400)%2===0;

      ctx.fillStyle = "rgba(18,27,21,.94)";
      ctx.fillRect(
        0,
        0,
        width,
        TITLE_HEIGHT
      );

      ctx.fillStyle = "#f8f1c8";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = "bold 17px monospace";
      ctx.fillText(
        "SOBER 'EM ALL!",
        width/2,
        TITLE_HEIGHT/2
      );

      if (sparkle) {
        ctx.fillStyle = "#f2df64";
        ctx.fillText(
          "✦",
          width/2 - 94,
          TITLE_HEIGHT/2
        );

        ctx.fillText(
          "✦",
          width/2 + 94,
          TITLE_HEIGHT/2
        );
      }
    }

    function peopleSoberTeaser(now) {
      if (!dialogue) {
        return "0";
      }

      /*
        During the rejection page, briefly tease the player
        with a half-success before dropping back to zero.
      */
      if (
        dialogue.page === 1 &&
        Math.floor(now/280)%2===0
      ) {
        return "½ ...?";
      }

      return "0";
    }

    function drawStatusHud(now) {
      const width = getWidth();
      const height = getHeight();

      const y =
        height -
        EXPERIENCE_HEIGHT -
        STATUS_HEIGHT;

      ctx.fillStyle = "rgba(17,24,20,.96)";
      ctx.fillRect(
        0,
        y,
        width,
        STATUS_HEIGHT
      );

      ctx.strokeStyle = "#c7b681";
      ctx.lineWidth = 2;
      ctx.strokeRect(
        3,
        y+3,
        width-6,
        STATUS_HEIGHT-6
      );

      ctx.textBaseline = "middle";

      ctx.fillStyle = "#f8f1d2";
      ctx.textAlign = "left";
      ctx.font = "bold 12px monospace";
      ctx.fillText(
        "PEOPLE SOBER:",
        14,
        y+19
      );

      ctx.fillStyle = "#f4d76b";
      ctx.font = "bold 17px monospace";
      ctx.fillText(
        peopleSoberTeaser(now),
        124,
        y+19
      );

      ctx.fillStyle = "#f8f1d2";
      ctx.font = "bold 12px monospace";
      ctx.fillText(
        "YOUR SOBRIETY:",
        14,
        y+42
      );

      ctx.fillStyle = "#e95b5b";
      ctx.font = "18px serif";
      ctx.fillText(
        "♥".repeat(
          Math.min(8,hearts)
        ),
        130,
        y+42
      );

      ctx.fillStyle = "#f8f1d2";
      ctx.textAlign = "right";
      ctx.font = "bold 11px monospace";
      ctx.fillText(
        `TIME ${Math.ceil(remainingMs/1000)}`,
        width-13,
        y+30
      );
    }

    function drawExperienceStrip() {
      const width = getWidth();
      const height = getHeight();
      const y =
        height -
        EXPERIENCE_HEIGHT;

      ctx.fillStyle = "#2b342d";
      ctx.fillRect(
        0,
        y,
        width,
        EXPERIENCE_HEIGHT
      );

      ctx.fillStyle = "#dbd2a5";
      ctx.textBaseline = "middle";
      ctx.font = "bold 9px monospace";

      ctx.textAlign = "left";
      ctx.fillText(
        `ACCEPTANCE +${learned.ACCEPTANCE}`,
        8,
        y+12
      );

      ctx.fillText(
        `COMPASSION +${learned.COMPASSION}`,
        8,
        y+28
      );

      ctx.textAlign = "right";
      ctx.fillText(
        `EMPATHY +${learned.EMPATHY}`,
        width-8,
        y+12
      );

      ctx.fillText(
        `HONESTY +${learned.HONESTY}`,
        width-8,
        y+28
      );
    }

    function drawHint(now) {
      if (!nearbyBuilding || dialogue) return;

      const door = doorRect(nearbyBuilding);
      const width = 82;
      const x = Math.max(
        4,
        Math.min(getWidth()-width-4,door.x+door.width/2-width/2)
      );
      const y = door.y+door.height+5;

      ctx.fillStyle =
        Math.floor(now/350)%2===0 ? "#fff8c7" : "#e8db9f";
      ctx.fillRect(x,y,width,21);
      ctx.strokeStyle = "#1e1a15";
      ctx.lineWidth = 2;
      ctx.strokeRect(x,y,width,21);

      ctx.fillStyle = "#171411";
      ctx.font = "bold 10px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("TAP TO TALK",x+width/2,y+11);
    }

    function roundedRectPath(x,y,width,height,radius) {
      const r = Math.min(radius,width/2,height/2);

      ctx.beginPath();
      ctx.moveTo(x+r,y);
      ctx.lineTo(x+width-r,y);
      ctx.quadraticCurveTo(x+width,y,x+width,y+r);
      ctx.lineTo(x+width,y+height-r);
      ctx.quadraticCurveTo(x+width,y+height,x+width-r,y+height);
      ctx.lineTo(x+r,y+height);
      ctx.quadraticCurveTo(x,y+height,x,y+height-r);
      ctx.lineTo(x,y+r);
      ctx.quadraticCurveTo(x,y,x+r,y);
      ctx.closePath();
    }

    function dialoguePage() {
      if (dialogue.page===0) {
        return {
          speaker:"BILL",
          text:"I FOUND THE SOLUTION\nTO YOUR ALCOHOLISM!"
        };
      }

      if (dialogue.page===1) {
        return {
          speaker:dialogue.building.speaker,
          text:dialogue.reply
        };
      }

      return {
        speaker:"LEARNED",
        text:`${dialogue.trait} +1`
      };
    }

    function drawDialogue(now) {
      if (!dialogue) return;

      const width = getWidth();
      const height = getHeight();
      const boxX = 8;
      const boxHeight = DIALOGUE_HEIGHT;
      const boxY =
        height -
        EXPERIENCE_HEIGHT -
        STATUS_HEIGHT -
        boxHeight -
        6;

      const boxWidth = width-16;
      const page = dialoguePage();

      ctx.fillStyle = "rgba(0,0,0,.35)";
      ctx.fillRect(0,0,width,height);

      /*
        Rounded, double-bordered handheld-RPG dialogue panel.
      */
      ctx.save();

      ctx.shadowColor = "rgba(0,0,0,.45)";
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 4;
      ctx.shadowOffsetY = 5;

      roundedRectPath(boxX,boxY,boxWidth,boxHeight,15);
      ctx.fillStyle = "#111111";
      ctx.fill();

      ctx.shadowColor = "transparent";
      roundedRectPath(boxX+4,boxY+4,boxWidth-8,boxHeight-8,12);
      ctx.fillStyle = "#f8f4dc";
      ctx.fill();

      roundedRectPath(boxX+10,boxY+10,boxWidth-20,boxHeight-20,8);
      ctx.strokeStyle = "#77705f";
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.restore();

      ctx.fillStyle = "#111";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.font = "bold 15px monospace";
      ctx.fillText(page.speaker,boxX+24,boxY+22);

      ctx.font = "bold 18px monospace";
      page.text.split("\n").slice(0,4).forEach((line,index)=>{
        ctx.fillText(line,boxX+24,boxY+58+index*25);
      });

      if (Math.floor(now/380)%2===0) {
        ctx.beginPath();
        ctx.moveTo(boxX+boxWidth-32,boxY+boxHeight-29);
        ctx.lineTo(boxX+boxWidth-18,boxY+boxHeight-29);
        ctx.lineTo(boxX+boxWidth-25,boxY+boxHeight-19);
        ctx.closePath();
        ctx.fill();
      }
    }

    function drawTouchStick() {
      if (!touch.active || dialogue) return;

      const dx = touch.currentX-touch.startX;
      const dy = touch.currentY-touch.startY;
      const distance = Math.hypot(dx,dy);
      const radius = 35;
      const scale = distance>radius ? radius/distance : 1;

      ctx.save();
      ctx.globalAlpha = .45;
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(touch.startX,touch.startY,radius,0,Math.PI*2);
      ctx.stroke();

      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(
        touch.startX+dx*scale,
        touch.startY+dy*scale,
        12,
        0,
        Math.PI*2
      );
      ctx.fill();
      ctx.restore();
    }

    function drawWorld(now) {
      drawBackground();

      buildings.forEach(
        drawBuildingImage
      );

      drawEasterEggs(now);
      drawBill();
      drawHint(now);
      drawTouchStick();

      drawTitle(now);
      drawStatusHud(now);
      drawExperienceStrip();
      drawDialogue(now);
    }

    function drawIntro(now) {
      const width = getWidth();
      const height = getHeight();

      ctx.fillStyle = "#1c2a20";
      ctx.fillRect(0,0,width,height);

      ctx.fillStyle =
        Math.floor(now/180)%2===0 ? "#f3e56e" : "#fffdf0";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = "bold 23px monospace";
      ctx.fillText("SOBER 'EM ALL!",width/2,height*.16);

      ctx.fillStyle = "#fffdf0";
      ctx.font = "bold 17px monospace";
      ctx.fillText("MOVE AROUND THE TOWN",width/2,height*.36);
      ctx.fillText("TRY TO SOBER EVERYONE UP",width/2,height*.42);

      ctx.font = "14px monospace";
      ctx.fillText("PRESS, SLIDE, AND STEER",width/2,height*.56);
      ctx.fillText("TAP NEAR A DOOR TO TALK",width/2,height*.61);

      if (Math.floor(now/500)%2===0) {
        ctx.fillStyle = "#8ff079";
        ctx.font = "bold 18px monospace";
        ctx.fillText("► TAP TO START ◄",width/2,height*.80);
      }
    }

    function drawResults(now) {
      const width = getWidth();
      const height = getHeight();

      ctx.fillStyle = "#101713";
      ctx.fillRect(0,0,width,height);

      ctx.fillStyle = "#fffdf0";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = "bold 24px monospace";
      ctx.fillText("RESULTS",width/2,95);

      ctx.font = "bold 18px monospace";
      ctx.fillText("PEOPLE SOBER",width/2,176);

      ctx.fillStyle = "#f4d75a";
      ctx.font = "bold 40px monospace";
      ctx.fillText("0",width/2,225);

      if (resultStage>=1) {
        ctx.fillStyle = "#8ae875";
        ctx.font = "bold 18px monospace";
        ctx.fillText("OUR FRIEND STAYED SOBER",width/2,305);

        ctx.fillStyle = "#e95b5b";
        ctx.font = "31px serif";
        ctx.fillText("♥ ♥ ♥ ♥ ♥",width/2,355);
      }

      if (resultStage>=2) {
        traits.forEach((trait,index)=>{
          const y = 440+index*31;
          ctx.fillStyle = "#f4f0d8";
          ctx.textAlign = "left";
          ctx.font = "bold 11px monospace";
          ctx.fillText(trait,35,y);

          ctx.fillStyle = "#344138";
          ctx.fillRect(148,y-8,168,11);
          ctx.fillStyle = "#85dd6e";
          ctx.fillRect(148,y-8,168*(learned[trait]/5),11);
        });

        ctx.fillStyle = "#fffdf0";
        ctx.textAlign = "center";
        ctx.font = "bold 13px monospace";
        ctx.fillText("HELPING OTHERS",width/2,602);
        ctx.fillText("HELPED HIM STAY SOBER.",width/2,628);

        if (Math.floor(now/500)%2===0) {
          ctx.fillStyle = "#f3e56e";
          ctx.font = "bold 14px monospace";
          ctx.fillText("TAP TO CONTINUE",width/2,height-62);
        }
      }
    }

    function draw(now) {
      if (phase==="intro") return drawIntro(now);
      if (phase==="results") return drawResults(now);
      drawWorld(now);
    }

    function tap() {
      const now = performance.now();
      if (!active) return false;

      if (phase==="intro") {
        phase = "playing";
        previousNow = now;
        safeClick();
        return true;
      }

      if (phase==="results") {
        if (resultStage<2) return true;

        active = false;
        safeClick();
        try { setGameState?.("finished"); } catch (_error) {}
        return true;
      }

      if (phase!=="playing") return false;
      if (dialogue) return advanceDialogue(now);

      nearbyBuilding = findNearbyBuilding();
      if (nearbyBuilding) return beginDialogue(nearbyBuilding);

      return false;
    }

    function canvasPoint(event) {
      const rect = ctx.canvas.getBoundingClientRect();
      return {
        x:(event.clientX-rect.left)*(getWidth()/rect.width),
        y:(event.clientY-rect.top)*(getHeight()/rect.height)
      };
    }

    function pointerDown(event) {
      if (!active) return;

      event.stopImmediatePropagation();
      event.preventDefault();

      const point = canvasPoint(event);
      touch.active = true;
      touch.pointerId = event.pointerId;
      touch.startX = point.x;
      touch.startY = point.y;
      touch.currentX = point.x;
      touch.currentY = point.y;
      touch.startedAt = performance.now();
      touch.dragged = false;

      try { ctx.canvas.setPointerCapture(event.pointerId); } catch (_error) {}
    }

    function pointerMove(event) {
      if (!active || !touch.active || touch.pointerId!==event.pointerId) {
        return;
      }

      event.stopImmediatePropagation();
      event.preventDefault();

      const point = canvasPoint(event);
      touch.currentX = point.x;
      touch.currentY = point.y;

      if (Math.hypot(
        touch.currentX-touch.startX,
        touch.currentY-touch.startY
      )>8) {
        touch.dragged = true;
      }
    }

    function pointerFinish(event) {
      if (!active || !touch.active || touch.pointerId!==event.pointerId) {
        return;
      }

      event.stopImmediatePropagation();
      event.preventDefault();

      const quickTap =
        !touch.dragged &&
        performance.now()-touch.startedAt<420;

      touch.active = false;
      touch.pointerId = null;

      if (quickTap) tap();
    }

    function keyDown(event) {
      if (!active) return;

      if (event.code==="ArrowLeft" || event.code==="KeyA") keys.left=true;
      if (event.code==="ArrowRight" || event.code==="KeyD") keys.right=true;
      if (event.code==="ArrowUp" || event.code==="KeyW") keys.up=true;
      if (event.code==="ArrowDown" || event.code==="KeyS") keys.down=true;

      if (
        event.code==="Space" ||
        event.code==="Enter" ||
        event.code==="KeyE"
      ) {
        event.preventDefault();
        tap();
      }
    }

    function keyUp(event) {
      if (event.code==="ArrowLeft" || event.code==="KeyA") keys.left=false;
      if (event.code==="ArrowRight" || event.code==="KeyD") keys.right=false;
      if (event.code==="ArrowUp" || event.code==="KeyW") keys.up=false;
      if (event.code==="ArrowDown" || event.code==="KeyS") keys.down=false;
    }

    window.addEventListener("keydown",keyDown);
    window.addEventListener("keyup",keyUp);

    ctx.canvas.style.touchAction = "none";
    ctx.canvas.addEventListener("pointerdown",pointerDown,{passive:false,capture:true});
    ctx.canvas.addEventListener("pointermove",pointerMove,{passive:false,capture:true});
    ctx.canvas.addEventListener("pointerup",pointerFinish,{passive:false,capture:true});
    ctx.canvas.addEventListener("pointercancel",pointerFinish,{passive:false,capture:true});

    return { reset, update, tap, draw };
  }

  window.RecoveryChapter5Gameplay = {
    createChapterGame:createChapter5Game,
    createChapter5Game
  };
})();