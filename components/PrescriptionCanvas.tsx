"use client";

import React, { useRef, useState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { getAssetUrl } from "@/lib/asset-utils";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Eraser, Undo, Pen, Printer, Settings, Type, History, Save, Loader2, Languages, Eye, EyeOff, LayoutTemplate, MessageSquare, Palette, Square, Circle, Minus, Shapes, Triangle, Star, Share2 } from "lucide-react";
import { PrescriptionSettingsDialog } from "@/components/PrescriptionSettingsDialog";
import CanvasPage from "./CanvasPage";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { DoctorSettings, PatientDetails, PrescriptionRow, ClinicalNotes } from "./prescription-templates/types";
// @ts-ignore
import html2pdf from 'html2pdf.js';


const DEFAULT_DOCTOR: DoctorSettings = {
  name: "",
  degree: "",
  speciality: "",
  regNo: "",
  clinicName: "",
  address: "",
  phone: "",
  email: "",
  templateTheme: "default",
  signatureUrl: "",
};

const DEFAULT_PATIENT: PatientDetails = {
  name: "",
  age: "",
  sex: "",
  date: new Date().toISOString().slice(0, 10),
  weight: "",
  bp: "",
  contact: "",
  address: "",
};

const DEFAULT_NOTES: ClinicalNotes = {
  chiefComplaints: "",
  diagnosis: "",
  pastHistory: "",
  allergies: "",
  doctorNotes: "",
  investigations: "",
  advice: "",
  followUp: "",
};

const LINE_COUNT = 4; // Default number of medication rows
// STRICT A4 DIMENSIONS (Do not change unless you intend to change the physical paper size)
const PAPER_WIDTH = 794;  // Equivalent to 210mm at 96 DPI
const PAPER_HEIGHT = 1123; // Equivalent to 297mm at 96 DPI

const EMPTY_ROW: PrescriptionRow = { medicine: "", dose: "", intake: "", timing: "", duration: "" };


import DefaultTemplate from "./prescription-templates/DefaultTemplate";
import ModernTemplate from "./prescription-templates/ModernTemplate";
import MinimalTemplate from "./prescription-templates/MinimalTemplate";
import TemplateOne from "./prescription-templates/TemplateOne";
import TemplateTwo from "./prescription-templates/TemplateTwo";
import TemplateThree from "./prescription-templates/TemplateThree";
import TemplateFour from "./prescription-templates/TemplateFour";
import TemplateFive from "./prescription-templates/TemplateFive";
import TemplateSix from "./prescription-templates/TemplateSix";
import TemplateSeven from "./prescription-templates/TemplateSeven";
import TemplateEight from "./prescription-templates/TemplateEight";
import TemplateNine from "./prescription-templates/TemplateNine";
import TemplateTen from "./prescription-templates/TemplateTen";
import TemplateEleven from "./prescription-templates/TemplateEleven";
import TemplateTwelfth from "./prescription-templates/TemplateTwelfth";
import TemplateThirteen from "./prescription-templates/TemplateThirteen";
import TemplateFourteen from "./prescription-templates/TemplateFourteen";
import TemplateFifteen from "./prescription-templates/TemplateFifteen";
import TemplateSixteen from "./prescription-templates/TemplateSixteen";
import TemplateSeventeen from "./prescription-templates/TemplateSeventeen";
import TemplateEighteen from "./prescription-templates/TemplateEighteen";
import TemplateNineteen from "./prescription-templates/TemplateNineteen";
import TemplateTwenty from "./prescription-templates/TemplateTwenty";
import TemplateTwentyOne from "./prescription-templates/TemplateTwentyOne";
import TemplateTwentyTwo from "./prescription-templates/TemplateTwentyTwo";
import TemplateTwentyThree from "./prescription-templates/TemplateTwentyThree";
import TemplateTwentyFour from "./prescription-templates/TemplateTwentyFour";
import TemplateTwentyFive from "./prescription-templates/TemplateTwentyFive";
import TemplateTwentySix from "./prescription-templates/TemplateTwentySix";
import TemplateTwentySeven from "./prescription-templates/TemplateTwentySeven";
import TemplateTwentyEight from "./prescription-templates/TemplateTwentyEight";
import TemplateTwentyNine from "./prescription-templates/TemplateTwentyNine";
import TemplateThirty from "./prescription-templates/TemplateThirty";
import TemplateThirtyOne from "./prescription-templates/TemplateThirtyOne";
import TemplateThirtyTwo from "./prescription-templates/TemplateThirtyTwo";
import TemplateThirtyThree from "./prescription-templates/TemplateThirtyThree";
import TemplateThirtyFour from "./prescription-templates/TemplateThirtyFour";
import TemplateThirtyFive from "./prescription-templates/TemplateThirtyFive";
import TemplateThirtySix from "./prescription-templates/TemplateThirtySix";
import TemplateThirtySeven from "./prescription-templates/TemplateThirtySeven";
import TemplateThirtyEight from "./prescription-templates/TemplateThirtyEight";
import TemplateThirtyNine from "./prescription-templates/TemplateThirtyNine";
import TemplateFourty from "./prescription-templates/TemplateFourty";
import { PrescriptionTemplateProps } from "./prescription-templates/types";

