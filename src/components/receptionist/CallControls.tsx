"use client";

import { Mic, PhoneOff, Volume2 } from "lucide-react";
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
          <Mic className="h-5 w-5" strokeWidth={2.25} />
          Start Talking
        </button>
      ) : (
        <div className="flex items-center gap-4">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-full"
            style={{ backgroundColor: entity.theme.chip, color: entity.theme.primaryLight }}
            aria-hidden
          >
            <Volume2 className="h-5 w-5" strokeWidth={2.25} />
          </div>
          <button
            type="button"
            className="flex h-16 w-16 items-center justify-center rounded-full text-white shadow-md"
            style={{ backgroundColor: entity.theme.primary }}
            disabled
            title="Microphone active"
          >
            <Mic className="h-7 w-7" strokeWidth={2.25} />
          </button>
          <button
            type="button"
            onClick={onEnd}
            disabled={isConnecting}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500 transition hover:bg-red-100 disabled:opacity-60"
            aria-label="End call"
          >
            {isConnecting ? (
              <span className="text-sm font-semibold">…</span>
            ) : (
              <PhoneOff className="h-5 w-5" strokeWidth={2.25} />
            )}
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
