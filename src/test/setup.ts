import "@testing-library/jest-dom";

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

// Edge functions run on Deno, which injects a global `Deno` object. Vitest runs
// on Node, so provide the tiny slice our shared helpers use.
const denoEnv = new Map<string, string>();
(globalThis as any).Deno = {
  env: {
    get: (key: string) => denoEnv.get(key),
    set: (key: string, value: string) => denoEnv.set(key, value),
    delete: (key: string) => denoEnv.delete(key),
  },
};
