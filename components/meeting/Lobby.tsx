"use client";

import { useState, useEffect } from "react";
import type { ICameraVideoTrack, IMicrophoneAudioTrack } from "agora-rtc-sdk-ng";
import { VideoPlayer } from "@/components/meeting/VideoPlayer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Mic, MicOff, Video, VideoOff, Loader2 } from "lucide-react";

import { getAgoraRTC } from "@/lib/agora";

interface LobbyProps {
    doctorName?: string;
    patientName?: string;
    onJoin: () => void;
}

export function Lobby({ doctorName, patientName, onJoin }: LobbyProps) {
    const [localVideoTrack, setLocalVideoTrack] = useState<ICameraVideoTrack | null>(null);
    const [localAudioTrack, setLocalAudioTrack] = useState<IMicrophoneAudioTrack | null>(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [loadingPreview, setLoadingPreview] = useState(true);

    useEffect(() => {
        let mounted = true;



        // ...

        const initTracks = async () => {
            try {
                // Dynamically import AgoraRTC to avoid SSR issues
                const AgoraRTC = await getAgoraRTC();

                const [audio, video] = await AgoraRTC.createMicrophoneAndCameraTracks();
                if (mounted) {
                    setLocalAudioTrack(audio);
                    setLocalVideoTrack(video);
                    setLoadingPreview(false);
                } else {
                    audio.close();
                    video.close();
                }
            } catch (err) {
                console.error("Failed to create tracks", err);
                if (mounted) setLoadingPreview(false);
            }
        };

        initTracks();

        return () => {
            mounted = false;
            localAudioTrack?.close();
            localVideoTrack?.close();
        };
    }, []);

    const toggleMic = () => {
        if (localAudioTrack) {
            localAudioTrack.setMuted(!isMuted);
            setIsMuted(!isMuted);
        }
    };

    const toggleVideo = () => {
        if (localVideoTrack) {
            localVideoTrack.setEnabled(isVideoOff);
            setIsVideoOff(!isVideoOff);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-4xl grid md:grid-cols-2 gap-0 overflow-hidden shadow-2xl">
                {/* Left: Video Preview */}
                <div className="bg-slate-900 p-6 flex flex-col items-center justify-center text-white min-h-[400px]">
                    <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden mb-6 group">
                        {loadingPreview ? (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
                            </div>
                        ) : !isVideoOff && localVideoTrack ? (
                            <VideoPlayer
                                videoTrack={localVideoTrack}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
                                <span className="text-slate-500">Camera Off</span>
                            </div>
                        )}

                        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4 transition-opacity">
                            <Button
                                variant={isMuted ? "destructive" : "secondary"}
                                size="icon"
                                className="rounded-full"
                                onClick={toggleMic}
                            >
                                {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                            </Button>
                            <Button
                                variant={isVideoOff ? "destructive" : "secondary"}
                                size="icon"
                                className="rounded-full"
                                onClick={toggleVideo}
                            >
                                {isVideoOff ? <VideoOff className="h-4 w-4" /> : <Video className="h-4 w-4" />}
                            </Button>
                        </div>
                    </div>
                    <div className="text-center text-sm text-slate-400">
                        Check your audio and video before joining
                    </div>
                </div>

                {/* Right: Join Details */}
                <div className="p-8 flex flex-col justify-center">
                    <CardHeader className="px-0 pt-0">
                        <CardTitle className="text-2xl">Ready to join?</CardTitle>
                        <CardDescription>
                            You are about to enter a secure consultation.
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="px-0 space-y-6">
                        <div className="space-y-4">
                            <div className="p-4 bg-blue-50 text-blue-900 rounded-lg text-sm">
                                <p className="font-semibold mb-1">Appointment Details</p>
                                <div className="flex justify-between">
                                    <span>Doctor:</span>
                                    <span className="font-medium">{doctorName || "Loading..."}</span>
                                </div>
                                <div className="flex justify-between mt-1">
                                    <span>Patient:</span>
                                    <span className="font-medium">{patientName || "Guest"}</span>
                                </div>
                            </div>
                        </div>

                        <Button
                            className="w-full py-6 text-lg"
                            size="lg"
                            onClick={() => {
                                // Close local preview tracks so MeetingRoom can open new ones (or pass them through - but simple close/reopen is safer for now)
                                localAudioTrack?.close();
                                localVideoTrack?.close();
                                onJoin();
                            }}
                            disabled={loadingPreview}
                        >
                            Join Meeting
                        </Button>
                    </CardContent>
                </div>
            </Card>
        </div>
    );
}
