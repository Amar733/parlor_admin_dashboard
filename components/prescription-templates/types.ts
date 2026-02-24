import { RefObject } from "react";

export interface DoctorSettings {
  name: string;
  degree: string;
  speciality: string;
  regNo: string;
  clinicName: string;
  address: string;
  phone: string;
  email: string;
  logoUrl?: string;
  templateTheme?: string;
  signatureUrl?: string;
}

export interface PatientDetails {
  name: string;
  age: string;
  sex: string;
  date: string;
  weight: string;
  bp: string;
  contact: string;
  address: string;
  room?: string;
}

export interface PrescriptionRow {
  medicine: string;
  dose: string;
  intake: string;
  timing: string;
  duration: string;
  isCancelled?: boolean;
}

export interface ClinicalNotes {
  chiefComplaints: string;
  diagnosis: string;
  pastHistory: string;
  allergies: string;
  doctorNotes: string;
  investigations: string;
  advice: string;
  followUp: string;
}

export interface PrescriptionTemplateProps {
  doctor: DoctorSettings;
  patient: PatientDetails;
  notes: ClinicalNotes;
  rows: PrescriptionRow[];
  prescriptions: any[]; // For future history features inside template if needed
  
  // State Handlers
  handlePatientChange: (field: keyof PatientDetails, value: string) => void;
  handleNoteChange: (field: keyof ClinicalNotes, value: string) => void;
  handleRowChange: (index: number, field: keyof PrescriptionRow, value: string) => void;
  toggleRowCancel: (index: number) => void;
  deleteRow: (index: number) => void;
  addRow: () => void;
  
  // Canvas / Drawing Props
  canvasRef: RefObject<HTMLCanvasElement>;
  activeTool: "pen" | "eraser" | "text" | "rectangle" | "circle" | "line" | "triangle" | "arrow" | "star";
  startDrawing: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  draw: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  stopDrawing: () => void;
  startDrawingTouch: (e: React.TouchEvent<HTMLCanvasElement>) => void;
  drawTouch: (e: React.TouchEvent<HTMLCanvasElement>) => void;

  // Print/View State
  scale: number;
  contentHeight: number;
  padRef: RefObject<HTMLDivElement>;
  isPreviewMode: boolean;
  
  // Helpers
  getImageUrl: (url: string) => string;
  
  // Prescription Settings
  prescriptionSettings?: {
    headerColor: string;
    logoShape: "circle" | "square" | "none";
    fontStyle: string;
    fontSize: number;
    textColor: string;
  };
  
  // Optional: For static rendering in print view
  staticCanvasImage?: string;
}
