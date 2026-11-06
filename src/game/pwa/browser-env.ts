/** The real page behind the install controller and the service worker. */
import { track } from '../analytics/client.ts';
import type { InstallEnv } from './install-controller.ts';
import { STANDALONE_QUERY, isIosSafari } from './install-offer.ts';

interface IosNavigator extends Navigator {
  readonly standalone?: boolean;
}

export function browserInstallEnv(win: Window): InstallEnv {
  const nav = win.navigator as IosNavigator;
  return {
    listen(type, handler) {
      win.addEventListener(type, handler);
      return () => win.removeEventListener(type, handler);
    },
    matches: (query) => win.matchMedia(query).matches,
    onDisplayModeChange(handler) {
      const list = win.matchMedia(STANDALONE_QUERY);
      list.addEventListener('change', handler);
      return () => list.removeEventListener('change', handler);
    },
    iosStandalone: () => nav.standalone,
    iosSafari: isIosSafari(nav.userAgent, nav.platform, nav.maxTouchPoints),
    track,
  };
}
