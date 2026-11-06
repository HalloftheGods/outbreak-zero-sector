import { shallowRef } from 'vue';

/** Whether the Privacy page is up. It opens from the prompt, Options and the title, so it lives here. */
export const privacyOpen = shallowRef(false);

export function openPrivacy(): void {
  privacyOpen.value = true;
}

export function closePrivacy(): void {
  privacyOpen.value = false;
}
