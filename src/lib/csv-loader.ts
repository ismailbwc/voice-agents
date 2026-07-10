import fs from "fs";
import path from "path";
import Papa from "papaparse";
import type { EntitySlug } from "./entities";
import type { ClinicRow, DoctorRow, FacilityRow, WorkspaceRow } from "./types";

const DOCS_ROOT = path.join(process.cwd(), "docs");

function readCsv<T>(filePath: string): T[] {
  const content = fs.readFileSync(filePath, "utf-8");
  const parsed = Papa.parse<T>(content, { header: true, skipEmptyLines: true });
  return parsed.data;
}

export function loadDoctors(entity: EntitySlug): DoctorRow[] {
  const file = path.join(DOCS_ROOT, entity, "doctors.csv");
  return readCsv<DoctorRow>(file);
}

export function loadClinics(entity: EntitySlug): ClinicRow[] {
  if (entity === "c37") {
    const file = path.join(DOCS_ROOT, entity, "facilities.csv");
    const facilities = readCsv<FacilityRow>(file);
    return facilities.map((f) => ({
      id: f.id,
      name: f.name,
      building: f.building,
      address: f.address,
      phone: f.phone,
      email: f.email,
      specialties: f.amenities,
      opening_hours: f.opening_hours,
      latitude: f.latitude,
      longitude: f.longitude,
      insurance_accepted: f.insurance_accepted,
      parent_org: "C37 at DHCC",
      booking_method: "Phone,Website",
    }));
  }
  const file = path.join(DOCS_ROOT, entity, "clinics.csv");
  return readCsv<ClinicRow>(file);
}

export function getClinicById(entity: EntitySlug, clinicId: string): ClinicRow | undefined {
  return loadClinics(entity).find((c) => c.id === clinicId);
}

export function loadWorkspaces(): WorkspaceRow[] {
  const file = path.join(DOCS_ROOT, "c37", "workspaces.csv");
  return readCsv<WorkspaceRow>(file);
}

export function getWorkspaceById(workspaceId: string): WorkspaceRow | undefined {
  return loadWorkspaces().find((w) => w.id === workspaceId);
}

export function searchWorkspaces(filters: {
  facility_id?: string;
  type?: string;
  workspace_ids?: string[];
}): WorkspaceRow[] {
  const all = loadWorkspaces();
  if (filters.workspace_ids && filters.workspace_ids.length > 0) {
    const byId = filters.workspace_ids
      .map((id) => all.find((w) => w.id === id))
      .filter((w): w is WorkspaceRow => !!w);
    if (byId.length > 0) return byId;
  }
  return all.filter((w) => {
    if (filters.facility_id && w.facility_id !== filters.facility_id) return false;
    if (filters.type && w.type.toLowerCase() !== filters.type.toLowerCase()) return false;
    return true;
  });
}

export function searchDoctors(
  entity: EntitySlug,
  filters: { specialty?: string; language?: string; clinic_id?: string; name?: string }
): DoctorRow[] {
  const doctors = loadDoctors(entity);
  return doctors.filter((doc) => {
    if (filters.specialty && !doc.specialty.toLowerCase().includes(filters.specialty.toLowerCase())) {
      return false;
    }
    if (filters.language && !doc.languages.toLowerCase().includes(filters.language.toLowerCase())) {
      return false;
    }
    if (filters.clinic_id && doc.clinic_id !== filters.clinic_id) {
      return false;
    }
    if (filters.name && !doc.name.toLowerCase().includes(filters.name.toLowerCase())) {
      return false;
    }
    return true;
  });
}

export function searchClinics(
  entity: EntitySlug,
  filters: { specialty?: string; name?: string }
): ClinicRow[] {
  const clinics = loadClinics(entity);
  return clinics.filter((clinic) => {
    if (filters.specialty && !clinic.specialties.toLowerCase().includes(filters.specialty.toLowerCase())) {
      return false;
    }
    if (filters.name && !clinic.name.toLowerCase().includes(filters.name.toLowerCase())) {
      return false;
    }
    return true;
  });
}

export function generateMockSlots(date: string): { time: string; available: boolean }[] {
  const slots = ["09:00", "09:30", "10:00", "10:30", "11:00", "14:00", "14:30", "15:00", "15:30", "16:00"];
  return slots.map((time, i) => ({
    time: `${date} ${time}`,
    available: i % 3 !== 0,
  }));
}

export function generateBookingReference(entity: EntitySlug): string {
  const prefix = entity === "dhcc" ? "DHCC" : "C37";
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-2026-${num}`;
}

export function generateWorkspaceBookingReference(): string {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `C37-WS-2026-${num}`;
}
