import { NextRequest, NextResponse } from "next/server";
import { buildDoctorCards, getEntityFromPayload, type RetellToolPayload } from "@/lib/retell-tools";
import { setUiState } from "@/lib/ui-session-store";

const DEBUG_DOCTOR_CARDS = process.env.NODE_ENV !== "production";

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as RetellToolPayload;
    const entity = getEntityFromPayload(payload);
    const callId = payload.call.call_id;
    const doctors = buildDoctorCards(entity, payload.args);

    if (DEBUG_DOCTOR_CARDS) {
      console.log("[show-doctor-cards] request", {
        functionName: payload.name,
        callId,
        entity,
        args: payload.args,
        matchedCount: doctors.length,
        matchedDoctors: doctors.map((doctor) => ({
          id: doctor.id,
          name: doctor.name,
          specialty: doctor.specialty,
        })),
      });
    }

    setUiState(callId, {
      action: "SHOW_DOCTOR_CARDS",
      doctors,
      selectedDoctorId: doctors.length === 1 ? doctors[0].id : undefined,
    });

    const message =
      doctors.length > 0
        ? `Displayed ${doctors.length} doctor card(s) on the patient's screen.`
        : `No matching doctors found in directory for entity ${entity}. Check doctor_ids/doctor_names/specialty in function args.`;

    if (DEBUG_DOCTOR_CARDS && doctors.length === 0) {
      console.warn("[show-doctor-cards] empty match", {
        callId,
        entity,
        args: payload.args,
      });
    }

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
      message,
    });
  } catch (error) {
    console.error("show-doctor-cards error:", error);
    return NextResponse.json({ success: false, error: "Failed to show doctor cards" }, { status: 500 });
  }
}
