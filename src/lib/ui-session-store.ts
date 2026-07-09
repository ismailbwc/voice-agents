import type { UiSessionState } from "./types";

const store = new Map<string, UiSessionState>();

const DEFAULT_STATE: UiSessionState = {
  action: "CLEAR",
  updatedAt: Date.now(),
};

export function getUiState(callId: string): UiSessionState {
  return store.get(callId) ?? { ...DEFAULT_STATE, updatedAt: Date.now() };
}

export function setUiState(callId: string, state: Partial<UiSessionState>): UiSessionState {
  const current = getUiState(callId);
  const next: UiSessionState = { ...current, ...state, updatedAt: Date.now() };
  store.set(callId, next);
  return next;
}

export function clearUiState(callId: string): void {
  store.delete(callId);
}
