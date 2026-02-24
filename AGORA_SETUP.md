# Agora Meeting Setup Guide

## ✅ What's Implemented

1. **Database Tracking** (`lib/db.ts`)
   - In-memory database for testing
   - Tracks meeting creation, start, end, duration
   - Replace with MongoDB later

2. **Test Page** (`/dashboard/meeting-test`)
   - Generate meeting links
   - Mock appointments table
   - Copy/Join functionality

3. **Meeting Page** (`/meet/[linkId]`)
   - Agora video integration
   - Audio/Video controls
   - Meeting tracking

## 🚀 Quick Setup

### 1. Get Agora App ID

1. Go to [Agora Console](https://console.agora.io/)
2. Sign up/Login
3. Create a new project
4. Copy your **App ID**

### 2. Update Meeting Page

Open `app/meet/[linkId]/page.tsx` and replace:

```typescript
const APP_ID = "your_agora_app_id"; // Replace with your actual App ID
```

### 3. Test

1. Run `npm run dev`
2. Go to `dashboard/meeting-test`
3. Click "Generate Test Link"
4. Click "Join" button
5. Allow camera/microphone permissions
6. Video call starts!

## 📊 Database Structure

```typescript
{
  id: string,
  appointmentId: string,
  channel: string,
  linkId: string,
  patientName: string,
  doctorName: string,
  createdAt: Date,
  startedAt: Date | null,
  endedAt: Date | null,
  duration: number,
  status: 'scheduled' | 'ongoing' | 'completed'
}
```

## 🎮 Controls

- **Mic Button**: Toggle audio on/off
- **Video Button**: Toggle video on/off
- **Phone Button**: End call and save data

## 🔄 Replace with MongoDB

Update `lib/db.ts`:

```typescript
import { MongoClient } from 'mongodb';

const client = new MongoClient(process.env.MONGODB_URI!);
const db = client.db(process.env.MONGODB_DB);
const meetings = db.collection('meetings');

export const db = {
  createMeeting: async (data) => {
    const result = await meetings.insertOne(data);
    return result;
  },
  // ... other methods
};
```

## 📝 Notes

- Free Agora plan: 10,000 minutes/month
- Works on all browsers
- No backend needed for testing
- Data saved in memory (refresh = lost)
