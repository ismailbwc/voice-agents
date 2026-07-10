"use client";

import type { EntityConfig } from "@/lib/entities";
import type { CallStatus } from "@/lib/types";

interface CallControlsProps {
  entity: EntityConfig;
  callStatus: CallStatus;
  onStart: () => void;
  onEnd: () => void;
  error?: string | null;
}

export function CallControls({ entity, callStatus, onStart, onEnd, error }: CallControlsProps) {
  const isActive = callStatus === "active" || callStatus === "connecting";
  const isConnecting = callStatus === "connecting";

  return (
    <div className="flex flex-col items-center gap-3">
      {!isActive ? (
        <button
          onClick={onStart}
          className="flex items-center gap-2 rounded-full px-10 py-4 text-base font-semibold text-white shadow-md transition hover:scale-[1.02] hover:shadow-lg"
          style={{ backgroundColor: entity.theme.primary }}
        >
          <MicIcon />
          Start Talking
        </button>
      ) : (
        <div className="flex items-center gap-4">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-full"
            style={{ backgroundColor: entity.theme.chip, color: entity.theme.primaryLight }}
            aria-hidden
          >
            <SpeakerIcon />
          </div>
          <button
            type="button"
            className="flex h-16 w-16 items-center justify-center rounded-full text-white shadow-md"
            style={{ backgroundColor: entity.theme.primary }}
            disabled
            title="Microphone active"
          >
            <MicIcon />
          </button>
          <button
            onClick={onEnd}
            disabled={isConnecting}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500 transition hover:bg-red-100 disabled:opacity-60"
            aria-label="End call"
          >
            {isConnecting ? "…" : <HangupIcon />}
          </button>
        </div>
      )}

      {error && <p className="max-w-sm text-center text-sm text-red-500">{error}</p>}

      {callStatus === "ended" && (
        <p className="text-sm text-slate-500">Call ended. Tap Start Talking to begin again.</p>
      )}
    </div>
  );
}

function MicIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 14a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M19 11a7 7 0 0 1-14 0M12 18v3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SpeakerIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M11 5 6 9H3v6h3l5 4V5Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M16 9a4 4 0 0 1 0 6M18.5 7a7 7 0 0 1 0 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function HangupIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 8c3-2.5 9-2.5 12 0l-1.5 2.5c-.4.6-1.1.8-1.8.6l-2-.6a1.5 1.5 0 0 0-1.7.7l-.5 1a10 10 0 0 1-3.5 0l-.5-1a1.5 1.5 0 0 0-1.7-.7l-2 .6c-.7.2-1.4 0-1.8-.6L6 8Z"
        fill="currentColor"
      />
    </svg>
  );
}
