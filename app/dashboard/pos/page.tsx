"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Plus,
  Search,
  Trash2,
  UserPlus,
  CheckCircle,
  ShoppingCart,
  Calculator,
  Receipt,
  Minus,
  X,
  Filter,
  Loader2,
  Printer,
} from "lucide-react";
import { BillPrint } from "@/components/BillPrint";
import { useRef } from "react";
import { cn } from "@/lib/utils";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";
import { usePermission } from "@/hooks/use-permission";
import { useRouter, usePathname } from "next/navigation";
import { printSalesInvoice } from "../sales/components/InvoicePrint";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { TimeLockLayout } from "@/components/TimeLockLayout";

interface Product {
  _id: string;
  productName: string;
  sellingPrice: number;
  cgst?: number;
  sgst?: number;
  igst?: number;
  type?: string;
  currentStock?: number;
  isLowStock?: boolean;
}

interface Store {
  storeId: string;
  storeName: string;
  storeAddress: string;
  totalProducts: number;
  totalQuantity: number;
  totalValue: number;
}

interface StockProduct {
  productId: string;
  productName: string;
  categoryName: string;
  currentStock: number;
  mrp: number;
  sellingPrice: number;
  stockValue: number;
  minStockThreshold: number;
  isLowStock: boolean;
  todayIncrease: number;
  todayDecrease: number;
  todayNetChange: number;
  lastTransaction: string;
}

interface Customer {
  _id: string;
  firstName: string;
  lastName: string;
  contact: string;
  deletedAt?: string | null;
}

interface PaymentMode {
  _id: string;
  payType: string;
  deduction: number;
  status: boolean;
}

interface CartItem {
  product: string;
  productName: string;
  price: number;
  qty: number;
  cgst: number;
  sgst: number;
  igst: number;
  is_igst: boolean;
  subtotal: number;
  total: number;
  store: string;
  storeName: string;
}

