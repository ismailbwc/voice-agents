import { NextRequest, NextResponse } from "next/server";
import { buildBooking, getEntityFromPayload, syncDoctorFromArgs, type RetellToolPayload } from "@/lib/retell-tools";
import { setUiState } from "@/lib/ui-session-store";

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as RetellToolPayload;
    const entity = getEntityFromPayload(payload);
    const callId = payload.call.call_id;
    const booking = buildBooking(entity, payload.args);

    setUiState(callId, {
      action: "SHOW_BOOKING_CONFIRMATION",
      booking,
      ...syncDoctorFromArgs(entity, payload.args),
    });

    return NextResponse.json({
      success: true,
      booking_reference: booking.reference,
      message: `Booking confirmed. Reference ${booking.reference} displayed on screen.`,
      details: booking,
    });
  } catch (error) {
    console.error("show-booking-confirmation error:", error);
    return NextResponse.json({ success: false, error: "Failed to show booking" }, { status: 500 });
  }
}
