import { NextRequest, NextResponse } from "next/server";
import {
  buildWorkspaceBooking,
  getEntityFromPayload,
  syncWorkspaceFromArgs,
  type RetellToolPayload,
} from "@/lib/retell-tools";
import { setUiState } from "@/lib/ui-session-store";

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as RetellToolPayload;
    const entity = getEntityFromPayload(payload, "c37");
    const callId = payload.call.call_id;

    if (entity !== "c37") {
      return NextResponse.json(
        { success: false, error: "Workspace booking is only available for C37" },
        { status: 400 }
      );
    }

    const workspaceBooking = buildWorkspaceBooking(payload.args);

    setUiState(callId, {
      action: "SHOW_WORKSPACE_BOOKING",
      workspaceBooking,
      ...syncWorkspaceFromArgs(payload.args),
    });

    return NextResponse.json({
      success: true,
      booking_reference: workspaceBooking.reference,
      message: `Workspace reservation confirmed. Reference ${workspaceBooking.reference} displayed on screen.`,
      details: workspaceBooking,
    });
  } catch (error) {
    console.error("show-workspace-booking error:", error);
    return NextResponse.json({ success: false, error: "Failed to show workspace booking" }, { status: 500 });
  }
}
