import React from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import MedicineSearchDropdown from "@/components/MedicineSearchDropdown";
import { PrescriptionTemplateProps } from "./types";
import { PrintableInput, PrintableTextarea } from "./shared-components";

const MinimalTemplate: React.FC<PrescriptionTemplateProps> = ({
  doctor,
  patient,
  notes,
  rows,
  prescriptions,
  handlePatientChange,
  handleNoteChange,
  handleRowChange,
  toggleRowCancel,
  deleteRow,
  addRow,
  canvasRef,
  activeTool,
  startDrawing,
  draw,
  stopDrawing,
  startDrawingTouch,
  drawTouch,
  scale,
  contentHeight,
  padRef,
  isPreviewMode,
  getImageUrl,
  prescriptionSettings
}) => {
    const PAPER_WIDTH = 794;
    const PAPER_HEIGHT = 1123;
    const headerColor = prescriptionSettings?.headerColor || "#000000";
    const logoShape = prescriptionSettings?.logoShape || "circle";
    const fontStyle = prescriptionSettings?.fontStyle || "system-ui, -apple-system, sans-serif";
    const fontSize = prescriptionSettings?.fontSize || 100;
    const textColor = prescriptionSettings?.textColor || "#000000";

  return (
    <div 
            id="prescription-print-wrapper"
            style={{ 
                width: PAPER_WIDTH * scale, 
                height: contentHeight * scale,
                position: 'relative',
                margin: '0 auto'
            }}
            className="print:!w-[210mm] print:!h-auto print:!transform-none print:!static shrink-0 max-w-full print:!bg-white"
        >
        <div 
            id="prescription-pad"
            ref={padRef}
            className="relative bg-white shadow-xl print:shadow-none overflow-visible print:overflow-visible print:!transform-none origin-top-left select-none flex-shrink-0"
            style={{ 
                width: PAPER_WIDTH, 
                minHeight: PAPER_HEIGHT,
                height: 'auto',
                transform: `scale(${scale})`
            }}
        >
            
            {/* LAYER 1: HTML BACKGROUND TEMPLATE */}
            <div id="prescription-pad-content" className="relative flex flex-col p-12 pointer-events-none z-0" style={{ fontFamily: fontStyle, color: textColor, transform: `scale(${fontSize / 100})`, transformOrigin: 'top left', width: `${100 / (fontSize / 100)}%` }}>
            
            {/* Clean Header */}
            <header className="flex justify-between items-end pb-8 mb-12 pointer-events-auto mt-8" style={{ borderBottom: `2px solid transparent`, borderImage: headerColor.includes('gradient') ? `${headerColor} 1` : `${headerColor} 1` }}>
                <div>
                     <h1 className="text-5xl font-black tracking-tighter mb-4" style={headerColor.includes('gradient') ? { backgroundImage: headerColor, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' } : { color: headerColor }}>{doctor.clinicName}</h1>
                     <div className="space-y-1">
                        <p className="text-sm font-medium uppercase tracking-widest" style={headerColor.includes('gradient') ? { backgroundImage: headerColor, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' } : { color: headerColor }}>{doctor.name}</p>
                        <p className="text-xs text-gray-500 font-mono">{doctor.degree} • {doctor.regNo}</p>
                     </div>
                </div>
                <div className="text-right space-y-1">
                     <p className="text-xs font-mono text-gray-600">{doctor.address}</p>
                     <p className="text-xs font-mono text-gray-600">{doctor.phone}</p>
                     <p className="text-xs font-mono text-gray-600">{doctor.email}</p>
                </div>
            </header>

            {/* Minimal Patient Info Grid */}
            <section className="grid grid-cols-4 gap-8 mb-12 pointer-events-auto font-mono text-sm">
                <div className="col-span-2 space-y-1">
                     <label className="text-[10px] uppercase tracking-widest text-gray-400 block">Patient Name</label>
                     <PrintableInput 
                        className="w-full bg-transparent rounded-none px-0 py-1 font-bold text-lg" style={{ borderBottom: `1px solid ${headerColor}30`, color: headerColor }}
                        value={patient.name}
                        onChange={(e: any) => handlePatientChange("name", e.target.value)}
                        placeholder="Name"
                        readOnly={isPreviewMode}
                    />
                </div>
                <div>
                    <label className="text-[10px] uppercase tracking-widest text-gray-400 block">Age / Sex</label>
                    <div className="flex items-center gap-2">
                         <PrintableInput 
                            className="w-12 bg-transparent rounded-none px-0 py-1" style={{ borderBottom: `1px solid ${headerColor}30`, color: headerColor }}
                            value={patient.age}
                            onChange={(e: any) => handlePatientChange("age", e.target.value)}
                            readOnly={isPreviewMode}
                        />
                        <span className="text-gray-300">/</span>
                        <PrintableInput 
                            className="w-16 bg-transparent rounded-none px-0 py-1" style={{ borderBottom: `1px solid ${headerColor}30`, color: headerColor }}
                            value={patient.sex}
                            onChange={(e: any) => handlePatientChange("sex", e.target.value)}
                            readOnly={isPreviewMode}
                        />
                    </div>
                </div>
                <div>
                     <label className="text-[10px] uppercase tracking-widest text-gray-400 block">Date</label>
                     <PrintableInput 
                        type="date"
                        className="w-full bg-transparent rounded-none px-0 py-1" style={{ borderBottom: `1px solid ${headerColor}30`, color: headerColor }}
                        value={patient.date}
                        onChange={(e: any) => handlePatientChange("date", e.target.value)}
                        readOnly={isPreviewMode}
                    />
                </div>
            </section>

            {/* Notes Section - Very Minimal */}
            <div className="mb-6 pointer-events-auto">
                 <div className="flex gap-4 mb-2">
                     {(notes.chiefComplaints || !isPreviewMode) && (
                        <div className="flex-1">
                             <strong className="text-xs uppercase block mb-1">C/O:</strong>
                             <PrintableTextarea 
                                className="text-sm text-black"
                                value={notes.chiefComplaints}
                                onChange={(e: any) => handleNoteChange("chiefComplaints", e.target.value)}
                                placeholder="..."
                                readOnly={isPreviewMode}
                            />
                        </div>
                     )}
                     {(notes.diagnosis || !isPreviewMode) && (
                        <div className="flex-1">
                             <strong className="text-xs uppercase block mb-1">Dx:</strong>
                             <PrintableTextarea 
                                className="text-sm font-bold text-black"
                                value={notes.diagnosis}
                                onChange={(e: any) => handleNoteChange("diagnosis", e.target.value)}
                                placeholder="..."
                                readOnly={isPreviewMode}
                            />
                        </div>
                     )}
                 </div>
            </div>

            {/* Rx Section */}
            <div>
                 <h2 className="text-xl font-black uppercase tracking-widest mb-6 pb-2" style={{ borderBottom: `1px solid transparent`, borderImage: headerColor.includes('gradient') ? `${headerColor} 1` : `${headerColor} 1` }}>Prescription</h2>
                 
                 <div className="space-y-0 divider-y divide-gray-100 pointer-events-auto">
                    {rows.map((row, i) => {
                         const hasMedicine = row.medicine.trim() !== '';
                         return (
                            <div key={i} className={`group flex items-baseline gap-4 py-3 border-b border-gray-100 break-inside-avoid ${row.isCancelled ? 'line-through opacity-50' : ''} ${!hasMedicine ? 'print:hidden' : ''}`}>
                                <div className="text-xs font-mono w-6 text-gray-400">{(i+1).toString().padStart(2, '0')}</div>
                                <div className="flex-1">
                                    <div className="flex gap-2 mb-1">
                                        {!isPreviewMode ? (
                                              <div className="relative flex-1">
                                                <MedicineSearchDropdown
                                                  value={row.medicine}
                                                  onChange={(value) => handleRowChange(i, "medicine", value)}
                                                  disabled={activeTool !== 'text' || row.isCancelled}
                                                  placeholder={activeTool === 'text' ? "Medicine..." : ""}
                                                  className={`text-lg font-bold text-black border-none p-0 h-auto bg-transparent font-mono ${activeTool === 'text' ? 'z-20 cursor-text' : 'z-0'}`}
                                                />
                                                <div className="hidden print:block text-lg font-bold text-black font-mono">{row.medicine}</div>
                                              </div>
                                            ) : (
                                              <div className="text-lg font-bold text-black font-mono">{row.medicine}</div>
                                            )}
                                    </div>
                                    <div className="flex gap-6 text-xs font-mono text-gray-600 uppercase tracking-wider">
                                         <PrintableInput 
                                            className="w-20 bg-transparent text-left border-none p-0"
                                            value={row.dose}
                                            onChange={(e: any) => handleRowChange(i, "dose", e.target.value)}
                                            placeholder="DOSE"
                                            readOnly={isPreviewMode}
                                        />
                                        <PrintableInput 
                                            className="w-24 bg-transparent text-left border-none p-0"
                                            value={row.timing}
                                            onChange={(e: any) => handleRowChange(i, "timing", e.target.value)}
                                            placeholder="TIMING"
                                            readOnly={isPreviewMode}
                                        />
                                        <PrintableInput 
                                            className="w-20 bg-transparent text-left border-none p-0"
                                            value={row.duration}
                                            onChange={(e: any) => handleRowChange(i, "duration", e.target.value)}
                                            placeholder="DURATION"
                                            readOnly={isPreviewMode}
                                        />
                                    </div>
                                </div>
                                <div className={`pt-1 print:hidden ${isPreviewMode ? 'invisible' : ''}`}>
                                     <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-5 w-5 text-gray-400 hover:text-red-500"
                                        onClick={() => toggleRowCancel(i)}
                                        title={row.isCancelled ? 'Restore' : 'Cancel'}
                                    >
                                        <X className="w-3 h-3" />
                                    </Button>
                                </div>
                            </div>
                         );
                    })}
                 
                    {!isPreviewMode && (
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="mt-2 text-xs text-black border border-dashed border-black print:hidden"
                            onClick={addRow}
                        >
                            + Add
                        </Button>
                    )}
                 </div>
            </div>

             {/* Footer */}
            <div className="absolute bottom-0 left-0 right-0 p-12 pointer-events-auto">
                 <div className="flex justify-end mt-12">
                    <div className="text-center">
                        {doctor.signatureUrl ? (
                          <div className="mb-2">
                            <img src={getImageUrl(doctor.signatureUrl)} alt="Signature" className="h-12 object-contain mx-auto" />
                          </div>
                        ) : (
                          <div className="w-40 border-b border-black mb-2"></div>
                        )}
                        <p className="text-sm font-bold text-black uppercase">Dr. {doctor.name}</p>
                    </div>
                 </div>
            </div>

            </div>

             {/* LAYER 2: HTML5 CANVAS OVERLAY */}
            <canvas
              ref={canvasRef}
              width={PAPER_WIDTH}
              height={contentHeight}
              className={`absolute inset-0 touch-none ${activeTool === 'text' ? 'pointer-events-none' : 'cursor-crosshair pointer-events-auto'}`}
              style={{
                zIndex: activeTool === 'text' ? 0 : 10
              }}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawingTouch}
              onTouchMove={drawTouch}
              onTouchEnd={stopDrawing}
            />
        </div>
    </div>
  );
};

export default MinimalTemplate;
