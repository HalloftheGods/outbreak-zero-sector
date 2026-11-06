/** The browser's end of analytics: the real page behind the sender, and the one `track` everything calls. */
import { consent } from './consent.ts';
import { createSender } from './sender.ts';
import type { SenderPage } from './sender.ts';

function browserPage(): SenderPage | null {
  try {
    const win = globalThis.window;
    if (!win) return null;
    return {
      hostname: win.location.hostname,
      href: win.location.href,
      cookies: win.document,
      globals: win as unknown as Record<string, unknown>,
      addScript(src: string) {
        const script = win.document.createElement('script');
        script.async = true;
        script.src = src;
        script.onerror = () => undefined;
        win.document.head.appendChild(script);
      },
    };
  } catch {
    return null;
  }
}

const sender = createSender({ consent, page: browserPage(), dev: import.meta.env.DEV });

export const track = sender.track;
