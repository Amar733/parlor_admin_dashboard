# Backend API Implementation Examples

## Required Backend Endpoints

### 1. Generate Meeting Link on Appointment Creation

**Endpoint:** `POST /api/appointments`

```javascript
const { nanoid } = require('nanoid');

router.post('/appointments', async (req, res) => {
  try {
    const { patientId, doctorId, serviceId, date, time, type, notes } = req.body;
    
    const appointment = new Appointment({
      patientId,
      doctorId,
      serviceId,
      date,
      time,
      type: type || 'offline',
      status: 'Confirmed',
      notes
    });

    // Generate meeting link for online appointments
    if (type === 'online') {
      const linkId = nanoid(16);
      const channel = `consult_${appointment._id}`;
      
      // Calculate expiry (appointment end time + buffer)
      const [hours, minutes] = time.split(':');
      const appointmentDate = new Date(date);
      appointmentDate.setHours(parseInt(hours) + 1, parseInt(minutes), 0); // +1 hour buffer
      
      appointment.meeting = {
        channel,
        linkId,
        expiresAt: appointmentDate
      };
    }

    await appointment.save();
    
    res.status(201).json({
      success: true,
      data: appointment,
      meetingUrl: appointment.meeting?.linkId 
        ? `${process.env.APP_URL}/meet/${appointment.meeting.linkId}`
        : null
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
```

### 2. Validate Meeting Link

**Endpoint:** `GET /api/meetings/validate/:linkId`

```javascript
router.get('/meetings/validate/:linkId', async (req, res) => {
  try {
    const { linkId } = req.params;
    
    const appointment = await Appointment.findOne({ 'meeting.linkId': linkId })
      .populate('patientId', 'firstName lastName')
      .populate('doctorId', 'name')
      .populate('serviceId', 'name');

    if (!appointment) {
      return res.status(404).json({ 
        success: false, 
        message: 'Invalid meeting link' 
      });
    }

    // Check if expired
    if (new Date() > appointment.meeting.expiresAt || 
        appointment.status === 'Completed' || 
        appointment.status === 'Cancelled') {
      return res.status(410).json({ 
        success: false, 
        message: 'Meeting has expired or ended' 
      });
    }

    res.json({
      success: true,
      patientName: `${appointment.patientId.firstName} ${appointment.patientId.lastName}`,
      doctorName: appointment.doctorId.name,
      serviceName: appointment.serviceId.name,
      date: appointment.date,
      time: appointment.time,
      meeting: appointment.meeting
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
```

### 3. Start Consultation

**Endpoint:** `POST /api/appointments/:id/start`

```javascript
router.post('/appointments/:id/start', async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    if (appointment.type !== 'online') {
      return res.status(400).json({ success: false, message: 'Not an online appointment' });
    }

    appointment.status = 'ongoing';
    appointment.meeting.startedAt = new Date();
    await appointment.save();

    res.json({ success: true, data: appointment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
```

### 4. End Consultation

**Endpoint:** `POST /api/appointments/:id/end`

```javascript
router.post('/appointments/:id/end', async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    if (!appointment.meeting?.startedAt) {
      return res.status(400).json({ success: false, message: 'Meeting was not started' });
    }

    appointment.status = 'Completed';
    appointment.meeting.endedAt = new Date();
    appointment.meeting.duration = Math.floor(
      (appointment.meeting.endedAt - appointment.meeting.startedAt) / 1000
    );
    
    // Destroy the link to prevent reuse
    appointment.meeting.linkId = null;
    
    await appointment.save();

    res.json({ 
      success: true, 
      data: appointment,
      duration: appointment.meeting.duration 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
```

### 5. Auto-Expire Cron Job

**Setup:** Use `node-cron` package

```javascript
const cron = require('node-cron');

// Run every 10 minutes
cron.schedule('*/10 * * * *', async () => {
  try {
    const result = await Appointment.updateMany(
      {
        status: { $in: ['Confirmed', 'Pending'] },
        'meeting.expiresAt': { $lt: new Date() }
      },
      {
        $set: { status: 'expired' }
      }
    );
    
    console.log(`Expired ${result.modifiedCount} appointments`);
  } catch (error) {
    console.error('Error expiring appointments:', error);
  }
});
```

## MongoDB Schema Update

```javascript
const appointmentSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['Confirmed', 'Pending', 'Cancelled', 'Completed', 'ongoing', 'expired'],
    default: 'Confirmed' 
  },
  type: {
    type: String,
    enum: ['online', 'offline'],
    default: 'offline'
  },
  meeting: {
    channel: String,
    linkId: { type: String, unique: true, sparse: true },
    expiresAt: Date,
    startedAt: Date,
    endedAt: Date,
    duration: Number
  },
  notes: String,
  deletedAt: Date
}, { timestamps: true });

// Index for faster lookups
appointmentSchema.index({ 'meeting.linkId': 1 });
appointmentSchema.index({ 'meeting.expiresAt': 1 });
```

## Environment Variables

Add to `.env`:

```env
APP_URL=http://localhost:9002
```

## Installation

```bash
npm install nanoid node-cron
```

## Testing with cURL

### Create Online Appointment
```bash
curl -X POST http://localhost:3000/api/appointments \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": "...",
    "doctorId": "...",
    "serviceId": "...",
    "date": "2024-01-20",
    "time": "14:00",
    "type": "online"
  }'
```

### Validate Meeting Link
```bash
curl http://localhost:3000/api/meetings/validate/abc123xyz456
```

### Start Consultation
```bash
curl -X POST http://localhost:3000/api/appointments/123/start
```

### End Consultation
```bash
curl -X POST http://localhost:3000/api/appointments/123/end
```
