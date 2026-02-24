"use client";

import React from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";

// Dynamically import the canvas component to avoid SSR issues with window/document
const PrescriptionCanvas = dynamic(
  () => import("@/components/PrescriptionCanvas"),
  { ssr: false }
);

export default function DigitalPrescriptionPage() {
  const searchParams = useSearchParams();
  const appointmentId = searchParams.get('appointmentId');

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="w-full">
                {/* Canvas Container */}
        <div className="flex justify-center pb-8">
          <PrescriptionCanvas appointmentId={appointmentId} />
        </div>
      </div>
    </div>
  );
}
