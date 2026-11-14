# Google Play Store Screenshot & Graphic Asset Guide

This guide outlines the exact specifications, design requirements, and capture procedures for all promotional graphics needed for the **Gem Delver** Google Play Store listing.

---

## 1. Required Asset Checklist

| Asset | Dimensions | Format | Max File Size | Required |
|---|---|---|---|---|
| **App Icon** | 512 x 512 px | 32-bit PNG (with alpha) | 1,024 KB | Yes |
| **Feature Graphic** | 1024 x 500 px | JPEG or 24-bit PNG (no alpha) | 1,024 KB | Yes |
| **Phone Screenshots** | 1080 x 1920 px (or 1080 x 2400 px) | JPEG or 24-bit PNG | 8 MB each | Min 2, Max 8 (Rec: 6) |
| **7-inch Tablet** *(Optional)* | 1200 x 1920 px (or similar) | JPEG or 24-bit PNG | 8 MB each | Optional |
| **10-inch Tablet** *(Optional)* | 1600 x 2560 px (or similar) | JPEG or 24-bit PNG | 8 MB each | Optional |

---

## 2. Feature Graphic Design (1024 x 500 px)

The Feature Graphic is displayed prominently at the top of your store page:
- **Background**: Deep atmospheric temple stone gradient (`#020617` to `#0f172a`).
- **Focal Point**: Glowing 3D cyan diamond emblem centered or positioned on the right third.
- **Typography**: "GEM DELVER" in bold golden serif/sans-serif (`#fef08a` to `#f59e0b`), with subtitle "ANCIENT PUZZLES • 100% OFFLINE".
- **Safe Zone**: Keep all critical text and logos within the central 800 x 400 px region to avoid cutoff on smaller phone screens.

---

## 3. Phone Screenshot Storyboard (Recommended 6 Slides)

Capturing screenshots that highlight key mechanics in a narrative progression will maximize store conversion:

### Slide 1: "Descend into Ancient Ruins"
- **Scene**: Level 1 ("The Descent")
- **Visuals**: Character surrounded by ancient stone walls, collecting brilliant blue diamonds.
- **Top Caption**: *"DESCEND INTO ANCIENT RUINS"*
- **Sub-caption**: *"Pure turn-based puzzle adventure"*

### Slide 2: "Master Perilous Hazards"
- **Scene**: Level 7 ("Rolling Boulders")
- **Visuals**: A massive boulder in mid-roll, approaching a deep chasm to create a bridge; spike boots visible nearby.
- **Top Caption**: *"MASTER TRICKY HAZARDS"*
- **Sub-caption**: *"Boulders, spikes, and pressure plates"*

### Slide 3: "Outsmart Dangerous Beasts"
- **Scene**: Level 8 or 12 ("Beast Patrol" / "Lava Patrol")
- **Visuals**: Patrolling subterranean scorpion/beast on its patrol path with player timing their bypass.
- **Top Caption**: *"OUTSMART SUBTERRANEAN BEASTS"*
- **Sub-caption**: *"100% deterministic logic • Zero timers"*

### Slide 4: "Discover Ancient Relics"
- **Scene**: Level 9 ("Explorer's Tools")
- **Visuals**: Explorer using a heavy pickaxe on cracked stone and torch flame igniting thorny brambles.
- **Top Caption**: *"WIELD ANCIENT TOOLS"*
- **Sub-caption**: *"Pickaxes and torches unlock secret paths"*

### Slide 5: "15 Hand-Crafted Brain Teasers"
- **Scene**: Level Select Screen
- **Visuals**: Level cards showing Ancient Temple, Crystal Caverns, and Magma Core zones with 3-star ratings.
- **Top Caption**: *"15 HAND-CRAFTED LEVELS"*
- **Sub-caption**: *"Earn 3 stars by discovering optimal paths"*

### Slide 6: "Pure Puzzles • Zero Distractions"
- **Scene**: Victory Modal with 3 golden stars and confetti
- **Visuals**: "Level Complete!" overlay with moves count and star ratings.
- **Top Caption**: *"100% OFFLINE • ZERO ADS"*
- **Sub-caption**: *"Play anytime, anywhere without interruptions"*

---

## 4. How to Capture Pixel-Perfect Screenshots

### Method A: Browser DevTools (Fastest & Highest Quality)
1. In Chrome, open `http://localhost:3000/`.
2. Press `F12` to open Developer Tools.
3. Toggle Device Toolbar (`Ctrl + Shift + M`).
4. Select or set custom dimensions: `1080 x 1920` (or `414 x 896` with `Device pixel ratio: 3`).
5. Navigate to the desired level or scene.
6. In DevTools, press `Ctrl + Shift + P`, type **"Capture screenshot"**, and press Enter.

### Method B: Android Studio Emulator
1. Launch an Android Virtual Device (e.g. Pixel 8 or Pixel 9) in Android Studio.
2. Run `npx cap run android` or build debug APK.
3. In the emulator toolbar on the right side, click the **Camera icon** ("Take Screenshot").
4. Screenshots are saved directly to your desktop at native resolution.
