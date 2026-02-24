import React from "react";
import { Button } from "@/components/ui/button";
import { RotateCcw, X, Trash2 } from "lucide-react";
import MedicineSearchDropdown from "@/components/MedicineSearchDropdown";
import { PrescriptionTemplateProps } from "./types";
import { PrintableInput, PrintableTextarea } from "./shared-components";

const TemplateTwentyFour: React.FC<PrescriptionTemplateProps> = ({
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
  <header className="bg-gray-100 border-t border-b border-blue-900 border-t-0 border-teal-600 py-1  px-6 mb-4 pointer-events-auto text-black md:px-9 lg:px-16" 
             style={{ borderBottom: `4px solid transparent`, borderImage: `${headerColor} 1` }}
  >
  <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
    {/* Logo */}
    {/* <img 
      src={doctor.logoUrl ? getImageUrl(doctor.logoUrl) : 'logo.png'} 
      alt="Clinic Logo" 
      className="w-20 h-20 object-cover md:w-24 md:h-24 rounded-lg border-2 border-black"
    /> */}
    {/* <div></div> */}
    {/* <div></div> */}
    <div></div>
    <div className="flex-1">
      <h4 className="text-xl font-bold mb-0 uppercase" style={headerColor.includes('gradient') ? { backgroundImage: headerColor, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' } : { color: headerColor }}>{doctor.name}, {doctor.degree}</h4>
      <p className="text-sm md:text-base mb-1 opacity-90">{doctor.speciality} | Reg No: <strong className="text-teal-300">{doctor.regNo}</strong></p>
      <p className="text-sm md:text-base mb-2 opacity-90">{doctor.address}</p>
      <h1 className="text-3xl md:text-4xl font-bold uppercase tracking-wider text-teal-200 mb-3">{doctor.clinicName}</h1>
      <p className="text-sm md:text-base opacity-90"><strong className="text-teal-300">Email:</strong> {doctor.email} | <strong className="text-teal-300">Phone:</strong> {doctor.phone}</p>
    </div>
  </div>
</header>

  {/* Patient Info Grid */}
 <section className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm border-b border-gray-200 pb-4 mb-8 pointer-events-auto">
  {/* Sr. No./Date combined - stacked */}
  <div className="flex flex-col ml-4">
    <strong className="text-blue-900">Sr. No./Date:</strong>
    <div className="flex items-center gap-0.5 mt-1">
      <span className="">{prescriptions && prescriptions.length > 0 ? prescriptions.length + 1 : "1"}</span>
      <span className="text-blue-900">/</span>
      <div className="relative flex items-center">
        <PrintableInput 
          type="date"
          className="bg-transparent  border-none outline-none  p-0 h-auto w-full pl-1 pr-6 hover:bg-gray-400"
          value={patient.date}
          onChange={(e: any) => handlePatientChange("date", e.target.value)}
          readOnly={isPreviewMode}
        />
        
      </div>
    </div>
  </div>

  {/* Patient Nam */}
  <div className="flex flex-col ml-14 ">
    <strong className="text-blue-900" >Patient Name:</strong>
    <div className="flex items-center gap-0.5 mt-1">
      <PrintableInput 
        className="flex-1 bg-transparent  border-b border-gray-300 focus:border-teal-500 outline-none  min-w-0 px-0.5 py-0"
        value={patient.name}
        onChange={(e: any) => handlePatientChange("name", e.target.value)}
        placeholder="Enter Name"
        readOnly={isPreviewMode}
      />
    
    
    </div>
  </div>

  {/* (Age/Sex) combined - stacked */}
{/* 
<div className="grid grid-rows-2 items-start gap-4">
  <strong className="text-black text-right mr-16">Age/Sex:</strong>
  <div className="flex items-center gap-1">
    <PrintableInput 
      className="w-12 bg-transparent border-b border-gray-300 focus:border-teal-500 outline-none text-black text-center px-0.5 py-0 ml-16"
      value={patient.age}
      onChange={(e: any) => handlePatientChange("age", e.target.value)}
      placeholder="Age"
      readOnly={isPreviewMode}
    />
    <span className="text-black ml-6">/</span>
    <PrintableInput 
      className="w-16 bg-transparent border-b border-gray-300 focus:border-teal-500 outline-none text-black text-center px-0.5 py-0 -ml-6 "
      value={patient.sex}
      onChange={(e: any) => handlePatientChange("sex", e.target.value)}
      placeholder="Sex"
      readOnly={isPreviewMode}
    />
  </div>
</div> */}

<div className="flex flex-col ml-4">
  {/* Labels on same line */}
  <div className="flex">
    <strong className="text-blue-900">Contact No.:</strong>
    <div className="mx-2">|</div>
    <strong className="text-blue-900">Address</strong>
  </div>
  
  {/* Inputs below */}
  <div className="flex mt-1">
    <PrintableInput 
      className="flex-1 bg-transparent border-b border-gray-300 focus:border-teal-500 outline-none px-1 "
      value={patient.contact}
      onChange={(e: any) => handlePatientChange("contact", e.target.value)}
      placeholder="+91..."
      readOnly={isPreviewMode}
    />
    <div className="mx-1 -ml-[129px]">|</div>
    <PrintableInput 
      className="flex-1 bg-transparent border-b border-gray-300 focus:border-teal-500 outline-none px-1  mr-9"
      value={patient.address}
      onChange={(e: any) => handlePatientChange("address", e.target.value)}
      placeholder="Enter Address"
      readOnly={isPreviewMode}
    />
  </div>
</div>


</section>
  

  {/* Case Details Section */}
   <div className="grid grid-cols-2 gap-4 mb-4 pointer-events-auto">
                  {/* Chief Complaints */}
                  <div className="bg-blue-100 border-l-4 border-blue-400 p-2 rounded-r">
                      <div className="text-xs-1 font-bold text-blue-900 uppercase mb-1">Chief Complaints</div>
                      <PrintableTextarea 
                          className="text-sm-1 "
                          minHeight="3rem"
                          value={notes.chiefComplaints}
                          onChange={(e: any) => handleNoteChange("chiefComplaints", e.target.value)}
                          placeholder="Enter complaints..."
                          readOnly={isPreviewMode}
                      />
                  </div>
                  {/* Diagnosis */}
                  <div className="bg-green-50 border-l-4 border-green-500 p-2 rounded-r">
                      <div className="text-xs font-bold text-blue-900 uppercase mb-1">Diagnosis</div>
                      <PrintableTextarea 
                          className="text-sm font-bold "
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
                  {/* <div className="border border-gray-200 rounded p-2">
                      <div className="text-xs font-bold text-gray-500 mb-1">Past History:</div>
                      <PrintableTextarea 
                          className="text-sm text-gray-700"
                          value={notes.pastHistory}
                          onChange={(e: any) => handleNoteChange("pastHistory", e.target.value)}
                          readOnly={isPreviewMode}
                      />
                  </div> */}
                
              </div>
  
              <div className="grid grid-cols-2 gap-4 mb-4 pointer-events-auto">
                  {/* Doctor's Note */}
                  <div className="border border-gray-200 rounded p-2">
                      <div className="text-xs font-bold text-blue-900 mb-1">Doctor's Note:</div>
                      <PrintableTextarea 
                          className="text-sm "
                          value={notes.doctorNotes}
                          onChange={(e: any) => handleNoteChange("doctorNotes", e.target.value)}
                          readOnly={isPreviewMode}
                      />
                  </div>
                    {/* Allergies */}
                  <div className="border border-gray-200 rounded p-2">
                      <div className="text-xs font-bold text-blue-900 mb-1">Known Drug Allergy:</div>
                      <PrintableTextarea 
                          className="text-sm "
                          value={notes.allergies}
                          onChange={(e: any) => handleNoteChange("allergies", e.target.value)}
                          readOnly={isPreviewMode}
                      />
                  </div>
                
              
              </div>

  {/* Medications Table */}
  <div className="flex justify-between items-end mb-2 pointer-events-auto">
    <h5 className="text-gray-900 font-bold text-base">R  Medications:</h5>
    <Button 
      variant="ghost" 
      size="sm" 
      className={`h-6 text-xs text-teal-600 hover:text-teal-800 print:hidden ${isPreviewMode ? 'opacity-0 pointer-events-none' : ''}`}
      onClick={addRow}
    >
      + Add Row
    </Button>
  </div>
  {/* <div className="border-2 border-dashed border-red-500 p-4 rounded-lg"> */}

  <div className="w-full mb-4 pointer-events-auto border border-black">
  {/* Header row with black borders */}
  <div className="grid grid-cols-[2fr_1fr_1.5fr_1fr_1fr_60px] print:grid-cols-[2fr_1fr_1.5fr_1fr_1fr] bg-teal-50 border-b border-black text-xs-1 font-bold text-teal-900"
     style={{ background: headerColor.includes('gradient') ? headerColor : `${headerColor}20`, borderBottom: `1px solid ${headerColor.includes('gradient') ? 'rgba(0,0,0,0.1)' : headerColor}40`, color: headerColor.includes('gradient') ? '#000' : headerColor }}
  >
    <div className="p-1 border-r border-black">Medicine</div>
    <div className="p-1 border-r border-black">Dose</div>
    <div className="p-1 border-r border-black">Intake Condition</div>
    <div className="p-1 border-r border-black">Timing</div>
    <div className="p-1 border-r border-black">Duration</div>
    <div className={`p-0 text-center print:hidden ${isPreviewMode ? 'opacity-0' : ''}`}>Actions</div>
  </div>
  
  {rows.map((row, i) => {
    const hasMedicine = row.medicine.trim() !== '';
    return (
      <div 
        key={i} 
        className={`relative grid grid-cols-[2fr_1fr_1.5fr_1fr_1fr_60px] print:grid-cols-[2fr_1fr_1.5fr_1fr_1fr] border-b border-black last:border-b-0 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'} break-inside-avoid ${row.isCancelled ? 'opacity-70' : ''} ${!hasMedicine ? 'print:hidden' : ''}`}
      >
        {/* Red cancel line overlay */}
        {row.isCancelled && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <hr className="w-full border-t-2 border-red-500" style={{ borderStyle: 'solid' }} />
          </div>
        )}
        
        {/* Medicine cell */}
        <div className="relative flex items-start justify-center p-1 border-r border-black min-h-[44px]">
          {!isPreviewMode ? (
            <div className="relative w-full">
              <MedicineSearchDropdown
                value={row.medicine}
                onChange={(value) => handleRowChange(i, "medicine", value)}
                disabled={activeTool !== 'text' || !!row.isCancelled}
                placeholder={activeTool === 'text' ? "Medicine..." : ""}
                className={`text-sm font-bold text-gray-900 text-left print:hidden whitespace-normal w-full ${activeTool === 'text' ? 'z-20 cursor-text' : 'z-0'}`}
              />
              <div className="hidden print:block text-sm font-bold text-gray-900 text-left whitespace-normal break-words p-1">{row.medicine}</div>
            </div>
          ) : (
            <div className="text-sm font-bold text-gray-900 text-left whitespace-normal break-words p-1 w-full">{row.medicine}</div>
          )}
        </div>
        
        {/* Dose cell */}
        <div className="relative flex items-start justify-center p-1 border-r border-black min-h-[44px]">
          <PrintableTextarea 
            className={`text-xs text-gray-700 text-center w-full ${activeTool === 'text' ? 'z-20 cursor-text' : 'z-0'}`}
            placeholder={activeTool === 'text' ? "--" : ""}
            value={row.dose}
            onChange={(e: any) => handleRowChange(i, "dose", e.target.value)}
            disabled={activeTool !== 'text' || !!row.isCancelled}
            readOnly={isPreviewMode}
          />
        </div>
        
        {/* Intake Condition cell */}
        <div className="relative flex items-start justify-center p-1 border-r border-black min-h-[44px]">
          <PrintableTextarea 
            className={`text-xs text-gray-700 text-center w-full ${activeTool === 'text' ? 'z-20 cursor-text' : 'z-0'}`}
            placeholder={activeTool === 'text' ? "--" : ""}
            value={row.intake}
            onChange={(e: any) => handleRowChange(i, "intake", e.target.value)}
            disabled={activeTool !== 'text' || !!row.isCancelled}
            readOnly={isPreviewMode}
          />
        </div>
        
        {/* Timing cell */}
        <div className="relative flex items-start justify-center p-1 border-r border-black min-h-[44px]">
          <PrintableTextarea 
            className={`text-xs text-gray-700 text-center w-full ${activeTool === 'text' ? 'z-20 cursor-text' : 'z-0'}`}
            placeholder={activeTool === 'text' ? "--" : ""}
            value={row.timing}
            onChange={(e: any) => handleRowChange(i, "timing", e.target.value)}
            disabled={activeTool !== 'text' || !!row.isCancelled}
            readOnly={isPreviewMode}
          />
        </div>
        
        {/* Duration cell */}
        <div className="relative flex items-start justify-center p-1 border-r border-black min-h-[44px]">
          <PrintableTextarea 
            className={`text-xs text-gray-700 text-center w-full ${activeTool === 'text' ? 'z-20 cursor-text' : 'z-0'}`}
            placeholder={activeTool === 'text' ? "--" : ""}
            value={row.duration}
            onChange={(e: any) => handleRowChange(i, "duration", e.target.value)}
            disabled={activeTool !== 'text' || !!row.isCancelled}
            readOnly={isPreviewMode}
          />
        </div>
        
        {/* Actions cell */}
        <div className={`flex items-start justify-center gap-1 print:hidden relative z-20 p-1 min-h-[44px] ${isPreviewMode ? 'invisible' : ''}`}>
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
    <p className="font-bold text-blue-900 text-sm mt-4">Advice / Follow-up</p>
    <PrintableTextarea 
      className="text-sm  mt-2"
      minHeight="3rem"
      value={notes.advice}
      onChange={(e: any) => handleNoteChange("advice", e.target.value)}
      placeholder="Enter advice/follow-up instructions..."
      readOnly={isPreviewMode}
    />
    
    <p className="font-bold text-blue-900 text-sm mt-4">To Review After:</p>
    <PrintableTextarea 
      className="text-sm "
      minHeight="2rem"
      value={notes.followUp}
      onChange={(e: any) => handleNoteChange("followUp", e.target.value)}
      placeholder="Follow up details..."
      readOnly={isPreviewMode}
    />
  </div>

  {/* Footer */}
  <div className="w-full border-b-4  border-blue-900 mb-0">

  </div>

 <div className="mt-auto pt-8 flex flex-col items-end pointer-events-auto bg-gray-100">
  {/* Dotted red line at the very start - darker red */}
  
  {/* Existing solid black line */}
  <div className="w-48 border-b border-blue-800 mb-2"></div>
  
  <p className="text-sm font-bold text-blue-900 mr-3">{doctor.name} (Signature)</p>
  
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

export default TemplateTwentyFour;
