"use client";

import { useMeeting } from "@/components/providers/MeetingProvider";
import { MeetingRoom } from "@/components/meeting/MeetingRoom";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Maximize2, Minimize2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ActionTooltip } from "../ui/action-tooltip";
import { FloatingWindow } from "@/components/ui/FloatingWindow";

export function GlobalMeetingOverlay() {
    const router = useRouter();
    const { activeMeetingId, viewMode, agoraClient, endMeeting, minimize, maximize } = useMeeting();
    const { user } = useAuth();

    if (!activeMeetingId || viewMode === 'hidden' || !user) return null;

    if (!agoraClient) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 text-white">
                <div className="flex flex-col items-center gap-2">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
                    <p>Initializing Video Service...</p>
                </div>
            </div>
        );
    }

    const isMini = viewMode === 'mini';

    const handleEndMeeting = () => {
        endMeeting();
        router.refresh();
    };

    // We use FloatingWindow for BOTH modes to prevent unmounting of children (MeetingRoom).
    // When not mini, we force it to be fixed full screen via props/styles.
    return (
        <FloatingWindow
            initialX={window.innerWidth - 450}
            initialY={window.innerHeight - 350}
            initialWidth={400}
            initialHeight={300}
            className={cn(
                "z-50 bg-slate-950 border-slate-800 transition-all duration-300",
                isMini
                    ? "border fixed rounded-lg shadow-2xl"
                    : "fixed inset-0 w-full h-full !top-0 !left-0 !transform-none rounded-none border-none"
            )}
            disabled={!isMini}
            persistenceKey="admin-meeting-window"
        >
            {/* Controls Layer */}
            <div className={cn(
                "absolute top-0 left-0 right-0 z-50 flex justify-end gap-2 p-2 pointer-events-none",
                isMini ? "bg-gradient-to-b from-black/60 to-transparent transition-all" : ""
            )}>
                <div className="pointer-events-auto">
                    {isMini ? (
                        <ActionTooltip label="Maximize" side="left">
                            <Button size="icon" className="h-8 w-8 bg-black/50 hover:bg-black/70 backdrop-blur-md text-white border border-white/20 shadow-lg rounded-full" onClick={maximize}>
                                <Maximize2 className="h-4 w-4" />
                            </Button>
                        </ActionTooltip>
                    ) : (
                        <ActionTooltip label="Minimize" side="left">
                            <Button size="icon" className="h-8 w-8 bg-black/50 hover:bg-black/70 backdrop-blur-md text-white border border-white/20 shadow-lg rounded-full" onClick={minimize}>
                                <Minimize2 className="h-4 w-4" />
                            </Button>
                        </ActionTooltip>
                    )}
                </div>
            </div>

            <MeetingRoom
                meetingId={activeMeetingId}
                userId={user._id}
                userRole={user.role === 'doctor' || user.role === 'admin' ? 'doctor' : 'guest'}
                agoraClient={agoraClient}
                onLeave={handleEndMeeting}
                viewMode={isMini ? 'mini' : 'full'}
            />
        </FloatingWindow>
    );
}
