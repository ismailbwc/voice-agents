# C37 Partner Specialists (DHCC Referrals)

C37 does **not** offer every specialty on-site. When a patient asks for a specialty that is **not** in the C37 Doctor Directory, refer them to partner **DHCC** specialists below.

When recommending these doctors:
1. Explain they practice at a DHCC partner hospital (not inside C37)
2. **Call `show_doctor_cards`** with their exact **DHCC IDs** (e.g. `dhcc-doc-003`) so the patient's screen shows the correct card, photo, clinic, and fee
3. You may also pass `specialty` (e.g. `"Cardiology"`) — the UI can resolve DHCC doctors by specialty when C37 has none

## Cardiology

### Dr. Miguel Fernandez
- **ID:** `dhcc-doc-003`
- **Title:** Consultant Cardiologist
- **Specialty:** Cardiology
- **Clinic:** Mediclinic City Hospital (`dhcc-mediclinic`)
- **Languages:** English
- **Consultation fee:** AED 500

## Orthopedic Surgery

### Dr. Juan Gomez
- **ID:** `dhcc-doc-001`
- **Title:** Consultant Surgeon
- **Specialty:** Orthopedic Surgery
- **Clinic:** Dr. Sulaiman Al Habib Hospital (`dhcc-habib`)
- **Languages:** English, Arabic
- **Consultation fee:** AED 450

## Pediatrics (hospital / complex care)

C37 has outpatient pediatrics. For hospital-based pediatric care, refer to:

### Dr. Fatima Al Hashimi
- **ID:** `dhcc-doc-004`
- **Title:** Consultant Pediatrician
- **Specialty:** Pediatrics
- **Clinic:** Al Jalila Children's Specialty Hospital (`dhcc-jalila`)
- **Languages:** English, Arabic, French
- **Consultation fee:** AED 400

## Ophthalmology

### Dr. James Whitfield
- **ID:** `dhcc-doc-005`
- **Title:** Consultant Ophthalmologist
- **Specialty:** Ophthalmology
- **Clinic:** Moorfields Eye Hospital Dubai (`dhcc-moorfields`)
- **Languages:** English
- **Consultation fee:** AED 480

## Neurology

### Dr. Omar Khalil
- **ID:** `dhcc-doc-007`
- **Title:** Consultant Neurologist
- **Specialty:** Neurology
- **Clinic:** Emirates Specialty Hospital (`dhcc-emirates`)
- **Languages:** English, Arabic
- **Consultation fee:** AED 520

## Oncology

### Dr. Raj Patel
- **ID:** `dhcc-doc-011`
- **Title:** Consultant Oncologist
- **Specialty:** Oncology
- **Clinic:** Al Jalila Children's Specialty Hospital (`dhcc-jalila`)
- **Languages:** English, Hindi
- **Consultation fee:** AED 550

## ENT (hospital)

### Dr. Ahmed Farouk
- **ID:** `dhcc-doc-013`
- **Title:** Consultant ENT Surgeon
- **Specialty:** ENT
- **Clinic:** Mediclinic City Hospital (`dhcc-mediclinic`)
- **Languages:** English, Arabic, French
- **Consultation fee:** AED 410

## Psychiatry

### Dr. Maria Santos
- **ID:** `dhcc-doc-014`
- **Title:** Consultant Psychiatrist
- **Specialty:** Psychiatry
- **Clinic:** Dr. Sulaiman Al Habib Hospital (`dhcc-habib`)
- **Languages:** English, Portuguese, Arabic
- **Consultation fee:** AED 440

---

For directions to a DHCC hospital after a referral, call `show_directions` with the clinic id (e.g. `dhcc-mediclinic`) or hospital name.
