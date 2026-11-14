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
