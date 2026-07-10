import { NextRequest, NextResponse } from "next/server";
import { buildDoctorCards, getEntityFromPayload, type RetellToolPayload } from "@/lib/retell-tools";
import { setUiState } from "@/lib/ui-session-store";

function normalizeArgs(payload: RetellToolPayload & Record<string, unknown>): Record<string, unknown> {
  const raw = (payload.args ?? {}) as Record<string, unknown>;
  // Some Retell setups nest parameters; flatten common aliases.
  const args: Record<string, unknown> = { ...raw };

  if (!args.doctor_ids && raw.doctorIds) args.doctor_ids = raw.doctorIds;
  if (!args.doctor_names && raw.doctorNames) args.doctor_names = raw.doctorNames;

  // If args only sent a single string id
  if (typeof args.doctor_id === "string" && !args.doctor_ids) {
    args.doctor_ids = [args.doctor_id];
  }

  return args;
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as RetellToolPayload & Record<string, unknown>;
    const entity = getEntityFromPayload(payload);
    const callId = payload.call?.call_id;
    const args = normalizeArgs(payload);

    if (!callId) {
      console.error("[show-doctor-cards] missing call_id — is Payload: args only turned ON?", {
        keys: Object.keys(payload),
      });
      return NextResponse.json(
        {
          success: false,
          error: "Missing call.call_id. Turn OFF 'Payload: args only' in the Retell custom function.",
        },
        { status: 400 }
      );
    }

    const doctors = buildDoctorCards(entity, args);

    console.log("[show-doctor-cards]", {
      callId,
      entity,
      args,
      matchedCount: doctors.length,
      matchedDoctors: doctors.map((d) => ({ id: d.id, name: d.name, clinic: d.clinicName })),
    });

    setUiState(callId, {
      action: "SHOW_DOCTOR_CARDS",
      doctors,
      selectedDoctorId: doctors.length === 1 ? doctors[0].id : undefined,
    });

    const message =
      doctors.length > 0
        ? `Displayed ${doctors.length} doctor card(s) on the patient's screen.`
        : `No matching doctors found. For C37 partner referrals pass doctor_ids like ["dhcc-doc-003"] or specialty "Cardiology".`;

    return NextResponse.json({
      success: true,
      displayed: doctors.length,
      resolver_version: "c37-dhcc-referral-v1",
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
