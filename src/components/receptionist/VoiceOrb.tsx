"use client";

import { useEffect, useRef } from "react";
import type { EntityTheme } from "@/lib/entities";
import type { VoiceState } from "@/lib/types";

interface VoiceOrbProps {
  theme: EntityTheme;
  voiceState: VoiceState;
  agentAmplitude: number;
  userAmplitude: number;
}

export function VoiceOrb({ theme, voiceState, agentAmplitude, userAmplitude }: VoiceOrbProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let frame: number;
    let t = 0;

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;
      const amp = voiceState === "speaking" ? agentAmplitude : voiceState === "listening" ? userAmplitude : 0.15;
      const color = voiceState === "speaking" ? theme.orbSpeaking : theme.orbListening;

      ctx.clearRect(0, 0, w, h);

      for (let i = 4; i >= 0; i--) {
        const radius = 60 + i * 28 + amp * 40 + Math.sin(t + i) * 6;
      const alpha = Math.max(0, 0.15 - i * 0.025);
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      const bars = 32;
      for (let i = 0; i < bars; i++) {
        const angle = (i / bars) * Math.PI * 2 + t;
        const barAmp = amp * (0.5 + Math.sin(t * 3 + i * 0.5) * 0.5);
        const innerR = 90 + barAmp * 30;
        const outerR = innerR + 12 + barAmp * 25;
        const x1 = cx + Math.cos(angle) * innerR;
        const y1 = cy + Math.sin(angle) * innerR;
        const x2 = cx + Math.cos(angle) * outerR;
        const y2 = cy + Math.sin(angle) * outerR;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = color;
        ctx.globalAlpha = 0.4 + barAmp * 0.6;
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      t += 0.04;
      frame = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(frame);
  }, [theme, voiceState, agentAmplitude, userAmplitude]);

  return (
    <canvas
      ref={canvasRef}
      width={400}
      height={400}
      className="absolute inset-0 h-full w-full"
      aria-hidden
    />
  );
}
