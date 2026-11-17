# 🕹️ Childhood Game — Pocket Retro Arcade

A handcrafted retro arcade game collection bringing two legendary childhood classics together in a single unified web and mobile application:

1. **💎 Gem Delver (Diamond Rush Reborn)**: 20 handcrafted campaign puzzle rooms across Ancient Temples, Crystal Caverns, and Magma Core.
2. **🐍 Nokia Snake (3310 Edition)**: 10 authentic level mazes (Levels 0–9) featuring wrap-around border portals, dynamic speed ticks, timed bonus bugs (5x multiplier), and 4 retro LCD palettes.

---

## 🎮 Games Included

### 1. Gem Delver (Diamond Rush)
- **20 Handcrafted Stages**: Puzzles with mathematical proof of solvability via built-in BFS solver.
- **3 Unique Zones**:
  - 🏛️ *Ancient Temple* (Levels 1–6): Basic mechanics, pushable stone blocks, lock-and-key doors, toggle gates, pit holes.
  - ❄️ *Crystal Caverns* (Levels 7–10): Slippery ice, rolling boulders, patrolling venom spiders, pickaxes & hammer tools.
  - 🌋 *Magma Core* (Levels 11–20): Magma tiles, fire boots, complex multi-switch gauntlets, and high-stakes boulder puzzles.
- **Grading**: Earn up to 3 stars per level based on minimal move counts. Progress and stars are persisted automatically.

### 2. Nokia Snake (Levels 0–9)
- **10 Handcrafted Mazes**: From open fields to complex tunnel corridors and obstacle gauntlets.
- **Bonus Bug Mechanic**: Every 5 foods eaten, an 8-bit bonus bug spawns with a 40-tick countdown timer worth 5× points.
- **4 Selectable Themes**:
  - 🟢 *Classic Nokia 3310* (Monochrome green dot matrix)
  - 🎮 *Game Boy DMG-01* (Retro olive LCD)
  - 🟠 *Amber CRT* (Warm monochrome phosphor)
  - 🔵 *Cyberpunk Cyan* (Futuristic neon glow)
- **Audio**: Procedural retro buzzer sound effects synthesized via Web Audio API.

---

## 🕹️ Controls

| Action | Keyboard | Touch / Mobile |
| :--- | :--- | :--- |
| **Move Explorer / Snake** | <kbd>▲</kbd> <kbd>▼</kbd> <kbd>◀</kbd> <kbd>▶</kbd> or <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> | On-Screen D-Pad / Touch Swipe |
| **Confirm / Start / Resume** | <kbd>Enter</kbd> or <kbd>Space</kbd> | OK Button / Canvas Tap |
| **Quick-Launch Gem Delver** | <kbd>1</kbd> | Tap Cartridge 1 |
| **Quick-Launch Nokia Snake** | <kbd>2</kbd> | Tap Cartridge 2 |
| **Pause / In-Game Menu** | <kbd>Esc</kbd> or <kbd>P</kbd> | In-Game Pause Button |
| **Return to Cartridge Select** | Top Bar "⌂ Back to Menu" | Casing "⌂ MENU" Button |

---

## 🛠️ Tech Stack & Architecture

- **Language**: Pure TypeScript (`strict: true`)
- **Diamond Rush Engine**: Phaser 3 (`^3.88.2`) + pure decoupled turn-based logic
- **Snake Engine**: HTML5 Canvas (480×288 logical grid) + pure tick engine
- **Audio**: Web Audio API (Synthesized oscillators & noise buffers, zero external MP3s needed)
- **Bundler & Test Runner**: Vite 6 + Vitest (138 automated unit tests)
- **Mobile Packaging**: Capacitor 8 (Ready for Android Studio export)
- **Layout**: Single-window locked viewport (`overscroll-behavior: none; -webkit-user-drag: none;`) preventing unwanted page scrolling.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ installed

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Local Development Server
```bash
npm run dev
```
Open **`http://localhost:3000`** in your browser.

### 3. Run Automated Tests
```bash
npm test
```
Runs all 138 unit tests (115 Diamond Rush tests + 23 Snake tests).

### 4. Build Production Bundle
```bash
npm run build
```
Creates minified, optimized static assets in `/dist`.

---

## 📱 Exporting to Android (APK)

```bash
# 1. Build web distribution
npm run build

# 2. Sync web assets with Capacitor Android wrapper
npx cap sync

# 3. Open project in Android Studio
npx cap open android
```
In Android Studio, click **Run ▶** or select **Build > Build Bundle(s) / APK(s) > Build APK(s)** to generate the `.apk`.

---

## 📜 License
MIT
