# Time-Based Access Control - Backend Implementation Guide

## Overview
This document provides the complete backend schema and API specifications for implementing time-based access control for the POS system and other protected pages.

## Admin Panel
Frontend admin panel is available at: `/dashboard/settings/access-time`

The admin panel allows managing:
- Multiple page configurations (POS, Inventory, Reports)
- Operating hours and grace periods
- Active days of the week
- Break times (lunch, tea breaks, etc.)
- Holidays with custom reasons
- Custom messages for different scenarios

---

## MongoDB Schema

### Collection: `access_times`

```javascript
{
  _id: ObjectId("..."),
  
  // Identifier
  key: "pos_access_time",              // Unique key for different pages
  pageName: "Point of Sale",           // Display name
  
  // Time Configuration
  openTime: "09:00",                   // Format: HH:mm (24-hour)
  closeTime: "21:00",                  // Format: HH:mm (24-hour)
  timezone: "Asia/Kolkata",            // IANA timezone
  
  // Advanced Settings
  isEnabled: true,                     // Master enable/disable
  allowWeekends: true,                 // Allow access on weekends
  daysOfWeek: [1,2,3,4,5,6,0],        // 0=Sunday, 1=Monday, etc.
  
  // Break Times (Optional)
  breakTimes: [
    {
      startTime: "13:00",
      endTime: "14:00",
      reason: "Lunch Break"
    }
  ],
  
  // Special Dates (Optional)
  holidays: [
    {
      date: "2024-01-26",              // Format: YYYY-MM-DD
      reason: "Republic Day"
    }
  ],
  
  // Grace Period
  gracePeriodMinutes: 15,              // Allow access 15 mins before opening
  
  // Override Access
  overrideUsers: [                     // User IDs who can bypass restrictions
    ObjectId("user_id_1"),
    ObjectId("user_id_2")
  ],
  
  // Messages
  messages: {
    beforeOpen: "POS will open at {openTime}. Please wait.",
    afterClose: "POS is closed. Operating hours: {openTime} - {closeTime}. Contact admin for access.",
    onBreak: "System is on break until {endTime}.",
    onHoliday: "System is closed today for {reason}."
  },
  
  // Metadata
  createdBy: ObjectId("admin_user_id"),
  createdAt: ISODate("2024-01-15T10:00:00Z"),
  updatedAt: ISODate("2024-01-15T10:00:00Z")
}
```

---

## Mongoose Schema (Node.js)

```javascript
const mongoose = require('mongoose');

const accessTimeSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  pageName: {
    type: String,
    required: true
  },
  openTime: {
    type: String,
    required: true,
    match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
  },
  closeTime: {
    type: String,
    required: true,
    match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
  },
  timezone: {
    type: String,
    default: 'Asia/Kolkata'
  },
  isEnabled: {
    type: Boolean,
    default: true
  },
  allowWeekends: {
    type: Boolean,
    default: true
  },
  daysOfWeek: {
    type: [Number],
    default: [0,1,2,3,4,5,6],
    validate: {
      validator: function(arr) {
        return arr.every(day => day >= 0 && day <= 6);
      }
    }
  },
  breakTimes: [{
    startTime: String,
    endTime: String,
    reason: String
  }],
  holidays: [{
    date: String,
    reason: String
  }],
  gracePeriodMinutes: {
    type: Number,
    default: 0,
    min: 0,
    max: 60
  },
  overrideUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  messages: {
    beforeOpen: String,
    afterClose: String,
    onBreak: String,
    onHoliday: String
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('AccessTime', accessTimeSchema);
```

---

## API Endpoints

### 1. Get Access Time Configuration

**Endpoint:** `GET /api/settings/access-time`

**Query Parameters:**
- `key` (optional): Specific page key (default: "pos_access_time")

**Response:**
```json
{
  "success": true,
  "data": {
    "key": "pos_access_time",
    "pageName": "Point of Sale",
    "openTime": "09:00",
    "closeTime": "21:00",
    "timezone": "Asia/Kolkata",
    "isEnabled": true,
    "allowWeekends": true,
    "daysOfWeek": [1,2,3,4,5,6,0],
    "breakTimes": [
      {
        "startTime": "13:00",
        "endTime": "14:00",
        "reason": "Lunch Break"
      }
    ],
    "holidays": [
      {
        "date": "2024-01-26",
        "reason": "Republic Day"
      }
    ],
    "gracePeriodMinutes": 15,
    "messages": {
      "beforeOpen": "POS will open at 09:00. Please wait.",
      "afterClose": "POS is closed. Operating hours: 09:00 - 21:00. Contact admin for access.",
      "onBreak": "System is on break until 14:00.",
      "onHoliday": "System is closed today for Republic Day."
    },
    "serverTime": "2024-01-15T08:45:30.123Z",
    "isAccessible": false,
    "reason": "BEFORE_OPEN",
    "nextOpenTime": "2024-01-15T09:00:00.000Z"
  }
}
```

