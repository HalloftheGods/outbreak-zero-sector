import { describe, expect, it } from 'vitest';
import { createInstallController } from '../src/game/pwa/install-controller.ts';
import type { InstallEnv, InstallPromptEvent } from '../src/game/pwa/install-controller.ts';
import { guideKindFor, installPath, isIosSafari, isStandaloneDisplay } from '../src/game/pwa/install-offer.ts';
import type { InstallFacts } from '../src/game/pwa/install-offer.ts';

const NOTHING: InstallFacts = { standalone: false, installedNow: false, promptReady: false, promptSpent: false, iosSafari: false };

const IPHONE_SAFARI = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1';
const IPHONE_CHROME = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/123.0 Mobile/15E148 Safari/604.1';
const MAC_SAFARI = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15';
const ANDROID_CHROME = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0 Mobile Safari/537.36';

describe('installPath', () => {
  it('offers nothing when the browser gives no way to install', () => {
    expect(installPath(NOTHING)).toBe('none');
  });

  it('offers the native prompt when one is held', () => {
    expect(installPath({ ...NOTHING, promptReady: true })).toBe('prompt');
  });

  it('offers the by-hand card on iPhone and iPad Safari, which have no prompt', () => {
    expect(installPath({ ...NOTHING, iosSafari: true })).toBe('guide');
    expect(guideKindFor({ ...NOTHING, iosSafari: true })).toBe('ios');
  });

  it('hides once the game is installed, however the browser got there', () => {
    expect(installPath({ ...NOTHING, promptReady: true, standalone: true })).toBe('none');
    expect(installPath({ ...NOTHING, promptReady: true, installedNow: true })).toBe('none');
    expect(installPath({ ...NOTHING, iosSafari: true, standalone: true })).toBe('none');
  });

  it('keeps the cartridge after a dismissed prompt, pointing at the browser menu', () => {
    const dismissed = { ...NOTHING, promptSpent: true };
    expect(installPath(dismissed)).toBe('guide');
    expect(guideKindFor(dismissed)).toBe('menu');
  });
});

describe('browser detection', () => {
  it('knows iPhone and iPad Safari, including an iPad that says it is a Mac', () => {
    expect(isIosSafari(IPHONE_SAFARI, 'iPhone', 5)).toBe(true);
    expect(isIosSafari(MAC_SAFARI, 'MacIntel', 5)).toBe(true);
  });

  it('leaves out a desktop Mac, other iOS browsers and Android', () => {
    expect(isIosSafari(MAC_SAFARI, 'MacIntel', 0)).toBe(false);
    expect(isIosSafari(IPHONE_CHROME, 'iPhone', 5)).toBe(false);
    expect(isIosSafari(ANDROID_CHROME, 'Linux armv8l', 5)).toBe(false);
  });

  it('reads standalone from the display mode or from iOS', () => {
    expect(isStandaloneDisplay((query) => query.includes('standalone'), undefined)).toBe(true);
    expect(isStandaloneDisplay(() => false, true)).toBe(true);
    expect(isStandaloneDisplay(() => false, false)).toBe(false);
  });
});

type Handler = (event: Event) => void;

function fakeEnv(overrides: Partial<InstallEnv> = {}) {
  const handlers = new Map<string, Handler>();
  const tracked: Array<[string, Readonly<Record<string, unknown>> | undefined]> = [];
  let modeChanged: () => void = () => undefined;
  const env: InstallEnv = {
    listen(type, handler) {
      handlers.set(type, handler);
      return () => handlers.delete(type);
    },
    matches: () => false,
    onDisplayModeChange(handler) {
      modeChanged = handler;
      return () => undefined;
    },
    iosStandalone: () => undefined,
    iosSafari: false,
    track: (name, params) => void tracked.push([name, params]),
    ...overrides,
  };
  return { env, handlers, tracked, changeDisplayMode: () => modeChanged() };
}

function fakePrompt(outcome: 'accepted' | 'dismissed') {
  const state = { prompted: 0, prevented: false };
  const event = Object.assign(new Event('beforeinstallprompt', { cancelable: true }), {
    prompt: async () => void (state.prompted += 1),
    userChoice: Promise.resolve({ outcome }),
  }) as InstallPromptEvent;
  const original = event.preventDefault.bind(event);
  event.preventDefault = () => {
    state.prevented = true;
    original();
  };
  return { event, state };
}

