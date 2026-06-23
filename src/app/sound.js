// src/app/sound.js
// Restrained, OFF-by-default audio. Files are only fetched once the user opts
// in (settings.sound), and only the small cues are used — never the big music
// track on the critical path.
import { getState } from "./store.js";

const SRC = {
  clear: "/sounds/yin.mp3", // soft koi-pond plip on a clear-night log
  level: "/sounds/healthsound.mp3", // single zen-bowl ding on level-up
  milestone: "/sounds/swoosh.mp3", // one soft tide on a milestone
};
const cache = new Map();

function enabled() {
  try {
    return getState().settings.sound === true;
  } catch {
    return false;
  }
}

export function play(name, volume = 0.7) {
  if (!enabled()) return;
  const src = SRC[name];
  if (!src) return;
  try {
    let a = cache.get(name);
    if (!a) {
      a = new Audio(src);
      a.preload = "auto";
      cache.set(name, a);
    }
    a.volume = volume;
    a.currentTime = 0;
    const p = a.play();
    if (p && p.catch) p.catch(() => {});
  } catch {
    /* autoplay blocked or unsupported — ignore */
  }
}
