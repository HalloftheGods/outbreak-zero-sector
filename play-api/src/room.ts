import { DurableObject } from "cloudflare:workers";

// Hibernating WebSocket echo: no timers, so the DO can be evicted between messages.
export class Room extends DurableObject {
  constructor(ctx: DurableObjectState, env: unknown) {
    super(ctx, env);
    this.ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair("ping", "pong"));
  }

  async fetch(_request: Request): Promise<Response> {
    const pair = new WebSocketPair();
    this.ctx.acceptWebSocket(pair[1]);
    return new Response(null, { status: 101, webSocket: pair[0] });
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    ws.send(message);
  }

  async webSocketClose(ws: WebSocket, code: number): Promise<void> {
    ws.close(code, "bye");
  }
}
