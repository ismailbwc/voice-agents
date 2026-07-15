# Retell AI Agent Setup Guide

Follow these steps in the [Retell Dashboard](https://dashboard.retellai.com) to configure both voice agents.

**UI panels are driven by Retell custom functions.** When the agent recommends doctors, it calls `show_doctor_cards` with exact doctor IDs from the knowledge base. Your server stores the cards and the browser polls for updates during the call.

> Transcript-based UI is kept as a fallback, but **custom functions are the reliable path**.

## 1. Create Knowledge Bases

### DHCC Knowledge Base

Upload all files from `docs/dhcc/`:

- overview.md, services.md, faqs.md
- **doctors-directory.md** (generated from CSV — includes doctor **ID** fields)
- **clinics-directory.md** (generated from CSV)
- **specialties-index.md** (generated from CSV)

### C37 Knowledge Base

Upload all files from `docs/c37/`:

- overview.md, services.md, membership.md, faqs.md
- **doctors-directory.md** (generated from CSV)
- **facilities-directory.md** (generated from CSV)
- **workspaces-directory.md** (generated from `workspaces.csv` — physician room booking)
- **partner-specialists.md** (DHCC referral doctors with `dhcc-doc-*` IDs for specialties C37 does not offer)
- **specialties-index.md** (generated from CSV)

> After editing `doctors.csv` or `workspaces.csv`, run `npm run sync-kb` to regenerate directory markdown, then re-upload to Retell.

## 2. Create Voice Agents

Create two **Single Prompt** voice agents:


| Agent                    | Prompt Source               | Knowledge Base | Voice Suggestion                  |
| ------------------------ | --------------------------- | -------------- | --------------------------------- |
| DHCC Receptionist (Daana) | `lib/prompts/dhcc-agent.md` | DHCC KB        | Warm professional female, English |
| C37 Receptionist (Maya)  | `lib/prompts/c37-agent.md`  | C37 KB         | Distinct warm female, English     |


Copy the full prompt text from each `.md` file into the agent's system prompt in Retell.

## 3. Add Custom Functions

See **[retell/custom-functions.md](custom-functions.md)** for full configuration.

**Shared (DHCC + C37 patient path):**

| Function                    | Purpose                                                   |
| --------------------------- | --------------------------------------------------------- |
| `show_doctor_cards`         | Agent passes `doctor_ids` → UI shows matching CSV doctors |
| `show_time_slots`           | Shows available appointment slots                         |
| `show_booking_confirmation` | Shows booking ticket                                      |
| `show_directions`           | Shows directions card                                     |

**C37-only (physician workspace path):**

| Function                   | Purpose                                                        |
| -------------------------- | -------------------------------------------------------------- |
| `show_membership_overview` | Membership benefits card for physician callers                 |
| `show_workspace_cards`     | Consulting / exam / private office cards from `workspaces.csv` |
| `show_workspace_slots`     | Availability for a workspace reservation                       |
| `show_workspace_booking`   | Workspace reservation ticket (`C37-WS-2026-####`)              |

**Important:** Function URLs must be publicly reachable. Use ngrok for local dev or deploy to Vercel.

### Disable auto end-call

In the Retell agent editor, go to **Functions** and **remove or disable the** `end_call` **function** if it is enabled.

Also re-paste the latest prompt from `lib/prompts/` after updates.

The app injects `{{call_rules}}` on each web call — ensure your prompt includes `Follow these per-call rules: {{call_rules}}`.

## 4. Environment Variables

Copy agent IDs from Retell Dashboard into `.env.local`:

```env
RETELL_API_KEY=your_api_key
RETELL_AGENT_ID_DHCC=agent_id_for_dhcc
RETELL_AGENT_ID_C37=agent_id_for_c37
```

## 5. How the UI Works

```
Agent calls show_doctor_cards({ doctor_ids: ["c37-doc-007"] })
        ↓
POST /api/tools/show-doctor-cards  (Retell webhook)
        ↓
Server looks up doctors in doctors.csv → stores UI state by call_id
        ↓
Browser polls GET /api/ui-state/{call_id} every 700ms
        ↓
Doctor cards appear in the side panel
```

| Agent action                     | UI shows                          |
| -------------------------------- | --------------------------------- |
| Calls `show_doctor_cards`        | Doctor cards (exact IDs from CSV) |
| Calls `show_time_slots`          | Time slots                        |
| Calls `show_booking_confirmation`| Booking ticket                    |
| Calls `show_directions`          | Directions card                   |
| Calls `show_membership_overview` | Membership benefits (C37)         |
| Calls `show_workspace_cards`     | Workspace / room cards (C37)      |
| Calls `show_workspace_slots`     | Workspace availability (C37)      |
| Calls `show_workspace_booking`   | Workspace reservation ticket      |

## 6. Test Checklist

- [ ] Deploy or run ngrok so Retell can reach `/api/tools/*`
- [ ] Configure patient functions on both agents; add C37-only workspace functions on C37 agent only
- [ ] Re-paste `lib/prompts/c37-agent.md` into the C37 agent
- [ ] Run `npm run sync-kb` and upload `doctors-directory.md` + `workspaces-directory.md` to C37 KB
- [ ] Start call on `/c37` — answer "patient" → ask for plastic surgeon → doctor cards appear
- [ ] Start call on `/c37` — answer "physician" → ask for consulting room at Oud Metha → workspace cards appear
- [ ] Complete workspace booking — slots and `C37-WS-2026-####` confirmation appear
