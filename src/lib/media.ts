/** Resolve public image URLs for doctors, clinics, and workspaces. */

const FEMALE_DOCTOR_IMAGES = [
  "/doctors/doctor_f.jpg",
  "/doctors/doctor_f2.jpg",
  "/doctors/doctorf_3.avif",
] as const;

const MALE_DOCTOR_IMAGES = [
  "/doctors/doctor1.jpg",
  "/doctors/doctor.png",
  "/doctors/doctor2.avif",
] as const;

const CLINIC_IMAGES = [
  "/clinics/clinic-1.jpg",
  "/clinics/clinic-2.jpg",
  "/clinics/clinic-corridor.webp",
  "/clinics/clinic-suite.avif",
] as const;

/** Explicit overrides — Fatima always uses doctor_f2. */
const DOCTOR_IMAGE_BY_ID: Record<string, string> = {
  "dhcc-doc-004": "/doctors/doctor_f2.jpg",
};

const FEMALE_DOCTOR_IDS = new Set([
  "dhcc-doc-002", // Aisha
  "dhcc-doc-004", // Fatima
  "dhcc-doc-006", // Sarah
  "dhcc-doc-008", // Priya
  "dhcc-doc-010", // Layla
  "dhcc-doc-012", // Elena
  "dhcc-doc-014", // Maria
  "c37-doc-002", // Rasha
  "c37-doc-004", // Suhad
  "c37-doc-005", // Candice
  "c37-doc-006", // Pearl
  "c37-doc-009", // Marjorie
  "c37-doc-011", // Suha
  "c37-doc-012", // Nadia
  "c37-doc-014", // Isabelle
]);

const CLINIC_IMAGE_BY_ID: Record<string, string> = {
  "dhcc-habib": "/clinics/clinic-1.jpg",
  "dhcc-mediclinic": "/clinics/clinic-2.jpg",
  "dhcc-emirates": "/clinics/clinic-corridor.webp",
  "dhcc-jalila": "/clinics/clinic-suite.avif",
  "dhcc-moorfields": "/clinics/clinic-1.jpg",
  "dhcc-zulekha": "/clinics/clinic-2.jpg",
  "dhcc-aacs": "/clinics/clinic-corridor.webp",
  "c37-oud-metha": "/clinics/clinic-suite.avif",
  "c37-al-jaddaf": "/clinics/clinic-1.jpg",
};

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function pickFromPool(id: string, pool: readonly string[]): string {
  return pool[hashString(id) % pool.length];
}

function looksFemaleName(name: string): boolean {
  const first = name.replace(/^Dr\.?\s*/i, "").split(/\s+/)[0]?.toLowerCase() ?? "";
  const femaleFirstNames = [
    "aisha", "fatima", "sarah", "priya", "layla", "elena", "maria",
    "rasha", "suhad", "candice", "pearl", "marjorie", "suha", "nadia", "isabelle",
  ];
  return femaleFirstNames.includes(first);
}

export function getDoctorImage(doctor: { id: string; name: string }): string {
  if (DOCTOR_IMAGE_BY_ID[doctor.id]) return DOCTOR_IMAGE_BY_ID[doctor.id];
  if (doctor.name.toLowerCase().includes("fatima al hashimi")) {
    return "/doctors/doctor_f2.jpg";
  }
  const isFemale = FEMALE_DOCTOR_IDS.has(doctor.id) || looksFemaleName(doctor.name);
  return pickFromPool(doctor.id, isFemale ? FEMALE_DOCTOR_IMAGES : MALE_DOCTOR_IMAGES);
}

export function getClinicImage(clinicId: string): string {
  return CLINIC_IMAGE_BY_ID[clinicId] ?? pickFromPool(clinicId, CLINIC_IMAGES);
}

export function getWorkspaceImage(workspaceId: string, facilityId?: string): string {
  if (facilityId && CLINIC_IMAGE_BY_ID[facilityId]) return CLINIC_IMAGE_BY_ID[facilityId];
  return pickFromPool(workspaceId, CLINIC_IMAGES);
}

export const RECEPTIONIST_IMAGE = "/images/receptionist.png";
