"use client";

import { useState, useEffect } from "react";

import { useParams, useRouter } from "next/navigation";
import type { IAgoraRTCClient } from "agora-rtc-sdk-ng";
import { useAuth } from "@/hooks/use-auth";
import { MeetingRoom } from "@/components/meeting/MeetingRoom";
import { Loader2 } from "lucide-react";

// Initialize Agora Client outside component to prevent re-creation
export default function MeetingPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const meetingId = params.id as string;
    const [agoraClient, setAgoraClient] = useState<IAgoraRTCClient | null>(null);

    useEffect(() => {
        const initAgora = async () => {
            if (typeof window !== 'undefined') {
                const AgoraRTC = (await import("agora-rtc-sdk-ng")).default;
                const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
                setAgoraClient(client);
            }
        };
        initAgora();
    }, []);

    if (!user || !agoraClient) return <div className="flex h-screen items-center justify-center bg-slate-950"><Loader2 className="animate-spin text-blue-500" /></div>;

    const isDoctor = user.role === "doctor" || user.role === "admin";

    return (
        <MeetingRoom
            meetingId={meetingId}
            userId={user._id}
            userRole={isDoctor ? "doctor" : "guest"} // Although dashboard mostly accessed by doctors, internal users could be guests in future context
            agoraClient={agoraClient}
            onLeave={() => router.push("/dashboard/appointments")}
        />
    );
}
