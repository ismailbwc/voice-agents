import type { EntitySlug } from "./entities";
import {
  generateBookingReference,
  generateMockSlots,
  getClinicById,
  loadClinics,
  loadDoctors,
  searchClinics,
  searchDoctors,
} from "./csv-loader";
import type { ClinicCard, DoctorCard, DoctorRow, DirectionsInfo, TimeSlot, UiSessionState } from "./types";

const DEBUG_RETELL_TOOLS = process.env.NODE_ENV !== "production";

function debugLog(label: string, payload: unknown) {
  if (!DEBUG_RETELL_TOOLS) return;
  console.log(`[retell-tools] ${label}`, payload);
}

export interface RetellToolPayload {
  name: string;
  call: { call_id: string; metadata?: { entity?: EntitySlug } };
  args: Record<string, unknown>;
}

export function getEntityFromPayload(payload: RetellToolPayload, fallback: EntitySlug = "dhcc"): EntitySlug {
  const entity = payload.call.metadata?.entity;
  return entity === "dhcc" || entity === "c37" ? entity : fallback;
}

export function toDoctorCard(entity: EntitySlug, doc: DoctorRow): DoctorCard {
  const clinic = getClinicById(entity, doc.clinic_id);
  return {
    id: doc.id,
    name: doc.name,
    title: doc.title,
    specialty: doc.specialty,
    clinicName: clinic?.name ?? doc.clinic_id,
    languages: doc.languages.split(",").map((l) => l.trim()),
    rating: parseFloat(doc.rating) || 4.5,
    fee: parseInt(doc.consultation_fee_aed, 10) || 0,
  };
}

function asStringArray(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value === "string") {
    return value
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [String(value)];
}

/** Resolve doctors from agent tool args — prefers exact IDs from the directory. */
export function resolveDoctorsFromArgs(entity: EntitySlug, args: Record<string, unknown>): DoctorRow[] {
  const all = loadDoctors(entity);
  const ids = asStringArray(args.doctor_ids);
  const names = asStringArray(args.doctor_names);
  const specialty = typeof args.specialty === "string" ? args.specialty : undefined;

  debugLog("resolveDoctorsFromArgs:start", {
    entity,
    ids,
    names,
    specialty,
    totalDoctorsAvailable: all.length,
  });

  if (ids.length > 0) {
    const byId = ids
      .map((id) => all.find((d) => d.id === id))
      .filter((d): d is DoctorRow => !!d);
    debugLog("resolveDoctorsFromArgs:byId", {
      requestedIds: ids,
      matchedIds: byId.map((d) => d.id),
      matchedNames: byId.map((d) => d.name),
    });
    if (byId.length > 0) return byId;
  }

  if (names.length > 0) {
    const byName: DoctorRow[] = [];
    for (const name of names) {
      const lower = name.toLowerCase();
      const match =
        all.find((d) => d.name.toLowerCase() === lower) ??
        all.find((d) => d.name.toLowerCase().includes(lower)) ??
        all.find((d) => lower.includes(d.name.replace(/^Dr\.?\s*/i, "").toLowerCase()));
      if (match && !byName.some((d) => d.id === match.id)) byName.push(match);
    }
    debugLog("resolveDoctorsFromArgs:byName", {
      requestedNames: names,
      matchedIds: byName.map((d) => d.id),
      matchedNames: byName.map((d) => d.name),
    });
    if (byName.length > 0) return byName;
  }

  if (specialty) {
    const bySpecialty = searchDoctors(entity, { specialty }).slice(0, 4);
    debugLog("resolveDoctorsFromArgs:bySpecialty", {
      specialty,
      matchedIds: bySpecialty.map((d) => d.id),
      matchedNames: bySpecialty.map((d) => d.name),
    });
    return bySpecialty;
  }

  debugLog("resolveDoctorsFromArgs:noMatch", {
    entity,
    ids,
    names,
    specialty,
  });
  return [];
}

