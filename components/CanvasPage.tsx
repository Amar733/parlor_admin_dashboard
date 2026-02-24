import React from 'react';
import { PrintableTextarea } from "./prescription-templates/shared-components";
import { DoctorSettings } from "./prescription-templates/types";
import { Info } from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface CanvasPageProps {
    id: string;
    canvasRef: React.RefObject<HTMLCanvasElement>;
    scale: number;
    text: string;
    onTextChange: (text: string) => void;
    activeTool: string;
    startDrawing: (e: React.MouseEvent<HTMLCanvasElement>) => void;
    draw: (e: React.MouseEvent<HTMLCanvasElement>) => void;
    stopDrawing: () => void;
    startDrawingTouch: (e: React.TouchEvent<HTMLCanvasElement>) => void;
    drawTouch: (e: React.TouchEvent<HTMLCanvasElement>) => void;
    contentHeight: number;
    isPreviewMode: boolean;
    doctor: DoctorSettings;
    date: string;
    getImageUrl: (url: string) => string;
    prescriptionSettings: any;
    staticCanvasImage?: string;
    onRemove?: (e: React.MouseEvent) => void;
    iscribeEnabled?: boolean;
    iscribeStatus?: "disconnected" | "connecting" | "connected";
}

const CanvasPage: React.FC<CanvasPageProps> = ({
    id,
    canvasRef,
    scale,
    text,
    onTextChange,
    activeTool,
    startDrawing,
    draw,
    stopDrawing,
    startDrawingTouch,
    drawTouch,
    contentHeight,
    isPreviewMode,
    doctor,
    date,
    getImageUrl,
    prescriptionSettings,
    staticCanvasImage,
    onRemove,
    iscribeEnabled = false,
    iscribeStatus = "disconnected"
}) => {
    const PAPER_WIDTH = 794;
    const PAPER_HEIGHT = 1123;

    const headerColor = prescriptionSettings?.headerColor || "#0d9488";
    const logoShape = prescriptionSettings?.logoShape || "circle";

    return (
        <div
            id={`canvas-page-${id}`}
            style={{
                width: PAPER_WIDTH * scale,
                height: contentHeight * scale,
                position: 'relative',
                margin: '0 auto'
            }}
            className="print:!w-[210mm] print:!h-auto print:!transform-none print:!static shrink-0 max-w-full pb-8 page-break-after-always print:block"
        >
            {/* IScribe Status Badge (Floating) */}
            {iscribeEnabled && !isPreviewMode && (
                <div className="absolute top-2 left-2 z-[100] print:hidden flex items-center gap-2 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-teal-100 shadow-md text-[10px] font-bold pointer-events-auto">
                    <div className={`w-2.5 h-2.5 rounded-full ${iscribeStatus === "connected" ? "bg-green-500 animate-pulse" :
                        iscribeStatus === "connecting" ? "bg-yellow-500" : "bg-red-500"
                        }`} />
                    <span className={iscribeStatus === "connected" ? "text-green-700" : "text-gray-500"}>
                        IScribe: {iscribeStatus.toUpperCase()}
                    </span>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button className="flex items-center justify-center ml-1 p-0.5 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-full transition-all cursor-help">
                                <Info className="w-3.5 h-3.5" />
                            </button>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="z-[200] max-w-xs p-3 space-y-2 bg-white border-teal-100 shadow-xl">
                            <p className="font-bold text-teal-700 text-xs">How to use IScribe:</p>
                            <ol className="list-decimal list-inside text-[11px] font-normal space-y-1.5 text-gray-600">
                                <li>Run <strong>iScribeClientTool</strong> on your PC</li>
                                <li>Plug in IScribe USB Pad</li>
                                <li>Ensure status turns <span className="text-green-600 font-bold">CONNECTED</span></li>
                                <li>Write on the pad to see it here!</li>
                            </ol>
                        </TooltipContent>
                    </Tooltip>
                </div>
            )}

            <div
                className="relative bg-white shadow-2xl print:shadow-none overflow-hidden print:overflow-visible print:!transform-none origin-top-left select-none flex-shrink-0 flex flex-col"
                style={{
                    width: PAPER_WIDTH,
                    minHeight: PAPER_HEIGHT,
                    height: 'auto',
                    transform: `scale(${scale})`
                }}
            >
                {/* Header */}
                <div className="p-6 pb-2 print:p-4 print:pb-2 z-20">
                    <header className="flex justify-between items-center pb-3 border-b-2" style={{ borderColor: headerColor }}>
                        <div className="flex items-center gap-4">
                            {/* Remove Page Button (Only shows if onRemove is passed and not in print) */}
                            {onRemove && (
                                <button
                                    onClick={onRemove}
                                    className="print:hidden absolute top-4 right-4 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                                    title="Remove Page"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                                </button>
                            )}

                            {/* Logo */}
                            <div className="w-16 h-16 flex items-center justify-center text-white font-bold text-xl overflow-hidden shadow-sm"
                                style={{
                                    background: logoShape === "none" ? "transparent" : headerColor,
                                    borderRadius: logoShape === "circle" ? "50%" : logoShape === "square" ? "0.5rem" : "0"
                                }}>
                                {doctor.logoUrl ? (
                                    <img src={getImageUrl(doctor.logoUrl)} alt="Clinic Logo" className="w-full h-full object-cover" />
                                ) : (
                                    'Rx'
                                )}
                            </div>
                            <div>
                                <h4 className="text-xl font-bold uppercase" style={{ color: headerColor }}>{doctor.name}, {doctor.degree}</h4>
                                <p className="text-xs text-gray-600 font-medium">{doctor.speciality} | Reg No: <strong>{doctor.regNo}</strong></p>
                                <p className="text-xs text-gray-600">{doctor.address}</p>
                                <p className="text-xs text-gray-600"><strong>Email:</strong> {doctor.email} | <strong>Phone:</strong> {doctor.phone}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <h1 className="text-2xl font-bold uppercase tracking-wider" style={{ color: headerColor }}>{doctor.clinicName}</h1>
                            <p className="text-sm font-semibold text-gray-500 mt-1">Date: {date}</p>
                        </div>
                    </header>
                </div>

                {/* Drawing/Text Area - Takes remaining space */}
                <div className="relative flex-1 w-full" style={{ minHeight: '800px' }}>
                    {/* Text Layer - Full Page Textarea */}
                    <div className="absolute inset-0 p-6 z-0">
                        <PrintableTextarea
                            className={`w-full h-full text-lg leading-relaxed resize-none border-none focus:ring-0 bg-transparent ${activeTool === 'text' ? 'pointer-events-auto' : 'pointer-events-none'}`}
                            value={text}
                            onChange={(e: any) => onTextChange(e.target.value)}
                            placeholder="Type your notes here..."
                            readOnly={isPreviewMode}
                        />
                    </div>

                    {/* Canvas Layer */}
                    {staticCanvasImage ? (
                        <img
                            src={staticCanvasImage}
                            className="absolute inset-0 pointer-events-none z-10 w-full h-full object-contain"
                            alt="Canvas Drawing"
                        />
                    ) : (
                        <canvas
                            ref={canvasRef}
                            width={PAPER_WIDTH}
                            height={PAPER_HEIGHT - 300} /* Approximate height minus header/footer */
                            className={`absolute inset-0 ${activeTool === 'text' ? 'pointer-events-none' : 'cursor-crosshair'} touch-none`}
                            style={{
                                zIndex: 10,
                                pointerEvents: activeTool === 'text' ? 'none' : 'auto'
                            }}
                            onMouseDown={startDrawing}
                            onMouseMove={draw}
                            onMouseUp={stopDrawing}
                            onMouseLeave={stopDrawing}
                            onTouchStart={startDrawingTouch}
                            onTouchMove={drawTouch}
                            onTouchEnd={stopDrawing}
                        />
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 pt-2 mt-auto print:p-4 print:pt-2 z-20">
                    <div className="flex flex-col items-end">
                        {doctor.signatureUrl ? (
                            <div className="mb-2">
                                <img src={getImageUrl(doctor.signatureUrl)} alt="Signature" className="h-12 object-contain" />
                            </div>
                        ) : (
                            <div className="w-48 border-b border-gray-800 mb-2"></div>
                        )}
                        <p className="text-sm font-bold text-gray-900">{doctor.name} (Signature)</p>
                    </div>

                    <div className="w-full border-t border-gray-200 mt-4 pt-2 text-center">
                        <p className="text-xs text-gray-400">Powered by <strong>ClinicPro+</strong></p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CanvasPage;