export default function PosPage() {
  const { user, authFetch, loading: authLoading } = useAuth();
  const { can } = usePermission();
  const router = useRouter();
  const pathname = usePathname();
  const [searchTerm, setSearchTerm] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [discountType, setDiscountType] = useState("percentage");
  const [discountValue, setDiscountValue] = useState(0);
  const [shippingCost, setShippingCost] = useState(0);
  const [paymentMode, setPaymentMode] = useState("");
  const [blendPayments, setBlendPayments] = useState<{paymentMode: string; amount: string | number}[]>([{paymentMode: "", amount: ""}]);
  const [remarks, setRemarks] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isSaving, setIsSaving] = useState(false);

  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    firstName: "",
    lastName: "",
    contact: "",
    age: "",
    gender: "",
    address: "",
  });
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<"paid" | "partial">("paid");
  const [paidAmount, setPaidAmount] = useState(0);
  const [savedBillId, setSavedBillId] = useState<string>("");
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [printingId, setPrintingId] = useState<string | null>(null);

  // API Data
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [paymentModes, setPaymentModes] = useState<PaymentMode[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStore, setSelectedStore] = useState("");
  const [stockProducts, setStockProducts] = useState<StockProduct[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingStock, setIsLoadingStock] = useState(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);

  // Debounced fetch functions
  const fetchProducts = useCallback(
    async (search = "") => {
      setIsLoadingProducts(true);
      try {
        const params = new URLSearchParams({
          page: "1",
          limit: "1000",
          ...(search && { search }),
        });
        const response = await authFetch(`/api/products?${params}`);
        const data = await response.json();
        if (data.success) {
          setProducts(data.data);
        }
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch products",
        });
      } finally {
        setIsLoadingProducts(false);
      }
    },
    [authFetch, toast]
  );

  const fetchCustomers = useCallback(
    async (search = "") => {
      try {
        const params = new URLSearchParams({
          page: "1",
          limit: "100",
          ...(search && { search }),
        });
        const response = await authFetch(`/api/patients?${params}`);
        const result = await response.json();
        if (result.success && Array.isArray(result.data)) {
          const activeCustomers = result.data.filter(
            (c: Customer) => c.deletedAt === null
          );
          if (search) {
            // Return search results for SearchableSelect
            return activeCustomers;
          } else {
            setCustomers(activeCustomers);
          }
        } else if (Array.isArray(result)) {
          // Fallback for old API format
          const activeCustomers = result.filter(
            (c: Customer) => c.deletedAt === null
          );
          if (search) {
            return activeCustomers;
          } else {
            setCustomers(activeCustomers);
          }
        }
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch customers",
        });
      }
      return [];
    },
    [authFetch, toast]
  );

  const fetchStores = useCallback(async () => {
    try {
      const response = await authFetch("/api/stock/get-stock-overview");
      const data = await response.json();
      if (data.success && data.data.stores) {
        setStores(data.data.stores);
        if (data.data.stores.length > 0 && !selectedStore) {
          setSelectedStore(data.data.stores[0].storeId);
        }
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch stores",
      });
    }
  }, [authFetch, toast, selectedStore]);

  // Debounced search effects
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, fetchProducts]);

  // Initial data fetch
  useEffect(() => {
    if (!authLoading && user) {
      if (!can("view", pathname)) {
        router.push("/dashboard");
      } else {
        fetchProducts();
        fetchCustomers();
        fetchStores();
        fetchPaymentModes();
        fetchDoctors();
      }
    }
  }, [user, authLoading, can, router, pathname]);

  // Fetch stock when store changes
  useEffect(() => {
    if (selectedStore) {
      fetchStockData(selectedStore);
    }
  }, [selectedStore]);



  const fetchPaymentModes = async () => {
    setIsLoading(true);
    try {
      const response = await authFetch("/api/finance/paytypes");
      const data = await response.json();
      if (data.success) {
        setPaymentModes(data.data.filter((pm: PaymentMode) => pm.status));
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch payment modes",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      const response = await authFetch("/api/users?role=doctor");
      const data = await response.json();
      if (data.success) {
        setDoctors(data.data || []);
      } else if (Array.isArray(data)) {
        setDoctors(data);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch doctors",
      });
    }
  };

  const fetchStockData = async (storeId: string) => {
    setIsLoadingStock(true);
    try {
      const params = new URLSearchParams({
        page: "1",
        limit: "1000",
      });
      const response = await authFetch(
        `/api/stock/get-stock-overview?storeId=${storeId}&${params}`
      );
      const data = await response.json();

      if (data.success && data.data.products) {
        setStockProducts(data.data.products);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch stock data",
      });
    } finally {
      setIsLoadingStock(false);
    }
  };

  const filteredProducts = useMemo(() => {
    // Map products with stock data
    const productsWithStock = products.map((product) => {
      const stockData = stockProducts.find(
        (sp) => sp.productId === product._id
      );
      return {
        ...product,
        currentStock: stockData?.currentStock || 0,
        isLowStock: stockData?.isLowStock || false,
      };
    });

    // Apply category filter
    const filtered =
      categoryFilter === "all"
        ? productsWithStock
        : productsWithStock.filter((p) => {
            const name = p.productName.toLowerCase();
            switch (categoryFilter) {
              case "creams":
                return name.includes("cream") || name.includes("gel");
              case "tablets":
                return name.includes("tab") || name.includes("cap");
              case "lotions":
                return name.includes("lotion") || name.includes("solution");
              case "services":
                return (
                  name.includes("consultancy") ||
                  name.includes("surgery") ||
                  name.includes("peel")
                );
              default:
                return true;
            }
          });

    // Sort products: in-stock first, out-of-stock at bottom
    return filtered.sort((a, b) => {
      const aIsService = (a.type || "").toLowerCase() === "service";
      const bIsService = (b.type || "").toLowerCase() === "service";
      const aIsOutOfStock = !aIsService && (a.currentStock || 0) <= 0;
      const bIsOutOfStock = !bIsService && (b.currentStock || 0) <= 0;

      // Out-of-stock products at bottom
      if (aIsOutOfStock && !bIsOutOfStock) return 1;
      if (!aIsOutOfStock && bIsOutOfStock) return -1;

      // If both have same stock status, maintain original order
      return 0;
    });
  }, [categoryFilter, products, stockProducts]);

  const addToCart = (product: Product) => {
    const isService = (product.type || "").toLowerCase() === "service";
    // For services, ignore stock checks entirely
    if (!isService && (product.currentStock || 0) <= 0) {
      setTimeout(() => {
        toast({
          variant: "destructive",
          title: "Out of Stock",
          description: `${product.productName} is currently out of stock`,
        });
      }, 0);
      return;
    }

    setCart((currentCart) => {
      const existingItem = currentCart.find(
        (item) => item.product === product._id
      );
      if (existingItem) {
        const newQty = existingItem.qty + 1;
        // Check if new quantity exceeds available stock (not for services)
        if (!isService && newQty > (product.currentStock || 0)) {
          setTimeout(() => {
            toast({
              variant: "destructive",
              title: "Insufficient Stock",
              description: `Only ${product.currentStock} units available`,
            });
          }, 0);
          return currentCart;
        }

        return currentCart.map((item) => {
          if (item.product === product._id) {
            const subtotal = newQty * item.price;
            const cgstAmount = (subtotal * item.cgst) / 100;
            const sgstAmount = (subtotal * item.sgst) / 100;
            const igstAmount = (subtotal * item.igst) / 100;
            const total = subtotal + cgstAmount + sgstAmount + igstAmount;
            return { ...item, qty: newQty, subtotal, total };
          }
          return item;
        });
      }

      const cgst = product.cgst || 0;
      const sgst = product.sgst || 0;
      const igst = 0;
      
      // Use sellingPrice for Inclusive, mrp for Exclusive
      const price = product.taxType === 'Inclusive' 
        ? (product.sellingPrice || 0)
        : (product.mrp || 0);
      
      const subtotal = price;
      const cgstAmount = (subtotal * cgst) / 100;
      const sgstAmount = (subtotal * sgst) / 100;
      const igstAmount = (subtotal * igst) / 100;
      const total = subtotal + cgstAmount + sgstAmount + igstAmount;

      const selectedStoreData = stores.find((s) => s.storeId === selectedStore);

      return [
        ...currentCart,
        {
          product: product._id,
          productName: product.productName,
          price,
          qty: 1,
          cgst,
          sgst,
          igst,
          is_igst: false,
          subtotal,
          total,
          store: selectedStore,
          storeName: selectedStoreData?.storeName || "",
        },
      ];
    });
  };

  const updateQuantity = (productId: string, newQty: number) => {
    setCart((currentCart) => {
      if (newQty <= 0) {
        return currentCart.filter((item) => item.product !== productId);
      }

      // Check stock availability
      const product = filteredProducts.find((p) => p._id === productId);
      const isService = (product?.type || "").toLowerCase() === "service";
      if (!isService && product && newQty > (product.currentStock || 0)) {
        setTimeout(() => {
          toast({
            variant: "destructive",
            title: "Insufficient Stock",
            description: `Only ${product.currentStock} units available`,
          });
        }, 0);
        return currentCart;
      }

      return currentCart.map((item) => {
        if (item.product === productId) {
          const subtotal = newQty * item.price;
          const cgstAmount = (subtotal * item.cgst) / 100;
          const sgstAmount = (subtotal * item.sgst) / 100;
          const igstAmount = (subtotal * item.igst) / 100;
          const total = subtotal + cgstAmount + sgstAmount + igstAmount;
          return { ...item, qty: newQty, subtotal, total };
        }
        return item;
      });
    });
  };

  const updateItemGst = (productId: string, gstType: 'cgst' | 'sgst' | 'igst', value: number) => {
    setCart((currentCart) => {
      return currentCart.map((item) => {
        if (item.product === productId) {
          const updatedItem = { ...item, [gstType]: value };
          const subtotal = updatedItem.qty * updatedItem.price;
          const cgstAmount = (subtotal * updatedItem.cgst) / 100;
          const sgstAmount = (subtotal * updatedItem.sgst) / 100;
          const igstAmount = (subtotal * updatedItem.igst) / 100;
          const total = subtotal + cgstAmount + sgstAmount + igstAmount;
          return { ...updatedItem, subtotal, total };
        }
        return item;
      });
    });
  };

  const updateItemPrice = (productId: string, newPrice: number) => {
    setCart((currentCart) => {
      return currentCart.map((item) => {
        if (item.product === productId) {
          const updatedItem = { ...item, price: newPrice };
          const subtotal = updatedItem.qty * updatedItem.price;
          const cgstAmount = (subtotal * updatedItem.cgst) / 100;
          const sgstAmount = (subtotal * updatedItem.sgst) / 100;
          const igstAmount = (subtotal * updatedItem.igst) / 100;
          const total = subtotal + cgstAmount + sgstAmount + igstAmount;
          return { ...updatedItem, subtotal, total };
        }
        return item;
      });
    });
  };

  const updateItemGstType = (productId: string, isIgstType: boolean) => {
    setCart((currentCart) => {
      return currentCart.map((item) => {
        if (item.product === productId) {
          const product = products.find((p) => p._id === productId);
          const updatedItem = { ...item, is_igst: isIgstType };
          
          if (isIgstType) {
            updatedItem.cgst = 0;
            updatedItem.sgst = 0;
            updatedItem.igst = product?.igst || 0;
          } else {
            updatedItem.igst = 0;
            updatedItem.cgst = product?.cgst || 0;
            updatedItem.sgst = product?.sgst || 0;
          }
          
          const subtotal = updatedItem.qty * updatedItem.price;
          const cgstAmount = (subtotal * updatedItem.cgst) / 100;
          const sgstAmount = (subtotal * updatedItem.sgst) / 100;
          const igstAmount = (subtotal * updatedItem.igst) / 100;
          const total = subtotal + cgstAmount + sgstAmount + igstAmount;
          return { ...updatedItem, subtotal, total };
        }
        return item;
      });
    });
  };

  const subTotal = cart.reduce((acc, item) => acc + item.total, 0);
  const discountAmount =
    discountType === "percentage"
      ? (subTotal * discountValue) / 100
      : discountValue;
  const totalAfterDiscount = subTotal - discountAmount;

  const selectedPaymentMode = paymentModes.find((pm) => pm._id === paymentMode);
  const deductionPercent = selectedPaymentMode?.deduction || 0;
  const paymentDeduction = (totalAfterDiscount * deductionPercent) / 100;

  // Smart rounding function for financial calculations
  const smartRound = (num: number): number => {
    const decimal = num - Math.floor(num);
    return decimal <= 0.5 ? Math.floor(num) : Math.ceil(num);
  };

  const grandTotal = smartRound(totalAfterDiscount + shippingCost + paymentDeduction);
  const cartItemIds = new Set(cart.map((item) => item.product));
  const totalItems = cart.reduce((acc, item) => acc + item.qty, 0);
  const blendPaymentTotal = blendPayments.reduce((sum, bp) => sum + (Number(bp.amount) || 0), 0);
  const isBlendPaymentValid = blendPayments.length > 0 && 
    blendPayments.every(bp => bp.paymentMode && (Number(bp.amount) || 0) > 0) &&
    Math.abs(blendPaymentTotal - grandTotal) < 0.01;
  
  const canSaveBill =
    selectedCustomer !== "" &&
    selectedDoctor !== "" &&
    isBlendPaymentValid &&
    cart.length > 0 &&
    !isSaving;

  const addBlendPayment = () => {
    if (paymentModes.length > 0) {
      setBlendPayments([...blendPayments, {
        paymentMode: paymentModes[0]._id,
        amount: ""
      }]);
    }
  };

  const updateBlendPayment = (index: number, field: 'paymentMode' | 'amount', value: string | number) => {
    const updated = [...blendPayments];
    updated[index] = { ...updated[index], [field]: value };
    setBlendPayments(updated);
  };

  const removeBlendPayment = (index: number) => {
    setBlendPayments(blendPayments.filter((_, i) => i !== index));
  };



  const handleSaveBill = async () => {
    if (!selectedCustomer || !selectedDoctor || cart.length === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select customer, doctor and add items",
      });
      return;
    }

    if (blendPayments.length === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please add at least one payment method",
      });
      return;
    }
    if (blendPayments.some(bp => !bp.paymentMode || (Number(bp.amount) || 0) <= 0)) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select payment mode and enter valid amount for all payments",
      });
      return;
    }
    if (Math.abs(blendPaymentTotal - grandTotal) >= 0.01) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Total payment amount must equal grand total",
      });
      return;
    }

    const saleData = {
      billDate: new Date().toISOString().split("T")[0],
      customer: selectedCustomer,
      items: cart.map((item) => ({
        product: item.product,
        productName: item.productName,
        store: item.store,
        qty: item.qty,
        rate: item.price,
        subtotal: item.subtotal,
        cgstPercent: item.cgst,
        sgstPercent: item.sgst,
        igstPercent: item.igst,
        is_igst: item.is_igst,
        total: item.total,
      })),
      subtotal: subTotal,
      discountType,
      discountValue,
      shippingCost,
      grandTotal: smartRound(subTotal - discountAmount + shippingCost + paymentDeduction),
      paymentMode: blendPayments,
      doctorId: selectedDoctor,
      status: "due",
      remarks,
      terms: "",
      tds: 0,
      creditNoteAmount: 0,
      uploadedDocs: [],
    };

    setIsSaving(true);
    try {
      const response = await authFetch("/api/sales/bills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(saleData),
      });

      const result = await response.json();
      if (result.success) {
        setSavedBillId(result.data._id);
        
        // Open payment dialog
        setPaidAmount(grandTotal);
        setPaymentStatus("paid");
        setIsPaymentDialogOpen(true);
        
        toast({
          title: "Success",
          description: "Sale saved successfully",
        });
      } else {
        throw new Error(result.message || "Failed to save sale");
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: (error as Error).message,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!savedBillId) return;

    const paymentData = {
      status: paymentStatus === "paid" ? "paid" : "partial",
      paidAmount: smartRound(paidAmount),
    };

    setIsSaving(true);
    try {
      const response = await authFetch(`/api/sales/bills/${savedBillId}/payment`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paymentData),
      });

      const result = await response.json();
      if (result.success) {
        setIsPaymentDialogOpen(false);
        
        // Show print dialog
        setShowPrintDialog(true);
        
        toast({
          title: "Success",
          description: `Payment of ₹${paidAmount.toFixed(2)} recorded successfully`,
        });
      } else {
        throw new Error(result.message || "Failed to record payment");
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: (error as Error).message,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setCart([]);
    setSelectedCustomer("");
    setSelectedDoctor("");
    setPaymentMode("");
    setBlendPayments([{paymentMode: "", amount: ""}]);
    setDiscountValue(0);
    setShippingCost(0);
    setRemarks("");

    setPaidAmount(0);
    setPaymentStatus("paid");
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !newCustomer.firstName ||
      !newCustomer.lastName ||
      !newCustomer.contact
    ) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill required fields",
      });
      return;
    }
    try {
      const customerData = {
        ...newCustomer,
        age: newCustomer.age ? parseInt(newCustomer.age) : undefined,
      };
      const response = await authFetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(customerData),
      });
      if (!response.ok) throw new Error("Failed to create customer");
      const result = await response.json();
      toast({ title: "Success", description: "Customer created successfully" });
      setIsCustomerDialogOpen(false);
      setNewCustomer({
        firstName: "",
        lastName: "",
        contact: "",
        age: "",
        gender: "",
        address: "",
      });
      fetchCustomers();
      if (result.data?._id) setSelectedCustomer(result.data._id);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: (error as Error).message,
      });
    }
  };

  const handlePrintInvoice = async (printType: "a4" | "thermal" = "a4") => {
    if (!savedBillId) return;
    
    setPrintingId(savedBillId);
    try {
      await printSalesInvoice(savedBillId, printType, authFetch);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: (error as Error).message,
      });
    } finally {
      setPrintingId(null);
      setShowPrintDialog(false);
      // Refresh stock data after printing
      if (selectedStore) {
        fetchStockData(selectedStore);
      }
      resetForm();
    }
  };

  const handleClosePrint = () => {
    setShowPrintDialog(false);
    // Refresh stock data when skipping print
    if (selectedStore) {
      fetchStockData(selectedStore);
    }
    resetForm();
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null; // Layout will handle redirect
  }

  return (
    <TimeLockLayout>
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Payment Confirmation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm">
              <div className="flex justify-between mb-2">
                <span>Grand Total:</span>
                <span className="font-semibold">₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Payment Status</Label>
              <Select value={paymentStatus} onValueChange={(value: "paid" | "partial") => {
                setPaymentStatus(value);
                if (value === "paid") setPaidAmount(grandTotal);
              }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="paid">Full Payment</SelectItem>
                  <SelectItem value="partial">Partial Payment</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Paid Amount</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                max={grandTotal}
                value={paidAmount}
                onChange={(e) => setPaidAmount(Number(e.target.value) || 0)}
                disabled={paymentStatus === "paid"}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmPayment} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isCustomerDialogOpen}
        onOpenChange={setIsCustomerDialogOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Customer</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveCustomer} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  required
                  value={newCustomer.firstName}
                  onChange={(e) =>
                    setNewCustomer((p) => ({ ...p, firstName: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  required
                  value={newCustomer.lastName}
                  onChange={(e) =>
                    setNewCustomer((p) => ({ ...p, lastName: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact">Contact *</Label>
              <Input
                id="contact"
                required
                value={newCustomer.contact}
                onChange={(e) =>
                  setNewCustomer((p) => ({ ...p, contact: e.target.value }))
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  value={newCustomer.age}
                  onChange={(e) =>
                    setNewCustomer((p) => ({ ...p, age: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select
                  value={newCustomer.gender}
                  onValueChange={(value) =>
                    setNewCustomer((p) => ({ ...p, gender: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={newCustomer.address}
                onChange={(e) =>
                  setNewCustomer((p) => ({ ...p, address: e.target.value }))
                }
              />
            </div>
          </form>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCustomerDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" onClick={handleSaveCustomer}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showPrintDialog} onOpenChange={setShowPrintDialog}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Choose Print Format</AlertDialogTitle>
            <AlertDialogDescription>
              Select the print format for your invoice.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleClosePrint}>Skip Print</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handlePrintInvoice("thermal")}
              disabled={printingId === savedBillId}
            >
              {printingId === savedBillId ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Thermal (80mm)
            </AlertDialogAction>
            <AlertDialogAction
              onClick={() => handlePrintInvoice("a4")}
              disabled={printingId === savedBillId}
            >
              {printingId === savedBillId ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              A4 Size
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="h-[calc(100vh-4rem)] flex flex-col lg:flex-row gap-4 p-4 overflow-hidden">
        {/* Product Selection */}
        <div className="flex-1 lg:w-2/5 flex flex-col min-h-0">
          <Card className="flex-1 flex flex-col overflow-hidden">
            <CardHeader className="pb-2 shrink-0">
              <div className="flex flex-col gap-2">
                <div className="flex flex-col sm:flex-row gap-2">
                  {isLoading ? (
                    <div className="flex-1 h-8 bg-gray-200 rounded animate-pulse"></div>
                  ) : (
                    <SearchableSelect
                      options={stores.map((store) => ({
                        value: store.storeId,
                        label: `${store.storeName} - ${store.storeAddress}`,
                      }))}
                      value={selectedStore}
                      onValueChange={setSelectedStore}
                      placeholder="Select Store..."
                      searchPlaceholder="Search stores..."
                      emptyText="No stores found."
                      className="flex-1 text-xs"
                    />
                  )}
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                    <Input
                      placeholder="Search products..."
                      className="pl-7 h-8 text-xs"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Select
                    value={categoryFilter}
                    onValueChange={setCategoryFilter}
                  >
                    <SelectTrigger className="w-full sm:w-32 h-8 text-xs">
                      <Filter className="h-3 w-3 mr-1" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="creams">Creams</SelectItem>
                      <SelectItem value="tablets">Tablets</SelectItem>
                      <SelectItem value="lotions">Lotions</SelectItem>
                      <SelectItem value="services">Services</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {isLoadingProducts || isLoadingStock ? (
                    <div className="h-3 bg-gray-200 rounded w-16 animate-pulse"></div>
                  ) : (
                    `${filteredProducts.length} found`
                  )}
                </span>
                {cart.length > 0 && (
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1 text-xs px-1 py-0"
                  >
                    <ShoppingCart className="h-2 w-2" />
                    {totalItems}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-2 xl:grid-cols-3 gap-2 p-3">
                  {isLoadingProducts || isLoadingStock
                    ? // Skeleton loading
                      Array.from({ length: 8 }).map((_, index) => (
                        <Card key={index} className="h-20">
                          <CardContent className="p-2 h-full">
                            <div className="flex flex-col h-full animate-pulse">
                              <div className="h-2 bg-gray-200 rounded mb-1"></div>
                              <div className="h-2 bg-gray-200 rounded mb-1 w-3/4"></div>
                              <div className="mt-auto flex justify-between items-center">
                                <div className="h-2 bg-gray-200 rounded w-8"></div>
                                <div className="h-4 bg-gray-200 rounded w-6"></div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    : filteredProducts.map((product, index) => {
                        const inCart = cartItemIds.has(product._id);
                        const cartItem = cart.find(
                          (item) => item.product === product._id
                        );
                        const isService =
                          (product.type || "").toLowerCase() === "service";
                        const isOutOfStock =
                          !isService && (product.currentStock || 0) <= 0;
                        const isLowStock =
                          !isService && product.isLowStock && !isOutOfStock;
                        const canAdd = isService || !isOutOfStock;

                        return (
                          <Card
                            key={index}
                            className={cn(
                              "cursor-pointer transition-all duration-200 hover:shadow-sm group h-20",
                              inCart &&
                                "ring-1 ring-primary shadow-sm bg-primary/5",
                              !isService &&
                                isOutOfStock &&
                                "opacity-50 cursor-not-allowed"
                            )}
                            onClick={() => canAdd && addToCart(product)}
                          >
                            <CardContent className="p-1.5 h-full">
                              <div className="flex flex-col h-full">
                                <div className="flex items-start justify-between mb-1">
                                  <h4 className="text-xs font-medium leading-tight line-clamp-1 flex-1 truncate">
                                    {product.productName}
                                  </h4>
                                  <div className="flex items-center gap-1 ml-1">
                                    {inCart && (
                                      <Badge
                                        variant="default"
                                        className="text-xs px-1 py-0 h-4"
                                      >
                                        {cartItem?.qty}
                                      </Badge>
                                    )}
                                    {isService && (
                                      <Badge
                                        variant="secondary"
                                        className="text-xs px-1 py-0 h-4"
                                      >
                                        Service
                                      </Badge>
                                    )}
                                    {!isService && isOutOfStock && (
                                      <Badge
                                        variant="destructive"
                                        className="text-xs px-1 py-0 h-4"
                                      >
                                        Out
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                {!isService && (
                                  <div className="text-xs text-muted-foreground mb-1">
                                    Stock: {product.currentStock || 0}
                                  </div>
                                )}
                                <div className="mt-auto">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-primary">
                                      ₹{(product.taxType === 'Inclusive' ? (product.sellingPrice || 0) : (product.mrp || 0)).toFixed(0)}
                                    </span>
                                    <Button
                                      size="sm"
                                      variant={inCart ? "default" : "outline"}
                                      className="h-4 w-4 p-0"
                                      disabled={!isService && isOutOfStock}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        addToCart(product);
                                      }}
                                    >
                                      <Plus className="h-2 w-2" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Billing Section */}
        <div className="w-full lg:w-3/5 flex flex-col min-h-0">
          <Card className="flex-1 flex flex-col overflow-hidden">
            <CardHeader className="pb-2 shrink-0">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-primary" />
                  <h2 className="text-sm font-semibold">Billing</h2>
                  <span className="text-xs text-muted-foreground font-mono">
                    #{Date.now().toString().slice(-6)}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground font-mono">
                  {new Date().toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <SearchableSelect
                  options={doctors.map((d) => ({
                    value: d._id,
                    label: d.name,
                  }))}
                  value={selectedDoctor}
                  onValueChange={setSelectedDoctor}
                  placeholder="Select Doctor..."
                  searchPlaceholder="Search doctors..."
                  emptyText="No doctors found."
                  className="text-xs"
                />
                <div className="flex items-center gap-2">
                  <SearchableSelect
                    options={[
                      { value: "walkin", label: "Walk-in Customer" },
                      ...customers.map((c) => ({
                        value: c._id,
                        label: `${c.firstName} ${c.lastName} (${c.contact})`,
                      })),
                    ]}
                    value={selectedCustomer}
                    onValueChange={setSelectedCustomer}
                    placeholder="Select Customer..."
                    searchPlaceholder="Search customers..."
                    emptyText="No customers found."
                    className="flex-1 text-xs"
                    onSearchChange={fetchCustomers}
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    className="shrink-0 h-8 w-8"
                    onClick={() => setIsCustomerDialogOpen(true)}
                  >
                    <UserPlus className="h-3 w-3" />
                  </Button>
                </div>
              </div>

            </CardHeader>

            <ScrollArea className="flex-1">
              <div className="p-3 space-y-3">
                {/* Cart Items */}
                <div className="border rounded-lg">
                  <div className="p-2 border-b bg-muted/50">
                    <h3 className="text-xs font-medium">Cart Items</h3>
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {cart.length > 0 ? (
                      <div className="divide-y">
                        {cart.map((item, index) => (
                          <div key={index} className="p-2 space-y-2">
                            <div className="flex items-center gap-2">
                              <div className="w-6 shrink-0 text-xs text-muted-foreground font-medium">
                                {index + 1}.
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-xs font-medium truncate">
                                  {item.productName}
                                </h4>
                              </div>

                              <div className="flex flex-col items-end gap-1 min-w-[60px] shrink-0">
                                <p className="text-xs font-semibold whitespace-nowrap">
                                  ₹{item.total.toFixed(2)}
                                </p>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-4 w-4 text-destructive hover:text-destructive"
                                  onClick={() => updateQuantity(item.product, 0)}
                                >
                                  <X className="h-2 w-2" />
                                </Button>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 text-xs">
                              <Select
                                value={item.is_igst ? "igst" : "cgst_sgst"}
                                onValueChange={(value: string) => {
                                  updateItemGstType(item.product, value === "igst");
                                }}
                              >
                                <SelectTrigger className="h-6 text-xs w-24">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="cgst_sgst">CGST+SGST</SelectItem>
                                  <SelectItem value="igst">IGST</SelectItem>
                                </SelectContent>
                              </Select>
                              {!item.is_igst ? (
                                <>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={item.cgst}
                                    onChange={(e) => updateItemGst(item.product, 'cgst', Number(e.target.value) || 0)}
                                    onWheel={(e) => e.currentTarget.blur()}
                                    placeholder="CGST%"
                                    className="h-6 text-xs w-16 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                                  />
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={item.sgst}
                                    onChange={(e) => updateItemGst(item.product, 'sgst', Number(e.target.value) || 0)}
                                    onWheel={(e) => e.currentTarget.blur()}
                                    placeholder="SGST%"
                                    className="h-6 text-xs w-16 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                                  />
                                </>
                              ) : (
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={item.igst}
                                  onChange={(e) => updateItemGst(item.product, 'igst', Number(e.target.value) || 0)}
                                  onWheel={(e) => e.currentTarget.blur()}
                                  placeholder="IGST%"
                                  className="h-6 text-xs w-16 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                                />
                              )}
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-muted-foreground">₹</span>
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={item.price}
                                  onChange={(e) => updateItemPrice(item.product, Number(e.target.value) || 0)}
                                  onWheel={(e) => e.currentTarget.blur()}
                                  className="h-6 w-24 text-xs [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                                />
                              </div>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() =>
                                    updateQuantity(item.product, item.qty - 1)
                                  }
                                >
                                  <Minus className="h-2 w-2" />
                                </Button>
                                <span className="w-6 text-center text-xs font-medium">
                                  {item.qty}
                                </span>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() =>
                                    updateQuantity(item.product, item.qty + 1)
                                  }
                                >
                                  <Plus className="h-2 w-2" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-24 text-muted-foreground">
                        <ShoppingCart className="h-6 w-6 mb-1" />
                        <p className="text-xs">No items in cart</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Calculation Summary */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span>Subtotal ({totalItems} items)</span>
                    <span className="font-mono">₹{subTotal.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span>Discount</span>
                    <div className="flex gap-1 items-center">
                      <Select
                        value={discountType}
                        onValueChange={setDiscountType}
                      >
                        <SelectTrigger className="h-6 w-14 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percentage">%</SelectItem>
                          <SelectItem value="fixed">₹</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        value={discountValue}
                        onChange={(e) =>
                          setDiscountValue(parseFloat(e.target.value) || 0)
                        }
                        className="h-6 w-24 text-xs"
                        placeholder="0"
                      />
                      <span className="text-xs text-muted-foreground w-12 text-right">
                        -₹{discountAmount.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between text-xs">
                    <span>Total Amount</span>
                    <span className="font-mono">
                      ₹{totalAfterDiscount.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span>Shipping Cost</span>
                    <Input
                      type="number"
                      value={shippingCost}
                      onChange={(e) =>
                        setShippingCost(parseFloat(e.target.value) || 0)
                      }
                      className="h-6 w-20 text-xs text-right"
                      placeholder="0.00"
                    />
                  </div>

                  {deductionPercent > 0 && (
                    <div className="flex justify-between text-xs">
                      <span>Convenience charge ({deductionPercent}%)</span>
                      <span className="font-mono text-green-600">
                        +₹{paymentDeduction.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>

                <Separator />

                <div className="flex justify-between items-center text-sm font-bold">
                  <span className="flex items-center gap-1">
                    <Calculator className="h-3 w-3" />
                    Grand Total
                  </span>
                  <span className="font-mono text-primary">
                    ₹{grandTotal.toFixed(2)}
                  </span>
                </div>

                <Separator />

                {/* Payment & Notes */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Payment Mode</Label>
                  
                  <div className="space-y-2">
                    {blendPayments.map((bp, index) => (
                      <div key={index} className="flex items-center gap-1">
                        <Select
                          value={bp.paymentMode}
                          onValueChange={(value) => updateBlendPayment(index, 'paymentMode', value)}
                        >
                          <SelectTrigger className="h-6 text-xs flex-1">
                            <SelectValue placeholder="Select payment mode" />
                          </SelectTrigger>
                          <SelectContent>
                            {paymentModes.map((pm) => (
                              <SelectItem key={pm._id} value={pm._id}>
                                {pm.payType}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={bp.amount}
                          onChange={(e) => updateBlendPayment(index, 'amount', e.target.value)}
                          onWheel={(e) => e.currentTarget.blur()}
                          className="h-6 w-20 text-xs [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                          placeholder="Amount"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => removeBlendPayment(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                    <div className="flex items-center justify-between">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-6 text-xs"
                        onClick={addBlendPayment}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add Payment
                      </Button>
                      {blendPayments.length > 0 && (
                        <div className="text-xs">
                          <span className={blendPaymentTotal === grandTotal ? "text-green-600" : "text-red-600"}>
                            ₹{blendPaymentTotal.toFixed(2)} / ₹{grandTotal.toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-xs font-medium">Remarks</Label>
                    <Input
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      placeholder="Enter remarks"
                      className="mt-1 h-7 text-xs"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-1 gap-2 pt-1">
                  <Button
                    className="h-8 bg-primary hover:bg-primary/90 text-xs"
                    disabled={!canSaveBill}
                    onClick={handleSaveBill}
                  >
                    Save Bill
                  </Button>
                </div>
              </div>
            </ScrollArea>
          </Card>
        </div>
      </div>
    </TimeLockLayout>
  );
}
