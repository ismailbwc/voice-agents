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

const FEMALE_DOCTOR_IDS = new Set([
  "dhcc-doc-002",
  "dhcc-doc-004",
  "dhcc-doc-006",
  "dhcc-doc-008",
  "dhcc-doc-010",
  "dhcc-doc-012",
  "dhcc-doc-014",
  "c37-doc-002",
  "c37-doc-004",
  "c37-doc-005",
  "c37-doc-006",
  "c37-doc-009",
  "c37-doc-011",
  "c37-doc-012",
  "c37-doc-014",
]);

/** All known doctor IDs (for stable round-robin assignment). */
const ALL_DOCTOR_IDS = [
  "dhcc-doc-001", "dhcc-doc-002", "dhcc-doc-003", "dhcc-doc-004", "dhcc-doc-005",
  "dhcc-doc-006", "dhcc-doc-007", "dhcc-doc-008", "dhcc-doc-009", "dhcc-doc-010",
  "dhcc-doc-011", "dhcc-doc-012", "dhcc-doc-013", "dhcc-doc-014", "dhcc-doc-015",
  "c37-doc-001", "c37-doc-002", "c37-doc-003", "c37-doc-004", "c37-doc-005",
  "c37-doc-006", "c37-doc-007", "c37-doc-008", "c37-doc-009", "c37-doc-010",
  "c37-doc-011", "c37-doc-012", "c37-doc-013", "c37-doc-014",
];

/** Explicit overrides — Fatima always uses doctor_f2. */
const DOCTOR_IMAGE_BY_ID: Record<string, string> = {
  "dhcc-doc-004": "/doctors/doctor_f2.jpg",
};

// Round-robin within gender so nearby IDs (e.g. c37-doc-007 vs 010) get different photos.
(() => {
  const females = ALL_DOCTOR_IDS.filter((id) => FEMALE_DOCTOR_IDS.has(id) && id !== "dhcc-doc-004");
  const males = ALL_DOCTOR_IDS.filter((id) => !FEMALE_DOCTOR_IDS.has(id));
  females.forEach((id, i) => {
    DOCTOR_IMAGE_BY_ID[id] = FEMALE_DOCTOR_IMAGES[i % FEMALE_DOCTOR_IMAGES.length];
  });
  males.forEach((id, i) => {
    DOCTOR_IMAGE_BY_ID[id] = MALE_DOCTOR_IMAGES[i % MALE_DOCTOR_IMAGES.length];
  });
})();

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
  if (doctor.name.toLowerCase().includes("fatima al hashimi") || doctor.id === "dhcc-doc-004") {
    return "/doctors/doctor_f2.jpg";
  }
  if (DOCTOR_IMAGE_BY_ID[doctor.id]) return DOCTOR_IMAGE_BY_ID[doctor.id];
  const isFemale = FEMALE_DOCTOR_IDS.has(doctor.id) || looksFemaleName(doctor.name);
  return pickFromPool(doctor.id, isFemale ? FEMALE_DOCTOR_IMAGES : MALE_DOCTOR_IMAGES);
}

/**
 * Ensure doctors shown together don't share the same photo when alternatives exist.
 */
export function ensureDistinctDoctorImages<T extends { id: string; name: string; imageUrl: string }>(
  doctors: T[]
): T[] {
  const used = new Set<string>();
  return doctors.map((doc) => {
    let imageUrl = doc.imageUrl;
    if (doc.id === "dhcc-doc-004" || doc.name.toLowerCase().includes("fatima al hashimi")) {
      imageUrl = "/doctors/doctor_f2.jpg";
      used.add(imageUrl);
      return { ...doc, imageUrl };
    }
    if (!used.has(imageUrl)) {
      used.add(imageUrl);
      return { ...doc, imageUrl };
    }
    const isFemale = FEMALE_DOCTOR_IDS.has(doc.id) || looksFemaleName(doc.name);
    const pool = isFemale ? FEMALE_DOCTOR_IMAGES : MALE_DOCTOR_IMAGES;
    const alternate = pool.find((url) => !used.has(url)) ?? imageUrl;
    used.add(alternate);
    return { ...doc, imageUrl: alternate };
  });
}

export function getClinicImage(clinicId: string): string {
  return CLINIC_IMAGE_BY_ID[clinicId] ?? pickFromPool(clinicId, CLINIC_IMAGES);
}

export function getWorkspaceImage(workspaceId: string, facilityId?: string): string {
  if (facilityId && CLINIC_IMAGE_BY_ID[facilityId]) return CLINIC_IMAGE_BY_ID[facilityId];
  return pickFromPool(workspaceId, CLINIC_IMAGES);
}

export const RECEPTIONIST_IMAGE = "/images/receptionist.png";
