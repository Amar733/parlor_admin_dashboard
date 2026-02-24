# Meeting Link System - Quick Start

## ✅ What's Been Implemented (Frontend)

### 1. **Data Types Updated** (`lib/data.ts`)
- Added `type?: "online" | "offline"` to Appointment
- Added `meeting` object with linkId, channel, expiresAt, etc.

### 2. **Meeting Utilities** (`lib/meeting-utils.ts`)
- `generateMeetingLink()` - Creates unique meeting data
- `getMeetingUrl()` - Builds full meeting URL
- `copyToClipboard()` - Copies link to clipboard
- Helper functions for validation and formatting

### 3. **Admin Panel** (`app/dashboard/appointments/page.tsx`)
- New "Meeting" column in appointments table
- "Join" button to open meeting in new tab
- "Copy" button to copy link to clipboard
- Appointment type selector (In-Person / Online Consultation)
- Only shows for `type: "online"` appointments

### 4. **Meeting Page** (`app/meet/[linkId]/page.tsx`)
- Validates meeting link
- Shows appointment details
- "Join Consultation" button (ready for video SDK)
- Error handling for invalid/expired links

### 5. **Documentation**
- `MEETING_LINK_IMPLEMENTATION.md` - Full implementation guide
- `BACKEND_API_EXAMPLES.md` - Backend code examples

## 🔧 What You Need to Do (Backend)

### Step 1: Update MongoDB Schema
Add to your Appointment model:
```javascript
type: { type: String, enum: ['online', 'offline'], default: 'offline' },
meeting: {
  channel: String,
  linkId: String,
  expiresAt: Date,
  startedAt: Date,
  endedAt: Date,
  duration: Number
}
```

### Step 2: Install Dependencies
```bash
npm install nanoid node-cron
```

### Step 3: Generate Links on Booking
When creating appointment with `type: "online"`:
```javascript
const { nanoid } = require('nanoid');
const linkId = nanoid(16);
appointment.meeting = {
  channel: `consult_${appointmentId}`,
  linkId,
  expiresAt: new Date(`${date}T${endTime}:00`)
};
```

### Step 4: Create Validation Endpoint
```javascript
GET /api/meetings/validate/:linkId
// Returns appointment data or 404/410 error
```

### Step 5: Add Start/End Endpoints
```javascript
POST /api/appointments/:id/start  // Set startedAt
POST /api/appointments/:id/end    // Set endedAt, duration, destroy link
```

### Step 6: Setup Auto-Expire Cron
```javascript
cron.schedule('*/10 * * * *', async () => {
  // Expire appointments past their expiresAt time
});
```

## 🎥 Video SDK Integration

Choose one and integrate in `/app/meet/[linkId]/page.tsx`:

### Option 1: Jitsi Meet (Free, Open Source)
```javascript
const joinMeeting = () => {
  window.location.href = `https://meet.jit.si/${appointmentData.meeting.channel}`;
};
```

### Option 2: Agora (Scalable)
```bash
npm install agora-rtc-sdk-ng
```

### Option 3: Twilio Video (Enterprise)
```bash
npm install twilio-video
```

### Option 4: Daily.co (Easy)
```bash
npm install @daily-co/daily-js
```

## 📋 Testing Checklist

1. ✅ Create appointment with type "online"
2. ✅ See meeting link in admin panel
3. ✅ Copy link works
4. ✅ Join button opens link
5. ⏳ Backend validates link
6. ⏳ Video call works
7. ⏳ Start/end tracking works
8. ⏳ Auto-expiry works

## 🚀 Quick Test

1. Start your dev server: `npm run dev`
2. Go to Appointments page
3. Create new appointment
4. Select "Online Consultation" as type
5. Save appointment
6. You should see "Join" and copy buttons in the Meeting column
7. Click copy - link copied to clipboard
8. Click join - opens `/meet/{linkId}` page
9. Currently shows placeholder (needs backend + video SDK)

## 📁 Files Modified/Created

**Modified:**
- `lib/data.ts` - Updated Appointment type
- `app/dashboard/appointments/page.tsx` - Added meeting UI
- `package.json` - Added nanoid

**Created:**
- `lib/meeting-utils.ts` - Meeting utilities
- `app/meet/[linkId]/page.tsx` - Meeting page
- `MEETING_LINK_IMPLEMENTATION.md` - Full guide
- `BACKEND_API_EXAMPLES.md` - Backend examples
- `MEETING_LINK_QUICK_START.md` - This file

## 🔐 Security Features

- ✅ Unique 16-char IDs (nanoid)
- ✅ Time-based expiry
- ✅ Link destruction after meeting
- ✅ Status validation
- ⏳ Backend validation (needs implementation)

## 💡 Next Steps

1. Implement backend endpoints (see `BACKEND_API_EXAMPLES.md`)
2. Choose and integrate video SDK
3. Add start/end consultation buttons for doctors
4. Test end-to-end flow
5. Deploy to production

## 📞 Support

For detailed implementation:
- See `MEETING_LINK_IMPLEMENTATION.md`
- See `BACKEND_API_EXAMPLES.md`
- Check `/app/meet/[linkId]/page.tsx` for frontend
- Check `/lib/meeting-utils.ts` for utilities

---

**Status:** Frontend Complete ✅ | Backend Pending ⏳ | Video SDK Pending ⏳
