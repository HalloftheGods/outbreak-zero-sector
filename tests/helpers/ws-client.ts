import { WebSocket } from 'ws';
import type { ServerPacket, SnapshotPacket } from '../../shared/protocol.ts';

const WAIT_MS = 3000;
let tokens = 0;

/** A real socket into a real server, with what it has heard so far. */
export class TestClient {
  readonly socket: WebSocket;
  readonly received: ServerPacket[] = [];
  closeCode: number | null = null;

  constructor(port: number) {
    this.socket = new WebSocket(`ws://127.0.0.1:${port}`);
    this.socket.on('message', (data) => this.received.push(JSON.parse(data.toString()) as ServerPacket));
    this.socket.on('close', (code) => {
      this.closeCode = code;
    });
    this.socket.on('error', () => undefined);
  }

  opened(): Promise<void> {
    const isOpen = this.socket.readyState === WebSocket.OPEN;
    if (isOpen) return Promise.resolve();
    return new Promise((resolve) => this.socket.once('open', () => resolve()));
  }

  send(value: unknown): void {
    this.socket.send(typeof value === 'string' ? value : JSON.stringify(value));
  }

  async until<T>(find: () => T | undefined | null | false): Promise<T> {
    const deadline = Date.now() + WAIT_MS;
    for (;;) {
      const found = find();
      if (found) return found;
      if (Date.now() > deadline) throw new Error('timed out waiting for the server');
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
  }

  get lastSnapshot(): SnapshotPacket | undefined {
    return this.received.findLast((packet): packet is SnapshotPacket => packet.type === 'snapshot');
  }

  async join(name = 'Tester', token = `token-${tokens++}`): Promise<string> {
    await this.opened();
    this.send({ type: 'join', name, token });
    const welcome = await this.until(() => this.received.find((packet) => packet.type === 'welcome'));
    return welcome.type === 'welcome' ? welcome.yourId : '';
  }
}
