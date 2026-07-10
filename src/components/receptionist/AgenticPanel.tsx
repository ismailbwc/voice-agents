"use client";

import Image from "next/image";
import type { EntitySlug, EntityTheme } from "@/lib/entities";
import type { UiSessionState, WorkspaceType } from "@/lib/types";

interface AgenticPanelProps {
  uiState: UiSessionState | null;
  theme: EntityTheme;
  entitySlug: EntitySlug;
}

function workspaceTypeLabel(type: WorkspaceType): string {
  if (type === "exam_room") return "Exam Room";
  if (type === "private_office") return "Private Office";
  return "Consulting Room";
}

function billingLabel(period: string): string {
  if (period === "weekly") return "Weekly";
  if (period === "monthly") return "Monthly";
  return "Daily";
}

const DHCC_SUGGESTIONS = [
  "Find a cardiologist nearby",
  "What are the clinic hours?",
  "Book an appointment",
  "Directions to Mediclinic",
];

const C37_SUGGESTIONS = [
  "Find a plastic surgeon",
  "Book a consulting room",
  "What is C37 membership?",
  "Directions to Oud Metha",
];

export function AgenticPanel({ uiState, theme, entitySlug }: AgenticPanelProps) {
  const hasContent =
    uiState &&
    uiState.action !== "CLEAR" &&
    ((uiState.doctors?.length ?? 0) > 0 ||
      (uiState.clinics?.length ?? 0) > 0 ||
      (uiState.slots?.length ?? 0) > 0 ||
      (uiState.workspaces?.length ?? 0) > 0 ||
      uiState.booking ||
      uiState.workspaceBooking ||
      uiState.membership ||
      uiState.directions);

  const doctorsPending =
    uiState?.action === "SHOW_DOCTOR_CARDS" && (uiState.doctors?.length ?? 0) === 0;

  const workspacesPending =
    uiState?.action === "SHOW_WORKSPACE_CARDS" && (uiState.workspaces?.length ?? 0) === 0;

  if (!hasContent && !doctorsPending && !workspacesPending) {
    const suggestions = entitySlug === "c37" ? C37_SUGGESTIONS : DHCC_SUGGESTIONS;
    return (
      <div className="flex h-full flex-col items-center justify-center px-2 py-6 text-center">
        <div
          className="mb-4 flex h-16 w-16 items-center justify-center rounded-full"
          style={{ backgroundColor: theme.chip, color: theme.primaryLight }}
        >
          <ChatIcon />
        </div>
        <h3 className="text-lg font-semibold text-[#0B1F3A]">How can I help you today?</h3>
        <p className="mt-2 max-w-sm text-sm text-slate-500">
          {entitySlug === "c37"
            ? "Ask about C37 doctors, membership, or booking consulting rooms and exam spaces."
            : "Ask about doctors, clinics, or appointments in Dubai Healthcare City."}
        </p>
        <div className="mt-6 flex w-full max-w-sm flex-col gap-2">
          {suggestions.map((text) => (
            <div
              key={text}
              className="rounded-full px-4 py-2.5 text-left text-sm font-medium"
              style={{ backgroundColor: theme.chip, color: theme.primary }}
            >
              &ldquo;{text}&rdquo;
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (doctorsPending) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-4 text-center text-sm text-slate-500">
        <p>No matching doctors found in our directory for what the agent mentioned.</p>
        <p className="mt-2 text-xs">Try asking again with a specialty from our directory.</p>
      </div>
    );
  }

  if (workspacesPending) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-4 text-center text-sm text-slate-500">
        <p>No matching workspaces found for that request.</p>
        <p className="mt-2 text-xs">Try Oud Metha or Al Jaddaf, and a room type like consulting room.</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto">
      {uiState.membership && (
        <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
          <div className="mb-2 flex items-center gap-2">
            <span
              className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
              style={{ backgroundColor: theme.chip, color: theme.primaryLight }}
            >
              Physician Access
            </span>
          </div>
          <h3 className="font-semibold text-[#0B1F3A]">{uiState.membership.title}</h3>
          <p className="mt-2 text-sm text-slate-600">{uiState.membership.pricingModel}</p>
          <ul className="mt-3 space-y-1.5 text-sm text-slate-700">
            {uiState.membership.highlights.map((item) => (
              <li key={item} className="flex gap-2">
                <span style={{ color: theme.accent }}>•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <a
              href={uiState.membership.applyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full px-4 py-2 font-semibold text-white"
              style={{ backgroundColor: theme.accent }}
            >
              Apply at c37.ae
            </a>
            <span className="rounded-full bg-white px-3 py-2 text-slate-600 shadow-sm">
              {uiState.membership.phone}
            </span>
          </div>
        </div>
      )}

      {uiState.doctors && uiState.doctors.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#0B1F3A]">Matched Specialists</h3>
            <span
              className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
              style={{ backgroundColor: theme.chip, color: theme.primaryLight }}
            >
              High Match
            </span>
          </div>
          {uiState.doctors.map((doc) => {
            const isSelected = uiState.selectedDoctorId === doc.id;
            return (
              <div
                key={doc.id}
                className="rounded-2xl border bg-white p-3 shadow-sm"
                style={{
                  borderColor: isSelected ? theme.primaryLight : "rgba(15,23,42,0.08)",
                  boxShadow: isSelected ? `0 0 0 1px ${theme.primaryLight}33` : undefined,
                }}
              >
                <div className="flex gap-3">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                    <Image src={doc.imageUrl} alt={doc.name} fill className="object-cover" sizes="64px" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-[#0B1F3A]">{doc.name}</p>
                    <p className="text-xs text-slate-500">{doc.title} · {doc.specialty}</p>
                    <p className="mt-0.5 text-xs text-slate-400">{doc.clinicName}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-medium text-amber-600">★ {doc.rating}</span>
                      <span className="font-semibold" style={{ color: theme.primaryLight }}>
                        AED {doc.fee}
                      </span>
                      {doc.languages.slice(0, 3).map((l) => (
                        <span key={l} className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">
                          {l}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {uiState.workspaces && uiState.workspaces.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#0B1F3A]">C37 Workspaces</h3>
            <span
              className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
              style={{ backgroundColor: theme.chip, color: theme.accent }}
            >
              Physician Access
            </span>
          </div>
          {uiState.workspaces.map((ws) => {
            const isSelected = uiState.selectedWorkspaceId === ws.id;
            return (
              <div
                key={ws.id}
                className="overflow-hidden rounded-2xl border bg-white shadow-sm"
                style={{ borderColor: isSelected ? theme.accent : "rgba(15,23,42,0.08)" }}
              >
                <div className="relative h-28 w-full bg-slate-100">
                  <Image src={ws.imageUrl} alt={ws.name} fill className="object-cover" sizes="400px" />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3 text-white">
                    <p className="font-semibold">{ws.name}</p>
                    <p className="text-xs opacity-90">
                      {workspaceTypeLabel(ws.type)} · {ws.facilityName}
                    </p>
                  </div>
                </div>
                <div className="p-3">
                  <p className="text-xs text-slate-500">
                    Floor {ws.floor} · Capacity {ws.capacity} · {ws.availabilityDays.join(", ")}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full px-2 py-0.5 font-medium text-white" style={{ backgroundColor: theme.accent }}>
                      AED {ws.rateDaily}/day
                    </span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">
                      AED {ws.rateWeekly}/week
                    </span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">
                      AED {ws.rateMonthly}/mo
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {ws.amenities.slice(0, 4).map((a) => (
                      <span key={a} className="rounded-full bg-slate-50 px-2 py-0.5 text-[11px] text-slate-500">
                        {a}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {uiState.clinics && uiState.clinics.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-[#0B1F3A]">Clinics & Facilities</h3>
          {uiState.clinics.map((clinic) => (
            <div key={clinic.id} className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
              <div className="relative h-24 w-full bg-slate-100">
                <Image src={clinic.imageUrl} alt={clinic.name} fill className="object-cover" sizes="400px" />
              </div>
              <div className="p-3">
                <p className="font-semibold text-[#0B1F3A]">{clinic.name}</p>
                <p className="mt-1 text-xs text-slate-500">{clinic.address}</p>
                <p className="text-xs text-slate-400">{clinic.hours}</p>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${clinic.latitude},${clinic.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block text-xs font-semibold"
                  style={{ color: theme.primaryLight }}
                >
                  Get Directions
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {uiState.slots && uiState.slots.length > 0 && (
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            {uiState.action === "SHOW_WORKSPACE_SLOTS" ? "Workspace Availability" : "Available Today"}
          </h3>
          <div className="flex flex-wrap gap-2">
            {uiState.slots.filter((s) => s.available).map((slot, index) => (
              <span
                key={slot.time}
                className="rounded-full border px-3 py-2 text-xs font-semibold"
                style={
                  index === 0
                    ? { borderColor: theme.primaryLight, backgroundColor: theme.primaryLight, color: "#fff" }
                    : { borderColor: "#E2E8F0", color: theme.primary, backgroundColor: "#fff" }
                }
              >
                {slot.time.split(" ")[1]}
              </span>
            ))}
          </div>
        </div>
      )}

      {uiState.booking && (
        <div
          className="rounded-2xl border p-4"
          style={{ borderColor: `${theme.primaryLight}44`, backgroundColor: `${theme.chip}` }}
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Booking Confirmed</p>
          <p className="mt-2 text-2xl font-bold" style={{ color: theme.primaryLight }}>
            {uiState.booking.reference}
          </p>
          <div className="mt-3 space-y-1 text-sm text-slate-700">
            <p><span className="text-slate-400">Patient:</span> {uiState.booking.patientName}</p>
            <p><span className="text-slate-400">Doctor:</span> {uiState.booking.doctorName}</p>
            <p><span className="text-slate-400">Clinic:</span> {uiState.booking.clinicName}</p>
            <p><span className="text-slate-400">When:</span> {uiState.booking.date} at {uiState.booking.time}</p>
          </div>
        </div>
      )}

      {uiState.workspaceBooking && (
        <div
          className="rounded-2xl border p-4"
          style={{ borderColor: `${theme.accent}44`, backgroundColor: "#F0FDFA" }}
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Workspace Reserved</p>
          <p className="mt-2 text-2xl font-bold" style={{ color: theme.accent }}>
            {uiState.workspaceBooking.reference}
          </p>
          <div className="mt-3 space-y-1 text-sm text-slate-700">
            <p><span className="text-slate-400">Physician:</span> {uiState.workspaceBooking.physicianName}</p>
            <p><span className="text-slate-400">Workspace:</span> {uiState.workspaceBooking.workspaceName}</p>
            <p><span className="text-slate-400">Facility:</span> {uiState.workspaceBooking.facilityName}</p>
            <p><span className="text-slate-400">Start:</span> {uiState.workspaceBooking.date}</p>
            <p>
              <span className="text-slate-400">Plan:</span>{" "}
              {billingLabel(uiState.workspaceBooking.billingPeriod)} · AED {uiState.workspaceBooking.rateAed}
            </p>
          </div>
        </div>
      )}

      {uiState.directions && (
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          {uiState.directions.imageUrl && (
            <div className="relative h-28 w-full bg-slate-100">
              <Image
                src={uiState.directions.imageUrl}
                alt={uiState.directions.name}
                fill
                className="object-cover"
                sizes="400px"
              />
            </div>
          )}
          <div className="p-4">
            <h3 className="font-semibold text-[#0B1F3A]">{uiState.directions.name}</h3>
            <p className="mt-2 text-sm text-slate-600">{uiState.directions.address}</p>
            <p className="mt-1 text-sm text-slate-400">{uiState.directions.phone}</p>
            <a
              href={uiState.directions.mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-block rounded-full px-4 py-2 text-sm font-semibold text-white"
              style={{ backgroundColor: theme.primary }}
            >
              Open in Maps
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

function ChatIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M8 10h8M8 14h5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M21 12a8.5 8.5 0 0 1-11.5 8L4 21l1.2-4A8.5 8.5 0 1 1 21 12Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}
