"use client";

import { useEffect, useRef, useState } from "react";
import type { EntitySlug } from "@/lib/entities";
import {
  analyzeConversation,
  buildBookingReference,
  createInitialContext,
  type ConversationContext,
} from "@/lib/conversation-intent";
import type { TranscriptMessage } from "@/lib/transcript";
import type { DoctorCard, UiSessionState } from "@/lib/types";

async function fetchDoctorsFromAgent(entity: EntitySlug, agentText?: string): Promise<DoctorCard[]> {
  const params = new URLSearchParams({ entity, type: "doctors" });
  if (agentText) params.set("agent_text", agentText);
  const res = await fetch(`/api/mock-data?${params}`);
  const data = await res.json();
  return data.doctors ?? [];
}

export function useConversationUi(
  messages: TranscriptMessage[],
  entity: EntitySlug,
  active: boolean,
  agentTurn: number
) {
  const [uiState, setUiState] = useState<UiSessionState | null>(null);
  const contextRef = useRef<ConversationContext>(createInitialContext());
  const lastFingerprintRef = useRef("");
  const lastAgentTurnRef = useRef(0);
  const bookingRefRef = useRef<string | null>(null);
  const uiStateRef = useRef<UiSessionState | null>(null);

  useEffect(() => {
    uiStateRef.current = uiState;
  }, [uiState]);

  useEffect(() => {
    if (!active) {
      setUiState(null);
      uiStateRef.current = null;
      contextRef.current = createInitialContext();
      lastFingerprintRef.current = "";
      lastAgentTurnRef.current = 0;
      bookingRefRef.current = null;
    }
  }, [active]);

  useEffect(() => {
    if (!active || messages.length === 0) return;

    const fingerprint = `${messages.map((m) => `${m.role}:${m.content}`).join("|")}|turn:${agentTurn}`;
    if (fingerprint === lastFingerprintRef.current) return;
    lastFingerprintRef.current = fingerprint;

    const agentJustSpoke = agentTurn > lastAgentTurnRef.current;
    lastAgentTurnRef.current = agentTurn;

    const { context, intent } = analyzeConversation(messages, contextRef.current, { agentJustSpoke });
    contextRef.current = context;

    if (!intent) return;

    const loadUi = async () => {
      const { action, query } = intent;

      if (action === "SHOW_DOCTOR_CARDS") {
        const doctors = await fetchDoctorsFromAgent(entity, query?.agentText);
        setUiState({ action, doctors, updatedAt: Date.now() });
        return;
      }

      if (action === "SHOW_CLINIC_LIST") {
        const params = new URLSearchParams({ entity, type: "clinics" });
        if (query?.specialty) params.set("specialty", query.specialty);
        if (query?.clinicName) params.set("name", query.clinicName);
        const res = await fetch(`/api/mock-data?${params}`);
        const data = await res.json();
        setUiState({ action, clinics: data.clinics ?? [], updatedAt: Date.now() });
        return;
      }

      if (action === "SHOW_TIME_SLOTS") {
        const params = new URLSearchParams({ entity, type: "slots" });
        if (context.preferredDate) params.set("date", context.preferredDate);
        const [slotRes, doctors] = await Promise.all([
          fetch(`/api/mock-data?${params}`),
          uiStateRef.current?.doctors?.length
            ? Promise.resolve(uiStateRef.current.doctors)
            : fetchDoctorsFromAgent(entity, query?.agentText ?? context.lastAgentDoctorText),
        ]);
        const data = await slotRes.json();
        setUiState((prev) => ({
          action,
          doctors: prev?.doctors?.length ? prev.doctors : doctors,
          slots: data.slots ?? [],
          updatedAt: Date.now(),
        }));
        return;
      }

      if (action === "SHOW_DIRECTIONS") {
        const params = new URLSearchParams({ entity, type: "directions" });
        if (query?.clinicName) params.set("name", query.clinicName);
        const res = await fetch(`/api/mock-data?${params}`);
        const data = await res.json();
        if (data.directions) {
          setUiState((prev) => ({
            action,
            doctors: prev?.doctors,
            slots: prev?.slots,
            directions: data.directions,
            updatedAt: Date.now(),
          }));
        }
        return;
      }

      if (action === "SHOW_BOOKING_CONFIRMATION") {
        if (!bookingRefRef.current) {
          bookingRefRef.current = buildBookingReference(entity);
        }
        const selectedId = uiStateRef.current?.selectedDoctorId ?? uiStateRef.current?.doctors?.[0]?.id;
        const params = new URLSearchParams({ entity, type: "booking" });
        if (selectedId) params.set("doctor_id", selectedId);
        const res = await fetch(`/api/mock-data?${params}`);
        const data = await res.json();
        const prevDoc =
          uiStateRef.current?.doctors?.find((d) => d.id === selectedId) ?? uiStateRef.current?.doctors?.[0];
        setUiState((prev) => ({
          action,
          doctors: prev?.doctors,
          selectedDoctorId: selectedId ?? prev?.selectedDoctorId,
          slots: prev?.slots,
          booking: {
            reference: bookingRefRef.current!,
            doctorName: data.doctorName ?? prevDoc?.name ?? "Your Doctor",
            clinicName: data.clinicName ?? prevDoc?.clinicName ?? "DHCC Facility",
            date: context.preferredDate ?? new Date().toISOString().split("T")[0],
            time: context.preferredTime ?? "10:00",
            patientName: context.patientName ?? "Guest",
          },
          updatedAt: Date.now(),
        }));
      }
    };

    loadUi();
  }, [messages, entity, active, agentTurn]);

  return uiState;
}
