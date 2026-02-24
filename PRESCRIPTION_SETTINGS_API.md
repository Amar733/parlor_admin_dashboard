# Prescription Template Settings - API Implementation Guide

This document provides instructions for implementing API endpoints and database models for persisting prescription template style settings.

## Database Schema

### MongoDB Collection: `prescriptionSettings`

```javascript
{
  _id: ObjectId,
  doctorId: ObjectId,  // Reference to doctor/user
  headerColor: String,  // Color hex or gradient CSS
  logoShape: String,    // "circle" | "square" | "none"
  fontStyle: String,    // Font family CSS value
  fontSize: Number,     // 80-120 (percentage)
  textColor: String,    // Color hex value
  createdAt: Date,
  updatedAt: Date
}
```

### Example Document

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "doctorId": "507f191e810c19729de860ea",
  "headerColor": "#0d9488",
  "logoShape": "circle",
  "fontStyle": "system-ui, -apple-system, sans-serif",
  "fontSize": 100,
  "textColor": "#000000",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

## API Endpoints

### 1. GET - Fetch Settings

**Endpoint:** `GET /api/prescription-settings`

**Description:** Retrieve prescription settings for the authenticated doctor

**Request Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "headerColor": "#0d9488",
    "logoShape": "circle",
    "fontStyle": "system-ui, -apple-system, sans-serif",
    "fontSize": 100,
    "textColor": "#000000"
  }
}
```

**Response (404 Not Found):**
```json
{
  "success": false,
  "message": "Settings not found, using defaults"
}
```

---

### 2. POST - Create Settings

**Endpoint:** `POST /api/prescription-settings`

**Description:** Create new prescription settings for the authenticated doctor

**Request Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body:**
```json
{
  "headerColor": "#2563eb",
  "logoShape": "square",
  "fontStyle": "Arial, sans-serif",
  "fontSize": 110,
  "textColor": "#374151"
}
```

**Validation Rules:**
- `headerColor`: Required, string (hex color or gradient CSS)
- `logoShape`: Required, enum ["circle", "square", "none"]
- `fontStyle`: Required, string
- `fontSize`: Required, number (80-120)
- `textColor`: Required, string (hex color)

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Settings created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "headerColor": "#2563eb",
    "logoShape": "square",
    "fontStyle": "Arial, sans-serif",
    "fontSize": 110,
    "textColor": "#374151"
  }
}
```

**Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "Validation error",
  "errors": {
    "fontSize": "Must be between 80 and 120"
  }
}
```

---

### 3. PUT - Update Settings

**Endpoint:** `PUT /api/prescription-settings`

**Description:** Update existing prescription settings for the authenticated doctor

**Request Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body:**
```json
{
  "headerColor": "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  "logoShape": "none",
  "fontStyle": "Georgia, serif",
  "fontSize": 95,
  "textColor": "#1e3a8a"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Settings updated successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "headerColor": "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    "logoShape": "none",
    "fontStyle": "Georgia, serif",
    "fontSize": 95,
    "textColor": "#1e3a8a",
    "updatedAt": "2024-01-15T11:45:00Z"
  }
}
```

---

### 4. DELETE - Reset to Defaults

**Endpoint:** `DELETE /api/prescription-settings`

**Description:** Delete custom settings and revert to defaults

**Request Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Settings reset to defaults"
}
```

---

## Implementation Steps

### Step 1: Create MongoDB Model

**File:** `models/PrescriptionSettings.js`

```javascript
import mongoose from 'mongoose';

const prescriptionSettingsSchema = new mongoose.Schema({
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true,
    unique: true
  },
  headerColor: {
    type: String,
    required: true,
    default: '#0d9488'
  },
  logoShape: {
    type: String,
    enum: ['circle', 'square', 'none'],
    default: 'circle'
  },
  fontStyle: {
    type: String,
    required: true,
    default: 'system-ui, -apple-system, sans-serif'
  },
  fontSize: {
    type: Number,
    required: true,
    min: 80,
    max: 120,
    default: 100
  },
  textColor: {
    type: String,
    required: true,
    default: '#000000'
  }
}, {
  timestamps: true
});

export default mongoose.models.PrescriptionSettings || 
  mongoose.model('PrescriptionSettings', prescriptionSettingsSchema);
```

