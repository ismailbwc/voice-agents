import { NextRequest, NextResponse } from "next/server";
import { buildMembershipInfo, getEntityFromPayload, type RetellToolPayload } from "@/lib/retell-tools";
import { setUiState } from "@/lib/ui-session-store";

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as RetellToolPayload;
    const entity = getEntityFromPayload(payload, "c37");
    const callId = payload.call.call_id;

    if (entity !== "c37") {
      return NextResponse.json(
        { success: false, error: "Membership overview is only available for C37" },
        { status: 400 }
      );
    }

    const membership = buildMembershipInfo(payload.args);
    setUiState(callId, { action: "SHOW_MEMBERSHIP", membership });

    return NextResponse.json({
      success: true,
      message: "Displayed C37 membership overview on the caller's screen.",
      details: membership,
    });
  } catch (error) {
    console.error("show-membership-overview error:", error);
    return NextResponse.json({ success: false, error: "Failed to show membership" }, { status: 500 });
  }
}
