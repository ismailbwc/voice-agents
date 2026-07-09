"use client";

import { useEffect, useState } from "react";
import type { EntityConfig } from "@/lib/entities";
import { useRetellCall } from "@/hooks/useRetellCall";
import { useUiSession } from "@/hooks/useUiSession";
import { useConversationUi } from "@/hooks/useConversationUi";
import { AgenticPanel } from "./AgenticPanel";
import { CallControls } from "./CallControls";
import { ReceptionistAvatar } from "./ReceptionistAvatar";

interface VoiceReceptionistProps {
  entity: EntityConfig;
}

const DEBUG_RECEPTIONIST = process.env.NODE_ENV !== "production";

export function VoiceReceptionist({ entity }: VoiceReceptionistProps) {
  const [error, setError] = useState<string | null>(null);

  const {
    callStatus,
    voiceState,
    callId,
    messages,
    agentTurn,
    agentAmplitude,
    userAmplitude,
    startCall,
    endCall,
  } = useRetellCall({
    entity: entity.slug,
    onError: setError,
  });

  const toolUi = useUiSession(callId, callStatus === "active");
  const transcriptUi = useConversationUi(messages, entity.slug, callStatus === "active", agentTurn);
  const uiState =
    toolUi && toolUi.action !== "CLEAR" ? toolUi : transcriptUi;

  useEffect(() => {
    if (!DEBUG_RECEPTIONIST) return;
    console.log("[VoiceReceptionist] ui source", {
      entity: entity.slug,
      callId,
      toolAction: toolUi?.action ?? null,
      transcriptAction: transcriptUi?.action ?? null,
      chosenSource: toolUi && toolUi.action !== "CLEAR" ? "toolUi" : "transcriptUi",
      chosenAction: uiState?.action ?? null,
      chosenDoctorCount: uiState?.doctors?.length ?? 0,
    });
  }, [entity.slug, callId, toolUi, transcriptUi, uiState]);

  return (
    <div
      className="min-h-screen"
      style={{
        background: `linear-gradient(160deg, ${entity.theme.gradientFrom} 0%, ${entity.theme.gradientTo} 50%, #0a0f1a 100%)`,
      }}
    >
      <header className="flex items-center justify-between px-6 py-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-white/50">{entity.shortName}</p>
          <h1 className="text-lg font-semibold text-white md:text-xl">{entity.name}</h1>
        </div>
        <div
          className="rounded-full px-3 py-1 text-xs font-bold text-white"
          style={{ backgroundColor: entity.theme.primary }}
        >
          {entity.logoText}
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 px-4 pb-8 md:grid-cols-2 md:px-6 lg:gap-8">
        <section className="flex flex-col items-center gap-6">
          <p className="text-center text-sm text-white/60 md:text-base">{entity.tagline}</p>

          <ReceptionistAvatar
            entity={entity}
            callStatus={callStatus}
            voiceState={voiceState}
            agentAmplitude={agentAmplitude}
            userAmplitude={userAmplitude}
          />

          <CallControls
            entity={entity}
            callStatus={callStatus}
            onStart={() => { setError(null); startCall(); }}
            onEnd={endCall}
            error={error}
          />
        </section>

        <section className="flex min-h-[420px] flex-col md:min-h-[520px]">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white/50">
            Booking &amp; Assistance
          </h2>
          <AgenticPanel uiState={uiState} theme={entity.theme} />
        </section>
      </main>
    </div>
  );
}
