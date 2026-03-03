// ===================================================================================
// API CONFIGURATION
// This file contains the configuration for connecting to your external backend API
// ===================================================================================

// Base URL for your external backend API
// Update this URL to match your backend server
// You can change this in one place and it will update throughout the application


// export const API_BASE_URL = "https://apis.srmarnik.com";

//  export const API_BASE_URL ="https://apis.srmarnik.com";


// Alternative configurations for different environments
// Alternative configurations for different environments
// Uncomment the one you want to use:


  // export const API_BASE_URL = "https://apis.99clinix.com"; // Production

  // export const API_BASE_URL = "https://apis.99aitech.com"; // Production


// export const API_BASE_URL = "https://apis.99clinix.com"; // Production

//export const API_BASE_URL = ""; // Use local proxy (Next.js rewrites)
export const API_BASE_URL = "http://localhost:5002"; // Direct local backend

// export const API_BASE_URL = "https://staging.srmarnik.com";     // Staging environment

// API endpoints configuration
export const API_ENDPOINTS = {
  // Authentication
  auth: {
    login: "/auth/login",
    logout: "/auth/logout",
    me: "/auth/me",
  },

  // Dashboard
  dashboard: "/dashboard",

  // Appointments
  appointments: "/appointments",

  // Walking Patients
  walking: "/walking",

  // Activities
  activities: "/activities",

  // Activity Log
  activityLog: "/activity-log",

  // Medical Records (Blood Reports, Prescriptions)
  bloodReports: "/blood-reports",
  prescriptions: "/prescriptions",

  // Blood Tests
  bloodTests: "/blood-tests",

  // CMS/Website Content
  cms: "/cms",

  // Coupons
  coupons: "/coupons",

  // Doctors
  doctors: "/doctors",

  // Patients
  patients: "/patients",

  // Portfolio
  portfolio: "/portfolio",

  // Profile
  profile: "/profile",

  // Services
  services: "/services",

  // Summaries
  summaries: "/summaries",

  // Testimonials
  testimonials: "/testimonials",

  // Time Slots
  timeslots: "/timeslots",

  // Users
  users: "/users",

  // File Upload
  upload: "/upload",

  // Blog
  blog: "/blog",

  // Finance
  finance: {
    expenseCategories: "/api/finance/expense-categories",
  },

  // Public endpoints
  public: {
    doctors: "/public/doctors",
    services: "/public/services",
  },
};

// Agora Configuration
export const AGORA_APP_ID = "5d29702f31374267a0cd6dce32478bdb";

// Helper function to build full API URLs
export const buildApiUrl = (endpoint: string): string => {
  return `${API_BASE_URL}${endpoint}`;
};
