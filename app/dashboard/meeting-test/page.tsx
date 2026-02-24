"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Video } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getMeetingUrl, copyToClipboard } from "@/lib/meeting-utils";
import { nanoid } from "nanoid";
import { db } from "@/lib/db";

export default function MeetingTestPage() {
  const { toast } = useToast();
  const [linkId, setLinkId] = useState("");
  const [meetingUrl, setMeetingUrl] = useState("");

  const generateTestLink = () => {
    const newLinkId = nanoid(16);
    const channel = `test_${newLinkId}`;
    
    // Save to DB
    db.createMeeting({
      linkId: newLinkId,
      channel,
      appointmentId: 'test-' + Date.now(),
      patientName: 'Test Patient',
      doctorName: 'Test Doctor'
    });
    
    setLinkId(newLinkId);
    const url = getMeetingUrl(newLinkId);
    setMeetingUrl(url);
    
    toast({
      title: "Link Generated!",
      description: `Link ID: ${newLinkId}`,
    });
  };

  const handleCopy = async () => {
    const success = await copyToClipboard(meetingUrl);
    
    if (success) {
      toast({
        title: "Copied!",
        description: "Meeting link copied to clipboard",
      });
    } else {
      toast({
        variant: "destructive",
        title: "Failed",
        description: "Could not copy link",
      });
    }
  };

  const handleOpen = () => {
    window.open(meetingUrl, '_blank');
  };

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Meeting Link Test Page</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Generate Link */}
          <div className="space-y-4">
            <h3 className="font-semibold">1. Generate Meeting Link</h3>
            <Button onClick={generateTestLink}>
              Generate Test Link
            </Button>
          </div>

          {/* Display Link */}
          {linkId && (
            <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
              <div className="space-y-2">
                <Label>Link ID</Label>
                <Input value={linkId} readOnly />
              </div>
              
              <div className="space-y-2">
                <Label>Full Meeting URL</Label>
                <Input value={meetingUrl} readOnly />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleCopy} variant="outline">
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Link
                </Button>
                <Button onClick={handleOpen}>
                  <Video className="mr-2 h-4 w-4" />
                  Open Meeting
                </Button>
              </div>
            </div>
          )}

          {/* Mock Appointment Table */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">2. Mock Appointments Table</h3>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  db.clearAll();
                  window.location.reload();
                }}
              >
                Reset All
              </Button>
            </div>
            <MockAppointmentsTable />
          </div>

        </CardContent>
      </Card>
    </div>
  );
}

function MockAppointmentsTable() {
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<any[]>([]);

  useEffect(() => {
    // Generate appointments only once
    const existing = db.getAllMeetings();
    if (existing.length === 0) {
      const newAppointments = [
        {
          id: "apt-1",
          patient: "John Doe",
          date: "2026-01-19",
          time: "09:02",
          type: "online",
          meeting: (() => {
            const linkId = nanoid(16);
            const channel = `consult_1_${linkId}`;
            db.createMeeting({
              linkId,
              channel,
              appointmentId: 'apt-1',
              patientName: 'John Doe',
              doctorName: 'Dr. Smith'
            });
            return { linkId, channel };
          })()
        },
        {
          id: "apt-2",
          patient: "Jane Smith",
          date: "2024-01-20",
          time: "15:00",
          type: "offline",
          meeting: null
        },
        {
          id: "apt-3",
          patient: "Bob Wilson",
          date: "2024-01-21",
          time: "10:00",
          type: "online",
          meeting: (() => {
            const linkId = nanoid(16);
            const channel = `consult_3_${linkId}`;
            db.createMeeting({
              linkId,
              channel,
              appointmentId: 'apt-3',
              patientName: 'Bob Wilson',
              doctorName: 'Dr. Johnson'
            });
            return { linkId, channel };
          })()
        }
      ];
      setAppointments(newAppointments);
    } else {
      // Load from existing meetings
      const loadedAppointments = existing.map((m: any, idx: number) => ({
        id: m.appointmentId || `apt-${idx}`,
        patient: m.patientName,
        date: "2024-01-20",
        time: "14:00",
        type: "online",
        meeting: { linkId: m.linkId, channel: m.channel }
      }));
      setAppointments(loadedAppointments);
    }
  }, []);

  const handleCopy = async (linkId: string) => {
    const url = getMeetingUrl(linkId);
    const success = await copyToClipboard(url);
    
    if (success) {
      toast({
        title: "Success",
        description: "Meeting link copied!",
      });
    }
  };

  const handleOpen = (linkId: string, role: 'doctor' | 'patient') => {
    const url = getMeetingUrl(linkId, undefined, role);
    window.open(url, '_blank');
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full">
        <thead className="bg-muted">
          <tr>
            <th className="p-3 text-left text-sm font-medium">Patient</th>
            <th className="p-3 text-left text-sm font-medium">Date</th>
            <th className="p-3 text-left text-sm font-medium">Time</th>
            <th className="p-3 text-left text-sm font-medium">Type</th>
            <th className="p-3 text-left text-sm font-medium">Meeting</th>
          </tr>
        </thead>
        <tbody>
          {appointments.map((apt) => (
            <tr key={apt.meeting?.linkId || apt.id} className="border-t">
              <td className="p-3 text-sm">{apt.patient}</td>
              <td className="p-3 text-sm">{apt.date}</td>
              <td className="p-3 text-sm">{apt.time}</td>
              <td className="p-3 text-sm">
                <span className={`px-2 py-1 rounded text-xs ${
                  apt.type === 'online' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {apt.type === 'online' ? 'Online' : 'In-Person'}
                </span>
              </td>
              <td className="p-3">
                {apt.type === 'online' && apt.meeting ? (
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpen(apt.meeting.linkId, 'doctor')}
                      className="h-7 px-2 text-xs"
                    >
                      <Video className="h-3 w-3 mr-1" />
                      Doctor
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpen(apt.meeting.linkId, 'patient')}
                      className="h-7 px-2 text-xs"
                    >
                      <Video className="h-3 w-3 mr-1" />
                      Patient
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleCopy(apt.meeting.linkId)}
                      className="h-7 w-7 p-0"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">-</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
