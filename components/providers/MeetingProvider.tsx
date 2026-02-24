import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import type { IAgoraRTCClient } from "agora-rtc-sdk-ng";

interface MeetingContextType {
    activeMeetingId: string | null;
    viewMode: 'hidden' | 'full' | 'mini';
    agoraClient: IAgoraRTCClient | null;
    joinMeeting: (meetingId: string) => void;
    endMeeting: () => void;
    minimize: () => void;
    maximize: () => void;
}

const MeetingContext = createContext<MeetingContextType | undefined>(undefined);

export function MeetingProvider({ children }: { children: ReactNode }) {
    const [activeMeetingId, setActiveMeetingId] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'hidden' | 'full' | 'mini'>('hidden');
    const [agoraClient, setAgoraClient] = useState<IAgoraRTCClient | null>(null);
    const { user } = useAuth();

    useEffect(() => {
        let mounted = true;

        const initAgora = async () => {
            try {
                const AgoraRTC = (await import("agora-rtc-sdk-ng")).default;
                if (!mounted) return;
                const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
                setAgoraClient(client);
            } catch (error) {
                console.error("Failed to load Agora SDK", error);
            }
        };

        if (typeof window !== 'undefined') {
            initAgora();
        }

        return () => {
            mounted = false;
        };
    }, []);

    const joinMeeting = useCallback((meetingId: string) => {
        setActiveMeetingId(meetingId);
        setViewMode('full');
    }, []);

    const endMeeting = useCallback(() => {
        setActiveMeetingId(null);
        setViewMode('hidden');
    }, []);

    const minimize = useCallback(() => setViewMode('mini'), []);
    const maximize = useCallback(() => setViewMode('full'), []);

    return (
        <MeetingContext.Provider value={{
            activeMeetingId,
            viewMode,
            agoraClient,
            joinMeeting,
            endMeeting,
            minimize,
            maximize
        }}>
            {children}
        </MeetingContext.Provider>
    );
}

export function useMeeting() {
    const context = useContext(MeetingContext);
    if (!context) throw new Error("useMeeting must be used within MeetingProvider");
    return context;
}
