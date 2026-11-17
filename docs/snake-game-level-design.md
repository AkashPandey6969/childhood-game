# Snake Game: Level Design Document (Levels 0 to 9)

This is a design for a Nokia-style Snake game with 10 selectable levels. **All ten layouts are my own original designs.** I could not verify the exact walls of the original Snake II mazes, so these are inspired by its structure, not copies.

In the original Snake II, speed ("level") and layout ("maze") were two separate menu options. Here they are merged so that each level 0 to 9 has one layout and one speed. The data format in section 6 keeps them as separate fields, so you can split them later.

---

## 1. Global rules

| Rule | Behavior |
|---|---|
| Grid | 20 columns x 12 rows. Coordinates are `(col, row)`, from `(0,0)` at the top-left. |
| Symbols | `#` = wall, `.` = open cell. |
| Movement | The snake moves one cell per tick in its current direction. |
| Wrap-around | Moving off any edge puts the head on the opposite edge. If that cell is a wall, the snake dies. |
| Death | The head hits a wall, or hits the snake's own body. |
| Start | Length 3, with the head at the level's start cell and the body trailing behind it. |
| Controls | Arrow keys or WASD. A 180-degree reversal is ignored. |
| Food | One item at a time, placed on a random open cell that is not on the snake. Eating it grows the snake by 1. |
| Bonus bug | After every 5 foods, a bonus item appears for 40 ticks. It is worth 5 times the normal points and does not grow the snake. |
| Level select | The player picks any level 0 to 9 before starting, as in the original. |

The wrap rule is one rule for every level. On levels with a solid border the snake never reaches an edge, so wrapping never happens. Level 0 has no walls, so it wraps everywhere. Levels 2 and 9 leave gaps in the border to create portals.

## 2. Speed and scoring

Tick time is `200 - 14 * level` milliseconds. Points per food are `10 + 2 * level`.

| Level | Name | Tick (ms) | Points per food | Wall hazard |
|---|---|---|---|---|
| 0 | Open Field | 200 | 10 | None |
| 1 | Frame | 186 | 12 | Border |
| 2 | Portals | 172 | 14 | Border with gaps |
| 3 | Center Bar | 158 | 16 | Border and one bar |
| 4 | Four Pillars | 144 | 18 | Border and 4 blocks |
| 5 | Offset Walls | 130 | 20 | Two long walls |
| 6 | Four Rooms | 116 | 22 | Cross with doors |
| 7 | Serpentine | 102 | 24 | Three barriers |
| 8 | Slalom | 88 | 26 | Four teeth |
| 9 | Fortress | 74 | 28 | Box, pillars, portals |

These numbers are starting values for playtesting, not original Nokia values.

---

## 3. Level layouts

Each level lists its layout, start cell and heading, how it plays, and what it teaches.

### Level 0: Open Field

```text
....................
....................
....................
....................
....................
....................
....................
....................
....................
....................
....................
....................
```

- **Start:** `(3,6)`, heading right.
- **Concept:** The tutorial level. There are no walls, so the only danger is the snake's own tail.
- **How it works:** Every edge wraps. Leaving the right side brings the head back on the left, and the same goes for top and bottom.
- **Teaches:** Controls, wrap-around, and tail management.

### Level 1: Frame

```text
####################
#..................#
#..................#
#..................#
#..................#
#..................#
#..................#
#..................#
#..................#
#..................#
#..................#
####################
```

- **Start:** `(3,6)`, heading right.
- **Concept:** Level 0 with a solid wall around the edge.
- **How it works:** Wrap-around is effectively off, because every edge cell is a wall. This is the "Maze 1" idea from the original: just a wall around the field.
- **Teaches:** Turning early, and keeping away from the border.

### Level 2: Portals

```text
#########..#########
#..................#
#..................#
#..................#
#..................#
....................
....................
#..................#
#..................#
#..................#
#..................#
#########..#########
```

- **Start:** `(3,3)`, heading right.
- **Concept:** A border with four 2-cell gaps, one in the middle of each side.
- **How it works:** Entering a gap wraps the snake to the matching gap on the opposite side. The top gap links to the bottom gap, and the left gap links to the right gap.
- **Teaches:** Using wrap-around deliberately as a shortcut.
- **Design note:** The gaps are 2 cells wide so the snake can enter them while turning.

### Level 3: Center Bar

```text
####################
#..................#
#..................#
#..................#
#..................#
#.....########.....#
#..................#
#..................#
#..................#
#..................#
#..................#
####################
```

- **Start:** `(3,2)`, heading right.
- **Concept:** One horizontal bar in the middle of the field, 8 cells long.
- **How it works:** The bar splits the field into a top lane and a bottom lane. The snake switches lanes by going around either end.
- **Teaches:** Planning a path around an obstacle, and not cutting off the way back.

### Level 4: Four Pillars

```text
####################
#..................#
#..................#
#...##........##...#
#...##........##...#
#..................#
#..................#
#...##........##...#
#...##........##...#
#..................#
#..................#
####################
```

- **Start:** `(3,5)`, heading right.
- **Concept:** Four 2x2 blocks placed symmetrically.
- **How it works:** The open center and the lanes between the blocks give many route choices. Food that spawns next to a pillar is harder to approach, because the snake needs room to turn.
- **Teaches:** Turning around obstacles, and judging how much space is left.

### Level 5: Offset Walls

```text
####################
#.....#............#
#.....#............#
#.....#......#.....#
#.....#......#.....#
#.....#......#.....#
#.....#......#.....#
#.....#......#.....#
#.....#......#.....#
#............#.....#
#............#.....#
####################
```

