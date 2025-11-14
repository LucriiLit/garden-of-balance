// Firebase 配置由 firebase-config.js 提供
// Firebase configuration is provided by firebase-config.js

// Firebase Manager for Roach Crusher
class FirebaseMatListener {
    constructor(gameInstance) {
        this.game = gameInstance;
        this.db = null;
        this.initialized = false;
        this.listener = null;
    }

    // 初始化 Firebase
    async init() {
        try {
            if (typeof firebase === 'undefined') {
                console.warn('Firebase SDK not loaded');
                this.updateFirebaseStatus(false, 'Firebase SDK not loaded');
                return false;
            }

            if (!firebase.apps.length) {
                firebase.initializeApp(firebaseConfig);
            }

            this.db = firebase.database();
            this.initialized = true;
            console.log('Firebase initialized for Roach Crusher');
            this.updateFirebaseStatus(true, 'Mat Control: Connected');
            return true;
        } catch (error) {
            console.error('Firebase initialization failed:', error);
            this.updateFirebaseStatus(false, 'Mat Control: Connection Failed');
            return false;
        }
    }

    // 更新Firebase狀態指示器
    updateFirebaseStatus(connected, message) {
        // 更新遊戲中的狀態指示器
        const statusElement = document.getElementById('firebaseStatus');
        const indicatorElement = document.getElementById('firebaseIndicator');
        const textElement = statusElement.querySelector('.firebase-text');
        
        if (statusElement && indicatorElement && textElement) {
            if (connected) {
                statusElement.classList.add('connected');
                indicatorElement.textContent = '🟢';
                textElement.textContent = message || 'Mat Control: Connected';
            } else {
                statusElement.classList.remove('connected');
                indicatorElement.textContent = '🔴';
                textElement.textContent = message || 'Mat Control: Disconnected';
            }
        }

        // 更新開始畫面的狀態指示器
        const startIndicatorElement = document.getElementById('startFirebaseIndicator');
        const startTextElement = document.getElementById('startFirebaseText');
        
        if (startIndicatorElement && startTextElement) {
            if (connected) {
                startIndicatorElement.textContent = '🟢';
                startTextElement.textContent = message || 'Mat Control Ready';
            } else {
                startIndicatorElement.textContent = '🔴';
                startTextElement.textContent = message || 'Mat Control Disconnected';
            }
        }
    }

    // 開始監聽地墊按壓事件
    startListening() {
        if (!this.initialized || !this.game.gameState.isPlaying) {
            console.warn('Cannot start listening: Firebase not initialized or game not playing');
            this.updateFirebaseStatus(false, 'Mat Control: Not Ready');
            return;
        }

        try {
            const matPressesRef = this.db.ref('mat_presses');
            
            // 監聽新的地墊按壓事件
            this.listener = matPressesRef.orderByChild('groupId').equalTo(1).limitToLast(1).on('child_added', (snapshot) => {
                const data = snapshot.val();
                console.log('Mat press detected:', data);
                
                // 檢查是否為有效的 matNumber (1-9)
                if (data && data.matNumber >= 1 && data.matNumber <= 9) {
                    // matNumber 1-9 對應 grid cell 0-8 (因為陣列索引從0開始)
                    const cellIndex = data.matNumber - 1;
                    this.triggerCellPress(cellIndex);
                    
                    // 更新狀態為活躍
                    this.updateFirebaseStatus(true, 'Mat Control: Active');
                }
            });

            console.log('Started listening for mat presses (groupId: 1)');
            this.updateFirebaseStatus(true, 'Mat Control: Listening');
        } catch (error) {
            console.error('Failed to start listening:', error);
            this.updateFirebaseStatus(false, 'Mat Control: Listen Failed');
        }
    }

    // 停止監聽
    stopListening() {
        if (this.listener && this.db) {
            try {
                const matPressesRef = this.db.ref('mat_presses');
                matPressesRef.off('child_added', this.listener);
                this.listener = null;
                console.log('Stopped listening for mat presses');
                this.updateFirebaseStatus(this.initialized, 'Mat Control: Connected');
            } catch (error) {
                console.error('Failed to stop listening:', error);
                this.updateFirebaseStatus(false, 'Mat Control: Error');
            }
        } else {
            this.updateFirebaseStatus(this.initialized, 'Mat Control: Disconnected');
        }
    }

