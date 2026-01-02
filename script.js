// Firebase 配置由 firebase-config.js 提供
// Firebase configuration is provided by firebase-config.js

// Firebase Manager
class FirebaseMatListener {
  constructor(gameInstance) {
    this.game = gameInstance;
    this.db = null;
    this.initialized = false;
    this.listener = null;
  }

  async init() {
    try {
      if (typeof firebase === "undefined") {
        console.warn("Firebase SDK not loaded");
        this.updateFirebaseStatus(false, "Firebase SDK not loaded");
        return false;
      }

      if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
      }

      this.db = firebase.database();
      this.initialized = true;
      console.log("Firebase initialized");
      this.updateFirebaseStatus(true, "Mat Control: Connected");
      return true;
    } catch (error) {
      console.error("Firebase initialization failed:", error);
      this.updateFirebaseStatus(false, "Mat Control: Connection Failed");
      return false;
    }
  }

  updateFirebaseStatus(connected, message) {
    const statusElement = document.getElementById("firebaseStatus");
    const indicatorElement = document.getElementById("firebaseIndicator");
    const textElement = statusElement
      ? statusElement.querySelector(".firebase-text")
      : null;

    if (statusElement && indicatorElement && textElement) {
      if (connected) {
        statusElement.classList.add("connected");
        indicatorElement.textContent = "🟢";
        textElement.textContent = message || "Mat Control: Connected";
      } else {
        statusElement.classList.remove("connected");
        indicatorElement.textContent = "🔴";
        textElement.textContent = message || "Mat Control: Disconnected";
      }
    }

    const startIndicatorElement = document.getElementById(
      "startFirebaseIndicator"
    );
    const startTextElement = document.getElementById("startFirebaseText");

    if (startIndicatorElement && startTextElement) {
      if (connected) {
        startIndicatorElement.textContent = "🟢";
        startTextElement.textContent = message || "Mat Control Ready";
      } else {
        startIndicatorElement.textContent = "🔴";
        startTextElement.textContent = message || "Mat Control Disconnected";
      }
    }
  }

  startListening() {
    if (!this.initialized || !this.game.gameState.isPlaying) return;

    try {
      const matPressesRef = this.db.ref("mat_presses");

      this.listener = matPressesRef
        .orderByChild("groupId")
        .equalTo(1)
        .limitToLast(1)
        .on("child_added", (snapshot) => {
          const data = snapshot.val();

          if (data && data.matNumber >= 1 && data.matNumber <= 9) {
            const cellIndex = data.matNumber - 1;
            if (cellIndex <= 3) {
              this.game.moveMonkTo(cellIndex);
              this.updateFirebaseStatus(true, "Mat Control: Active");
            }
          }
        });

      console.log("Started listening for mat presses");
      this.updateFirebaseStatus(true, "Mat Control: Listening");
    } catch (error) {
      console.error("Failed to start listening:", error);
      this.updateFirebaseStatus(false, "Mat Control: Listen Failed");
    }
  }

  stopListening() {
    if (this.listener && this.db) {
      try {
        const matPressesRef = this.db.ref("mat_presses");
        matPressesRef.off("child_added", this.listener);
        this.listener = null;
        console.log("Stopped listening");
        this.updateFirebaseStatus(this.initialized, "Mat Control: Connected");
      } catch (error) {
        console.error("Failed to stop listening:", error);
      }
    }
  }
}

// Game State
class GameState {
  constructor() {
    this.reset();
  }

  reset() {
    this.score = 0;
    this.combo = 1; // CHANGED: Start combo at 1 instead of 0
    this.lives = 3;
    this.timeElapsed = 0;
    this.isPlaying = false;
    this.isPaused = false;
    this.hasShield = false;
    this.gameTimer = null;
    this.powerupTimer = null;
    this.soundEnabled = true;
    this.currentPosition = -1;
  }
}

