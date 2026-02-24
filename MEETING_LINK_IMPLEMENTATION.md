# Meeting Link System - Implementation Guide

## Overview

This system enables online consultations with unique, secure meeting links for each appointment.

## Features Implemented

✅ **Unique Meeting Link Generation** - Each online appointment gets a unique 16-character link ID
✅ **Link Validation** - Links expire automatically after appointment end time
✅ **Admin Interface** - View, copy, and open meeting links directly from appointments table
✅ **Appointment Type Selection** - Choose between "In-Person" or "Online Consultation"
✅ **Meeting Data Tracking** - Store channel, linkId, expiresAt, startedAt, endedAt, duration

## Frontend Implementation

### 1. Updated Data Types (`lib/data.ts`)

```typescript
export type Appointment = {
  // ... existing fields
  type?: "online" | "offline";
  meeting?: {
    channel: string;
    linkId: string;
    expiresAt: Date;
    startedAt?: Date;
    endedAt?: Date;
    duration?: number;
  };
};
```

### 2. Meeting Utilities (`lib/meeting-utils.ts`)

- `generateMeetingLink()` - Creates unique meeting data
- `getMeetingUrl()` - Constructs full meeting URL
- `isMeetingExpired()` - Checks if link is expired
- `copyToClipboard()` - Copies link to clipboard
- `formatDuration()` - Formats meeting duration

### 3. Admin Panel Updates (`app/dashboard/appointments/page.tsx`)

- Added "Meeting" column to appointments table
- "Join" button to open meeting in new tab
- "Copy" button to copy link to clipboard
- Appointment type selector in create/edit dialog
- Only shows meeting controls for online appointments

## Backend Implementation Required

### 1. Update Appointment Schema

Add to your MongoDB appointment schema:

```javascript
{
  type: {
    type: String,
    enum: ['online', 'offline'],
    default: 'offline'
  },
  meeting: {
    channel: String,
    linkId: String,
    expiresAt: Date,
    startedAt: Date,
    endedAt: Date,
    duration: Number
  }
}
```

### 2. Generate Link on Booking (POST /api/appointments)

```javascript
import { nanoid } from 'nanoid';

if (req.body.type === 'online') {
  const linkId = nanoid(16);
  const channel = `consult_${appointmentId}`;
  const expiresAt = new Date(`${date}T${endTime}:00`);
  
  appointment.meeting = {
    channel,
    linkId,
    expiresAt
  };
}
```

### 3. Validate Link (GET /meet/:linkId)

```javascript
app.get('/meet/:linkId', async (req, res) => {
  const appt = await Appointment.findOne({ 'meeting.linkId': req.params.linkId });
  
  if (!appt) return res.status(404).send('Invalid link');
  
  if (new Date() > appt.meeting.expiresAt || appt.status === 'completed') {
    appt.status = 'expired';
    await appt.save();
    return res.status(410).send('Meeting expired');
  }
  
  res.render('meeting', { appointmentId: appt._id });
});
```

### 4. Start Consultation (POST /api/appointments/:id/start)

```javascript
appointment.status = 'ongoing';
appointment.meeting.startedAt = new Date();
await appointment.save();
```

### 5. End Consultation (POST /api/appointments/:id/end)

```javascript
appointment.status = 'completed';
appointment.meeting.endedAt = new Date();
appointment.meeting.duration = 
  (appointment.meeting.endedAt - appointment.meeting.startedAt) / 1000;
appointment.meeting.linkId = null; // Destroy link
await appointment.save();
```

### 6. Auto-Expire Cron Job

```javascript
cron.schedule('*/10 * * * *', async () => {
  await Appointment.updateMany(
    { 
      status: 'scheduled', 
      'meeting.expiresAt': { $lt: new Date() } 
    },
    { status: 'expired' }
  );
});
```

## Testing Checklist

- [ ] Create online appointment → link generated
- [ ] Admin sees meeting link in table
- [ ] Copy link button works
- [ ] Join button opens link in new tab
- [ ] In-person appointments show "-" in meeting column
- [ ] Deleted appointments disable meeting buttons
- [ ] Link format: `https://yourdomain.com/meet/{linkId}`

## Security Features

- **Unique IDs**: 16-character nanoid (collision-resistant)
- **Time-based Expiry**: Links expire after appointment end time
- **Link Destruction**: Links destroyed when consultation ends
- **Status Validation**: Expired/completed appointments can't be joined

## Next Steps

1. Implement backend API endpoints listed above
2. Create `/meet/:linkId` page with video conferencing integration
3. Add start/end consultation buttons for doctors
4. Set up cron job for auto-expiry
5. Integrate video SDK (Agora, Twilio, Jitsi, etc.)

## Video Integration Options

- **Jitsi Meet** - Open source, self-hosted
- **Agora** - Scalable, good for production
- **Twilio Video** - Enterprise-grade
- **Daily.co** - Easy integration

## Notes

- Meeting links are only generated for `type: "online"` appointments
- The `channel` field can be used for video SDK room identification
- Duration is stored in seconds for easy calculation
- Frontend is ready - backend implementation needed
