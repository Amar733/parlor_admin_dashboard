# Meeting Link System - Visual Flow

## 📊 Complete System Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    ADMIN BOOKS APPOINTMENT                       │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
                    ┌────────────────┐
                    │ Select Type:   │
                    │ • In-Person    │
                    │ • Online ✓     │
                    └────────┬───────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                  BACKEND GENERATES LINK                          │
│  linkId = nanoid(16)  →  "abc123xyz456"                         │
│  channel = "consult_" + appointmentId                            │
│  expiresAt = appointmentEndTime                                  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   ADMIN SEES LINK IN TABLE                       │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Patient | Date | Status | Meeting        | Actions      │   │
│  │ John    | 1/20 | Active | [Join] [Copy]  | [Edit] [Del] │   │
│  └──────────────────────────────────────────────────────────┘   │
└────────────────────────────┬────────────────────────────────────┘
                             │
                    ┌────────┴────────┐
                    │                 │
                    ▼                 ▼
            ┌──────────────┐  ┌──────────────┐
            │ Click Copy   │  │ Click Join   │
            │ → Clipboard  │  │ → New Tab    │
            └──────────────┘  └──────┬───────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────┐
│              PATIENT/DOCTOR OPENS LINK                           │
│  https://yourdomain.com/meet/abc123xyz456                        │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                  BACKEND VALIDATES LINK                          │
│  GET /api/meetings/validate/abc123xyz456                         │
│                                                                   │
│  ✓ Link exists?                                                  │
│  ✓ Not expired?                                                  │
│  ✓ Status = Confirmed?                                           │
└────────────────────────────┬────────────────────────────────────┘
                             │
                    ┌────────┴────────┐
                    │                 │
                    ▼                 ▼
            ┌──────────────┐  ┌──────────────┐
            │   ✓ Valid    │  │   ✗ Invalid  │
            │              │  │   Show Error │
            └──────┬───────┘  └──────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SHOW MEETING PAGE                             │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              🎥 Online Consultation                        │  │
│  │                                                            │  │
│  │  Patient: John Doe                                        │  │
│  │  Doctor: Dr. Smith                                        │  │
│  │  Service: Skin Consultation                               │  │
│  │  Date: Jan 20, 2024 at 2:00 PM                           │  │
│  │                                                            │  │
│  │  ⚠️ Ensure camera and mic are working                     │  │
│  │                                                            │  │
│  │           [Join Consultation]                             │  │
│  └───────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                  DOCTOR STARTS MEETING                           │
│  POST /api/appointments/:id/start                                │
│  → status = "ongoing"                                            │
│  → meeting.startedAt = now()                                     │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    VIDEO CALL ACTIVE                             │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                                                            │  │
│  │         [Doctor Video]      [Patient Video]              │  │
│  │                                                            │  │
│  │  🎤 🎥 💬 🖥️ ⚙️                              [End Call]  │  │
│  └───────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   DOCTOR ENDS MEETING                            │
│  POST /api/appointments/:id/end                                  │
│  → status = "Completed"                                          │
│  → meeting.endedAt = now()                                       │
│  → meeting.duration = endedAt - startedAt                        │
│  → meeting.linkId = null (destroy link)                          │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DATA SAVED IN DB                              │
│  {                                                               │
│    status: "Completed",                                          │
│    meeting: {                                                    │
│      channel: "consult_123",                                     │
│      linkId: null,                                               │
│      expiresAt: "2024-01-20T15:00:00Z",                         │
│      startedAt: "2024-01-20T14:05:00Z",                         │
│      endedAt: "2024-01-20T14:35:00Z",                           │
│      duration: 1800  // 30 minutes                              │
│    }                                                             │
│  }                                                               │
└─────────────────────────────────────────────────────────────────┘
```

## 🔄 Auto-Expiry Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    CRON JOB (Every 10 min)                       │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              FIND EXPIRED APPOINTMENTS                           │
│  WHERE:                                                          │
│    status = "Confirmed" OR "Pending"                             │
│    meeting.expiresAt < now()                                     │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   UPDATE STATUS                                  │
│  SET status = "expired"                                          │
└─────────────────────────────────────────────────────────────────┘
```

## 🎯 Data Flow Diagram