// Main Game Class
class MonkGame {
  constructor() {
    this.gameState = new GameState();

    // Screens
    this.screens = {
      start: document.getElementById("startScreen"),
      instructions: document.getElementById("instructionsScreen"),
      game: document.getElementById("gameScreen"),
      gameOver: document.getElementById("gameOverScreen"),
      pause: document.getElementById("pauseScreen"),
    };

    // Elements
    this.elements = {
      gameArea: document.getElementById("gameArea"),
      scoreValue: document.getElementById("scoreValue"),
      timeValue: document.getElementById("timeValue"),
      comboValue: document.getElementById("comboValue"),
      finalScore: document.getElementById("finalScore"),
      finalTime: document.getElementById("finalTime"),
      finalCombo: document.getElementById("finalCombo"),
      soundToggle: document.getElementById("soundToggle"),
      hearts: document.querySelectorAll(".heart"),
    };

    this.monkElement = null;
    this.enemies = [];
    this.powerups = [];

    // --- Asset Mapping (Images & Sounds) ---
    this.assets = {
      enemies: [
        { img: "img/hornet-01.png", sfx: "audio/sfx-hornet-01.mp3" },
        { img: "img/poop-01.png", sfx: "audio/sfx-poo-01.mp3" },
        { img: "img/rotten-fruit-01.png", sfx: "audio/sfx-rotten-01.mp3" },
        { img: "img/snale-01.png", sfx: "audio/sfx-snail-01.mp3" },
      ],
      powerups: {
        heart: "img/heart-01.png",
        shield: "img/shield-01.png",
        flowerT: "img/flower-tropical-01.png",
        flowerC: "img/flower-chinese-01.png",
      },
      player: {
        normal: "img/monk-A-01.png",
        shield: "img/monk-A-shield-01.png",
      },
      sfx: {
        bgmMenu: "audio/sfx-music-aether.mp3",
        bgmGame: "audio/sfx-nature-01.wav",
        startBtn: "audio/sfx-bling-02.mp3",
        clickBtn: "audio/sfx-klick-01.mp3",
        powerupSpawn: "audio/sfx-angel-01.mp3",
        powerupCollect: "audio/sfx-bling-03.mp3",
        hit: "audio/sfx-negative-01.mp3",
      },
    };

    this.audioInstances = {};
    this.currentMusic = null;

    this.animationFrameId = null;
    this.firebaseListener = new FirebaseMatListener(this);

    this.init();
  }

  async init() {
    this.preloadAssets();
    this.bindEvents();
    this.playMusic("bgmMenu");
    this.showScreen("start");
    this.updateSoundIcon();

    this.firebaseListener.updateFirebaseStatus(false, "Connecting...");
    await this.firebaseListener.init();
  }

  preloadAssets() {
    const images = [
      this.assets.player.normal,
      this.assets.player.shield,
      "img/floor.png",
      "img/emptyheart-01.png",
      ...this.assets.enemies.map((e) => e.img),
      ...Object.values(this.assets.powerups),
    ];
    images.forEach((src) => {
      const img = new Image();
      img.src = src;
    });

    const loadAudio = (key, src, loop = false) => {
      const audio = new Audio(src);
      audio.loop = loop;
      this.audioInstances[key] = audio;
    };

    loadAudio("bgmMenu", this.assets.sfx.bgmMenu, true);
    loadAudio("bgmGame", this.assets.sfx.bgmGame, true);

    loadAudio("startBtn", this.assets.sfx.startBtn);
    loadAudio("clickBtn", this.assets.sfx.clickBtn);
    loadAudio("powerupSpawn", this.assets.sfx.powerupSpawn);
    loadAudio("powerupCollect", this.assets.sfx.powerupCollect);
    loadAudio("hit", this.assets.sfx.hit);

    this.assets.enemies.forEach((e) => {
      loadAudio(e.sfx, e.sfx);
    });
  }

  bindEvents() {
    const bindBtn = (id, action, sfxKey = "clickBtn") => {
      const btn = document.getElementById(id);
      if (btn) {
        btn.addEventListener("click", () => {
          this.playSound(sfxKey);
          action();
        });
      }
    };

    bindBtn("startButton", () => this.startGame(), "startBtn");
    bindBtn("instructionsButton", () => this.showInstructions());
    bindBtn("backButton", () => this.showScreen("start"));
    bindBtn("pauseButton", () => this.pauseGame());
    bindBtn("resumeButton", () => this.resumeGame());
    bindBtn("restartButton", () => this.restartGame());
    bindBtn("quitButton", () => this.quitGame());
    bindBtn("playAgainButton", () => this.startGame(), "startBtn");
    bindBtn("mainMenuButton", () => this.quitGame());

    if (this.elements.soundToggle) {
      this.elements.soundToggle.addEventListener("click", () =>
        this.toggleSound()
      );
    }

    this.bindGridEvents();

    document.addEventListener("touchmove", (e) => e.preventDefault(), {
      passive: false,
    });
  }

