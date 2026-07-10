/**
 * Generates Retell Knowledge Base markdown from CSV source files.
 * Run: npm run sync-kb
 *
 * CSV = source of truth (also powers UI mockups)
 * Generated .md = upload to Retell Knowledge Base so the agent can speak about doctors/clinics
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Papa from "papaparse";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DOCS_ROOT = path.join(__dirname, "..", "docs");

function readCsv(filePath) {
  const content = fs.readFileSync(filePath, "utf-8");
  return Papa.parse(content, { header: true, skipEmptyLines: true }).data;
}

function clinicNameMap(clinics, idField = "id") {
  const map = new Map();
  for (const c of clinics) map.set(c[idField], c.name);
  return map;
}

function groupBy(rows, key) {
  const groups = new Map();
  for (const row of rows) {
    const k = row[key] || "Other";
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(row);
  }
  return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
}

function generateDoctorsMd(entityLabel, doctors, clinicMap) {
  const lines = [
    `# ${entityLabel} Doctor Directory`,
    "",
    `Authoritative directory of physicians at ${entityLabel}. When callers ask about doctors or specialists, recommend only from this list. Include name, specialty, clinic, languages, and consultation fee when relevant.`,
    "",
    "> Auto-generated from doctors.csv. Run `npm run sync-kb` after editing the CSV.",
    "",
  ];

  for (const [specialty, docs] of groupBy(doctors, "specialty")) {
    lines.push(`## ${specialty}`, "");
    for (const d of docs) {
      const clinic = clinicMap.get(d.clinic_id) ?? d.clinic_id;
      lines.push(`### ${d.name}`);
      lines.push(`- **ID:** ${d.id}`);
      lines.push(`- **Title:** ${d.title}`);
      lines.push(`- **Specialty:** ${d.specialty}`);
      lines.push(`- **Clinic:** ${clinic}`);
      lines.push(`- **Languages:** ${d.languages}`);
      lines.push(`- **Nationality:** ${d.nationality}`);
      lines.push(`- **Experience:** ${d.experience_years} years`);
      lines.push(`- **Availability:** ${d.availability_days}`);
      lines.push(`- **Consultation fee:** AED ${d.consultation_fee_aed}`);
      lines.push(`- **Rating:** ${d.rating} / 5`);
      lines.push(`- **Qualifications:** ${d.qualifications}`);
      if (d.profile_url) lines.push(`- **Profile:** ${d.profile_url}`);
      lines.push("");
    }
  }

  return lines.join("\n");
}

function generateClinicsMd(entityLabel, clinics, isFacility = false) {
  const title = isFacility ? "Facilities Directory" : "Clinics and Hospitals Directory";
  const lines = [
    `# ${entityLabel} ${title}`,
    "",
    `Authoritative list of ${isFacility ? "C37 workspace locations" : "hospitals and clinics"} at ${entityLabel}. Use this when callers ask about facilities, locations, specialties offered, hours, or contact details.`,
    "",
    "> Auto-generated from CSV. Run `npm run sync-kb` after editing the CSV.",
    "",
  ];

  for (const c of clinics) {
    lines.push(`## ${c.name}`);
    lines.push(`- **ID:** ${c.id}`);
    lines.push(`- **Building:** ${c.building}`);
    lines.push(`- **Address:** ${c.address}`);
    lines.push(`- **Phone:** ${c.phone}`);
    lines.push(`- **Email:** ${c.email}`);
    if (c.specialties) lines.push(`- **Specialties / Services:** ${c.specialties}`);
    if (c.amenities) lines.push(`- **Amenities:** ${c.amenities}`);
    lines.push(`- **Hours:** ${c.opening_hours}`);
    lines.push(`- **Insurance accepted:** ${c.insurance_accepted}`);
    if (c.parent_org) lines.push(`- **Operator:** ${c.parent_org}`);
    if (c.booking_method) lines.push(`- **Booking:** ${c.booking_method}`);
    if (c.website) lines.push(`- **Website:** ${c.website}`);
    lines.push(`- **Coordinates:** ${c.latitude}, ${c.longitude}`);
    lines.push("");
  }

  return lines.join("\n");
}

function generateSpecialtiesMd(entityLabel, doctors) {
  const bySpecialty = groupBy(doctors, "specialty");
  const lines = [
    `# ${entityLabel} Specialties Index`,
    "",
    "Quick reference of available medical specialties and which doctors practice each specialty.",
    "",
    "> Auto-generated from doctors.csv. Run `npm run sync-kb` after editing the CSV.",
    "",
  ];

  for (const [specialty, docs] of bySpecialty) {
    const names = docs.map((d) => d.name).join(", ");
    const clinics = [...new Set(docs.map((d) => d.clinic_id))].join(", ");
    lines.push(`## ${specialty}`);
    lines.push(`- **Doctors (${docs.length}):** ${names}`);
    lines.push(`- **Clinic IDs:** ${clinics}`);
    lines.push("");
  }

  return lines.join("\n");
}

function generateWorkspacesMd(workspaces, facilityMap) {
  const lines = [
    `# C37 Workspaces Directory`,
    "",
    "Authoritative list of bookable consulting rooms, exam rooms, and private offices for physician members. When a physician wants to book workspace, recommend only from this list and use the exact **ID** in `show_workspace_cards`.",
    "",
    "> Auto-generated from workspaces.csv. Run `npm run sync-kb` after editing the CSV.",
    "",
  ];

  for (const [type, rooms] of groupBy(workspaces, "type")) {
    const label =
      type === "exam_room" ? "Exam Rooms" : type === "private_office" ? "Private Offices" : "Consulting Rooms";
    lines.push(`## ${label}`, "");
    for (const w of rooms) {
      const facility = facilityMap.get(w.facility_id) ?? w.facility_id;
      lines.push(`### ${w.name}`);
      lines.push(`- **ID:** ${w.id}`);
      lines.push(`- **Type:** ${w.type}`);
      lines.push(`- **Facility:** ${facility} (${w.facility_id})`);
      lines.push(`- **Floor:** ${w.floor}`);
      lines.push(`- **Capacity:** ${w.capacity}`);
      lines.push(`- **Amenities:** ${w.amenities}`);
      lines.push(`- **Availability:** ${w.availability_days}`);
      lines.push(`- **Daily rate:** AED ${w.rate_daily_aed}`);
      lines.push(`- **Weekly rate:** AED ${w.rate_weekly_aed}`);
      lines.push(`- **Monthly rate:** AED ${w.rate_monthly_aed}`);
      lines.push("");
    }
  }

  return lines.join("\n");
}

function syncEntity(entity, label, clinicFile, clinicIsFacility = false) {
  const dir = path.join(DOCS_ROOT, entity);
  const doctors = readCsv(path.join(dir, "doctors.csv"));
  const clinics = readCsv(path.join(dir, clinicFile));
  const clinicMap = clinicNameMap(clinics);

  const doctorsMd = generateDoctorsMd(label, doctors, clinicMap);
  const clinicsMd = generateClinicsMd(label, clinics, clinicIsFacility);
  const specialtiesMd = generateSpecialtiesMd(label, doctors);

  fs.writeFileSync(path.join(dir, "doctors-directory.md"), doctorsMd);
  fs.writeFileSync(
    path.join(dir, clinicIsFacility ? "facilities-directory.md" : "clinics-directory.md"),
    clinicsMd
  );
  fs.writeFileSync(path.join(dir, "specialties-index.md"), specialtiesMd);

  let extra = "";
  if (entity === "c37") {
    const workspaces = readCsv(path.join(dir, "workspaces.csv"));
    const workspacesMd = generateWorkspacesMd(workspaces, clinicMap);
    fs.writeFileSync(path.join(dir, "workspaces-directory.md"), workspacesMd);
    extra = ", workspaces-directory.md";
  }

  console.log(
    `✓ ${entity}: doctors-directory.md, ${clinicIsFacility ? "facilities" : "clinics"}-directory.md, specialties-index.md${extra}`
  );
}

syncEntity("dhcc", "Dubai Healthcare City (DHCC)", "clinics.csv", false);
syncEntity("c37", "C37 Medical Workspace", "facilities.csv", true);

console.log("\nUpload the generated *-directory.md and specialties-index.md files to Retell Knowledge Base.");