    // 觸發指定格子的按壓動作
    triggerCellPress(cellIndex) {
        if (!this.game.gameState.isPlaying || this.game.gameState.isPaused) {
            return;
        }

        const gridCell = document.querySelector(`[data-cell="${cellIndex}"]`);
        if (gridCell) {
            // 添加地墊按壓的視覺效果
            gridCell.classList.add('mat-pressed');
            setTimeout(() => {
                gridCell.classList.remove('mat-pressed');
            }, 300);

            const roach = gridCell.querySelector('.roach');
            if (roach) {
                // 如果該格子有蟑螂，觸發擊殺
                console.log(`Mat press triggered roach kill at cell ${cellIndex + 1}`);
                
                // 創建模擬點擊事件
                const rect = roach.getBoundingClientRect();
                const fakeEvent = {
                    clientX: rect.left + rect.width / 2,
                    clientY: rect.top + rect.height / 2,
                    stopPropagation: () => {},
                    target: roach
                };
                
                this.game.killRoach(fakeEvent, roach);
                
                // 顯示地墊擊中效果
                this.game.showClickEffect(
                    rect.left + rect.width / 2, 
                    rect.top + rect.height / 2, 
                    `Mat ${cellIndex + 1}!`, 
                    'mat-hit'
                );
            } else {
                // 如果該格子沒有蟑螂，觸發miss
                console.log(`Mat press triggered miss at cell ${cellIndex + 1}`);
                
                const rect = gridCell.getBoundingClientRect();
                const fakeEvent = {
                    clientX: rect.left + rect.width / 2,
                    clientY: rect.top + rect.height / 2,
                    target: gridCell
                };
                
                this.game.handleCellClick(fakeEvent, gridCell);
                
                // 顯示地墊miss效果
                this.game.showClickEffect(
                    rect.left + rect.width / 2, 
                    rect.top + rect.height / 2, 
                    `Mat ${cellIndex + 1} Miss!`, 
                    'mat-miss'
                );
            }
        }
    }
}

// 遊戲狀態管理
class GameState {
    constructor() {
        this.reset();
    }

    reset() {
        this.score = 0;
        this.timeLeft = 60;
        this.combo = 0;
        this.maxCombo = 0;
        this.roachesKilled = 0;
        this.totalClicks = 0;
        this.isPlaying = false;
        this.isPaused = false;
        this.roaches = [];
        this.gameTimer = null;
        this.spawnTimer = null;
        this.soundEnabled = true;
    }

    getAccuracy() {
        return this.totalClicks === 0 ? 0 : Math.round((this.roachesKilled / this.totalClicks) * 100);
    }
}

// 遊戲主類
class RoachCrusher {
    constructor() {
        this.gameState = new GameState();
        this.screens = {
            start: document.getElementById('startScreen'),
            instructions: document.getElementById('instructionsScreen'),
            game: document.getElementById('gameScreen'),
            gameOver: document.getElementById('gameOverScreen'),
            pause: document.getElementById('pauseScreen')
        };
        
        this.elements = {
            gameArea: document.getElementById('gameArea'),
            scoreValue: document.getElementById('scoreValue'),
            timeValue: document.getElementById('timeValue'),
            comboValue: document.getElementById('comboValue'),
            finalScore: document.getElementById('finalScore'),
            roachesKilled: document.getElementById('roachesKilled'),
            maxCombo: document.getElementById('maxCombo'),
            accuracy: document.getElementById('accuracy'),
            performanceText: document.getElementById('performanceText'),
            clickEffects: document.getElementById('clickEffects'),
            soundToggle: document.getElementById('soundToggle')
        };

        // 初始化Firebase監聽器
        this.firebaseListener = new FirebaseMatListener(this);

        this.init();
    }

    async init() {
        this.preloadImages();
        this.bindEvents();
        this.bindGridEvents();
        this.showScreen('start');
        this.updateSoundIcon();
        
        // 初始化Firebase
        this.firebaseListener.updateFirebaseStatus(false, 'Connecting to Mat Control...');
        await this.firebaseListener.init();
    }

