import type { EntitySlug } from "./entities";
import {
  generateBookingReference,
  generateMockSlots,
  generateWorkspaceBookingReference,
  getClinicById,
  getWorkspaceById,
  loadClinics,
  loadDoctors,
  searchClinics,
  searchDoctors,
  searchWorkspaces,
} from "./csv-loader";
import { getClinicImage, getDoctorImage, getWorkspaceImage, ensureDistinctDoctorImages } from "./media";
import type {
  BillingPeriod,
  ClinicCard,
  DoctorCard,
  DoctorRow,
  DirectionsInfo,
  MembershipInfo,
  TimeSlot,
  UiSessionState,
  WorkspaceCard,
  WorkspaceBookingConfirmation,
  WorkspaceRow,
  WorkspaceType,
} from "./types";

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

/** Resolve doctors within a single entity directory. */
function resolveDoctorsInEntity(entity: EntitySlug, args: Record<string, unknown>): DoctorRow[] {
  const all = loadDoctors(entity);
  const ids = asStringArray(args.doctor_ids);
  const names = asStringArray(args.doctor_names);
  const specialty = typeof args.specialty === "string" ? args.specialty : undefined;

  if (ids.length > 0) {
    const byId = ids
      .map((id) => all.find((d) => d.id === id))
      .filter((d): d is DoctorRow => !!d);
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
    if (byName.length > 0) return byName;
  }

  if (specialty) {
    return searchDoctors(entity, { specialty }).slice(0, 4);
  }

  return [];
}

function entityForDoctor(doc: DoctorRow, fallback: EntitySlug): EntitySlug {
  if (doc.id.startsWith("dhcc-")) return "dhcc";
  if (doc.id.startsWith("c37-")) return "c37";
  return fallback;
}

/**
 * Resolve doctors from agent tool args — prefers exact IDs from the directory.
 * C37 may refer patients to DHCC partner specialists when a specialty is not available at C37.
 */
export function resolveDoctorsFromArgs(entity: EntitySlug, args: Record<string, unknown>): DoctorRow[] {
  const ids = asStringArray(args.doctor_ids);
  const names = asStringArray(args.doctor_names);
  const specialty = typeof args.specialty === "string" ? args.specialty : undefined;

  debugLog("resolveDoctorsFromArgs:start", {
    entity,
    ids,
    names,
    specialty,
    totalDoctorsAvailable: loadDoctors(entity).length,
  });

  // Prefer explicit DHCC IDs even when the active call is C37 (partner referral).
  if (entity === "c37" && ids.some((id) => id.startsWith("dhcc-"))) {
    const dhccMatches = resolveDoctorsInEntity("dhcc", args);
    const c37Matches = resolveDoctorsInEntity("c37", { ...args, doctor_ids: ids.filter((id) => id.startsWith("c37-")) });
    const merged = [...c37Matches];
    for (const d of dhccMatches) {
      if (!merged.some((m) => m.id === d.id)) merged.push(d);
    }
    if (merged.length > 0) {
      debugLog("resolveDoctorsFromArgs:mixedReferral", {
        matchedIds: merged.map((d) => d.id),
        matchedNames: merged.map((d) => d.name),
      });
      return merged;
    }
  }

  const local = resolveDoctorsInEntity(entity, args);
  if (local.length > 0) {
    debugLog("resolveDoctorsFromArgs:local", {
      matchedIds: local.map((d) => d.id),
      matchedNames: local.map((d) => d.name),
    });
    return local;
  }

  // C37 patient asked for a specialty/name not in C37 → look up DHCC partner doctors.
  if (entity === "c37") {
    const referred = resolveDoctorsInEntity("dhcc", args);
    if (referred.length > 0) {
      debugLog("resolveDoctorsFromArgs:dhccReferral", {
        matchedIds: referred.map((d) => d.id),
        matchedNames: referred.map((d) => d.name),
      });
      return referred;
    }
  }

  debugLog("resolveDoctorsFromArgs:noMatch", { entity, ids, names, specialty });
  return [];
}

