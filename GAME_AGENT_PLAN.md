# Gem Delver: Build Plan for an AI Coding Agent

An original puzzle-adventure game inspired by the Diamond Rush style. It uses its own name, art and levels. Do not use Gameloft names, characters or assets.

**Stack (agent-friendly, all text/code):** TypeScript + Phaser 3 + Vite, packaged for Android with Capacitor. Levels are plain-text ASCII maps, so the agent can write and test them without a GUI editor.

**Tools:** Claude Code (terminal) is best. Any agent that can edit files and run commands works.

---

## Step 0: Setup (you do this once)

1. Install Node.js 20+, Git, and Android Studio (for the APK later).
2. Create an empty folder `gem-delver`, run `git init`.
3. Save the block below as `CLAUDE.md` in the project root. The agent reads it every session.

```
# Gem Delver: project rules
- Stack: TypeScript, Phaser 3, Vite, Capacitor (Android).
- Grid-based, turn-based puzzle movement. One tile per move.
- Game logic (rules, state) must be pure TypeScript in src/core/,
  with NO Phaser imports, so it can be unit tested with Vitest.
- Phaser code (rendering, input) lives in src/scenes/ and only reads core state.
- Levels are ASCII text files in src/levels/ (legend in src/levels/LEGEND.md).
- Every feature needs a Vitest test. Run `npm test` and `npm run build` before finishing.
- Work in small commits. One phase at a time. Do not start the next phase unprompted.
- Use only original or CC0 art (Kenney.nl). Never use Gameloft assets or names.
- After each task, summarize what changed and how to verify it.
```

**Workflow for every phase:** paste the phase prompt, let the agent work, run the "Check" yourself, then `git commit`. If it fails, tell the agent exactly what you saw. Don't move on until the check passes.

---

## Phase 1: Project skeleton

**Prompt:**
> Set up a Vite + TypeScript + Phaser 3 project in this folder, plus Vitest. Create the folders src/core, src/scenes, src/levels, public/assets. Add a BootScene that shows a "Gem Delver" title on a 480x800 portrait canvas that scales to fit any screen. Add npm scripts: dev, build, test. Commit when done.

**Check:** `npm run dev` shows the title in the browser. `npm test` and `npm run build` pass.

---

## Phase 2: Core engine (no graphics yet)

