# Voice Agent Knowledge Base

## How data flows

```
doctors.csv / clinics.csv  ──►  npm run sync-kb  ──►  *-directory.md  ──►  Retell Knowledge Base
        │                                                    │
        └──────────────────►  /api/mock-data  ──►  UI panels during call
```

**CSV files are the single source of truth.** Edit doctors and clinics there, then run:

```bash
npm run sync-kb
```

This regenerates markdown files for Retell. Re-upload changed `.md` files to your Retell Knowledge Base.

## Folder structure

### DHCC (`docs/dhcc/`)

| File | Retell KB? | App UI? |
|------|------------|---------|
| `overview.md`, `services.md`, `faqs.md` | Upload | — |
| `doctors-directory.md` | Upload (generated) | — |
| `clinics-directory.md` | Upload (generated) | — |
| `specialties-index.md` | Upload (generated) | — |
| `doctors.csv` | — | Yes |
| `clinics.csv` | — | Yes |

### C37 (`docs/c37/`)

| File | Retell KB? | App UI? |
|------|------------|---------|
| `overview.md`, `services.md`, `membership.md`, `faqs.md` | Upload | — |
| `doctors-directory.md` | Upload (generated) | — |
| `facilities-directory.md` | Upload (generated) | — |
| `specialties-index.md` | Upload (generated) | — |
| `doctors.csv` | — | Yes |
| `facilities.csv` | — | Yes |

## Updating doctors or clinics

1. Edit the CSV file(s)
2. Run `npm run sync-kb`
3. Re-upload the generated `*-directory.md` and `specialties-index.md` to Retell
4. Restart dev server if running locally (UI reads CSV on each request)

## Retell Knowledge Base upload checklist

**DHCC KB:** overview, services, faqs, doctors-directory, clinics-directory, specialties-index

**C37 KB:** overview, services, membership, faqs, doctors-directory, facilities-directory, specialties-index

Recommended settings: **3 chunks**, **0.6 similarity**
