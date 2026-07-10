import { NextRequest, NextResponse } from "next/server";
import {
  buildSlots,
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
        { success: false, error: "Workspace slots are only available for C37" },
        { status: 400 }
      );
    }

    const slots = buildSlots(payload.args);
    const available = slots.filter((s) => s.available);

    setUiState(callId, {
      action: "SHOW_WORKSPACE_SLOTS",
      slots,
      ...syncWorkspaceFromArgs(payload.args),
    });

    return NextResponse.json({
      success: true,
      available_slots: available.map((s) => s.time),
      billing_period: typeof payload.args.billing_period === "string" ? payload.args.billing_period : "daily",
      message: `Displayed ${available.length} available workspace time slots on the caller's screen.`,
    });
  } catch (error) {
    console.error("show-workspace-slots error:", error);
    return NextResponse.json({ success: false, error: "Failed to show workspace slots" }, { status: 500 });
  }
}
