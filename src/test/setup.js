// Vitest setup. jsdom lacks a few browser APIs the app touches at import time
// (matchMedia for reduced-motion, IntersectionObserver, scrollIntoView). Stub
// them so importing components never throws and reduced-motion defaults to off.
import "@testing-library/jest-dom/vitest";
import { beforeEach } from "vitest";

if (typeof window !== "undefined") {
  if (!window.matchMedia) {
    window.matchMedia = (query) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    });
  }
  if (!window.scrollTo) window.scrollTo = () => {};
  if (!Element.prototype.scrollIntoView) Element.prototype.scrollIntoView = () => {};
}

// A clean localStorage between tests keeps the on-device store deterministic.
beforeEach(() => {
  try {
    window.localStorage?.clear();
  } catch {
    /* ignore */
  }
});