### 2. Update Access Time Configuration (Admin Only)

**Endpoint:** `POST /api/settings/access-time`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Request Body:**
```json
{
  "key": "pos_access_time",
  "pageName": "Point of Sale",
  "openTime": "09:00",
  "closeTime": "21:00",
  "timezone": "Asia/Kolkata",
  "isEnabled": true,
  "allowWeekends": true,
  "daysOfWeek": [1,2,3,4,5,6],
  "breakTimes": [
    {
      "startTime": "13:00",
      "endTime": "14:00",
      "reason": "Lunch Break"
    }
  ],
  "holidays": [
    {
      "date": "2024-01-26",
      "reason": "Republic Day"
    }
  ],
  "gracePeriodMinutes": 15,
  "messages": {
    "beforeOpen": "POS will open at {openTime}. Please wait.",
    "afterClose": "POS is closed. Operating hours: {openTime} - {closeTime}. Contact admin for access.",
    "onBreak": "System is on break until {endTime}.",
    "onHoliday": "System is closed today for {reason}."
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Access time configuration updated successfully",
  "data": {
    "_id": "...",
    "key": "pos_access_time",
    ...
  }
}
```

### 3. Check User Access (Optional - for override users)

**Endpoint:** `GET /api/settings/access-time/check`

**Headers:**
```
Authorization: Bearer <user_token>
```

**Query Parameters:**
- `key`: Page key (required)

**Response:**
```json
{
  "success": true,
  "data": {
    "hasAccess": true,
    "reason": "OVERRIDE_USER",
    "message": "You have override access to this page"
  }
}
```

---

## Backend Logic Implementation

### Access Validation Logic

```javascript
const moment = require('moment-timezone');

async function validateAccess(key, userId) {
  const config = await AccessTime.findOne({ key, isEnabled: true });
  
  if (!config) {
    return { isAccessible: true, reason: 'NO_RESTRICTION' };
  }
  
  // Check override users
  if (config.overrideUsers.includes(userId)) {
    return { isAccessible: true, reason: 'OVERRIDE_USER' };
  }
  
  const now = moment().tz(config.timezone);
  const currentDay = now.day();
  const currentDate = now.format('YYYY-MM-DD');
  const currentTime = now.format('HH:mm');
  
  // Check if today is allowed
  if (!config.daysOfWeek.includes(currentDay)) {
    return {
      isAccessible: false,
      reason: 'DAY_NOT_ALLOWED',
      message: 'Access not allowed on this day'
    };
  }
  
  // Check holidays
  const holiday = config.holidays.find(h => h.date === currentDate);
  if (holiday) {
    return {
      isAccessible: false,
      reason: 'HOLIDAY',
      message: config.messages.onHoliday.replace('{reason}', holiday.reason)
    };
  }
  
  // Check break times
  for (const breakTime of config.breakTimes) {
    if (currentTime >= breakTime.startTime && currentTime < breakTime.endTime) {
      return {
        isAccessible: false,
        reason: 'ON_BREAK',
        message: config.messages.onBreak.replace('{endTime}', breakTime.endTime),
        nextOpenTime: moment.tz(`${currentDate} ${breakTime.endTime}`, config.timezone).toISOString()
      };
    }
  }
  
  // Apply grace period
  const openTimeWithGrace = moment.tz(
    `${currentDate} ${config.openTime}`,
    config.timezone
  ).subtract(config.gracePeriodMinutes, 'minutes');
  
  const closeTime = moment.tz(
    `${currentDate} ${config.closeTime}`,
    config.timezone
  );
  
  // Check if before opening
  if (now.isBefore(openTimeWithGrace)) {
    return {
      isAccessible: false,
      reason: 'BEFORE_OPEN',
      message: config.messages.beforeOpen.replace('{openTime}', config.openTime),
      nextOpenTime: openTimeWithGrace.toISOString()
    };
  }
  
  // Check if after closing
  if (now.isAfter(closeTime)) {
    return {
      isAccessible: false,
      reason: 'AFTER_CLOSE',
      message: config.messages.afterClose
        .replace('{openTime}', config.openTime)
        .replace('{closeTime}', config.closeTime)
    };
  }
  
  return { isAccessible: true, reason: 'WITHIN_HOURS' };
}

module.exports = { validateAccess };
```

---

## Initial Data Setup

```javascript
// Run this once to set up initial configuration
db.access_times.insertOne({
  key: "pos_access_time",
  pageName: "Point of Sale",
  openTime: "09:00",
  closeTime: "21:00",
  timezone: "Asia/Kolkata",
  isEnabled: true,
  allowWeekends: true,
  daysOfWeek: [1,2,3,4,5,6,0],
  breakTimes: [
    {
      startTime: "13:00",
      endTime: "14:00",
      reason: "Lunch Break"
    }
  ],
  holidays: [],
  gracePeriodMinutes: 15,
  overrideUsers: [],
  messages: {
    beforeOpen: "POS will open at {openTime}. Please wait.",
    afterClose: "POS is closed. Operating hours: {openTime} - {closeTime}. Contact admin for access.",
    onBreak: "System is on break until {endTime}.",
    onHoliday: "System is closed today for {reason}."
  },
  createdAt: new Date(),
  updatedAt: new Date()
});
```