  bindGridEvents() {
    document
      .querySelectorAll(".grid-layer.grid-bottom .grid-cell")
      .forEach((cell) => {
        cell.addEventListener("click", () => {
          if (this.gameState.isPlaying && !this.gameState.isPaused) {
            this.moveMonkTo(parseInt(cell.getAttribute("data-cell")));
          }
        });
      });

    document
      .querySelectorAll(".grid-layer.grid-top .grid-cell")
      .forEach((cell, index) => {
        cell.addEventListener("click", () => {
          if (this.gameState.isPlaying && !this.gameState.isPaused) {
            this.spawnEnemy(index);
          }
        });
      });
  }

  // --- AUDIO SYSTEM ---

  playMusic(key) {
    if (this.currentMusic && this.currentMusic !== this.audioInstances[key]) {
      this.currentMusic.pause();
      this.currentMusic.currentTime = 0;
    }

    this.currentMusic = this.audioInstances[key];

    if (this.gameState.soundEnabled && this.currentMusic) {
      this.currentMusic.play().catch((e) => console.log("Audio blocked:", e));
    }
  }

  playSound(key) {
    if (!this.gameState.soundEnabled) return;
    const audio = this.audioInstances[key];
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch((e) => console.log("SFX blocked:", e));
    }
  }

  toggleSound() {
    this.gameState.soundEnabled = !this.gameState.soundEnabled;
    this.updateSoundIcon();

    if (this.gameState.soundEnabled) {
      if (this.currentMusic) this.currentMusic.play();
    } else {
      if (this.currentMusic) this.currentMusic.pause();
    }
  }

  updateSoundIcon() {
    if (this.elements.soundToggle) {
      this.elements.soundToggle.textContent = this.gameState.soundEnabled
        ? "🔊"
        : "🔇";
    }
  }

  // --- SCREEN LOGIC ---

  showScreen(screenName) {
    Object.values(this.screens).forEach((screen) => {
      if (screen) screen.classList.add("hidden");
    });
    if (this.screens[screenName])
      this.screens[screenName].classList.remove("hidden");

    if (
      screenName === "start" ||
      screenName === "instructions" ||
      screenName === "gameOver"
    ) {
      this.playMusic("bgmMenu");
    } else if (screenName === "game") {
      this.playMusic("bgmGame");
    }
  }

  showInstructions() {
    this.showScreen("instructions");
  }

  // --- GAME LOGIC ---

  startGame() {
    this.gameState.reset();
    this.resetHearts();
    this.showScreen("game");
    this.updateUI();
    this.gameState.isPlaying = true;
    this.gameState.isPaused = false;

    this.clearEntities();
    this.spawnMonk();
    this.startGameTimer();
    this.startPowerupSpawner();

    this.lastTime = performance.now();
    this.gameLoop();

    this.firebaseListener.startListening();
  }

  quitGame() {
    this.stopTimers();
    this.clearEntities();
    this.firebaseListener.stopListening();
    this.gameState.reset();
    this.showScreen("start");
  }

  restartGame() {
    this.stopTimers();
    this.clearEntities();
    this.firebaseListener.stopListening();
    this.startGame();
  }

  // --- SPAWNING ---

  spawnEnemy(colIndex) {
    const randomAsset =
      this.assets.enemies[
        Math.floor(Math.random() * this.assets.enemies.length)
      ];

    const targetCell = document.querySelectorAll(
      ".grid-layer.grid-top .grid-cell"
    )[colIndex];
    if (!targetCell) return;

    const enemy = document.createElement("div");
    enemy.className = "enemy";
    enemy.style.backgroundImage = `url('${randomAsset.img}')`;

    this.positionEntity(enemy, targetCell);

    enemy.dataset.y = -60;
    enemy.dataset.speed = 2;
    enemy.dataset.type = "obstacle";

    this.elements.gameArea.appendChild(enemy);
    this.enemies.push(enemy);

    this.playSound(randomAsset.sfx);
  }

  spawnPowerup() {
    let pool = ["shield", "flowerT", "flowerC"];
    if (this.gameState.lives < 3) pool.push("heart");

    const typeKey = pool[Math.floor(Math.random() * pool.length)];
    const imgUrl = this.assets.powerups[typeKey];
    const colIndex = Math.floor(Math.random() * 4);
    const targetCell = document.querySelectorAll(
      ".grid-layer.grid-top .grid-cell"
    )[colIndex];

    if (!targetCell) return;

    const powerup = document.createElement("div");
    powerup.className = "enemy";
    powerup.style.backgroundImage = `url('${imgUrl}')`;

    this.positionEntity(powerup, targetCell);

    powerup.dataset.y = -60;
    powerup.dataset.speed = 2;
    powerup.dataset.type = typeKey;

    this.elements.gameArea.appendChild(powerup);
    this.powerups.push(powerup);

    this.playSound("powerupSpawn");
  }

  positionEntity(element, targetCell) {
    const areaRect = this.elements.gameArea.getBoundingClientRect();
    const cellRect = targetCell.getBoundingClientRect();
    const leftPos = cellRect.left - areaRect.left + cellRect.width / 2 - 30;
    element.style.left = leftPos + "px";
    element.style.top = "-60px";
  }

  startPowerupSpawner() {
    this.gameState.powerupTimer = setInterval(() => {
      if (!this.gameState.isPaused && this.gameState.isPlaying) {
        this.spawnPowerup();
      }
    }, 15000);
  }

  // --- PHYSICS & COLLISION ---

  gameLoop() {
    if (!this.gameState.isPlaying) return;

    if (!this.gameState.isPaused) {
      this.updateEntities(this.enemies, "enemy");
      this.updateEntities(this.powerups, "powerup");
      this.checkCollisions();
    }

    this.animationFrameId = requestAnimationFrame(() => this.gameLoop());
  }

  updateEntities(array, type) {
    const gameHeight = this.elements.gameArea.offsetHeight;

    for (let i = array.length - 1; i >= 0; i--) {
      const entity = array[i];
      let currentY = parseFloat(entity.dataset.y);
      currentY += parseFloat(entity.dataset.speed);

      entity.style.top = currentY + "px";
      entity.dataset.y = currentY;

      if (currentY > gameHeight) {
        entity.remove();
        array.splice(i, 1);

        if (type === "enemy") {
          // CHANGED: Simplified logic now that combo starts at 1
          this.gameState.score += this.gameState.combo;
          this.updateUI();
        }
      }
    }
  }

  checkCollisions() {
    if (!this.monkElement) return;
    const playerRect = this.monkElement.getBoundingClientRect();

    const hitBox = {
      top: playerRect.top + 20,
      bottom: playerRect.bottom - 10,
      left: playerRect.left + 20,
      right: playerRect.right - 20,
    };

    // Powerups
    for (let i = this.powerups.length - 1; i >= 0; i--) {
      if (this.isColliding(hitBox, this.powerups[i])) {
        const type = this.powerups[i].dataset.type;
        this.collectPowerup(type);
        this.powerups[i].remove();
        this.powerups.splice(i, 1);
      }
    }

    // Enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      if (this.isColliding(hitBox, this.enemies[i])) {
        this.enemies[i].remove();
        this.enemies.splice(i, 1);

        if (this.gameState.hasShield) {
          this.deactivateShield();
        } else {
          this.loseLife();
        }
      }
    }
  }

  isColliding(hitBox, entity) {
    const rect = entity.getBoundingClientRect();
    return (
      hitBox.left < rect.right &&
      hitBox.right > rect.left &&
      hitBox.top < rect.bottom &&
      hitBox.bottom > rect.top
    );
  }

  // --- PLAYER ACTIONS ---

  spawnMonk() {
    if (this.monkElement && this.monkElement.parentNode) {
      this.monkElement.parentNode.removeChild(this.monkElement);
    }
    this.monkElement = document.createElement("div");
    this.monkElement.className = "player1";
    const imgUrl = this.gameState.hasShield
      ? this.assets.player.shield
      : this.assets.player.normal;
    this.monkElement.style.backgroundImage = `url('${imgUrl}')`;
    this.elements.gameArea.appendChild(this.monkElement);

    setTimeout(() => this.moveMonkTo(0), 100);
  }

  moveMonkTo(cellIndex) {
    if (!this.gameState.isPlaying || this.gameState.isPaused) return;

    const targetCell = document.querySelector(
      `.grid-layer.grid-bottom .grid-cell[data-cell="${cellIndex}"]`
    );
    if (!targetCell) return;

    const cellRect = targetCell.getBoundingClientRect();
    const areaRect = this.elements.gameArea.getBoundingClientRect();

    this.monkElement.style.width = cellRect.width + "px";
    this.monkElement.style.height = cellRect.height + "px";
    this.monkElement.style.top = cellRect.top - areaRect.top + "px";
    this.monkElement.style.left = cellRect.left - areaRect.left + "px";

    document
      .querySelectorAll(".grid-cell")
      .forEach((c) => c.classList.remove("active-spot"));
    targetCell.classList.add("active-spot");

    this.gameState.currentPosition = cellIndex;
  }

  collectPowerup(type) {
    this.playSound("powerupCollect");
    switch (type) {
      case "heart":
        this.gainLife();
        break;
      case "shield":
        this.activateShield();
        break;
      case "flowerT":
      case "flowerC":
        this.gameState.combo++;
        this.updateUI();
        break;
    }
  }

  activateShield() {
    this.gameState.hasShield = true;
    this.monkElement.style.backgroundImage = `url('${this.assets.player.shield}')`;
  }

  deactivateShield() {
    this.gameState.hasShield = false;
    this.monkElement.style.backgroundImage = `url('${this.assets.player.normal}')`;
    this.playSound("hit");
  }

  gainLife() {
    if (this.gameState.lives < 3) {
      const heartIndex = this.gameState.lives;
      if (this.elements.hearts[heartIndex]) {
        this.elements.hearts[heartIndex].style.backgroundImage =
          'url("img/heart-01.png")';
      }
      this.gameState.lives++;
    }
  }

  loseLife() {
    if (this.gameState.lives > 0) {
      this.gameState.lives--;
      const heartIndex = this.gameState.lives;
      if (this.elements.hearts[heartIndex]) {
        this.elements.hearts[heartIndex].style.backgroundImage =
          'url("img/emptyheart-01.png")';
      }

      this.playSound("hit");

      if (this.gameState.lives <= 0) {
        this.endGame();
      }
    }
  }

  resetHearts() {
    this.elements.hearts.forEach((heart) => {
      heart.style.backgroundImage = 'url("img/heart-01.png")';
    });
  }

  // --- UTILS ---

  startGameTimer() {
    this.gameState.gameTimer = setInterval(() => {
      if (!this.gameState.isPaused) {
        this.gameState.timeElapsed++;
        this.updateUI();
      }
    }, 1000);
  }

  updateUI() {
    if (this.elements.timeValue)
      this.elements.timeValue.textContent = this.gameState.timeElapsed;
    if (this.elements.scoreValue)
      this.elements.scoreValue.textContent = this.gameState.score;
    if (this.elements.comboValue)
      this.elements.comboValue.textContent = "x " + this.gameState.combo;
  }

  pauseGame() {
    if (!this.gameState.isPlaying) return;
    this.gameState.isPaused = true;
    this.firebaseListener.stopListening();
    this.showScreen("pause");
    if (this.currentMusic) this.currentMusic.pause();
  }

  resumeGame() {
    this.gameState.isPaused = false;
    this.firebaseListener.startListening();
    this.showScreen("game");
    if (this.gameState.currentPosition !== -1) {
      this.moveMonkTo(this.gameState.currentPosition);
    }
    if (this.gameState.soundEnabled && this.currentMusic)
      this.currentMusic.play();
  }

  endGame() {
    this.gameState.isPlaying = false;
    this.stopTimers();
    this.firebaseListener.stopListening();

    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);

    // UPDATE GAME OVER STATS
    if (this.elements.finalScore)
      this.elements.finalScore.textContent = this.gameState.score;
    if (this.elements.finalCombo)
      this.elements.finalCombo.textContent = "x " + this.gameState.combo;
    if (this.elements.finalTime)
      this.elements.finalTime.textContent = this.gameState.timeElapsed + "s";

    this.showScreen("gameOver");
  }

  stopTimers() {
    if (this.gameState.gameTimer) clearInterval(this.gameState.gameTimer);
    if (this.gameState.powerupTimer) clearInterval(this.gameState.powerupTimer);
  }

  clearEntities() {
    this.enemies.forEach((el) => el.remove());
    this.enemies = [];
    this.powerups.forEach((el) => el.remove());
    this.powerups = [];
  }
}

// Init
document.addEventListener("DOMContentLoaded", () => {
  window.game = new MonkGame();
});

// Resize Handling
let resizeTimeout;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    if (window.game && window.game.gameState.isPlaying) {
      window.game.moveMonkTo(window.game.gameState.currentPosition);
    }
  }, 100);
});
