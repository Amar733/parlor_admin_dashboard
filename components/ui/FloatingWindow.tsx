"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";

interface FloatingWindowProps {
    children: React.ReactNode;
    initialX?: number;
    initialY?: number;
    initialWidth?: number;
    initialHeight?: number;
    minWidth?: number;
    minHeight?: number;
    className?: string;
    disabled?: boolean; // New prop to disable drag/resize
    persistenceKey?: string; // Key to store position/size in localStorage
}

export const FloatingWindow: React.FC<FloatingWindowProps> = ({
    children,
    initialX = 20,
    initialY = 20,
    initialWidth = 320,
    initialHeight = 180,
    minWidth = 160,
    minHeight = 90,
    className = "",
    disabled = false,
    persistenceKey,
}) => {
    const [position, setPosition] = useState({ x: initialX, y: initialY });
    const [size, setSize] = useState({ width: initialWidth, height: initialHeight });
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [isInitialized, setIsInitialized] = useState(false);

    const windowRef = useRef<HTMLDivElement>(null);

    // Load from localStorage on mount
    useEffect(() => {
        if (persistenceKey) {
            const saved = localStorage.getItem(persistenceKey);
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    if (parsed.x !== undefined && parsed.y !== undefined) {
                        setPosition({ x: parsed.x, y: parsed.y });
                    }
                    if (parsed.width !== undefined && parsed.height !== undefined) {
                        setSize({ width: parsed.width, height: parsed.height });
                    }
                } catch (e) {
                    console.error("Failed to parse floating window state", e);
                }
            }
        }
        setIsInitialized(true);
    }, [persistenceKey]);

    // Save to localStorage when interaction ends
    useEffect(() => {
        if (isInitialized && !isDragging && !isResizing && persistenceKey && !disabled) {
            localStorage.setItem(persistenceKey, JSON.stringify({
                x: position.x,
                y: position.y,
                width: size.width,
                height: size.height
            }));
        }
    }, [isDragging, isResizing, position, size, persistenceKey, isInitialized, disabled]);


    // Helper to get coordinates
    const getClientCoordinates = (e: MouseEvent | TouchEvent | React.MouseEvent | React.TouchEvent) => {
        if ('touches' in e) {
            return {
                x: e.touches[0].clientX,
                y: e.touches[0].clientY
            };
        }
        return {
            x: (e as MouseEvent | React.MouseEvent).clientX,
            y: (e as MouseEvent | React.MouseEvent).clientY
        };
    };

    // --- Dragging Logic ---
    const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
        if (disabled) return;

        // Prevent dragging if clicking on resize handle or interactive elements
        const target = e.target as HTMLElement;
        if (
            target.closest(".resize-handle") ||
            target.closest("button") ||
            target.closest("input")
        ) {
            return;
        }

        const { x, y } = getClientCoordinates(e);

        setIsDragging(true);
        setDragOffset({
            x: x - position.x,
            y: y - position.y,
        });

        // Prevent default behavior for touch to stop scrolling ONLY if we are starting a drag
        // For mouse, we want to prevent text selection
        if (e.type === 'mousedown') {
            e.preventDefault();
        }
    };

    // --- Resizing Logic ---
    const handleResizeStart = (e: React.MouseEvent | React.TouchEvent) => {
        if (disabled) return;
        setIsResizing(true);
        e.stopPropagation(); // Prevent drag start
        if (e.type === 'mousedown') {
            e.preventDefault(); // Prevent text selection during resize
        }
    };

    // --- Global Move/Up Handlers ---
    const handleMove = useCallback(
        (e: MouseEvent | TouchEvent) => {
            if (isDragging) {
                // Prevent scrolling on mobile while dragging
                if (e.cancelable) e.preventDefault();

                const { x, y } = getClientCoordinates(e);
                const nextX = x - dragOffset.x;
                const nextY = y - dragOffset.y;

                // Clamp to viewport boundaries to keep window visible
                const clampedX = Math.max(0, Math.min(window.innerWidth - size.width, nextX));
                const clampedY = Math.max(0, Math.min(window.innerHeight - size.height, nextY));

                setPosition({
                    x: clampedX,
                    y: clampedY,
                });
            } else if (isResizing) {
                if (e.cancelable) e.preventDefault();

                const { x, y } = getClientCoordinates(e);
                let newWidth = Math.max(minWidth, x - position.x);
                let newHeight = Math.max(minHeight, y - position.y);

                // Clamp resize to viewport boundaries
                newWidth = Math.min(newWidth, window.innerWidth - position.x);
                newHeight = Math.min(newHeight, window.innerHeight - position.y);

                setSize({ width: newWidth, height: newHeight });
            }
        },
        [isDragging, isResizing, dragOffset, position, minWidth, minHeight, size]
    );

    const handleEnd = useCallback(() => {
        setIsDragging(false);
        setIsResizing(false);
    }, []);

    useEffect(() => {
        if (isDragging || isResizing) {
            window.addEventListener("mousemove", handleMove);
            window.addEventListener("mouseup", handleEnd);
            window.addEventListener("touchmove", handleMove, { passive: false });
            window.addEventListener("touchend", handleEnd);
        } else {
            window.removeEventListener("mousemove", handleMove);
            window.removeEventListener("mouseup", handleEnd);
            window.removeEventListener("touchmove", handleMove);
            window.removeEventListener("touchend", handleEnd);
        }
        return () => {
            window.removeEventListener("mousemove", handleMove);
            window.removeEventListener("mouseup", handleEnd);
            window.removeEventListener("touchmove", handleMove);
            window.removeEventListener("touchend", handleEnd);
        };
    }, [isDragging, isResizing, handleMove, handleEnd]);

    // --- Window Resize Handling (Keep window on screen) ---
    useEffect(() => {
        const handleWindowResize = () => {
            setPosition((prevPos) => {
                // Ensure the window doesn't go off the right/bottom edge
                const maxX = window.innerWidth - size.width;
                const maxY = window.innerHeight - size.height;

                return {
                    x: Math.max(0, Math.min(prevPos.x, maxX)),
                    y: Math.max(0, Math.min(prevPos.y, maxY))
                };
            });
        };

        window.addEventListener('resize', handleWindowResize);
        return () => window.removeEventListener('resize', handleWindowResize);
    }, [size]);

    // When disabled (full screen mode), we ignore the internal position/size styles
    // so external CSS (inset-0) can take over.
    const styleWithPosition: React.CSSProperties = disabled ? {} : {
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height,
        cursor: isDragging ? "grabbing" : "grab",
        touchAction: "none", // Critical for touch performance
        userSelect: (isDragging || isResizing) ? "none" : "auto",
        zIndex: 9999, // Ensure it is always on top
    };

    return (
        <div
            ref={windowRef}
            className={`fixed z-50 shadow-2xl rounded-lg overflow-hidden border border-slate-700 bg-black ${className}`}
            style={styleWithPosition}
            onMouseDown={handleStart}
            onTouchStart={handleStart}
        >
            {children}

            {/* Resize Handle - Hide when disabled */}
            {!disabled && (
                <div
                    className="resize-handle absolute bottom-0 right-0 w-8 h-8 cursor-se-resize z-50 flex items-end justify-end p-1 touch-manipulation"
                    onMouseDown={handleResizeStart}
                    onTouchStart={handleResizeStart}
                >
                    <div className="w-3 h-3 border-r-2 border-b-2 border-slate-400 rounded-br-sm opacity-50 hover:opacity-100" />
                </div>
            )}
        </div>
    );
};
