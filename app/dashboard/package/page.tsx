"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/rich-text-editor";
import { X } from "lucide-react";
import { sanitizeHtml } from "@/lib/sanitize";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MoreHorizontal,
  PlusCircle,
  Edit,
  Trash2,
  Stethoscope,
  Loader2,
  Package,
  Users,
  CreditCard,
  FileText,
  ShoppingCart,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { usePermission } from "@/hooks/use-permission";

type PricingPlan = {
  _id?: string;
  id?: string;
  name: string;
  description: string;
  yearlyPrice: number;
  monthlyPrice: number;
  igst: number;
  cgst: number;
  sgst: number;
  monthlyPriceDiscount: number;
  finalMonthlyPrice: number;
  yearlyPriceDiscount: number;
  finalYearlyPrice: number;
  popular: boolean;
  features: {
    featureId:
      | {
          _id: string;
          name: string;
          status: string;
        }
      | string;
    value: string;
    _id?: string;
  }[];
  status: string;
};

type PackageUser = {
  _id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  pincode: string;
  city: string;
  state: string;
  status?: string;
};

type Subscription = {
  _id: string;
  userId:
    | {
        _id: string;
        name: string;
        phone: string;
        email: string;
        address: string;
        city: string;
        state: string;
      }
    | string;
  pricingId:
    | {
        _id: string;
        name: string;
        description: string;
        finalMonthlyPrice: number;
        finalYearlyPrice: number;
      }
    | string;
  packageName: string;
  price: number;
  startDate: string;
  endDate: string;
  paymentId: string;
  paymentStatus: "Paid" | "Pending" | "Failed";
  planType: "yearly" | "monthly";
  status: "Active" | "Cancelled" | "Expired";
  created_at?: string;
};

type PackageFeature = {
  _id: string;
  name: string;
  status: "Active" | "Inactive";
  createdAt?: string;
  updatedAt?: string;
};

type AddOnPricing = {
  _id?: string;
  name: string;
  description: string;
  yearlyPrice: number;
  monthlyPrice: number;
  igst: number;
  cgst: number;
  sgst: number;
  monthlyPriceDiscount: number;
  finalMonthlyPrice: number;
  yearlyPriceDiscount: number;
  finalYearlyPrice: number;
  popular: boolean;
  status: string;
};

type AddOnSubscription = {
  _id: string;
  userId:
    | {
        _id: string;
        name: string;
        phone: string;
        email: string;
        address: string;
        city: string;
        state: string;
      }
    | string;
  pricingId:
    | {
        _id: string;
        name: string;
        description: string;
        finalMonthlyPrice: number;
        finalYearlyPrice: number;
      }
    | string;
  packageName: string;
  price: number;
  startDate: string;
  endDate: string;
  paymentId: string;
  paymentStatus: "Paid" | "Pending" | "Failed";
  planType: "yearly" | "monthly";
  status: "Active" | "Cancelled" | "Expired";
  created_at?: string;
};