describe('install controller', () => {
  it('shows nothing until the browser offers a prompt, then holds it for the cartridge', () => {
    const { env, handlers } = fakeEnv();
    const controller = createInstallController(env);
    expect(controller.path.value).toBe('none');
    const offer = fakePrompt('accepted');
    handlers.get('beforeinstallprompt')?.(offer.event);
    expect(offer.state.prevented).toBe(true);
    expect(controller.path.value).toBe('prompt');
  });

  it('opens the native dialog on press and reports it once', async () => {
    const { env, handlers, tracked } = fakeEnv();
    const controller = createInstallController(env);
    const offer = fakePrompt('accepted');
    handlers.get('beforeinstallprompt')?.(offer.event);
    await controller.press();
    expect(offer.state.prompted).toBe(1);
    expect(tracked).toEqual([['install_prompt', { source: 'native' }]]);
  });

  it('keeps the cartridge after a dismissal and answers the next press with the menu card', async () => {
    const { env, handlers } = fakeEnv();
    const controller = createInstallController(env);
    const offer = fakePrompt('dismissed');
    handlers.get('beforeinstallprompt')?.(offer.event);
    await controller.press();
    expect(controller.path.value).toBe('guide');
    expect(controller.guideOpen.value).toBe(false);
    await controller.press();
    expect(controller.guideOpen.value).toBe(true);
    expect(controller.guideKind.value).toBe('menu');
    expect(offer.state.prompted).toBe(1);
  });

  it('takes a fresh prompt from the browser after a dismissal', async () => {
    const { env, handlers } = fakeEnv();
    const controller = createInstallController(env);
    handlers.get('beforeinstallprompt')?.(fakePrompt('dismissed').event);
    await controller.press();
    handlers.get('beforeinstallprompt')?.(fakePrompt('accepted').event);
    expect(controller.path.value).toBe('prompt');
  });

  it('falls back to the card when the browser refuses to open the dialog', async () => {
    const { env, handlers } = fakeEnv();
    const controller = createInstallController(env);
    const offer = fakePrompt('accepted');
    offer.event.prompt = async () => {
      throw new Error('InvalidStateError');
    };
    handlers.get('beforeinstallprompt')?.(offer.event);
    await controller.press();
    expect(controller.guideOpen.value).toBe(true);
  });

  it('opens the Share and Add to Home Screen card on iOS Safari', async () => {
    const { env, tracked } = fakeEnv({ iosSafari: true });
    const controller = createInstallController(env);
    expect(controller.path.value).toBe('guide');
    await controller.press();
    expect(controller.guideOpen.value).toBe(true);
    expect(controller.guideKind.value).toBe('ios');
    expect(tracked).toEqual([['install_prompt', { source: 'guide' }]]);
    controller.closeGuide();
    expect(controller.guideOpen.value).toBe(false);
    expect(controller.path.value).toBe('guide');
  });

  it('hides for good on appinstalled and reports it', () => {
    const { env, handlers, tracked } = fakeEnv();
    const controller = createInstallController(env);
    handlers.get('beforeinstallprompt')?.(fakePrompt('accepted').event);
    handlers.get('appinstalled')?.(new Event('appinstalled'));
    expect(controller.path.value).toBe('none');
    expect(tracked).toEqual([['app_installed', undefined]]);
  });

  it('never shows in standalone display, including when it changes after load', () => {
    const live = { standalone: false };
    const { env, handlers, changeDisplayMode } = fakeEnv({ matches: () => live.standalone, iosSafari: true });
    const controller = createInstallController(env);
    handlers.get('beforeinstallprompt')?.(fakePrompt('accepted').event);
    expect(controller.path.value).toBe('prompt');
    live.standalone = true;
    changeDisplayMode();
    expect(controller.path.value).toBe('none');
  });

  it('stops listening when disposed', () => {
    const { env, handlers } = fakeEnv();
    createInstallController(env).dispose();
    expect(handlers.size).toBe(0);
  });
});
