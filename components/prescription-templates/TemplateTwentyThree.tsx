import React from "react";
import { Button } from "@/components/ui/button";
import { RotateCcw, X, Trash2 } from "lucide-react";
import MedicineSearchDropdown from "@/components/MedicineSearchDropdown";
import { PrescriptionTemplateProps } from "./types";
import { PrintableInput, PrintableTextarea } from "./shared-components";

const TemplateTwentyThree: React.FC<PrescriptionTemplateProps> = ({
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
    // A4 dimensions
    const PAPER_WIDTH = 794;
    const PAPER_HEIGHT = 1123;
    const headerColor = prescriptionSettings?.headerColor || "#0d9488";
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
            className="print:!w-[210mm] print:!h-auto print:!transform-none print:!static shrink-0 max-w-full pb-8"
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
            <div id="prescription-pad-content" className="relative flex flex-col min-h-[1123px] p-8 pointer-events-none z-0"
   style={{ fontFamily: fontStyle, color: textColor, transform: `scale(${fontSize / 100})`, transformOrigin: 'top left', width: `${100 / (fontSize / 100)}%` }}
            >
            
            {/* Header */}
             <header className="header-tabular bg-[#4CAF50] text-white p-5  border-b-3 border-[#388e3c] flex items-center"
             style={{ borderBottom: `4px solid transparent`, borderImage: `${headerColor} 1` }}
             >
            <span className="logo text-2xl mr-4">💊</span>
            <div>
              <h4 className="text-xl font-bold mb-0 uppercase" style={headerColor.includes('gradient') ? { backgroundImage: headerColor, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' } : { color: headerColor }}>{doctor.name}, {doctor.degree}</h4>
              <p className="text-sm mb-0">
                {doctor.speciality} | Reg No: <strong>{doctor.regNo}</strong> | {doctor.address}
              </p>
            </div>
          </header>        


            {/* Patient Info Grid */}
             
          <div className="data-section-title bg-[#f0f8ff] text-[#4CAF50] font-bold py-2 px-7 border-y border-gray-300 mt-4 ">
            Patient Details & Encounter Information
          </div>
          <table className="data-table w-full border-collapse text-sm  pointer-events-auto">
            <tbody>
              <tr>
                <td className="data-label p-2 border border-gray-200 font-bold text-[#388e3c] w-1/4">
                  Sr. No. / Date:
                </td>
                <td className="p-2 border border-gray-200">
                  <strong>{prescriptions?.length ? prescriptions.length + 1 : "1"}</strong> /{" "}
                  <PrintableInput 
                    type="date"
                    className="bg-transparent border-none outline-none p-0 hover:bg-gray-400"
                    value={patient.date}
                    onChange={(e: any) => handlePatientChange("date", e.target.value)}
                    readOnly={isPreviewMode}
                  />
                </td>
                <td className="data-label p-2 border border-gray-200 font-bold text-[#388e3c] w-1/4">
                  Attending Doctor:
                </td>
                <td className="p-2 border border-gray-200">
                  Dr. {doctor.name} 
                  {/* (Room:
                  <PrintableInput 
                    className="bg-transparent border-b border-gray-300 focus:border-[#4CAF50] outline-none px-1 w-16 text-center"
                    value={patient.room}
                    onChange={(e: any) => handlePatientChange("room", e.target.value)}
                    placeholder="Room"
                    readOnly={isPreviewMode}
                  />) */}
                </td>
              </tr>
              <tr className="mb-4 mt-8">
                <td className="data-label p-2 border border-gray-200 font-bold text-[#388e3c] w-1/4">
                  Patient Name:
                </td>
                <td className="p-2 border border-gray-200">
                  <PrintableInput 
                    className="bg-transparent border-b border-gray-300 focus:border-[#4CAF50] outline-none px-1 w-full"
                    value={patient.name}
                    onChange={(e: any) => handlePatientChange("name", e.target.value)}
                    placeholder="Enter Name"
                    readOnly={isPreviewMode}
                  />
                </td>
                <td className="data-label p-2 border border-gray-200 font-bold text-[#388e3c]">
                  Age / Sex:
                </td>
                <td className="p-2 border border-gray-200">
                  <div className="flex items-center gap-1">
                    <PrintableInput 
                      className="w-12 bg-transparent border-b border-gray-300 focus:border-[#4CAF50] outline-none px-1 text-center"
                      value={patient.age}
                      onChange={(e: any) => handlePatientChange("age", e.target.value)}
                      placeholder="Age"
                      readOnly={isPreviewMode}
                    />
                    <span> /</span>
                    <PrintableInput 
                      className="w-16 bg-transparent border-b border-gray-300 focus:border-[#4CAF50] outline-none px-1 text-center"
                      value={patient.sex}
                      onChange={(e: any) => handlePatientChange("sex", e.target.value)}
                      placeholder="Sex"
                      readOnly={isPreviewMode}
                    />
                  </div>
                </td>
              </tr>
              <tr>
                <td className="data-label p-2 border border-gray-200 font-bold text-[#388e3c]">
                  Contact No.:
                </td>
                <td className="p-2 border border-gray-200">
                  <PrintableInput 
                    className="bg-transparent border-b border-gray-300 focus:border-[#4CAF50] outline-none px-1 w-full"
                    value={patient.contact}
                    onChange={(e: any) => handlePatientChange("contact", e.target.value)}
                    placeholder="+91..."
                    readOnly={isPreviewMode}
                  />
                </td>
                <td className="data-label p-2 border border-gray-200 font-bold text-[#388e3c]">
                  Address:
                </td>
                <td className="p-2 border border-gray-200">
                  <PrintableInput 
                    className="bg-transparent border-b border-gray-300 focus:border-[#4CAF50] outline-none px-1 w-full"
                    value={patient.address}
                    onChange={(e: any) => handlePatientChange("address", e.target.value)}
                    placeholder="Enter Address"
                    readOnly={isPreviewMode}
                  />
                </td>
              </tr>
            </tbody>
          </table>
         
         

            {/* Clinical Notes Grid */}
           <div className="data-section-title bg-[#f0f8ff] text-[#4CAF50] font-bold py-2 px-7 border-y border-gray-300 mt-4">
            Clinical Findings & Notes
          </div>
          <table className="data-table w-full border-collapse text-sm pointer-events-auto">
            <tbody>
              <tr>
                <td className="data-label p-2 border border-gray-200 font-bold text-[#388e3c] w-1/4">
                  Chief Complains:
                </td>
                <td className="p-2 border border-gray-200">
                  <PrintableTextarea 
                    className="text-sm w-full bg-transparent border-none outline-none"
                    value={notes.chiefComplaints}
                    onChange={(e: any) => handleNoteChange("chiefComplaints", e.target.value)}
                    placeholder="Enter complaints..."
                    readOnly={isPreviewMode}
                  />
                </td>
                <td className="data-label p-2 border border-gray-200 font-bold text-[#388e3c] w-1/4">
                  Diagnosis:
                </td>
                <td className="p-2 border border-gray-200 font-bold text-green-600">
                  <PrintableTextarea 
                    className="text-sm w-full bg-transparent border-none outline-none font-bold text-green-600"
                    value={notes.diagnosis}
                    onChange={(e: any) => handleNoteChange("diagnosis", e.target.value)}
                    placeholder="Enter diagnosis..."
                    readOnly={isPreviewMode}
                  />
                </td>
              </tr>
              <tr>
                <td className="data-label p-2 border border-gray-200 font-bold text-[#388e3c]">
                  Known Drug Allergy:
                </td>
                <td className="p-2 border border-gray-200 text-red-500">
                  <PrintableTextarea 
                    className="text-sm w-full bg-transparent border-none outline-none text-red-500"
                    value={notes.allergies}
                    onChange={(e: any) => handleNoteChange("allergies", e.target.value)}
                    readOnly={isPreviewMode}
                  />
                </td>
                <td className="data-label p-2 border border-gray-200 font-bold text-[#388e3c]">
                  Past History:
                </td>
                <td className="p-2 border border-gray-200">
                  <PrintableTextarea 
                    className="text-sm w-full bg-transparent border-none outline-none"
                    value={notes.pastHistory}
                    onChange={(e: any) => handleNoteChange("pastHistory", e.target.value)}
                    readOnly={isPreviewMode}
                  />
                </td>
              </tr>
              <tr>
                <td className="data-label p-2 border border-gray-200 font-bold text-[#388e3c]">
                  Doctor's Note:
                </td>
                <td className="p-2 border border-gray-200">
                  <PrintableTextarea 
                    className="text-sm w-full bg-transparent border-none outline-none"
                    value={notes.doctorNotes}
                    onChange={(e: any) => handleNoteChange("doctorNotes", e.target.value)}
                    readOnly={isPreviewMode}
                  />
                </td>
                <td className="data-label p-2 border border-gray-200 font-bold text-[#388e3c]">
                  Investigations Advised:
                </td>
                <td className="p-2 border border-gray-200">
                  <PrintableTextarea 
                    className="text-sm w-full bg-transparent border-none outline-none"
                    value={notes.investigations}
                    onChange={(e: any) => handleNoteChange("investigations", e.target.value)}
                    readOnly={isPreviewMode}
                  />
                </td>
              </tr>
            </tbody>
          </table>

            {/* Medications Table */}
            <div className="flex justify-between items-end mb-1.5 print:mb-1 pointer-events-auto">
                            <h5 className="text-red-600 font-bold text-sm">Medications:</h5>
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                className={`h-6 text-xs text-teal-600 hover:text-teal-800 print:hidden ${isPreviewMode ? 'opacity-0 pointer-events-none' : ''}`}
                                onClick={addRow}
                            >
                                + Add Row
                            </Button>
                        </div>
                        <div className="w-full mb-3 print:mb-2 pointer-events-auto">
                            <div className="grid grid-cols-[2fr_1fr_1.5fr_1fr_1fr_60px] print:grid-cols-[2fr_1fr_1.5fr_1fr_1fr] text-xs font-bold p-2"
                             style={{ background: headerColor.includes('gradient') ? headerColor : `${headerColor}20`, borderBottom: `1px solid ${headerColor.includes('gradient') ? 'rgba(0,0,0,0.1)' : headerColor}40`, color: headerColor.includes('gradient') ? '#000' : headerColor }}
                             >
                                <div>Medicine</div>
                                <div className="text-center">Dose</div>
                                <div className="text-center">Intake Condition</div>
                                <div className="text-center">Timing</div>
                                <div className="text-center">Duration</div>
                                <div className={`text-center print:hidden ${isPreviewMode ? 'opacity-0' : ''}`}>Actions</div>
                            </div>
                            {rows.map((row, i) => {
                              const hasMedicine = row.medicine.trim() !== '';
                              return (
                                <div key={i} className={`relative grid grid-cols-[2fr_1fr_1.5fr_1fr_1fr_60px] print:grid-cols-[2fr_1fr_1.5fr_1fr_1fr] border-b border-gray-100 p-1 items-start ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'} break-inside-avoid ${row.isCancelled ? 'opacity-70' : ''} ${!hasMedicine ? 'print:hidden' : ''}`}>
                                    {/* Red cancel line overlay */}
                                    {row.isCancelled && (
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                                            <hr className="w-full border-t-2 border-red-500" style={{ borderStyle: 'solid' }} />
                                        </div>
                                    )}
                                    
                                    <div className="relative flex items-start justify-start py-1 px-1">
                                        {!isPreviewMode ? (
                                          <div className="relative w-full">
                                            <MedicineSearchDropdown
                                              value={row.medicine}
                                              onChange={(value) => handleRowChange(i, "medicine", value)}
                                              disabled={activeTool !== 'text' || !!row.isCancelled}
                                              placeholder={activeTool === 'text' ? "Medicine..." : ""}
                                              className={`text-sm font-bold text-gray-900 text-left print:hidden whitespace-normal ${activeTool === 'text' ? 'z-20 cursor-text' : 'z-0'}`}
                                            />
                                            <div className="hidden print:block text-sm font-bold text-gray-900 text-left whitespace-normal break-words">{row.medicine}</div>
                                          </div>
                                        ) : (
                                          <div className="text-sm font-bold text-gray-900 text-left whitespace-normal break-words">{row.medicine}</div>
                                        )}
                                    </div>
                                    <div className="relative flex items-start justify-center py-1">
                                        <PrintableTextarea 
                                            className={`text-xs text-gray-700 text-center ${activeTool === 'text' ? 'z-20 cursor-text' : 'z-0'}`}
                                            placeholder={activeTool === 'text' ? "--" : ""}
                                            value={row.dose}
                                            onChange={(e: any) => handleRowChange(i, "dose", e.target.value)}
                                            disabled={activeTool !== 'text' || !!row.isCancelled}
                                            readOnly={isPreviewMode}
                                        />
                                    </div>
                                    <div className="relative flex items-start justify-center py-1">
                                        <PrintableTextarea 
                                            className={`text-xs text-gray-700 text-center ${activeTool === 'text' ? 'z-20 cursor-text' : 'z-0'}`}
                                            placeholder={activeTool === 'text' ? "--" : ""}
                                            value={row.intake}
                                            onChange={(e: any) => handleRowChange(i, "intake", e.target.value)}
                                            disabled={activeTool !== 'text' || !!row.isCancelled}
                                            readOnly={isPreviewMode}
                                        />
                                    </div>
                                    <div className="relative flex items-start justify-center py-1">
                                        <PrintableTextarea 
                                            className={`text-xs text-gray-700 text-center ${activeTool === 'text' ? 'z-20 cursor-text' : 'z-0'}`}
                                            placeholder={activeTool === 'text' ? "--" : ""}
                                            value={row.timing}
                                            onChange={(e: any) => handleRowChange(i, "timing", e.target.value)}
                                            disabled={activeTool !== 'text' || !!row.isCancelled}
                                            readOnly={isPreviewMode}
                                        />
                                    </div>
                                    <div className="relative flex items-start justify-center py-1">
                                        <PrintableTextarea 
                                            className={`text-xs text-gray-700 text-center ${activeTool === 'text' ? 'z-20 cursor-text' : 'z-0'}`}
                                            placeholder={activeTool === 'text' ? "--" : ""}
                                            value={row.duration}
                                            onChange={(e: any) => handleRowChange(i, "duration", e.target.value)}
                                            disabled={activeTool !== 'text' || !!row.isCancelled}
                                            readOnly={isPreviewMode}
                                        />
                                    </div>
                                    <div className={`flex items-start justify-center gap-1 print:hidden relative z-20 py-1 ${isPreviewMode ? 'invisible' : ''}`}>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 text-orange-500 hover:text-orange-700"
                                            onClick={() => toggleRowCancel(i)}
                                            title={row.isCancelled ? 'Restore medicine' : 'Cancel medicine'}
                                        >
                                            {row.isCancelled ? <RotateCcw className="w-3 h-3" /> : <X className="w-3 h-3" />}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 text-red-500 hover:text-red-700"
                                            onClick={() => deleteRow(i)}
                                            title="Delete row"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </Button>
                                    </div>
                                </div>
                              );
                            })}
                        </div>

          {/* Footer */}
                <div className="w-full border-b border-green-800 mb-0.5"></div>
                <div className="w-full border-b border-green-800 mb-2"></div>
                
           <footer className="footer-tabular border-t-3 border-[#4CAF50] border-double pt-4 px-7 text-right mt-auto ">
            <hr className="w-1/4 ml-auto mb-2 border-gray-800" />
            <p className="text-sm font-bold mb-0 pointer-events-auto">Dr. {doctor.name} (Signature)</p>
            <p className="text-xs text-gray-500 mb-0 pointer-events-auto">
              Email: {doctor.email} | Phone: {doctor.phone}
            </p>
          </footer>
        </div>
          
            {/* LAYER 2: HTML5 CANVAS OVERLAY */}
            <canvas
              ref={canvasRef}
              width={PAPER_WIDTH}
              height={contentHeight}
              className={`absolute inset-0 ${activeTool === 'text' ? 'pointer-events-none' : 'cursor-crosshair'} touch-none`}
              style={{
                zIndex: activeTool === 'text' ? 0 : 10,
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

        </div>
    </div>
  );
};

export default TemplateTwentyThree;
