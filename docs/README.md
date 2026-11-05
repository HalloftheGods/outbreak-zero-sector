# Undead of Night: Last Round

A Hall of the Gods, Inc. game. A top-down pixel art zombie survival game set in an open town at night. Play solo in the browser, or co-op over a small WebSocket server. Ammo and health are finite: you find them in the town's buildings, and every gunshot tells nearby zombies where you are.

## How it plays

- **The town** is 3200x3200 pixels with five districts (Downtown, Riverside, Industrial Yard, Old Town, Park). It is generated from a seed and fenced in. Each building has a real room behind one south door, and the roof fades when you walk in.
- **Loot** sits in buildings by type: medical supplies in pharmacies and clinics, guns and ammo at the police station and gun shop. The carbine is always at the police station and the shotgun at the gun shop. Each gun takes its own ammo, and spare rounds have a cap.
- **Zombies** roam the town from the start. They notice you by sight, which walls block, and by noise, which gunfire spreads.
- **Hordes** come after a scavenging lull: 140 seconds before the first and 100 seconds between the rest. A horde lasts up to 60 seconds, and any survivors go back to roaming.
- **Levels** run from 1 to 10, each its own town with its own look. A title card names the level and how many hordes it takes. Once the last one is seen off, a banner says the van has come, an amber arrow on screen and a marker on the town map point to it, and the HUD says to get there. Reduced motion stops the falling weather and the pulsing light.
- **Searching**: hold E beside cars, boxes (crates), shelves, or furniture (drawers, lockers, fridges, cabinets) to go through them, from one second for a drawer to two for a car or locker. Moving or taking a hit undoes the search and it wants a fresh press. What was inside falls at your feet, a container stays open for everyone, and about one search in ten knocks something over, which zombies within 170 pixels hear. Most containers hold nothing, so searching stays a choice, but every home has a find in it somewhere. The ammo budget counts floors and containers together, and every town settles on it with half in each, topped up or trimmed at every level and difficulty. Containers follow from the world map and interiors in `shared/containers.ts`, their contents in `shared/container-loot.ts` and the rules in `shared/container-search.ts`.
- **Out of ammo?** Shove. It makes no noise and pushes back the two nearest zombies. A zombie you just shoved keeps its footing for a moment, so standing still and shoving will not hold off a crowd or a brute.
- **The knife** turns up in diners, houses, garages and containers. With one the shove becomes Shove & Stab: 18 damage instead of 4, just as silent, with the same two-target limit and stagger immunity. It comes with you from town to town and is lost when you die.
- **Survivors**: pick one of five on the title screen, and the choice is remembered. Night moves more quietly (zombies spot her from three quarters as far), Khronus8 reloads in three quarters of the time, Satori runs 12% faster, Rex shoves half again as hard, and Sol's kills drop loot twice as often, with about one empty container in seven turning something up anyway. The traits are one table in `shared/characters.ts`. In co-op nobody shares a survivor: you get yours if it is free, otherwise the next free one, and teammates' tags and HUD chips name who they are playing.
- **Co-op** keeps your run if you refresh: you come back with the same health, guns and spot, and a dead teammate still waits for the next horde. A newcomer after the first horde starts with half health and no spares. If the last player standing leaves, even to refresh, the run ends. Play Again restarts once everyone has asked, or 15 seconds after the first person asked.
- **Difficulty** has four modes, picked on the setup page and remembered: Night Light On, Stay Close (the default), Lights Out and Undead Tired. Each scales the ammo in town, zombie speed and bite, horde size and the lull between hordes. Lights Out is the balance the game was tuned on. In co-op the first player into an empty room sets it, and the results show it. The table is `shared/difficulty.ts`.
- **The workbench** opens after each van ride but the last. Barrels, grips, magazines and suppressors from the gun shop, police station, garages and warehouses buy upgrades within a gun's slots: damage, fire rate, magazine size, reload speed, or a suppressor that cuts its noise radius by 65%. A rare toolkit moves one upgrade between guns. A found gun can carry a quirk, good and bad at once. Upgrades stay on the gun across levels and go with it on death, and no build passes 1.5 times stock damage per second. Solo waits until you are ready; co-op gives everyone on their feet 45 seconds.
- **Solo** pauses when the window loses focus.

## Controls

| Input | Action |
| :--- | :--- |
| WASD | Move |
| Mouse | Aim, hold to fire |
| F or right mouse | Shove & Stab |
| E (hold) | Search furniture |
| R | Reload |
| H | Use a medkit |
| 1, 2, 3, Q | Weapons |
| Tab or N | Town map |
| Esc | Pause |
| M | Mute |

## Architecture

- **Simulation**: `shared/` holds the deterministic `GameSimulation` at 30 ticks a second. The browser runs it directly for solo, and the server runs the same code for co-op. Town generation is in `shared/world-map.ts` and the `town-*` files, loot in `shared/loot.ts`, zombie senses in `shared/zombie-senses.ts`, gun upgrades in `shared/gun-upgrade-data.ts` and `shared/gun-upgrades.ts`, and the hold between towns in `shared/workbench.ts`. A `GameSimulation` only stops at the bench when its `workbench` option says so: solo passes `hold`, the server `timed`.
- **Server**: `server/server.ts` is an authoritative `ws` server. Each client gets its own snapshot from `shared/snapshot-view.ts`, with zombies and pickups within `VIEWER_RANGE` (600px) of that player, or around every player for a dead viewer. Close codes: 4000 room full, 4001 server busy, 4002 no join within 10 seconds. A link too slow for the snapshots falls behind rather than catching up.
- **Client**: `src/game/` owns the run and the HUD state, `src/engine/` renders to a low-resolution back buffer (`BuildingLayer` for shells and rooms, `LightField` for the dithered lighting), and `src/network/` holds the local and socket sessions, with snapshot interpolation and local prediction. `src/game/run-stage.ts` watches each snapshot's `mapSeed` and `level`: a new town rebuilds the world, renderer, town map and prediction before that snapshot's events run, and `src/engine/level-look.ts` holds each level's light, tint and weather.
- **Art**: `src/art/` builds every sprite as pure RGBA data, with no image files. Render contact sheets with `node --experimental-strip-types tools/contact-sheet.ts <sheet> out.png`.
- **Audio**: `src/audio/` synthesizes every sound effect, the wind and the distant groans with Web Audio. Music is recorded tracks by ExoticService in `public/music/` (128-192 kbps MP3), which `soundtrack.ts` streams through the mixer: *Silent Ruins (Variation)* on the title, the lull of each town from `playlists.ts` (with rotating alternate takes across all 10 levels), and *Horde Attack* and its alternate in turn for hordes. Game over has no music. A won run plays *Dark Salvation* on `VictoryScreen.vue`, then `CreditsScreen.vue` (lines in `src/game/credits.ts`) rolls to *Surviving the Night*, and any key or click skips to the title; `EndingFlow.vue` runs the two. If a track will not load, the old generated music takes over.
- **UI**: `src/components/` holds the studio splash, title screen, HUD, banners, town map and game over screen. Any key or click skips the splash, and `?nosplash` in the address turns it off. The title is the logo, `TitleMenu.vue` and the credit; the items and the words on its pages live in `src/game/title-menu.ts`. Each page sits in `TitlePage.vue`, which gives it the panel, heading, Back and Esc, and the title scales on its own unit, `--title-u`. Enter only starts a run on the setup page's Start or Join: in a field it moves focus to that button.

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