    preloadImages() {
        // 預載入蟑螂圖片
        const roachImg = new Image();
        roachImg.src = 'img/roach.png';
        roachImg.onload = () => {
            console.log('Roach image loaded successfully');
        };
        roachImg.onerror = () => {
            console.warn('Failed to load roach image, falling back to emoji');
        };

        // 預載入地板背景圖片
        const floorImg = new Image();
        floorImg.src = 'img/floor.png';
        floorImg.onload = () => {
            console.log('Floor background loaded successfully');
        };
        floorImg.onerror = () => {
            console.warn('Failed to load floor background');
        };
    }

    bindGridEvents() {
        // 為每個格子綁定點擊事件
        const gridCells = document.querySelectorAll('.grid-cell');
        gridCells.forEach(cell => {
            cell.addEventListener('click', (e) => this.handleCellClick(e, cell));
        });
    }

    bindEvents() {
        // 開始畫面
        document.getElementById('startButton').addEventListener('click', () => this.startGame());
        document.getElementById('instructionsButton').addEventListener('click', () => this.showInstructions());
        
        // 說明畫面
        document.getElementById('backButton').addEventListener('click', () => this.showScreen('start'));
        
        // 遊戲控制
        document.getElementById('pauseButton').addEventListener('click', () => this.pauseGame());
        document.getElementById('resumeButton').addEventListener('click', () => this.resumeGame());
        document.getElementById('restartButton').addEventListener('click', () => this.restartGame());
        document.getElementById('quitButton').addEventListener('click', () => this.quitGame());
        
        // 遊戲結束
        document.getElementById('playAgainButton').addEventListener('click', () => this.startGame());
        document.getElementById('mainMenuButton').addEventListener('click', () => this.showScreen('start'));
        
        // 音效控制
        this.elements.soundToggle.addEventListener('click', () => this.toggleSound());
        

        
        // 防止頁面滾動和縮放
        document.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
        document.addEventListener('gesturestart', (e) => e.preventDefault());
        document.addEventListener('gesturechange', (e) => e.preventDefault());
    }

    showScreen(screenName) {
        Object.values(this.screens).forEach(screen => screen.classList.add('hidden'));
        this.screens[screenName].classList.remove('hidden');
    }

    showInstructions() {
        this.showScreen('instructions');
    }

    startGame() {
        this.gameState.reset();
        this.showScreen('game');
        this.updateUI();
        this.gameState.isPlaying = true;
        this.gameState.isPaused = false;
        
        // 清理舊蟑螂
        this.clearRoaches();
        
        // 開始遊戲計時器
        this.startGameTimer();
        
        // 開始生成蟑螂
        this.startSpawning();
        
        // 開始監聽Firebase地墊事件
        this.firebaseListener.startListening();
        
        this.playSound('start');
    }

    startGameTimer() {
        this.gameState.gameTimer = setInterval(() => {
            if (!this.gameState.isPaused) {
                this.gameState.timeLeft--;
                this.updateUI();
                
                if (this.gameState.timeLeft <= 0) {
                    this.endGame();
                }
            }
        }, 1000);
    }

    startSpawning() {
        this.spawnRoach();
        this.gameState.spawnTimer = setInterval(() => {
            if (!this.gameState.isPaused) {
                this.spawnRoach();
            }
        }, this.getSpawnInterval());
    }

    getSpawnInterval() {
        // 隨著時間推進，蟑螂出現頻率加快
        const elapsed = 60 - this.gameState.timeLeft;
        const baseInterval = 1500;  // 9宮格模式稍快一些
        const minInterval = 600;
        return Math.max(minInterval, baseInterval - (elapsed * 15));
    }

    spawnRoach() {
        if (!this.gameState.isPlaying || this.gameState.isPaused) return;
        
        // 獲取所有空的格子
        const gridCells = document.querySelectorAll('.grid-cell');
        const emptyCells = Array.from(gridCells).filter(cell => 
            !cell.querySelector('.roach')
        );
        
        if (emptyCells.length === 0) return; // 沒有空格子
        
        // 隨機選擇一個空格子
        const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        const cellContent = randomCell.querySelector('.cell-content');
        
        // 創建蟑螂
        const roach = document.createElement('div');
        roach.className = 'roach';
        roach.dataset.id = Date.now() + Math.random();
        roach.dataset.cellId = randomCell.dataset.cell;
        
        // 添加點擊事件
        roach.addEventListener('click', (e) => this.killRoach(e, roach));
        
        // 將蟑螂添加到格子中
        cellContent.appendChild(roach);
        this.gameState.roaches.push(roach);
        
        // 激活格子
        randomCell.classList.add('active');
        
        // 添加移動動畫
        setTimeout(() => {
            if (roach.parentNode) {
                roach.classList.add('moving');
            }
        }, 100);
        
        // 自動消失
        setTimeout(() => {
            this.removeRoach(roach);
        }, 3000 + Math.random() * 2000);
    }

