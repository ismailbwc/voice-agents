import { NextRequest, NextResponse } from "next/server";
import { buildWorkspaceCards, getEntityFromPayload, type RetellToolPayload } from "@/lib/retell-tools";
import { setUiState } from "@/lib/ui-session-store";

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as RetellToolPayload;
    const entity = getEntityFromPayload(payload, "c37");
    const callId = payload.call.call_id;

    if (entity !== "c37") {
      return NextResponse.json(
        { success: false, error: "Workspace cards are only available for C37" },
        { status: 400 }
      );
    }

    const workspaces = buildWorkspaceCards(payload.args);
    setUiState(callId, {
      action: "SHOW_WORKSPACE_CARDS",
      workspaces,
      selectedWorkspaceId: workspaces.length === 1 ? workspaces[0].id : undefined,
    });

    return NextResponse.json({
      success: true,
      displayed: workspaces.length,
      workspaces: workspaces.map((w) => ({
        id: w.id,
        name: w.name,
        type: w.type,
        facility: w.facilityName,
        rate_daily_aed: w.rateDaily,
        rate_weekly_aed: w.rateWeekly,
        rate_monthly_aed: w.rateMonthly,
      })),
      message:
        workspaces.length > 0
          ? `Displayed ${workspaces.length} workspace card(s) on the caller's screen.`
          : "No matching workspaces found. Check workspace_ids, facility_id, or type.",
    });
  } catch (error) {
    console.error("show-workspace-cards error:", error);
    return NextResponse.json({ success: false, error: "Failed to show workspace cards" }, { status: 500 });
  }
}
