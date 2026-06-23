// src/app/hooks.js
import { useSyncExternalStore, useMemo } from "react";
import { subscribe, getState } from "./store.js";
import { computeStats } from "./selectors.js";

/** Live full state (re-renders on any write). */
export function useStore() {
  return useSyncExternalStore(subscribe, getState, getState);
}

export function useProfile() {
  return useStore().profile;
}

export function useSettings() {
  return useStore().settings;
}

export function useCards() {
  return useStore().cards;
}

/** Memoized derived stats — recomputes only when the state object identity changes. */
export function useStats() {
  const state = useStore();
  return useMemo(() => computeStats(state), [state]);
}
