import React from "react";
import { Button } from "@/components/ui/button";
import { RotateCcw, X, MapPin, Phone, Mail } from "lucide-react";
import MedicineSearchDropdown from "@/components/MedicineSearchDropdown";
import { PrescriptionTemplateProps } from "./types";
import { PrintableInput, PrintableTextarea } from "./shared-components";

const ModernTemplate: React.FC<PrescriptionTemplateProps> = ({
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
    const headerColor = prescriptionSettings?.headerColor || "#2563eb";
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
            className="relative bg-white shadow-2xl print:shadow-none overflow-visible print:overflow-visible print:!transform-none origin-top-left select-none flex-shrink-0"
            style={{ 
                width: PAPER_WIDTH, 
                minHeight: PAPER_HEIGHT,
                height: 'auto',
                transform: `scale(${scale})`
            }}
        >
            
            {/* LAYER 1: HTML BACKGROUND TEMPLATE */}
            <div id="prescription-pad-content" className="relative flex flex-col p-0 pointer-events-none z-0 print:!transform-none print:!w-full" style={{ fontFamily: fontStyle, color: textColor, transform: `scale(${fontSize / 100})`, transformOrigin: 'top left', width: `${100 / (fontSize / 100)}%`, minHeight: `${PAPER_HEIGHT}px` }}>
            
            {/* Sidebar & Header Layout */}
            <div className="flex flex-row" style={{ minHeight: `${PAPER_HEIGHT}px` }}>
                {/* Left Colored Sidebar */}
                <div className="w-24 flex flex-col items-center justify-start pt-10 text-white gap-8 pointer-events-auto shadow-r-xl z-20" style={{ backgroundImage: headerColor.includes('gradient') ? headerColor : `linear-gradient(to bottom, ${headerColor}, ${headerColor}dd)` }}>
                     <div className="w-16 h-16 bg-white flex items-center justify-center font-bold text-2xl shadow-lg transform rotate-3" style={{ borderRadius: logoShape === "circle" ? "1rem" : logoShape === "square" ? "0.5rem" : "0", color: logoShape === "none" ? "transparent" : headerColor, background: logoShape === "none" ? "transparent" : "white", boxShadow: logoShape === "none" ? "none" : undefined }}>
                        {doctor.logoUrl ? (
                            <img src={getImageUrl(doctor.logoUrl)} alt="Clinic Logo" className="w-full h-full object-cover" style={{ borderRadius: logoShape === "circle" ? "0.75rem" : "0.25rem" }} />
                        ) : (
                            'Rx'
                        )}
                    </div>
                    <div className="flex-1 flex flex-col items-center justify-center pb-8 gap-1">
                        {['P', 'R', 'E', 'S', 'C', 'R', 'I', 'P', 'T', 'I', 'O', 'N'].map((char, index) => (
                            <span key={index} className="font-bold text-2xl text-blue-100/40">{char}</span>
                        ))}
                    </div>
                </div>

                {/* Main Content Info */}
                <div className="flex-1 flex flex-col p-8" style={{ background: headerColor.includes('gradient') ? `${headerColor}05` : `${headerColor}05` }}>
                    
                    {/* Header Info */}
                    <header className="flex justify-between items-start pb-6 mb-8 pointer-events-auto" style={{ borderBottom: `1px solid ${headerColor.includes('gradient') ? 'rgba(0,0,0,0.1)' : headerColor}20` }}>
                        <div>
                            <h1 className="text-4xl font-extrabold tracking-tight mb-2 drop-shadow-sm" style={headerColor.includes('gradient') ? { backgroundImage: headerColor, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' } : { color: headerColor }}>{doctor.clinicName}</h1>
                            <h4 className="text-lg font-semibold">{doctor.name}</h4>
                            <p className="text-sm opacity-70 font-medium">{doctor.degree} - {doctor.speciality}</p>
                            <p className="text-xs font-bold mt-1" style={{ color: headerColor }}>Reg No: {doctor.regNo}</p>
                        </div>
                        <div className="text-right space-y-2 text-sm opacity-80">
                            <div className="flex items-center justify-end gap-2">
                                <MapPin className="w-4 h-4" style={{ color: headerColor }} />
                                <span>{doctor.address}</span>
                            </div>
                            <div className="flex items-center justify-end gap-2">
                                <Phone className="w-4 h-4" style={{ color: headerColor }} />
                                <span>{doctor.phone}</span>
                            </div>
                            <div className="flex items-center justify-end gap-2">
                                <Mail className="w-4 h-4" style={{ color: headerColor }} />
                                <span>{doctor.email}</span>
                            </div>
                        </div>
                    </header>

                    {/* Patient Info Card */}
                    <section className="rounded-xl p-4 mb-6 pointer-events-auto" style={{ background: headerColor.includes('gradient') ? `${headerColor}10` : `${headerColor}10`, border: `1px solid ${headerColor.includes('gradient') ? 'rgba(0,0,0,0.1)' : headerColor}20` }}>
                        <div className="grid grid-cols-3 gap-y-3 gap-x-6 text-sm">
                             <div className="flex flex-col">
                                <span className="text-[10px] uppercase font-bold" style={{ color: `${headerColor}99` }}>Date</span>
                                <PrintableInput 
                                    type="date"
                                    className="bg-transparent font-semibold text-gray-900 p-0 h-auto"
                                    value={patient.date}
                                    onChange={(e: any) => handlePatientChange("date", e.target.value)}
                                    readOnly={isPreviewMode}
                                />
                            </div>
                            <div className="flex flex-col col-span-2">
                                <span className="text-[10px] uppercase font-bold" style={{ color: `${headerColor}99` }}>Patient Name</span>
                                <PrintableInput 
                                    className="w-full bg-transparent font-bold text-lg border-b border-blue-200 focus:border-blue-500"
                                    value={patient.name}
                                    onChange={(e: any) => handlePatientChange("name", e.target.value)}
                                    placeholder="Enter Name"
                                    readOnly={isPreviewMode}
                                />
                            </div>
                            
                            <div className="flex flex-col">
                                <span className="text-[10px] uppercase font-bold" style={{ color: `${headerColor}99` }}>Age / Sex</span>
                                <div className="flex gap-1 items-center font-medium">
                                    <PrintableInput 
                                        className="w-12 bg-transparent border-b border-blue-200 text-center"
                                        value={patient.age}
                                        onChange={(e: any) => handlePatientChange("age", e.target.value)}
                                        placeholder="--"
                                        readOnly={isPreviewMode}
                                    />
                                    <span className="opacity-50">/</span>
                                    <PrintableInput 
                                        className="w-16 bg-transparent border-b border-blue-200 text-center"
                                        value={patient.sex}
                                        onChange={(e: any) => handlePatientChange("sex", e.target.value)}
                                        placeholder="--"
                                        readOnly={isPreviewMode}
                                    />
                                </div>
                            </div>
                             <div className="flex flex-col">
                                <span className="text-[10px] uppercase font-bold" style={{ color: `${headerColor}99` }}>Weight / BP</span>
                                <div className="flex gap-1 items-center font-medium">
                                    <PrintableInput 
                                        className="w-12 bg-transparent border-b border-blue-200 text-center"
                                        value={patient.weight}
                                        onChange={(e: any) => handlePatientChange("weight", e.target.value)}
                                        placeholder="Kg"
                                        readOnly={isPreviewMode}
                                    />
                                    <span className="opacity-50">/</span>
                                    <PrintableInput 
                                        className="w-16 bg-transparent border-b border-blue-200 text-center"
                                        value={patient.bp}
                                        onChange={(e: any) => handlePatientChange("bp", e.target.value)}
                                        placeholder="BP"
                                        readOnly={isPreviewMode}
                                    />
                                </div>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] uppercase font-bold" style={{ color: `${headerColor}99` }}>Contact</span>
                                <PrintableInput 
                                    className="bg-transparent font-medium"
                                    value={patient.contact}
                                    onChange={(e: any) => handlePatientChange("contact", e.target.value)}
                                    placeholder="+91..."
                                    readOnly={isPreviewMode}
                                />
                            </div>
                        </div>
                    </section>

                    {/* Content Columns */}
                    <div className="flex gap-6 pointer-events-auto">
                        {/* Left Column: Vitals/Notes */}
                        <div className="w-1/3 space-y-6">
                            {(notes.chiefComplaints || !isPreviewMode) && (
                                <div>
                                    <h5 className="text-xs font-bold opacity-80 uppercase border-b border-blue-200 mb-2 pb-1">Chief Complaints</h5>
                                    <PrintableTextarea 
                                        className="text-sm"
                                        minHeight="3rem"
                                        value={notes.chiefComplaints}
                                        onChange={(e: any) => handleNoteChange("chiefComplaints", e.target.value)}
                                        placeholder="..."
                                        readOnly={isPreviewMode}
                                    />
                                </div>
                            )}
                            
                            {(notes.diagnosis || !isPreviewMode) && (
                                <div>
                                    <h5 className="text-xs font-bold opacity-80 uppercase border-b border-blue-200 mb-2 pb-1">Diagnosis</h5>
                                    <PrintableTextarea 
                                        className="text-sm font-bold"
                                        minHeight="2rem"
                                        value={notes.diagnosis}
                                        onChange={(e: any) => handleNoteChange("diagnosis", e.target.value)}
                                        placeholder="..."
                                        readOnly={isPreviewMode}
                                    />
                                </div>
                            )}

                             {(notes.pastHistory || !isPreviewMode) && (
                                <div>
                                    <h5 className="text-xs font-bold opacity-60 uppercase mb-1">History</h5>
                                    <PrintableTextarea 
                                        className="text-xs opacity-70"
                                        value={notes.pastHistory}
                                        onChange={(e: any) => handleNoteChange("pastHistory", e.target.value)}
                                        readOnly={isPreviewMode}
                                        placeholder="..."
                                    />
                                </div>
                            )}

                             {(notes.allergies || !isPreviewMode) && (
                                <div>
                                    <h5 className="text-xs font-bold text-red-500 uppercase mb-1">Allergies</h5>
                                    <PrintableTextarea 
                                        className="text-xs opacity-70"
                                        value={notes.allergies}
                                        onChange={(e: any) => handleNoteChange("allergies", e.target.value)}
                                        readOnly={isPreviewMode}
                                        placeholder="..."
                                    />
                                </div>
                            )}
                        </div>

                        {/* Right Column: Rx */}
                        <div className="flex-1">
                             <div className="flex items-center gap-2 mb-4">
                                <span className="text-4xl font-serif font-bold italic" style={{ color: headerColor }}>Rx</span>
                                <div className="h-0.5 flex-grow rounded-full" style={{ backgroundColor: `${headerColor}20` }}></div>
                             </div>

                             {/* Modern Table Header */}
                             <div className="grid grid-cols-[2fr_1fr_1.5fr_1fr_1fr_40px] print:grid-cols-[2fr_1fr_1.5fr_1fr_1fr] rounded-lg shadow-sm text-[10px] uppercase font-bold text-white mb-3 py-3 px-3 tracking-wider" style={{ background: headerColor }}>
                                <div>Medicine</div>
                                <div className="text-center">Dose</div>
                                <div className="text-center">When</div>
                                <div className="text-center">Timing</div>
                                <div className="text-center">Dur.</div>
                                <div className="print:hidden text-center">Action</div>
                            </div>

                             {/* Rows */}
                             <div className="space-y-2">
                                {rows.map((row, i) => {
                                  const hasMedicine = row.medicine.trim() !== '';
                                  return (
                                    <div key={i} className={`relative group grid grid-cols-[2fr_1fr_1.5fr_1fr_1fr_40px] print:grid-cols-[2fr_1fr_1.5fr_1fr_1fr] items-start p-2 rounded-lg border border-transparent hover:bg-gray-50 hover:border-gray-100 transition-all break-inside-avoid ${row.isCancelled ? 'opacity-50 grayscale' : ''} ${!hasMedicine ? 'print:hidden' : ''}`}>
                                        
                                        {/* Medicine Name */}
                                        <div className="relative">
                                            {!isPreviewMode ? (
                                              <div className="relative w-full">
                                                <MedicineSearchDropdown
                                                  value={row.medicine}
                                                  onChange={(value) => handleRowChange(i, "medicine", value)}
                                                  disabled={activeTool !== 'text' || row.isCancelled}
                                                  placeholder={activeTool === 'text' ? "Medicine..." : ""}
                                                  className={`text-sm font-bold border-none p-0 h-auto bg-transparent ${activeTool === 'text' ? 'z-20 cursor-text' : 'z-0'}`}
                                                />
                                                <div className="hidden print:block text-sm font-bold">{row.medicine}</div>
                                              </div>
                                            ) : (
                                              <div className="text-sm font-bold">{row.medicine}</div>
                                            )}
                                        </div>

                                        {/* Inputs */}
                                        <PrintableTextarea 
                                            className="text-xs font-medium text-center opacity-80"
                                            placeholder="--"
                                            value={row.dose}
                                            onChange={(e: any) => handleRowChange(i, "dose", e.target.value)}
                                            disabled={activeTool !== 'text' || row.isCancelled}
                                            readOnly={isPreviewMode}
                                        />
                                        <PrintableTextarea 
                                            className="text-xs text-center opacity-70"
                                            placeholder="--"
                                            value={row.intake}
                                            onChange={(e: any) => handleRowChange(i, "intake", e.target.value)}
                                            disabled={activeTool !== 'text' || row.isCancelled}
                                            readOnly={isPreviewMode}
                                        />
                                        <PrintableTextarea 
                                            className="text-xs text-center opacity-70"
                                            placeholder="--"
                                            value={row.timing}
                                            onChange={(e: any) => handleRowChange(i, "timing", e.target.value)}
                                            disabled={activeTool !== 'text' || row.isCancelled}
                                            readOnly={isPreviewMode}
                                        />
                                        <PrintableTextarea 
                                            className="text-xs text-center opacity-70"
                                            placeholder="--"
                                            value={row.duration}
                                            onChange={(e: any) => handleRowChange(i, "duration", e.target.value)}
                                            disabled={activeTool !== 'text' || row.isCancelled}
                                            readOnly={isPreviewMode}
                                        />

                                        {/* Actions */}
                                         <div className={`flex items-start justify-center print:hidden relative z-20 opacity-0 group-hover:opacity-100 transition-opacity ${isPreviewMode ? 'hidden' : ''}`}>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-5 w-5 text-red-400 hover:text-red-700 hover:bg-red-50"
                                                onClick={() => toggleRowCancel(i)}
                                                title={row.isCancelled ? 'Restore' : 'Cancel'}
                                            >
                                                <X className="w-3 h-3" />
                                            </Button>
                                        </div>
                                    </div>
                                  );
                                })}
                             </div>

                             {/* Add Button */}
                             {!isPreviewMode && (
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="w-full mt-2 text-xs text-blue-400 hover:text-blue-600 hover:bg-blue-50 border border-dashed border-blue-200 print:hidden"
                                    onClick={addRow}
                                >
                                    + Add Medicine
                                </Button>
                             )}

                             {/* Advice Section */}
                             <div className="mt-8 bg-yellow-50/50 p-4 rounded-xl border border-yellow-100">
                                <h5 className="text-xs font-bold text-yellow-700 uppercase mb-2 flex items-center gap-2">
                                    <span>💡 Advice</span>
                                </h5>
                                <PrintableTextarea 
                                    className="text-sm"
                                    minHeight="3rem"
                                    value={notes.advice}
                                    onChange={(e: any) => handleNoteChange("advice", e.target.value)}
                                    placeholder="Enter advice for patient..."
                                    readOnly={isPreviewMode}
                                />
                             </div>

                              <div className="mt-4 flex items-center gap-2">
                                <span className="text-xs font-bold opacity-50 uppercase">Review Date:</span>
                                <PrintableTextarea 
                                    className="text-sm font-semibold flex-1"
                                    minHeight="1.5rem"
                                    value={notes.followUp}
                                    onChange={(e: any) => handleNoteChange("followUp", e.target.value)}
                                    placeholder="When to visit next..."
                                    readOnly={isPreviewMode}
                                />
                             </div>

                        </div>
                    </div>


                </div>
            </div>

            {/* Footer */}
            <div className="absolute bottom-0 w-full p-8 pointer-events-auto pl-32">
                 <div className="flex justify-between items-end">
                    <div className="text-[10px] opacity-40">
                        Generated by ClinicPro+
                    </div>
                    <div className="text-center">
                        {doctor.signatureUrl ? (
                          <div className="mb-2">
                            <img src={getImageUrl(doctor.signatureUrl)} alt="Signature" className="h-12 object-contain mx-auto" />
                          </div>
                        ) : (
                          <div className="w-48 border-b-2 mb-2" style={{ borderColor: textColor }}></div>
                        )}
                        <p className="text-sm font-bold">{doctor.name}</p>
                        <p className="text-[10px] opacity-60 uppercase tracking-widest">Signature</p>
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

export default ModernTemplate;
