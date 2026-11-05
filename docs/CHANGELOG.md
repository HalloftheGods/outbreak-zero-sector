# Changelog - Outbreak: Zero Sector

All notable changes to the Outbreak: Zero Sector game are documented in this file.

## [2026-11-04] - Open Town

### Added
- Generated open town with five districts, enterable buildings, furniture and a fenced edge. Roofs fade when you walk in.
- Finite ammo by gun type, with caps. Loot is placed by building type, and the carbine and shotgun have fixed homes.
- Roaming zombies that notice by sight and noise, with hordes after scavenging lulls in place of endless waves.
- Gun shove, medkits, bandages, a town map, and HUD warnings for low and empty ammo.
- Fourteen building shells, four floors, new furniture, and new sounds for shoves, healing, pickups, zombie alerts and the horde siren.

### Changed
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
- Steam-ready distribution architecture via lightweight web packaging.
