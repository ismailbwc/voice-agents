import type { EntitySlug } from "./entities";
import type { TranscriptMessage } from "./transcript";
import { getAgentMessages, getUserMessages } from "./transcript";
import type { UiActionType } from "./types";

function collectAgentDoctorText(agentLines: string[]): string {
  const relevant = agentLines.filter((line) => {
    const t = line.toLowerCase();
    return (
      /\bdr\.?\s/i.test(line) ||
      t.includes("specialist") ||
      t.includes("consultant") ||
      t.includes("surgeon") ||
      t.includes("physician") ||
      t.includes("recommend")
    );
  });
  const source = relevant.length > 0 ? relevant : agentLines;
  return source.slice(-2).join(" ");
}

export type ConversationPhase =
  | "idle"
  | "user_asked_doctors"
  | "doctors_shown"
  | "user_asked_availability"
  | "user_wants_book"
  | "slots_shown"
  | "booking_confirmed"
  | "directions";

export interface ConversationContext {
  phase: ConversationPhase;
  specialty?: string;
  clinicName?: string;
  patientName?: string;
  preferredDate?: string;
  preferredTime?: string;
  lastAction?: UiActionType;
  lastAgentFingerprint: string;
  doctorsShown: boolean;
  slotsShown: boolean;
  bookingShown: boolean;
  userAskedDoctors: boolean;
  lastAgentDoctorText?: string;
}

export interface ConversationAnalysis {
  context: ConversationContext;
  intent: DetectedIntent | null;
}

export interface DetectedIntent {
  action: UiActionType;
  context: ConversationContext;
  query?: { specialty?: string; clinicName?: string; agentText?: string };
}

const SPECIALTY_KEYWORDS: Record<string, string[]> = {
  Cardiology: ["cardio", "cardiologist", "heart specialist"],
  Pediatrics: ["pediatric", "paediatric", "pediatrician", "pediatricians", "child doctor"],
  Dermatology: ["dermatolog", "skin doctor"],
  "Orthopedic Surgery": ["orthop", "knee specialist", "joint specialist", "bone doctor"],
  "IVF and Fertility": ["fertility", "ivf", "infertility"],
  Ophthalmology: ["ophthalm", "eye doctor", "eye specialist", "lasik"],
  "Cosmetic Dentistry": ["dentist", "dental", "teeth"],
  Neurology: ["neurolog", "brain specialist"],
  Psychiatry: ["psychiat", "mental health"],
  ENT: ["ent specialist", "ent doctor", "ear nose throat", "otolaryngolog"],
  Pulmonology: ["pulmon", "lung specialist"],
  Oncology: ["oncolog", "cancer specialist"],
  "Obstetrics and Gynecology": ["gynec", "obstetric", "pregnancy doctor"],
  "Interventional Radiology": ["radiolog", "interventional radiology"],
  Dietetics: ["dietitian", "nutritionist"],
  "Plastic Surgery": ["plastic surg", "cosmetic surg", "rhinoplasty", "aesthetic"],
  "Family Medicine": ["general practition", "family medicine"],
  Audiology: ["audiolog", "hearing specialist"],
  "Speech Therapy": ["speech therap"],
};

function includesAny(text: string, phrases: string[]): boolean {
  const lower = text.toLowerCase();
  return phrases.some((p) => lower.includes(p));
}

function detectSpecialty(text: string): string | undefined {
  const lower = ` ${text.toLowerCase()} `;
  for (const [specialty, keywords] of Object.entries(SPECIALTY_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(` ${kw}`) || lower.includes(kw))) return specialty;
  }
  return undefined;
}

function detectClinicName(text: string): string | undefined {
  const clinics = ["mediclinic", "al habib", "emirates specialty", "al jalila", "moorfields", "zulekha", "c37", "oud metha", "al jaddaf"];
  const lower = text.toLowerCase();
  return clinics.find((c) => lower.includes(c));
}

