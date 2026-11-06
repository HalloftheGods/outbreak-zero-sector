/** Holds the browser's install prompt and tells the title screen when the Install Game cartridge may show. */
import { computed, ref } from 'vue';
import { guideKindFor, installPath, isStandaloneDisplay } from './install-offer.ts';
import type { GuideKind, InstallFacts, InstallPath } from './install-offer.ts';

/** Chrome, Edge and Android's install prompt event. It is not in lib.dom. */
export interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  readonly userChoice: Promise<{ readonly outcome: 'accepted' | 'dismissed' }>;
}

/** Everything the controller needs from the page, so a spec can stand in for it. */
export interface InstallEnv {
  listen(type: string, handler: (event: Event) => void): () => void;
  matches(query: string): boolean;
  /** Called when the display mode may have changed, for instance after the player installs and opens the app. */
  onDisplayModeChange(handler: () => void): () => void;
  iosStandalone(): boolean | undefined;
  iosSafari: boolean;
  track(name: string, params?: Readonly<Record<string, unknown>>): void;
}

function isInstallPrompt(event: Event): event is InstallPromptEvent {
  return typeof (event as Partial<InstallPromptEvent>).prompt === 'function';
}

export function createInstallController(env: InstallEnv) {
  const standalone = ref(isStandaloneDisplay(env.matches, env.iosStandalone()));
  const installedNow = ref(false);
  const held = ref<InstallPromptEvent | null>(null);
  const promptSpent = ref(false);
  const guideOpen = ref(false);

  const facts = computed<InstallFacts>(() => ({
    standalone: standalone.value,
    installedNow: installedNow.value,
    promptReady: held.value !== null,
    promptSpent: promptSpent.value,
    iosSafari: env.iosSafari,
  }));
  const path = computed<InstallPath>(() => installPath(facts.value));
  const guideKind = computed<GuideKind>(() => guideKindFor(facts.value));

  const stops = [
    env.listen('beforeinstallprompt', (event) => {
      if (!isInstallPrompt(event)) return;
      // Hold it, so the cartridge decides when the dialog opens instead of the browser's own banner.
      event.preventDefault();
      held.value = event;
      promptSpent.value = false;
    }),
    env.listen('appinstalled', () => {
      installedNow.value = true;
      held.value = null;
      guideOpen.value = false;
      env.track('app_installed');
    }),
    env.onDisplayModeChange(() => {
      standalone.value = isStandaloneDisplay(env.matches, env.iosStandalone());
    }),
  ];

  async function showNativePrompt(event: InstallPromptEvent): Promise<void> {
    // The browser lets an event open its dialog once, so it is spent whatever the answer.
    held.value = null;
    try {
      await event.prompt();
      const choice = await event.userChoice;
      const dismissed = choice.outcome === 'dismissed';
      if (dismissed) promptSpent.value = true;
    } catch {
      promptSpent.value = true;
      guideOpen.value = true;
    }
  }

  async function press(): Promise<void> {
    const way = path.value;
    const nothingToOffer = way === 'none';
    if (nothingToOffer) return;
    const event = held.value;
    const nativeReady = way === 'prompt' && event !== null;
    if (nativeReady) {
      env.track('install_prompt', { source: 'native' });
      await showNativePrompt(event);
      return;
    }
    env.track('install_prompt', { source: 'guide' });
    guideOpen.value = true;
  }

  function closeGuide(): void {
    guideOpen.value = false;
  }

  function dispose(): void {
    for (const stop of stops) stop();
  }

  return { path, guideKind, guideOpen, press, closeGuide, dispose };
}

export type InstallController = ReturnType<typeof createInstallController>;
