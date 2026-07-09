export type UiActionType =
  | "SHOW_DOCTOR_CARDS"
  | "SHOW_CLINIC_LIST"
  | "SHOW_TIME_SLOTS"
  | "SHOW_BOOKING_CONFIRMATION"
  | "SHOW_DIRECTIONS"
  | "SHOW_VISIT_SUMMARY"
  | "CLEAR";

export interface DoctorCard {
  id: string;
  name: string;
  title: string;
  specialty: string;
  clinicName: string;
  languages: string[];
  rating: number;
  fee: number;
}

export interface ClinicCard {
  id: string;
  name: string;
  address: string;
  phone: string;
  specialties: string[];
  hours: string;
  latitude: number;
  longitude: number;
}

export interface TimeSlot {
  time: string;
  available: boolean;
}

export interface BookingConfirmation {
  reference: string;
  doctorName: string;
  clinicName: string;
  date: string;
  time: string;
  patientName: string;
}

export interface DirectionsInfo {
  name: string;
  address: string;
  mapUrl: string;
  phone: string;
}

export interface UiSessionState {
  action: UiActionType;
  doctors?: DoctorCard[];
  /** Doctor the patient is currently discussing or booking with */
  selectedDoctorId?: string;
  clinics?: ClinicCard[];
  slots?: TimeSlot[];
  booking?: BookingConfirmation;
  directions?: DirectionsInfo;
  updatedAt: number;
}

export interface DoctorRow {
  id: string;
  name: string;
  title: string;
  specialty: string;
  clinic_id: string;
  languages: string;
  nationality: string;
  experience_years: string;
  availability_days: string;
  consultation_fee_aed: string;
  rating: string;
  qualifications: string;
  profile_url: string;
}

export interface ClinicRow {
  id: string;
  name: string;
  building: string;
  address: string;
  phone: string;
  email: string;
  specialties: string;
  opening_hours: string;
  latitude: string;
  longitude: string;
  insurance_accepted: string;
  parent_org: string;
  booking_method: string;
}

export interface FacilityRow {
  id: string;
  name: string;
  building: string;
  address: string;
  phone: string;
  email: string;
  amenities: string;
  opening_hours: string;
  latitude: string;
  longitude: string;
  insurance_accepted: string;
  website: string;
}

export type CallStatus = "idle" | "connecting" | "active" | "ended" | "error";
export type VoiceState = "idle" | "listening" | "speaking" | "processing";
