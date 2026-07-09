import { NextRequest, NextResponse } from "next/server";
import { buildSlots, getEntityFromPayload, syncDoctorFromArgs, type RetellToolPayload } from "@/lib/retell-tools";
import { setUiState } from "@/lib/ui-session-store";

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as RetellToolPayload;
    const entity = getEntityFromPayload(payload);
    const callId = payload.call.call_id;
    const slots = buildSlots(payload.args);
    const available = slots.filter((s) => s.available);

    setUiState(callId, { action: "SHOW_TIME_SLOTS", slots, ...syncDoctorFromArgs(entity, payload.args) });

    return NextResponse.json({
      success: true,
      available_slots: available.map((s) => s.time),
      message: `Displayed ${available.length} available time slots on the patient's screen.`,
    });
  } catch (error) {
    console.error("show-time-slots error:", error);
    return NextResponse.json({ success: false, error: "Failed to show time slots" }, { status: 500 });
  }
}
