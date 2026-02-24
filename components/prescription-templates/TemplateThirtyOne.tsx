import React from "react";
import { Button } from "@/components/ui/button";
import { RotateCcw, X, Trash2 } from "lucide-react";
import MedicineSearchDropdown from "@/components/MedicineSearchDropdown";
import { PrescriptionTemplateProps } from "./types";
import { PrintableInput, PrintableTextarea } from "./shared-components";

const TemplateThirtyOne: React.FC<PrescriptionTemplateProps> = ({
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
        className="relative bg-white shadow-2xl print:shadow-none overflow-visible print:!transform-none origin-top-left select-none flex-shrink-0"
        style={{ 
          width: PAPER_WIDTH, 
          minHeight: PAPER_HEIGHT,
          height: 'auto',
          transform: `scale(${scale})`
        }}
      >
        {/* Main Container with Sidebar Layout */}
<div id="prescription-pad-content" className="relative flex flex-col min-h-[1123px] p-8 pointer-events-none z-0"
   style={{  fontFamily: fontStyle, color: textColor, transform: `scale(${fontSize / 100})`, transformOrigin: 'top left', width: `${100 / (fontSize / 100)}%` }}

>

        <div className="flex min-h-[1123px]">
          
          {/* Main Content Area (75% width) */}
          <div className="w-[75%] p-8 pointer-events-none z-0">
            
            {/* Header */}
            <header className="border-b-2 border-[#cc0000] pb-4 mb-8"
             style={{borderBottom: `4px solid ${headerColor}`, borderImage: `${headerColor} 1` }}
            >
              <h4 className="text-xl font-bold mb-0"
              style={headerColor.includes('gradient') ? { backgroundImage: headerColor, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' } : { color: headerColor }}
              >{doctor.name}, {doctor.degree}</h4>
              <p className="text-sm mb-1 text-gray-600">
                {doctor.speciality} | Reg No: <strong>{doctor.regNo}</strong>
              </p>
              <p className="text-sm mb-0 text-gray-600">{doctor.address}</p>
            </header>

            {/* Patient Info */}
            <section className="grid grid-cols-3 gap-4 text-sm pb-4 mb-8 border-b  pointer-events-auto">
              <div>
                <span className="text-xs font-bold uppercase text-[#cc0000] mr-2">Sr. No:</span>
                <strong>{prescriptions && prescriptions.length > 0 ? prescriptions.length + 1 : "1"}</strong>
              </div>
              {/* <div  className="grid grid-cols-2">
                <span className="text-xs font-bold uppercase text-[#cc0000] ">Date:</span>
                <PrintableInput 
                  type="date"
                  className=" bg-transparent border-none outline-none  -ml-[39px] mr-[280px] mb-1  hover:bg-gray-400"
                  value={patient.date}
                  onChange={(e: any) => handlePatientChange("date", e.target.value)}
                  readOnly={isPreviewMode}
                />
              </div> */}
              <div className="flex flex-col-2 gap-2">
                       <div className="flex items-center gap-2">
                         <strong className="text-[#cc0000]">Date:</strong>
                       </div>
                       <div className="relative flex items-center">
                         <PrintableInput 
                           type="date"
                           className="bg-transparent border-none outline-none text-gray-900 p-0 h-4 l-1 pr-6 hover:bg-gray-400" // Added right padding
                           value={patient.date}
                           onChange={(e: any) => handlePatientChange("date", e.target.value)}
                           readOnly={isPreviewMode}
                         />
                       </div>
                     </div>

              <div>
                <span className="text-xs font-bold uppercase text-[#cc0000] mr-2">Doctor Room:</span>
                  <PrintableInput 
                          className="w-16 bg-transparent border-b border-gray-300 focus:border-teal-500 outline-none px-1 text-center"
                          value={patient.roomNo}
                          onChange={(e: any) => handlePatientChange("roomNo", e.target.value)}
                          placeholder="Room No"
                          readOnly={isPreviewMode}
                        />
              </div>
              <div className="grid grid-cols-2 mt-2  pointer-events-auto">
                <span className="text-xs font-bold uppercase text-[#cc0000] mr-0">Patient Name:</span>
                {/* <strong>{patient.name}</strong> ({patient.age}  | {patient.gender}) */}
                <div className=" gap-2">
                  <PrintableInput 
                     className="bg-transparent border-b border-transparent hover:border-gray-300 focus:border-gray-400 outline-none text-black inline-block min-w-[150px] px-1 mt-2 -ml-2"
                         value={patient.name}
                         onChange={(e: any) => handlePatientChange("name", e.target.value)}
                         placeholder="Enter Name"
                         readOnly={isPreviewMode}
                     style={{ display: 'inline' }}
                       />

                  <PrintableInput 
                     className="bg-transparent border-b border-transparent hover:border-gray-300 focus:border-gray-400 outline-none text-black w-full px-1 ml-[10px]"
                               value={patient.age}
                               onChange={(e: any) => handlePatientChange("age", e.target.value)}
                               placeholder="Age"
                     readOnly={isPreviewMode}
                             />
                 {/* <span className="text-black ml-[20px]">|</span> */}
                 <PrintableInput 
                     className="bg-transparent border-b border-transparent hover:border-gray-300 focus:border-gray-400 outline-none text-black w-full px-1"
                               value={patient.sex}
                               onChange={(e: any) => handlePatientChange("sex", e.target.value)}
                               placeholder="Sex"
                     readOnly={isPreviewMode}
                      />
                  </div>  
             
              </div>
             
              <div className="grid grid-cols-2 mt-2">
                <span className="text-xs font-bold uppercase text-[#cc0000] mr-2">Contact:</span>
                <PrintableInput 
                  className="bg-transparent border-b border-gray-300 focus:border-[#cc0000] w-[400px]"
                  value={patient.contact}
                  onChange={(e: any) => handlePatientChange("contact", e.target.value)}
                  placeholder="+91..."
                  readOnly={isPreviewMode}
                />
              </div>
            </section>

            {/* Symptoms & Diagnosis Row */}
            <div className="grid grid-cols-2 gap-4 mb-6 pointer-events-auto">
              {/* Chief Complaints */}
              <div>
                <h6 className="text-[#cc0000] font-bold mb-2">Chief Complains</h6>
                <div className="border border-[#cc0000] p-3 rounded bg-[#fffafa]">
                  <PrintableTextarea 
                    className="text-sm w-full bg-transparent border-none outline-none"
                    value={notes.chiefComplaints}
                    onChange={(e: any) => handleNoteChange("chiefComplaints", e.target.value)}
                    placeholder="Enter complaints..."
                    readOnly={isPreviewMode}
                  />
                </div>
              </div>
              
              {/* Diagnosis */}
              <div>
                <h6 className="text-green-600 font-bold mb-2">Diagnosis</h6>
                <div className="border border-green-500 p-3 rounded bg-[#f7fff7]">
                  <PrintableTextarea 
                    className="text-sm font-bold text-green-900 w-full bg-transparent border-none outline-none"
                    value={notes.diagnosis}
                    onChange={(e: any) => handleNoteChange("diagnosis", e.target.value)}
                    placeholder="Enter diagnosis..."
                    readOnly={isPreviewMode}
                  />
                </div>
              </div>
            </div>

            {/* Allergies & Doctor's Note Row */}
            <div className="grid grid-cols-2 gap-4 mb-6 pointer-events-auto">
              {/* Allergies */}
              <div>
                <h6 className="text-[#cc0000] font-bold mb-2">Known Drug Allergy:</h6>
                <div className="border border-red-500 p-3 rounded bg-[#fffafa]">
                  <PrintableTextarea 
                    className="text-sm text-red-900 w-full bg-transparent border-none outline-none"
                    value={notes.allergies}
                    onChange={(e: any) => handleNoteChange("allergies", e.target.value)}
                    readOnly={isPreviewMode}
                  />
                </div>
              </div>
              
              {/* Doctor's Note */}
              <div>
                <h6 className="text-gray-800 font-bold mb-2">Doctor's Note:</h6>
                <div className="border border-[#cc0000] p-3 rounded">
                  <PrintableTextarea 
                    className="text-sm w-full bg-transparent border-none outline-none"
                    value={notes.doctorNotes}
                    onChange={(e: any) => handleNoteChange("doctorNotes", e.target.value)}
                    readOnly={isPreviewMode}
                  />
                </div>
              </div>
            </div>

            {/* Past History & Investigations Row */}
            <div className="grid grid-cols-2 gap-4 mb-8 pointer-events-auto">
              {/* Past History */}
              <div>
                <h6 className="text-gray-800 font-bold mb-2">Past History:</h6>
                <div className="border border-[#cc0000] p-3 rounded">
                  <PrintableTextarea 
                    className="text-sm w-full bg-transparent border-none outline-none"
                    value={notes.pastHistory}
                    onChange={(e: any) => handleNoteChange("pastHistory", e.target.value)}
                    readOnly={isPreviewMode}
                  />
                </div>
              </div>
              
              {/* Investigations */}
              <div>
                <h6 className="text-gray-800 font-bold mb-2">Investigations Advised:</h6>
                <div className="border border-[#cc0000] p-3 rounded">
                  <PrintableTextarea 
                    className="text-sm w-full bg-transparent border-none outline-none"
                    value={notes.investigations}
                    onChange={(e: any) => handleNoteChange("investigations", e.target.value)}
                    readOnly={isPreviewMode}
                  />
                </div>
              </div>
            </div>

            {/* Medications Section */}
            <h5 className="text-gray-800 font-bold border-b border-gray-800 pb-2 mb-4">℞ Medications:</h5>
            <div className="mb-4">
              <div className="flex justify-end mb-2 pointer-events-auto">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={`text-xs text-green-600 hover:text-green-800 print:hidden ${isPreviewMode ? 'opacity-0 pointer-events-none' : ''}`}
                  onClick={addRow}
                >
                  + Add Row
                </Button>
              </div>
              
               <div className="w-full mb-4 pointer-events-auto">
                              <div className="grid grid-cols-[2fr_1fr_1.5fr_1fr_1fr_60px] print:grid-cols-[2fr_1fr_1.5fr_1fr_1fr] bg-teal-50 border-b border-teal-200 text-xs font-bold text-teal-900 p-2"
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
                                  <div key={i} className={`relative grid grid-cols-[2fr_1fr_1.5fr_1fr_1fr_60px] print:grid-cols-[2fr_1fr_1.5fr_1fr_1fr] border-b border-gray-100 p-1 items-start ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'} break-inside-avoid ${row.isCancelled ? 'opacity-70' : ''} ${!hasMedicine ? 'print:hidden' : ''}`}>
                                      {/* Red cancel line overlay */}
                                      {row.isCancelled && (
                                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                                              <hr className="w-full border-t-2 border-red-500" style={{ borderStyle: 'solid' }} />
                                          </div>
                                      )}
                                      
                                      <div className="relative flex items-start justify-center py-1 px-1">
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
           
            </div>

            {/* Advice Section */}
            <div className="mt-8 pointer-events-auto">
              <p className="font-bold text-gray-800 border-b pb-2">Advice / Follow-up:</p>
              <ul className="list-none text-sm mt-2">
                <li className="mb-1">
                  <PrintableTextarea 
                    className="text-sm w-full bg-transparent border-none outline-none"
                    value={notes.advice}
                    onChange={(e: any) => handleNoteChange("advice", e.target.value)}
                    placeholder="Enter advice..."
                    readOnly={isPreviewMode}
                  />
                </li>
              </ul>
              {/* <p className="font-bold mt-4 text-gray-800">
                To Review After:{" "}
                <span className="font-normal">
                  <PrintableInput 
                    className="bg-transparent border-b border-gray-300 focus:border-[#cc0000] outline-none px-1"
                    value={notes.followUp}
                    onChange={(e: any) => handleNoteChange("followUp", e.target.value)}
                    placeholder="Follow up details..."
                    readOnly={isPreviewMode}
                  />
                </span>
              </p> */}
            </div>
          </div>

          {/* Red Sidebar (25% width) */}
          <div className="w-[25%] bg-[#cc0000] text-white p-6 flex flex-col items-center">
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

            
            {/* Clinic Address */}
            <p className="font-bold text-sm mb-2">CLINIC ADDRESS:</p>
            <p className="text-xs text-center mb-6 text-[#ffebec]">
              {doctor.address}
            </p>
            
            {/* Contact Info */}
            <p className="font-bold text-sm mb-2">CONTACT INFO:</p>
            <p className="text-xs text-center mb-6 text-[#ffebec]">
              Email: {doctor.email}<br />Phone: {doctor.phone}
            </p>
            
            {/* Doctor Signature */}
            <p className="font-bold text-sm mt-8">DR. {doctor.name.split(' ').pop()?.toUpperCase()}</p>
          </div>
        </div>

        {/* Footer Signature */}
        <footer className="border-t-2 border-[#cc0000] p-6 text-right">
          <hr className="w-1/4 ml-auto mb-2 border-gray-300" />
          <p className="text-sm font-bold text-gray-800">Dr. {doctor.name} (Signature)</p>
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

export default TemplateThirtyOne;