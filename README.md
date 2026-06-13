# GridShift

> **Elegant under pressure.**
>
> A deterministic action-puzzle gauntlet built with HTML5 Canvas and vanilla JavaScript.

GridShift is a grid-based puzzle game about movement, planning, tile flipping, and wave propagation.

Every action creates consequences.

Flip tiles, trigger waves, avoid enemies, and activate the entire grid while maintaining composure under systemic pressure.

Unlike traditional puzzle games, GridShift is not only about finding a solution. It is about executing that solution while the board actively fights back.

---

## Gameplay

The rules are simple:

- Move across the grid
- Flip tiles from OFF to ON
- Trigger wave propagation
- Avoid enemies
- Complete the board

The challenge comes from managing space, timing, and enemy patterns at the same time.

Difficulty is driven by:

- Routing decisions
- Pattern recognition
- Spatial planning
- Maintaining control under pressure

Not by chaos or unreadable randomness.

---

## How to Play

**Arrow Keys / WASD** — Move on the grid  
**Space / J** — Flip the tile you are standing on  
**ESC** — Return to the map

A level is completed when all non-blocked tiles are ON.

---

## Core Pillars

### Deterministic Systems

Every mechanic follows readable rules.

The player should always understand why something happened.

### Pressure Without Chaos

Enemies create tension without relying on unpredictability.

Difficulty emerges from the interaction between systems.

### Readability First

Every visual, sound, and mechanic exists to support clarity.

### Mastery Through Survival

Success is measured by execution, consistency, and composure.

---

## Tile States

GridShift is designed around a minimal tile system.

### OFF

Inactive tile. Must eventually be turned ON to complete the level.

### ON

Activated tile. All non-blocked tiles must be ON to complete the level.

### BLOCKED

Impassable tile. Cannot be crossed or toggled.

### LOCKED

Boss-specific tile state planned for systemic boss encounters.

> Prototype note: older experimental tile types may still exist in the prototype code, but they are not part of the current core design direction.

---

## Planned Structure

### Campaign Mode

A structured gauntlet composed of:

- 3 Phases
- 10 Levels per Phase
- 1 Boss Encounter per Phase

Players begin each Phase with a limited number of lives.

Completing a Phase grants an additional life.

### Tutorial Mode

A safe environment for learning:

- Movement
- Tile flipping
- Wave propagation
- Enemy interaction

No life system. No performance pressure.

### Iron Mode

Unlocked after completing the campaign.

- 3 lives total
- No Phase resets
- Full run required

Designed for mastery players.

---

## Boss Encounters

Each Phase concludes with a systemic Boss challenge.

Instead of fighting a character, players fight a recurring disruption:

- Rhythmic wave emissions
- Tile inversion
- Spatial interference
- Constant pressure

Victory comes from completing the grid despite the disruption.

---

## Technical Philosophy

GridShift is intentionally lightweight.

- No Node.js
- No bundler
- No build step
- No external engine

Just HTML, CSS, JavaScript, and Canvas.

---

## Local Setup

No installation required.

Open:

```text
index.html
```

in a browser.

Recommended browsers:

- Chrome
- Edge
- Firefox

---

## GitHub Pages

GridShift can be deployed directly through GitHub Pages.

```text
Settings
→ Pages
→ Deploy from branch
→ main
→ / (root)
```

No build pipeline required.

---

## Current Prototype Structure

The current prototype is organized as follows:

```text
gridshift/
├── index.html              ← Entry point
├── styles.css              ← Global page and canvas styling
└── src/
    ├── core/
    │   ├── audio.js        ← Audio placeholder / future audio system
    │   ├── engine.js       ← Main loop and scene management
    │   └── input.js        ← Keyboard input handling
    │
    ├── game/
    │   ├── boss.js         ← Boss placeholder
    │   ├── enemy.js        ← Enemy movement and interactions
    │   ├── entities.js     ← Stage scene, grid, tiles, waves
    │   ├── hud.js          ← HUD rendering
    │   ├── levels.js       ← Level data, map nodes, game state
    │   ├── map.js          ← Node map scene
    │   ├── player.js       ← Player movement and rendering
    │   └── weapons.js      ← Future systems placeholder
    │
    └── main.js             ← Game bootstrap
```

> Note: this structure reflects the current prototype. It may evolve as systems such as waves, bosses, UI overlays, and level flow become more stable.

---

## Current Development Status

**Prototype / Foundation Phase**

Current priorities:

- Stabilize core gameplay
- Validate wave mechanics
- Improve enemy interactions
- Implement campaign flow
- Build a clean technical foundation

The goal is not to build a large game quickly.

The goal is to build a small game properly.

---

## Documentation

Project documentation includes:

- `WORKFLOW.md`
- `GridShift_GDD_v1`
- `Game Audio Design Document`

These documents define:

- game vision
- development workflow
- audio direction
- technical philosophy

---

## Development Philosophy

GridShift is also a learning project.

The objective is to:

- learn game development
- improve programming discipline
- iterate deliberately
- create readable systems
- maintain a focused scope

Every feature should strengthen the core identity of the game.

If a mechanic creates complexity without improving the experience, it should be removed.

---

## Credits

**Design & Development**  
Daniele

**Design, Production & Technical Support**  
ChatGPT

---

> *Simple systems. Clear decisions. Elegant under pressure.*