export default function PackagePage() {
  const { user, token, authFetch, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const { can } = usePermission();

  const [activeTab, setActiveTab] = useState("pricing");
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [togglingStatus, setTogglingStatus] = useState<string | null>(null);
  const [dialogType, setDialogType] = useState<
    | "pricing"
    | "user"
    | "subscription"
    | "feature"
    | "addon-pricing"
    | "addon-subscription"
  >("pricing");

  // Pricing Plans State
  const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>([]);
  const [selectedPricing, setSelectedPricing] = useState<PricingPlan | null>(
    null
  );
  const [editingPricing, setEditingPricing] = useState<Partial<PricingPlan>>(
    {}
  );

  // Package Users State
  const [packageUsers, setPackageUsers] = useState<PackageUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<PackageUser | null>(null);
  const [editingUser, setEditingUser] = useState<Partial<PackageUser>>({});

  // Subscriptions State
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [selectedSubscription, setSelectedSubscription] =
    useState<Subscription | null>(null);
  const [editingSubscription, setEditingSubscription] = useState<
    Partial<Subscription>
  >({});

  // Package Features State
  const [packageFeatures, setPackageFeatures] = useState<PackageFeature[]>([]);
  const [selectedFeature, setSelectedFeature] = useState<PackageFeature | null>(
    null
  );
  const [editingFeature, setEditingFeature] = useState<Partial<PackageFeature>>(
    {}
  );
  const [featureInput, setFeatureInput] = useState("");
  const [viewDetailsDialog, setViewDetailsDialog] = useState(false);
  const [selectedPlanForView, setSelectedPlanForView] =
    useState<PricingPlan | null>(null);
  const [viewSubscriptionDialog, setViewSubscriptionDialog] = useState(false);
  const [selectedSubscriptionForView, setSelectedSubscriptionForView] =
    useState<Subscription | null>(null);
  const [viewAddOnDialog, setViewAddOnDialog] = useState(false);
  const [selectedAddOnForView, setSelectedAddOnForView] =
    useState<AddOnPricing | null>(null);
  const [viewAddOnSubDialog, setViewAddOnSubDialog] = useState(false);
  const [selectedAddOnSubForView, setSelectedAddOnSubForView] =
    useState<AddOnSubscription | null>(null);

  // Add-On Pricing State
  const [addOnPricing, setAddOnPricing] = useState<AddOnPricing[]>([]);
  const [selectedAddOnPricing, setSelectedAddOnPricing] =
    useState<AddOnPricing | null>(null);
  const [editingAddOnPricing, setEditingAddOnPricing] = useState<
    Partial<AddOnPricing>
  >({});

  // Add-On Subscriptions State
  const [addOnSubscriptions, setAddOnSubscriptions] = useState<
    AddOnSubscription[]
  >([]);
  const [selectedAddOnSubscription, setSelectedAddOnSubscription] =
    useState<AddOnSubscription | null>(null);
  const [editingAddOnSubscription, setEditingAddOnSubscription] = useState<
    Partial<AddOnSubscription>
  >({});

  // Auto-calculate final prices (price - discount)
  useEffect(() => {
    if (
      editingPricing.monthlyPrice !== undefined &&
      editingPricing.monthlyPriceDiscount !== undefined
    ) {
      const finalMonthly =
        (editingPricing.monthlyPrice || 0) -
        (editingPricing.monthlyPriceDiscount || 0);
      setEditingPricing((p) => ({
        ...p,
        finalMonthlyPrice: Math.max(0, finalMonthly),
      }));
    }
  }, [editingPricing.monthlyPrice, editingPricing.monthlyPriceDiscount]);

  useEffect(() => {
    if (
      editingPricing.yearlyPrice !== undefined &&
      editingPricing.yearlyPriceDiscount !== undefined
    ) {
      const finalYearly =
        (editingPricing.yearlyPrice || 0) -
        (editingPricing.yearlyPriceDiscount || 0);
      setEditingPricing((p) => ({
        ...p,
        finalYearlyPrice: Math.max(0, finalYearly),
      }));
    }
  }, [editingPricing.yearlyPrice, editingPricing.yearlyPriceDiscount]);

  // Auto-calculate final prices for add-on pricing
  useEffect(() => {
    if (
      editingAddOnPricing.monthlyPrice !== undefined &&
      editingAddOnPricing.monthlyPriceDiscount !== undefined
    ) {
      const finalMonthly =
        (editingAddOnPricing.monthlyPrice || 0) -
        (editingAddOnPricing.monthlyPriceDiscount || 0);
      setEditingAddOnPricing((p) => ({
        ...p,
        finalMonthlyPrice: Math.max(0, finalMonthly),
      }));
    }
  }, [
    editingAddOnPricing.monthlyPrice,
    editingAddOnPricing.monthlyPriceDiscount,
  ]);

  useEffect(() => {
    if (
      editingAddOnPricing.yearlyPrice !== undefined &&
      editingAddOnPricing.yearlyPriceDiscount !== undefined
    ) {
      const finalYearly =
        (editingAddOnPricing.yearlyPrice || 0) -
        (editingAddOnPricing.yearlyPriceDiscount || 0);
      setEditingAddOnPricing((p) => ({
        ...p,
        finalYearlyPrice: Math.max(0, finalYearly),
      }));
    }
  }, [
    editingAddOnPricing.yearlyPrice,
    editingAddOnPricing.yearlyPriceDiscount,
  ]);

  const fetchPricingPlans = useCallback(async () => {
    if (!token) return;
    try {
      const response = await authFetch("/api/pricing");
      if (!response.ok) throw new Error("Failed to fetch pricing plans");
      const data = await response.json();
      setPricingPlans(data);
    } catch (error) {
      if (!(error as Error).message.includes("Session expired")) {
        toast({
          variant: "destructive",
          title: "Error",
          description: (error as Error).message,
        });
      }
    }
  }, [token, toast, authFetch]);

  const fetchPackageUsers = useCallback(async () => {
    if (!token) return;
    try {
      const response = await authFetch("/api/package-users");
      if (!response.ok) throw new Error("Failed to fetch package users");
      const data = await response.json();
      setPackageUsers(data);
    } catch (error) {
      if (!(error as Error).message.includes("Session expired")) {
        toast({
          variant: "destructive",
          title: "Error",
          description: (error as Error).message,
        });
      }
    }
  }, [token, toast, authFetch]);

  const fetchSubscriptions = useCallback(async () => {
    if (!token) return;
    try {
      const response = await authFetch("/api/subscriptions");
      if (!response.ok) throw new Error("Failed to fetch subscriptions");
      const data = await response.json();
      setSubscriptions(data);
    } catch (error) {
      if (!(error as Error).message.includes("Session expired")) {
        toast({
          variant: "destructive",
          title: "Error",
          description: (error as Error).message,
        });
      }
    }
  }, [token, toast, authFetch]);

  const fetchPackageFeatures = useCallback(async () => {
    if (!token) return;
    try {
      const response = await authFetch("/api/package-features");
      if (!response.ok) throw new Error("Failed to fetch package features");
      const data = await response.json();
      setPackageFeatures(data);
    } catch (error) {
      if (!(error as Error).message.includes("Session expired")) {
        toast({
          variant: "destructive",
          title: "Error",
          description: (error as Error).message,
        });
      }
    }
  }, [token, toast, authFetch]);

  const fetchAddOnPricing = useCallback(async () => {
    if (!token) return;
    try {
      const response = await authFetch("/api/addon-pricing");
      if (!response.ok) throw new Error("Failed to fetch add-on pricing");
      const result = await response.json();
      setAddOnPricing(result.data || result);
    } catch (error) {
      if (!(error as Error).message.includes("Session expired")) {
        toast({
          variant: "destructive",
          title: "Error",
          description: (error as Error).message,
        });
      }
    }
  }, [token, toast, authFetch]);

  const fetchAddOnSubscriptions = useCallback(async () => {
    if (!token) return;
    try {
      const response = await authFetch("/api/addon-subscriptions");
      if (!response.ok) throw new Error("Failed to fetch add-on subscriptions");
      const result = await response.json();
      setAddOnSubscriptions(result.data || result);
    } catch (error) {
      if (!(error as Error).message.includes("Session expired")) {
        toast({
          variant: "destructive",
          title: "Error",
          description: (error as Error).message,
        });
      }
    }
  }, [token, toast, authFetch]);

  useEffect(() => {
    if (!authLoading) {
      if (!can("view", pathname)) {
        router.push("/dashboard");
      } else if (token) {
        setIsLoading(true);
        Promise.all([
          fetchPricingPlans(),
          fetchPackageUsers(),
          fetchSubscriptions(),
          fetchPackageFeatures(),
          fetchAddOnPricing(),
          fetchAddOnSubscriptions(),
        ]).finally(() => setIsLoading(false));
      }
    }
  }, [
    user,
    authLoading,
    token,
    router,
    pathname,
    fetchPricingPlans,
    fetchPackageUsers,
    fetchSubscriptions,
  ]);

  const handleAddNew = (
    type:
      | "pricing"
      | "user"
      | "subscription"
      | "feature"
      | "addon-pricing"
      | "addon-subscription"
  ) => {
    setDialogType(type);
    if (type === "pricing") {
      setSelectedPricing(null);
      setEditingPricing({
        features: [],
        popular: false,
        status: "Active",
        igst: 0,
        cgst: 0,
        sgst: 0,
        monthlyPriceDiscount: 0,
        yearlyPriceDiscount: 0,
      });
    } else if (type === "user") {
      setSelectedUser(null);
      setEditingUser({});
    } else if (type === "subscription") {
      setSelectedSubscription(null);
      setEditingSubscription({ planType: "yearly", paymentStatus: "Pending" });
    } else if (type === "feature") {
      setSelectedFeature(null);
      setEditingFeature({ status: "Active" });
    } else if (type === "addon-pricing") {
      setSelectedAddOnPricing(null);
      setEditingAddOnPricing({
        popular: false,
        status: "Active",
        igst: 0,
        cgst: 0,
        sgst: 0,
        monthlyPriceDiscount: 0,
        yearlyPriceDiscount: 0,
      });
    } else if (type === "addon-subscription") {
      setSelectedAddOnSubscription(null);
      setEditingAddOnSubscription({
        planType: "yearly",
        paymentStatus: "Pending",
      });
    }
    setIsDialogOpen(true);
  };

  const handleEdit = (
    type:
      | "pricing"
      | "user"
      | "subscription"
      | "feature"
      | "addon-pricing"
      | "addon-subscription",
    item: any
  ) => {
    setDialogType(type);
    if (type === "pricing") {
      setSelectedPricing(item);
      setEditingPricing(item);
    } else if (type === "user") {
      setSelectedUser(item);
      setEditingUser(item);
    } else if (type === "subscription") {
      setSelectedSubscription(item);
      // Ensure package name is properly mapped from pricing plan
      const pricingId =
        typeof item.pricingId === "object"
          ? item.pricingId._id
          : item.pricingId;
      const selectedPlan = pricingPlans.find((p) => p._id === pricingId);
      setEditingSubscription({
        ...item,
        pricingId: pricingId,
        userId: typeof item.userId === "object" ? item.userId._id : item.userId,
        packageName: selectedPlan?.name || item.packageName,
      });
    } else if (type === "feature") {
      setSelectedFeature(item);
      setEditingFeature(item);
    } else if (type === "addon-pricing") {
      setSelectedAddOnPricing(item);
      setEditingAddOnPricing(item);
    } else if (type === "addon-subscription") {
      setSelectedAddOnSubscription(item);
      const pricingId =
        typeof item.pricingId === "object"
          ? item.pricingId._id
          : item.pricingId;
      const selectedPlan = addOnPricing.find((p) => p._id === pricingId);
      setEditingAddOnSubscription({
        ...item,
        pricingId: pricingId,
        userId: typeof item.userId === "object" ? item.userId._id : item.userId,
        packageName: selectedPlan?.name || item.packageName,
      });
    }
    setIsDialogOpen(true);
  };

  const handleDelete = async (
    type:
      | "pricing"
      | "user"
      | "subscription"
      | "feature"
      | "addon-pricing"
      | "addon-subscription",
    id: string
  ) => {
    if (!token) return;
    try {
      const endpoints = {
        pricing: `/api/pricing/${id}`,
        user: `/api/package-users/${id}`,
        subscription: `/api/subscriptions/${id}`,
        feature: `/api/package-features/${id}`,
        "addon-pricing": `/api/addon-pricing/${id}`,
        "addon-subscription": `/api/addon-subscriptions/${id}`,
      };

      const response = await authFetch(endpoints[type], { method: "DELETE" });
      if (!response.ok) throw new Error(`Failed to delete ${type}`);

      toast({ title: "Success", description: `${type} has been deleted.` });

      if (type === "pricing") await fetchPricingPlans();
      else if (type === "user") await fetchPackageUsers();
      else if (type === "subscription") await fetchSubscriptions();
      else if (type === "feature") await fetchPackageFeatures();
      else if (type === "addon-pricing") await fetchAddOnPricing();
      else if (type === "addon-subscription") await fetchAddOnSubscriptions();
    } catch (error) {
      if (!(error as Error).message.includes("Session expired")) {
        toast({
          variant: "destructive",
          title: "Error",
          description: `Could not delete ${type}.`,
        });
      }
    }
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!token) return;
    setIsSaving(true);

    try {
      let url, method, body;

      if (dialogType === "pricing") {
        url = selectedPricing
          ? `/api/pricing/${selectedPricing._id}`
          : "/api/pricing";
        method = selectedPricing ? "PUT" : "POST";
        const { _id, ...pricingData } = editingPricing;
        body = selectedPricing ? editingPricing : pricingData;
      } else if (dialogType === "user") {
        url = selectedUser
          ? `/api/package-users/${selectedUser._id}`
          : "/api/package-users";
        method = selectedUser ? "PUT" : "POST";
        body = editingUser;
      } else if (dialogType === "subscription") {
        url = selectedSubscription
          ? `/api/subscriptions/${selectedSubscription._id}`
          : "/api/subscriptions";
        method = selectedSubscription ? "PUT" : "POST";
        body = editingSubscription;
      } else if (dialogType === "feature") {
        url = selectedFeature
          ? `/api/package-features/${selectedFeature._id}`
          : "/api/package-features";
        method = selectedFeature ? "PUT" : "POST";
        body = editingFeature;
      } else if (dialogType === "addon-pricing") {
        url = selectedAddOnPricing
          ? `/api/addon-pricing/${selectedAddOnPricing._id}`
          : "/api/addon-pricing";
        method = selectedAddOnPricing ? "PUT" : "POST";
        const { _id, ...addonPricingData } = editingAddOnPricing;
        body = selectedAddOnPricing ? editingAddOnPricing : addonPricingData;
      } else {
        url = selectedAddOnSubscription
          ? `/api/addon-subscriptions/${selectedAddOnSubscription._id}`
          : "/api/addon-subscriptions";
        method = selectedAddOnSubscription ? "PUT" : "POST";
        body = editingAddOnSubscription;
      }

      const response = await authFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to save ${dialogType}.`);
      }

      toast({
        title: "Success",
        description: `${dialogType} ${
          selectedPricing ||
          selectedUser ||
          selectedSubscription ||
          selectedFeature ||
          selectedAddOnPricing ||
          selectedAddOnSubscription
            ? "updated"
            : "created"
        } successfully.`,
      });

      setIsDialogOpen(false);

      if (dialogType === "pricing") await fetchPricingPlans();
      else if (dialogType === "user") await fetchPackageUsers();
      else if (dialogType === "subscription") await fetchSubscriptions();
      else if (dialogType === "feature") await fetchPackageFeatures();
      else if (dialogType === "addon-pricing") await fetchAddOnPricing();
      else if (dialogType === "addon-subscription")
        await fetchAddOnSubscriptions();
    } catch (error) {
      if (!(error as Error).message.includes("Session expired")) {
        toast({
          variant: "destructive",
          title: "Error",
          description: (error as Error).message,
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDialogChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setSelectedPricing(null);
      setSelectedUser(null);
      setSelectedSubscription(null);
      setSelectedFeature(null);
      setSelectedAddOnPricing(null);
      setSelectedAddOnSubscription(null);
      setEditingPricing({});
      setEditingUser({});
      setEditingSubscription({});
      setEditingFeature({});
      setEditingAddOnPricing({});
      setEditingAddOnSubscription({});
      setFeatureInput("");
    }
  };

  if (authLoading || !user || !can("view", pathname)) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Stethoscope className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
        <DialogContent className="sm:max-w-4xl flex flex-col max-h-[90vh]">
          <DialogHeader className="p-6 pb-4 border-b">
            <DialogTitle>
              {dialogType === "pricing" &&
                (selectedPricing
                  ? "Edit Pricing Plan"
                  : "Add New Pricing Plan")}
              {dialogType === "user" &&
                (selectedUser ? "Edit Package User" : "Add New Package User")}
              {dialogType === "subscription" &&
                (selectedSubscription
                  ? "Edit Subscription"
                  : "Add New Subscription")}
              {dialogType === "feature" &&
                (selectedFeature ? "Edit Feature" : "Add New Feature")}
              {dialogType === "addon-pricing" &&
                (selectedAddOnPricing
                  ? "Edit Add-On Pricing"
                  : "Add New Add-On Pricing")}
              {dialogType === "addon-subscription" &&
                (selectedAddOnSubscription
                  ? "Edit Add-On Subscription"
                  : "Add New Add-On Subscription")}
            </DialogTitle>
            <DialogDescription>
              {dialogType === "pricing" &&
                (selectedPricing
                  ? "Update the pricing plan details."
                  : "Create a new pricing plan.")}
              {dialogType === "user" &&
                (selectedUser
                  ? "Update the user details."
                  : "Add a new package user.")}
              {dialogType === "subscription" &&
                (selectedSubscription
                  ? "Update the subscription details."
                  : "Create a new subscription.")}
              {dialogType === "feature" &&
                (selectedFeature
                  ? "Update the feature details."
                  : "Create a new feature.")}
              {dialogType === "addon-pricing" &&
                (selectedAddOnPricing
                  ? "Update the add-on pricing details."
                  : "Create a new add-on pricing plan.")}
              {dialogType === "addon-subscription" &&
                (selectedAddOnSubscription
                  ? "Update the add-on subscription details."
                  : "Create a new add-on subscription.")}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto">
            <form
              id="package-form"
              onSubmit={handleSave}
              className="grid gap-4 p-6"
            >
              {dialogType === "pricing" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={editingPricing.name || ""}
                      onChange={(e) =>
                        setEditingPricing((p) => ({
                          ...p,
                          name: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <RichTextEditor
                      value={editingPricing.description || ""}
                      onChange={(value) =>
                        setEditingPricing((p) => ({ ...p, description: value }))
                      }
                      placeholder="Enter pricing plan description..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="monthlyPrice">Monthly Price (₹)</Label>
                      <Input
                        id="monthlyPrice"
                        type="number"
                        value={editingPricing.monthlyPrice || ""}
                        onChange={(e) =>
                          setEditingPricing((p) => ({
                            ...p,
                            monthlyPrice: parseInt(e.target.value),
                          }))
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="yearlyPrice">Yearly Price (₹)</Label>
                      <Input
                        id="yearlyPrice"
                        type="number"
                        value={editingPricing.yearlyPrice || ""}
                        onChange={(e) =>
                          setEditingPricing((p) => ({
                            ...p,
                            yearlyPrice: parseInt(e.target.value),
                          }))
                        }
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="igst">IGST (%)</Label>
                      <Input
                        id="igst"
                        type="number"
                        value={editingPricing.igst || 0}
                        onChange={(e) =>
                          setEditingPricing((p) => ({
                            ...p,
                            igst: parseInt(e.target.value) || 0,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cgst">CGST (%)</Label>
                      <Input
                        id="cgst"
                        type="number"
                        value={editingPricing.cgst || 0}
                        onChange={(e) =>
                          setEditingPricing((p) => ({
                            ...p,
                            cgst: parseInt(e.target.value) || 0,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sgst">SGST (%)</Label>
                      <Input
                        id="sgst"
                        type="number"
                        value={editingPricing.sgst || 0}
                        onChange={(e) =>
                          setEditingPricing((p) => ({
                            ...p,
                            sgst: parseInt(e.target.value) || 0,
                          }))
                        }
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="monthlyPriceDiscount">
                        Monthly Discount (₹)
                      </Label>
                      <Input
                        id="monthlyPriceDiscount"
                        type="number"
                        value={editingPricing.monthlyPriceDiscount || 0}
                        onChange={(e) =>
                          setEditingPricing((p) => ({
                            ...p,
                            monthlyPriceDiscount: parseInt(e.target.value) || 0,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="yearlyPriceDiscount">
                        Yearly Discount (₹)
                      </Label>
                      <Input
                        id="yearlyPriceDiscount"
                        type="number"
                        value={editingPricing.yearlyPriceDiscount || 0}
                        onChange={(e) =>
                          setEditingPricing((p) => ({
                            ...p,
                            yearlyPriceDiscount: parseInt(e.target.value) || 0,
                          }))
                        }
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="finalMonthlyPrice">
                        Final Monthly Price (₹)
                      </Label>
                      <Input
                        id="finalMonthlyPrice"
                        type="number"
                        value={editingPricing.finalMonthlyPrice || ""}
                        onChange={(e) =>
                          setEditingPricing((p) => ({
                            ...p,
                            finalMonthlyPrice: parseInt(e.target.value) || 0,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="finalYearlyPrice">
                        Final Yearly Price (₹)
                      </Label>
                      <Input
                        id="finalYearlyPrice"
                        type="number"
                        value={editingPricing.finalYearlyPrice || ""}
                        onChange={(e) =>
                          setEditingPricing((p) => ({
                            ...p,
                            finalYearlyPrice: parseInt(e.target.value) || 0,
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={editingPricing.status || "Active"}
                      onValueChange={(value) =>
                        setEditingPricing((p) => ({ ...p, status: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="popular"
                      checked={editingPricing.popular || false}
                      onCheckedChange={(checked) =>
                        setEditingPricing((p) => ({ ...p, popular: !!checked }))
                      }
                    />
                    <Label htmlFor="popular">Popular Plan</Label>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-semibold">
                        Plan Features
                      </Label>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {(editingPricing.features || []).length} selected
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {
                            packageFeatures.filter((f) => f.status === "Active")
                              .length
                          }{" "}
                          available
                        </Badge>
                      </div>
                    </div>

                    <div className="border rounded-lg p-4 bg-gradient-to-br from-blue-50/50 to-indigo-50/50">
                      {(() => {
                        const availableFeatures = packageFeatures.filter(
                          (f) => {
                            if (f.status !== "Active") return false;
                            const isAlreadyAdded = (
                              editingPricing.features || []
                            ).some((pf) => {
                              const pfId =
                                typeof pf.featureId === "object"
                                  ? pf.featureId._id
                                  : pf.featureId;
                              return pfId === f._id;
                            });
                            return !isAlreadyAdded;
                          }
                        );
                        return availableFeatures.length > 0;
                      })() ? (
                        <div className="mb-3">
                          <Select
                            onValueChange={(featureId) => {
                              const selectedFeature = packageFeatures.find(
                                (f) => f._id === featureId
                              );
                              if (selectedFeature && editingPricing) {
                                const currentFeatures =
                                  editingPricing.features || [];
                                const featureExists = currentFeatures.some(
                                  (f) => {
                                    const fId =
                                      typeof f.featureId === "object"
                                        ? f.featureId._id
                                        : f.featureId;
                                    return fId === featureId;
                                  }
                                );
                                if (!featureExists) {
                                  setEditingPricing((p) => ({
                                    ...p,
                                    features: [
                                      ...currentFeatures,
                                      { featureId, value: "" },
                                    ],
                                  }));
                                }
                              }
                            }}
                          >
                            <SelectTrigger className="bg-white border-dashed border-2 hover:border-blue-300 transition-colors">
                              <SelectValue placeholder="+ Add a feature to this plan" />
                            </SelectTrigger>
                            <SelectContent>
                              {(() => {
                                const availableFeatures =
                                  packageFeatures.filter((f) => {
                                    if (f.status !== "Active") return false;
                                    const isAlreadyAdded = (
                                      editingPricing.features || []
                                    ).some((pf) => {
                                      const pfId =
                                        typeof pf.featureId === "object"
                                          ? pf.featureId._id
                                          : pf.featureId;
                                      return pfId === f._id;
                                    });
                                    return !isAlreadyAdded;
                                  });
                                return availableFeatures.map((feature) => (
                                  <SelectItem
                                    key={feature._id}
                                    value={feature._id}
                                  >
                                    <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                      {feature.name}
                                    </div>
                                  </SelectItem>
                                ));
                              })()}
                            </SelectContent>
                          </Select>
                        </div>
                      ) : (
                        <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center gap-2 text-green-700">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-sm font-medium">
                              All available features have been added to this
                              plan
                            </span>
                          </div>
                          <p className="text-xs text-green-600 mt-1 ml-4">
                            You can manage feature values below or create new
                            features in the Features tab.
                          </p>
                        </div>
                      )}

                      <div className="space-y-3">
                        {(editingPricing.features || []).map(
                          (feature, index) => {
                            const featureData =
                              typeof feature.featureId === "object"
                                ? feature.featureId
                                : packageFeatures.find(
                                    (f) => f._id === feature.featureId
                                  );
                            return (
                              <div
                                key={index}
                                className="group relative bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200 hover:border-blue-200"
                              >
                                <div className="flex items-start gap-3">
                                  <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mt-0.5">
                                    <Package className="w-4 h-4 text-blue-600" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-3">
                                      <div className="flex items-center gap-2">
                                        <h4 className="text-sm font-semibold text-gray-900">
                                          {featureData?.name ||
                                            "Unknown Feature"}
                                        </h4>
                                        <Badge
                                          variant="outline"
                                          className="text-xs px-2 py-0.5"
                                        >
                                          #{index + 1}
                                        </Badge>
                                      </div>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          const newFeatures = (
                                            editingPricing.features || []
                                          ).filter((_, i) => i !== index);
                                          setEditingPricing((p) => ({
                                            ...p,
                                            features: newFeatures,
                                          }));
                                        }}
                                        className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700 hover:bg-red-50 h-7 w-7 p-0 rounded-full"
                                        title="Remove feature"
                                      >
                                        <X className="h-3.5 w-3.5" />
                                      </Button>
                                    </div>
                                    <div className="space-y-2">
                                      <Label className="text-xs font-medium text-gray-600">
                                        Feature Value
                                      </Label>
                                      <Input
                                        placeholder="e.g., '10 users', 'Unlimited', '5GB storage'"
                                        value={feature.value}
                                        onChange={(e) => {
                                          const newFeatures = [
                                            ...(editingPricing.features || []),
                                          ];
                                          newFeatures[index] = {
                                            ...newFeatures[index],
                                            value: e.target.value,
                                            featureId:
                                              typeof newFeatures[index]
                                                .featureId === "object"
                                                ? newFeatures[index].featureId
                                                    ._id
                                                : newFeatures[index].featureId,
                                          };
                                          setEditingPricing((p) => ({
                                            ...p,
                                            features: newFeatures,
                                          }));
                                        }}
                                        className="text-sm border-gray-200 focus:border-blue-300 focus:ring-blue-200 bg-gray-50 focus:bg-white transition-colors"
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          }
                        )}

                        {(editingPricing.features || []).length === 0 && (
                          <div className="text-center py-12 text-gray-500">
                            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                              <Package className="w-8 h-8 text-gray-300" />
                            </div>
                            <h3 className="text-sm font-medium text-gray-900 mb-1">
                              No features added yet
                            </h3>
                            <p className="text-xs text-gray-500">
                              Add features to make your pricing plan more
                              attractive
                            </p>
                            {packageFeatures.filter(
                              (f) => f.status === "Active"
                            ).length === 0 && (
                              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                <p className="text-xs text-amber-700">
                                  No active features available. Create features
                                  in the Features tab first.
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {(editingPricing.features || []).length > 0 && (
                        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-start gap-2">
                            <div className="w-4 h-4 bg-blue-500 rounded-full flex-shrink-0 mt-0.5"></div>
                            <div>
                              <p className="text-xs font-medium text-blue-800">
                                Feature Management Tips
                              </p>
                              <ul className="text-xs text-blue-700 mt-1 space-y-1">
                                <li>
                                  • Use clear, specific values (e.g., "10 users"
                                  instead of just "users")
                                </li>
                                <li>
                                  • Consider using "Unlimited" for premium
                                  features
                                </li>
                                <li>
                                  • Keep feature values consistent across plans
                                </li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {dialogType === "user" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={editingUser.name || ""}
                      onChange={(e) =>
                        setEditingUser((u) => ({ ...u, name: e.target.value }))
                      }
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={editingUser.phone || ""}
                        onChange={(e) =>
                          setEditingUser((u) => ({
                            ...u,
                            phone: e.target.value,
                          }))
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={editingUser.email || ""}
                        onChange={(e) =>
                          setEditingUser((u) => ({
                            ...u,
                            email: e.target.value,
                          }))
                        }
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={editingUser.address || ""}
                      onChange={(e) =>
                        setEditingUser((u) => ({
                          ...u,
                          address: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="pincode">Pincode</Label>
                      <Input
                        id="pincode"
                        value={editingUser.pincode || ""}
                        onChange={(e) =>
                          setEditingUser((u) => ({
                            ...u,
                            pincode: e.target.value,
                          }))
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={editingUser.city || ""}
                        onChange={(e) =>
                          setEditingUser((u) => ({
                            ...u,
                            city: e.target.value,
                          }))
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        value={editingUser.state || ""}
                        onChange={(e) =>
                          setEditingUser((u) => ({
                            ...u,
                            state: e.target.value,
                          }))
                        }
                        required
                      />
                    </div>
                  </div>
                </>
              )}

              {dialogType === "subscription" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="userId">User</Label>
                    <Select
                      value={
                        typeof editingSubscription.userId === "string"
                          ? editingSubscription.userId
                          : editingSubscription.userId?._id || ""
                      }
                      onValueChange={(value) =>
                        setEditingSubscription((s) => ({ ...s, userId: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a user" />
                      </SelectTrigger>
                      <SelectContent>
                        {packageUsers.map((user) => (
                          <SelectItem key={user._id} value={user._id}>
                            {user.name} - {user.phone}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pricingId">Package Plan</Label>
                    <Select
                      value={
                        typeof editingSubscription.pricingId === "string"
                          ? editingSubscription.pricingId
                          : editingSubscription.pricingId?._id || ""
                      }
                      onValueChange={(value) => {
                        const selectedPlan = pricingPlans.find(
                          (p) => p._id === value
                        );
                        setEditingSubscription((s) => ({
                          ...s,
                          pricingId: value,
                          packageName: selectedPlan?.name || "",
                        }));
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a pricing plan" />
                      </SelectTrigger>
                      <SelectContent>
                        {pricingPlans.map((plan) => (
                          <SelectItem key={plan._id} value={plan._id}>
                            {plan.name} - ₹{plan.finalMonthlyPrice}/month
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="packageName">Package Name</Label>
                    <Input
                      id="packageName"
                      value={editingSubscription.packageName || ""}
                      readOnly
                      className="bg-muted"
                      placeholder="Auto-filled from selected plan"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="price">Price (₹)</Label>
                      <Input
                        id="price"
                        type="number"
                        value={editingSubscription.price || ""}
                        onChange={(e) =>
                          setEditingSubscription((s) => ({
                            ...s,
                            price: parseInt(e.target.value),
                          }))
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="paymentId">Payment ID</Label>
                      <Input
                        id="paymentId"
                        value={editingSubscription.paymentId || ""}
                        onChange={(e) =>
                          setEditingSubscription((s) => ({
                            ...s,
                            paymentId: e.target.value,
                          }))
                        }
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="paymentStatus">Payment Status</Label>
                      <Select
                        value={editingSubscription.paymentStatus || "Pending"}
                        onValueChange={(value) =>
                          setEditingSubscription((s) => ({
                            ...s,
                            paymentStatus: value as any,
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Paid">Paid</SelectItem>
                          <SelectItem value="Pending">Pending</SelectItem>
                          <SelectItem value="Failed">Failed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="planType">Plan Type</Label>
                      <Select
                        value={editingSubscription.planType || "yearly"}
                        onValueChange={(value) =>
                          setEditingSubscription((s) => ({
                            ...s,
                            planType: value as any,
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="yearly">Yearly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </>
              )}

              {dialogType === "feature" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="featureName">Feature Name</Label>
                    <Input
                      id="featureName"
                      value={editingFeature.name || ""}
                      onChange={(e) =>
                        setEditingFeature((f) => ({
                          ...f,
                          name: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="featureStatus">Status</Label>
                    <Select
                      value={editingFeature.status || "Active"}
                      onValueChange={(value) =>
                        setEditingFeature((f) => ({
                          ...f,
                          status: value as "Active" | "Inactive",
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {dialogType === "addon-pricing" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="addonName">Add-On Name</Label>
                    <Input
                      id="addonName"
                      value={editingAddOnPricing.name || ""}
                      onChange={(e) =>
                        setEditingAddOnPricing((p) => ({
                          ...p,
                          name: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="addonDescription">Description</Label>
                    <RichTextEditor
                      value={editingAddOnPricing.description || ""}
                      onChange={(value) =>
                        setEditingAddOnPricing((p) => ({
                          ...p,
                          description: value,
                        }))
                      }
                      placeholder="Enter add-on description..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="addonMonthlyPrice">
                        Monthly Price (₹)
                      </Label>
                      <Input
                        id="addonMonthlyPrice"
                        type="number"
                        value={editingAddOnPricing.monthlyPrice || ""}
                        onChange={(e) =>
                          setEditingAddOnPricing((p) => ({
                            ...p,
                            monthlyPrice: parseInt(e.target.value),
                          }))
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="addonYearlyPrice">Yearly Price (₹)</Label>
                      <Input
                        id="addonYearlyPrice"
                        type="number"
                        value={editingAddOnPricing.yearlyPrice || ""}
                        onChange={(e) =>
                          setEditingAddOnPricing((p) => ({
                            ...p,
                            yearlyPrice: parseInt(e.target.value),
                          }))
                        }
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="addonIgst">IGST (%)</Label>
                      <Input
                        id="addonIgst"
                        type="number"
                        value={editingAddOnPricing.igst || 0}
                        onChange={(e) =>
                          setEditingAddOnPricing((p) => ({
                            ...p,
                            igst: parseInt(e.target.value) || 0,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="addonCgst">CGST (%)</Label>
                      <Input
                        id="addonCgst"
                        type="number"
                        value={editingAddOnPricing.cgst || 0}
                        onChange={(e) =>
                          setEditingAddOnPricing((p) => ({
                            ...p,
                            cgst: parseInt(e.target.value) || 0,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="addonSgst">SGST (%)</Label>
                      <Input
                        id="addonSgst"
                        type="number"
                        value={editingAddOnPricing.sgst || 0}
                        onChange={(e) =>
                          setEditingAddOnPricing((p) => ({
                            ...p,
                            sgst: parseInt(e.target.value) || 0,
                          }))
                        }
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="addonMonthlyDiscount">
                        Monthly Discount (₹)
                      </Label>
                      <Input
                        id="addonMonthlyDiscount"
                        type="number"
                        value={editingAddOnPricing.monthlyPriceDiscount || 0}
                        onChange={(e) =>
                          setEditingAddOnPricing((p) => ({
                            ...p,
                            monthlyPriceDiscount: parseInt(e.target.value) || 0,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="addonYearlyDiscount">
                        Yearly Discount (₹)
                      </Label>
                      <Input
                        id="addonYearlyDiscount"
                        type="number"
                        value={editingAddOnPricing.yearlyPriceDiscount || 0}
                        onChange={(e) =>
                          setEditingAddOnPricing((p) => ({
                            ...p,
                            yearlyPriceDiscount: parseInt(e.target.value) || 0,
                          }))
                        }
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="addonFinalMonthly">
                        Final Monthly Price (₹)
                      </Label>
                      <Input
                        id="addonFinalMonthly"
                        type="number"
                        value={editingAddOnPricing.finalMonthlyPrice || ""}
                        onChange={(e) =>
                          setEditingAddOnPricing((p) => ({
                            ...p,
                            finalMonthlyPrice: parseInt(e.target.value) || 0,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="addonFinalYearly">
                        Final Yearly Price (₹)
                      </Label>
                      <Input
                        id="addonFinalYearly"
                        type="number"
                        value={editingAddOnPricing.finalYearlyPrice || ""}
                        onChange={(e) =>
                          setEditingAddOnPricing((p) => ({
                            ...p,
                            finalYearlyPrice: parseInt(e.target.value) || 0,
                          }))
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="addonStatus">Status</Label>
                    <Select
                      value={editingAddOnPricing.status || "Active"}
                      onValueChange={(value) =>
                        setEditingAddOnPricing((p) => ({ ...p, status: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="addonPopular"
                      checked={editingAddOnPricing.popular || false}
                      onCheckedChange={(checked) =>
                        setEditingAddOnPricing((p) => ({
                          ...p,
                          popular: !!checked,
                        }))
                      }
                    />
                    <Label htmlFor="addonPopular">Popular Add-On</Label>
                  </div>
                </>
              )}

              {dialogType === "addon-subscription" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="addonSubUserId">User</Label>
                    <Select
                      value={
                        typeof editingAddOnSubscription.userId === "string"
                          ? editingAddOnSubscription.userId
                          : editingAddOnSubscription.userId?._id || ""
                      }
                      onValueChange={(value) =>
                        setEditingAddOnSubscription((s) => ({
                          ...s,
                          userId: value,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a user" />
                      </SelectTrigger>
                      <SelectContent>
                        {packageUsers.map((user) => (
                          <SelectItem key={user._id} value={user._id}>
                            {user.name} - {user.phone}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="addonSubPricingId">Add-On Plan</Label>
                    <Select
                      value={
                        typeof editingAddOnSubscription.pricingId === "string"
                          ? editingAddOnSubscription.pricingId
                          : editingAddOnSubscription.pricingId?._id || ""
                      }
                      onValueChange={(value) => {
                        const selectedPlan = addOnPricing.find(
                          (p) => p._id === value
                        );
                        setEditingAddOnSubscription((s) => ({
                          ...s,
                          pricingId: value,
                          packageName: selectedPlan?.name || "",
                        }));
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select an add-on plan" />
                      </SelectTrigger>
                      <SelectContent>
                        {addOnPricing.map((plan) => (
                          <SelectItem key={plan._id} value={plan._id}>
                            {plan.name} - ₹{plan.finalMonthlyPrice}/month
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="addonSubPackageName">Package Name</Label>
                    <Input
                      id="addonSubPackageName"
                      value={editingAddOnSubscription.packageName || ""}
                      readOnly
                      className="bg-muted"
                      placeholder="Auto-filled from selected plan"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="addonSubPrice">Price (₹)</Label>
                      <Input
                        id="addonSubPrice"
                        type="number"
                        value={editingAddOnSubscription.price || ""}
                        onChange={(e) =>
                          setEditingAddOnSubscription((s) => ({
                            ...s,
                            price: parseInt(e.target.value),
                          }))
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="addonSubPaymentId">Payment ID</Label>
                      <Input
                        id="addonSubPaymentId"
                        value={editingAddOnSubscription.paymentId || ""}
                        onChange={(e) =>
                          setEditingAddOnSubscription((s) => ({
                            ...s,
                            paymentId: e.target.value,
                          }))
                        }
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="addonSubPaymentStatus">
                        Payment Status
                      </Label>
                      <Select
                        value={
                          editingAddOnSubscription.paymentStatus || "Pending"
                        }
                        onValueChange={(value) =>
                          setEditingAddOnSubscription((s) => ({
                            ...s,
                            paymentStatus: value as any,
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Paid">Paid</SelectItem>
                          <SelectItem value="Pending">Pending</SelectItem>
                          <SelectItem value="Failed">Failed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="addonSubPlanType">Plan Type</Label>
                      <Select
                        value={editingAddOnSubscription.planType || "yearly"}
                        onValueChange={(value) =>
                          setEditingAddOnSubscription((s) => ({
                            ...s,
                            planType: value as any,
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="yearly">Yearly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </>
              )}
            </form>
          </div>
          <DialogFooter className="p-6 pt-4 border-t">
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" form="package-form" disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSaving ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-600 via-gray-700 to-slate-800 p-4 text-white shadow-2xl">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white to-gray-100 bg-clip-text text-transparent">
                Package Management
              </h1>
              <p className="text-gray-100 text-sm">
                Manage pricing plans, users, and subscriptions
              </p>
            </div>
          </div>
        </div>
        <div className="absolute -top-4 -right-4 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
        <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-gray-400/20 rounded-full blur-2xl"></div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="pricing" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Pricing Plans
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Package Users
          </TabsTrigger>
          <TabsTrigger
            value="subscriptions"
            className="flex items-center gap-2"
          >
            <CreditCard className="h-4 w-4" />
            Subscriptions
          </TabsTrigger>
          <TabsTrigger value="features" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Features
          </TabsTrigger>
          <TabsTrigger value="addons" className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Add-Ons
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pricing" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Pricing Plans</CardTitle>
                  <CardDescription>
                    Manage subscription pricing plans and packages.
                  </CardDescription>
                </div>
                {can("edit", pathname) && (
                  <Button onClick={() => handleAddNew("pricing")}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Pricing Plan
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center h-24">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : pricingPlans.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-4">
                  {pricingPlans.map((plan) => (
                    <div key={plan._id} className="relative">
                      {plan.popular && (
                        <Badge className="absolute -top-3 left-6 z-50 bg-gradient-to-r from-blue-500 to-purple-500 border-0 shadow-md">
                          ⭐ Most Popular
                        </Badge>
                      )}
                      <div
                        className={cn(
                          "group relative overflow-hidden rounded-2xl border transition-all duration-300 hover:shadow-2xl hover:-translate-y-1",
                          plan.popular
                            ? "bg-gradient-to-br from-blue-50 via-white to-purple-50 border-blue-200 shadow-lg"
                            : "bg-gradient-to-br from-gray-50 via-white to-gray-50 hover:border-gray-300"
                        )}
                      >
                        {plan.popular && (
                          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500" />
                        )}
                        {can("edit", pathname) && (
                          <div className="absolute top-4 right-14 flex items-center gap-2">
                            <Switch
                              checked={plan.status === "Active"}
                              onCheckedChange={async (checked) => {
                                if (!token) return;
                                setTogglingStatus(plan._id);
                                try {
                                  const response = await authFetch(
                                    `/api/pricing/${plan._id}`,
                                    {
                                      method: "PUT",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({
                                        ...plan,
                                        status: checked ? "Active" : "Inactive",
                                      }),
                                    }
                                  );
                                  if (!response.ok) throw new Error("Failed to update status");
                                  await fetchPricingPlans();
                                  toast({
                                    title: "Success",
                                    description: `Plan ${checked ? "activated" : "deactivated"} successfully.`,
                                  });
                                } catch (error) {
                                  toast({
                                    variant: "destructive",
                                    title: "Error",
                                    description: "Failed to update status.",
                                  });
                                } finally {
                                  setTogglingStatus(null);
                                }
                              }}
                              disabled={togglingStatus === plan._id}
                              className="data-[state=checked]:bg-green-500"
                            />
                          </div>
                        )}
                        {(can("edit", pathname) || can("delete", pathname)) && (
                          <div className="absolute top-4 right-4 opacity-100 transition-opacity">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 bg-white/80 backdrop-blur-sm hover:bg-white shadow-sm"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                {can("edit", pathname) && (
                                  <DropdownMenuItem
                                    onClick={() => handleEdit("pricing", plan)}
                                  >
                                    <Edit className="mr-2 h-4 w-4" /> Edit
                                  </DropdownMenuItem>
                                )}
                                {can("delete", pathname) && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 px-2 py-1.5 text-sm h-auto font-normal"
                                        >
                                          <Trash2 className="mr-2 h-4 w-4" />{" "}
                                          Delete
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>
                                            Are you sure?
                                          </AlertDialogTitle>
                                          <AlertDialogDescription>
                                            This will permanently delete the "
                                            {plan.name}" pricing plan.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>
                                            Cancel
                                          </AlertDialogCancel>
                                          <AlertDialogAction
                                            onClick={() =>
                                              handleDelete("pricing", plan._id)
                                            }
                                            className={cn(
                                              buttonVariants({
                                                variant: "destructive",
                                              })
                                            )}
                                          >
                                            Delete
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        )}
                        <div className="p-6 space-y-6">
                          <div className="space-y-2">
                            <h3
                              className={cn(
                                "text-xl font-bold",
                                plan.popular
                                  ? "bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
                                  : "text-gray-900"
                              )}
                            >
                              {plan.name}
                            </h3>
                            <div className="text-sm text-gray-600 leading-relaxed prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: sanitizeHtml(plan.description) }} />
                          </div>

                          <div className="space-y-4">
                            <div className="relative">
                              <div className="flex items-baseline gap-2">
                                <span
                                  className={cn(
                                    "text-3xl font-bold",
                                    plan.popular
                                      ? "text-blue-600"
                                      : "text-gray-900"
                                  )}
                                >
                                  ₹{plan.finalMonthlyPrice.toLocaleString()}
                                </span>
                                <span className="text-gray-500">/month</span>
                                {plan.monthlyPriceDiscount > 0 && (
                                  <span className="text-sm text-gray-400 line-through">
                                    ₹{plan.monthlyPrice.toLocaleString()}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-lg font-medium text-gray-700">
                                  ₹{plan.finalYearlyPrice.toLocaleString()}
                                </span>
                                <span className="text-sm text-gray-500">
                                  /year
                                </span>
                                {plan.yearlyPriceDiscount > 0 && (
                                  <Badge
                                    variant="secondary"
                                    className="bg-green-100 text-green-700 border-green-200"
                                  >
                                    Save ₹
                                    {plan.yearlyPriceDiscount.toLocaleString()}
                                  </Badge>
                                )}
                              </div>
                            </div>

                            <div className="space-y-3">
                              <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                <Package className="w-4 h-4" />
                                Key Features
                              </h4>
                              <ul className="space-y-2">
                                {plan.features
                                  ?.slice(0, 4)
                                  .map((feature, index) => {
                                    const featureName =
                                      typeof feature?.featureId === "object"
                                        ? feature.featureId?.name
                                        : packageFeatures.find(
                                            (f) => f._id === feature?.featureId
                                          )?.name;
                                    return (
                                      <li
                                        key={index}
                                        className="flex items-start gap-3 text-sm"
                                      >
                                        <div
                                          className={cn(
                                            "w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0",
                                            plan.popular
                                              ? "bg-blue-500"
                                              : "bg-gray-400"
                                          )}
                                        />
                                        <div className="text-gray-700 leading-relaxed">
                                          <span className="font-medium">
                                            {featureName || "Unknown Feature"}
                                          </span>
                                          {feature?.value && (
                                            <span className="text-gray-500">
                                              : {feature.value}
                                            </span>
                                          )}
                                        </div>
                                      </li>
                                    );
                                  })}
                                {(plan.features?.length || 0) > 4 && (
                                  <li className="flex items-center gap-3 text-xs text-gray-500 font-medium mt-2 pt-2 border-t border-gray-100">
                                    <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                                    <span className="bg-gray-100 px-2 py-1 rounded-full text-xs font-medium">
                                      +{(plan.features?.length || 0) - 4} more features
                                    </span>
                                  </li>
                                )}
                              </ul>
                            </div>
                          </div>

                          <div className="mt-6 pt-4 border-t border-gray-100">
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 text-xs"
                                onClick={() => {
                                  setSelectedPlanForView(plan);
                                  setViewDetailsDialog(true);
                                }}
                              >
                                View Details
                              </Button>
                              {plan.popular && (
                                <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0 px-3 py-1">
                                  Recommended
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        {plan.popular && (
                          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 pointer-events-none" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No pricing plans found.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Package Users</CardTitle>
                  <CardDescription>
                    Manage users who have purchased packages.
                  </CardDescription>
                </div>
                {can("edit", pathname) && (
                  <Button onClick={() => handleAddNew("user")}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Package User
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead className="hidden md:table-cell">
                      Email
                    </TableHead>
                    <TableHead className="hidden lg:table-cell">City</TableHead>
                    <TableHead className="hidden lg:table-cell">
                      State
                    </TableHead>
                    {(can("edit", pathname) || can("delete", pathname)) && (
                      <TableHead>
                        <span className="sr-only">Actions</span>
                      </TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow key="loading-users">
                      <TableCell colSpan={6} className="h-24 text-center">
                        <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                      </TableCell>
                    </TableRow>
                  ) : packageUsers.length > 0 ? (
                    packageUsers.map((user) => (
                      <TableRow key={user._id}>
                        <TableCell className="font-medium">
                          {user.name}
                        </TableCell>
                        <TableCell>{user.phone}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          {user.email}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {user.city}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {user.state}
                        </TableCell>
                        {(can("edit", pathname) || can("delete", pathname)) && (
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  aria-haspopup="true"
                                  size="icon"
                                  variant="ghost"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                {can("edit", pathname) && (
                                  <DropdownMenuItem
                                    onClick={() => handleEdit("user", user)}
                                  >
                                    <Edit className="mr-2 h-4 w-4" /> Edit
                                  </DropdownMenuItem>
                                )}
                                {can("delete", pathname) && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 px-2 py-1.5 text-sm h-auto font-normal"
                                        >
                                          <Trash2 className="mr-2 h-4 w-4" />{" "}
                                          Delete
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>
                                            Are you sure?
                                          </AlertDialogTitle>
                                          <AlertDialogDescription>
                                            This will permanently delete the
                                            user "{user.name}".
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>
                                            Cancel
                                          </AlertDialogCancel>
                                          <AlertDialogAction
                                            onClick={() =>
                                              handleDelete("user", user._id)
                                            }
                                            className={cn(
                                              buttonVariants({
                                                variant: "destructive",
                                              })
                                            )}
                                          >
                                            Delete
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow key="no-package-users">
                      <TableCell colSpan={6} className="text-center">
                        No package users found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscriptions" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Subscriptions</CardTitle>
                  <CardDescription>
                    Manage active and inactive subscriptions.
                  </CardDescription>
                </div>
                {can("edit", pathname) && (
                  <Button onClick={() => handleAddNew("subscription")}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Subscription
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Package</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Plan Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden md:table-cell">
                      End Date
                    </TableHead>
                    <TableHead>
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow key="loading-subscriptions">
                      <TableCell colSpan={7} className="h-24 text-center">
                        <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                      </TableCell>
                    </TableRow>
                  ) : subscriptions.length > 0 ? (
                    subscriptions.map((subscription) => {
                      const userName =
                        typeof subscription.userId === "object" && subscription.userId
                          ? subscription.userId.name
                          : "Unknown User";
                      const userPhone =
                        typeof subscription.userId === "object" && subscription.userId
                          ? subscription.userId.phone
                          : "";
                      return (
                        <TableRow key={subscription._id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{userName}</div>
                              <div className="text-sm text-gray-500">
                                {userPhone}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            {subscription.packageName}
                          </TableCell>
                          <TableCell>
                            ₹{subscription.price.toLocaleString()}
                          </TableCell>
                          <TableCell className="capitalize">
                            {subscription.planType}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                subscription.status === "Active"
                                  ? "default"
                                  : subscription.status === "Expired"
                                  ? "destructive"
                                  : "secondary"
                              }
                            >
                              {subscription.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-sm">
                            {new Date(
                              subscription.endDate
                            ).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  aria-haspopup="true"
                                  size="icon"
                                  variant="ghost"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedSubscriptionForView(
                                      subscription
                                    );
                                    setViewSubscriptionDialog(true);
                                  }}
                                >
                                  <FileText className="mr-2 h-4 w-4" /> View
                                  Details
                                </DropdownMenuItem>
                                {can("edit", pathname) && (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleEdit("subscription", subscription)
                                    }
                                  >
                                    <Edit className="mr-2 h-4 w-4" /> Edit
                                  </DropdownMenuItem>
                                )}
                                {can("delete", pathname) && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 px-2 py-1.5 text-sm h-auto font-normal"
                                        >
                                          <Trash2 className="mr-2 h-4 w-4" />{" "}
                                          Delete
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>
                                            Are you sure?
                                          </AlertDialogTitle>
                                          <AlertDialogDescription>
                                            This will permanently delete the
                                            subscription for "
                                            {subscription.packageName}".
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>
                                            Cancel
                                          </AlertDialogCancel>
                                          <AlertDialogAction
                                            onClick={() =>
                                              handleDelete(
                                                "subscription",
                                                subscription._id
                                              )
                                            }
                                            className={cn(
                                              buttonVariants({
                                                variant: "destructive",
                                              })
                                            )}
                                          >
                                            Delete
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow key="no-subscriptions">
                      <TableCell colSpan={7} className="text-center">
                        No subscriptions found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Package Features</CardTitle>
                  <CardDescription>
                    Manage available features for pricing plans.
                  </CardDescription>
                </div>
                {can("edit", pathname) && (
                  <Button onClick={() => handleAddNew("feature")}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Feature
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Feature Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden md:table-cell">
                      Created
                    </TableHead>
                    {(can("edit", pathname) || can("delete", pathname)) && (
                      <TableHead>
                        <span className="sr-only">Actions</span>
                      </TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow key="loading-features">
                      <TableCell colSpan={4} className="h-24 text-center">
                        <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                      </TableCell>
                    </TableRow>
                  ) : packageFeatures.length > 0 ? (
                    packageFeatures.map((feature) => (
                      <TableRow key={feature._id}>
                        <TableCell className="font-medium">
                          {feature.name}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              feature.status === "Active"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {feature.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {feature.createdAt
                            ? new Date(feature.createdAt).toLocaleDateString()
                            : "-"}
                        </TableCell>
                        {(can("edit", pathname) || can("delete", pathname)) && (
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  aria-haspopup="true"
                                  size="icon"
                                  variant="ghost"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                {can("edit", pathname) && (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleEdit("feature", feature)
                                    }
                                  >
                                    <Edit className="mr-2 h-4 w-4" /> Edit
                                  </DropdownMenuItem>
                                )}
                                {can("delete", pathname) && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 px-2 py-1.5 text-sm h-auto font-normal"
                                        >
                                          <Trash2 className="mr-2 h-4 w-4" />{" "}
                                          Delete
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>
                                            Are you sure?
                                          </AlertDialogTitle>
                                          <AlertDialogDescription>
                                            This will permanently delete the
                                            feature "{feature.name}".
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>
                                            Cancel
                                          </AlertDialogCancel>
                                          <AlertDialogAction
                                            onClick={() =>
                                              handleDelete(
                                                "feature",
                                                feature._id
                                              )
                                            }
                                            className={cn(
                                              buttonVariants({
                                                variant: "destructive",
                                              })
                                            )}
                                          >
                                            Delete
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow key="no-features">
                      <TableCell colSpan={4} className="text-center">
                        No features found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="addons" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Add-On Pricing</CardTitle>
                    <CardDescription>
                      Manage add-on pricing plans.
                    </CardDescription>
                  </div>
                  {can("edit", pathname) && (
                    <Button onClick={() => handleAddNew("addon-pricing")}>
                      <PlusCircle className="mr-2 h-4 w-4" /> Add Pricing
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Monthly</TableHead>
                      <TableHead>Yearly</TableHead>
                      <TableHead>Status</TableHead>
                      {(can("edit", pathname) || can("delete", pathname)) && (
                        <TableHead>
                          <span className="sr-only">Actions</span>
                        </TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow key="loading-addon-pricing">
                        <TableCell colSpan={5} className="h-24 text-center">
                          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                        </TableCell>
                      </TableRow>
                    ) : addOnPricing.length > 0 ? (
                      addOnPricing.map((plan) => (
                        <TableRow key={plan._id}>
                          <TableCell className="font-medium">
                            <div>
                              <div>{plan.name}</div>
                              {plan.popular && (
                                <Badge
                                  variant="secondary"
                                  className="text-xs mt-1"
                                >
                                  Popular
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            ₹{plan.finalMonthlyPrice.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            ₹{plan.finalYearlyPrice.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                plan.status === "Active"
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {plan.status}
                            </Badge>
                          </TableCell>
                          {(can("edit", pathname) ||
                            can("delete", pathname)) && (
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    aria-haspopup="true"
                                    size="icon"
                                    variant="ghost"
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedAddOnForView(plan);
                                      setViewAddOnDialog(true);
                                    }}
                                  >
                                    <FileText className="mr-2 h-4 w-4" /> View
                                    Details
                                  </DropdownMenuItem>
                                  {can("edit", pathname) && (
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleEdit("addon-pricing", plan)
                                      }
                                    >
                                      <Edit className="mr-2 h-4 w-4" /> Edit
                                    </DropdownMenuItem>
                                  )}
                                  {can("delete", pathname) && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 px-2 py-1.5 text-sm h-auto font-normal"
                                          >
                                            <Trash2 className="mr-2 h-4 w-4" />{" "}
                                            Delete
                                          </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                          <AlertDialogHeader>
                                            <AlertDialogTitle>
                                              Are you sure?
                                            </AlertDialogTitle>
                                            <AlertDialogDescription>
                                              This will permanently delete the
                                              add-on pricing "{plan.name}".
                                            </AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter>
                                            <AlertDialogCancel>
                                              Cancel
                                            </AlertDialogCancel>
                                            <AlertDialogAction
                                              onClick={() =>
                                                handleDelete(
                                                  "addon-pricing",
                                                  plan._id
                                                )
                                              }
                                              className={cn(
                                                buttonVariants({
                                                  variant: "destructive",
                                                })
                                              )}
                                            >
                                              Delete
                                            </AlertDialogAction>
                                          </AlertDialogFooter>
                                        </AlertDialogContent>
                                      </AlertDialog>
                                    </>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          )}
                        </TableRow>
                      ))
                    ) : (
                      <TableRow key="no-addon-pricing">
                        <TableCell colSpan={5} className="text-center">
                          No add-on pricing found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Add-On Subscriptions</CardTitle>
                    <CardDescription>
                      Manage add-on subscriptions.
                    </CardDescription>
                  </div>
                  {can("edit", pathname) && (
                    <Button onClick={() => handleAddNew("addon-subscription")}>
                      <PlusCircle className="mr-2 h-4 w-4" /> Add Subscription
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Add-On</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>
                        <span className="sr-only">Actions</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow key="loading-addon-subscriptions">
                        <TableCell colSpan={5} className="h-24 text-center">
                          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                        </TableCell>
                      </TableRow>
                    ) : addOnSubscriptions.length > 0 ? (
                      addOnSubscriptions.map((subscription) => {
                        const userName =
                          typeof subscription.userId === "object" && subscription.userId
                            ? subscription.userId.name
                            : "Unknown User";
                        return (
                          <TableRow key={subscription._id}>
                            <TableCell>
                              <div className="font-medium">{userName}</div>
                            </TableCell>
                            <TableCell className="font-medium">
                              {subscription.packageName}
                            </TableCell>
                            <TableCell>
                              ₹{subscription.price.toLocaleString()}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  subscription.status === "Active"
                                    ? "default"
                                    : subscription.status === "Expired"
                                    ? "destructive"
                                    : "secondary"
                                }
                              >
                                {subscription.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    aria-haspopup="true"
                                    size="icon"
                                    variant="ghost"
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedAddOnSubForView(subscription);
                                      setViewAddOnSubDialog(true);
                                    }}
                                  >
                                    <FileText className="mr-2 h-4 w-4" /> View
                                    Details
                                  </DropdownMenuItem>
                                  {can("edit", pathname) && (
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleEdit(
                                          "addon-subscription",
                                          subscription
                                        )
                                      }
                                    >
                                      <Edit className="mr-2 h-4 w-4" /> Edit
                                    </DropdownMenuItem>
                                  )}
                                  {can("delete", pathname) && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 px-2 py-1.5 text-sm h-auto font-normal"
                                          >
                                            <Trash2 className="mr-2 h-4 w-4" />{" "}
                                            Delete
                                          </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                          <AlertDialogHeader>
                                            <AlertDialogTitle>
                                              Are you sure?
                                            </AlertDialogTitle>
                                            <AlertDialogDescription>
                                              This will permanently delete the
                                              add-on subscription for "
                                              {subscription.packageName}".
                                            </AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter>
                                            <AlertDialogCancel>
                                              Cancel
                                            </AlertDialogCancel>
                                            <AlertDialogAction
                                              onClick={() =>
                                                handleDelete(
                                                  "addon-subscription",
                                                  subscription._id
                                                )
                                              }
                                              className={cn(
                                                buttonVariants({
                                                  variant: "destructive",
                                                })
                                              )}
                                            >
                                              Delete
                                            </AlertDialogAction>
                                          </AlertDialogFooter>
                                        </AlertDialogContent>
                                      </AlertDialog>
                                    </>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow key="no-addon-subscriptions">
                        <TableCell colSpan={5} className="text-center">
                          No add-on subscriptions found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={viewDetailsDialog} onOpenChange={setViewDetailsDialog}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              {selectedPlanForView?.name} - Plan Details
            </DialogTitle>
            <DialogDescription>
              Complete information about this pricing plan
            </DialogDescription>
          </DialogHeader>
          {selectedPlanForView && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600">
                    Monthly Price
                  </Label>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-gray-900">
                      ₹{selectedPlanForView.finalMonthlyPrice.toLocaleString()}
                    </span>
                    {selectedPlanForView.monthlyPriceDiscount > 0 && (
                      <span className="text-sm text-gray-400 line-through">
                        ₹{selectedPlanForView.monthlyPrice.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600">
                    Yearly Price
                  </Label>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-gray-900">
                      ₹{selectedPlanForView.finalYearlyPrice.toLocaleString()}
                    </span>
                    {selectedPlanForView.yearlyPriceDiscount > 0 && (
                      <Badge
                        variant="secondary"
                        className="bg-green-100 text-green-700"
                      >
                        Save ₹
                        {selectedPlanForView.yearlyPriceDiscount.toLocaleString()}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-600">
                  Description
                </Label>
                <div
                  className="text-sm text-gray-700 leading-relaxed prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{
                    __html: sanitizeHtml(selectedPlanForView.description),
                  }}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600">
                    IGST
                  </Label>
                  <p className="text-sm font-medium">
                    {selectedPlanForView.igst}%
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600">
                    CGST
                  </Label>
                  <p className="text-sm font-medium">
                    {selectedPlanForView.cgst}%
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600">
                    SGST
                  </Label>
                  <p className="text-sm font-medium">
                    {selectedPlanForView.sgst}%
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium text-gray-600">
                  All Features ({selectedPlanForView.features?.length || 0})
                </Label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {selectedPlanForView.features?.map((feature, index) => {
                    const featureName =
                      typeof feature?.featureId === "object"
                        ? feature.featureId?.name
                        : packageFeatures.find(
                            (f) => f._id === feature?.featureId
                          )?.name;
                    return (
                      <div
                        key={index}
                        className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                        <div className="flex-1">
                          <span className="font-medium text-gray-900">
                            {featureName || "Unknown Feature"}
                          </span>
                          {feature?.value && (
                            <span className="text-gray-600 ml-2">
                              : {feature.value}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  }) || []}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      selectedPlanForView.status === "Active"
                        ? "default"
                        : "secondary"
                    }
                  >
                    {selectedPlanForView.status}
                  </Badge>
                  {selectedPlanForView.popular && (
                    <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0">
                      Popular Plan
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={viewSubscriptionDialog}
        onOpenChange={setViewSubscriptionDialog}
      >
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader className="pb-4 border-b">
            <DialogTitle className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-lg font-semibold">
                  Subscription Details
                </div>
                <div className="text-sm text-gray-500 font-normal">
                  ID: {selectedSubscriptionForView?._id}
                </div>
              </div>
            </DialogTitle>
          </DialogHeader>
          {selectedSubscriptionForView && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="w-4 h-4 text-blue-600" />
                    <h3 className="font-semibold text-gray-900">
                      Customer Information
                    </h3>
                  </div>
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold text-sm">
                            {typeof selectedSubscriptionForView.userId ===
                            "object" && selectedSubscriptionForView.userId
                              ? selectedSubscriptionForView.userId.name?.charAt(
                                  0
                                ) || "U"
                              : "U"}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {typeof selectedSubscriptionForView.userId ===
                            "object" && selectedSubscriptionForView.userId
                              ? selectedSubscriptionForView.userId.name
                              : "Unknown User"}
                          </div>
                          <div className="text-sm text-gray-600">
                            {typeof selectedSubscriptionForView.userId ===
                            "object" && selectedSubscriptionForView.userId
                              ? selectedSubscriptionForView.userId.phone
                              : ""}
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600">
                        <div>
                          {typeof selectedSubscriptionForView.userId ===
                          "object" && selectedSubscriptionForView.userId
                            ? selectedSubscriptionForView.userId.email
                            : ""}
                        </div>
                        {typeof selectedSubscriptionForView.userId ===
                          "object" && selectedSubscriptionForView.userId && (
                          <div className="mt-1">
                            {selectedSubscriptionForView.userId.address},{" "}
                            {selectedSubscriptionForView.userId.city},{" "}
                            {selectedSubscriptionForView.userId.state}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Package className="w-4 h-4 text-green-600" />
                    <h3 className="font-semibold text-gray-900">
                      Package Details
                    </h3>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl border border-green-100">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-gray-900">
                          {selectedSubscriptionForView.packageName}
                        </div>
                        <Badge className="bg-green-100 text-green-700 border-green-200 capitalize">
                          {selectedSubscriptionForView.planType}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-green-600">
                          ₹{selectedSubscriptionForView.price.toLocaleString()}
                        </span>
                        <span className="text-sm text-gray-500">
                          /{selectedSubscriptionForView.planType}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white border border-gray-200 p-4 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <Label className="text-sm font-medium text-gray-600">
                      Start Date
                    </Label>
                  </div>
                  <p className="font-semibold text-gray-900">
                    {new Date(
                      selectedSubscriptionForView.startDate
                    ).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <div className="bg-white border border-gray-200 p-4 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <Label className="text-sm font-medium text-gray-600">
                      End Date
                    </Label>
                  </div>
                  <p className="font-semibold text-gray-900">
                    {new Date(
                      selectedSubscriptionForView.endDate
                    ).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <div className="bg-white border border-gray-200 p-4 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <Label className="text-sm font-medium text-gray-600">
                      Duration
                    </Label>
                  </div>
                  <p className="font-semibold text-gray-900">
                    {Math.ceil(
                      (new Date(selectedSubscriptionForView.endDate).getTime() -
                        new Date(
                          selectedSubscriptionForView.startDate
                        ).getTime()) /
                        (1000 * 60 * 60 * 24)
                    )}{" "}
                    days
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white border border-gray-200 p-4 rounded-xl">
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-sm font-medium text-gray-600">
                      Payment Status
                    </Label>
                    <Badge
                      variant={
                        selectedSubscriptionForView.paymentStatus === "Paid"
                          ? "default"
                          : selectedSubscriptionForView.paymentStatus ===
                            "Pending"
                          ? "secondary"
                          : "destructive"
                      }
                    >
                      {selectedSubscriptionForView.paymentStatus}
                    </Badge>
                  </div>
                  <div className="text-xs font-mono bg-gray-50 p-2 rounded border">
                    {selectedSubscriptionForView.paymentId}
                  </div>
                </div>
                <div className="bg-white border border-gray-200 p-4 rounded-xl">
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-sm font-medium text-gray-600">
                      Subscription Status
                    </Label>
                    <Badge
                      variant={
                        selectedSubscriptionForView.status === "Active"
                          ? "default"
                          : selectedSubscriptionForView.status === "Expired"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {selectedSubscriptionForView.status}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-600">
                    Created:{" "}
                    {new Date(
                      selectedSubscriptionForView.created_at || ""
                    ).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="pt-4 border-t">
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={viewAddOnDialog} onOpenChange={setViewAddOnDialog}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              {selectedAddOnForView?.name} - Add-On Details
            </DialogTitle>
            <DialogDescription>
              Complete information about this add-on pricing plan
            </DialogDescription>
          </DialogHeader>
          {selectedAddOnForView && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600">
                    Monthly Price
                  </Label>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-gray-900">
                      ₹{selectedAddOnForView.finalMonthlyPrice.toLocaleString()}
                    </span>
                    {selectedAddOnForView.monthlyPriceDiscount > 0 && (
                      <span className="text-sm text-gray-400 line-through">
                        ₹{selectedAddOnForView.monthlyPrice.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600">
                    Yearly Price
                  </Label>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-gray-900">
                      ₹{selectedAddOnForView.finalYearlyPrice.toLocaleString()}
                    </span>
                    {selectedAddOnForView.yearlyPriceDiscount > 0 && (
                      <Badge
                        variant="secondary"
                        className="bg-green-100 text-green-700"
                      >
                        Save ₹
                        {selectedAddOnForView.yearlyPriceDiscount.toLocaleString()}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-600">
                  Description
                </Label>
                <div
                  className="text-sm text-gray-700 leading-relaxed prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{
                    __html: sanitizeHtml(selectedAddOnForView.description),
                  }}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600">
                    IGST
                  </Label>
                  <p className="text-sm font-medium">
                    {selectedAddOnForView.igst}%
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600">
                    CGST
                  </Label>
                  <p className="text-sm font-medium">
                    {selectedAddOnForView.cgst}%
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600">
                    SGST
                  </Label>
                  <p className="text-sm font-medium">
                    {selectedAddOnForView.sgst}%
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      selectedAddOnForView.status === "Active"
                        ? "default"
                        : "secondary"
                    }
                  >
                    {selectedAddOnForView.status}
                  </Badge>
                  {selectedAddOnForView.popular && (
                    <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0">
                      Popular Add-On
                    </Badge>
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  Created:{" "}
                  {new Date(
                    selectedAddOnForView.createdAt || ""
                  ).toLocaleDateString()}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={viewAddOnSubDialog} onOpenChange={setViewAddOnSubDialog}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader className="pb-4 border-b">
            <DialogTitle className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-lg font-semibold">
                  Add-On Subscription Details
                </div>
                <div className="text-sm text-gray-500 font-normal">
                  ID: {selectedAddOnSubForView?._id}
                </div>
              </div>
            </DialogTitle>
          </DialogHeader>
          {selectedAddOnSubForView && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="w-4 h-4 text-blue-600" />
                    <h3 className="font-semibold text-gray-900">
                      Customer Information
                    </h3>
                  </div>
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold text-sm">
                            {typeof selectedAddOnSubForView.userId === "object" && selectedAddOnSubForView.userId
                              ? selectedAddOnSubForView.userId.name?.charAt(0) || "U"
                              : "U"}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {typeof selectedAddOnSubForView.userId === "object" && selectedAddOnSubForView.userId
                              ? selectedAddOnSubForView.userId.name
                              : "Unknown User"}
                          </div>
                          <div className="text-sm text-gray-600">
                            {typeof selectedAddOnSubForView.userId === "object" && selectedAddOnSubForView.userId
                              ? selectedAddOnSubForView.userId.phone
                              : ""}
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600">
                        <div>
                          {typeof selectedAddOnSubForView.userId === "object" && selectedAddOnSubForView.userId
                            ? selectedAddOnSubForView.userId.email
                            : ""}
                        </div>
                        {typeof selectedAddOnSubForView.userId === "object" && selectedAddOnSubForView.userId && (
                          <div className="mt-1">
                            {selectedAddOnSubForView.userId.address},{" "}
                            {selectedAddOnSubForView.userId.city},{" "}
                            {selectedAddOnSubForView.userId.state}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-3">
                    <ShoppingCart className="w-4 h-4 text-green-600" />
                    <h3 className="font-semibold text-gray-900">
                      Add-On Details
                    </h3>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl border border-green-100">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-gray-900">
                          {selectedAddOnSubForView.packageName}
                        </div>
                        <Badge className="bg-green-100 text-green-700 border-green-200 capitalize">
                          {selectedAddOnSubForView.planType}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-green-600">
                          ₹{selectedAddOnSubForView.price.toLocaleString()}
                        </span>
                        <span className="text-sm text-gray-500">
                          /{selectedAddOnSubForView.planType}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white border border-gray-200 p-4 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <Label className="text-sm font-medium text-gray-600">
                      Start Date
                    </Label>
                  </div>
                  <p className="font-semibold text-gray-900">
                    {new Date(
                      selectedAddOnSubForView.startDate
                    ).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <div className="bg-white border border-gray-200 p-4 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <Label className="text-sm font-medium text-gray-600">
                      End Date
                    </Label>
                  </div>
                  <p className="font-semibold text-gray-900">
                    {new Date(
                      selectedAddOnSubForView.endDate
                    ).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <div className="bg-white border border-gray-200 p-4 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <Label className="text-sm font-medium text-gray-600">
                      Duration
                    </Label>
                  </div>
                  <p className="font-semibold text-gray-900">
                    {Math.ceil(
                      (new Date(selectedAddOnSubForView.endDate).getTime() -
                        new Date(selectedAddOnSubForView.startDate).getTime()) /
                        (1000 * 60 * 60 * 24)
                    )}{" "}
                    days
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white border border-gray-200 p-4 rounded-xl">
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-sm font-medium text-gray-600">
                      Payment Status
                    </Label>
                    <Badge
                      variant={
                        selectedAddOnSubForView.paymentStatus === "Paid"
                          ? "default"
                          : selectedAddOnSubForView.paymentStatus === "Pending"
                          ? "secondary"
                          : "destructive"
                      }
                    >
                      {selectedAddOnSubForView.paymentStatus}
                    </Badge>
                  </div>
                  <div className="text-xs font-mono bg-gray-50 p-2 rounded border">
                    {selectedAddOnSubForView.paymentId}
                  </div>
                </div>
                <div className="bg-white border border-gray-200 p-4 rounded-xl">
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-sm font-medium text-gray-600">
                      Subscription Status
                    </Label>
                    <Badge
                      variant={
                        selectedAddOnSubForView.status === "Active"
                          ? "default"
                          : selectedAddOnSubForView.status === "Expired"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {selectedAddOnSubForView.status}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-600">
                    Created:{" "}
                    {new Date(
                      selectedAddOnSubForView.created_at || ""
                    ).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="pt-4 border-t">
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
