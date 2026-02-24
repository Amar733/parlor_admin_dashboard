"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { usePermission } from "@/hooks/use-permission";
import { Stethoscope } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Loader2, PlusCircle, Trash2, Edit, Eye, Upload, Menu, X } from "lucide-react";

export default function ExpensePage() {
  const { user, loading: authLoading, authFetch } = useAuth();
  const { can } = usePermission();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [editingExpense, setEditingExpense] = useState<any>(null);
  const [viewingExpense, setViewingExpense] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [clients, setClients] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [paymentSources, setPaymentSources] = useState<any[]>([]);
  const [expenseItems, setExpenseItems] = useState<any[]>([]);
  const [paymentModes, setPaymentModes] = useState<any[]>([]);
  const [isMobile, setIsMobile] = useState(false);

  const [expenseData, setExpenseData] = useState({
    date: new Date().toISOString().split("T")[0],
    expenseType: "official",
    itemType: "",
    debit: "",
    credit: "",
    particulars: "",
    remarks: "",
    client: "",
    project: "",
    employee: "",
    salesBill: "",
    purchaseBill: "",
    tds: "",
    paymentMode: "",
    paymentSource: "",
    referenceNo: "",
    document: null as File | null,
  });

  // Check for mobile screen
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Auto-fill from URL parameters
  const [urlParams, setUrlParams] = useState<{[key: string]: string}>({});
  const [isFromPurchase, setIsFromPurchase] = useState(false);
  
  useEffect(() => {
    const purchaseBill = searchParams.get("purchasebill");
    const amount = searchParams.get("amount");
    const vendorId = searchParams.get("vendorid");
    const vendorName = searchParams.get("vendorname");
    const purchaseId = searchParams.get("purchaseId");
    const params: {[key: string]: string} = {};
    if (purchaseBill) params.purchaseBill = purchaseBill;
    if (amount) params.debit = amount;
    if (vendorId) params.project = vendorId;
    if (vendorName) params.remarks = `Payment to ${vendorName}`;
    //purchaseId
    if (purchaseId) params.purchaseId = purchaseId;

    setUrlParams(params);
    setIsFromPurchase(!!purchaseBill);

    if (purchaseBill && amount) {
      setExpenseData(prev => ({
        ...prev,
        purchaseBill,
        debit: amount,
        particulars: `Payment for Purchase Bill ${purchaseBill}`,
        remarks: vendorName ? `Payment to ${vendorName}` : "",
        expenseType: "official",
        project: vendorId || ""
      }));
      setIsExpenseDialogOpen(true);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!authLoading) {
      if (!can('view', pathname)) {
        router.push('/dashboard');
      } else {
        fetchExpenses();
        fetchMasterData();
      }
    }
  }, [user, authLoading, can, router, pathname]);

  const fetchExpenses = async () => {
    setIsLoading(true);
    try {
      const response = await authFetch("/api/finance/expenses");
      const result = await response.json();
      if (result.success) {
        setExpenses(result.data);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch expenses",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMasterData = async () => {
    try {
      // Fetch patients, users, expense categories, accounts, vendors, payment modes
      const [patientsRes, usersRes, expenseCategoriesRes, accountsRes, vendorsRes, paymentModesRes] = await Promise.all([
        authFetch("/patients"),
        authFetch("/users"),
        authFetch("/api/finance/expense-categories"),
        authFetch("/api/finance/accounts"),
        authFetch("/api/users/vendors"),
        authFetch("/api/finance/paytypes")
      ]);

      const [patientsData, usersData, expenseCategoriesData, accountsData, vendorsData, paymentModesData] = await Promise.all([
        patientsRes.json(),
        usersRes.json(),
        expenseCategoriesRes.json(),
        accountsRes.json(),
        vendorsRes.json(),
        paymentModesRes.json()
      ]);

      if (patientsData.success) setClients(patientsData.data);
      if (usersData.success) setEmployees(usersData.data);
      if (vendorsData.success) setProjects(vendorsData.data);
      if (expenseCategoriesData.success) setExpenseItems(expenseCategoriesData.data);
      if (accountsData.success) setPaymentSources(accountsData.data);
      if (paymentModesData.success) setPaymentModes(paymentModesData.data);
    } catch (error) {
      console.error("Failed to fetch master data:", error);
    }
  };

  const clearUrlParams = () => {
    router.replace(pathname);
    setUrlParams({});
    setIsFromPurchase(false);
  };

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Detailed validation with specific error messages
    const errors = [];
    if (!expenseData.particulars.trim()) {
      errors.push("Particulars is required");
    }
    if (!expenseData.debit && !expenseData.credit) {
      errors.push("Either Debit (Expense) or Credit (Advance) amount is required");
    }
    if (expenseData.debit && parseFloat(expenseData.debit) <= 0) {
      errors.push("Debit amount must be greater than 0");
    }
    if (expenseData.credit && parseFloat(expenseData.credit) <= 0) {
      errors.push("Credit amount must be greater than 0");
    }
    
    if (errors.length > 0) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: errors.join(", "),
      });
      return;
    }

    setIsSaving(true);
    try {
      const hasUrlParams = Object.keys(urlParams).length > 0;
      const url = editingExpense 
        ? `/api/finance/expenses/${editingExpense._id}` 
        : hasUrlParams 
          ? `/api/purchase/${urlParams.purchaseId}/payment`
          : "/api/finance/expenses";
      //have to send status in body if hasUrlParams is true and method will be patch 
      const method = editingExpense ? "PUT" : hasUrlParams ? "PATCH" : "POST";
      const { project, ...dataWithoutProject } = expenseData;
      
      // Convert empty strings to null
      const cleanData = Object.fromEntries(
        Object.entries(dataWithoutProject).map(([key, value]) => [
          key,
          value === "" ? null : value
        ])
      );
      
      const body = hasUrlParams ? { ...cleanData, vendor: project || null, status: "paid" } : {
        ...cleanData,
        vendor: project || null,
        client: cleanData.client || project || null
      };



      const response = await authFetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast({ 
          title: "Success", 
          description: editingExpense ? "Expense updated successfully" : "Expense saved successfully" 
        });
        setIsExpenseDialogOpen(false);
        resetForm();
        if (hasUrlParams) {
          clearUrlParams();
        }
        fetchExpenses();
      } else {
        throw new Error(result.message || "Failed to save expense");
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
    setExpenseData({
      date: new Date().toISOString().split("T")[0],
      expenseType: "official",
      itemType: "",
      debit: "",
      credit: "",
      particulars: "",
      remarks: "",
      client: "",
      project: "",
      employee: "",
      salesBill: "",
      purchaseBill: "",
      tds: "",
      paymentMode: "",
      paymentSource: "",
      referenceNo: "",
      document: null,
    });
    setEditingExpense(null);
    setUrlParams({});
    setIsFromPurchase(false);
  };

  const handleEditExpense = (expense: any) => {
    setEditingExpense(expense);
    setExpenseData({
      date: expense.date ? new Date(expense.date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
      expenseType: expense.expenseType || "official",
      itemType: expense.itemType || "",
      debit: expense.debit?.toString() || "",
      credit: expense.credit?.toString() || "",
      particulars: expense.particulars || "",
      remarks: expense.remarks || "",
      client: expense.client?._id || "",
      project: expense.project?._id || "",
      employee: expense.employee?._id || "",
      salesBill: expense.salesBill || "",
      purchaseBill: expense.purchaseBill || "",
      tds: expense.tds?.toString() || "",
      paymentMode: expense.paymentMode?._id || "",
      paymentSource: expense.paymentSource?._id || "",
      referenceNo: expense.referenceNo || "",
      document: expense.document || null,
    });
    setIsExpenseDialogOpen(true);
  };

  const handleViewExpense = (expense: any) => {
    setViewingExpense(expense);
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;
    
    setDeletingId(id);
    try {
      const response = await authFetch(`/api/finance/expenses/${id}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      if (result.success) {
        toast({ title: "Success", description: "Expense deleted successfully" });
        fetchExpenses();
      } else {
        throw new Error(result.message || "Failed to delete expense");
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: (error as Error).message,
      });
    } finally {
      setDeletingId(null);
    }
  };

  if (authLoading || !user) {
    return <div className="flex items-center justify-center h-screen"><Stethoscope className="h-12 w-12 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6 w-full max-w-full px-3 sm:px-4 md:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Expense Management</h1>
          <p className="text-muted-foreground text-sm sm:text-base">Track business expenses, receipts, and generate expense reports.</p>
        </div>
        {/* <Button 
          onClick={() => {
            resetForm();
            setIsExpenseDialogOpen(true);
          }}
          className="w-full sm:w-auto"
          size={isMobile ? "sm" : "default"}
        >
          <PlusCircle className="mr-2 h-4 w-4" /> Add Expense
        </Button> */}
      </div>

      <Dialog open={isExpenseDialogOpen} onOpenChange={setIsExpenseDialogOpen}>
        <DialogContent className={`max-w-[95vw] md:max-w-4xl max-h-[95vh] overflow-hidden flex flex-col ${isMobile ? 'p-4' : ''}`}>
          <DialogHeader className="pb-4 border-b">
            <DialogTitle className={`font-semibold ${isMobile ? 'text-lg' : 'text-xl'}`}>
              {editingExpense ? "Edit Expense" : isFromPurchase ? "Manage Purchase Expense" : "Manage Expense"}
            </DialogTitle>
            <DialogDescription className={isMobile ? 'text-xs' : ''}>
              {editingExpense ? "Update the expense details" : "Create a new expense entry"}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-1">
            <form
              id="expense-form"
              onSubmit={handleSaveExpense}
              className="space-y-4 py-3"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Date *</Label>
                  <Input
                    type="date"
                    value={expenseData.date}
                    onChange={(e) =>
                      setExpenseData((prev) => ({
                        ...prev,
                        date: e.target.value,
                      }))
                    }
                    required
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Expense Type</Label>
                  <SearchableSelect
                    options={[
                      { value: "official", label: "Official" },
                      { value: "personal", label: "Personal" },
                    ]}
                    value={expenseData.expenseType}
                    onValueChange={(val) =>
                      setExpenseData((prev) => ({ ...prev, expenseType: val }))
                    }
                    placeholder="Select Type"
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Items Type</Label>
                  <SearchableSelect
                    options={expenseItems.map((item) => ({
                      value: item._id,
                      label: item.name,
                    }))}
                    value={expenseData.itemType}
                    onValueChange={(val) => {
                      setExpenseData((prev) => ({ ...prev, itemType: val }))
                    }}
                    placeholder="Select Expense Items"
                    className="text-sm"
                  />
                </div>
              </div>

              <div className={`grid ${isMobile ? 'grid-cols-1' : isFromPurchase ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'} gap-3`}>
                <div className="space-y-1">
                  <Label className="text-xs">Debit (Expense)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={expenseData.debit}
                    onChange={(e) =>
                      setExpenseData((prev) => ({
                        ...prev,
                        debit: e.target.value,
                      }))
                    }
                    placeholder="0.00"
                    disabled={!!urlParams.debit}
                    className="text-sm"
                  />
                </div>
                {!isFromPurchase && (
                  <div className="space-y-1">
                    <Label className="text-xs">Credit (Advance)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={expenseData.credit}
                      onChange={(e) =>
                        setExpenseData((prev) => ({
                          ...prev,
                          credit: e.target.value,
                        }))
                      }
                      placeholder="0.00"
                      className="text-sm"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Particulars *</Label>
                  <Input
                    value={expenseData.particulars}
                    onChange={(e) =>
                      setExpenseData((prev) => ({
                        ...prev,
                        particulars: e.target.value,
                      }))
                    }
                    placeholder="Enter particulars"
                    required
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Remarks</Label>
                  <Input
                    value={expenseData.remarks}
                    onChange={(e) =>
                      setExpenseData((prev) => ({
                        ...prev,
                        remarks: e.target.value,
                      }))
                    }
                    placeholder="Enter remarks"
                    className="text-sm"
                  />
                </div>
              </div>

              {!isFromPurchase && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Client</Label>
                    <SearchableSelect
                      options={clients.map((client) => ({
                        value: client._id,
                        label: client.name || `${client.firstName || ''} ${client.lastName || ''}`.trim(),
                      }))}
                      value={expenseData.client}
                      onValueChange={(val) =>
                        setExpenseData((prev) => ({ ...prev, client: val }))
                      }
                      placeholder="Select Client"
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Employee</Label>
                    <SearchableSelect
                      options={employees.map((emp) => ({
                        value: emp._id,
                        label: emp.name,
                      }))}
                      value={expenseData.employee}
                      onValueChange={(val) =>
                        setExpenseData((prev) => ({ ...prev, employee: val }))
                      }
                      placeholder="Select Employee"
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Sales Bill</Label>
                    <Input
                      value={expenseData.salesBill}
                      onChange={(e) =>
                        setExpenseData((prev) => ({
                          ...prev,
                          salesBill: e.target.value,
                        }))
                      }
                      placeholder="Sales Bill No"
                      className="text-sm"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Vendor/Supplier</Label>
                  <SearchableSelect
                    options={projects.map((vendor) => ({
                      value: vendor._id,
                      label: vendor.name,
                    }))}
                    value={expenseData.project}
                    onValueChange={(val) =>
                      setExpenseData((prev) => ({ ...prev, project: val }))
                    }
                    placeholder="Select Vendor/Supplier"
                    disabled={!!urlParams.project}
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Purchase Bill</Label>
                  <Input
                    value={expenseData.purchaseBill}
                    onChange={(e) =>
                      setExpenseData((prev) => ({
                        ...prev,
                        purchaseBill: e.target.value,
                      }))
                    }
                    placeholder="Purchase Bill No"
                    disabled={!!urlParams.purchaseBill}
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">TDS</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={expenseData.tds}
                    onChange={(e) =>
                      setExpenseData((prev) => ({
                        ...prev,
                        tds: e.target.value,
                      }))
                    }
                    placeholder="0.00"
                    className="text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Payment Mode</Label>
                  <SearchableSelect
                    options={paymentModes.map((mode) => ({
                      value: mode._id,
                      label: mode.payType,
                    }))}
                    value={expenseData.paymentMode}
                    onValueChange={(val) =>
                      setExpenseData((prev) => ({ ...prev, paymentMode: val }))
                    }
                    placeholder="Select Payment Mode"
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Payment Source</Label>
                  <SearchableSelect
                    options={paymentSources.map((source) => ({
                      value: source._id,
                      label: `${source.accountName} (${source.accountNumber})`,
                    }))}
                    value={expenseData.paymentSource}
                    onValueChange={(val) =>
                      setExpenseData((prev) => ({ ...prev, paymentSource: val }))
                    }
                    placeholder="Select Payment Source"
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Reference No</Label>
                  <Input
                    value={expenseData.referenceNo}
                    onChange={(e) =>
                      setExpenseData((prev) => ({
                        ...prev,
                        referenceNo: e.target.value,
                      }))
                    }
                    placeholder="Reference Number"
                    className="text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Upload Document</Label>
                <Input
                  type="file"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const formData = new FormData();
                      formData.append("file", file);
                      try {
                        const response = await authFetch("/api/upload", {
                          method: "POST",
                          body: formData,
                        });
                        if (!response.ok) throw new Error('File upload failed.');
                        const { url } = await response.json();
                        setExpenseData((prev) => ({
                          ...prev,
                          document: url,
                        }));
                        toast({
                          title: "Success",
                          description: "File uploaded successfully",
                        });
                      } catch (error) {
                        toast({
                          variant: "destructive",
                          title: "Error",
                          description: "Failed to upload file",
                        });
                      }
                    }
                  }}
                  className="text-sm"
                />
              </div>
            </form>
          </div>
          <DialogFooter className="border-t pt-4 flex flex-col sm:flex-row gap-2">
            <DialogClose asChild>
              <Button type="button" variant="outline" onClick={resetForm} className="w-full sm:w-auto">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" form="expense-form" disabled={isSaving} className="w-full sm:w-auto">
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingExpense ? "Update Expense" : "Save Expense"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewingExpense} onOpenChange={(open) => !open && setViewingExpense(null)}>
        <DialogContent className={`max-w-[95vw] md:max-w-4xl max-h-[90vh] overflow-y-auto ${isMobile ? 'p-4' : ''}`}>
          <DialogHeader>
            <DialogTitle className={isMobile ? 'text-lg' : ''}>Expense Details</DialogTitle>
            <DialogDescription className={isMobile ? 'text-xs' : ''}>Complete expense information</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 text-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date:</span>
                  <span className="font-medium">{viewingExpense?.date ? new Date(viewingExpense.date).toLocaleDateString() : '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Expense Type:</span>
                  <span>{viewingExpense?.expenseType || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Items Type:</span>
                  <span>{viewingExpense?.itemType?.name || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Debit (Expense):</span>
                  <span className="font-medium">₹{viewingExpense?.debit?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Credit (Advance):</span>
                  <span className="font-medium">₹{viewingExpense?.credit?.toFixed(2) || '0.00'}</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment Mode:</span>
                  <span>{viewingExpense?.paymentMode?.payType || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment Source:</span>
                  <span>{viewingExpense?.paymentSource ? `${viewingExpense.paymentSource.accountName} - ${viewingExpense.paymentSource.accountNumber}` : '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Reference No:</span>
                  <span>{viewingExpense?.referenceNo || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">TDS:</span>
                  <span>₹{viewingExpense?.tds?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Purchase Bill:</span>
                  <span>{viewingExpense?.purchaseBill || '-'}</span>
                </div>
              </div>
            </div>
            <div className="border-t pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-muted-foreground text-sm">Particulars:</span>
                  <p className="mt-1 break-words">{viewingExpense?.particulars || '-'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-sm">Remarks:</span>
                  <p className="mt-1 break-words">{viewingExpense?.remarks || '-'}</p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => handleEditExpense(viewingExpense)} className="w-full sm:w-auto">
              <Edit className="mr-2 h-4 w-4" /> Edit
            </Button>
            <Button variant="secondary" onClick={() => setViewingExpense(null)} className="w-full sm:w-auto">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card className="w-full overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <CardTitle className="text-xl sm:text-2xl">{isFromPurchase ? "Manage Purchase" : "Manage Expenses"}</CardTitle>
              <CardDescription className={isMobile ? 'text-xs' : ''}>
                {isFromPurchase ? "Manage purchase payments and transactions." : "Track business expenses, receipts, and generate expense reports."}
              </CardDescription>
            </div>
            <Button 
              onClick={() => {
                resetForm();
                setIsExpenseDialogOpen(true);
              }}
              size={isMobile ? "sm" : "default"}
              className="w-full sm:w-auto"
            >
              <PlusCircle className="mr-2 h-4 w-4" /> Add Expense
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            {isMobile ? (
              // Mobile view - Card layout
              <div className="space-y-4 p-4">
                {isLoading ? (
                  <div className="text-center py-8">
                    <Loader2 className="animate-spin mx-auto h-8 w-8" />
                    <p className="mt-2 text-muted-foreground">Loading expenses...</p>
                  </div>
                ) : expenses.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No expenses found.
                  </div>
                ) : (
                  expenses.map((expense) => (
                    <div key={expense._id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium truncate max-w-[200px]" title={expense.particulars}>
                            {expense.particulars}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(expense.date).toLocaleDateString()} • {expense.expenseType}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleViewExpense(expense)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditExpense(expense)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDeleteExpense(expense._id)} disabled={deletingId === expense._id}>
                            {deletingId === expense._id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 text-destructive" />}
                          </Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                        <div>
                          <div className="text-xs text-muted-foreground">Debit</div>
                          <div className="font-medium">₹{expense.debit?.toFixed(2) || '0.00'}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Credit</div>
                          <div className="font-medium">₹{expense.credit?.toFixed(2) || '0.00'}</div>
                        </div>
                      </div>
                      <div className="text-sm">
                        <div className="text-xs text-muted-foreground">Payment Mode</div>
                        <div>{expense.paymentMode?.payType || '-'}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              // Desktop view - Table layout
              <div className="border-t">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-medium">Date</TableHead>
                      <TableHead className="font-medium">Particulars</TableHead>
                      <TableHead className="font-medium">Type</TableHead>
                      <TableHead className="font-medium text-right">Debit</TableHead>
                      <TableHead className="font-medium text-right">Credit</TableHead>
                      <TableHead className="font-medium">Payment Mode</TableHead>
                      <TableHead className="font-medium text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center h-24">
                          <Loader2 className="animate-spin mx-auto" />
                        </TableCell>
                      </TableRow>
                    ) : expenses.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center h-24">
                          No expenses found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      expenses.map((expense) => (
                        <TableRow key={expense._id} className="hover:bg-muted/50">
                          <TableCell>{new Date(expense.date).toLocaleDateString()}</TableCell>
                          <TableCell className="max-w-[200px] truncate" title={expense.particulars}>
                            {expense.particulars}
                          </TableCell>
                          <TableCell>{expense.expenseType}</TableCell>
                          <TableCell className="text-right font-medium">
                            ₹{expense.debit?.toFixed(2) || '0.00'}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            ₹{expense.credit?.toFixed(2) || '0.00'}
                          </TableCell>
                          <TableCell>{expense.paymentMode?.payType || '-'}</TableCell>
                          <TableCell className="text-right space-x-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleViewExpense(expense)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditExpense(expense)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDeleteExpense(expense._id)} disabled={deletingId === expense._id}>
                              {deletingId === expense._id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 text-destructive" />}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