    killRoach(event, roach) {
        if (!this.gameState.isPlaying || this.gameState.isPaused) return;
        
        event.stopPropagation();
        
        // 增加分數和統計
        this.gameState.roachesKilled++;
        this.gameState.totalClicks++;
        this.gameState.combo++;
        this.gameState.maxCombo = Math.max(this.gameState.maxCombo, this.gameState.combo);
        
        // 計算分數（連擊獎勵）
        const baseScore = 10;
        const comboBonus = Math.floor(this.gameState.combo / 5) * 5;
        const scoreGain = baseScore + comboBonus;
        this.gameState.score += scoreGain;
        
        // 播放音效
        this.playSound('hit');
        
        // 顯示點擊效果
        this.showClickEffect(event.clientX, event.clientY, '+' + scoreGain, 'hit');
        
        // 蟑螂被擊中動畫
        roach.classList.add('clicked');
        roach.style.pointerEvents = 'none';
        
        // 移除蟑螂
        setTimeout(() => {
            this.removeRoach(roach);
        }, 300);
        
        // 更新UI
        this.updateUI();
        
        // 連擊光效
        if (this.gameState.combo % 5 === 0 && this.gameState.combo > 0) {
            this.elements.comboValue.classList.add('combo-glow');
            setTimeout(() => {
                this.elements.comboValue.classList.remove('combo-glow');
            }, 500);
        }
    }

    handleCellClick(event, cell) {
        if (!this.gameState.isPlaying || this.gameState.isPaused) return;
        
        // 檢查點擊的是格子本身還是蟑螂
        const roach = cell.querySelector('.roach');
        if (!roach && (event.target === cell || event.target === cell.querySelector('.cell-content'))) {
            // Miss - 點擊了空格子
            this.gameState.totalClicks++;
            this.gameState.combo = 0; // 重置連擊
            
            this.playSound('miss');
            this.showClickEffect(event.clientX, event.clientY, 'Miss!', 'miss');
            this.updateUI();
            
            // 添加miss效果到格子
            cell.style.background = 'rgba(244, 67, 54, 0.3)';
            setTimeout(() => {
                cell.style.background = '';
            }, 200);
        }
    }

    removeRoach(roach) {
        const index = this.gameState.roaches.indexOf(roach);
        if (index > -1) {
            this.gameState.roaches.splice(index, 1);
        }
        
        // 移除格子的激活狀態
        if (roach.dataset.cellId !== undefined) {
            const cell = document.querySelector(`[data-cell="${roach.dataset.cellId}"]`);
            if (cell) {
                cell.classList.remove('active');
            }
        }
        
        if (roach.parentNode) {
            roach.parentNode.removeChild(roach);
        }
    }

    clearRoaches() {
        // 清理所有蟑螂
        this.gameState.roaches.forEach(roach => {
            if (roach.parentNode) {
                roach.parentNode.removeChild(roach);
            }
        });
        this.gameState.roaches = [];
        
        // 移除所有格子的激活狀態
        const gridCells = document.querySelectorAll('.grid-cell');
        gridCells.forEach(cell => {
            cell.classList.remove('active');
        });
    }

    showClickEffect(x, y, text, type) {
        const effect = document.createElement('div');
        effect.className = `click-effect ${type}`;
        effect.textContent = text;
        effect.style.left = (x - 25) + 'px';
        effect.style.top = (y - 25) + 'px';
        
        this.elements.clickEffects.appendChild(effect);
        
        setTimeout(() => {
            if (effect.parentNode) {
                effect.parentNode.removeChild(effect);
            }
        }, 600);
    }

    updateUI() {
        this.elements.scoreValue.textContent = this.gameState.score.toLocaleString();
        this.elements.timeValue.textContent = this.gameState.timeLeft;
        this.elements.comboValue.textContent = this.gameState.combo;
    }