export function toDoctorCard(entity: EntitySlug, doc: DoctorRow): DoctorCard {
  const clinicEntity = entityForDoctor(doc, entity);
  const clinic = getClinicById(clinicEntity, doc.clinic_id);
  return {
    id: doc.id,
    name: doc.name,
    title: doc.title,
    specialty: doc.specialty,
    clinicName: clinic?.name ?? doc.clinic_id,
    languages: doc.languages.split(",").map((l) => l.trim()),
    rating: parseFloat(doc.rating) || 4.5,
    fee: parseInt(doc.consultation_fee_aed, 10) || 0,
    imageUrl: getDoctorImage(doc),
  };
}

export function buildDoctorCards(entity: EntitySlug, args: Record<string, unknown>): DoctorCard[] {
  return ensureDistinctDoctorImages(
    resolveDoctorsFromArgs(entity, args).map((d) => toDoctorCard(entity, d))
  );
}

export function resolveDoctorCardById(
  entity: EntitySlug,
  doctorId: string | undefined
): DoctorCard | undefined {
  if (!doctorId) return undefined;
  const local = loadDoctors(entity).find((d) => d.id === doctorId);
  if (local) return toDoctorCard(entity, local);
  // C37 call booking/referring a DHCC partner doctor
  if (entity === "c37" || doctorId.startsWith("dhcc-")) {
    const dhccDoc = loadDoctors("dhcc").find((d) => d.id === doctorId);
    if (dhccDoc) return toDoctorCard("dhcc", dhccDoc);
  }
  if (doctorId.startsWith("c37-")) {
    const c37Doc = loadDoctors("c37").find((d) => d.id === doctorId);
    if (c37Doc) return toDoctorCard("c37", c37Doc);
  }
  return undefined;
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
    imageUrl: getClinicImage(c.id),
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
  const card = resolveDoctorCardById(entity, doctorId);
  const localDoctors = loadDoctors(entity);
  const doctorRow =
    (doctorId
      ? localDoctors.find((d) => d.id === doctorId) ??
        (doctorId.startsWith("dhcc-") ? loadDoctors("dhcc").find((d) => d.id === doctorId) : undefined) ??
        (doctorId.startsWith("c37-") ? loadDoctors("c37").find((d) => d.id === doctorId) : undefined)
      : undefined) ?? localDoctors[0];
  const clinicEntity = doctorRow ? entityForDoctor(doctorRow, entity) : entity;
  const clinic = doctorRow ? getClinicById(clinicEntity, doctorRow.clinic_id) : undefined;

  return {
    reference: generateBookingReference(entity),
    doctorName: card?.name ?? doctorRow?.name ?? "Selected Doctor",
    clinicName: card?.clinicName ?? clinic?.name ?? "DHCC Facility",
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
  const clinicId = typeof args.clinic_id === "string" ? args.clinic_id : undefined;
  const name = typeof args.name === "string" ? args.name : undefined;

  const searchEntities: EntitySlug[] =
    entity === "c37" && (clinicId?.startsWith("dhcc-") || Boolean(name))
      ? [entity, "dhcc"]
      : [entity];

  let clinic = undefined as ReturnType<typeof getClinicById>;
  for (const e of searchEntities) {
    const clinics = loadClinics(e);
    clinic =
      (clinicId ? clinics.find((c) => c.id === clinicId) : undefined) ??
      (name ? clinics.find((c) => c.name.toLowerCase().includes(name.toLowerCase())) : undefined);
    if (clinic) break;
  }
  if (!clinic) clinic = loadClinics(entity)[0];
  if (!clinic) return null;

  const lat = parseFloat(clinic.latitude);
  const lng = parseFloat(clinic.longitude);
  return {
    name: clinic.name,
    address: clinic.address,
    phone: clinic.phone,
    mapUrl: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
    imageUrl: getClinicImage(clinic.id),
  };
}

function toWorkspaceType(value: string): WorkspaceType {
  if (value === "exam_room" || value === "private_office") return value;
  return "consulting_room";
}

function toBillingPeriod(value: unknown): BillingPeriod {
  if (value === "weekly" || value === "monthly") return value;
  return "daily";
}

export function toWorkspaceCard(row: WorkspaceRow): WorkspaceCard {
  const facility = getClinicById("c37", row.facility_id);
  return {
    id: row.id,
    name: row.name,
    type: toWorkspaceType(row.type),
    facilityName: facility?.name ?? row.facility_id,
    facilityId: row.facility_id,
    capacity: parseInt(row.capacity, 10) || 1,
    amenities: row.amenities.split(",").map((a) => a.trim()).filter(Boolean),
    rateDaily: parseInt(row.rate_daily_aed, 10) || 0,
    rateWeekly: parseInt(row.rate_weekly_aed, 10) || 0,
    rateMonthly: parseInt(row.rate_monthly_aed, 10) || 0,
    availabilityDays: row.availability_days.split(",").map((d) => d.trim()).filter(Boolean),
    floor: row.floor,
    imageUrl: getWorkspaceImage(row.id, row.facility_id),
  };
}

export function resolveWorkspacesFromArgs(args: Record<string, unknown>): WorkspaceRow[] {
  const ids = asStringArray(args.workspace_ids);
  const facilityId = typeof args.facility_id === "string" ? args.facility_id : undefined;
  const type = typeof args.type === "string" ? args.type : undefined;

  debugLog("resolveWorkspacesFromArgs", { ids, facilityId, type });

  const results = searchWorkspaces({
    workspace_ids: ids.length > 0 ? ids : undefined,
    facility_id: facilityId,
    type,
  });
  return results.slice(0, 4);
}

export function buildWorkspaceCards(args: Record<string, unknown>): WorkspaceCard[] {
  return resolveWorkspacesFromArgs(args).map(toWorkspaceCard);
}

export function syncWorkspaceFromArgs(
  args: Record<string, unknown>
): Pick<UiSessionState, "workspaces" | "selectedWorkspaceId"> {
  const workspaceId = typeof args.workspace_id === "string" ? args.workspace_id : undefined;
  if (!workspaceId) return {};
  const row = getWorkspaceById(workspaceId);
  if (!row) return {};
  const card = toWorkspaceCard(row);
  return { selectedWorkspaceId: card.id, workspaces: [card] };
}

export function buildMembershipInfo(_args: Record<string, unknown> = {}): MembershipInfo {
  return {
    title: "C37 Physician Membership",
    highlights: [
      "Private offices and fully equipped exam rooms",
      "On-site nursing and administrative staff",
      "Patient registration, billing, and insurance processing",
      "Medical malpractice insurance coverage",
      "DHA licensing and visa support for visiting specialists",
      "IT / EHR support and partner lab access",
    ],
    pricingModel: "Subscription or pay-as-you-go — book daily, weekly, or monthly without clinic build-out costs.",
    applyUrl: "https://c37.ae",
    phone: "+971 4 383 8333",
  };
}

export function buildWorkspaceBooking(args: Record<string, unknown>): WorkspaceBookingConfirmation {
  const workspaceId = typeof args.workspace_id === "string" ? args.workspace_id : undefined;
  const workspaces = searchWorkspaces({});
  const row = (workspaceId ? getWorkspaceById(workspaceId) : undefined) ?? workspaces[0];
  const card = row ? toWorkspaceCard(row) : undefined;
  const billingPeriod = toBillingPeriod(args.billing_period);
  const rateAed =
    billingPeriod === "weekly"
      ? card?.rateWeekly ?? 0
      : billingPeriod === "monthly"
        ? card?.rateMonthly ?? 0
        : card?.rateDaily ?? 0;

  return {
    reference: generateWorkspaceBookingReference(),
    workspaceName: card?.name ?? "Selected Workspace",
    facilityName: card?.facilityName ?? "C37 Facility",
    physicianName:
      typeof args.physician_name === "string" && args.physician_name
        ? args.physician_name
        : "Guest Physician",
    date:
      typeof args.date === "string" && args.date
        ? args.date
        : new Date().toISOString().split("T")[0],
    billingPeriod,
    rateAed,
  };
}
