import React from "react";
import { Button } from "@/components/ui/button";
import { RotateCcw, X, Trash2 } from "lucide-react";
import MedicineSearchDropdown from "@/components/MedicineSearchDropdown";
import { PrescriptionTemplateProps } from "./types";
import { PrintableInput, PrintableTextarea } from "./shared-components";

const TemplateThirtyTwo: React.FC<PrescriptionTemplateProps> = ({
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
        <div id="prescription-pad-content" className="relative flex flex-col min-h-[1123px] p-0 pointer-events-none z-0"
         style={{  fontFamily: fontStyle, color: textColor, transform: `scale(${fontSize / 100})`, transformOrigin: 'top left', width: `${100 / (fontSize / 100)}%` }}
         >
          
          {/* Header */}
          <header className="grid  bg-white text-gray-800 text-center pt-8 pb-4 px-10 relative "
             style={{borderBottom: `4px solid ${headerColor}`, borderImage: `${headerColor} 1` }}
          
          >
            {/* Logo */}
           <div className="w-16 h-16 flex items-center justify-center text-white font-bold text-xl overflow-hidden ml-auto" 
           style={{ background: logoShape === "none" ? "transparent" : headerColor, borderRadius: logoShape === "circle" ? "50%" : logoShape === "square" ? "0.5rem" : "0" }}
           >
                        {doctor.logoUrl ? (
                            <img src={getImageUrl(doctor.logoUrl)} alt="Clinic Logo" className="w-full h-full object-cover" />
                        ) : (
                            'Rx'
                        )}
         </div>

            
            <h4 className="text-xl font-bold mb-0 uppercase"
           style={headerColor.includes('gradient') ? { backgroundImage: headerColor, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' } : { color: headerColor }}
            >{doctor.name}, {doctor.degree}</h4>
            <p className="text-sm mb-1">{doctor.speciality} | Reg No: <strong>{doctor.regNo}</strong></p>
            <p className="text-sm mb-0">{doctor.address} | Phone: {doctor.phone}</p>
          </header>
          <div className="accent-bar-bottom h-1 bg-yellow-400 w-full"></div>

          {/* Patient Info Strip */}
        
          <section className="border border-gray-300 mx-8 md:mx-12 lg:mx-16 my-6 pointer-events-auto">
            {/* First Row */}
            {/* First Row */}
              <div className="grid grid-cols-2 border-b border-gray-300">
                <div className="px-4 py-2 border-r border-gray-300">
                  <span className="text-xs-1 font-bold uppercase text-[#cc5500] mr-2">Sr. No:</span>
                  <strong>{prescriptions && prescriptions.length > 0 ? prescriptions.length + 1 : "1"}</strong>
                </div>
                <div className="grid grid-cols-2 px-4 py-2">
                  <span className="text-xs-1 font-bold uppercase text-[#cc5500] mr-0">Date:</span>
                  <PrintableInput 
                    type="date"
                    className="bg-transparent border-none outline-none text-black p-0 h-auto w-full max-w-[200px] inline-block  -ml-[90px] hover:bg-gray-400"
                    value={patient.date}
                    onChange={(e: any) => handlePatientChange("date", e.target.value)}
                    readOnly={isPreviewMode}
                    style={{ display: 'inline' }}
                  />
                </div>
              </div>  
         
            
            {/* Second Row */}
            <div className="grid grid-cols-2 border-b border-gray-300">
              <div className="grid grid-cols-2 px-4 py-2 border-r border-gray-300">
                <span className="text-xs-1 font-bold uppercase text-[#cc5500] mr-2 mt-2">Patient Name:</span>
                <PrintableInput 
                  className="bg-transparent border-b border-transparent hover:border-gray-300 focus:border-gray-400 outline-none text-black inline-block min-w-[150px] px-1 mt-2 -ml-2"
                  value={patient.name}
                  onChange={(e: any) => handlePatientChange("name", e.target.value)}
                  placeholder="Enter Name"
                  readOnly={isPreviewMode}
                  style={{ display: 'inline' }}
                />
              </div>
              <div className="grid grid-cols-2 px-4 py-2">
                <span className="text-xs-1 font-bold uppercase text-[#cc5500] mr-2">Age / Sex:</span>
                <div className="inline-flex gap-2">
                  <PrintableInput 
                    className="bg-transparent border-b border-transparent hover:border-gray-300 focus:border-gray-400 outline-none text-black w-12 px-1 -ml-[50px]"
                    value={patient.age}
                    onChange={(e: any) => handlePatientChange("age", e.target.value)}
                    placeholder="Age"
                    readOnly={isPreviewMode}
                  />
                  <span className="text-black -ml-[140px]">/</span>
                  <PrintableInput 
                    className="bg-transparent border-b border-transparent hover:border-gray-300 focus:border-gray-400 outline-none text-black w-16 px-1"
                    value={patient.sex}
                    onChange={(e: any) => handlePatientChange("sex", e.target.value)}
                    placeholder="Sex"
                    readOnly={isPreviewMode}
                  />
                </div>
              </div>
            </div>
            
            {/* Third Row - Full width */}
            {/* <div className="grid grid-cols-2 px-4 py-2">
              <span className="text-xs font-bold uppercase text-[#cc5500] mr-2">Address / Contact:</span>
              <div className="grid grid-cols-3 inline-flex gap-2 flex-wrap">
                <PrintableInput 
                  className="bg-transparent border-b border-transparent hover:border-gray-300 focus:border-gray-400 outline-none text-black min-w-[200px] px-1 -ml-[159px] mb-1"
                  value={patient.address}
                  onChange={(e: any) => handlePatientChange("address", e.target.value)}
                  placeholder="Enter Address"
                  readOnly={isPreviewMode}
                />
                <span className="text-sm-1 text-black -ml-[47px]">||</span>
                <PrintableInput 
                  className="bg-transparent border-b border-transparent hover:border-gray-300 focus:border-gray-400 outline-none text-black min-w-[120px] px-1 -ml-[140px] mb-1"
                  value={patient.contact}
                  onChange={(e: any) => handlePatientChange("contact", e.target.value)}
                  placeholder="+91..."
                  readOnly={isPreviewMode}
                />
              </div>
            </div> */}
          </section>

        

          {/* Content Sections */}
          <div className="content-section px-10 py-6 pointer-events-auto">
            {/* Chief Complaints & Diagnosis */}
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <h6 className="text-dark font-bold mb-2">Chief Complains</h6>
                <div className="info-box-mono border border-gray-800 p-3 rounded-none">
                  <PrintableTextarea 
                    className="text-sm w-full border-none outline-none bg-transparent"
                    value={notes.chiefComplaints}
                    onChange={(e: any) => handleNoteChange("chiefComplaints", e.target.value)}
                    placeholder="Enter complaints..."
                    readOnly={isPreviewMode}
                  />
                </div>
              </div>
              <div>
                <h6 className="text-green-700 font-bold mb-2">Diagnosis</h6>
                <div className="info-box-mono border border-green-700 p-3 rounded-none">
                  <PrintableTextarea 
                    className="text-sm w-full border-none outline-none bg-transparent font-bold text-green-900"
                    value={notes.diagnosis}
                    onChange={(e: any) => handleNoteChange("diagnosis", e.target.value)}
                    placeholder="Enter diagnosis..."
                    readOnly={isPreviewMode}
                  />
                </div>
              </div>
            </div>

            {/* Allergies & Doctor's Note */}
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <h6 className="text-red-600 font-bold mb-2">Known Drug Allergy:</h6>
                <div className="info-box-mono border border-red-600 p-3 rounded-none">
                  <PrintableTextarea 
                    className="text-sm w-full border-none outline-none bg-transparent text-red-900"
                    value={notes.allergies}
                    onChange={(e: any) => handleNoteChange("allergies", e.target.value)}
                    placeholder="Enter allergies..."
                    readOnly={isPreviewMode}
                  />
                </div>
              </div>
              <div>
                <h6 className="text-dark font-bold mb-2">Doctor's Note:</h6>
                <div className="info-box-mono border border-gray-800 p-3 rounded-none">
                  <PrintableTextarea 
                    className="text-sm w-full border-none outline-none bg-transparent"
                    value={notes.doctorNotes}
                    onChange={(e: any) => handleNoteChange("doctorNotes", e.target.value)}
                    placeholder="Enter notes..."
                    readOnly={isPreviewMode}
                  />
                </div>
              </div>
            </div>

            {/* Past History & Investigations */}
            {/* <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <h6 className="text-dark font-bold mb-2">Past History:</h6>
                <div className="info-box-mono border border-gray-800 p-3 rounded-none">
                  <PrintableTextarea 
                    className="text-sm w-full border-none outline-none bg-transparent"
                    value={notes.pastHistory}
                    onChange={(e: any) => handleNoteChange("pastHistory", e.target.value)}
                    placeholder="Enter past history..."
                    readOnly={isPreviewMode}
                  />
                </div>
              </div>
              <div>
                <h6 className="text-dark font-bold mb-2">Investigations Advised:</h6>
                <div className="info-box-mono border border-gray-800 p-3 rounded-none">
                  <PrintableTextarea 
                    className="text-sm w-full border-none outline-none bg-transparent"
                    value={notes.investigations}
                    onChange={(e: any) => handleNoteChange("investigations", e.target.value)}
                    placeholder="Enter investigations..."
                    readOnly={isPreviewMode}
                  />
                </div>
              </div>
            </div> */}

            {/* Medications Table */}
            <div className="flex justify-between items-end mb-2">
              <h5 className="text-dark border-b border-gray-800 py-2 font-bold">℞ Medications:</h5>
              <Button 
                variant="ghost" 
                size="sm" 
                className={`h-6 text-xs text-blue-600 hover:text-blue-800 print:hidden ${isPreviewMode ? 'opacity-0 pointer-events-none' : ''}`}
                onClick={addRow}
              >
                + Add Row
              </Button>
            </div>
            
            <div className="w-full mb-6">
              <div className="grid grid-cols-[2fr_1fr_1.5fr_1fr_1fr_60px] print:grid-cols-[2fr_1fr_1.5fr_1fr_1fr] bg-gray-900 text-white text-xs font-bold p-2"
                   style={{ background: headerColor.includes('gradient') ? headerColor : `${headerColor}20`, borderBottom: `1px solid ${headerColor.includes('gradient') ? 'rgba(0,0,0,0.1)' : headerColor}40`, color: headerColor.includes('gradient') ? '#000' : headerColor }}
              >
                <div>Medicine</div>
                <div>Dose</div>
                <div>Intake Condition</div>
                <div>Timing</div>
                <div>Duration</div>
                <div className={`text-center print:hidden ${isPreviewMode ? 'opacity-0' : ''}`}>Actions</div>
              </div>
              
              {rows.map((row, i) => {
                const hasMedicine = row.medicine.trim() !== '';
                return (
                  <div key={i} className={`relative grid grid-cols-[2fr_1fr_1.5fr_1fr_1fr_60px] print:grid-cols-[2fr_1fr_1.5fr_1fr_1fr] border-b border-gray-200 p-2 items-center ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'} break-inside-avoid ${row.isCancelled ? 'opacity-70' : ''} ${!hasMedicine ? 'print:hidden' : ''}`}>
                    {row.isCancelled && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                        <hr className="w-full border-t-2 border-red-500" />
                      </div>
                    )}
                    
                    {/* Medicine */}
                    <div className="relative py-1">
                      {!isPreviewMode ? (
                        <div className="relative">
                          <MedicineSearchDropdown
                            value={row.medicine}
                            onChange={(value) => handleRowChange(i, "medicine", value)}
                            disabled={activeTool !== 'text' || !!row.isCancelled}
                            placeholder={activeTool === 'text' ? "Medicine..." : ""}
                            className={`text-sm font-bold text-gray-900 ${activeTool === 'text' ? 'z-20 cursor-text' : 'z-0'}`}
                          />
                          <div className="hidden print:block text-sm font-bold text-gray-900">{row.medicine}</div>
                        </div>
                      ) : (
                        <div className="text-sm font-bold text-gray-900">{row.medicine}</div>
                      )}
                    </div>
                    
                    {/* Dose */}
                    <div className="relative py-1">
                      <PrintableInput 
                        className={`text-xs w-full text-center border-none outline-none ${activeTool === 'text' ? 'z-20 cursor-text' : 'z-0'}`}
                        placeholder={activeTool === 'text' ? "--" : ""}
                        value={row.dose}
                        onChange={(e: any) => handleRowChange(i, "dose", e.target.value)}
                        disabled={activeTool !== 'text' || !!row.isCancelled}
                        readOnly={isPreviewMode}
                      />
                    </div>
                    
                    {/* Intake Condition */}
                    <div className="relative py-1">
                      <PrintableInput 
                        className={`text-xs w-full text-center border-none outline-none ${activeTool === 'text' ? 'z-20 cursor-text' : 'z-0'}`}
                        placeholder={activeTool === 'text' ? "--" : ""}
                        value={row.intake}
                        onChange={(e: any) => handleRowChange(i, "intake", e.target.value)}
                        disabled={activeTool !== 'text' || !!row.isCancelled}
                        readOnly={isPreviewMode}
                      />
                    </div>
                    
                    {/* Timing */}
                    <div className="relative py-1">
                      <PrintableInput 
                        className={`text-xs w-full text-center border-none outline-none ${activeTool === 'text' ? 'z-20 cursor-text' : 'z-0'}`}
                        placeholder={activeTool === 'text' ? "--" : ""}
                        value={row.timing}
                        onChange={(e: any) => handleRowChange(i, "timing", e.target.value)}
                        disabled={activeTool !== 'text' || !!row.isCancelled}
                        readOnly={isPreviewMode}
                      />
                    </div>
                    
                    {/* Duration */}
                    <div className="relative py-1">
                      <PrintableInput 
                        className={`text-xs w-full text-center border-none outline-none ${activeTool === 'text' ? 'z-20 cursor-text' : 'z-0'}`}
                        placeholder={activeTool === 'text' ? "--" : ""}
                        value={row.duration}
                        onChange={(e: any) => handleRowChange(i, "duration", e.target.value)}
                        disabled={activeTool !== 'text' || !!row.isCancelled}
                        readOnly={isPreviewMode}
                      />
                    </div>
                    
                    {/* Actions */}
                    <div className={`flex justify-center gap-1 print:hidden relative z-20 py-1 ${isPreviewMode ? 'invisible' : ''}`}>
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
            

            {/* Advice & Follow Up */}
            {/* <div className="mt-6">
              <h6 className="font-bold text-gray-900 mb-2">Advice / Follow-up</h6>
              <div className="info-box-mono border border-gray-800 p-3 rounded-none mb-4">
                <PrintableTextarea 
                  className="w-full border-none outline-none bg-transparent text-sm"
                  value={notes.advice}
                  onChange={(e: any) => handleNoteChange("advice", e.target.value)}
                  placeholder="Enter advice/follow-up instructions..."
                  readOnly={isPreviewMode}
                />
              </div>
              
              <h6 className="font-bold text-gray-900 mb-2">To Review After:</h6>
              <div className="info-box-mono border border-gray-800 p-3 rounded-none">
                <PrintableTextarea 
                  className="w-full border-none outline-none bg-transparent text-sm"
                  value={notes.followUp}
                  onChange={(e: any) => handleNoteChange("followUp", e.target.value)}
                  placeholder="Follow up details..."
                  readOnly={isPreviewMode}
                />
              </div>
            </div> */}
          </div>

          {/* Footer */}
          <footer className="text-right p-4 px-6 border-t border-gray-300 mt-auto">
            <hr className="w-1/4 ml-auto mb-1 border-gray-800" />
            <p className="text-sm font-bold text-gray-900">{doctor.name} (Signature)</p>
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

export default TemplateThirtyTwo;