import {
  TooltipProvider,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";



const PrescriptionTemplateRenderer = ({ theme, ...props }: PrescriptionTemplateProps & { theme: string }) => {
  switch (theme) {
    case 'TemplateFourty': return <TemplateFourty {...props} />;
    case 'TemplateThirtyNine': return <TemplateThirtyNine {...props} />;
    case 'TemplateThirtyEight': return <TemplateThirtyEight {...props} />;
    case 'TemplateThirtySeven': return <TemplateThirtySeven {...props} />;
    case 'TemplateThirtySix': return <TemplateThirtySix {...props} />;
    case 'TemplateThirtyFive': return <TemplateThirtyFive {...props} />;
    case 'TemplateThirtyFour': return <TemplateThirtyFour {...props} />;
    case 'TemplateThirtyThree': return <TemplateThirtyThree {...props} />;
    case 'TemplateThirtyTwo': return <TemplateThirtyTwo {...props} />;
    case 'TemplateThirtyOne': return <TemplateThirtyOne {...props} />;
    case 'TemplateThirty': return <TemplateThirty {...props} />;
    case 'TemplateTwentyNine': return <TemplateTwentyNine {...props} />;
    case 'TemplateTwentyEight': return <TemplateTwentyEight {...props} />;
    case 'TemplateTwentySeven': return <TemplateTwentySeven {...props} />;
    case 'TemplateTwentySix': return <TemplateTwentySix {...props} />;
    case 'TemplateTwentyFive': return <TemplateTwentyFive {...props} />;
    case 'TemplateTwentyFour': return <TemplateTwentyFour {...props} />;
    case 'TemplateTwentyThree': return <TemplateTwentyThree {...props} />;
    case 'TemplateTwentyTwo': return <TemplateTwentyTwo {...props} />;
    case 'TemplateTwentyOne': return <TemplateTwentyOne {...props} />;
    case 'TemplateTwenty': return <TemplateTwenty {...props} />;
    case 'TemplateNineteen': return <TemplateNineteen {...props} />;
    case 'TemplateEighteen': return <TemplateEighteen {...props} />;
    case 'TemplateSeventeen': return <TemplateSeventeen {...props} />;
    case 'TemplateSixteen': return <TemplateSixteen {...props} />;
    case 'TemplateFifteen': return <TemplateFifteen {...props} />;
    case 'TemplateFourteen': return <TemplateFourteen {...props} />;
    case 'TemplateThirteen': return <TemplateThirteen {...props} />;
    case 'TemplateTwelfth': return <TemplateTwelfth {...props} />;
    case 'TemplateEleven': return <TemplateEleven {...props} />;
    case 'TemplateTen': return <TemplateTen {...props} />;
    case 'TemplateNine': return <TemplateNine {...props} />;
    case 'TemplateEight': return <TemplateEight {...props} />;
    case 'TemplateSeven': return <TemplateSeven {...props} />;
    case 'TemplateSix': return <TemplateSix {...props} />;
    case 'TemplateFive': return <TemplateFive {...props} />;
    case 'TemplateFour': return <TemplateFour {...props} />;
    case 'TemplateThree': return <TemplateThree {...props} />;
    case 'TemplateTwo': return <TemplateTwo {...props} />;
    case 'TemplateOne': return <TemplateOne {...props} />;
    case 'modern': return <ModernTemplate {...props} />;
    case 'minimal': return <MinimalTemplate {...props} />;
    default: return <DefaultTemplate {...props} />;
  }
};

interface PrescriptionCanvasProps {
  appointmentId?: string | null;
}

export default function PrescriptionCanvas({ appointmentId }: PrescriptionCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingPageIdRef = useRef<string>("prescription");
  const containerRef = useRef<HTMLDivElement>(null);
  const padRef = useRef<HTMLDivElement>(null);
  const [brushColor, setBrushColor] = useState("#000000");
  const [brushRadius, setBrushRadius] = useState(2);

  // Tools: 'pen' | 'eraser' | 'text' | 'rectangle' | 'circle' | 'line' | 'triangle' | 'arrow' | 'star'
  const [activeTool, setActiveTool] = useState<"pen" | "eraser" | "text" | "rectangle" | "circle" | "line" | "triangle" | "arrow" | "star">("text");
  const [startPoint, setStartPoint] = useState<{ x: number, y: number } | null>(null);
  const [tempCanvas, setTempCanvas] = useState<string>("");

  // Multi-page state
  const [canvasPages, setCanvasPages] = useState<{ id: string; canvasData: string; text: string; }[]>([]);
  const [activeTab, setActiveTab] = useState<string>("prescription");


  const { toast } = useToast();
  const { authFetch, user } = useAuth();

  const [scale, setScale] = useState(1);

  const [doctor, setDoctor] = useState<DoctorSettings>(DEFAULT_DOCTOR);
  const [patient, setPatient] = useState<PatientDetails>(DEFAULT_PATIENT);
  const [notes, setNotes] = useState<ClinicalNotes>(DEFAULT_NOTES);
  const [rows, setRows] = useState<PrescriptionRow[]>([...Array(LINE_COUNT).fill({ ...EMPTY_ROW })]);
  const [templateTheme, setTemplateTheme] = useState<string>("default");

  // Load doctor settings on mount or when user changes
  // Sync template theme when doctor settings change
  useEffect(() => {
    if (doctor.templateTheme) {
      setTemplateTheme(doctor.templateTheme);
    }
  }, [doctor.templateTheme]);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Canvas state
  const [canvasData, setCanvasData] = useState<string>("");
  const [isDrawing, setIsDrawing] = useState(false);
  const [canvasHistory, setCanvasHistory] = useState<string[]>([]);

  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [isLoadingPrescriptions, setIsLoadingPrescriptions] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [appointmentData, setAppointmentData] = useState<any>(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPatientId, setCurrentPatientId] = useState<string | null>(null);
  const [currentPrescriptionId, setCurrentPrescriptionId] = useState<string | null>(null);
  const [isTranslateVisible, setIsTranslateVisible] = useState(false);

  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingSignature, setIsUploadingSignature] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [prescriptionSettings, setPrescriptionSettings] = useState({
    headerColor: "#0d9488",
    logoShape: "circle" as "circle" | "square" | "none",
    fontStyle: "system-ui, -apple-system, sans-serif",
    fontSize: 100,
    textColor: "#000000"
  });

  const [iscribeStatus, setIscribeStatus] = useState<"disconnected" | "connecting" | "connected">("disconnected");

  // Centralized IScribe WebSocket Logic
  useEffect(() => {
    // Only connect if there's at least one additional canvas page
    if (canvasPages.length === 0) {
      setIscribeStatus("disconnected");
      return;
    }

    let ws: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout;

    const connect = () => {
      setIscribeStatus("connecting");
      ws = new WebSocket(`ws://localhost:3001/iScribeSocket`);

      ws.onopen = () => {
        console.log(`[IScribe] Central Connected`);
        setIscribeStatus("connected");
      };

      ws.onmessage = (event) => {
        const data = event.data;
        if (typeof data !== 'string') return;

        const parts = data.split("|");
        if (parts.length >= 4) {
          const t = parseFloat(parts[0]);
          const n = parseFloat(parts[1]);
          const a = parseFloat(parts[2]);
          const c = parseFloat(parts[3]);

          // Always target the current active canvas if it's an additional page
          if (drawingPageIdRef.current !== "prescription" && canvasRef.current) {
            const ctx = canvasRef.current.getContext("2d");
            if (ctx) {
              const innerScaleFactor = 1.7; // As per demo code
              ctx.strokeStyle = "#000000";
              ctx.lineWidth = 2;
              ctx.lineJoin = ctx.lineCap = "round";
              ctx.beginPath();
              ctx.moveTo(t * innerScaleFactor, n * innerScaleFactor);
              ctx.lineTo(a * innerScaleFactor, c * innerScaleFactor);
              ctx.stroke();
            }
          }
        }
      };

      ws.onclose = () => {
        setIscribeStatus("disconnected");
        reconnectTimeout = setTimeout(connect, 3000);
      };

      ws.onerror = () => {
        ws?.close();
      };
    };

    connect();

    return () => {
      if (ws) {
        ws.onclose = null;
        ws.close();
      }
      clearTimeout(reconnectTimeout);
    };
  }, [canvasPages.length]);

  const template_array = [{ name: "default", img: "/templates_asset/classic.png" }, { name: "modern", img: "/templates_asset/modern.png" }, { name: "minimal", img: "/templates_asset/minimal.png" }, { name: "TemplateOne", img: "/templates_asset/1.png" }, { name: "TemplateTwo", img: "/templates_asset/2.png" }, { name: "TemplateThree", img: "/templates_asset/3.png" }, { name: "TemplateFour", img: "/templates_asset/4.png" }, { name: "TemplateFive", img: "/templates_asset/5.png" }, { name: "TemplateSix", img: "/templates_asset/6.png" }, { name: "TemplateSeven", img: "/templates_asset/7.png" }, { name: "TemplateEight", img: "/templates_asset/8.png" }, { name: "TemplateNine", img: "/templates_asset/9.png" }, { name: "TemplateTen", img: "/templates_asset/10.png" }, { name: "TemplateEleven", img: "/templates_asset/11.png" }, { name: "TemplateTwelfth", img: "/templates_asset/12.png" }, { name: "TemplateThirteen", img: "/templates_asset/13.png" }, { name: "TemplateFourteen", img: "/templates_asset/14.png" }
    , { name: "TemplateFifteen", img: "/templates_asset/15.png" }, { name: "TemplateSixteen", img: "/templates_asset/16.png" }, { name: "TemplateSeventeen", img: "/templates_asset/17.png" }, { name: "TemplateEighteen", img: "/templates_asset/18.png" }, { name: "TemplateNineteen", img: "/templates_asset/19.png" }, { name: "TemplateTwenty", img: "/templates_asset/20.png" }, { name: "TemplateTwentyOne", img: "/templates_asset/21.png" }, { name: "TemplateTwentyTwo", img: "/templates_asset/22.png" }, { name: "TemplateTwentyThree", img: "/templates_asset/23.png" }, { name: "TemplateTwentyFour", img: "/templates_asset/24.png" }, { name: "TemplateTwentyFive", img: "/templates_asset/25.png" }, { name: "TemplateTwentySix", img: "/templates_asset/26.png" }, { name: "TemplateTwentySeven", img: "/templates_asset/27.png" }, { name: "TemplateTwentyEight", img: "/templates_asset/28.png" }, { name: "TemplateTwentyNine", img: "/templates_asset/29.png" }, { name: "TemplateThirty", img: "/templates_asset/30.png" }, { name: "TemplateThirtyOne", img: "/templates_asset/31.png" }, { name: "TemplateThirtyTwo", img: "/templates_asset/32.png" }, { name: "TemplateThirtyThree", img: "/templates_asset/33.png" }, { name: "TemplateThirtyFour", img: "/templates_asset/34.png" }, { name: "TemplateThirtyFive", img: "/templates_asset/35.png" }, { name: "TemplateThirtySix", img: "/templates_asset/36.png" }, { name: "TemplateThirtySeven", img: "/templates_asset/37.png" }, { name: "TemplateThirtyEight", img: "/templates_asset/38.png" }, { name: "TemplateThirtyNine", img: "/templates_asset/39.png" }, { name: "TemplateFourty", img: "/templates_asset/40.png" }
  ]
  // Fetch prescription settings on mount
  useEffect(() => {
    const fetchPrescriptionSettings = async () => {
      if (!authFetch) return;
      const doctorId = appointmentData?.doctorId?._id || appointmentData?.doctorId;
      if (!doctorId) return;

      try {
        const response = await authFetch(`/api/prescription-settings?doctor_id=${doctorId}`);
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            setPrescriptionSettings(result.data);
          }
        }
      } catch (error) {
        console.error('Failed to fetch prescription settings:', error);
      }
    };

    fetchPrescriptionSettings();
  }, [authFetch, appointmentData?.doctorId]);

  const getImageUrl = (url: string) => {
    return getAssetUrl(url);
  };

  // Fetch appointment data to get IDs
  const fetchAppointmentData = async (appointmentId: string) => {
    if (!authFetch || dataLoaded) return;
    setIsLoading(true);
    setIsLoadingPrescriptions(true);

    try {
      const [appointmentRes] = await Promise.all([
        authFetch(`/api/appointments/${appointmentId}`)
      ]);

      if (!appointmentRes.ok) throw new Error('Failed to fetch appointment');

      const appointment = await appointmentRes.json();
      setAppointmentData(appointment);

      const patientId = appointment.patientId?._id || appointment.patientId;
      const doctorId = appointment.doctorId?._id || appointment.doctorId;
      setCurrentPatientId(patientId);

      // Fetch all related data in parallel
      const [patientRes, doctorRes, prescriptionsRes, settingsRes] = await Promise.all([
        patientId ? authFetch(`/api/patients/${patientId}`) : Promise.resolve(null),
        doctorId ? authFetch(`/api/doctor-settings/doctor/${doctorId}`) : Promise.resolve(null),
        patientId ? authFetch(`/api/prescriptions/patient/${patientId}`) : Promise.resolve(null),
        doctorId ? authFetch(`/api/prescription-settings?doctor_id=${doctorId}`) : Promise.resolve(null)
      ]);

      // Process patient data
      if (patientRes?.ok) {
        const patientData = await patientRes.json();
        setPatient({
          name: `${patientData.firstName || ''} ${patientData.lastName || ''}`.trim(),
          age: patientData.age?.toString() || '',
          sex: patientData.gender || '',
          date: new Date().toISOString().slice(0, 10),
          weight: '',
          bp: '',
          contact: patientData.contact || '',
          address: patientData.address || '',
        });
      }

      // Process doctor data
      if (doctorRes?.ok) {
        const result = await doctorRes.json();
        if (result.success && result.data) {
          const doctorData = result.data;
          setDoctor({
            name: doctorData.doctorName || '',
            degree: doctorData.degree || '',
            speciality: doctorData.speciality || '',
            regNo: doctorData.regNo || '',
            clinicName: doctorData.clinicName || '',
            address: doctorData.address || '',
            phone: doctorData.phone || '',
            email: doctorData.email || '',
            logoUrl: doctorData.logo || '',
            templateTheme: doctorData.templateTheme || 'default',
            signatureUrl: doctorData.signature || '',
          });
        }
      }

      // Process prescriptions data
      if (prescriptionsRes?.ok) {
        const result = await prescriptionsRes.json();
        if (result.success && result.data) {
          setPrescriptions(result.data);
        }
      }

      // Process prescription settings
      if (settingsRes?.ok) {
        const result = await settingsRes.json();
        if (result.success && result.data) {
          setPrescriptionSettings(result.data);
        }
      }

      setDataLoaded(true);
    } catch (error) {
      console.error('Failed to fetch appointment data:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load appointment data.",
      });
    } finally {
      setIsLoading(false);
      setIsLoadingPrescriptions(false);
    }
  };

  // Fetch prescriptions for patient (can be called independently)
  const fetchPrescriptions = async (patientId: string) => {
    if (!authFetch) return;
    setIsLoadingPrescriptions(true);
    try {
      const response = await authFetch(`/api/prescriptions/patient/${patientId}`);
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setPrescriptions(result.data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch prescriptions:', error);
    } finally {
      setIsLoadingPrescriptions(false);
    }
  };

  // Load Data
  useEffect(() => {
    if (appointmentId && !dataLoaded) {
      fetchAppointmentData(appointmentId);
    }
  }, [appointmentId, dataLoaded]);

  // Auto-load latest prescription if available and none selected
  useEffect(() => {
    if (!currentPrescriptionId && prescriptions.length > 0) {
      // Load the most recent prescription (assuming API returns sorted or just take first)
      loadPrescription(prescriptions[0]);
    }
  }, [prescriptions, currentPrescriptionId]);

  // Responsive Scale Logic - Strictly for visual UI only, does not affect Print/A4 output
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        // Use clientWidth which represents the actual width inside any sidebars/padding
        const containerWidth = containerRef.current.clientWidth;
        const width = window.innerWidth;
        const isDesktop = width >= 1024;

        // 1. Determine space taken by the floating toolbar on desktop
        const toolbarReservedSpace = isDesktop ? 100 : 0;

        // 2. Adjust safety buffer for mobile to maximize space
        const safetyBuffer = width < 768 ? 8 : 40;

        // 3. Available width calculation
        const availableWidth = containerWidth - toolbarReservedSpace - safetyBuffer;

        // 4. Force fit calculation
        let fitScale = availableWidth / PAPER_WIDTH;

        // 5. Readability Protection for Mobile
        // If the scale is too small (less than 0.5), we bump it up slightly 
        // to make sure a doctor can actually see the text they are typing.
        if (width < 768) {
          fitScale = Math.max(fitScale, 0.48);
        }

        // 6. Final clamping (max 100%)
        setScale(Math.min(1, fitScale));
      }
    };

    // Immediate call and a small delay to handle dashboard layout shifts
    handleResize();
    const timeoutId = setTimeout(handleResize, 100);

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(timeoutId);
    };
  }, [currentPatientId]);

  // Dynamic Content Height Logic - Cap at A4
  const [contentHeight, setContentHeight] = useState(PAPER_HEIGHT);

  useEffect(() => {
    if (!padRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        if (entry.target) {
          const height = entry.target.scrollHeight;
          // Cap at PAPER_HEIGHT to fit in one A4 page
          const finalHeight = Math.min(height, PAPER_HEIGHT);

          // Ignore small/zero heights which might occur during transitions/loading
          if (finalHeight > 100 && finalHeight !== contentHeight) {
            console.log('📏 Content Height Update:', {
              scrollHeight: height,
              finalHeight,
              capped: height > PAPER_HEIGHT,
              previousHeight: contentHeight,
              heightInMM: (finalHeight * 0.2645833).toFixed(2) + 'mm'
            });
            setContentHeight(finalHeight);
          }
        }
      }
    });

    resizeObserver.observe(padRef.current);
    return () => resizeObserver.disconnect();
  }, [rows, notes, patient, doctor]);

  // Restore canvas image on resize
  // Restore canvas image on resize or tab switch
  useEffect(() => {
    const restoreCanvas = () => {
      if (!canvasRef.current) return;
      const ctx = canvasRef.current.getContext('2d');
      if (!ctx) return;

      // Clear existing content
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

      let dataToLoad = "";
      if (activeTab === "prescription") {
        dataToLoad = canvasData;
      } else {
        const page = canvasPages.find(p => p.id === activeTab);
        if (page) dataToLoad = page.canvasData;
      }

      if (dataToLoad) {
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0);
        };
        img.src = dataToLoad;
      }
    };

    // Small delay to ensure canvas is ready/mounted
    const timeout = setTimeout(restoreCanvas, 50);
    return () => clearTimeout(timeout);
  }, [contentHeight, activeTab, canvasPages.length]); // Dependencies for canvas restore


  // Canvas functions
  // Canvas functions
  const saveCanvas = () => {
    if (canvasRef.current) {
      const dataURL = canvasRef.current.toDataURL();

      if (activeTab === "prescription") {
        setCanvasData(dataURL);
      } else {
        setCanvasPages(prev => prev.map(p => p.id === activeTab ? { ...p, canvasData: dataURL } : p));
      }

      // Save to history (global history for now - might need per-page history later)
      setCanvasHistory(prev => [...prev, dataURL]);
    }
  };

  const handlePageSwitch = (newPageId: string) => {
    if (newPageId === activeTab) return; // Already valid

    // 1. Save current logic
    if (canvasRef.current) {
      const currentData = canvasRef.current.toDataURL();
      if (activeTab === "prescription") {
        setCanvasData(currentData);
      } else {
        setCanvasPages(prev => prev.map(p => p.id === activeTab ? { ...p, canvasData: currentData } : p));
      }
    }

    // 2. Clear history
    setCanvasHistory([]);

    // 3. Switch
    setActiveTab(newPageId);
    drawingPageIdRef.current = newPageId;
  };

  const addCanvasPage = () => {
    // Save current before adding?
    if (canvasRef.current) {
      const currentData = canvasRef.current.toDataURL();
      if (activeTab === "prescription") {
        setCanvasData(currentData);
      } else {
        setCanvasPages(prev => prev.map(p => p.id === activeTab ? { ...p, canvasData: currentData } : p));
      }
    }

    // Create new page
    const newId = `page-${Date.now()}`;
    const newPage = {
      id: newId,
      canvasData: "",
      text: ""
    };
    setCanvasPages(prev => [...prev, newPage]);

    // Automatically switch to new page and scroll to bottom?
    // Determine user preference. Let's switch focus to it.
    setActiveTab(newId);
    drawingPageIdRef.current = newId;
    setCanvasHistory([]);
  };

  const removeCanvasPage = (e: React.MouseEvent, pageId: string) => {
    e.stopPropagation();
    setCanvasPages(prev => prev.filter(p => p.id !== pageId));
    if (activeTab === pageId) {
      setActiveTab("prescription");
    }
  };

  const handlePageTextChange = (val: string) => {
    setCanvasPages(prev => prev.map(p => p.id === activeTab ? { ...p, text: val } : p));
  };


  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setCanvasData("");
    }
  };

  const undoCanvas = () => {
    if (canvasHistory.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    // Remove the last state from history
    const newHistory = [...canvasHistory];
    newHistory.pop();
    setCanvasHistory(newHistory);

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Restore previous state if exists
    if (newHistory.length > 0) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
      };
      img.src = newHistory[newHistory.length - 1];
      setCanvasData(newHistory[newHistory.length - 1]);
    } else {
      setCanvasData("");
    }
  };



  // Tool handlers
  const handleToolChange = (tool: "pen" | "eraser" | "text" | "rectangle" | "circle" | "line" | "triangle" | "arrow" | "star") => {
    setActiveTool(tool);
  };

  // Drawing functions
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>, pageId: string) => {
    if (activeTool === "text") {
      e.preventDefault();
      return;
    }
    setIsDrawing(true);
    drawingPageIdRef.current = pageId;

    const canvas = e.currentTarget as HTMLCanvasElement;
    canvasRef.current = canvas;

    const ctx = canvas.getContext('2d');
    if (canvas && ctx) {
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) / scale;
      const y = (e.clientY - rect.top) / scale;

      // For shapes, save start point and current canvas state
      if (activeTool === "rectangle" || activeTool === "circle" || activeTool === "line" || activeTool === "triangle" || activeTool === "arrow" || activeTool === "star") {
        setStartPoint({ x, y });
        setTempCanvas(canvas.toDataURL());
      } else {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineWidth = brushRadius;
        ctx.lineCap = 'round';

        if (activeTool === "eraser") {
          ctx.globalCompositeOperation = 'destination-out';
        } else {
          ctx.globalCompositeOperation = 'source-over';
          ctx.strokeStyle = brushColor;
        }
      }
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || activeTool === "text") {
      if (activeTool === "text") e.preventDefault();
      return;
    }

    // Use currentTarget
    const canvas = e.currentTarget as HTMLCanvasElement;
    const ctx = canvas.getContext('2d');

    if (canvas && ctx) {
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) / scale;
      const y = (e.clientY - rect.top) / scale;

      // Draw shapes with preview
      if ((activeTool === "rectangle" || activeTool === "circle" || activeTool === "line" || activeTool === "triangle" || activeTool === "arrow" || activeTool === "star") && startPoint && tempCanvas) {
        // Restore canvas to state before shape drawing started
        const img = new Image();
        img.onload = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);

          ctx.strokeStyle = brushColor;
          ctx.lineWidth = brushRadius;
          ctx.globalCompositeOperation = 'source-over';

          if (activeTool === "rectangle") {
            const width = x - startPoint.x;
            const height = y - startPoint.y;
            ctx.strokeRect(startPoint.x, startPoint.y, width, height);
          } else if (activeTool === "circle") {
            const radius = Math.sqrt(Math.pow(x - startPoint.x, 2) + Math.pow(y - startPoint.y, 2));
            ctx.beginPath();
            ctx.arc(startPoint.x, startPoint.y, radius, 0, 2 * Math.PI);
            ctx.stroke();
          } else if (activeTool === "line") {
            ctx.beginPath();
            ctx.moveTo(startPoint.x, startPoint.y);
            ctx.lineTo(x, y);
            ctx.stroke();
          } else if (activeTool === "triangle") {
            const width = x - startPoint.x;
            const height = y - startPoint.y;
            ctx.beginPath();
            ctx.moveTo(startPoint.x + width / 2, startPoint.y);
            ctx.lineTo(startPoint.x + width, startPoint.y + height);
            ctx.lineTo(startPoint.x, startPoint.y + height);
            ctx.closePath();
            ctx.stroke();
          } else if (activeTool === "arrow") {
            const headlen = 15;
            const angle = Math.atan2(y - startPoint.y, x - startPoint.x);
            ctx.beginPath();
            ctx.moveTo(startPoint.x, startPoint.y);
            ctx.lineTo(x, y);
            ctx.lineTo(x - headlen * Math.cos(angle - Math.PI / 6), y - headlen * Math.sin(angle - Math.PI / 6));
            ctx.moveTo(x, y);
            ctx.lineTo(x - headlen * Math.cos(angle + Math.PI / 6), y - headlen * Math.sin(angle + Math.PI / 6));
            ctx.stroke();
          } else if (activeTool === "star") {
            const radius = Math.sqrt(Math.pow(x - startPoint.x, 2) + Math.pow(y - startPoint.y, 2));
            const spikes = 5;
            const outerRadius = radius;
            const innerRadius = radius / 2;
            ctx.beginPath();
            for (let i = 0; i < spikes * 2; i++) {
              const angle = (i * Math.PI) / spikes - Math.PI / 2;
              const r = i % 2 === 0 ? outerRadius : innerRadius;
              const px = startPoint.x + Math.cos(angle) * r;
              const py = startPoint.y + Math.sin(angle) * r;
              if (i === 0) ctx.moveTo(px, py);
              else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.stroke();
          }
        };
        img.src = tempCanvas;
      } else {
        // Free drawing (pen/eraser)
        ctx.lineTo(x, y);
        ctx.stroke();
      }
    }
  };

  // Touch Event Handlers for Mobile/Tablet
  const startDrawingTouch = (e: React.TouchEvent<HTMLCanvasElement>, pageId: string) => {
    if (activeTool === "text") {
      e.preventDefault();
      return;
    }
    e.preventDefault();
    setIsDrawing(true);
    drawingPageIdRef.current = pageId;

    const canvas = e.currentTarget as HTMLCanvasElement;
    canvasRef.current = canvas;

    const ctx = canvas.getContext('2d');
    if (canvas && ctx && e.touches[0]) {
      const rect = canvas.getBoundingClientRect();
      const x = (e.touches[0].clientX - rect.left) / scale;
      const y = (e.touches[0].clientY - rect.top) / scale;

      if (activeTool === "rectangle" || activeTool === "circle" || activeTool === "line" || activeTool === "triangle" || activeTool === "arrow" || activeTool === "star") {
        setStartPoint({ x, y });
        setTempCanvas(canvas.toDataURL());
      } else {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineWidth = brushRadius;
        ctx.lineCap = 'round';

        if (activeTool === "eraser") {
          ctx.globalCompositeOperation = 'destination-out';
        } else {
          ctx.globalCompositeOperation = 'source-over';
          ctx.strokeStyle = brushColor;
        }
      }
    }
  };

  const drawTouch = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || activeTool === "text" || !e.touches[0]) {
      if (activeTool === "text") e.preventDefault();
      return;
    }
    e.preventDefault();
    const canvas = e.currentTarget as HTMLCanvasElement;
    const ctx = canvas.getContext('2d');
    if (canvas && ctx) {
      const rect = canvas.getBoundingClientRect();
      const x = (e.touches[0].clientX - rect.left) / scale;
      const y = (e.touches[0].clientY - rect.top) / scale;

      if ((activeTool === "rectangle" || activeTool === "circle" || activeTool === "line" || activeTool === "triangle" || activeTool === "arrow" || activeTool === "star") && startPoint && tempCanvas) {
        const img = new Image();
        img.onload = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);

          ctx.strokeStyle = brushColor;
          ctx.lineWidth = brushRadius;
          ctx.globalCompositeOperation = 'source-over';

          if (activeTool === "rectangle") {
            const width = x - startPoint.x;
            const height = y - startPoint.y;
            ctx.strokeRect(startPoint.x, startPoint.y, width, height);
          } else if (activeTool === "circle") {
            const radius = Math.sqrt(Math.pow(x - startPoint.x, 2) + Math.pow(y - startPoint.y, 2));
            ctx.beginPath();
            ctx.arc(startPoint.x, startPoint.y, radius, 0, 2 * Math.PI);
            ctx.stroke();
          } else if (activeTool === "line") {
            ctx.beginPath();
            ctx.moveTo(startPoint.x, startPoint.y);
            ctx.lineTo(x, y);
            ctx.stroke();
          } else if (activeTool === "triangle") {
            const width = x - startPoint.x;
            const height = y - startPoint.y;
            ctx.beginPath();
            ctx.moveTo(startPoint.x + width / 2, startPoint.y);
            ctx.lineTo(startPoint.x + width, startPoint.y + height);
            ctx.lineTo(startPoint.x, startPoint.y + height);
            ctx.closePath();
            ctx.stroke();
          } else if (activeTool === "arrow") {
            const headlen = 15;
            const angle = Math.atan2(y - startPoint.y, x - startPoint.x);
            ctx.beginPath();
            ctx.moveTo(startPoint.x, startPoint.y);
            ctx.lineTo(x, y);
            ctx.lineTo(x - headlen * Math.cos(angle - Math.PI / 6), y - headlen * Math.sin(angle - Math.PI / 6));
            ctx.moveTo(x, y);
            ctx.lineTo(x - headlen * Math.cos(angle + Math.PI / 6), y - headlen * Math.sin(angle + Math.PI / 6));
            ctx.stroke();
          } else if (activeTool === "star") {
            const radius = Math.sqrt(Math.pow(x - startPoint.x, 2) + Math.pow(y - startPoint.y, 2));
            const spikes = 5;
            const outerRadius = radius;
            const innerRadius = radius / 2;
            ctx.beginPath();
            for (let i = 0; i < spikes * 2; i++) {
              const angle = (i * Math.PI) / spikes - Math.PI / 2;
              const r = i % 2 === 0 ? outerRadius : innerRadius;
              const px = startPoint.x + Math.cos(angle) * r;
              const py = startPoint.y + Math.sin(angle) * r;
              if (i === 0) ctx.moveTo(px, py);
              else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.stroke();
          }
        };
        img.src = tempCanvas;
      } else {
        ctx.lineTo(x, y);
        ctx.stroke();
      }
    }
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      setStartPoint(null);
      setTempCanvas("");
      saveCanvas();
    }
  };

  // Input Handlers
  const handleRowChange = (index: number, field: keyof PrescriptionRow, value: string) => {
    const newRows = [...rows];
    newRows[index] = { ...newRows[index], [field]: value };
    setRows(newRows);
  };

  const toggleRowCancel = (index: number) => {
    const row = rows[index];
    const isEmpty = !row.medicine.trim() && !row.dose.trim() && !row.intake.trim() && !row.timing.trim() && !row.duration.trim();

    if (isEmpty) {
      deleteRow(index);
    } else {
      const newRows = [...rows];
      newRows[index] = { ...newRows[index], isCancelled: !newRows[index].isCancelled };
      setRows(newRows);
    }
  };

  const deleteRow = (index: number) => {
    if (rows.length > 1) {
      const newRows = rows.filter((_, i) => i !== index);
      setRows(newRows);
    }
  };

  const addRow = () => {
    setRows([...rows, { ...EMPTY_ROW }]);
  };

  const handlePatientChange = (field: keyof PatientDetails, value: string) => {
    setPatient(prev => ({ ...prev, [field]: value }));
  };

  const handleNoteChange = (field: keyof ClinicalNotes, value: string) => {
    setNotes(prev => ({ ...prev, [field]: value }));
  };

  const savePrescription = async () => {
    if (!currentPatientId || !authFetch) {
      toast({ title: "Patient ID required", variant: "destructive" });
      return;
    }
    if (!patient.name) {
      toast({ title: "Please enter patient name", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      // Get current canvas data from DOM
      const currentCanvasData = canvasRef.current?.toDataURL() || "";

      // Determine what is the 'main' canvas data and what is 'canvasPages' data
      let mainCanvasData = canvasData;
      let upToDateCanvasPages = [...canvasPages];

      if (drawingPageIdRef.current === "prescription") {
        mainCanvasData = currentCanvasData;
      } else {
        upToDateCanvasPages = upToDateCanvasPages.map(p => p.id === drawingPageIdRef.current ? { ...p, canvasData: currentCanvasData } : p);
      }

      const prescriptionData = {
        patientId: currentPatientId,
        doctorId: appointmentData?.doctorId?._id || appointmentData?.doctorId,
        visitDate: new Date().toISOString(),
        patient,
        doctor,
        notes,
        medications: rows.filter(row => row.medicine.trim() !== ""),
        canvasData: mainCanvasData,
        canvasPages: upToDateCanvasPages,
        templateTheme: templateTheme // Save the theme used for this prescription
      };

      // Check if prescription exists for the same date (edit mode)
      const todayDate = new Date().toISOString().slice(0, 10);
      const prescriptionDate = patient.date;
      const existingPrescription = prescriptions.find(p =>
        new Date(p.visitDate).toISOString().slice(0, 10) === prescriptionDate
      );

      let response;
      if (existingPrescription && prescriptionDate === todayDate) {
        // Edit mode - update existing prescription
        response = await authFetch(`/api/prescriptions/${existingPrescription._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(prescriptionData)
        });
      } else {
        // Create mode - new visit
        response = await authFetch('/api/prescriptions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(prescriptionData)
        });
      }

      if (response.ok) {
        const isEdit = existingPrescription && prescriptionDate === todayDate;
        toast({ title: `Prescription ${isEdit ? 'updated' : 'saved'} successfully` });
        currentPatientId && fetchPrescriptions(currentPatientId);
      } else {
        throw new Error('Failed to save prescription');
      }
    } catch (error) {
      toast({
        title: "Error saving prescription",
        variant: "destructive",
        description: (error as Error).message
      });
    } finally {
      setIsSaving(false);
    }
  };

  const loadPrescription = (prescription: any) => {
    setCurrentPrescriptionId(prescription._id);
    if (prescription.patient) {
      setPatient({
        name: prescription.patient.name || '',
        age: prescription.patient.age || '',
        sex: prescription.patient.sex || '',
        date: prescription.visitDate ? new Date(prescription.visitDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
        weight: prescription.patient.weight || '',
        bp: prescription.patient.bp || '',
        contact: prescription.patient.contact || '',
        address: prescription.patient.address || '',
      });
    }
    if (prescription.notes) {
      setNotes(prescription.notes);
    }
    if (prescription.medications) {
      const medicationRows = prescription.medications.map((med: any) => ({
        medicine: med.medicine || '',
        dose: med.dose || '',
        intake: med.intake || '',
        timing: med.timing || '',
        duration: med.duration || '',
      }));
      setRows([...medicationRows, ...Array(Math.max(0, LINE_COUNT - medicationRows.length)).fill({ ...EMPTY_ROW })]);
    }
    if (prescription.canvasData) {
      setCanvasData(prescription.canvasData);
      // If active tab is prescription, draw it immediately. Canvas restoration effect will also handle it but explicit draw is safer if ref exists.
      if (canvasRef.current && activeTab === "prescription") {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          const img = new Image();
          img.onload = () => ctx.drawImage(img, 0, 0);
          img.src = prescription.canvasData;
        }
      }
    } else {
      setCanvasData("");
      if (activeTab === "prescription" && canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }

    if (prescription.canvasPages) {
      setCanvasPages(prescription.canvasPages.map((p: any) => ({ ...p, id: p.id || p._id })));
    } else {
      setCanvasPages([]);
    }

    // Load theme if present, otherwise fallback to doctor's default or 'default'
    setTemplateTheme(prescription.templateTheme || doctor.templateTheme || "default");

    // Reset to main tab
    setActiveTab("prescription");
  };



  const saveDoctorSettings = async (newSettings: DoctorSettings) => {
    if (!authFetch) return;
    const doctorId = appointmentData?.doctorId?._id || appointmentData?.doctorId;
    if (!doctorId) return;

    try {
      const settingsData = {
        doctor_id: doctorId,
        doctorName: newSettings.name,
        degree: newSettings.degree,
        speciality: newSettings.speciality,
        regNo: newSettings.regNo,
        clinicName: newSettings.clinicName,
        address: newSettings.address,
        phone: newSettings.phone,
        email: newSettings.email,
        logo: newSettings.logoUrl,
        templateTheme: newSettings.templateTheme,
        signature: newSettings.signatureUrl
      };

      const response = await authFetch('/api/doctor-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsData)
      });

      if (response.ok) {
        setDoctor(newSettings);
        setIsSettingsOpen(false);
        toast({ title: "Settings Saved Successfully" });
      } else {
        const errorData = await response.json();
        let errorMessage = errorData.message || 'Failed to save settings';

        // Parse mongoose validation error
        if (errorMessage.includes("Validation failed")) {
          const missingFields = [];
          if (errorMessage.includes("phone")) missingFields.push("Phone");
          if (errorMessage.includes("regNo")) missingFields.push("Registration No");
          if (errorMessage.includes("degree")) missingFields.push("Degree");
          if (errorMessage.includes("speciality")) missingFields.push("Speciality");
          if (errorMessage.includes("clinicName")) missingFields.push("Clinic Name");

          if (missingFields.length > 0) {
            errorMessage = `Missing required fields: ${missingFields.join(", ")}`;
          }
        }

        throw new Error(errorMessage);
      }
    } catch (error) {
      toast({
        title: "Error saving settings",
        variant: "destructive",
        description: (error as Error).message
      });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const generatePDFBlob = async (): Promise<Blob | null> => {
    if (!padRef.current) return null;

    const originalPreviewMode = isPreviewMode;
    setIsGeneratingPDF(true);
    setIsPreviewMode(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 200));

      const element = padRef.current;
      const originalTransform = element.style.transform;
      const originalWidth = element.style.width;
      const originalHeight = element.style.height;
      const originalBoxShadow = element.style.boxShadow;
      const originalMargin = element.style.margin;
      const originalOverflow = element.style.overflow;
      const originalBackgroundColor = element.style.backgroundColor;

      // Force 1:1 scale and remove UI artifacts
      element.style.transform = 'none';
      element.style.width = `${PAPER_WIDTH}px`;
      element.style.height = 'auto';
      element.style.boxShadow = 'none';
      element.style.margin = '0';
      element.style.overflow = 'visible';
      element.style.backgroundColor = '#ffffff';

      const opt = {
        margin: [0, 0, 0, 0] as [number, number, number, number],
        filename: `Prescription_${patient.name || 'Patient'}_${patient.date}.pdf`,
        image: { type: 'jpeg' as const, quality: 1.0 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          letterRendering: true,
          windowWidth: PAPER_WIDTH,
          height: element.scrollHeight,
          windowHeight: element.scrollHeight,
          backgroundColor: '#ffffff'
        },
        jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const },
        pagebreak: { mode: ['css', 'legacy'] }
      };

      const pdfBlob = await html2pdf().from(element).set(opt).outputPdf('blob');

      // Restore styles
      element.style.transform = originalTransform;
      element.style.width = originalWidth;
      element.style.height = originalHeight;
      element.style.boxShadow = originalBoxShadow;
      element.style.margin = originalMargin;
      element.style.overflow = originalOverflow;
      element.style.backgroundColor = originalBackgroundColor;

      return pdfBlob;
    } catch (error) {
      console.error("PDF Generation Error:", error);
      toast({
        title: "PDF Generation Failed",
        description: "Could not generate PDF from the document.",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsGeneratingPDF(false);
      setIsPreviewMode(originalPreviewMode);
    }
  };

  const handleDownloadPDF = async () => {
    if (!padRef.current) return;

    const originalPreviewMode = isPreviewMode;
    setIsGeneratingPDF(true);
    setIsPreviewMode(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 200));

      const element = padRef.current;
      const originalTransform = element.style.transform;
      const originalWidth = element.style.width;
      const originalHeight = element.style.height;
      const originalBoxShadow = element.style.boxShadow;
      const originalMargin = element.style.margin;
      const originalOverflow = element.style.overflow;
      const originalBackgroundColor = element.style.backgroundColor;
      const originalPadding = element.style.padding;

      element.style.transform = 'none';
      element.style.width = `${PAPER_WIDTH}px`;
      element.style.height = 'auto';
      element.style.boxShadow = 'none';
      element.style.margin = '0';
      element.style.overflow = 'visible';
      element.style.backgroundColor = '#ffffff';
      element.style.padding = '0';

      const opt = {
        margin: [0, 0, 0, 0] as [number, number, number, number],
        filename: `Prescription_${patient.name || 'Patient'}_${patient.date}.pdf`,
        image: { type: 'jpeg' as const, quality: 1.0 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          letterRendering: true,
          windowWidth: PAPER_WIDTH,
          width: PAPER_WIDTH,
          height: element.scrollHeight,
          windowHeight: element.scrollHeight,
          backgroundColor: '#ffffff',
          y: 0,
          x: 0,
          scrollY: 0,
          scrollX: 0
        },
        jsPDF: { unit: 'px' as const, format: [PAPER_WIDTH * 2, element.scrollHeight * 2] as [number, number], orientation: 'portrait' as const, compress: true },
        pagebreak: { mode: ['css', 'legacy'] }
      };

      await html2pdf().from(element).set(opt).save();

      element.style.transform = originalTransform;
      element.style.width = originalWidth;
      element.style.height = originalHeight;
      element.style.boxShadow = originalBoxShadow;
      element.style.margin = originalMargin;
      element.style.overflow = originalOverflow;
      element.style.backgroundColor = originalBackgroundColor;
      element.style.padding = originalPadding;

      toast({ title: "PDF Downloaded Successfully" });
    } catch (error) {
      console.error("PDF Generation Error:", error);
      toast({
        title: "PDF Generation Failed",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingPDF(false);
      setIsPreviewMode(originalPreviewMode);
    }
  };

  const handleShareWhatsApp = async () => {
    if (!patient.contact) {
      toast({
        title: "Missing Contact",
        description: "Please enter patient's contact number to share on WhatsApp.",
        variant: "destructive"
      });
      return;
    }

    setIsSharing(true);

    try {
      const element = document.getElementById('prescription-print-wrapper');
      if (!element) throw new Error("Prescription content not found");

      // Hide "Add Page" button for PDF generation
      const addPageBtn = document.querySelector('#add-page-btn') as HTMLElement;
      let originalBtnDisplay = '';
      if (addPageBtn) {
        originalBtnDisplay = addPageBtn.style.display;
        addPageBtn.style.display = 'none';
      }

      // 1. Generate PDF Blob
      const opt = {
        margin: 0,
        filename: `${patient.name.replace(/\s+/g, '_')}_prescription.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const },
        pagebreak: { mode: ['css', 'legacy'] }
      };

      const pdfBlob = await html2pdf().from(element).set(opt).outputPdf('blob');

      // Restore "Add Page" button
      if (addPageBtn) {
        addPageBtn.style.display = originalBtnDisplay;
      }

      // 2. Upload PDF to Public Storage
      const formData = new FormData();
      const pdfFile = new File([pdfBlob], opt.filename, { type: 'application/pdf' });
      formData.append('file', pdfFile);

      const uploadRes = await authFetch('/api/upload/public', {
        method: 'POST',
        body: formData
      });

      if (!uploadRes.ok) throw new Error('Failed to upload prescription PDF');

      const uploadData = await uploadRes.json();
      // Construct full URL if returned URL is relative
      const fileUrl = getImageUrl(uploadData.url);

      // 3. Send via Interakt API (Backend Proxy)
      // Clean phone number to get last 10 digits
      let phone = patient.contact.replace(/\D/g, '');
      if (phone.length > 10) phone = phone.slice(-10);

      // Format date and time for template
      const now = new Date();
      const formattedDate = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-');
      const formattedTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

      const shareRes = await authFetch('/api/prescriptions/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          countryCode: "+91",
          phoneNumber: phone,
          doctorPhoneNumber: doctor.phone,
          doctorName: doctor.name || "Doctor",
          patientName: patient.name || "Patient",
          date: formattedDate,
          time: formattedTime,
          pdfUrl: fileUrl,
          fileName: "doctor.pdf"
        })
      });

      const shareResult = await shareRes.json();

      if (shareResult.success) {
        toast({
          title: "Sent Successfully",
          description: "Prescription has been sent to patient via WhatsApp.",
        });
      } else {
        throw new Error(shareResult.message || 'Failed to send WhatsApp message');
      }

    } catch (error) {
      console.error('Share Error:', error);
      toast({
        variant: "destructive",
        title: "Share Failed",
        description: error instanceof Error ? error.message : "Could not share prescription.",
      });

      // Fallback to old method if API fails? 
      // For now, let's keep it strictly attempting the new method as requested.
      // User requested: "upload that priscription using upload method and in return use that link in whatsapp"
    } finally {
      setIsSharing(false);
    }
  };

  // Ref to track if we have initialized the widget
  const googleTranslateRef = useRef<boolean>(false);

  useEffect(() => {
    // Define the global callback
    (window as any).googleTranslateElementInit = () => {
      console.log("Google Translate Script Loaded, waiting for user action or auto-init...");
      // We can auto-init if we want, but doing it on toggle is safer for rendering
      // if (isTranslateVisible) {
      //   initWidget();
      // }
    };

    // Remove existing script if it's broken or stale (optional, but safer to just check existence)
    const scriptId = 'google-translate-script';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.type = 'text/javascript';
      script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  const initWidget = () => {
    if (googleTranslateRef.current) return; // Already initialized for this mount

    if ((window as any).google && (window as any).google.translate && (window as any).google.translate.TranslateElement) {
      try {
        console.log("Initializing Google Translate Widget...");

        // Clear old cookies to fix "stuck" translation issues
        document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=." + document.domain;

        new (window as any).google.translate.TranslateElement({
          pageLanguage: 'en',
          includedLanguages: 'en,hi,bn,te,ta,ml,kn,gu,mr,pa,or,as,ur,zh,ar,fr,es,de,it,ja,ko,pt,ru,th,vi',
          layout: (window as any).google.translate.TranslateElement.InlineLayout.SIMPLE,
          autoDisplay: false,
          multilanguagePage: true,
          gaTrack: true,
          gaId: 'UA-XXXXXXXX-X' // Optional, helps with tracking
        }, 'google_translate_element');
        googleTranslateRef.current = true;
      } catch (e) {
        console.error("Error initializing Google Translate:", e);
      }
    } else {
      console.warn("Google Translate script not ready yet. Retrying...");
      setTimeout(initWidget, 500); // Retry mechanism
    }
  };

  const toggleTranslate = () => {
    const nextState = !isTranslateVisible;
    setIsTranslateVisible(nextState);

    // If opening, try to initialize
    if (nextState) {
      // Use setTimeout to ensure the div is 'display: block' before we try to render into it
      setTimeout(() => {
        initWidget();
      }, 100);
    }
  };

  const handleSignatureUpload = async (file: File) => {
    if (!authFetch) return;
    setIsUploadingSignature(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await authFetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        setDoctor(prev => ({ ...prev, signatureUrl: result.url }));
        toast({ title: "Signature uploaded successfully" });
      } else {
        throw new Error('Failed to upload signature');
      }
    } catch (error) {
      toast({
        title: "Error uploading signature",
        variant: "destructive",
        description: (error as Error).message
      });
    } finally {
      setIsUploadingSignature(false);
    }
  };

  const handleLogoUpload = async (file: File) => {
    if (!authFetch) return;
    setIsUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await authFetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        setDoctor(prev => ({ ...prev, logoUrl: result.url }));
        toast({ title: "Logo uploaded successfully" });
      } else {
        throw new Error('Failed to upload logo');
      }
    } catch (error) {
      toast({
        title: "Error uploading logo",
        variant: "destructive",
        description: (error as Error).message
      });
    } finally {
      setIsUploadingLogo(false);
    }
  };

  return (
    <TooltipProvider>
      <div ref={containerRef} className="flex flex-col items-center gap-4 lg:gap-6 w-full min-h-screen pb-10 lg:pr-20 transition-all duration-300 print:!min-h-0 print:!pb-0 print:!gap-0">
        {/* ... (rest of the component structure) ... */}
        {/* Note: I'm not replacing the whole 700 lines, just wrapping the top level return */}
        {/* Wait, multi_replace might be tricky for wrapping. Let's do it carefully. */}

        {/* Google Translate Widget */}
        <div
          id="google_translate_element"
          className="print:hidden fixed top-3 right-3 lg:top-4 lg:right-4 z-[100] bg-white p-2 lg:p-3 rounded-lg shadow-2xl border border-teal-200 w-fit"
          style={{ display: isTranslateVisible ? 'block' : 'none' }}
        ></div>

        {/* TOOLBAR */}
        <div className="print:hidden flex lg:flex-col flex-row items-center justify-start gap-1.5 lg:gap-2.5 px-1.5 py-3 lg:px-2 lg:py-4 bg-white/95 backdrop-blur-md border rounded-xl shadow-lg w-fit max-w-[calc(100vw-2rem)] lg:w-auto lg:max-h-[calc(100vh-140px)] lg:fixed lg:left-auto lg:top-28 z-50 sticky top-4 overflow-x-auto lg:overflow-y-auto mb-2 lg:mb-0 lg:mx-auto lg:right-3">

          <div className="flex lg:flex-col flex-row items-center gap-1.5 lg:gap-2 flex-shrink-0">
            <Button
              variant={activeTool === "text" ? "default" : "outline"}
              size="icon"
              onClick={() => handleToolChange("text")}
              title="Text Mode"
              className="flex-shrink-0 lg:h-8 lg:w-8 h-9 w-9"
            >
              <Type className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
            </Button>

            <Button
              variant={activeTool === "pen" ? "default" : "outline"}
              size="icon"
              onClick={() => handleToolChange("pen")}
              title="Pen"
              className="flex-shrink-0 lg:h-8 lg:w-8 h-9 w-9"
            >
              <Pen className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant={["rectangle", "circle", "line", "triangle", "arrow", "star"].includes(activeTool) ? "default" : "outline"}
                  size="icon"
                  title="Shapes"
                  className="flex-shrink-0 lg:h-8 lg:w-8 h-9 w-9"
                >
                  <Shapes className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-fit p-2">
                <div className="grid grid-cols-3 gap-1">
                  <Button
                    variant={activeTool === "rectangle" ? "default" : "ghost"}
                    size="icon"
                    onClick={() => handleToolChange("rectangle")}
                    className="h-9 w-9"
                    title="Rectangle"
                  >
                    <Square className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={activeTool === "circle" ? "default" : "ghost"}
                    size="icon"
                    onClick={() => handleToolChange("circle")}
                    className="h-9 w-9"
                    title="Circle"
                  >
                    <Circle className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={activeTool === "triangle" ? "default" : "ghost"}
                    size="icon"
                    onClick={() => handleToolChange("triangle")}
                    className="h-9 w-9"
                    title="Triangle"
                  >
                    <Triangle className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={activeTool === "line" ? "default" : "ghost"}
                    size="icon"
                    onClick={() => handleToolChange("line")}
                    className="h-9 w-9"
                    title="Line"
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={activeTool === "arrow" ? "default" : "ghost"}
                    size="icon"
                    onClick={() => handleToolChange("arrow")}
                    className="h-9 w-9"
                    title="Arrow"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                      <polyline points="12 5 19 12 12 19"></polyline>
                    </svg>
                  </Button>
                  <Button
                    variant={activeTool === "star" ? "default" : "ghost"}
                    size="icon"
                    onClick={() => handleToolChange("star")}
                    className="h-9 w-9"
                    title="Star"
                  >
                    <Star className="w-4 h-4" />
                  </Button>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            <input
              type="color"
              value={brushColor}
              onChange={(e) => setBrushColor(e.target.value)}
              disabled={activeTool === "eraser" || activeTool === "text"}
              className="lg:w-7 lg:h-7 w-8 h-8 rounded cursor-pointer border-none p-0 flex-shrink-0"
              title="Color"
            />
            <div className="w-16 lg:w-20 px-1 flex-shrink-0">
              <Slider
                value={[brushRadius]}
                onValueChange={(val) => setBrushRadius(val[0])}
                min={1}
                max={20}
                step={1}
                disabled={activeTool === "text"}
                title="Brush Size"
              />
            </div>
          </div>

          <div className="flex lg:flex-col flex-row items-center gap-1.5 lg:gap-2 flex-shrink-0">
            <Button
              variant={activeTool === "eraser" ? "default" : "outline"}
              size="icon"
              onClick={() => handleToolChange("eraser")}
              title="Eraser"
              className="flex-shrink-0 lg:h-8 lg:w-8 h-9 w-9"
            >
              <Eraser className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={undoCanvas}
              title="Undo Last Stroke"
              className="flex-shrink-0 lg:h-8 lg:w-8 h-9 w-9"
            >
              <Undo className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
            </Button>
          </div>

          <div className="flex lg:flex-col flex-row items-center gap-1.5 lg:gap-2 flex-shrink-0">
            <Button
              variant="outline"
              size="icon"
              onClick={savePrescription}
              title="Save Prescription"
              disabled={isSaving || !currentPatientId}
              className="flex-shrink-0 lg:h-8 lg:w-8 h-9 w-9"
            >
              {isSaving ? <Loader2 className="w-3.5 h-3.5 lg:w-4 lg:h-4 animate-spin" /> : <Save className="w-3.5 h-3.5 lg:w-4 lg:h-4" />}
            </Button>

            {currentPatientId && (
              <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="icon" title="History" className="xl:hidden flex-shrink-0 lg:h-8 lg:w-8 h-9 w-9">
                    <History className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Patient Prescriptions</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    {isLoadingPrescriptions ? (
                      <div className="animate-pulse space-y-3">
                        {Array(5).fill(0).map((_, i) => (
                          <div key={i} className="p-3 bg-white rounded-lg border border-gray-100">
                            <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded w-32 mb-1"></div>
                            <div className="h-3 bg-gray-200 rounded w-28"></div>
                          </div>
                        ))}
                      </div>
                    ) : prescriptions.length === 0 ? (
                      <p className="text-center text-muted-foreground">No prescriptions found.</p>
                    ) : (
                      prescriptions.map((prescription, index) => {
                        const isLatest = index === 0;
                        const isActive = currentPrescriptionId === prescription._id;
                        return (
                          <div key={prescription._id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer" onClick={() => loadPrescription(prescription)}>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-bold">{prescription.visitDate ? new Date(prescription.visitDate).toLocaleDateString() : 'No Date'}</p>
                                {isLatest && <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">Current</span>}
                                {isActive && <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">Active</span>}
                              </div>
                              <p className="text-sm text-muted-foreground">{prescription.patient?.name || "No Name"}</p>
                              <p className="text-xs text-gray-400">{prescription.doctor?.name || 'Unknown Doctor'}</p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            )}

            <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon" title="Doctor Settings" className="flex-shrink-0 lg:h-8 lg:w-8 h-9 w-9">
                  <Settings className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl overflow-y-auto max-h-[80vh]">
                <DialogHeader>
                  <DialogTitle>Doctor & Clinic Details</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Doctor Name</Label>
                      <Input value={doctor.name} onChange={(e) => setDoctor(prev => ({ ...prev, name: e.target.value }))} placeholder="Enter doctor name" />
                    </div>
                    <div className="space-y-2">
                      <Label>Degree</Label>
                      <Input value={doctor.degree} onChange={(e) => setDoctor(prev => ({ ...prev, degree: e.target.value }))} placeholder="Enter degree" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Speciality</Label>
                      <Input value={doctor.speciality} onChange={(e) => setDoctor(prev => ({ ...prev, speciality: e.target.value }))} placeholder="Enter speciality" />
                    </div>
                    <div className="space-y-2">
                      <Label>Reg No</Label>
                      <Input value={doctor.regNo} onChange={(e) => setDoctor(prev => ({ ...prev, regNo: e.target.value }))} placeholder="Enter registration number" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Clinic Name</Label>
                    <Input value={doctor.clinicName} onChange={(e) => setDoctor(prev => ({ ...prev, clinicName: e.target.value }))} placeholder="Enter clinic name" />
                  </div>
                  <div className="space-y-2">
                    <Label>Address</Label>
                    <Input value={doctor.address} onChange={(e) => setDoctor(prev => ({ ...prev, address: e.target.value }))} placeholder="Enter address" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input value={doctor.phone} onChange={(e) => setDoctor(prev => ({ ...prev, phone: e.target.value }))} placeholder="Enter phone number" />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input value={doctor.email} onChange={(e) => setDoctor(prev => ({ ...prev, email: e.target.value }))} placeholder="Enter email" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Clinic Logo</Label>
                    <div className="flex items-center gap-4">
                      {doctor.logoUrl && (
                        <img src={getImageUrl(doctor.logoUrl)} alt="Logo" className="w-16 h-16 object-cover rounded" />
                      )}
                      <div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleLogoUpload(file);
                          }}
                          className="hidden"
                          id="logo-upload"
                          disabled={isUploadingLogo}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => document.getElementById('logo-upload')?.click()}
                          disabled={isUploadingLogo}
                        >
                          {isUploadingLogo ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                          {isUploadingLogo ? 'Uploading...' : 'Upload Logo'}
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Doctor Signature</Label>
                    <div className="flex items-center gap-4">
                      {doctor.signatureUrl && (
                        <img src={getImageUrl(doctor.signatureUrl)} alt="Signature" className="w-32 h-16 object-contain border rounded" />
                      )}
                      <div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleSignatureUpload(file);
                          }}
                          className="hidden"
                          id="signature-upload"
                          disabled={isUploadingSignature}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => document.getElementById('signature-upload')?.click()}
                          disabled={isUploadingSignature}
                        >
                          {isUploadingSignature ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                          {isUploadingSignature ? 'Uploading...' : 'Upload Signature'}
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Template Theme</Label>
                    <Select
                      value={doctor.templateTheme || 'default'}
                      onValueChange={(val) => setDoctor(prev => ({ ...prev, templateTheme: val }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Theme" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Classic (Default)</SelectItem>
                        <SelectItem value="modern">Modern Blue</SelectItem>
                        <SelectItem value="minimal">Minimal Black</SelectItem>
                        <SelectItem value="TemplateOne">TemplateOne</SelectItem>
                        <SelectItem value="TemplateTwo">TemplateTwo</SelectItem>
                        <SelectItem value="TemplateThree">TemplateThree</SelectItem>
                        <SelectItem value="TemplateFour">TemplateFour</SelectItem>
                        <SelectItem value="TemplateFive">TemplateFive</SelectItem>
                        <SelectItem value="TemplateSix">TemplateSix</SelectItem>
                        <SelectItem value="TemplateSeven">TemplateSeven</SelectItem>
                        <SelectItem value="TemplateEight">TemplateEight</SelectItem>
                        <SelectItem value="TemplateNine">TemplateNine</SelectItem>
                        <SelectItem value="TemplateTen">TemplateTen</SelectItem>
                        <SelectItem value="TemplateEleven">TemplateEleven</SelectItem>
                        <SelectItem value="TemplateTwelfth">TemplateTwelfth</SelectItem>
                        <SelectItem value="TemplateThirteen">TemplateThirteen</SelectItem>
                        <SelectItem value="TemplateFourteen">TemplateFourteen</SelectItem>
                        <SelectItem value="TemplateFifteen">TemplateFifteen</SelectItem>
                        <SelectItem value="TemplateSixteen">TemplateSixteen</SelectItem>
                        <SelectItem value="TemplateSeventeen">TemplateSeventeen</SelectItem>
                        <SelectItem value="TemplateEighteen">TemplateEighteen</SelectItem>
                        <SelectItem value="TemplateNineteen">TemplateNineteen</SelectItem>
                        <SelectItem value="TemplateTwenty">TemplateTwenty</SelectItem>
                        <SelectItem value="TemplateTwentyOne">TemplateTwentyOne</SelectItem>
                        <SelectItem value="TemplateTwentyTwo">TemplateTwentyTwo</SelectItem>
                        <SelectItem value="TemplateTwentyThree">TemplateTwentyThree</SelectItem>
                        <SelectItem value="TemplateTwentyFour">TemplateTwentyFour</SelectItem>
                        <SelectItem value="TemplateTwentyFive">TemplateTwentyFive</SelectItem>
                        <SelectItem value="TemplateTwentySix">TemplateTwentySix</SelectItem>
                        <SelectItem value="TemplateTwentySeven">TemplateTwentySeven</SelectItem>
                        <SelectItem value="TemplateTwentyEight">TemplateTwentyEight</SelectItem>
                        <SelectItem value="TemplateTwentyNine">TemplateTwentyNine</SelectItem>
                        <SelectItem value="TemplateThirty">TemplateThirty</SelectItem>
                        <SelectItem value="TemplateThirtyOne">TemplateThirtyOne</SelectItem>
                        <SelectItem value="TemplateThirtyTwo">TemplateThirtyTwo</SelectItem>
                        <SelectItem value="TemplateThirtyThree">TemplateThirtyThree</SelectItem>
                        <SelectItem value="TemplateThirtyFour">TemplateThirtyFour</SelectItem>
                        <SelectItem value="TemplateThirtyFive">TemplateThirtyFive</SelectItem>
                        <SelectItem value="TemplateThirtySix">TemplateThirtySix</SelectItem>
                        <SelectItem value="TemplateThirtySeven">TemplateThirtySeven</SelectItem>
                        <SelectItem value="TemplateThirtyEight">TemplateThirtyEight</SelectItem>
                        <SelectItem value="TemplateThirtyNine">TemplateThirtyNine</SelectItem>
                        <SelectItem value="TemplateFourty">TemplateFourty</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={() => saveDoctorSettings(doctor)}>Save Changes</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Button
              variant="outline"
              size="icon"
              onClick={toggleTranslate}
              title="Translate"
              className="flex-shrink-0 lg:h-8 lg:w-8 h-9 w-9"
            >
              <Languages className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
            </Button>

            <Button
              variant={isPreviewMode ? "default" : "outline"}
              size="icon"
              onClick={() => setIsPreviewMode(!isPreviewMode)}
              title={isPreviewMode ? "Edit Mode" : "Preview Mode (Enable for Translation)"}
              className="flex-shrink-0 lg:h-8 lg:w-8 h-9 w-9"
            >
              {isPreviewMode ? <Eye className="w-3.5 h-3.5 lg:w-4 lg:h-4" /> : <EyeOff className="w-3.5 h-3.5 lg:w-4 lg:h-4" />}
            </Button>

            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  title="Change Template Theme"
                  className="flex-shrink-0 lg:h-8 lg:w-8 h-9 w-9"
                >
                  <LayoutTemplate className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                </Button>
              </DialogTrigger>


              <DialogContent className="sm:max-w-[425px] max-h-[80vh] flex flex-col">
                <DialogHeader>
                  <DialogTitle>Select Prescription Theme</DialogTitle>
                </DialogHeader>

                <div className="overflow-y-auto flex-1 ">


                  <div className="grid grid-cols-2 gap-4 py-4">

                    {template_array.map((template) => (
                      <Button
                        key={template.name}
                        variant={templateTheme === template.name ? 'default' : 'outline'}
                        className="h-[230px] flex flex-col gap-2"
                        onClick={() => setTemplateTheme(template.name)}
                      >
                        <img src={template.img} alt={template.name} className="h-[220px]" />
                        <div className="w-full h-12 bg-gray-400 border-black border-2 rounded flex items-center justify-center text-xs font-bold">
                          {template.name}
                        </div>
                      </Button>
                    ))}


                    {/* <Button variant={templateTheme === 'TemplateOne' ? 'default' : 'outline'} className="h-24 flex flex-col gap-2" onClick={() => setTemplateTheme('TemplateOne')}>
                   <div className="w-full h-12 bg-white border-black border-2 rounded flex items-center justify-center text-xs font-bold">Minimal</div>
                  Template One
                </Button> */}



                  </div>
                </div>


              </DialogContent>



            </Dialog>

            <Button
              onClick={handlePrint}
              title="Print Prescription"
              className="bg-blue-600 hover:bg-blue-700 text-white flex-shrink-0 lg:h-8 lg:w-8 h-9 w-9"
            >
              <Printer className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
            </Button>

            <Button
              onClick={handleShareWhatsApp}
              disabled={isSharing}
              title="Share on WhatsApp"
              className="bg-green-600 hover:bg-green-700 text-white flex-shrink-0 lg:h-8 lg:w-8 h-9 w-9"
            >
              {isSharing ? <Loader2 className="w-3.5 h-3.5 lg:w-4 lg:h-4 animate-spin" /> : <Share2 className="w-3.5 h-3.5 lg:w-4 lg:h-4" />}
            </Button>

            <Button
              onClick={() => setIsSettingsDialogOpen(true)}
              title="Prescription Settings"
              className="bg-purple-600 hover:bg-purple-700 text-white flex-shrink-0 lg:h-8 lg:w-8 h-9 w-9"
            >
              <Palette className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
            </Button>
          </div>
        </div>

        <PrescriptionSettingsDialog
          open={isSettingsDialogOpen}
          onOpenChange={setIsSettingsDialogOpen}
          currentSettings={prescriptionSettings}
          onSave={async (settings) => {
            if (!authFetch) return;
            const doctorId = appointmentData?.doctorId?._id || appointmentData?.doctorId;
            if (!doctorId) return;

            try {
              const response = await authFetch('/api/prescription-settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...settings, doctor_id: doctorId })
              });

              if (response.ok) {
                setPrescriptionSettings(settings);
                toast({ title: "Settings saved successfully" });
              } else {
                throw new Error('Failed to save settings');
              }
            } catch (error) {
              toast({
                title: "Failed to save settings",
                variant: "destructive",
                description: (error as Error).message
              });
            }
          }}
        />

        {/* Main Content Area with Sidebar and Canvas */}
        <div className="flex flex-row items-start justify-center gap-0 lg:gap-6 w-full print:!gap-0">

          {/* Desktop History Sidebar (Sticky) */}
          {currentPatientId && (
            <div className="hidden xl:flex flex-col w-64 shrink-0 bg-white/95 backdrop-blur-md shadow-lg border border-gray-200 rounded-xl p-4 h-[calc(100vh-140px)] sticky top-28 overflow-y-auto print:hidden">
              <div className="flex items-center gap-2 mb-4 text-teal-800 border-b pb-3">
                <div className="p-1.5 bg-teal-50 rounded-md">
                  <History className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-base">History</h3>
              </div>
              <div className="space-y-3">
                {isLoadingPrescriptions ? (
                  <div className="animate-pulse space-y-3">
                    {Array(5).fill(0).map((_, i) => (
                      <div key={i} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-full mb-1"></div>
                      </div>
                    ))}
                  </div>
                ) : prescriptions.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-8">No records.</p>
                ) : (
                  prescriptions.map((prescription, index) => {
                    const isLatest = index === 0;
                    const isActive = currentPrescriptionId === prescription._id;
                    return (
                      <div
                        key={prescription._id}
                        className={`group p-3 rounded-lg border transition-all cursor-pointer ${isActive
                          ? "bg-teal-50 border-teal-200 shadow-sm"
                          : "bg-white border-gray-100 hover:border-teal-300 hover:shadow-md"
                          }`}
                        onClick={() => loadPrescription(prescription)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-1.5 mb-1.5">
                              <p className="font-bold text-sm text-gray-900">{prescription.visitDate ? new Date(prescription.visitDate).toLocaleDateString() : 'No Date'}</p>
                              {isLatest && <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[9px] uppercase tracking-tighter rounded-full font-bold">New</span>}
                            </div>
                            <p className="text-xs text-gray-600 font-medium truncate max-w-[170px] mb-1">{prescription.patient?.name || "Patient"}</p>
                            <p className="text-[10px] text-gray-400 truncate">{prescription.doctor?.name || 'Doctor'}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* PRESCRIPTION PAD CONTAINER WRAPPER FOR SCALING */}
          {isLoading ? (
            <div className="w-full max-w-[794px] mx-auto">
              <div className="animate-pulse bg-white rounded-xl shadow-lg p-8 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-6 bg-gray-200 rounded w-48"></div>
                    <div className="h-4 bg-gray-200 rounded w-32"></div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
            </div>
          ) : (
            <div id="prescription-print-wrapper" className="flex flex-col items-center gap-8 pb-32 print:block print:pb-0 print:gap-0">

              {/* PAGE 1: MAIN PRESCRIPTION */}
              <div
                onClick={() => handlePageSwitch("prescription")}
                className={`relative transition-all duration-200 ${activeTab === "prescription" ? 'ring-2 ring-teal-500 shadow-xl' : 'opacity-70 hover:opacity-100'} print:opacity-100 print:shadow-none print:ring-0 print:w-[210mm] print:h-auto print:overflow-visible`}
              >
                {(() => {
                  const isFocused = activeTab === "prescription";
                  const props = {
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
                    canvasRef: canvasRef,
                    activeTool: isFocused ? activeTool : "text",
                    startDrawing: isFocused ? (e: React.MouseEvent<HTMLCanvasElement>) => startDrawing(e, "prescription") : () => { },
                    draw: isFocused ? draw : () => { },
                    stopDrawing: isFocused ? stopDrawing : () => { },
                    startDrawingTouch: isFocused ? (e: React.TouchEvent<HTMLCanvasElement>) => startDrawingTouch(e, "prescription") : () => { },
                    drawTouch: isFocused ? drawTouch : () => { },
                    scale,
                    contentHeight,
                    padRef,
                    isPreviewMode: isPreviewMode || !isFocused,
                    getImageUrl,
                    prescriptionSettings,
                    staticCanvasImage: isFocused ? undefined : canvasData
                  };

                  return (
                    <div className={canvasPages.length > 0 ? "page-break-after-always" : ""}>
                      <PrescriptionTemplateRenderer theme={templateTheme} {...props} />
                    </div>
                  );
                })()}
              </div>

              {/* PAGE 2..N: CANVAS PAGES */}
              {canvasPages.map((page, index) => {
                const isPageFocused = activeTab === page.id;
                const isLastPage = index === canvasPages.length - 1;
                return (
                  <div
                    key={page.id}
                    onClick={() => handlePageSwitch(page.id)}
                    className={`relative transition-all duration-200 ${!isLastPage ? 'page-break-after-always' : ''} ${isPageFocused ? 'ring-2 ring-teal-500 shadow-xl' : 'opacity-70 hover:opacity-100'} print:opacity-100 print:shadow-none print:ring-0 print:overflow-hidden print:w-[210mm] print:h-[297mm]`}
                  >
                    <CanvasPage
                      id={page.id}
                      canvasRef={canvasRef}
                      scale={scale}
                      text={page.text}
                      onTextChange={handlePageTextChange}
                      activeTool={isPageFocused ? activeTool : "text"}
                      startDrawing={isPageFocused ? (e: React.MouseEvent<HTMLCanvasElement>) => startDrawing(e, page.id) : () => { }}
                      draw={isPageFocused ? draw : () => { }}
                      stopDrawing={isPageFocused ? stopDrawing : () => { }}
                      startDrawingTouch={isPageFocused ? (e: React.TouchEvent<HTMLCanvasElement>) => startDrawingTouch(e, page.id) : () => { }}
                      drawTouch={isPageFocused ? drawTouch : () => { }}
                      contentHeight={contentHeight}
                      isPreviewMode={isPreviewMode || !isPageFocused}
                      doctor={doctor}
                      date={patient.date}
                      getImageUrl={getImageUrl}
                      prescriptionSettings={prescriptionSettings}
                      onRemove={(e) => removeCanvasPage(e, page.id)}
                      staticCanvasImage={isPageFocused ? undefined : page.canvasData}
                      iscribeEnabled={true}
                      iscribeStatus={iscribeStatus}
                    />
                  </div>
                );
              })}

              {/* ADD PAGE BUTTON */}
              <div id="add-page-btn" className="print:hidden flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer w-[210mm] max-w-full" style={{ transform: `scale(${scale})` }} onClick={addCanvasPage}>
                <div className="flex flex-col items-center gap-2 text-gray-500">
                  <div className="bg-white p-3 rounded-full shadow-sm">
                    <div className="w-6 h-6 flex items-center justify-center text-teal-600 font-bold text-xl">+</div>
                  </div>
                  <span className="font-medium">Add New Page</span>
                </div>
              </div>

            </div>
          )}

        </div>
      </div>
    </TooltipProvider>
  );
};
