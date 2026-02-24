"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { IAgoraRTCClient } from "agora-rtc-sdk-ng";
import { MeetingRoom } from "@/components/meeting/MeetingRoom";
import { Lobby } from "@/components/meeting/Lobby";
import { API_BASE_URL } from "@/config/api";
import { Loader2, CheckCircle } from "lucide-react";

import { getAgoraRTC } from "@/lib/agora";

export default function PublicMeetingPage() {
  const params = useParams();
  const router = useRouter();
  const meetingId = params.linkId as string;

  const [loading, setLoading] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
  const [meetingInfo, setMeetingInfo] = useState<{ doctorName: string; patientName: string, status: string } | null>(null);
  const [error, setError] = useState("");
  const [agoraClient, setAgoraClient] = useState<IAgoraRTCClient | null>(null);
  const [meetingEnded, setMeetingEnded] = useState(false);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    // Dynamically load Agora SDK on client side
    const initAgora = async () => {
      try {
        const AgoraRTC = await getAgoraRTC();
        const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
        setAgoraClient(client);
      } catch (e) {
        console.error("Failed to load video sdk", e);
        setError("Failed to load video service");
      }
    };
    initAgora();
  }, []);

  useEffect(() => {
    if (!meetingId) return;

    const checkLink = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/public/meet-info/${meetingId}`);
        if (!res.ok) {
          if (res.status === 404) throw new Error("Link invalid or expired");
          throw new Error("Failed to verify link");
        }
        const data = await res.json();

        if (data.success) {
          if (data.data.status === 'completed' || data.data.status === 'cancelled') {
            setMeetingEnded(true);
            setIsExpired(true);
            setIsValid(false);
            setMeetingInfo(data.data);
            return;
          }
          setIsValid(true);
          setMeetingInfo(data.data);
        } else {
          setError("Invalid meeting link");
        }
      } catch (err: any) {
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    checkLink();
  }, [meetingId]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-blue-500" /></div>;
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
        <h1 className="text-2xl font-bold text-red-500 mb-2">Access Denied</h1>
        <p className="text-slate-600">{error}</p>
      </div>
    );
  }



  // ... (useEffect hook)

  if (meetingEnded) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center bg-slate-50">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full border border-slate-100">
          <div className="flex justify-center mb-6">
            <div className={`h-16 w-16 rounded-full flex items-center justify-center ${isExpired ? 'bg-orange-100' : 'bg-green-100'}`}>
              <CheckCircle className={`h-8 w-8 ${isExpired ? 'text-orange-600' : 'text-green-600'}`} />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            {isExpired ? "Consultation Expired" : "Consultation Completed"}
          </h1>
          <p className="text-slate-500 mb-8">
            {isExpired ? "This consultation has expired. Please book a new consultation." : "Thank you for attending the session."}
          </p>

          <div className="bg-slate-50 rounded-lg p-4 mb-8">
            <p className="text-sm text-slate-600 italic mb-2">"Wishing you good health!"</p>
            <p className="text-sm font-semibold text-slate-900">
              Best Wishes,<br />
              {
                (meetingInfo?.doctorName || "Doctor").toLowerCase().startsWith("dr") || (meetingInfo?.doctorName || "Doctor").toLowerCase().startsWith("dr.")
                  ? (meetingInfo?.doctorName || "Doctor")
                  : `Dr. ${meetingInfo?.doctorName || "Doctor"}`
              }
            </p>
          </div>

          <div className="flex justify-center">
            <button
              onClick={() => {
                const closeWindow = () => {
                  window.opener = null;
                  window.open("", "_self");
                  window.close();
                };
                closeWindow();
                // Fallback for some browsers if the above fails
                setTimeout(() => {
                  window.location.href = "about:blank";
                }, 500);
              }}
              className="px-6 py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-all font-medium"
            >
              Close Window
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (hasJoined) {
    if (!agoraClient) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
        </div>
      );
    }

    return (
      <MeetingRoom
        meetingId={meetingId}
        userRole="patient" // Public link assumes guest/patient role initially
        userName={meetingInfo?.patientName} // Pass known patient name
        agoraClient={agoraClient}
        onLeave={() => setMeetingEnded(true)}
      />
    );
  }

  return (
    <Lobby
      doctorName={meetingInfo?.doctorName}
      patientName={meetingInfo?.patientName}
      onJoin={() => setHasJoined(true)}
    />
  );
}
