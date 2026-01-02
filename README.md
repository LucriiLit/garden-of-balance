🌿 Garden of Balance
A mobile-optimized, physical-digital hybrid game. Guide a Monk through a garden, dodging falling obstacles, collecting power-ups, and building combos using either touch controls or smart floor mats.

🎮 Game Features
Dual-Grid Mechanics:

Top Grid (Attack): Click the dashed cells to manually spawn obstacles.

Bottom Grid (Move): Click or step to move the Monk.

Infinite Survival: The game lasts as long as you have lives. Time counts upward!

❤️ Life System: Start with 3 hearts. Lose one if hit by an obstacle without a shield.

🛡️ Power-up System:

Shield: Grants immunity to one hit.

Hearts: Restores lost health.

Flowers: Increases the Combo counter.

🔥 Firebase Integration: Real-time smart floor mat control system.

Rich Audio: Background ambient music and specific sound effects for every entity.

Combo Scoring: Score points when obstacles successfully pass the screen (dodge). Points are multiplied by your Combo count.

🕹️ How to Play
1. Objective
Survive as long as possible! Your score increases every time an obstacle falls off the bottom of the screen without hitting you.

2. Controls
Movement (Player 1):

Touch/Mouse: Click the Bottom Grid cells (Solid/Glass style).

Smart Mats: Step on physical mats 1-4.

Spawning (Game Master/Attacker):

Touch/Mouse: Click the Top Grid cells (Dashed Brown Outline) to drop enemies in that column.

3. Items & Enemies
The Monk: Your character. Glides smoothly between positions.

Obstacles (Avoid!): Hornet 🐝, Snail 🐌, Rotten Fruit 🍎, Poop 💩.

Power-ups (Collect!):

🌸 Flowers: Adds +1 to your Combo Multiplier.

🛡️ Shield: Changes Monk appearance and absorbs 1 hit.

❤️ Heart: Spawns only if you have missing health.

📱 Technical Features
Asset Management
Audio: Uses specific MP3/WAV files for immersive feedback (sfx-nature-01, sfx-angel-01, etc.).

Visuals: Custom sprites for the Monk (monk-A-01.png), enemies, and dynamic heart status (emptyheart-01.png).

Firebase Smart Mat Integration
The game connects to a Firebase Realtime Database to receive input from physical floor mats.

Mat Configuration:

Group ID: 1

Active Mats: 1, 2, 3, 4 (Mapped to Grid indices 0, 1, 2, 3)

🚀 Quick Start
Firebase Setup:

Copy firebase-config.template.js to firebase-config.js.

Add your Firebase credentials.

Note: Ensure your domain is whitelisted in Firebase Console -> Authentication -> Authorized Domains.

Run Locally: Open index.html in your browser.

Or serve locally:

Bash

npx http-server
Upload to GitHub:

Upload index.html, style.css, script.js, firebase-config.js, img/ folder, and audio/ folder.

Enable GitHub Pages in repository settings.

📁 File Structure
Garden_of_Balance/
├── index.html                  # Main game structure
├── style.css                   # Styles (Glassmorphism, Grid Layout)
├── script.js                   # Game logic (Physics, Spawning, Scoring)
├── firebase-config.js          # Firebase credentials (Ignored by Git)
├── img/                        # Graphics assets
│   ├── monk-A-01.png           # Player sprite
│   ├── heart-01.png            # UI assets
│   ├── playground-02.png       # Backgrounds
│   └── ... (enemies/items)
└── audio/                      # Sound assets
    ├── sfx-nature-01.wav       # BGM
    ├── sfx-hornet-01.mp3       # Enemy sounds
    └── ...
🔧 Customization
You can adjust game balance in script.js:

Speed: Change enemy.dataset.speed = 2 to make items fall faster/slower.

Spawn Rate: Modify the 15000 (15s) interval in startPowerupSpawner.

Lives: Change this.lives = 3 in the GameState class.

📜 License
MIT License - Free to use and modify.# garden-of-balance