export function buildDoctorCards(entity: EntitySlug, args: Record<string, unknown>): DoctorCard[] {
  return resolveDoctorsFromArgs(entity, args).map((d) => toDoctorCard(entity, d));
}

export function resolveDoctorCardById(
  entity: EntitySlug,
  doctorId: string | undefined
): DoctorCard | undefined {
  if (!doctorId) return undefined;
  const doc = loadDoctors(entity).find((d) => d.id === doctorId);
  return doc ? toDoctorCard(entity, doc) : undefined;
}

/** Keep the doctor card in sync when slots/booking reference a specific doctor. */
export function syncDoctorFromArgs(
  entity: EntitySlug,
  args: Record<string, unknown>
): Pick<UiSessionState, "doctors" | "selectedDoctorId"> {
  const doctorId = typeof args.doctor_id === "string" ? args.doctor_id : undefined;
  const card = resolveDoctorCardById(entity, doctorId);
  if (!card) return {};
  return { selectedDoctorId: card.id, doctors: [card] };
}

export function buildClinicCards(entity: EntitySlug, args: Record<string, unknown>): ClinicCard[] {
  const specialty = typeof args.specialty === "string" ? args.specialty : undefined;
  const name = typeof args.name === "string" ? args.name : undefined;
  const clinicId = typeof args.clinic_id === "string" ? args.clinic_id : undefined;

  let results = searchClinics(entity, { specialty, name });
  if (clinicId) {
    const match = loadClinics(entity).find((c) => c.id === clinicId);
    if (match) results = [match];
  }

  return results.slice(0, 5).map((c) => ({
    id: c.id,
    name: c.name,
    address: c.address,
    phone: c.phone,
    specialties: c.specialties.split(",").map((s) => s.trim()),
    hours: c.opening_hours,
    latitude: parseFloat(c.latitude),
    longitude: parseFloat(c.longitude),
  }));
}

export function buildSlots(args: Record<string, unknown>): TimeSlot[] {
  const date =
    typeof args.date === "string" && args.date
      ? args.date
      : new Date().toISOString().split("T")[0];
  return generateMockSlots(date);
}

export function buildBooking(entity: EntitySlug, args: Record<string, unknown>) {
  const doctorId = typeof args.doctor_id === "string" ? args.doctor_id : undefined;
  const doctors = loadDoctors(entity);
  const doctor = (doctorId ? doctors.find((d) => d.id === doctorId) : undefined) ?? doctors[0];
  const clinic = doctor ? getClinicById(entity, doctor.clinic_id) : undefined;

  return {
    reference: generateBookingReference(entity),
    doctorName: doctor?.name ?? "Selected Doctor",
    clinicName: clinic?.name ?? "DHCC Facility",
    date:
      typeof args.date === "string" && args.date
        ? args.date
        : new Date().toISOString().split("T")[0],
    time: typeof args.time === "string" && args.time ? args.time : "10:00",
    patientName:
      typeof args.patient_name === "string" && args.patient_name ? args.patient_name : "Guest",
  };
}

export function buildDirections(entity: EntitySlug, args: Record<string, unknown>): DirectionsInfo | null {
  const clinics = loadClinics(entity);
  const clinicId = typeof args.clinic_id === "string" ? args.clinic_id : undefined;
  const name = typeof args.name === "string" ? args.name : undefined;

  const clinic =
    (clinicId ? clinics.find((c) => c.id === clinicId) : undefined) ??
    (name ? clinics.find((c) => c.name.toLowerCase().includes(name.toLowerCase())) : undefined) ??
    clinics[0];

  if (!clinic) return null;

  const lat = parseFloat(clinic.latitude);
  const lng = parseFloat(clinic.longitude);
  return {
    name: clinic.name,
    address: clinic.address,
    phone: clinic.phone,
    mapUrl: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
  };
}
