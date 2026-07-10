"use client";

import { useEffect, useState } from "react";
import Lottie from "lottie-react";
import { LoaderCircle, Sparkles } from "lucide-react";
import successCheck from "@/assets/lottie/success-check.json";

type RevealPhase = "booking" | "success" | "done";

interface BookingRevealProps {
  /** Changes when a new booking arrives — restarts the animation. */
  bookingKey: string;
  children: React.ReactNode;
  bookingLabel?: string;
}

export function BookingReveal({
  bookingKey,
  children,
  bookingLabel = "AI is booking for you…",
}: BookingRevealProps) {
  const [phase, setPhase] = useState<RevealPhase>("booking");

  useEffect(() => {
    setPhase("booking");
    const toSuccess = window.setTimeout(() => setPhase("success"), 1800);
    const toDone = window.setTimeout(() => setPhase("done"), 3200);
    return () => {
      window.clearTimeout(toSuccess);
      window.clearTimeout(toDone);
    };
  }, [bookingKey]);

  if (phase === "booking") {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-10 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-600">
          <LoaderCircle className="h-7 w-7 animate-spin" strokeWidth={2.25} />
        </div>
        <div className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-[#0B1F3A]">
          <Sparkles className="h-4 w-4 text-blue-500" />
          {bookingLabel}
        </div>
        <p className="max-w-xs text-xs text-slate-500">
          Confirming your details and preparing your reference…
        </p>
        <div className="mt-5 flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-2 w-2 animate-pulse rounded-full bg-blue-400"
              style={{ animationDelay: `${i * 180}ms` }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (phase === "success") {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50/60 px-4 py-8 text-center">
        <div className="h-28 w-28">
          <Lottie animationData={successCheck} loop={false} />
        </div>
        <p className="mt-1 text-base font-semibold text-emerald-700">All set!</p>
        <p className="mt-1 text-xs text-emerald-600/80">Your booking is confirmed</p>
      </div>
    );
  }

  return <>{children}</>;
}
