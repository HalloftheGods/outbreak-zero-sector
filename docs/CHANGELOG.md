# Changelog - Undead of Night: Last Round

All notable changes to the Undead of Night: Last Round game are documented in this file.

## [2026-11-04] - Open Town

### Added
- Redesigned Levels screen (`LevelsPage.vue`) with responsive multi-column card grid and procedural 64x36 pixel art preview thumbnails for all 10 level themes (Silent Ruins, Escalation, Into the Breach, Abyssal Depths, Contamination Zone, Underground Bunker, Quarantine Breach, Frozen Wasteland, The Hive, Final Stand) and a classified blueprint silhouette with padlock for locked sectors.
- Redesigned How to Play screen (`HowToPlay.vue`) with an extra-wide layout featuring authentic in-game pixel art sprite recognition cards across all 12 sections (Escape van, survivors, weapons, ammunition, health pickups, searchable containers, zombie types, workbench parts, and difficulty tiers) so players visually recognize gameplay elements alongside tactical tips.
- Touch play on phones and tablets, either way up: a floating left thumb stick, touch anywhere else to aim there and fire with a little extra headshot margin, edge buttons for Shove, Reload, Heal, Search, Weapon, Map and Pause, larger menu tap targets, and a tall view that sees no further than the same phone on its side, capped in co-op.
- Gun upgrades at a workbench after each van ride, except the last. Barrels, grips, magazines, suppressors and rare toolkits are town loot, lost on death like everything carried. They buy damage, fire rate, magazine size or reload speed within each gun's slots, a suppressor cuts a gun's noise radius by 65%, and a toolkit moves one upgrade between guns. A found gun can carry a quirk with an upside and a downside. Upgrades stay on the gun across levels and go with it on death, no build passes 1.5 times the stock damage per second, and the HUD slots show pips. Solo holds until you are ready; a co-op server gives 45 seconds. Tables in `shared/gun-upgrade-data.ts`, rules in `shared/gun-upgrades.ts`, the hold in `shared/workbench.ts`.
- Searchable cars, boxes (crates), shelves, drawers, lockers, fridges and cabinets across streets and interiors. Hold E near one to search it; moving or a hit cancels, opened ones show as opened to everyone, and a search sometimes clatters through the noise system. Most hold nothing, and every home holds something. The ammo budget rises to 1.15 of the population and counts containers: every town settles on budget with half on its floors and half shut away, at every level and difficulty.
- Every searchable piece now has two whole sprites, shut and searched: shelves go from squared-away stock to shoved about with goods on the floor, taped cartons end up torn open and crushed, cars get smashed glass, a hanging door and a popped boot, and doors and drawers hang open with their contents turned out. Fridges are a prop of their own, the size of a locker, standing against the wall in homes and diners instead of drawn on tables and counters.
- Sol's luck reaches searches: an empty container has a 15% chance of turning something up, rolled at search time in the sim so solo and co-op agree.
- A findable knife turns the shove into Shove & Stab: four and a half times the damage, silent, with stagger immunity and the two-target limit kept. Kept across levels, lost on death, with its own pickup sprite and HUD icon.
- Headshots: input now carries the crosshair's world aim point, and a pistol or carbine bullet that hits the zombie whose drawn head was under the crosshair when it fired does 2.5x damage (1.5x on brutes) and pays bonus score, with its own hit effect and sound. The crosshair turns red over a lit head. Rules live in `shared/headshots.ts`.
- Levels on the client: the world, renderer, town map and prediction rebuild when the sim moves to the next town, each level gets its look and weather, and a title card opens it. The van gets a banner, a labelled arrow on screen and a town map marker. The HUD shows the level and the hordes left, and the results show the level reached.
- Four difficulty modes (Night Light On, Stay Close, Lights Out, Undead Tired) scaling ammo, zombie speed and damage, horde size and lull length from one table in `shared/difficulty.ts`. A picker on the title screen remembers the choice, the first co-op player into a room sets it through the join packet, and the results show it. Lights Out is the old exact balance; a bare `GameSimulation` still runs on it.
- Five playable survivors replace the four placeholders: Night, Khronus8, Satori, Rex and Sol, each with full sprites in the rig and one small trait from `shared/characters.ts`. A picker on the title screen shows portrait, name and trait and remembers the choice. In co-op the server seats you on your survivor or the next free one, and tags and HUD chips show who is who. The rig gains a smaller build for the younger cast, and a fallen survivor no longer leaves blood.
- How to Play button on the title screen opens a tabbed overview of the game. The words live in `src/game/how-to-play.ts`; Esc or Back returns to the title and Enter does not start a run.
- Levels page on the title screen lists all ten levels. A level you have reached shows its number, title and theme color; the rest show ??? until a run starts them. The highest level reached is kept in `src/game/level-progress.ts`, and finishing the game adds a marker. Esc or Back returns to the title and Enter does not start a run.
- The escape van is solid for survivors, zombies and bullets, in solo and co-op. Its body comes from the town seed in `shared/exit-van.ts`, so the exit spot is unchanged and the 2 second wait still works from beside it.
- Generated open town with five districts, enterable buildings, furniture and a fenced edge. Roofs fade when you walk in.
- Finite ammo by gun type, with caps. Loot is placed by building type, and the carbine and shotgun have fixed homes.
- Roaming zombies that notice by sight and noise, with hordes after scavenging lulls in place of endless waves.
- Gun shove, medkits, bandages, a town map, and HUD warnings for low and empty ammo.
- Fourteen building shells, four floors, new furniture, and new sounds for shoves, healing, pickups, zombie alerts and the horde siren.
- Third title card displaying survivor telemetry (best score, hordes survived, kills, best time) and top survivor leaderboard rankings.
- Ten new alternate level music tracks converted to MP3 (192 kbps) and registered across all 10 levels, providing rotating alternate takes during town lulls.
- Each of the ten towns has its own lull music, alternating between multiple takes on subsequent waves. Winning the run shows a victory screen to *Dark Salvation*, then skippable scrolling credits to *Surviving the Night*, then the title.

