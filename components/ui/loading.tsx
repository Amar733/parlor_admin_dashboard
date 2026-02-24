"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingProps {
  size?: "sm" | "md" | "lg" | "xl";
  text?: string;
  className?: string;
  variant?: "default" | "button" | "overlay";
}

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-5 w-5", 
  lg: "h-6 w-6",
  xl: "h-8 w-8"
};

export function Loading({ 
  size = "md", 
  text, 
  className,
  variant = "default" 
}: LoadingProps) {
  if (variant === "overlay") {
    return (
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 shadow-xl flex items-center gap-3">
          <Loader2 className={cn("animate-spin text-slate-600", sizeClasses[size])} />
          {text && <span className="text-slate-700 font-medium">{text}</span>}
        </div>
      </div>
    );
  }

  if (variant === "button") {
    return (
      <>
        <Loader2 className={cn("animate-spin text-slate-600", sizeClasses[size], className)} />
        {text && <span className="ml-2">{text}</span>}
      </>
    );
  }

  return (
    <div className={cn("flex items-center justify-center gap-3", className)}>
      <Loader2 className={cn("animate-spin text-slate-600", sizeClasses[size])} />
      {text && <span className="text-slate-700 font-medium">{text}</span>}
    </div>
  );
}