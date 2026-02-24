'use client';

import React, { useEffect, useRef } from 'react';
import { ICameraVideoTrack, IRemoteVideoTrack } from 'agora-rtc-sdk-ng';

interface VideoPlayerProps {
    videoTrack: ICameraVideoTrack | IRemoteVideoTrack | undefined;
    audioTrack?: any; // IRemoteAudioTrack | undefined
    className?: string; // Additional classes for styling
    style?: React.CSSProperties;
    fit?: 'contain' | 'cover' | 'fill';
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoTrack, audioTrack, className, style, fit = 'contain' }) => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        // Play video track
        videoTrack?.play(containerRef.current);

        // Apply object-fit to the internal video element created by Agora SDK
        // We need this delay because Agora creates the video element asynchronously inside play()
        const timer = setTimeout(() => {
            const videoElement = containerRef.current?.querySelector('video');
            if (videoElement) {
                videoElement.style.objectFit = fit;
            }
        }, 100);

        return () => {
            videoTrack?.stop();
            clearTimeout(timer);
        };
    }, [videoTrack, fit]);

    useEffect(() => {
        // Play audio track if provided (remote users)
        audioTrack?.play();
        return () => {
            audioTrack?.stop();
        };
    }, [audioTrack]);

    return (
        <div
            ref={containerRef}
            className={`w-full h-full bg-slate-900 rounded-lg overflow-hidden relative ${className || ''}`}
            style={style}
        />
    );
};
