"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

let setGlobalLoading: ((loading: boolean) => void) | null = null;

export function LoadingBar() {
  const [loading, setLoading] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setGlobalLoading = setLoading;
    return () => { setGlobalLoading = null; };
  }, []);

  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => setLoading(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [pathname, loading]);

  if (!loading) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-muted">
      <div className="h-full bg-primary animate-pulse" style={{ width: "100%" }} />
    </div>
  );
}

export function showLoadingBar() {
  if (setGlobalLoading) {
    setGlobalLoading(true);
  }
}