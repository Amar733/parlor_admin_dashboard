// ===================================================================================
// DATA TYPES
// This section defines the TypeScript types for all major data structures in the
// application. These types are used across the frontend and backend for consistency.
// ===================================================================================

export const allPermissions = [
  // Dashboards
  {
    _id: "/dashboard",
    label: "Overview",
    actions: ["view"],
  },
  {
    _id: "/dashboard/financial-dashboard",
    label: "Financial Dashboard",
    actions: ["view"],
  },
  // Sales & Orders
  {
    _id: "/dashboard/sales",
    label: "Sales",
    actions: ["view", "edit", "delete"],
  },
  // {
  //   _id: "/dashboard/booking",
  //   label: "Booking",
  //   actions: ["view", "edit", "delete"],
  // },
  // {
  //   _id: "/dashboard/quotation",
  //   label: "Quotation",
  //   actions: ["view", "edit", "delete"],
  // },
  // {
  //   _id: "/dashboard/work-order",
  //   label: "Work Order",
  //   actions: ["view", "edit", "delete"],
  // },
  {
    _id: "/dashboard/pos",
    label: "Point of Sale/POS",
    actions: ["view", "edit", "delete"],
  },
  {
    _id: "/dashboard/package-sales",
    label: "Package Sales",
    actions: ["view", "edit", "delete"],
  },
  // Financial Management
  {
    _id: "/dashboard/expense",
    label: "Expense",
    actions: ["view", "edit", "delete"],
  },
  {
    _id: "/dashboard/expense-category",
    label: "Expense Category",
    actions: ["view", "edit", "delete"],
  },
  {
    _id: "/dashboard/accounts",
    label: "Accounts",
    actions: ["view", "edit", "delete"],
  },
  {
    _id: "/dashboard/pay-mode",
    label: "Pay Mode",
    actions: ["view", "edit", "delete"],
  },
  // Clinic Management
  {
    _id: "/dashboard/appointments",
    label: "Appointments",
    actions: ["view", "edit", "delete"],
  },
  {
    _id: "/dashboard/patients",
    label: "Patients",
    actions: ["view", "edit", "delete"],
  },
  // {
  //   _id: "/dashboard/medical-records",
  //   label: "Medical Records",
  //   actions: ["view", "edit", "delete"],
  // },
  // {
  //   _id: "/dashboard/blood-tests",
  //   label: "Blood Tests",
  //   actions: ["view", "edit", "delete"],
  // },
  {
    _id: "/dashboard/services",
    label: "Services",
    actions: ["view", "edit", "delete"],
  },
  {
    _id: "/dashboard/package-templates",
    label: "Package Templates",
    actions: ["view", "edit", "delete"],
  },
  {
    _id: "/dashboard/summaries",
    label: "Summaries",
    actions: ["view", "edit"],
  },
  // Inventory Management
  {
    _id: "/dashboard/inventory",
    label: "Inventory",
    actions: ["view", "edit", "delete"],
  },
  {
    _id: "/dashboard/inventory/purchases",
    label: "Purchases",
    actions: ["view", "edit", "delete"],
  },
  {
    _id: "/dashboard/inventory/stock-adjustments",
    label: "Stock Adjustments",
    actions: ["view", "edit", "delete"],
  },
  // Reports
  {
    _id: "/dashboard/reports/stock-transactions",
    label: "Stock Transaction Reports",
    actions: ["view"],
  },
  {
    _id: "/dashboard/reports/store",
    label: "Store Reports",
    actions: ["view"],
  },
  // Website Management
  {
    _id: "/dashboard/cms",
    label: "Website Content",
    actions: ["view", "edit"],
  },
  {
    _id: "/dashboard/gallery",
    label: "Gallery",
    actions: ["view", "edit", "delete"],
  },
  // {
  //   _id: "/dashboard/portfolio",
  //   label: "Portfolio",
  //   actions: ["view", "edit", "delete"],
  // },
  // {
  //   _id: "/dashboard/testimonials",
  //   label: "Testimonials",
  //   actions: ["view", "edit", "delete"],
  // },
  //
  //   _id: "/dashboard/blog",
  //   label: "Blog",
  //   actions: ["view", "edit", "delete"],
  // },
  {
    _id: "/dashboard/activities",
    label: "Activities",
    actions: ["view", "edit", "delete"],
  },
  {
    _id: "/dashboard/coupons",
    label: "Coupons",
    actions: ["view", "edit", "delete"],
  },
  // User Management & Settings
  {
    _id: "/dashboard/users",
    label: "Users",
    actions: ["view", "edit", "delete"],
  },
  {
    _id: "/dashboard/doctors",
    label: "Doctors",
    actions: ["view", "edit", "delete"],
  },
  {
    _id: "/dashboard/doctor-visiting",
    label: "Doctor Visiting",
    actions: ["view", "edit", "delete"],
  },
  {
    _id: "/dashboard/role-matrix",
    label: "Role Matrix",
    actions: ["view", "edit", "delete"],
  },
  {
    _id: "/dashboard/settings",
    label: "Settings",
    actions: ["view", "edit"],
  },
  {
    _id: "/dashboard/timeslots",
    label: "Time Slots",
    actions: ["view", "edit"],
  },
  {
    _id: "/dashboard/settings/access-time",
    label: "Access Time Management",
    actions: ["view", "edit"],
  },
  {
    _id: "/dashboard/profile",
    label: "Profile",
    actions: ["view", "edit"],
  },
  {
    _id: "/dashboard/activity-log",
    label: "Activity Log",
    actions: ["view"],
  },
  {
    _id: "/dashboard/package",
    label: "Package Management",
    actions: ["view", "edit", "delete"],
  },
];

