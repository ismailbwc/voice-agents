# Voice Agents — Project Brief

Factual overview of the product, its scope, and what content appears in the UI today. For handoff to design and stakeholders.

---

## What this project is

A web app with **AI voice receptionists** for two Dubai Healthcare City entities:

| Entity | Agent name | Role |
|--------|------------|------|
| **DHCC** (Dubai Healthcare City) | Daana | Helps patients and visitors find doctors, discuss demo appointments, get directions, and answer FAQs |
| **C37** (medical co-working workspace) | Maya | Helps **patients** book consultations with C37 doctors, and **physicians** learn about membership and book workspace (consulting rooms, exam rooms, private offices) |

Callers speak to the agent through the browser (Retell AI). As the agent talks, it triggers server tools that update a **live side panel** on the same page with cards (doctors, slots, bookings, directions, workspaces, etc.).

Bookings and availability are **demo / mock data** from CSV files — not connected to a real hospital system or calendar.

---

## Who it serves

### DHCC
- Patients and visitors looking for specialists, clinics, or hospitals within DHCC
- People who want a demo appointment booking flow
- People asking for directions or general FAQs (insurance, parking, hours — answered by voice; not all have dedicated UI cards yet)

### C37
- **Patients** — find C37 member doctors and book consultation demos
- **Physicians** — membership info and booking of clinical workspace (rooms) by day / week / month

C37 is not a hospital. It provides consulting space for independent physicians; major procedures and emergencies go to partner DHCC hospitals.

---

## Scope — in

- Browser-based voice calls (start / end call, mic)
- Two entity pages with entity-specific agent and data
- Live assistance panel driven by agent custom functions during the call
- Mock directories from CSV (doctors, clinics/facilities, C37 workspaces)
- Demo patient appointment booking (reference numbers like `DHCC-2026-####` / `C37-2026-####`)
- Demo physician workspace reservation (reference like `C37-WS-2026-####`)
- Directions with facility name, address, phone, and map link
- Knowledge-base-backed spoken answers for FAQs and services

---

## Scope — out

- Real EHR, hospital scheduling, or calendar sync
- Payments or insurance claims processing
- User accounts / authentication
- SMS or email confirmations
- Medical advice or diagnosis
- Production-grade multi-server session persistence (UI state is in-memory per server instance)
- Dedicated UI cards for every FAQ topic (many FAQs are voice-only today)

---

## Pages / routes

| Route | Content |
|-------|---------|
| `/` | Landing — choose DHCC or C37 |
| `/dhcc` | DHCC receptionist (Daana) + assistance panel |
| `/c37` | C37 receptionist (Maya) + assistance panel |

---

## Screen regions (current structure)

Each entity page has two main regions:

1. **Left / primary**
   - Entity name and tagline
   - Receptionist avatar (placeholder image today)
   - Voice activity indicator (listening / speaking)
   - Call controls: Start Talking, End Call, connecting / error / call-ended messages

2. **Right / assistance panel** (“Booking & Assistance”)
   - Empty until the agent triggers a UI update during the call
   - Then shows one or more content blocks (doctors, slots, booking, directions, etc.)
   - Content can accumulate during a single call (e.g. doctor cards + slots + booking)

Landing page (`/`) only lists the two entities with name and tagline; no call UI.

---

## Call states

| State | Meaning |
|-------|---------|
| Idle | No call; user can start |
| Connecting | Call is being set up |
| Active | Call in progress (agent listening or speaking) |
| Ended | Call finished; user can start again |
| Error | Call failed; error message shown |

---

## UI content inventory

What the assistance panel can show. Fields listed are the **data** currently displayed — not visual design.

### Empty state
- Message: start a call and ask about doctors, clinics, workspace, or appointments
- Subtext: booking cards and confirmations appear as you talk

### No matching doctors
- Shown when a doctor-card update returns zero matches

### No matching workspaces (C37)
- Shown when a workspace-card update returns zero matches

### Doctor cards (DHCC + C37 patient path)
Section label: **Doctors Found**

Per doctor:
- Name
- Title · Specialty
- Clinic / facility name
- Rating
- Consultation fee (AED)
- Languages
- Selected state when that doctor is the one being booked / discussed

### Time slots (patient appointments, or C37 workspace availability)
Section label: **Available Slots** or **Workspace Availability**

- List of available times (time portion of each slot)

### Patient booking confirmation (DHCC + C37 patient path)
Label: **Booking Confirmed**

- Booking reference (e.g. `DHCC-2026-1234`)
- Patient name
- Doctor name
- Clinic name
- Date and time

### Directions (DHCC + C37)
- Facility / clinic name
- Address
- Phone
- Link to open in maps

### Clinics & facilities list
Supported in the panel when clinic data is present:

- Name
- Address
- Hours
- Get Directions link

(Primary path today is agent tools for doctors / slots / booking / directions; clinic list is less commonly triggered.)

### Membership overview (C37 physicians only)
Label: **For Physicians**

- Title (e.g. C37 Physician Membership)
- Pricing model summary
- Bullet list of membership highlights
- Apply URL (c37.ae)
- Phone number

### Workspace cards (C37 physicians only)
Section label: **Available Workspaces**

Per workspace:
- Name
- Type (Consulting Room / Exam Room / Private Office)
- Floor
- Facility name (Oud Metha or Al Jaddaf)
- Capacity
- Availability days
- Daily / weekly / monthly rates (AED)
- Amenities (up to four shown)
- Selected state when that workspace is being reserved

### Workspace booking confirmation (C37 physicians only)
Label: **Workspace Reserved**

- Reference (e.g. `C37-WS-2026-1234`)
- Physician name
- Workspace name
- Facility name
- Start date
- Billing plan (Daily / Weekly / Monthly) and rate (AED)

---

## Typical conversation flows

### DHCC — patient
1. User starts call on `/dhcc`
2. Asks for a specialty / doctor → **doctor cards**
3. Asks to book / for availability → **time slots**
4. Confirms name and time → **booking confirmation**
5. Asks how to get there → **directions**

### C37 — patient
1. User starts call on `/c37`
2. Maya asks whether they are a patient or a physician
3. Patient asks for a doctor → **doctor cards**
4. Book flow → **time slots** → **booking confirmation**
5. Optional → **directions**

### C37 — physician
1. User starts call on `/c37` and identifies as a physician
2. Membership questions → **membership overview**
3. Asks to book a room (facility / type) → **workspace cards**
4. Picks date and billing period → **workspace availability slots**
5. Confirms → **workspace reservation** ticket
6. Optional → **directions** to the facility

---

## Data sources (for context)

| Data | Location |
|------|----------|
| DHCC doctors / clinics | `docs/dhcc/doctors.csv`, `docs/dhcc/clinics.csv` |
| C37 doctors / facilities / workspaces | `docs/c37/doctors.csv`, `docs/c37/facilities.csv`, `docs/c37/workspaces.csv` |
| Agent spoken knowledge | Markdown in `docs/dhcc/` and `docs/c37/` (uploaded to Retell Knowledge Base) |

Runtime UI for cards is driven by those CSVs via API tools; spoken answers also use the Retell knowledge base.