### Changed
- Play steps regrouped: step 1 is who you are (callsign and survivor), step 2 is how you play (Solo or Multiplayer with the server address, difficulty, then Start or Join). Back, Next and How to Play's Prev and Next are now `MenuLink` text links that look like the title menu, Back on the left and Next on the right; the chosen mode and difficulty are marked in amber so Start is the only red button.
- Play is now two steps and Co-op leaves the title menu (Play, Levels, How to Play, Records, Options). Step 1 takes the callsign and Solo or Multiplayer, which reveals the server address; step 2 takes character and difficulty, then Start or Join, with connection errors shown there. Back and Esc go one step back, and Enter moves forward but never starts a run from a text field. Step logic lives in `src/game/play-flow.ts`.
- The title screen is now the logo, a short menu (Play, Co-op, Levels, How to Play, Records, Options) and the studio credit, over the moving town. Play and Co-op open a setup page, records and options moved to their own pages, and every page is one tinted panel with Back and Esc. Enter only starts a run on Start or Join.
- Hall of the Gods, Inc. branding: a studio splash on load and a credit on the title screen.
- Recorded music by ExoticService replaces the generated score, streamed as MP3 at about a twelfth of the size of the WAVs.
- Rebuilt the simulation as one deterministic `GameSimulation` shared by solo play and the co-op server.
- Redrew all pixel art and rebuilt the audio, with a title screen, game over screen and restart.
- Rewrote the lighting as a typed-array `LightField`. Nights are darker and the flashlight matters.

### Fixed
- Movement tied to packet rate, bullets passing through targets, the black flashlight, the stuck lobby, and runs that could not end in death.
- Guns firing too fast after a reload, quick taps and clicks that fired nothing, and buttons or keys lost across pause and the map.
- Shoves stun-locking anything, now limited to two targets with a short immunity. Zombies attacking through walls, stalling beside props, and big bodies stuck behind furniture.
- Co-op refreshes giving a free respawn, restarts hanging on "Waiting...", game over not reaching the player left behind, and more zombies crowding in than the cap allowed.
- The HUD reading EMPTY with another gun loaded, Enter in the server field starting solo, the wrong music for a mid-horde joiner, and audio bursts while muted.
- The server now limits packet rates and sockets waiting to join, and sends each client only what is around them.

## [2026-11-04] - Initial Architecture

### Added
- Core top-down 2D pixel engine with sub-pixel camera tracking and dynamic Y-sorting.
- 2D spatial hash grid partitioning for O(1) horde collision and proximity queries.
- Authoritative WebSocket multiplayer game server supporting room synchronization and entity interpolation.
- Full 360-degree twin-stick aiming and raycast projectile combat system.
- Zombie swarm AI state machine featuring wandering, aggro detection, and separation steering.
- Glassmorphic HUD overlay displaying player health, weapon ammo, survivor count, and connection status.
