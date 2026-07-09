import { NextRequest, NextResponse } from "next/server";
import { buildDirections, getEntityFromPayload, type RetellToolPayload } from "@/lib/retell-tools";
import { setUiState } from "@/lib/ui-session-store";

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as RetellToolPayload;
    const entity = getEntityFromPayload(payload);
    const callId = payload.call.call_id;
    const directions = buildDirections(entity, payload.args);

    if (!directions) {
      return NextResponse.json({ success: false, error: "Clinic not found" }, { status: 404 });
    }

    setUiState(callId, { action: "SHOW_DIRECTIONS", directions });

    return NextResponse.json({
      success: true,
      name: directions.name,
      address: directions.address,
      phone: directions.phone,
      message: `Directions to ${directions.name} displayed on the patient's screen.`,
    });
  } catch (error) {
    console.error("show-directions error:", error);
    return NextResponse.json({ success: false, error: "Failed to show directions" }, { status: 500 });
  }
}
