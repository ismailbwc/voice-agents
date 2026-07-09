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
          className="rounded-full px-10 py-4 text-lg font-semibold text-white shadow-lg transition hover:scale-105 hover:shadow-xl"
          style={{
            background: `linear-gradient(135deg, ${entity.theme.primary}, ${entity.theme.accent})`,
          }}
        >
          Start Talking
        </button>
      ) : (
        <button
          onClick={onEnd}
          disabled={isConnecting}
          className="rounded-full border-2 border-red-400/60 bg-red-500/20 px-8 py-3 font-medium text-red-200 transition hover:bg-red-500/30 disabled:opacity-60"
        >
          {isConnecting ? "Connecting..." : "End Call"}
        </button>
      )}

      {error && <p className="max-w-sm text-center text-sm text-red-300">{error}</p>}

      {callStatus === "ended" && (
        <p className="text-sm text-white/60">Call ended. Tap Start Talking to begin again.</p>
      )}
    </div>
  );
}
