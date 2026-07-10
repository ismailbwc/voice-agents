"use client";

import type { EntityTheme } from "@/lib/entities";
import type { UiSessionState, WorkspaceType } from "@/lib/types";

interface AgenticPanelProps {
  uiState: UiSessionState | null;
  theme: EntityTheme;
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

export function AgenticPanel({ uiState, theme }: AgenticPanelProps) {
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
    return (
      <div className="flex h-full min-h-[360px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 p-6 text-center text-sm text-white/40">
        <p>Start a call and ask about doctors, clinics, workspace, or appointments</p>
        <p className="mt-2 text-xs text-white/30">Booking cards and confirmations appear here as you talk</p>
      </div>
    );
  }

  if (doctorsPending) {
    return (
      <div className="flex h-full min-h-[360px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 p-6 text-center text-sm text-white/40">
        <p>No matching doctors found in our directory for what the agent mentioned.</p>
        <p className="mt-2 text-xs text-white/30">Try asking again — the agent may suggest doctors listed in our CSV data.</p>
      </div>
    );
  }

  if (workspacesPending) {
    return (
      <div className="flex h-full min-h-[360px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 p-6 text-center text-sm text-white/40">
        <p>No matching workspaces found for that request.</p>
        <p className="mt-2 text-xs text-white/30">Try Oud Metha or Al Jaddaf, and a room type like consulting room or exam room.</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto rounded-2xl border border-white/10 bg-white/5 p-4">
      {uiState.membership && (
        <div className="rounded-xl border p-4" style={{ borderColor: theme.accent, backgroundColor: theme.primary + "15" }}>
          <p className="text-xs uppercase tracking-wider text-white/60">For Physicians</p>
          <h3 className="mt-1 font-semibold text-white">{uiState.membership.title}</h3>
          <p className="mt-2 text-sm text-white/70">{uiState.membership.pricingModel}</p>
          <ul className="mt-3 space-y-1.5 text-sm text-white/80">
            {uiState.membership.highlights.map((item) => (
              <li key={item} className="flex gap-2">
                <span style={{ color: theme.accent }}>•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-wrap gap-3 text-xs">
            <a
              href={uiState.membership.applyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg px-3 py-2 font-medium text-white"
              style={{ backgroundColor: theme.primary }}
            >
              Apply at c37.ae
            </a>
            <span className="rounded-lg bg-white/10 px-3 py-2 text-white/70">{uiState.membership.phone}</span>
          </div>
        </div>
      )}

      {uiState.doctors && uiState.doctors.length > 0 && (
        <>
          <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: theme.accent }}>
            Doctors Found
          </h3>
          <div className="grid gap-3">
            {uiState.doctors.map((doc) => {
              const isSelected = uiState.selectedDoctorId === doc.id;
              return (
              <div
                key={doc.id}
                className="rounded-xl border bg-white/5 p-3"
                style={{
                  borderColor: isSelected ? theme.accent : "rgba(255,255,255,0.1)",
                  boxShadow: isSelected ? `0 0 0 1px ${theme.accent}55` : undefined,
                }}
              >
                <p className="font-medium text-white">{doc.name}</p>
                <p className="text-xs text-white/60">{doc.title} · {doc.specialty}</p>
                <p className="mt-1 text-xs text-white/50">{doc.clinicName}</p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full px-2 py-0.5" style={{ backgroundColor: theme.primary + "33", color: theme.primaryLight }}>
                    ★ {doc.rating}
                  </span>
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-white/70">
                    AED {doc.fee}
                  </span>
                  {doc.languages.map((l) => (
                    <span key={l} className="rounded-full bg-white/10 px-2 py-0.5 text-white/60">{l}</span>
                  ))}
                </div>
              </div>
            );
            })}
          </div>
        </>
      )}

      {uiState.workspaces && uiState.workspaces.length > 0 && (
        <>
          <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: theme.accent }}>
            Available Workspaces
          </h3>
          <div className="grid gap-3">
            {uiState.workspaces.map((ws) => {
              const isSelected = uiState.selectedWorkspaceId === ws.id;
              return (
                <div
                  key={ws.id}
                  className="rounded-xl border bg-white/5 p-3"
                  style={{
                    borderColor: isSelected ? theme.accent : "rgba(255,255,255,0.1)",
                    boxShadow: isSelected ? `0 0 0 1px ${theme.accent}55` : undefined,
                  }}
                >
                  <p className="font-medium text-white">{ws.name}</p>
                  <p className="text-xs text-white/60">
                    {workspaceTypeLabel(ws.type)} · Floor {ws.floor} · {ws.facilityName}
                  </p>
                  <p className="mt-1 text-xs text-white/50">Capacity {ws.capacity} · {ws.availabilityDays.join(", ")}</p>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full px-2 py-0.5" style={{ backgroundColor: theme.primary + "33", color: theme.primaryLight }}>
                      AED {ws.rateDaily}/day
                    </span>
                    <span className="rounded-full bg-white/10 px-2 py-0.5 text-white/70">
                      AED {ws.rateWeekly}/week
                    </span>
                    <span className="rounded-full bg-white/10 px-2 py-0.5 text-white/70">
                      AED {ws.rateMonthly}/mo
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {ws.amenities.slice(0, 4).map((a) => (
                      <span key={a} className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-white/60">{a}</span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {uiState.clinics && uiState.clinics.length > 0 && (
        <>
          <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: theme.accent }}>
            Clinics & Facilities
          </h3>
          {uiState.clinics.map((clinic) => (
            <div key={clinic.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
              <p className="font-medium text-white">{clinic.name}</p>
              <p className="mt-1 text-xs text-white/60">{clinic.address}</p>
              <p className="text-xs text-white/50">{clinic.hours}</p>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${clinic.latitude},${clinic.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-xs font-medium underline"
                style={{ color: theme.accent }}
              >
                Get Directions
              </a>
            </div>
          ))}
        </>
      )}

      {uiState.slots && uiState.slots.length > 0 && (
        <>
          <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: theme.accent }}>
            {uiState.action === "SHOW_WORKSPACE_SLOTS" ? "Workspace Availability" : "Available Slots"}
          </h3>
          <div className="flex flex-wrap gap-2">
            {uiState.slots.filter((s) => s.available).map((slot) => (
              <span
                key={slot.time}
                className="rounded-lg border px-3 py-2 text-xs text-white"
                style={{ borderColor: theme.primary, backgroundColor: theme.primary + "22" }}
              >
                {slot.time.split(" ")[1]}
              </span>
            ))}
          </div>
        </>
      )}

      {uiState.booking && (
        <div className="rounded-xl border p-4" style={{ borderColor: theme.accent, backgroundColor: theme.primary + "15" }}>
          <p className="text-xs uppercase tracking-wider text-white/60">Booking Confirmed</p>
          <p className="mt-2 text-2xl font-bold" style={{ color: theme.accent }}>
            {uiState.booking.reference}
          </p>
          <div className="mt-3 space-y-1 text-sm text-white/80">
            <p><span className="text-white/50">Patient:</span> {uiState.booking.patientName}</p>
            <p><span className="text-white/50">Doctor:</span> {uiState.booking.doctorName}</p>
            <p><span className="text-white/50">Clinic:</span> {uiState.booking.clinicName}</p>
            <p><span className="text-white/50">When:</span> {uiState.booking.date} at {uiState.booking.time}</p>
          </div>
        </div>
      )}

      {uiState.workspaceBooking && (
        <div className="rounded-xl border p-4" style={{ borderColor: theme.accent, backgroundColor: theme.primary + "15" }}>
          <p className="text-xs uppercase tracking-wider text-white/60">Workspace Reserved</p>
          <p className="mt-2 text-2xl font-bold" style={{ color: theme.accent }}>
            {uiState.workspaceBooking.reference}
          </p>
          <div className="mt-3 space-y-1 text-sm text-white/80">
            <p><span className="text-white/50">Physician:</span> {uiState.workspaceBooking.physicianName}</p>
            <p><span className="text-white/50">Workspace:</span> {uiState.workspaceBooking.workspaceName}</p>
            <p><span className="text-white/50">Facility:</span> {uiState.workspaceBooking.facilityName}</p>
            <p><span className="text-white/50">Start:</span> {uiState.workspaceBooking.date}</p>
            <p>
              <span className="text-white/50">Plan:</span>{" "}
              {billingLabel(uiState.workspaceBooking.billingPeriod)} · AED {uiState.workspaceBooking.rateAed}
            </p>
          </div>
        </div>
      )}

      {uiState.directions && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <h3 className="font-medium text-white">{uiState.directions.name}</h3>
          <p className="mt-2 text-sm text-white/70">{uiState.directions.address}</p>
          <p className="mt-1 text-sm text-white/50">{uiState.directions.phone}</p>
          <a
            href={uiState.directions.mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-block rounded-lg px-4 py-2 text-sm font-medium text-white"
            style={{ backgroundColor: theme.primary }}
          >
            Open in Maps
          </a>
        </div>
      )}
    </div>
  );
}
