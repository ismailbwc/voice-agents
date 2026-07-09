import { NextRequest, NextResponse } from "next/server";
import { buildDoctorCards, getEntityFromPayload, type RetellToolPayload } from "@/lib/retell-tools";
import { setUiState } from "@/lib/ui-session-store";

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as RetellToolPayload;
    const entity = getEntityFromPayload(payload);
    const callId = payload.call.call_id;
    const doctors = buildDoctorCards(entity, payload.args);

    setUiState(callId, { action: "SHOW_DOCTOR_CARDS", doctors });

    return NextResponse.json({
      success: true,
      displayed: doctors.length,
      doctors: doctors.map((d) => ({
        id: d.id,
        name: d.name,
        specialty: d.specialty,
        clinic: d.clinicName,
        fee_aed: d.fee,
      })),
      message:
        doctors.length > 0
          ? `Displayed ${doctors.length} doctor card(s) on the patient's screen.`
          : "No matching doctors found in directory for those IDs.",
    });
  } catch (error) {
    console.error("show-doctor-cards error:", error);
    return NextResponse.json({ success: false, error: "Failed to show doctor cards" }, { status: 500 });
  }
}