export type Permission = {
  _id: string;
  label: string;
  actions: ("view" | "edit" | "delete")[];
};

// Product related types for inventory
export type Product = {
  _id: string;
  productName: string;
  batchNo: string;
  sku: string;
  hsnSac?: string;
  purchasePrice: number;
  sellingPrice: number;
  mrp: number;
  tax: number;
  category: any;
  brand: any;
  unit: any;
  minStockThreshold: number;
  description?: string;
  barcode?: string;
  isScheduledDrug: boolean;
  isShowcase: boolean;
};

export type ProductBrand = {
  _id: string;
  name: string;
  status: boolean;
};

export type ProductCategory = {
  _id: string;
  categoryName: string;
  categoryPath: string;
  parentCategory?: string;
  status: boolean;
};

export type ProductUnit = {
  _id: string;
  name: string;
  status: boolean;
};

export type ProductLocation = {
  _id: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  status: boolean;
};

export type Supplier = {
  id: string;
  _id: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  gstin?: string;
  companyName?: string;
};

export type ProductPurchaseRate = {
  id?: string;
  productId: string;
  supplierId: string;
  rate: number;
  productName?: string;
  supplierName?: string;
};

export type StockAdjustment = {
  _id: string;
  productId: string;
  productName: string;
  storeId: string;
  storeName: string;
  type: string;
  quantityChange: number;
  reference?: string;
  reason?: string;
  createdAt: Date;
};

export type Patient = {
  _id: string;
  firstName: string;
  lastName: string;
  contact: string;
  age?: number;
  gender?: "Male" | "Female" | "Other";
  address?: string;
  is_primary?: boolean;
  associated_with_mobile?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
};

export type Appointment = {
  _id: string;
  patientId: string | Patient;
  serviceId?: string | Service;
  doctorId?: string | ManagedUser;
  referedBy?: string | ManagedUser;
  service: string; // Denormalized for display
  doctor: string; // Denormalized for display
  date: string;
  time: string;
  status: "Confirmed" | "Pending" | "Cancelled" | "Completed";
  notes?: string;
  deletedAt?: Date;
  type?: "online" | "offline";
  meeting?: {
    channel: string;
    linkId: string;
    expiresAt: Date;
    startedAt?: Date;
    endedAt?: Date;
    duration?: number;
  };
  createdAt?: Date;
  updatedAt?: Date;
  patientName?: string;
  patientPhone?: string;
};

export type PortfolioItem = {
  _id: string;
  title: string;
  imageUrl: string;
};

export type Testimonial = {
  _id: string;
  clientName: string;
  text: string;
  avatarUrl: string;
};

export type Service = {
  id: string;
  _id: string;
  name: string;
  description: string;
  price: number;
  doctor_ids: Array<string | { _id: string; name: string; email: string }>;
  status: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type BloodReport = {
  _id: string;
  patientId: string;
  patientName: string;
  fileUrl: string;
  fileName: string;
  uploadedBy: string;
  uploadedById: string;
  createdAt?: Date;
  deletedAt?: Date;
};

export type Prescription = {
  _id: string;
  patientId: string;
  patientName: string;
  fileUrl: string;
  fileName: string;
  uploadedBy: string;
  uploadedById: string;
  createdAt?: Date;
  deletedAt?: Date;
};

export const allowedRoles = [
  "admin",
  "doctor",
  "staff",
  "receptionist",
] as const;
export type RoleName = (typeof allowedRoles)[number];

export type ManagedUser = {
  _id: string;
  id: string; // Added for compatibility with existing code
  name: string;
  email: string;
  role: string; // Now dynamic, matches backend
  avatarUrl: string;
  permissions: string[];
  password?: string;
  specialization?: string;
  bio?: string;
  availableSlots?: string[];
  phone: string;
};

export type Coupon = {
  _id: string;
  code: string;
  discount: number;
  discountType: "percentage" | "fixed";
  expiryDate: string;
  status: "Active" | "Expired";
};

export type Activity = {
  _id: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
};

export type BlogPost = {
  _id: string;
  title: string;
  content: string;
  author: string;
  date: string;
  imageUrl: string;
};

export type CmsContent = {
  _id: string;
  page: "home" | "about" | "contact";
  section: string;
  data: any;
};

export type Summary = {
  _id: string;
  userId: string;
  userName: string;
  date: string; // YYYY-MM-DD
  content: string;
  createdAt?: Date;
};

export type ActivityLog = {
  _id: string;
  actor: {
    _id: string;
    name: string;
  };
  action: string;
  entity: {
    type: string;
    _id: string;
    name?: string;
  };
  details: any;
  request: {
    ip?: string;
    userAgent?: string;
  };
  createdAt?: Date;
  updatedAt?: Date;
};

export type TimeSlotSettings = {
  _id: string;
  slots: string[];
};
