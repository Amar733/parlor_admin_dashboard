# Appointment Schema Changes - Minimal Update

## Add These Fields to Your Appointment Schema

```javascript
// Add to your existing Appointment schema

type: {
  type: String,
  enum: ['online', 'offline'],
  default: 'offline'
},

meeting: {
  channel: String,
  linkId: {
    type: String,
    unique: true,
    sparse: true  // Allows null values, only enforces uniqueness for non-null
  },
  expiresAt: Date,
  startedAt: Date,
  endedAt: Date,
  duration: Number  // in seconds
}
```

## Complete Example

```javascript
const appointmentSchema = new mongoose.Schema({
  // Your existing fields
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['Confirmed', 'Pending', 'Cancelled', 'Completed'],
    default: 'Confirmed' 
  },
  notes: String,
  deletedAt: Date,
  
  // NEW FIELDS - Add these
  type: {
    type: String,
    enum: ['online', 'offline'],
    default: 'offline'
  },
  meeting: {
    channel: String,
    linkId: {
      type: String,
      unique: true,
      sparse: true
    },
    expiresAt: Date,
    startedAt: Date,
    endedAt: Date,
    duration: Number
  }
}, { timestamps: true });

// Add index for faster lookups
appointmentSchema.index({ 'meeting.linkId': 1 });
```

## That's It!

Just add those 2 fields (`type` and `meeting`) to your existing schema.

No need to migrate existing data - they'll have default values.
