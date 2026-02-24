# Doctor Availability Update - In-Clinic & Online Consultancy

## Overview
The Doctor Availability system has been extended to support two separate consultation types:
1. **In-Clinic** - For physical appointments at the clinic
2. **Online** - For virtual/telemedicine consultations

## Changes Made

### 1. Data Structure Updates

#### State Structure
The availability data structure now separates in-clinic and online slots:

```typescript
{
  inclinic: {
    monday: string[],
    tuesday: string[],
    // ... other days
  },
  online: {
    monday: string[],
    tuesday: string[],
    // ... other days
  }
}
```

#### Patients Per Slot
Now supports separate patient limits for each consultation type:

```typescript
{
  inclinic: "1",
  online: "1"
}
```

### 2. UI Changes

#### Admin View
- Added **Consultation Type** dropdown to switch between In-Clinic and Online
- Separate **Patients Per Slot** input for each consultation type
- Day headers now show the consultation type (e.g., "Monday - In-Clinic")
- Footer displays separate counts: "In-Clinic: X | Online: Y"

#### Doctor View
- Added **Tabs** to switch between In-Clinic and Online Consultancy
- Each tab has its own:
  - Patients Per Slot setting
  - Day selector
  - Time slot checkboxes
- Footer displays separate counts for both consultation types

### 3. API Payload Format

The system now sends data in this format:

```json
{
  "slots": {
    "inclinic": {
      "monday": ["09:00", "10:00"],
      "tuesday": ["09:00"],
      // ... other days
    },
    "online": {
      "monday": ["14:00", "15:00"],
      "tuesday": ["14:00"],
      // ... other days
    }
  },
  "patientsPerSlot": {
    "inclinic": 2,
    "online": 3
  }
}
```

### 4. Backward Compatibility

The system includes backward compatibility for legacy data:
- If API returns old format (without inclinic/online structure), it treats all slots as "inclinic"
- Handles both object and primitive types for `patientsPerSlot`

## Backend Requirements

Your backend API (`/api/timeslots/doctor/:id`) should be updated to:

1. **Accept** the new payload format with `slots` and `patientsPerSlot` objects
2. **Store** separate availability for inclinic and online consultations
3. **Return** data in the new format when fetching doctor availability

### Example Backend Response

```json
{
  "success": true,
  "data": {
    "availableSlots": {
      "slots": {
        "inclinic": {
          "monday": ["09:00", "10:00", "11:00"],
          "tuesday": ["09:00", "10:00"],
          "wednesday": [],
          "thursday": ["09:00", "10:00"],
          "friday": ["09:00"],
          "saturday": [],
          "sunday": []
        },
        "online": {
          "monday": ["14:00", "15:00", "16:00"],
          "tuesday": ["14:00", "15:00"],
          "wednesday": [],
          "thursday": ["14:00", "15:00"],
          "friday": ["14:00"],
          "saturday": [],
          "sunday": []
        }
      },
      "patientsPerSlot": {
        "inclinic": 2,
        "online": 3
      }
    }
  }
}
```

## Features

### For Doctors
- Set different availability schedules for in-clinic vs online consultations
- Configure different patient limits per slot for each consultation type
- Manage weekly schedules independently for both types

### For Admins
- Manage doctor availability for both consultation types
- Switch between consultation types easily
- View separate slot counts for each type

## Testing Checklist

- [ ] Doctor can set in-clinic availability
- [ ] Doctor can set online availability
- [ ] Doctor can set different patients per slot for each type
- [ ] Admin can manage doctor's in-clinic availability
- [ ] Admin can manage doctor's online availability
- [ ] Data persists correctly after save
- [ ] Backward compatibility works with old data format
- [ ] Slot counts display correctly in footer
- [ ] Day selection works in both tabs/modes

## Notes

- The master time slots remain shared between both consultation types
- Doctors can choose different time slots for in-clinic vs online
- The system maintains separate patient capacity for each consultation type
- All existing functionality (add/delete master slots) remains unchanged
