import { NextRequest, NextResponse } from "next/server";
import type { EntitySlug } from "@/lib/entities";
import {
  generateMockSlots,
  getClinicById,
  loadDoctors,
  searchClinics,
  searchDoctors,
} from "@/lib/csv-loader";
import { matchDoctorsFromAgentText } from "@/lib/doctor-matcher";
import { getClinicImage, getDoctorImage, ensureDistinctDoctorImages } from "@/lib/media";
import { toDoctorCard } from "@/lib/retell-tools";
import type { ClinicCard, DoctorCard, DirectionsInfo, TimeSlot } from "@/lib/types";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const entity = (searchParams.get("entity") ?? "dhcc") as EntitySlug;
  const type = searchParams.get("type");

  if (entity !== "dhcc" && entity !== "c37") {
    return NextResponse.json({ error: "Invalid entity" }, { status: 400 });
  }

  try {
    if (type === "doctors") {
      const agentText = searchParams.get("agent_text") ?? undefined;
      const results = agentText
        ? matchDoctorsFromAgentText(entity, agentText)
        : searchDoctors(entity, { specialty: searchParams.get("specialty") ?? undefined }).slice(0, 4);
      const doctors: DoctorCard[] = ensureDistinctDoctorImages(
        results.map((doc) => toDoctorCard(entity, doc))
      );
      return NextResponse.json({ doctors });
    }

    if (type === "clinics") {
      const specialty = searchParams.get("specialty") ?? undefined;
      const name = searchParams.get("name") ?? undefined;
      const results = searchClinics(entity, { specialty, name }).slice(0, 4);
      const clinics: ClinicCard[] = results.map((c) => ({
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
      return NextResponse.json({ clinics });
    }

    if (type === "slots") {
      const date = searchParams.get("date") ?? new Date().toISOString().split("T")[0];
      const slots: TimeSlot[] = generateMockSlots(date);
      return NextResponse.json({ slots });
    }

    if (type === "booking") {
      const doctorId = searchParams.get("doctor_id");
      const doctors = loadDoctors(entity);
      const doctor = doctors.find((d) => d.id === doctorId) ?? doctors[0];
      const clinic = doctor ? getClinicById(entity, doctor.clinic_id) : undefined;
      return NextResponse.json({
        doctorName: doctor?.name ?? "Selected Doctor",
        clinicName: clinic?.name ?? "DHCC Facility",
      });
    }

    if (type === "directions") {
      const name = searchParams.get("name") ?? undefined;
      const clinics = searchClinics(entity, { name });
      const clinic = clinics[0];
      if (!clinic) return NextResponse.json({ directions: null });
      const lat = parseFloat(clinic.latitude);
      const lng = parseFloat(clinic.longitude);
      const directions: DirectionsInfo = {
        name: clinic.name,
        address: clinic.address,
        phone: clinic.phone,
        mapUrl: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
        imageUrl: getClinicImage(clinic.id),
      };
      return NextResponse.json({ directions });
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (error) {
    console.error("mock-data error:", error);
    return NextResponse.json({ error: "Failed to load mock data" }, { status: 500 });
  }
}
