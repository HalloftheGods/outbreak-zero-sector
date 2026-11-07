import { bindings, defineConfig, defineWorker, exports } from "cf/config";

import * as entrypoint from "./src/index.ts" with { type: "cf-worker" };

// Spike: echo-only Room DO. The real Lobby/Room classes replace it in later slices.
export const playApi = defineWorker({
  name: "undead-play-api",
  entrypoint,
  compatibilityDate: "2026-11-01",
  bindings: {
    ROOM: bindings.durableObject({ worker: "undead-play-api", exportName: "Room" }),
  },
  exports: {
    Room: exports.durableObject({ storage: "sqlite" }),
  },
});

export default defineConfig({ worker: playApi });
