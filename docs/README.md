# Outbreak: Zero Sector

A Hall of the Gods, Inc. game. A top-down pixel art zombie survival game set in an open town at night. Play solo in the browser, or co-op over a small WebSocket server. Ammo and health are finite: you find them in the town's buildings, and every gunshot tells nearby zombies where you are.

## How it plays

- **The town** is 3200x3200 pixels with five districts (Downtown, Riverside, Industrial Yard, Old Town, Park). It is generated from a seed and fenced in. Each building has a real room behind one south door, and the roof fades when you walk in.
- **Loot** sits in buildings by type: medical supplies in pharmacies and clinics, guns and ammo at the police station and gun shop. The carbine is always at the police station and the shotgun at the gun shop. Each gun takes its own ammo, and spare rounds have a cap.
- **Zombies** roam the town from the start. They notice you by sight, which walls block, and by noise, which gunfire spreads.
- **Hordes** come after a scavenging lull: 140 seconds before the first and 100 seconds between the rest. A horde lasts up to 60 seconds, and any survivors go back to roaming.
- **Out of ammo?** Shove. It makes no noise and pushes back the two nearest zombies. A zombie you just shoved keeps its footing for a moment, so standing still and shoving will not hold off a crowd or a brute.
- **Co-op** keeps your run if you refresh: you come back with the same health, guns and spot, and a dead teammate still waits for the next horde. A newcomer after the first horde starts with half health and no spares. If the last player standing leaves, even to refresh, the run ends. Play Again restarts once everyone has asked, or 15 seconds after the first person asked.
- **Solo** pauses when the window loses focus.

## Controls

| Input | Action |
| :--- | :--- |
| WASD | Move |
| Mouse | Aim, hold to fire |
| F or right mouse | Shove |
| R | Reload |
| H | Use a medkit |
| 1, 2, 3, Q | Weapons |
| Tab or N | Town map |
| Esc | Pause |
| M | Mute |

## Architecture

- **Simulation**: `shared/` holds the deterministic `GameSimulation` at 30 ticks a second. The browser runs it directly for solo, and the server runs the same code for co-op. Town generation is in `shared/world-map.ts` and the `town-*` files, loot in `shared/loot.ts`, and zombie senses in `shared/zombie-senses.ts`.
- **Server**: `server/server.ts` is an authoritative `ws` server. Each client gets its own snapshot from `shared/snapshot-view.ts`, with zombies and pickups within `VIEWER_RANGE` (600px) of that player, or around every player for a dead viewer. Close codes: 4000 room full, 4001 server busy, 4002 no join within 10 seconds. A link too slow for the snapshots falls behind rather than catching up.
- **Client**: `src/game/` owns the run and the HUD state, `src/engine/` renders to a low-resolution back buffer (`BuildingLayer` for shells and rooms, `LightField` for the dithered lighting), and `src/network/` holds the local and socket sessions, with snapshot interpolation and local prediction.
- **Art**: `src/art/` builds every sprite as pure RGBA data, with no image files. Render contact sheets with `node --experimental-strip-types tools/contact-sheet.ts <sheet> out.png`.
- **Audio**: `src/audio/` synthesizes every sound effect, the wind and the distant groans with Web Audio. Music is four recorded tracks by ExoticService in `public/music/` (128 kbps MP3, 11 MB in all), which `soundtrack.ts` streams through the mixer: *Silent Ruins (Variation)* on the title, *Silent Ruins* in the lulls, and the two takes of *Level 2: Escalation* in turn for hordes. Game over has no music. If a track will not load, the old generated music takes over.
- **UI**: `src/components/` holds the studio splash, title screen, HUD, banners, town map and game over screen. Any key or click skips the splash, and `?nosplash` in the address turns it off.

## Running locally

1. Install dependencies from the repository root:
   ```bash
   pnpm install
   ```

2. Start the client on port 8096:
   ```bash
   pnpm --filter zombie-survival dev
   ```

3. For co-op, also start the server on port 8097 (set `ZOMBIE_PORT` to change it):
   ```bash
   pnpm --filter zombie-survival dev:server
   ```

4. Open `http://localhost:8096`. Choose Solo, or enter the server address and choose Co-op in each browser window.

## Tests

Run these from `apps/zombie-survival`:

```bash
chemx test
```

```bash
chemx typecheck
```
