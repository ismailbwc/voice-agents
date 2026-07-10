"use client";

import Image from "next/image";
import type { EntityConfig } from "@/lib/entities";
import type { CallStatus, VoiceState } from "@/lib/types";

interface ReceptionistAvatarProps {
  entity: EntityConfig;
  callStatus: CallStatus;
  voiceState: VoiceState;
  agentAmplitude: number;
  userAmplitude: number;
}

function statusLabel(callStatus: CallStatus, voiceState: VoiceState): string {
  if (callStatus === "connecting") return "Connecting";
  if (callStatus !== "active") return "System Idle";
  if (voiceState === "speaking") return "Speaking";
  if (voiceState === "listening") return "Listening";
  if (voiceState === "processing") return "Processing";
  return "Connected";
}

export function ReceptionistAvatar({
  entity,
  callStatus,
  voiceState,
  agentAmplitude,
  userAmplitude,
}: ReceptionistAvatarProps) {
  const isActive = callStatus === "active";
  const label = statusLabel(callStatus, voiceState);
  const statusColor =
    voiceState === "speaking"
      ? entity.theme.orbSpeaking
      : voiceState === "listening"
        ? entity.theme.orbListening
        : "#94A3B8";

  const amp = voiceState === "speaking" ? agentAmplitude : voiceState === "listening" ? userAmplitude : 0.2;
  const bars = [0.45, 0.7, 1, 0.65, 0.4];

  return (
    <div className="relative flex flex-col items-center">
      <div className="relative h-44 w-44 sm:h-52 sm:w-52">
        {callStatus === "connecting" && (
          <div
            className="absolute -inset-2 animate-pulse-ring rounded-full border-2 border-dashed"
            style={{ borderColor: entity.theme.primaryLight }}
          />
        )}
        <div
          className="relative h-full w-full overflow-hidden rounded-full border-4 border-white shadow-lg"
          style={{ boxShadow: `0 12px 40px ${entity.theme.glow}` }}
        >
          <Image
            src={entity.receptionistImage}
            alt={`${entity.agentName}, ${entity.shortName} virtual receptionist`}
            fill
            className="object-cover object-top"
            priority
            sizes="208px"
          />
        </div>

        <div className="absolute -bottom-3 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full border border-slate-100 bg-white px-3 py-1.5 text-xs font-semibold shadow-sm">
          <span className="mr-1.5 inline-block h-2 w-2 rounded-full" style={{ backgroundColor: statusColor }} />
          <span style={{ color: isActive ? statusColor : "#64748B" }}>{label}</span>
        </div>
      </div>

      {isActive && (
        <div className="mt-8 flex h-10 items-end justify-center gap-1.5">
          {bars.map((base, i) => (
            <span
              key={i}
              className="w-1.5 rounded-full transition-all duration-150"
              style={{
                height: `${Math.max(8, base * (0.35 + amp) * 36)}px`,
                backgroundColor: statusColor,
                opacity: 0.75 + amp * 0.25,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