function extractPatientName(userLines: string[]): string | undefined {
  for (const line of userLines) {
    for (const p of [/my name is ([a-z][a-z\s'-]{1,40})/i, /i am ([a-z][a-z\s'-]{1,40})/i, /call me ([a-z][a-z\s'-]{1,40})/i]) {
      const m = line.match(p);
      if (m) return m[1].trim().replace(/\s+/g, " ");
    }
  }
  return undefined;
}

function extractDate(text: string): string | undefined {
  const iso = text.match(/\b(20\d{2}-\d{2}-\d{2})\b/);
  if (iso) return iso[1];
  if (/tomorrow/i.test(text)) {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  }
  if (/monday|tuesday|wednesday|thursday|friday|saturday|sunday/i.test(text)) {
    return new Date().toISOString().split("T")[0];
  }
  return undefined;
}

function extractTime(text: string): string | undefined {
  const m = text.match(/\b(\d{1,2}:\d{2})\b/);
  if (m) return m[1];
  const hour = text.match(/\b(\d{1,2})\s*(am|pm)\b/i);
  if (hour) {
    let h = parseInt(hour[1], 10);
    if (hour[2].toLowerCase() === "pm" && h < 12) h += 12;
    if (hour[2].toLowerCase() === "am" && h === 12) h = 0;
    return `${String(h).padStart(2, "0")}:00`;
  }
  return undefined;
}

function userAskedAboutDoctors(text: string): boolean {
  return (
    includesAny(text, [
      "find a doctor",
      "find doctor",
      "need a doctor",
      "looking for",
      "any specialist",
      "who treats",
      "recommend a doctor",
      "see a doctor",
      "do you have",
      "are there any",
      "is there any",
      "is there a",
    ]) || !!detectSpecialty(text)
  );
}

function userWantsToBook(text: string): boolean {
  return includesAny(text, [
    "book it",
    "book him",
    "book her",
    "book an appointment",
    "book appointment",
    "schedule it",
    "schedule an appointment",
    "make an appointment",
    "i want to book",
    "i'd like to book",
    "please book",
    "let's book",
    "go ahead and book",
    "yes book",
  ]);
}

function userAsksAvailability(text: string): boolean {
  return includesAny(text, [
    "when is he available",
    "when is she available",
    "when are they available",
    "check availability",
    "check when",
    "can you check",
    "when can i see",
    "when can i come",
    "what times",
    "what time",
    "is he available",
    "is she available",
    "next available",
    "availability",
  ]);
}

function isAgentGreeting(text: string): boolean {
  const t = text.toLowerCase();
  return (
    includesAny(t, ["how may i help", "how can i assist", "welcome to", "how can i help you"]) &&
    !/\bdr\.?\s/i.test(t) &&
    !includesAny(t, ["yes", "we have", "cardiologist", "pediatrician", "specialist"])
  );
}

function agentOffersDoctors(text: string): boolean {
  const t = text.toLowerCase();
  if (isAgentGreeting(t)) return false;
  if (/\bdr\.?\s+[a-z]/i.test(text)) return true;
  if (includesAny(t, ["yes", "yeah", "yep", "certainly", "absolutely", "of course"])) {
    if (includesAny(t, ["doctor", "dr.", "specialist", "cardiologist", "pediatrician", "physician", "consultant"])) {
      return true;
    }
  }
  return includesAny(t, [
    "we have",
    "i have",
    "here are",
    "i can recommend",
    "i'd recommend",
    "following doctor",
    "following physicians",
    "options for you",
    "you can see",
    "you could see",
    "available at",
    "works at",
    "consultant",
    "specialist",
    "cardiologist",
    "pediatrician",
    "dermatologist",
  ]);
}

function agentOffersTimeSlots(text: string): boolean {
  const t = text.toLowerCase();
  if (includesAny(t, ["let me check", "i'll check", "i will check", "one moment"]) && !/\d/.test(t)) {
    return false;
  }
  return includesAny(t, [
    "available at",
    "available on",
    "openings",
    "time slot",
    "10 am",
    "11 am",
    "2 pm",
    "3 pm",
    "4 pm",
    "10:",
    "11:",
    "2:",
    "3:",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "morning",
    "afternoon",
    "which time",
    "what time works",
  ]);
}

function agentConfirmsBooking(text: string): boolean {
  return includesAny(text.toLowerCase(), [
    "appointment is confirmed",
    "booking is confirmed",
    "has been booked",
    "appointment has been scheduled",
    "your reference",
    "reference number",
    "you're all set",
    "you are all set",
    "confirmed for",
    "see you on",
    "booked for",
  ]);
}

function fingerprint(text: string): string {
  return text.toLowerCase().trim().slice(0, 120);
}

export function createInitialContext(): ConversationContext {
  return {
    phase: "idle",
    lastAgentFingerprint: "",
    doctorsShown: false,
    slotsShown: false,
    bookingShown: false,
    userAskedDoctors: false,
  };
}

export interface AnalyzeOptions {
  /** Set when the agent just finished an utterance — re-evaluate even if text fingerprint unchanged. */
  agentJustSpoke?: boolean;
}

/** Analyze structured transcript messages and return updated context + optional UI intent. */
export function analyzeConversation(
  messages: TranscriptMessage[],
  prev: ConversationContext,
  options?: AnalyzeOptions
): ConversationAnalysis {
  const userLines = getUserMessages(messages);
  const agentLines = getAgentMessages(messages);

  if (userLines.length === 0) {
    return { context: prev, intent: null };
  }

  const lastUser = userLines[userLines.length - 1] ?? "";
  const lastAgent = agentLines[agentLines.length - 1] ?? "";
  const lastUserLower = lastUser.toLowerCase();
  const lastAgentLower = lastAgent.toLowerCase();
  const agentMentionedDoctors = agentLines.some((line) => agentOffersDoctors(line));
  const newAgentUtterance =
    lastAgent.length > 0 &&
    (options?.agentJustSpoke || fingerprint(lastAgent) !== prev.lastAgentFingerprint);

  const userAskedDoctors =
    prev.userAskedDoctors || userLines.some((l) => userAskedAboutDoctors(l));

  const agentDoctorText = collectAgentDoctorText(agentLines) || lastAgent;

  let phase = prev.phase;
  if (userAskedDoctors) phase = "user_asked_doctors";
  if (userAsksAvailability(lastUser) && prev.doctorsShown) phase = "user_asked_availability";
  if (userWantsToBook(lastUser) && prev.doctorsShown) phase = "user_wants_book";

  const context: ConversationContext = {
    ...prev,
    phase,
    clinicName: detectClinicName(lastUser) ?? detectClinicName(lastAgent) ?? prev.clinicName,
    patientName: extractPatientName(userLines) ?? prev.patientName,
    preferredDate: extractDate(`${lastUser} ${lastAgent}`) ?? prev.preferredDate,
    preferredTime: extractTime(`${lastUser} ${lastAgent}`) ?? prev.preferredTime,
    lastAgentFingerprint: lastAgent ? fingerprint(lastAgent) : prev.lastAgentFingerprint,
    lastAgentDoctorText: agentDoctorText,
    userAskedDoctors,
  };

  const readyToBook = userAskedDoctors && (prev.doctorsShown || agentMentionedDoctors);

  // Booking confirmation — "book it" after slots, or agent confirms
  if (!prev.bookingShown && prev.slotsShown && userWantsToBook(lastUserLower)) {
    return {
      context: {
        ...context,
        phase: "booking_confirmed",
        lastAction: "SHOW_BOOKING_CONFIRMATION",
        bookingShown: true,
      },
      intent: {
        action: "SHOW_BOOKING_CONFIRMATION",
        context: { ...context, phase: "booking_confirmed", bookingShown: true, lastAction: "SHOW_BOOKING_CONFIRMATION" },
      },
    };
  }

  if (!prev.bookingShown && prev.slotsShown && newAgentUtterance && agentConfirmsBooking(lastAgentLower)) {
    return {
      context: {
        ...context,
        phase: "booking_confirmed",
        lastAction: "SHOW_BOOKING_CONFIRMATION",
        bookingShown: true,
      },
      intent: {
        action: "SHOW_BOOKING_CONFIRMATION",
        context: { ...context, phase: "booking_confirmed", bookingShown: true, lastAction: "SHOW_BOOKING_CONFIRMATION" },
      },
    };
  }

  // Time slots — user says "book" OR asks availability + agent gives times
  const showSlots =
    !prev.slotsShown &&
    readyToBook &&
    (userWantsToBook(lastUserLower) ||
      (userAsksAvailability(lastUserLower) &&
        newAgentUtterance &&
        agentOffersTimeSlots(lastAgentLower)));

  if (showSlots) {
    return {
      context: {
        ...context,
        phase: "slots_shown",
        lastAction: "SHOW_TIME_SLOTS",
        slotsShown: true,
      },
      intent: {
        action: "SHOW_TIME_SLOTS",
        context: { ...context, phase: "slots_shown", slotsShown: true, lastAction: "SHOW_TIME_SLOTS" },
        query: { agentText: context.lastAgentDoctorText },
      },
    };
  }

  // Doctor cards — user asked + agent responded with doctor info
  if (
    !prev.doctorsShown &&
    userAskedDoctors &&
    newAgentUtterance &&
    (agentOffersDoctors(lastAgent) || agentMentionedDoctors)
  ) {
    return {
      context: {
        ...context,
        phase: "doctors_shown",
        lastAction: "SHOW_DOCTOR_CARDS",
        doctorsShown: true,
        lastAgentDoctorText: agentDoctorText,
      },
      intent: {
        action: "SHOW_DOCTOR_CARDS",
        context: {
          ...context,
          phase: "doctors_shown",
          doctorsShown: true,
          lastAction: "SHOW_DOCTOR_CARDS",
          lastAgentDoctorText: agentDoctorText,
        },
        query: { agentText: agentDoctorText },
      },
    };
  }

  // Directions
  if (
    includesAny(lastUserLower, ["directions", "how do i get", "how to get there", "where is it", "address"]) &&
    newAgentUtterance &&
    includesAny(lastAgentLower, ["address", "located", "directions", "oud metha", "al jaddaf", "building"])
  ) {
    return {
      context: { ...context, phase: "directions", lastAction: "SHOW_DIRECTIONS" },
      intent: {
        action: "SHOW_DIRECTIONS",
        context: { ...context, phase: "directions", lastAction: "SHOW_DIRECTIONS" },
        query: { clinicName: context.clinicName },
      },
    };
  }

  return { context, intent: null };
}

/** @deprecated use analyzeConversation with parsed messages */
export function detectIntentFromTranscript(transcript: string, prev: ConversationContext): DetectedIntent | null {
  const lines = transcript.split("\n").map((line) => {
    const m = line.match(/^(User|Agent|Assistant):\s*(.+)$/i);
    if (!m) return null;
    const role = m[1].toLowerCase() === "user" ? "user" : "agent";
    return { role, content: m[2] } as TranscriptMessage;
  }).filter(Boolean) as TranscriptMessage[];
  return analyzeConversation(lines, prev).intent;
}

export function buildBookingReference(entity: EntitySlug): string {
  const prefix = entity === "dhcc" ? "DHCC" : "C37";
  return `${prefix}-2026-${Math.floor(1000 + Math.random() * 9000)}`;
}
