import { bindings, defineConfig, defineWorker, exports } from "cf/config";

import * as entrypoint from "./src/index.ts" with { type: "cf-worker" };

// The play API (spec: docs/specs/2026-11-07-live-multiplayer-design.md, "Deploy and rollback").
// TURN_KEY_ID and TURN_KEY_API_TOKEN are secrets: without them rooms get STUN only.
export const playApi = defineWorker({
  name: "undead-play-api",
  entrypoint,
  compatibilityDate: "2026-11-01",
  domains: ["play-api.forthexp.com"],
  observability: { enabled: true, logs: { enabled: true } },
  env: {
    LOBBY: bindings.durableObject({ worker: "undead-play-api", exportName: "Lobby" }),
    ROOM: bindings.durableObject({ worker: "undead-play-api", exportName: "Room" }),
    ALLOWED_ORIGINS: bindings.text("https://undeadofnight.forthexp.com,http://localhost:8096"),
    TURN_ENABLED: bindings.text("1"),
    TURN_KEY_ID: bindings.secret(),
    TURN_KEY_API_TOKEN: bindings.secret(),
  },
  exports: {
    Lobby: exports.durableObject({ storage: "sqlite" }),
    Room: exports.durableObject({ storage: "sqlite" }),
  },
});

export default defineConfig({ worker: playApi });
