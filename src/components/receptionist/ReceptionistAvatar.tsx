"use client";

import Image from "next/image";
import type { EntityConfig } from "@/lib/entities";
import type { CallStatus, VoiceState } from "@/lib/types";
import { VoiceOrb } from "./VoiceOrb";

interface ReceptionistAvatarProps {
  entity: EntityConfig;
  callStatus: CallStatus;
  voiceState: VoiceState;
  agentAmplitude: number;
  userAmplitude: number;
}

export function ReceptionistAvatar({
  entity,
  callStatus,
  voiceState,
  agentAmplitude,
  userAmplitude,
}: ReceptionistAvatarProps) {
  const isActive = callStatus === "active";
  const ringColor =
    voiceState === "speaking"
      ? entity.theme.orbSpeaking
      : voiceState === "listening"
        ? entity.theme.orbListening
        : entity.theme.primary;

  return (
    <div className="relative mx-auto flex h-72 w-72 items-center justify-center sm:h-80 sm:w-80 md:h-96 md:w-96">
      {isActive && (
        <VoiceOrb
          theme={entity.theme}
          voiceState={voiceState}
          agentAmplitude={agentAmplitude}
          userAmplitude={userAmplitude}
        />
      )}

      <div
        className="absolute inset-0 rounded-full animate-breathe"
        style={{
          boxShadow: isActive ? `0 0 60px 20px ${entity.theme.glow}` : `0 0 30px 8px ${entity.theme.glow}`,
          border: `3px solid ${ringColor}`,
          transition: "border-color 0.3s, box-shadow 0.3s",
        }}
      />

      {callStatus === "connecting" && (
        <div
          className="absolute inset-0 animate-pulse-ring rounded-full border-2 border-dashed opacity-60"
          style={{ borderColor: entity.theme.accent }}
        />
      )}

      <div className="relative z-10 h-48 w-48 overflow-hidden rounded-full border-4 border-white/20 bg-white/5 sm:h-56 sm:w-56">
        <Image
          src={entity.receptionistImage}
          alt={`${entity.shortName} virtual receptionist`}
          fill
          className="object-cover"
          priority
        />
      </div>

      {isActive && (
        <div
          className="absolute -bottom-2 rounded-full px-4 py-1 text-xs font-medium capitalize text-white"
          style={{ backgroundColor: ringColor }}
        >
          {voiceState === "speaking" ? "Speaking" : voiceState === "listening" ? "Listening" : "Connected"}
        </div>
      )}
    </div>
  );
}
