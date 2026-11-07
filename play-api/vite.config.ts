import { cloudflare } from "@cloudflare/vite-plugin";
import { defineConfig } from "vite";

// cf dev and cf build run Vite; without this config Vite looks for an index.html and the build fails.
// Vite's own CORS is off so the Worker answers preflights in dev the way it does in production.
export default defineConfig({
  plugins: [cloudflare()],
  server: { cors: false },
});
