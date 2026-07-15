# Voice Agents — DHCC & C37

AI voice receptionists for **Dubai Healthcare City** and **C37**, powered by [Retell AI](https://retellai.com).

## Routes

| URL | Entity |
|-----|--------|
| `/` | Landing page |
| `/dhcc` | DHCC voice receptionist (Daana) |
| `/c37` | C37 voice receptionist (Maya) |

## Quick Start

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Add your Retell API key, agent IDs, and app URL

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

```env
RETELL_API_KEY=
RETELL_AGENT_ID_DHCC=
RETELL_AGENT_ID_C37=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Knowledge Base

Structured docs live in `docs/`:

- `docs/dhcc/` — DHCC markdown + doctors.csv + clinics.csv
- `docs/c37/` — C37 markdown + doctors.csv + facilities.csv
- `docs/source/` — Original research documents (ignored in git)

Upload `.md` files to Retell Knowledge Bases. CSV files are used by the app's tool APIs at runtime.

Generated directory markdown files such as `doctors-directory.md` and `specialties-index.md` are intentionally ignored in git. Regenerate them with `npm run sync-kb` before uploading to Retell.

## Retell Agent Setup

See [retell/SETUP.md](retell/SETUP.md) for full dashboard configuration including agent prompts and custom functions.

Agent prompts are in `lib/prompts/dhcc-agent.md` and `lib/prompts/c37-agent.md`.

## Architecture

- **Frontend:** Next.js 15, Tailwind CSS
- **Voice:** Retell Web SDK (`retell-client-js-sdk`) with Web Audio visualizer
- **Backend:** Next.js API route for web call tokens + mock data from CSV
- **UI mockups:** Driven by Retell custom functions (`show_doctor_cards`, etc.) with transcript fallback

During a call, the app watches the conversation and shows doctor cards, clinic lists, time slots, booking confirmations, or directions only when the dialogue calls for it. Mock data comes from `docs/*.csv`.

## Replacing Placeholder Images

Receptionist avatar: `public/images/receptionist.png` (used for both DHCC and C37).
Doctor photos: `public/doctors/` (Fatima Al Hashimi → `doctor_f2.jpg`).
Clinic / workspace photos: `public/clinics/`.
