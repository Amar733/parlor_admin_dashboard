import React from "react";
import { Button } from "@/components/ui/button";
import { RotateCcw, X, Trash2 } from "lucide-react";
import MedicineSearchDropdown from "@/components/MedicineSearchDropdown";
import { PrescriptionTemplateProps } from "./types";
import { PrintableInput, PrintableTextarea } from "./shared-components";

const TemplateTwelfth: React.FC<PrescriptionTemplateProps> = ({
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

       {/* Prescription Pad Content */}
<div id="prescription-pad-content" className="relative flex flex-col min-h-[1123px] p-8 pointer-events-none z-0"
   style={{ fontFamily: fontStyle, color: textColor, transform: `scale(${fontSize / 100})`, transformOrigin: 'top left', width: `${100 / (fontSize / 100)}%` }}
>
  
  {/* Header */}
  
<header className="bg-purple-300 border-b-4 border-teal-600 pb-8 mb-7 pointer-events-auto text-white pl-8 md:pl-12 lg:pl-16 pt-8 pr-8 md:pr-12 lg:pr-16 " 
             style={{ borderBottom: `4px solid transparent`, borderImage: `${headerColor} 1` }}
>
  <div className="flex items-center gap-4 ">
    {/* Logo */}
      <div className="w-16 h-16 flex items-center justify-center text-white font-bold text-xl overflow-hidden" 
      style={{ background: logoShape === "none" ? "transparent" : headerColor, borderRadius: logoShape === "circle" ? "50%" : logoShape === "square" ? "0.5rem" : "0" }}
      >
                        {doctor.logoUrl ? (
                            <img src={getImageUrl(doctor.logoUrl)} alt="Clinic Logo" className="w-full h-full object-cover" />
                        ) : (
                            'Rx'
                        )}
      </div>
  
    <div>
      <h4 className="text-xl font-bold mb-0 uppercase" style={headerColor.includes('gradient') ? { backgroundImage: headerColor, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' } : { color: headerColor }}>{doctor.name}, {doctor.degree}</h4>
      <p className="text-xs-1 mb-1 opacity-90 p-1">{doctor.speciality} | Reg No: <strong>{doctor.regNo}</strong></p>
      <p className="text-xs-1 mb-0 opacity-90 p-0.5">{doctor.address}</p>
      <h1 className="text-2xl font-bold uppercase tracking-wider">{doctor.clinicName}</h1>
      <p className="text-xs-1 opacity-90 p-1"><strong>Email:</strong> {doctor.email} | <strong>Phone:</strong> {doctor.phone}</p>
    </div>
  </div>
</header>


  {/* Patient Info Grid */}
  <section className="grid grid-cols-3 gap-y-2 gap-x-4 text-sm border-b border-gray-200 pb-4 mb-4 pointer-events-auto bg-gray-99">
    <div className="flex items-center gap-2">
      <strong className="text-gray-700">Sr. No.:</strong>
      <span className="">{prescriptions && prescriptions.length > 0 ? prescriptions.length + 1 : "1"}</span>
    </div>
    <div className="flex items-center gap-2">
      <strong className="text-gray-700">Date:</strong>
      <PrintableInput 
        type="date"
        className="bg-transparent border-none outline-none  p-0 h-auto hover:bg-gray-400"
        value={patient.date}
        onChange={(e: any) => handlePatientChange("date", e.target.value)}
        readOnly={isPreviewMode}
      />
    </div>
    <div className="flex items-center gap-2">
      <strong className="text-gray-700">Dr. Name:</strong>
      <span className="">{doctor.name}</span>
    </div>

    <div className="flex items-center gap-2 col-span-1">
      <strong className="text-gray-700">Patient Name:</strong>
      <PrintableInput 
        className="flex-1 bg-transparent border-b border-gray-300 focus:border-teal-500 outline-none px-1 "
        value={patient.name}
        onChange={(e: any) => handlePatientChange("name", e.target.value)}
        placeholder="Enter Name"
        readOnly={isPreviewMode}
      />
    </div>
    <div className="flex items-center gap-2">
      <strong className="text-gray-700">Age/Sex:</strong>
      <div className="flex gap-1 items-center">
        <PrintableInput 
          className="w-12 bg-transparent border-b border-gray-300 focus:border-teal-500 outline-none px-1 text-center"
          value={patient.age}
          onChange={(e: any) => handlePatientChange("age", e.target.value)}
          placeholder="Age"
          readOnly={isPreviewMode}
        />
        <span>/</span>
        <PrintableInput 
          className="w-16 bg-transparent border-b border-gray-300 focus:border-teal-500 outline-none px-1 text-center"
          value={patient.sex}
          onChange={(e: any) => handlePatientChange("sex", e.target.value)}
          placeholder="Sex"
          readOnly={isPreviewMode}
        />
      </div>
    </div>
    <div className="flex items-center gap-2">
      <strong className="text-gray-700">Dr. Room No.:</strong>
      <PrintableInput 
        className="w-16 bg-transparent border-b border-gray-300 focus:border-teal-500 outline-none px-1 text-center"
        value={patient.roomNo}
        onChange={(e: any) => handlePatientChange("roomNo", e.target.value)}
        placeholder="Room No"
        readOnly={isPreviewMode}
      />
    </div>

    <div className="flex items-center gap-2 col-span-1">
      <strong className="text-gray-700">Contact No.:</strong>
      <PrintableInput 
        className="flex-1 bg-transparent border-b border-gray-300 focus:border-teal-500 outline-none px-1 "
        value={patient.contact}
        onChange={(e: any) => handlePatientChange("contact", e.target.value)}
        placeholder="+91..."
        readOnly={isPreviewMode}
      />
    </div>
    <div className="flex items-center gap-2 col-span-2">
      <strong className="text-gray-700">Address:</strong>
      <PrintableInput 
        className="flex-1 bg-transparent border-b border-gray-300 focus:border-teal-500 outline-none px-1 "
        value={patient.address}
        onChange={(e: any) => handlePatientChange("address", e.target.value)}
        placeholder="Enter Address"
        readOnly={isPreviewMode}
      />
    </div>
  </section>

  {/* Case Details Section */}
   <div className=" grid grid-cols-2 gap-4 mb-4 pointer-events-auto">
                  {/* Chief Complaints */}
                  <div className="bg-gray-50 border-l-4 border-gray-400 p-2 rounded-r">
                      <div className="text-xs-1 font-bold text-sky-600 uppercase mb-1">Chief Complaints</div>
                      <PrintableTextarea 
                          className="text-sm "
                          minHeight="3rem"
                          value={notes.chiefComplaints}
                          onChange={(e: any) => handleNoteChange("chiefComplaints", e.target.value)}
                          placeholder="Enter complaints..."
                          readOnly={isPreviewMode}
                      />
                  </div>
                  {/* Diagnosis */}
                  <div className="bg-green-50 border-l-4 border-green-500 p-2 rounded-r">
                      <div className="text-xs-1 font-bold text-green-700 uppercase mb-1">Diagnosis</div>
                      <PrintableTextarea 
                          className="text-sm font-bold text-green-900"
                          minHeight="3rem"
                          value={notes.diagnosis}
                          onChange={(e: any) => handleNoteChange("diagnosis", e.target.value)}
                          placeholder="Enter diagnosis..."
                          readOnly={isPreviewMode}
                      />
                  </div>
              </div>
  
              <div className="grid grid-cols-2 gap-4 mb-4 pointer-events-auto">
                  {/* Past History */}
                  <div className="border border-gray-200 rounded p-2">
                      <div className="text-xs-1 font-bold text-purple-500 mb-1">Past History:</div>
                      <PrintableTextarea 
                          className="text-sm "
                          value={notes.pastHistory}
                          onChange={(e: any) => handleNoteChange("pastHistory", e.target.value)}
                          readOnly={isPreviewMode}
                      />
                  </div>
                  {/* Allergies */}
                  <div className="border border-gray-200 rounded p-2">
                      <div className="text-xs-1 font-bold text-purple-500 mb-1">Known Drug Allergy:</div>
                      <PrintableTextarea 
                          className="text-sm "
                          value={notes.allergies}
                          onChange={(e: any) => handleNoteChange("allergies", e.target.value)}
                          readOnly={isPreviewMode}
                      />
                  </div>
              </div>
  
              <div className="grid grid-cols-2 gap-4 mb-4 pointer-events-auto">
                  {/* Doctor's Note */}
                  <div className="border border-gray-200 rounded p-2">
                      <div className="text-xs-1 font-bold text-purple-500 mb-1">Doctor's Note:</div>
                      <PrintableTextarea 
                          className="text-sm "
                          value={notes.doctorNotes}
                          onChange={(e: any) => handleNoteChange("doctorNotes", e.target.value)}
                          readOnly={isPreviewMode}
                      />
                  </div>
                  {/* Investigations */}
                  <div className="border border-gray-200 rounded p-2">
                      <div className="text-xs-1 font-bold text-purple-500 mb-1">Investigations Advised:</div>
                      <PrintableTextarea 
                          className="text-sm "
                          value={notes.investigations}
                          onChange={(e: any) => handleNoteChange("investigations", e.target.value)}
                          readOnly={isPreviewMode}
                      />
                  </div>
              </div>

  {/* Medications Table */}
  <div className="flex justify-between items-end mb-2 pointer-events-auto">
    <h5 className="text-red-600 font-bold text-base">R  Medications:</h5>
    <Button 
      variant="ghost" 
      size="sm" 
      className={`h-6 text-xs-1 text-teal-600 hover:text-teal-800 print:hidden ${isPreviewMode ? 'opacity-0 pointer-events-none' : ''}`}
      onClick={addRow}
    >
      + Add Row
    </Button>
  </div>
  {/* <div className="border-2 border-dashed border-red-500 p-4 rounded-lg"> */}
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
{/* </div> */}

  {/* Advice & Follow Up */}
  <div className="pointer-events-auto">
    <p className="font-bold text-gray-900 text-sm-1 mt-4">Advice / Follow-up</p>
    <PrintableTextarea 
      className="text-sm-1  mt-2"
      minHeight="3rem"
      value={notes.advice}
      onChange={(e: any) => handleNoteChange("advice", e.target.value)}
      placeholder="Enter advice/follow-up instructions..."
      readOnly={isPreviewMode}
    />
    
    <p className="font-bold text-gray-900 text-sm-1 mt-4">To Review After:</p>
    <PrintableTextarea 
      className="text-sm-1 "
      minHeight="2rem"
      value={notes.followUp}
      onChange={(e: any) => handleNoteChange("followUp", e.target.value)}
      placeholder="Follow up details..."
      readOnly={isPreviewMode}
    />
  </div>

  {/* Footer */}
  
<div className="w-290 -mr-4   border-b-8 border-gray-700 mb-0"></div>
  {/* Existing solid black line */}
 <div className="mt-auto -mr-4 ml-0.5 -mb-8 pt-8 flex flex-col items-end pointer-events-auto bg-purple-100">
  
  <div className="w-48 border-b border-gray-800 mb-2"></div>
  
  <p className="text-sm font-bold text-black mr-4">{doctor.name} (Signature)</p>
  
  <div className="w-full border-t border-gray-200 mt-8 pt-2 text-center">
    <p className="text-xs text-black">This digital prescription is generated by <strong className="text-black">ClinicPro+</strong> software.</p>
  </div>
</div>
 {/* </div> */}


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

export default TemplateTwelfth;
