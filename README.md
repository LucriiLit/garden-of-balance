# 🪳 Roach Crusher Game

A mobile-optimized web-based roach crushing game with a 3x3 grid layout, featuring Firebase integration for smart floor mat controls.

## 🎮 Game Features

- **9-Grid Design**: Classic 3x3 grid layout for strategic and challenging gameplay
- **🔥 Firebase Integration**: Real-time smart floor mat control system
- **📡 IoT Control**: Support for physical mat inputs (GroupId: 1, MatNumber: 1-9)
- **Mobile Optimized**: Designed specifically for touch screens with responsive layout
- **Dual Input**: Both touch/mouse and smart mat controls
- **Rich Audio**: Built-in Web Audio API sound system
- **Combo System**: Consecutive hits earn extra score bonuses
- **Visual Feedback**: Cell activation effects and click animations with mat-specific effects
- **Real-time Status**: Firebase connection indicator and mat activity feedback
- **Statistics**: Detailed game performance tracking
- **Pause Function**: Support for game pause and resume

## 🕹️ How to Play

1. **Objective**: Crush as many roaches as possible within 60 seconds
2. **Controls**: 
   - **Touch/Mouse**: Tap roaches directly on screen
   - **Smart Mats**: Step on physical mats 1-9 to control corresponding grid cells
3. **Strategy**:
   - Roaches only appear in empty cells
   - Each cell can only contain one roach at a time
   - Tapping empty cells results in a miss and resets combo count
4. **Scoring**:
   - Base score per roach: 10 points
   - Combo bonus: Extra 5 points for every 5 consecutive hits
   - Missing resets your combo count

## 📱 Technical Features

### Mobile Adaptation
- Responsive design that automatically adapts to different screen sizes
- Prevents double-tap zoom and page scrolling
- Supports both landscape and portrait orientations

### Game Mechanics
- 3x3 grid system with roaches randomly appearing in cells
- Custom roach sprite graphics with fallback emoji support
- Cell activation effects and roach wiggling animations
- Click effects and audio feedback
- Progressive difficulty (roach spawn rate increases over time)
- Intelligent cell management (prevents overlapping spawns)
- Image preloading for smooth gameplay experience

### Performance Optimization
- Efficient DOM operations
- Memory management and garbage collection
- Smooth animation effects

## 🚀 Quick Start

1. Open `index.html` directly in your browser
2. Or use a local server:
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js
   npx http-server
   ```
3. Access the game on your mobile browser

## 📁 File Structure

```
Roach_Crusher/
├── index.html                  # Main game page
├── style.css                   # Stylesheet with Firebase status styles
├── script.js                   # Game logic with Firebase integration
├── firebase-config.js          # Firebase configuration (DO NOT commit to Git)
├── firebase-config.template.js # Firebase configuration template
├── .gitignore                  # Git ignore rules
├── mat_tester.html            # Firebase mat testing tool
├── FIREBASE_INTEGRATION.md    # Firebase integration documentation
├── img/                       # Image assets
│   ├── roach.png              # Roach sprite image
│   └── floor.png              # Game background image
└── README.md                  # Main documentation
```

## 🔥 Firebase Smart Mat Integration

This game supports real-time control via smart floor mats through Firebase Realtime Database.

### Initial Setup

**IMPORTANT: Firebase Configuration**

Before running the game, you need to set up your Firebase configuration:

1. **Copy the template file:**
   ```bash
   cp firebase-config.template.js firebase-config.js
   ```

2. **Edit `firebase-config.js`** and replace the placeholders with your actual Firebase project credentials

3. **Verify `.gitignore`** includes `firebase-config.js` to prevent pushing credentials to Git

> ⚠️ **Security Note:** `firebase-config.js` contains sensitive API keys and should NEVER be committed to version control.

### Mat Configuration
- **Group ID**: 1 (only monitors group 1 events)
- **Mat Numbers**: 1-9 (corresponding to 3x3 grid positions)
- **Real-time**: Instant response to mat presses

### Mat Layout
```
1 | 2 | 3    (Top Row)
---------
4 | 5 | 6    (Middle Row)
---------
7 | 8 | 9    (Bottom Row)
```

### Firebase Setup
The game connects to Firebase Realtime Database and monitors:
```javascript
mat_presses: {
  "-UniqueId": {
    timestamp: "2025/11/11 下午06:15:25",
    groupId: 1,           // Only group 1 is processed
    matNumber: 5,         // Mat number 1-9
    date: "2025-11-11T10:15:25.043Z",
    sessionId: "session_1762856124316_dfo9spzoc"
  }
}
```

### Testing Tool
Use `mat_tester.html` to simulate mat presses:
- **Manual Testing**: Click buttons 1-9 to simulate mat presses
- **Keyboard**: Press keys 1-9 for quick testing
- **Auto Tests**: Sequential and random test modes
- **Real-time Log**: View Firebase events and responses

## 🎯 Performance Rankings

- **🏆 Roach Exterminator**: Score > 1000 and Accuracy > 80%
- **🎯 Excellent Hunter**: Score > 500 and Accuracy > 60%
- **👍 Good Start**: Score > 200
- **💪 Keep Trying**: Other cases

## 🔧 Customization

### Adjust Game Difficulty
You can modify the following parameters in `script.js`:

```javascript
// Game duration (seconds)
this.timeLeft = 60;

// Roach spawn interval
getSpawnInterval() {
    const baseInterval = 1500;  // Base interval (milliseconds)
    const minInterval = 600;    // Minimum interval
    // ...
}

// Roach lifespan
setTimeout(() => {
    this.removeRoach(roach);
}, 3000 + Math.random() * 2000);  // 3-5 seconds
```

### Modify Scoring System
```javascript
// Base score
const baseScore = 10;

// Combo bonus
const comboBonus = Math.floor(this.gameState.combo / 5) * 5;
```

### Customize Game Assets

#### Roach Image
To replace the roach image:
1. Replace `img/roach.png` with your custom image
2. Recommended image size: 128x128 pixels or larger
3. Supported formats: PNG (recommended for transparency), JPG, SVG
4. The game includes emoji fallback if image fails to load

#### Background Image
To customize the game background:
1. Replace `img/floor.png` with your custom background
2. Recommended resolution: 1920x1080 or higher
3. The image will automatically scale to fit different screen sizes
4. Use `background-size: cover` for best results

## 🌟 Future Features

- [ ] Multiple roach types
- [ ] Power-up system
- [ ] Local high score records
- [ ] Social sharing functionality
- [ ] More sound effects and background music
- [ ] Achievement system

## 📜 License

MIT License - Free to use and modify

---

Enjoy crushing roaches! 🪳💥# garden-of-balance
# garden-of-balance
