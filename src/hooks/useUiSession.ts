"use client";

import { useEffect, useRef, useState } from "react";
import type { UiSessionState } from "@/lib/types";

const DEBUG_UI_SESSION = process.env.NODE_ENV !== "production";

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
        if (DEBUG_UI_SESSION) {
          console.log("[useUiSession] polled", {
            callId,
            action: data.action,
            updatedAt: data.updatedAt,
            doctorCount: data.doctors?.length ?? 0,
            slotCount: data.slots?.length ?? 0,
          });
        }
        if (cancelled || data.action === "CLEAR") return;
        if (data.updatedAt > lastUpdatedRef.current) {
          const previousUpdatedAt = lastUpdatedRef.current;
          lastUpdatedRef.current = data.updatedAt;
          if (DEBUG_UI_SESSION) {
            console.log("[useUiSession] applying update", {
              callId,
              previousUpdatedAt,
              nextUpdatedAt: data.updatedAt,
              action: data.action,
              doctorCount: data.doctors?.length ?? 0,
            });
          }
          setUiState((prev) => {
            const next = { ...prev, ...data };
            if (data.action === "SHOW_DOCTOR_CARDS") {
              next.doctors = data.doctors ?? [];
            }
            return next;
          });
        } else if (DEBUG_UI_SESSION) {
          console.log("[useUiSession] skipped stale update", {
            callId,
            currentUpdatedAt: lastUpdatedRef.current,
            incomingUpdatedAt: data.updatedAt,
            action: data.action,
          });
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
