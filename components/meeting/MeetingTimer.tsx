"use client";

import React, { useEffect, useState } from "react";
import { Clock } from "lucide-react";

interface MeetingTimerProps {
    startTime: string | Date | null;
    className?: string;
}

export const MeetingTimer: React.FC<MeetingTimerProps> = ({ startTime, className = "" }) => {
    const [duration, setDuration] = useState("00:00:00");

    useEffect(() => {
        if (!startTime) {
            setDuration("00:00:00");
            return;
        }

        const start = new Date(startTime).getTime();

        const timer = setInterval(() => {
            const now = new Date().getTime();
            const diff = now - start;

            if (diff < 0) {
                setDuration("00:00:00");
                return;
            }

            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            const displayHours = hours < 10 ? `0${hours}` : hours;
            const displayMinutes = minutes < 10 ? `0${minutes}` : minutes;
            const displaySeconds = seconds < 10 ? `0${seconds}` : seconds;

            setDuration(`${displayHours}:${displayMinutes}:${displaySeconds}`);
        }, 1000);

        return () => clearInterval(timer);
    }, [startTime]);

    if (!startTime) return null;

    return (
        <div className={`flex items-center gap-2 px-3 py-1 bg-slate-800/80 rounded-full text-white font-mono text-sm border border-slate-700 ${className}`}>
            <Clock className="w-3 h-3 text-blue-400" />
            <span>{duration}</span>
        </div>
    );
};
