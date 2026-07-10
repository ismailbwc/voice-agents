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
        background: `linear-gradient(180deg, ${entity.theme.gradientFrom} 0%, ${entity.theme.gradientTo} 100%)`,
        color: entity.theme.text,
      }}
    >
      <header className="flex items-center justify-between px-6 py-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
            {entity.shortName}
          </p>
          <h1 className="text-lg font-semibold text-[#0B1F3A] md:text-xl">{entity.name}</h1>
        </div>
        <div
          className="rounded-full px-3 py-1 text-xs font-bold text-white"
          style={{ backgroundColor: entity.theme.primary }}
        >
          {entity.logoText}
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-8 px-4 pb-10 md:grid-cols-2 md:items-start md:px-6 lg:gap-10">
        <section className="flex flex-col items-center gap-5 pt-2">
          <ReceptionistAvatar
            entity={entity}
            callStatus={callStatus}
            voiceState={voiceState}
            agentAmplitude={agentAmplitude}
            userAmplitude={userAmplitude}
          />

          <div className="max-w-md text-center">
            <h2 className="text-2xl font-bold text-[#0B1F3A] md:text-3xl">
              I&apos;m {entity.agentName}, your assistant.
            </h2>
            <p className="mt-2 text-sm text-slate-500 md:text-base">
              {callStatus === "active"
                ? entity.slug === "c37"
                  ? "I can help you find a specialist or book physician workspace."
                  : "Ask me about doctors, clinics, or appointments in Dubai Healthcare City."
                : `Tap below to start your conversation with ${entity.agentName}.`}
            </p>
          </div>

          <CallControls
            entity={entity}
            callStatus={callStatus}
            onStart={() => { setError(null); startCall(); }}
            onEnd={endCall}
            error={error}
          />
        </section>

        <section className="flex min-h-[480px] flex-col md:min-h-[560px]">
          <div className="card-elevated flex flex-1 flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div className="flex items-center gap-2">
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-full text-sm"
                  style={{ backgroundColor: entity.theme.chip, color: entity.theme.primaryLight }}
                >
                  ✦
                </span>
                <h2 className="text-base font-semibold text-[#0B1F3A]">Booking &amp; Assistance</h2>
              </div>
            </div>
            <div className="flex flex-1 flex-col p-5">
              <AgenticPanel uiState={uiState} theme={entity.theme} entitySlug={entity.slug} />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-5 py-3 text-xs text-slate-400">
              <span>Secure medical environment</span>
              <span>{entity.locationLabel}</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