```
┌──────────────┐
│   Frontend   │
│  (Admin UI)  │
└──────┬───────┘
       │ POST /api/appointments
       │ { type: "online", ... }
       ▼
┌──────────────┐
│   Backend    │
│  (API)       │──────┐
└──────┬───────┘      │ Generate
       │              │ linkId
       │              │ channel
       │              │ expiresAt
       │              ▼
       │         ┌─────────┐
       │         │ nanoid  │
       │         └─────────┘
       ▼
┌──────────────┐
│   MongoDB    │
│  (Database)  │
└──────┬───────┘
       │
       │ Return appointment
       │ with meeting data
       ▼
┌──────────────┐
│   Frontend   │
│  (Admin UI)  │
└──────┬───────┘
       │
       │ Display link
       │ [Join] [Copy]
       ▼
┌──────────────┐
│    User      │
│  (Patient)   │
└──────┬───────┘
       │ Click link
       │ /meet/abc123xyz456
       ▼
┌──────────────┐
│   Frontend   │
│ (Meeting UI) │
└──────┬───────┘
       │ GET /api/meetings/validate/:linkId
       ▼
┌──────────────┐
│   Backend    │
│  (Validate)  │
└──────┬───────┘
       │ Query MongoDB
       ▼
┌──────────────┐
│   MongoDB    │
│  (Check)     │
└──────┬───────┘
       │ Return appointment
       ▼
┌──────────────┐
│   Frontend   │
│ (Video SDK)  │
└──────────────┘
```

## 🔐 Security Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    SECURITY CHECKS                               │
└─────────────────────────────────────────────────────────────────┘

1. Link Generation
   ├─ Use nanoid(16) → 16 chars = 2.8 trillion combinations
   ├─ Unique constraint in DB
   └─ Collision probability: ~0.000000001%

2. Link Validation
   ├─ Check if linkId exists in DB
   ├─ Check if not expired (expiresAt > now)
   ├─ Check status (not Completed/Cancelled)
   └─ Return 404/410 if invalid

3. Time-Based Expiry
   ├─ Set expiresAt = appointment end time
   ├─ Cron job checks every 10 minutes
   └─ Auto-expire missed meetings

4. Link Destruction
   ├─ When meeting ends
   ├─ Set linkId = null
   └─ Prevent reuse

5. Status Validation
   ├─ Only "Confirmed" appointments can join
   ├─ "Completed" → link destroyed
   └─ "Cancelled" → link invalid
```

## 📱 User Journey

```
┌─────────────────────────────────────────────────────────────────┐
│                        ADMIN JOURNEY                             │
└─────────────────────────────────────────────────────────────────┘

1. Login to admin panel
2. Go to Appointments page
3. Click "Add Appointment"
4. Select "Online Consultation"
5. Fill patient, doctor, date, time
6. Click "Schedule Appointment"
7. See appointment in table with [Join] [Copy] buttons
8. Copy link and send to patient (WhatsApp/Email/SMS)
9. Monitor appointment status

┌─────────────────────────────────────────────────────────────────┐
│                       PATIENT JOURNEY                            │
└─────────────────────────────────────────────────────────────────┘

1. Receive meeting link from clinic
2. Click link at appointment time
3. See appointment details
4. Click "Join Consultation"
5. Grant camera/mic permissions
6. Wait for doctor to join
7. Consultation happens
8. Doctor ends call
9. Redirected to home/thank you page

┌─────────────────────────────────────────────────────────────────┐
│                       DOCTOR JOURNEY                             │
└─────────────────────────────────────────────────────────────────┘

1. Login to admin panel
2. See today's appointments
3. Click [Join] button at appointment time
4. Join video call
5. Conduct consultation
6. Click "End Call"
7. Meeting data saved automatically
8. Move to next appointment
```

## 🎨 UI Components

```
┌─────────────────────────────────────────────────────────────────┐
│                    APPOINTMENTS TABLE                            │
├─────────────────────────────────────────────────────────────────┤
│ Patient | Contact | Date | Time | Service | Doctor | Meeting   │
├─────────────────────────────────────────────────────────────────┤
│ John    | 123-456 | 1/20 | 2:00 | Skin    | Smith  │ [Join]    │
│ Doe     |         |      | PM   | Consult |        │ [Copy]    │
├─────────────────────────────────────────────────────────────────┤
│ Jane    | 789-012 | 1/20 | 3:00 | Hair    | Brown  │ -         │
│ Smith   |         |      | PM   | Care    |        │ (In-Person)│
└─────────────────────────────────────────────────────────────────┘

Legend:
• [Join] = Opens meeting in new tab
• [Copy] = Copies link to clipboard
• "-" = In-person appointment (no link)
```

---

**This visual guide complements the technical documentation.**
**Refer to other .md files for code examples and implementation details.**
