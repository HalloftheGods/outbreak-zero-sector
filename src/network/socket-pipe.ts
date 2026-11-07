import type { PacketPipe } from './packet-pipe.ts';

/** The WebSocket link to the Node co-op server. */
export class SocketPipe implements PacketPipe {
  readonly label: string;
  onText: (text: string) => void = () => {};
  onClose: (code: number, reason: string) => void = () => {};

  private socket: WebSocket | null = null;

  constructor(url: string) {
    this.label = url;
  }

  open(): void {
    const socket = new WebSocket(this.label);
    this.socket = socket;
    socket.onmessage = (event) => this.onText(event.data as string);
    socket.onclose = (event) => this.onClose(event.code, event.reason);
  }

  send(text: string): void {
    if (this.socket?.readyState === WebSocket.OPEN) this.socket.send(text);
  }

  close(): void {
    const socket = this.socket;
    this.socket = null;
    if (!socket) return;
    socket.onmessage = null;
    socket.onclose = null;
    socket.close();
  }
}