---

## Environment Variables

Add to your backend `.env`:

```env
DEFAULT_TIMEZONE=Asia/Kolkata
ACCESS_TIME_CHECK_INTERVAL=30000  # 30 seconds
```

---

## Security Considerations

1. **Authentication**: All endpoints must require valid JWT tokens
2. **Authorization**: Only admin users can modify access time configurations
3. **Rate Limiting**: Implement rate limiting on check endpoints
4. **Audit Logging**: Log all configuration changes
5. **Server Time**: Always use server time, never trust client time

---

## Testing

### Test Cases

1. Access before opening time (with/without grace period)
2. Access during operating hours
3. Access after closing time
4. Access during break times
5. Access on holidays
6. Access on restricted days
7. Override user access
8. Disabled configuration (should allow access)

---

## Frontend Integration

### Protected Pages
Wrap any page with `TimeLockLayout` component:

```tsx
import { TimeLockLayout } from "@/components/TimeLockLayout";

export default function PosPage() {
  return (
    <TimeLockLayout>
      {/* Your page content */}
    </TimeLockLayout>
  );
}
```

### Admin Panel
Access the admin panel at `/dashboard/settings/access-time` to manage all configurations.

### API Calls
The frontend `TimeLockLayout` component calls:
- `GET ${NEXT_PUBLIC_API_BASE_URL}/api/settings/access-time?key=pos_access_time`

Every 30 seconds to validate access in real-time.

### Environment Variable
Add to frontend `.env.local`:
```env
NEXT_PUBLIC_API_BASE_URL=https://your-backend-api.com
```

---

## Multiple Page Support

To protect different pages, use the same `TimeLockLayout` wrapper. The component automatically determines the page key based on the URL or you can pass a custom endpoint:

```tsx
// Default (uses pos_access_time)
<TimeLockLayout>
  {children}
</TimeLockLayout>

// Custom page key
<TimeLockLayout apiEndpoint={`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/settings/access-time?key=inventory_access_time`}>
  {children}
</TimeLockLayout>
```

Each page can have its own time restrictions managed from the admin panel.

---

## Quick Start Guide

### Step 1: Set Up Database
```javascript
// Insert initial configuration
db.access_times.insertOne({
  key: "pos_access_time",
  pageName: "Point of Sale",
  openTime: "09:00",
  closeTime: "21:00",
  timezone: "Asia/Kolkata",
  isEnabled: true,
  allowWeekends: true,
  daysOfWeek: [1,2,3,4,5,6,0],
  breakTimes: [
    {
      startTime: "13:00",
      endTime: "14:00",
      reason: "Lunch Break"
    }
  ],
  holidays: [],
  gracePeriodMinutes: 15,
  overrideUsers: [],
  messages: {
    beforeOpen: "POS will open at {openTime}. Please wait.",
    afterClose: "POS is closed. Operating hours: {openTime} - {closeTime}. Contact admin for access.",
    onBreak: "System is on break until {endTime}.",
    onHoliday: "System is closed today for {reason}."
  },
  createdAt: new Date(),
  updatedAt: new Date()
});
```

### Step 2: Implement Backend API
Create the two endpoints as documented above:
- `GET /api/settings/access-time`
- `POST /api/settings/access-time`

### Step 3: Protect Frontend Pages
```tsx
import { TimeLockLayout } from "@/components/TimeLockLayout";

export default function YourPage() {
  return (
    <TimeLockLayout>
      {/* Your protected content */}
    </TimeLockLayout>
  );
}
```

### Step 4: Configure via Admin Panel
Navigate to `/dashboard/settings/access-time` and configure:
- Enable/disable restrictions
- Set operating hours
- Add break times
- Add holidays
- Customize messages

---

## Features Summary

✅ **Server-Side Time Validation** - Cannot be bypassed by changing local time
✅ **Multiple Page Support** - Different restrictions for different pages
✅ **Break Times** - Configure lunch breaks, tea breaks, etc.
✅ **Holidays** - Block access on specific dates
✅ **Grace Period** - Allow early access before opening time
✅ **Day Restrictions** - Limit access to specific days of the week
✅ **Override Users** - Admin bypass for emergency access
✅ **Custom Messages** - Personalized messages for each scenario
✅ **Real-time Updates** - Auto-refresh every 30 seconds
✅ **Admin Panel** - Easy-to-use UI for managing all settings
✅ **Countdown Timer** - Shows time remaining until opening
✅ **Visual Indicators** - Different icons/colors for different states

---

## Support

For issues or questions:
1. Check the admin panel at `/dashboard/settings/access-time`
2. Verify backend API is responding correctly
3. Check browser console for errors
4. Ensure `NEXT_PUBLIC_API_BASE_URL` is set correctly