    pauseGame() {
        if (!this.gameState.isPlaying) return;
        
        this.gameState.isPaused = true;
        // 暫停時停止Firebase監聽
        this.firebaseListener.stopListening();
        this.showScreen('pause');
        this.playSound('pause');
    }

    resumeGame() {
        this.gameState.isPaused = false;
        // 恢復時重新開始Firebase監聽
        this.firebaseListener.startListening();
        this.showScreen('game');
    }

    restartGame() {
        this.stopTimers();
        this.clearRoaches();
        this.firebaseListener.stopListening();
        this.startGame();
    }

    quitGame() {
        this.stopTimers();
        this.clearRoaches();
        this.firebaseListener.stopListening();
        this.gameState.reset();
        this.showScreen('start');
    }

    endGame() {
        this.gameState.isPlaying = false;
        this.stopTimers();
        this.clearRoaches();
        
        // 停止Firebase監聽
        this.firebaseListener.stopListening();
        
        // 更新最終分數顯示
        this.elements.finalScore.textContent = this.gameState.score.toLocaleString();
        this.elements.roachesKilled.textContent = this.gameState.roachesKilled;
        this.elements.maxCombo.textContent = this.gameState.maxCombo;
        this.elements.accuracy.textContent = this.gameState.getAccuracy() + '%';
        
        // 根據表現顯示不同訊息
        this.elements.performanceText.textContent = this.getPerformanceMessage();
        
        this.showScreen('gameOver');
        this.playSound('end');
    }

    getPerformanceMessage() {
        const accuracy = this.gameState.getAccuracy();
        const score = this.gameState.score;
        
        if (score > 1000 && accuracy > 80) {
            return '🏆 Roach Exterminator! Perfect Performance!';
        } else if (score > 500 && accuracy > 60) {
            return '🎯 Excellent Hunter! Keep it up!';
        } else if (score > 200) {
            return '👍 Good start! Practice makes perfect!';
        } else {
            return '💪 Don\'t give up! You\'ll get better!';
        }
    }

    stopTimers() {
        if (this.gameState.gameTimer) {
            clearInterval(this.gameState.gameTimer);
            this.gameState.gameTimer = null;
        }
        
        if (this.gameState.spawnTimer) {
            clearInterval(this.gameState.spawnTimer);
            this.gameState.spawnTimer = null;
        }
    }

    toggleSound() {
        this.gameState.soundEnabled = !this.gameState.soundEnabled;
        this.updateSoundIcon();
    }

    updateSoundIcon() {
        this.elements.soundToggle.textContent = this.gameState.soundEnabled ? '🔊' : '🔇';
    }

    playSound(type) {
        if (!this.gameState.soundEnabled) return;
        
        // 使用 Web Audio API 生成簡單音效
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            let frequency, duration;
            switch (type) {
                case 'hit':
                    frequency = 800;
                    duration = 0.1;
                    break;
                case 'miss':
                    frequency = 200;
                    duration = 0.2;
                    break;
                case 'start':
                    frequency = 440;
                    duration = 0.3;
                    break;
                case 'end':
                    frequency = 330;
                    duration = 0.5;
                    break;
                case 'pause':
                    frequency = 550;
                    duration = 0.15;
                    break;
                default:
                    return;
            }
            
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = frequency;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + duration);
            
        } catch (error) {
            console.log('Audio not supported:', error);
        }
    }
}

// 初始化遊戲
document.addEventListener('DOMContentLoaded', () => {
    new RoachCrusher();
});

// 防止頁面刷新時的確認對話框
window.addEventListener('beforeunload', (e) => {
    // 只在遊戲進行中時提醒
    if (window.game && window.game.gameState.isPlaying) {
        e.preventDefault();
        e.returnValue = '';
    }
});

// 處理頁面可見性變化（防止在背景時繼續遊戲）
document.addEventListener('visibilitychange', () => {
    if (window.game && window.game.gameState.isPlaying && document.hidden) {
        window.game.pauseGame();
    }
});

// 處理設備方向變化
window.addEventListener('orientationchange', () => {
    setTimeout(() => {
        // 重新調整遊戲區域
        if (window.game && window.game.gameState.isPlaying) {
            // 可以在這裡添加方向變化時的處理邏輯
        }
    }, 100);
});