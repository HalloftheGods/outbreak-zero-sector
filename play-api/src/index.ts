import { Room } from "./room.ts";

export { Room };

interface Env {
  ROOM: DurableObjectNamespace;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/health") {
      return Response.json({ ok: true, service: "undead-play-api" });
    }
    if (url.pathname === "/ws") {
      if (request.headers.get("Upgrade") !== "websocket") {
        return new Response("Expected a WebSocket upgrade", { status: 426 });
      }
      const code = url.searchParams.get("room") ?? "spike";
      return env.ROOM.get(env.ROOM.idFromName(code)).fetch(request);
    }
    return new Response("Not found", { status: 404 });
  },
};