---

### Step 2: Create API Route Handler

**File:** `app/api/prescription-settings/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/mongodb';
import PrescriptionSettings from '@/models/PrescriptionSettings';

// GET - Fetch settings
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const settings = await PrescriptionSettings.findOne({ doctorId: session.user.id });

    if (!settings) {
      return NextResponse.json({ 
        success: false, 
        message: 'Settings not found, using defaults' 
      }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: settings });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// POST - Create settings
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    await dbConnect();

    const settings = await PrescriptionSettings.create({
      doctorId: session.user.id,
      ...body
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Settings created successfully',
      data: settings 
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}

// PUT - Update settings
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    await dbConnect();

    const settings = await PrescriptionSettings.findOneAndUpdate(
      { doctorId: session.user.id },
      body,
      { new: true, runValidators: true }
    );

    if (!settings) {
      return NextResponse.json({ success: false, message: 'Settings not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Settings updated successfully',
      data: settings 
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}

// DELETE - Reset to defaults
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    await PrescriptionSettings.findOneAndDelete({ doctorId: session.user.id });

    return NextResponse.json({ 
      success: true, 
      message: 'Settings reset to defaults' 
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
```

---

### Step 3: Update Frontend Component

**File:** `components/PrescriptionCanvas.tsx`

Add API integration:

```typescript
// Fetch settings on component mount
useEffect(() => {
  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/prescription-settings');
      if (response.ok) {
        const { data } = await response.json();
        setPrescriptionSettings(data);
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
  };
  
  fetchSettings();
}, []);

// Update save handler in PrescriptionSettingsDialog
const handleSave = async (settings) => {
  try {
    const response = await fetch('/api/prescription-settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });

    if (!response.ok) {
      // Try POST if PUT fails (settings don't exist yet)
      const createResponse = await fetch('/api/prescription-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      
      if (!createResponse.ok) throw new Error('Failed to save settings');
    }

    setPrescriptionSettings(settings);
    toast({ title: "Settings saved successfully" });
  } catch (error) {
    toast({ title: "Failed to save settings", variant: "destructive" });
  }
};
```

---

## Testing

### Test with cURL

```bash
# GET settings
curl -X GET http://localhost:9002/api/prescription-settings \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# POST create settings
curl -X POST http://localhost:9002/api/prescription-settings \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "headerColor": "#2563eb",
    "logoShape": "circle",
    "fontStyle": "Arial, sans-serif",
    "fontSize": 100,
    "textColor": "#000000"
  }'

# PUT update settings
curl -X PUT http://localhost:9002/api/prescription-settings \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "headerColor": "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    "fontSize": 110
  }'

# DELETE reset settings
curl -X DELETE http://localhost:9002/api/prescription-settings \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Default Values

```javascript
const DEFAULT_SETTINGS = {
  headerColor: '#0d9488',
  logoShape: 'circle',
  fontStyle: 'system-ui, -apple-system, sans-serif',
  fontSize: 100,
  textColor: '#000000'
};
```

---

## Security Considerations

1. **Authentication:** All endpoints require valid JWT token
2. **Authorization:** Users can only access their own settings
3. **Validation:** Strict input validation on all fields
4. **Rate Limiting:** Implement rate limiting to prevent abuse
5. **Sanitization:** Sanitize gradient CSS strings to prevent XSS

---

## Notes

- Settings are per-doctor/user, not per-prescription
- If no settings exist, frontend uses default values
- Gradient strings should be validated to ensure they're safe CSS
- Consider caching settings in frontend to reduce API calls
