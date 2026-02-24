# Jitsi Meet Integration Example

## Why Jitsi?

- ✅ **Free & Open Source**
- ✅ **No API Keys Required**
- ✅ **Works Immediately**
- ✅ **Self-hostable**
- ✅ **Good Quality**

## Quick Integration (5 minutes)

### Option 1: Redirect to Jitsi (Simplest)

Update `/app/meet/[linkId]/page.tsx`:

```typescript
const joinMeeting = () => {
  const roomName = appointmentData.meeting.channel;
  window.location.href = `https://meet.jit.si/${roomName}`;
};
```

**Done!** That's it. Users will be redirected to Jitsi's hosted service.

### Option 2: Embed Jitsi (Better UX)

Install Jitsi:
```bash
npm install @jitsi/react-sdk
```

Update `/app/meet/[linkId]/page.tsx`:

```typescript
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { JitsiMeeting } from "@jitsi/react-sdk";

export default function MeetingPage() {
  const params = useParams();
  const linkId = params.linkId as string;
  const [appointmentData, setAppointmentData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    validateMeetingLink();
  }, [linkId]);

  const validateMeetingLink = async () => {
    try {
      const response = await fetch(`/api/meetings/validate/${linkId}`);
      if (!response.ok) throw new Error("Invalid link");
      const data = await response.json();
      setAppointmentData(data);
      setLoading(false);
    } catch (err) {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!appointmentData) return <div>Invalid meeting link</div>;

  return (
    <div className="h-screen w-screen">
      <JitsiMeeting
        domain="meet.jit.si"
        roomName={appointmentData.meeting.channel}
        configOverwrite={{
          startWithAudioMuted: true,
          disableModeratorIndicator: true,
          startScreenSharing: false,
          enableEmailInStats: false
        }}
        interfaceConfigOverwrite={{
          DISABLE_JOIN_LEAVE_NOTIFICATIONS: true
        }}
        userInfo={{
          displayName: appointmentData.patientName
        }}
        onApiReady={(externalApi) => {
          console.log("Jitsi API ready");
        }}
        getIFrameRef={(iframeRef) => {
          iframeRef.style.height = "100vh";
        }}
      />
    </div>
  );
}
```

### Option 3: Custom Jitsi Domain (Self-Hosted)

If you host your own Jitsi server:

```typescript
<JitsiMeeting
  domain="meet.yourdomain.com"  // Your Jitsi server
  roomName={appointmentData.meeting.channel}
  jwt="your-jwt-token"  // Optional: for authentication
  // ... rest of config
/>
```

## Configuration Options

### Basic Config
```typescript
configOverwrite={{
  startWithAudioMuted: true,
  startWithVideoMuted: false,
  disableModeratorIndicator: true,
  prejoinPageEnabled: false,
  enableWelcomePage: false,
  enableClosePage: false
}}
```

### Interface Config
```typescript
interfaceConfigOverwrite={{
  DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
  SHOW_JITSI_WATERMARK: false,
  SHOW_WATERMARK_FOR_GUESTS: false,
  TOOLBAR_BUTTONS: [
    'microphone', 'camera', 'closedcaptions', 'desktop',
    'fullscreen', 'fodeviceselection', 'hangup', 'chat',
    'recording', 'settings', 'videoquality', 'tileview'
  ]
}}
```

## Complete Example with Backend

### Frontend: `/app/meet/[linkId]/page.tsx`

```typescript
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { JitsiMeeting } from "@jitsi/react-sdk";
import { Loader2 } from "lucide-react";

export default function MeetingPage() {
  const params = useParams();
  const router = useRouter();
  const linkId = params.linkId as string;
  
  const [appointmentData, setAppointmentData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    validateAndStartMeeting();
  }, [linkId]);

  const validateAndStartMeeting = async () => {
    try {
      // Validate link
      const response = await fetch(`/api/meetings/validate/${linkId}`);
      if (!response.ok) {
        setError("Invalid or expired meeting link");
        setLoading(false);
        return;
      }

      const data = await response.json();
      setAppointmentData(data);
      
      // Mark meeting as started
      await fetch(`/api/appointments/${data.appointmentId}/start`, {
        method: 'POST'
      });
      
      setLoading(false);
    } catch (err) {
      setError("Failed to join meeting");
      setLoading(false);
    }
  };

  const handleMeetingEnd = async () => {
    if (appointmentData?.appointmentId) {
      await fetch(`/api/appointments/${appointmentData.appointmentId}/end`, {
        method: 'POST'
      });
    }
    router.push('/');
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">{error}</h1>
          <button onClick={() => router.push('/')}>Go Home</button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen">
      <JitsiMeeting
        domain="meet.jit.si"
        roomName={appointmentData.meeting.channel}
        configOverwrite={{
          startWithAudioMuted: true,
          disableModeratorIndicator: true,
          prejoinPageEnabled: false
        }}
        userInfo={{
          displayName: appointmentData.patientName
        }}
        onReadyToClose={handleMeetingEnd}
        getIFrameRef={(iframeRef) => {
          iframeRef.style.height = "100vh";
        }}
      />
    </div>
  );
}
```

## Testing

1. Create online appointment
2. Copy meeting link
3. Open in new tab
4. Should see Jitsi video interface
5. Grant camera/mic permissions
6. Start consultation

## Production Considerations

### 1. Use Your Own Jitsi Server
```bash
# Install Jitsi on Ubuntu server
wget -qO - https://download.jitsi.org/jitsi-key.gpg.key | sudo apt-key add -
sudo sh -c "echo 'deb https://download.jitsi.org stable/' > /etc/apt/sources.list.d/jitsi-stable.list"
sudo apt update
sudo apt install jitsi-meet
```

### 2. Add JWT Authentication
Prevents unauthorized access to rooms.

### 3. Recording
Enable recording for compliance:
```typescript
configOverwrite={{
  fileRecordingsEnabled: true,
  dropbox: { appKey: 'YOUR_KEY' }
}}
```

### 4. Branding
```typescript
interfaceConfigOverwrite={{
  SHOW_JITSI_WATERMARK: false,
  SHOW_BRAND_WATERMARK: true,
  BRAND_WATERMARK_LINK: 'https://yourdomain.com',
  DEFAULT_LOGO_URL: 'https://yourdomain.com/logo.png'
}}
```

## Alternatives to Jitsi

If Jitsi doesn't meet your needs:

1. **Agora** - Better for scale, requires API key
2. **Twilio Video** - Enterprise-grade, paid
3. **Daily.co** - Easy integration, freemium
4. **Whereby** - Embedded rooms, paid

## Resources

- [Jitsi Meet Docs](https://jitsi.github.io/handbook/)
- [React SDK](https://github.com/jitsi/jitsi-meet-react-sdk)
- [Self-Hosting Guide](https://jitsi.github.io/handbook/docs/devops-guide/devops-guide-quickstart)

---

**Recommendation:** Start with Option 1 (redirect) for testing, then move to Option 2 (embed) for production.
