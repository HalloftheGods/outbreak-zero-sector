import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.spec.ts'],
    // The flow specs pump seconds of real sim and render, which runs slowly on a busy machine.
    testTimeout: 20000,
  },
});
