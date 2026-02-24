"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import type { IAgoraRTCClient } from "agora-rtc-sdk-ng";
import { useAgora } from "@/hooks/useAgora";
import { VideoPlayer } from "@/components/meeting/VideoPlayer";
import { MeetingControls } from "@/components/meeting/MeetingControls";
import { io, Socket } from "socket.io-client";
import { Loader2, MicOff, User, VideoOff } from "lucide-react";
import { API_BASE_URL, AGORA_APP_ID } from "@/config/api";
import { toast } from "@/hooks/use-toast";
import { FloatingWindow } from "@/components/ui/FloatingWindow";
import { cn } from "@/lib/utils";
import { MeetingTimer } from "@/components/meeting/MeetingTimer";

interface MeetingRoomProps {
    meetingId: string;
    // User info for the meeting
    userId?: string;
    userName?: string;
    viewMode?: 'full' | 'mini';
    // Core Agora client passed from parent
    agoraClient: IAgoraRTCClient;
    // Callback when meeting ends (by user or remotely)
    onLeave: () => void;
    userRole: 'doctor' | 'guest' | 'patient';
}

export function MeetingRoom({
    meetingId,
    userId,
    userRole,
    viewMode = 'full',
    agoraClient,
    onLeave
}: MeetingRoomProps) {
    const router = useRouter();
    const {
        localAudioTrack,
        localVideoTrack,
        joinState,
        leave,
        join,
        remoteUsers,
    } = useAgora(agoraClient);

    const [socket, setSocket] = useState<Socket | null>(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(true);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [remoteStates, setRemoteStates] = useState<Record<string, { muted: boolean; videoOff: boolean }>>({});

    // Room State
    const [roomStatus, setRoomStatus] = useState<'waiting' | 'ready'>('waiting');
    const [waitingFor, setWaitingFor] = useState<string | null>(null);
    const [startTime, setStartTime] = useState<Date | null>(null);

    const isDoctor = userRole === "doctor";
    const isMini = viewMode === 'mini';

    const [isSocketJoined, setIsSocketJoined] = useState(false);
    const hasStartedMeeting = useRef(false);

    // Container Size Tracking for Dynamic Controls
    const [containerWidth, setContainerWidth] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;
        const resizeObserver = new ResizeObserver((entries) => {
            if (entries[0]) {
                setContainerWidth(entries[0].contentRect.width);
            }
        });
        resizeObserver.observe(containerRef.current);
        return () => resizeObserver.disconnect();
    }, []);

    // --- 1. Socket Connection ---
    useEffect(() => {
        if (!meetingId) return;

        // Connect to meeting namespace
        const newSocket = io(`${API_BASE_URL}/meeting`);
        setSocket(newSocket);

        newSocket.on("connect", () => {
            console.log("Connected to meeting socket");
            // Join the room using meetingId (linkId)
            // Emit join-room to notify server we are here
            newSocket.emit("join-room", {
                linkId: meetingId,
                userId: userId || 'guest',
                userType: isDoctor ? 'doctor' : 'patient'
            });
        });

        return () => {
            newSocket.disconnect();
        };
    }, [meetingId, userId, isDoctor]);

    // --- 2. Socket Event Listeners ---
    useEffect(() => {
        if (!socket) return;

        socket.on("meeting-ended", () => {
            toast({
                title: "Meeting Ended",
                description: "The doctor has ended the meeting.",
            });
            handleLeave(); // Local cleanup
        });

        socket.on("user-audio-status", ({ userId: remoteId, agoraUid, muted }: { userId: string, agoraUid: any, muted: boolean }) => {
            console.log("Received audio status:", { remoteId, agoraUid, muted });
            const key = agoraUid || remoteId;
            setRemoteStates(prev => ({ ...prev, [key]: { ...prev[key], muted } }));
        });

        socket.on("user-video-status", ({ userId: remoteId, agoraUid, videoOff }: { userId: string, agoraUid: any, videoOff: boolean }) => {
            console.log("Received video status:", { remoteId, agoraUid, videoOff });
            const key = agoraUid || remoteId;
            setRemoteStates(prev => ({ ...prev, [key]: { ...prev[key], videoOff } }));
        });

        socket.on("meeting-started", ({ startedBy, startTime: serverStartTime }: { startedBy: string, startTime: string }) => {
            console.log("Meeting started by", startedBy);
            if (serverStartTime) {
                setStartTime(new Date(serverStartTime));
                setRoomStatus('ready');
            }
        });

        socket.on("room-status", (data: { status: 'waiting' | 'ready', waitingFor: string | null, startTime: string | null }) => {
            console.log("Room Status:", data);
            setIsSocketJoined(true);
            setRoomStatus(data.status);
            setWaitingFor(data.waitingFor);
            if (data.startTime) {
                setStartTime(new Date(data.startTime));
            }
        });

        return () => {
            socket.off("meeting-ended");
            socket.off("user-audio-status");
            socket.off("user-video-status");
            socket.off("meeting-started");
            socket.off("room-status");
        };
    }, [socket]);

    // --- Broadcast Initial State ---
    useEffect(() => {
        if (isSocketJoined && joinState && socket && agoraClient.uid) {
            console.log("Broadcasting initial state:", { videoOff: isVideoOff, muted: isMuted, uid: agoraClient.uid });
            socket.emit("toggle-video", { linkId: meetingId, userId: userId, agoraUid: agoraClient.uid, videoOff: isVideoOff });
            socket.emit("toggle-audio", { linkId: meetingId, userId: userId, agoraUid: agoraClient.uid, muted: isMuted });
        }
    }, [isSocketJoined, joinState, socket, meetingId, userId, agoraClient.uid]); // Run once when joined check passes

    // --- 3. Join Agora ---
    useEffect(() => {
        const initAgora = async () => {
            if (!meetingId) return;

            try {
                // Get Agora Token from our backend
                const res = await fetch(`${API_BASE_URL}/api/agora/token`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ channelName: meetingId, uid: 0 })
                });

                if (!res.ok) {
                    if (res.status === 403) {
                        setError("This meeting has ended.");
                        return;
                    }
                    throw new Error("Failed to get token");
                }
                const data = await res.json();

                // Join Agora Channel
                await join(AGORA_APP_ID, meetingId, data.token);

            } catch (err) {
                console.error(err);
                setError("Failed to join meeting. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        if (socket && !joinState) {
            initAgora();
        }
    }, [socket, meetingId, join, joinState]);

    // --- 5. Auto-Start Meeting (Fix Race Condition) ---
    useEffect(() => {
        if (isDoctor && isSocketJoined && joinState && socket && !hasStartedMeeting.current) {
            console.log("Auto-starting meeting timer...");
            socket.emit("start-meeting", { linkId: meetingId, userId: userId });
            hasStartedMeeting.current = true;
        }
    }, [isDoctor, isSocketJoined, joinState, socket, meetingId, userId]);


    // Refs to prevent rapid toggling
    const isTogglingAudio = useRef(false);
    const isTogglingVideo = useRef(false);

    // --- 4. Controls Handlers ---
    const handleToggleMic = async () => {
        if (localAudioTrack && !isTogglingAudio.current) {
            isTogglingAudio.current = true;
            try {
                const newMutedState = !isMuted;
                await localAudioTrack.setMuted(newMutedState);
                setIsMuted(newMutedState);
                socket?.emit("toggle-audio", { linkId: meetingId, userId: userId, agoraUid: agoraClient.uid, muted: newMutedState });
            } catch (error) {
                console.error("Error toggling audio:", error);
            } finally {
                isTogglingAudio.current = false;
            }
        }
    };

    const handleToggleVideo = async () => {
        if (localVideoTrack && !isTogglingVideo.current) {
            isTogglingVideo.current = true;
            try {
                const newVideoState = !isVideoOff;

                if (!newVideoState) { // Turning ON
                    await localVideoTrack.setEnabled(true);
                    // Publish if not already published
                    if (!agoraClient.localTracks.some(t => t.getTrackId() === localVideoTrack.getTrackId())) {
                        await agoraClient.publish(localVideoTrack);
                    }
                } else { // Turning OFF
                    await localVideoTrack.setEnabled(false);
                }

                setIsVideoOff(newVideoState);
                socket?.emit("toggle-video", { linkId: meetingId, userId: userId, agoraUid: agoraClient.uid, videoOff: newVideoState });
            } catch (err) {
                console.error("Error toggling video:", err);
            } finally {
                // Add a small delay after operation completes to effectively debounce rapid clicks
                setTimeout(() => {
                    isTogglingVideo.current = false;
                }, 500);
            }
        }
    };

    const handleEndMeeting = () => {
        if (confirm("Are you sure you want to end this meeting for everyone?")) {
            socket?.emit("end-meeting", { linkId: meetingId, userId: userId });
            handleLeave();
        }
    };

    const handleLeave = () => {
        leave();
        onLeave();
    };

    if (loading) return <div className="flex h-screen w-full items-center justify-center text-white bg-slate-950"><Loader2 className="animate-spin h-10 w-10 text-blue-500" /></div>;
    if (error) return <div className="flex h-screen w-full items-center justify-center text-white bg-slate-950"><div className="text-center"><p className="text-red-500 mb-4">{error}</p><button onClick={onLeave} className="text-white underline">Go Back</button></div></div>;

    return (
        <div
            ref={containerRef}
            className={cn(
                "flex flex-col w-full bg-slate-950 text-white overflow-hidden",
                isMini ? "h-full" : "h-screen"
            )}>
            {/* Header - Hide in mini mode */}
            {!isMini && (
                <header className="flex-none p-4 flex justify-between items-center bg-slate-900 border-b border-slate-800">
                    <h1 className="text-lg font-semibold">Online Consultation {isDoctor && "(Doctor)"}</h1>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-400">
                            {remoteUsers.length > 0 ? "Connected" : "Waiting for participant..."}
                        </span>
                        <span className="text-sm text-slate-400">
                            {roomStatus === 'ready' ? "Connected" : `Waiting for ${waitingFor || 'participant'}...`}
                        </span>
                        <div className={cn("h-2 w-2 rounded-full", roomStatus === 'ready' ? "bg-green-500" : "bg-yellow-500")} />
                        <MeetingTimer startTime={startTime} />
                    </div>
                </header>
            )}

            {/* Main Video Area */}
            <main className={cn(
                "flex-1 flex relative",
                isMini ? "p-0 gap-0" : "p-4 gap-4"
            )}>

                {/* Remote Video (Main) */}
                <div className="flex-1 relative bg-slate-900 rounded-xl overflow-hidden shadow-inner flex items-center justify-center">
                    {/* Timer Overlay for Mini Mode */}
                    {isMini && (
                        <div className="absolute top-2 left-2 z-20">
                            <MeetingTimer startTime={startTime} className="bg-black/60 border-none text-xs px-2 py-0.5" />
                        </div>
                    )}

                    {remoteUsers.length > 0 && remoteUsers.map((user) => {
                        const isRemoteVideoOff = remoteStates[user.uid as string]?.videoOff;
                        return (
                            <div key={user.uid} className="relative w-full h-full bg-slate-800 flex items-center justify-center">
                                {!isRemoteVideoOff ? (
                                    <VideoPlayer
                                        videoTrack={user.videoTrack}
                                        audioTrack={user.audioTrack}
                                        className="w-full h-full"
                                        fit="contain"
                                    />
                                ) : (
                                    <div className="flex flex-col items-center justify-center text-slate-400">
                                        <div className="bg-slate-700 p-6 rounded-full mb-2">
                                            <User className="h-12 w-12" />
                                        </div>
                                        <p className="text-sm font-medium">Camera Off</p>
                                    </div>
                                )}
                                {/* Remote Status Indicators */}
                                {remoteStates[user.uid as string]?.muted && (
                                    <div className={cn(
                                        "absolute rounded-full flex items-center justify-center bg-black/40 backdrop-blur-sm border border-white/10 shadow-sm",
                                        isMini ? "bottom-2 right-2 p-1.5" : "bottom-4 right-4 p-2.5"
                                    )}>
                                        <MicOff className={cn("text-red-500 fill-current", isMini ? "h-3 w-3" : "h-4 w-4")} />
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {/* Waiting State Overlay for Remote Video Area */}
                    {remoteUsers.length === 0 && (
                        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-slate-500 bg-slate-900">
                            <p className={cn(
                                "font-semibold text-center px-2",
                                isMini ? "mb-2 text-xs" : "mb-4 text-xl"
                            )}>
                                {waitingFor === 'doctor' ? "Please wait for the Doctor to join..." :
                                    waitingFor === 'patient' ? "Please wait for the Patient to join..." :
                                        "Waiting for participant..."}
                            </p>
                            <Loader2 className={cn(
                                "animate-spin text-blue-500 opacity-50",
                                isMini ? "h-5 w-5" : "h-10 w-10"
                            )} />
                        </div>
                    )}

                    {/* My Video (Floating Window) - Hide in mini mode (doctor only wants to see patient) */}
                    {!isMini && (
                        <FloatingWindow
                            initialX={typeof window !== 'undefined' ? window.innerWidth - 350 : 1000} // Approximate bottom-right
                            initialY={typeof window !== 'undefined' ? window.innerHeight - 300 : 500}
                            initialWidth={240}
                            initialHeight={135}
                            className="border-2 border-slate-700"
                        >
                            <div className="relative w-full h-full group bg-slate-800 flex items-center justify-center">
                                {!isVideoOff ? (
                                    <VideoPlayer
                                        videoTrack={localVideoTrack}
                                        className="w-full h-full"
                                        fit="contain"
                                    />
                                ) : (
                                    <div className="flex items-center justify-center text-slate-500">
                                        <VideoOff className="h-8 w-8" />
                                    </div>
                                )}
                                <div className="absolute bottom-1 left-2 text-xs font-semibold bg-black/50 px-1 rounded z-10 pointer-events-none">You</div>
                                {isMuted && <div className="absolute top-2 right-2 bg-red-500 p-1 rounded-full z-10 pointer-events-none"><div className="h-2 w-2 bg-white rounded-full"></div></div>}
                            </div>
                        </FloatingWindow>
                    )}
                </div>

            </main>

            {/* Controls Footer - Hide in mini mode (replaced by overlay) */}
            {!isMini ? (
                <footer className="flex-none p-6 flex justify-center pb-8">
                    <MeetingControls
                        isMuted={isMuted}
                        isVideoOff={isVideoOff}
                        isDoctor={isDoctor}
                        onToggleMic={handleToggleMic}
                        onToggleVideo={handleToggleVideo}
                        onEndMeeting={handleEndMeeting}
                        onLeaveMeeting={handleLeave}
                    />
                </footer>
            ) : (
                <div className="absolute bottom-4 left-0 right-0 flex justify-center z-50 pointer-events-auto">
                    <MeetingControls
                        isMuted={isMuted}
                        isVideoOff={isVideoOff}
                        isDoctor={isDoctor}
                        onToggleMic={handleToggleMic}
                        onToggleVideo={handleToggleVideo}
                        onEndMeeting={handleEndMeeting}
                        onLeaveMeeting={handleLeave}
                        compact={true}
                        containerWidth={containerWidth}
                    />
                </div>
            )}
        </div>
    );
}