- **Start:** `(2,5)`, heading down.
- **Concept:** Two long vertical walls with gaps at opposite ends, so the field is three zones joined in an S shape.
- **How it works:** The wall at column 6 has a gap at the bottom (rows 9 and 10). The wall at column 13 has a gap at the top (rows 1 and 2). The snake travels left zone, middle zone, right zone, and back by the same gaps.
- **Teaches:** Routing through chokepoints, and not blocking a gap with its own body.
- **Design note:** The gaps are 2 cells wide on purpose. A 1-cell gap with a long snake would feel unfair.

### Level 6: Four Rooms

```text
####################
#.........#........#
#.........#........#
#..................#
#.........#........#
#.........#........#
####.##########.####
#.........#........#
#..................#
#.........#........#
#.........#........#
####################
```

- **Start:** `(3,3)`, heading right.
- **Concept:** A cross-shaped wall divides the field into four rooms. Each wall segment has one door.
- **How it works:**
  - Doors at `(10,3)` and `(10,8)` connect the left and right rooms.
  - Doors at `(4,6)` and `(15,6)` connect the top and bottom rooms.
  - The four rooms form a loop, so the snake can circle through all of them.
- **Teaches:** Moving between rooms, and using a loop to escape a dead end.
- **Design note:** A long snake crossing a door can block its own exit, so doors are where most deaths happen.

### Level 7: Serpentine

```text
####################
#..................#
#..................#
################...#
#..................#
#..................#
#...################
#..................#
#..................#
################...#
#..................#
####################
```

- **Start:** `(3,1)`, heading right.
- **Concept:** Three horizontal barriers with openings that alternate between the right and left sides, so the path winds like a snake.
- **How it works:** The route is top lane, right gap, middle lane, left gap, lower lane, right gap, bottom lane. The final lane (row 10) is a single-cell-wide dead end.
- **Teaches:** Following a long route, and thinking ahead about where the body will be.
- **Design note:** Food in the bottom lane is a risk. Entering it with a long snake means a long reverse trip with no room to turn. That risk is intentional.

### Level 8: Slalom

```text
####################
#...#.......#......#
#...#.......#......#
#...#.......#......#
#...#.......#......#
#...#...#...#...#..#
#...#...#...#...#..#
#.......#.......#..#
#.......#.......#..#
#.......#.......#..#
#.......#.......#..#
####################
```

- **Start:** `(3,8)`, heading right.
- **Concept:** Four walls ("teeth") alternate between hanging from the top and rising from the bottom.
- **How it works:** The walls at columns 4 and 12 hang from the top and leave a passage along the bottom. The walls at columns 8 and 16 rise from the bottom and leave a passage along the top. The snake weaves up and down through the field.
- **Teaches:** Fast direction changes at higher speed.
- **Design note:** The passages are 4 cells deep, so the snake can turn inside them.

### Level 9: Fortress

```text
####################
#..................#
#..#............#..#
#.....###..###.....#
#.....#......#.....#
......#......#......
......#......#......
#.....#......#.....#
#.....###..###.....#
#..#............#..#
#..................#
####################
```

- **Start:** `(3,1)`, heading right.
- **Concept:** The final level combines everything: a central walled chamber, corner pillars, and a pair of side portals.
- **How it works:**
  - The center box has two openings, at the top `(9,3)` and `(10,3)` and at the bottom `(9,8)` and `(10,8)`. Food can spawn inside it.
  - The openings at `(0,5)`, `(0,6)`, `(19,5)` and `(19,6)` are portals. Leaving one side comes back on the other, so the snake can cross the field instantly.
  - The four single pillars at the top and bottom corners add small obstacles on the outer lanes.
- **Teaches:** Everything at once, at top speed.
- **Design note:** Entering the box with a long snake is the main risk. Wrap-around is the main escape route.

---

## 4. Difficulty progression

| Level | Main new idea |
|---|---|
| 0 | Wrap-around, no walls |
| 1 | Solid border |
| 2 | Portals through border gaps |
| 3 | First interior obstacle |
| 4 | Multiple obstacles, more route choices |
| 5 | Chokepoints and a forced route |
| 6 | Rooms, doors and loops |
| 7 | Long winding route and a dead end |
| 8 | Rapid direction changes |
| 9 | All of the above plus portals |

## 5. Implementation notes

1. **Parse layouts** from the 12 strings per level. `#` is a wall, `.` is open.
2. **Game loop:** On each tick, take the newest queued direction, move the head with `(col + dx + 20) % 20` and `(row + dy + 12) % 12`, then check for walls and body collisions.
3. **Input queue:** Keep at most 2 queued turns, and ignore reversals. This stops the snake from turning into itself when keys are pressed quickly between ticks.
4. **Food placement:** Pick randomly from open cells that are not on the snake. Because every layout above is one connected region, any open cell is reachable.
5. **Validation:** Check at startup that each level is exactly 20x12, the start and body cells are open, and a flood fill (with wrap) reaches every open cell. A broken layout then fails loudly instead of leaving unreachable food.
6. **Rendering:** Draw on a `<canvas>` at about 24 px per cell, with a flat monochrome palette for the Nokia look. A dot-matrix grid effect is optional.

## 6. Suggested data format

Speed and layout are separate fields, so you can later offer them as two menus like the original.

```js
const levels = [
  {
    id: 0,
    name: "Open Field",
    maze: [ /* 12 strings of 20 characters */ ],
    start: { col: 3, row: 6, dir: "right" },
    tickMs: 200,
    pointsPerFood: 10,
  },
  // ... levels 1 to 9
];
```

To decouple them later, keep `mazes[]` (layout and start) and `speeds[]` (tick and points) as two arrays, and let the player pick one index from each.
