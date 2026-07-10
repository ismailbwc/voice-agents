import { NextRequest, NextResponse } from "next/server";
import { buildBooking, getEntityFromPayload, syncDoctorFromArgs, type RetellToolPayload } from "@/lib/retell-tools";
import { setUiState } from "@/lib/ui-session-store";

function normalizeBookingArgs(payload: RetellToolPayload & Record<string, unknown>): Record<string, unknown> {
  const raw = (payload.args ?? {}) as Record<string, unknown>;
  const args: Record<string, unknown> = { ...raw };

  if (!args.doctor_id && typeof args.doctorId === "string") args.doctor_id = args.doctorId;
  if (!args.doctor_id && Array.isArray(args.doctor_ids) && args.doctor_ids.length > 0) {
    args.doctor_id = String(args.doctor_ids[0]);
  }
  if (!args.patient_name && typeof args.patientName === "string") args.patient_name = args.patientName;

  return args;
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as RetellToolPayload & Record<string, unknown>;
    const entity = getEntityFromPayload(payload);
    const callId = payload.call?.call_id;
    const args = normalizeBookingArgs(payload);

    if (!callId) {
      console.error("[show-booking-confirmation] missing call_id");
      return NextResponse.json(
        { success: false, error: "Missing call.call_id. Turn OFF 'Payload: args only'." },
        { status: 400 }
      );
    }

    const booking = buildBooking(entity, args);
    const doctorSync = syncDoctorFromArgs(entity, args);

    console.log("[show-booking-confirmation]", {
      callId,
      entity,
      args,
      booking,
      syncedDoctorId: doctorSync.selectedDoctorId ?? null,
    });

    setUiState(callId, {
      action: "SHOW_BOOKING_CONFIRMATION",
      booking,
      ...doctorSync,
    });

    return NextResponse.json({
      success: true,
      booking_reference: booking.reference,
      resolver_version: "c37-dhcc-referral-v1",
      message: `Booking confirmed. Reference ${booking.reference} displayed on screen.`,
      details: booking,
    });
  } catch (error) {
    console.error("show-booking-confirmation error:", error);
    return NextResponse.json({ success: false, error: "Failed to show booking" }, { status: 500 });
  }
}
