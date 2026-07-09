"use client";

import { useEffect, useRef, useState } from "react";
import type { UiSessionState } from "@/lib/types";

export function useUiSession(callId: string | null, active: boolean) {
  const [uiState, setUiState] = useState<UiSessionState | null>(null);
  const lastUpdatedRef = useRef(0);

  useEffect(() => {
    if (!active || !callId) {
      setUiState(null);
      lastUpdatedRef.current = 0;
      return;
    }

    let cancelled = false;

    const poll = async () => {
      try {
        const res = await fetch(`/api/ui-state/${callId}`);
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as UiSessionState;
        if (cancelled || data.action === "CLEAR") return;
        if (data.updatedAt > lastUpdatedRef.current) {
          lastUpdatedRef.current = data.updatedAt;
          setUiState((prev) => ({
            ...prev,
            ...data,
            doctors: data.doctors ?? prev?.doctors,
            slots: data.slots ?? prev?.slots,
          }));
        }
      } catch {
        // ignore poll errors during call
      }
    };

    poll();
    const interval = setInterval(poll, 700);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [callId, active]);

  useEffect(() => {
    if (!callId || active) return;
    fetch(`/api/ui-state/${callId}`, { method: "DELETE" }).catch(() => {});
  }, [callId, active]);

  return uiState;
}
