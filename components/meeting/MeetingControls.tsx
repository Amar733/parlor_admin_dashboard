'use client';

import React from 'react';
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Video, VideoOff, PhoneOff, LogOut } from "lucide-react";

import { cn } from "@/lib/utils";

interface MeetingControlsProps {
    isMuted: boolean;
    isVideoOff: boolean;
    isDoctor: boolean;
    onToggleMic: () => void;
    onToggleVideo: () => void;
    onEndMeeting?: () => void;
    onLeaveMeeting: () => void;
    compact?: boolean;
    containerWidth?: number;
}

export const MeetingControls: React.FC<MeetingControlsProps> = ({
    isMuted,
    isVideoOff,
    isDoctor,
    onToggleMic,
    onToggleVideo,
    onEndMeeting,
    onLeaveMeeting,
    compact = false,
    containerWidth
}) => {
    // Dynamic sizing logic for mini mode
    const getDynamicStyles = () => {
        if (!containerWidth || !compact) return null;

        // Ratio: 0.12 of container width, clamped between 24px and 38px
        const size = Math.max(24, Math.min(38, containerWidth * 0.12));

        return {
            button: { width: `${size}px`, height: `${size}px` },
            iconClass: "w-[50%] h-[50%]", // Relative to button
            containerGap: `${size * 0.25}px`, // Dynamic gap
            containerPadding: `${size * 0.25}px` // Dynamic padding
        };
    };

    const dynamicStyles = getDynamicStyles();

    return (
        <div
            className={cn(
                "flex items-center backdrop-blur-md shadow-2xl border border-slate-700 transition-all",
                !dynamicStyles && (compact
                    ? "gap-1.5 p-1.5 bg-slate-900/80 rounded-lg scale-90"
                    : "gap-4 p-4 bg-slate-900/90 rounded-full")
            )}
            style={dynamicStyles ? {
                gap: dynamicStyles.containerGap,
                padding: dynamicStyles.containerPadding,
                backgroundColor: "rgba(15, 23, 42, 0.8)",
                borderRadius: "0.5rem"
            } : undefined}
        >
            {/* Mic Toggle */}
            <Button
                variant={isMuted ? "destructive" : "secondary"}
                size="icon"
                className={cn(
                    "rounded-full transition-colors",
                    !dynamicStyles && (compact ? "h-7 w-7" : "h-12 w-12"),
                    isMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-slate-700 hover:bg-slate-600'
                )}
                style={dynamicStyles?.button}
                onClick={onToggleMic}
            >
                {isMuted
                    ? <MicOff className={dynamicStyles ? dynamicStyles.iconClass : (compact ? "h-3.5 w-3.5" : "h-5 w-5")} />
                    : <Mic className={dynamicStyles ? dynamicStyles.iconClass : (compact ? "h-3.5 w-3.5" : "h-5 w-5")} />
                }
            </Button>

            {/* Video Toggle */}
            <Button
                variant={isVideoOff ? "destructive" : "secondary"}
                size="icon"
                className={cn(
                    "rounded-full transition-colors",
                    !dynamicStyles && (compact ? "h-7 w-7" : "h-12 w-12"),
                    isVideoOff ? 'bg-red-500 hover:bg-red-600' : 'bg-slate-700 hover:bg-slate-600'
                )}
                style={dynamicStyles?.button}
                onClick={onToggleVideo}
            >
                {isVideoOff
                    ? <VideoOff className={dynamicStyles ? dynamicStyles.iconClass : (compact ? "h-3.5 w-3.5" : "h-5 w-5")} />
                    : <Video className={dynamicStyles ? dynamicStyles.iconClass : (compact ? "h-3.5 w-3.5" : "h-5 w-5")} />
                }
            </Button>

            {/* End Button - Doctor Only */}
            {isDoctor && onEndMeeting && (
                <Button
                    variant="destructive"
                    size={compact ? "icon" : "default"}
                    className={cn(
                        "rounded-full bg-red-600 hover:bg-red-700 font-semibold transition-colors",
                        !dynamicStyles && (compact ? "h-7 w-7" : "px-6 h-12")
                    )}
                    style={dynamicStyles?.button}
                    onClick={onEndMeeting}
                >
                    <PhoneOff className={cn(
                        dynamicStyles ? dynamicStyles.iconClass : (compact ? "h-3.5 w-3.5" : "mr-2 h-5 w-5")
                    )} />
                    {!compact && "End Meeting"}
                </Button>
            )}
        </div>
    );
};
