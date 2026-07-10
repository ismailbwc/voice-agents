# Retell Custom Functions Setup

The agent calls these functions during a call. Each function hits your Next.js API, updates UI state for that `call_id`, and the browser polls `/api/ui-state/{call_id}` to show cards.

**Requirement:** Retell must reach your server over the public internet. For local dev, use [ngrok](https://ngrok.com) or deploy to Vercel.

Replace `YOUR_PUBLIC_URL` with your deployed URL or ngrok URL (no trailing slash).

If you deploy on Vercel, `YOUR_PUBLIC_URL` will look like:

```text
https://your-app-name.vercel.app
```

## Which Retell option to choose

Use **Custom Function**, not **Code Function / Code Tool**.

- **Custom Function**: Retell sends an HTTP request to your Next.js API route. This is what this project uses.
- **Code Function / Code Tool**: runs JavaScript inside Retell's sandbox. Do not use it here, because it cannot update your app's UI state through your server routes.

## Dashboard field mapping

These labels match the Retell modal in your screenshots.

### Top section

| Retell field | Value |
|-------|-------|
| Name | Use the exact function name below |
| Description | Copy the matching description below |
| API Endpoint method | `POST` |
| API Endpoint URL | `https://YOUR_PUBLIC_URL/api/tools/...` |
| Timeout (ms) | `120000` |
| Headers | Leave empty |
| Query Parameters | Leave empty |

### Request Body section

- Use the **JSON** tab, not **Form**
- Keep **Payload: args only** **OFF**

Retell must send the full request body so your API receives `call.call_id` and `call.metadata.entity`.

Expected shape:

```json
{
  "name": "show_doctor_cards",
  "call": {
    "call_id": "call_123",
    "metadata": { "entity": "c37" }
  },
  "args": {
    "doctor_ids": ["c37-doc-007", "c37-doc-010"]
  }
}
```

If **Payload: args only** is turned on, the UI will not update because the server will not receive the call context it needs.

### Store Fields as Variables

Leave this empty for all four functions. The app updates the screen by polling `/api/ui-state/{callId}`, not by reading Retell dynamic variables.

### During Execution Feedback

| Retell field | Recommended setting |
|-------|-------|
| Talk While Waiting | ON for `show_doctor_cards` and `show_time_slots`; OFF for the other two |
| Play typing sound | Optional |
| Talk After Action Completed | ON for all four |

---

## 1. show_doctor_cards

| Field | Value |
|-------|-------|
| Name | `show_doctor_cards` |
| Description | Display doctor cards on the patient's screen. Call every time you recommend doctors. Pass exact doctor IDs from the Doctor Directory. |
| Method | POST |
| URL | `YOUR_PUBLIC_URL/api/tools/show-doctor-cards` |
| Speak during execution | Yes — e.g. "Let me pull up those doctors for you." |
| Speak after execution | Yes |

**Parameters (JSON schema):**

```json
{
  "type": "object",
  "properties": {
    "doctor_ids": {
      "type": "array",
      "description": "Exact doctor IDs from the Doctor Directory, e.g. c37-doc-007",
      "items": { "type": "string" }
    },
    "specialty": {
      "type": "string",
      "description": "Fallback: specialty name if IDs are unavailable"
    }
  }
}
```

---

## 2. show_time_slots

| Field | Value |
|-------|-------|
| Name | `show_time_slots` |
| Description | Display available appointment time slots on the patient's screen. |
| Method | POST |
| URL | `YOUR_PUBLIC_URL/api/tools/show-time-slots` |
| Speak during execution | Yes |
| Speak after execution | Yes |

**Parameters:**

```json
{
  "type": "object",
  "properties": {
    "date": {
      "type": "string",
      "description": "Appointment date in YYYY-MM-DD format"
    },
    "doctor_id": {
      "type": "string",
      "description": "Optional doctor ID for context"
    }
  }
}
```

---

## 3. show_booking_confirmation

| Field | Value |
|-------|-------|
| Name | `show_booking_confirmation` |
| Description | Display booking confirmation ticket on the patient's screen after appointment is confirmed. |
| Method | POST |
| URL | `YOUR_PUBLIC_URL/api/tools/show-booking-confirmation` |
| Speak during execution | No |
| Speak after execution | Yes |

**Parameters:**

```json
{
  "type": "object",
  "required": ["patient_name"],
  "properties": {
    "doctor_id": { "type": "string", "description": "Doctor ID from directory" },
    "patient_name": { "type": "string", "description": "Patient full name" },
    "date": { "type": "string", "description": "YYYY-MM-DD" },
    "time": { "type": "string", "description": "HH:MM 24-hour format" }
  }
}
```

---

## 4. show_directions

| Field | Value |
|-------|-------|
| Name | `show_directions` |
| Description | Display directions card with map link on the patient's screen. |
| Method | POST |
| URL | `YOUR_PUBLIC_URL/api/tools/show-directions` |
| Speak during execution | No |
| Speak after execution | Yes |

**Parameters:**

```json
{
  "type": "object",
  "properties": {
    "clinic_id": { "type": "string", "description": "Clinic/facility ID from directory" },
    "name": { "type": "string", "description": "Clinic or facility name" }
  }
}
```

---

## C37-only functions (physician workspace booking)

Add these **only on the C37 Retell agent**, not DHCC. Physicians are also C37 customers — they book consulting rooms, exam rooms, and private offices.

### 5. show_membership_overview

| Field | Value |
|-------|-------|
| Name | `show_membership_overview` |
| Description | Display C37 physician membership benefits on the caller's screen when a doctor asks about joining or what's included. |
| Method | POST |
| URL | `YOUR_PUBLIC_URL/api/tools/show-membership-overview` |
| Speak during execution | Yes |
| Speak after execution | Yes |

**Parameters:**

```json
{
  "type": "object",
  "properties": {
    "topic": {
      "type": "string",
      "description": "Optional focus topic, e.g. licensing, billing, facilities"
    }
  }
}
```

### 6. show_workspace_cards

| Field | Value |
|-------|-------|
| Name | `show_workspace_cards` |
| Description | Display bookable C37 workspace cards (consulting rooms, exam rooms, private offices) for physician callers. Always call this before describing rooms aloud. |
| Method | POST |
| URL | `YOUR_PUBLIC_URL/api/tools/show-workspace-cards` |
| Speak during execution | Yes |
| Speak after execution | Yes |

**Parameters:**

```json
{
  "type": "object",
  "properties": {
    "workspace_ids": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Exact workspace IDs from the Workspaces Directory, e.g. c37-ws-001"
    },
    "facility_id": {
      "type": "string",
      "description": "Filter by facility: c37-oud-metha or c37-al-jaddaf"
    },
    "type": {
      "type": "string",
      "description": "Filter by room type: consulting_room, exam_room, or private_office"
    }
  }
}
```

### 7. show_workspace_slots

| Field | Value |
|-------|-------|
| Name | `show_workspace_slots` |
| Description | Display available start times for a C37 workspace reservation on the caller's screen. |
| Method | POST |
| URL | `YOUR_PUBLIC_URL/api/tools/show-workspace-slots` |
| Speak during execution | Yes |
| Speak after execution | Yes |

**Parameters:**

```json
{
  "type": "object",
  "properties": {
    "workspace_id": {
      "type": "string",
      "description": "Workspace ID from the Workspaces Directory"
    },
    "date": {
      "type": "string",
      "description": "Start date in YYYY-MM-DD format"
    },
    "billing_period": {
      "type": "string",
      "description": "daily, weekly, or monthly"
    }
  }
}
```

### 8. show_workspace_booking

| Field | Value |
|-------|-------|
| Name | `show_workspace_booking` |
| Description | Display workspace reservation confirmation ticket after a physician books a room. |
| Method | POST |
| URL | `YOUR_PUBLIC_URL/api/tools/show-workspace-booking` |
| Speak during execution | No |
| Speak after execution | Yes |

**Parameters:**

```json
{
  "type": "object",
  "required": ["physician_name", "workspace_id"],
  "properties": {
    "workspace_id": { "type": "string", "description": "Workspace ID from directory" },
    "physician_name": { "type": "string", "description": "Physician full name" },
    "date": { "type": "string", "description": "YYYY-MM-DD start date" },
    "billing_period": { "type": "string", "description": "daily, weekly, or monthly" }
  }
}
```

---

## Local development with ngrok

```bash
# Terminal 1
npm run dev

# Terminal 2
ngrok http 3000
```

Use the ngrok HTTPS URL as `YOUR_PUBLIC_URL` in all function URLs above.

After editing `doctors.csv` or `workspaces.csv`, run `npm run sync-kb` and re-upload the generated `*-directory.md` files to Retell so the agent sees the **ID** fields.

## Disable end_call

In the Retell agent editor → **Functions**, remove or disable `end_call` so the agent does not hang up mid-conversation.
