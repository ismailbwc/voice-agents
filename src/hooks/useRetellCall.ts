"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { RetellWebClient } from "retell-client-js-sdk";
import { normalizeTranscript, parseTranscriptMessages, type TranscriptMessage } from "@/lib/transcript";
import type { EntitySlug } from "@/lib/entities";
import type { CallStatus, VoiceState } from "@/lib/types";

interface UseRetellCallOptions {
  entity: EntitySlug;
  onError?: (error: string) => void;
}

export function useRetellCall({ entity, onError }: UseRetellCallOptions) {
  const clientRef = useRef<RetellWebClient | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const micAnalyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const [callStatus, setCallStatus] = useState<CallStatus>("idle");
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [callId, setCallId] = useState<string | null>(null);
  const [transcript, setTranscript] = useState("");
  const [messages, setMessages] = useState<TranscriptMessage[]>([]);
  const [agentTurn, setAgentTurn] = useState(0);
  const [agentAmplitude, setAgentAmplitude] = useState(0);
  const [userAmplitude, setUserAmplitude] = useState(0);

  const rafRef = useRef<number>(0);

  const stopMicAnalysis = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    micStreamRef.current?.getTracks().forEach((t) => t.stop());
    micStreamRef.current = null;
    micAnalyserRef.current = null;
    audioContextRef.current?.close();
    audioContextRef.current = null;
    setUserAmplitude(0);
  }, []);

  const startMicAnalysis = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      const ctx = new AudioContext();
      audioContextRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      micAnalyserRef.current = analyser;

      const data = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        if (!micAnalyserRef.current) return;
        micAnalyserRef.current.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b, 0) / data.length;
        setUserAmplitude(avg / 128);
        rafRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch {
      onError?.("Microphone access denied. Please allow microphone to start talking.");
    }
  }, [onError]);

  const startCall = useCallback(async () => {
    try {
      setCallStatus("connecting");
      setVoiceState("processing");
      setTranscript("");
      setMessages([]);
      setAgentTurn(0);

      const res = await fetch("/api/retell/create-web-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entity }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to start call");
      }

      const data = await res.json();
      setCallId(data.call_id);

      const client = new RetellWebClient();
      clientRef.current = client;

      client.on("call_started", () => {
        setCallStatus("active");
        setVoiceState("listening");
        startMicAnalysis();
      });

      client.on("call_ended", () => {
        setCallStatus("ended");
        setVoiceState("idle");
        stopMicAnalysis();
        setAgentAmplitude(0);
      });

      client.on("agent_start_talking", () => setVoiceState("speaking"));
      client.on("agent_stop_talking", () => {
        setVoiceState("listening");
        setAgentTurn((t) => t + 1);
      });

      client.on("audio", (audio: Float32Array) => {
        const rms = Math.sqrt(audio.reduce((sum, v) => sum + v * v, 0) / audio.length);
        setAgentAmplitude(Math.min(1, rms * 8));
      });

      client.on("update", (update: { transcript?: unknown }) => {
        const parsed = parseTranscriptMessages(update.transcript);
        if (parsed.length > 0) {
          setMessages(parsed);
          setTranscript(normalizeTranscript(parsed));
        }
      });

      client.on("error", (error: Error) => {
        const msg = error.message?.toLowerCase() ?? "";
        if (msg.includes("closed peer connection") || msg.includes("createoffer")) {
          console.warn("Retell WebRTC warning:", error.message);
          return;
        }
        console.error("Retell client error:", error);
        onError?.(error.message);
      });

      await client.startCall({
        accessToken: data.access_token,
        emitRawAudioSamples: true,
        sampleRate: 24000,
      });
    } catch (err) {
      setCallStatus("error");
      onError?.(err instanceof Error ? err.message : "Call failed");
    }
  }, [entity, onError, startMicAnalysis, stopMicAnalysis]);

  const endCall = useCallback(() => {
    clientRef.current?.stopCall();
    clientRef.current = null;
    stopMicAnalysis();
    setCallStatus("ended");
    setVoiceState("idle");
    setAgentAmplitude(0);
  }, [stopMicAnalysis]);

  useEffect(() => {
    return () => {
      clientRef.current?.stopCall();
      stopMicAnalysis();
    };
  }, [stopMicAnalysis]);

  return {
    callStatus,
    voiceState,
    callId,
    transcript,
    messages,
    agentTurn,
    agentAmplitude,
    userAmplitude,
    startCall,
    endCall,
  };
}