**Prompt:**
> In src/core, build the pure-logic game engine. Define: a Level parsed from an ASCII map (legend in src/levels/LEGEND.md: # wall, . floor, P player start, E exit, * diamond). State holds the grid, player position, collected diamonds, and move count. Implement `move(state, direction)` returning a new immutable state. Walls block movement. Collecting a diamond updates state. Reaching E with all diamonds wins. Add undo (history stack) and restart. Write thorough Vitest tests, including level parsing and edge cases.

**Check:** All tests pass. Ask the agent to print a sample level and a move sequence in the terminal to confirm.

---

## Phase 3: Render and play it

**Prompt:**
> Create a GameScene that renders the core state using placeholder colored tiles (or Kenney CC0 sprites). Support keyboard arrows and touch swipes to move one tile, with a short tween between tiles. Add a HUD: diamonds collected / total, move count, undo button, restart button. Show a win message when the level is complete. Load level 1 from src/levels. Keep all rules in src/core, and the scene only calls move/undo/restart.

**Check:** You can play level 1 start to finish in the browser, with keyboard and with mouse-drag swipe.

---

## Phase 4: Puzzle mechanics (one at a time)

Run each of these as its own prompt, with a commit between them. Extend the LEGEND and the tests each time.

1. **Pushable blocks:** `B` block can be pushed one tile if the space behind is free. Blocked by walls and other blocks.
2. **Keys and doors:** `k` key, `D` door. Key goes into inventory, a door consumes it.
3. **Switches and gates:** `s` pressure plate, `G` gate. Gate is open while the plate is held down by the player or a block.
4. **Holes:** `O` hole. Pushing a block into it fills it and makes the tile walkable.

**Prompt template:**
> Add the [mechanic] to the core engine following the legend above. Update LEGEND.md, add Vitest tests for normal use and edge cases (e.g. pushing into a wall, chained blocks), render it in GameScene with a distinct placeholder tile, and add one small level in src/levels that teaches it.

**Check:** Each mechanic has a teaching level you can play, and undo works correctly with it.

---

## Phase 5: Hazards and items

1. **Spikes** `^`: stepping on them is a loss unless the player has a spike-boots item. Show a lose screen with a restart button.
2. **Rolling boulder** `R`: after each player move it rolls one tile in its direction until it hits something, and crushes the player if it hits them. Must be deterministic so undo stays correct.
3. **Simple enemy** `S`: patrols a fixed path one step per player move. Touching it loses.
4. **Tools:** a pickaxe that breaks cracked walls `c`, and a fire item that burns bushes `b`. Tools are picked up from the map and shown in the HUD.

Use the same prompt template as Phase 4. Insist on determinism: *"All hazard movement must be a pure function of state so undo and tests stay reliable."*

**Check:** Teaching level for each. Undo reverses hazard moves correctly.

---

## Phase 6: Game structure

**Prompt:**
> Add scenes: MainMenu, LevelSelect, Pause overlay, Win and Lose screens. Level select shows locked/unlocked levels and the best stars per level (3 stars based on move count thresholds defined in each level's header). Save progress with localStorage behind a small SaveService interface (so it can be swapped for native storage later). Add a levels manifest listing level order and themed zones (Temple, Snow, Desert), each with its own tile colors.

**Check:** Fresh start shows only level 1 unlocked. Finishing it unlocks level 2. Progress survives a page refresh.

---

## Phase 7: Level content (the long phase)

You and the agent alternate here.

**Prompt (per batch of 5 levels):**
> Design 5 new levels for the [zone] zone, increasing gently in difficulty, each introducing at most one new idea. Write them as ASCII maps. Then write a solver script (BFS over core state) that proves each level is solvable and reports the shortest solution length. Set the 3-star thresholds from that length. Reject any level the solver cannot solve.

Aim for 30 to 50 levels. The solver is the key trick: it stops the agent from shipping impossible puzzles. Playtest each batch yourself and tell the agent which levels felt boring or unfair.

---

## Phase 8: Art, sound, polish

**Prompt:**
> Replace placeholder tiles with the Kenney CC0 tileset (or assets I add to public/assets). Add player walk animation, diamond sparkle, a small screen shake on hazards, and sound effects (CC0 from Kenney or freesound) with a mute toggle. Add background music per zone. Keep the total asset size under 20 MB.

**Check:** Looks and sounds consistent on a phone-sized browser window.

---

## Phase 9: Mobile build

**Prompt:**
> Add Capacitor and the Android platform. Configure portrait orientation, fullscreen, and safe-area handling. Make sure touch swipes work and nothing relies on keyboard. Add an app icon and splash screen (original artwork). Document the exact commands to build a debug APK and a signed release AAB in a BUILDING.md file.

**You do:** Run the build in Android Studio and install the APK on your phone. Report any lag or layout problems back to the agent.

---

## Phase 10: Release

1. Create a Google Play Developer account (one-time $25).
2. Ask the agent to draft the store listing text, a privacy policy (the game collects no data), and a checklist for the required screenshots and feature graphic.
3. Upload the signed AAB, run an internal test first, then publish.

---

## Tips for working with the agent

- **One phase at a time.** Big "build the whole game" prompts produce messy code.
- **Tests first.** The core/Phaser split is what lets the agent verify its own work.
- **Commit after every passing phase.** If the agent breaks something, you can roll back.
- **When stuck:** paste the exact error or describe what you saw versus what you expected. Don't say "it's broken."
- **Ask for a short plan before big tasks:** "Before coding, list the files you'll change and why."
