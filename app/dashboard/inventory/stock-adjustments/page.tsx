"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { usePermission } from "@/hooks/use-permission";
import { usePathname, useRouter } from "next/navigation";
import { format } from "date-fns";
import type { Product, ProductLocation, StockAdjustment } from "@/lib/data";

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
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Trash2, PlusCircle, Eye } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { SearchableSelect } from "@/components/ui/searchable-select";

export default function StockAdjustmentPage() {
  const { user: currentUser, authFetch, loading: authLoading } = useAuth();
  const { can } = usePermission();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [locations, setLocations] = useState<ProductLocation[]>([]);
  const [adjustments, setAdjustments] = useState<StockAdjustment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTableLoading, setIsTableLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [adjustmentData, setAdjustmentData] = useState({
    sourceStoreId: "",
    destinationStoreId: "",
    productId: "",
    quantity: 0,
    note: "",
  });
  const [storesWithStock, setStoresWithStock] = useState<any[]>([]);
  const [viewingTransfer, setViewingTransfer] = useState<any>(null);
  const [filters, setFilters] = useState({
    productId: '',
    storeId: '',
    startDate: '',
    endDate: '',
    productName: '',
    transactionType: 'ALL'
  });

  const fetchData = useCallback(async (filterParams = filters, isInitialLoad = false) => {
    if (isInitialLoad) {
      setIsLoading(true);
    } else {
      setIsTableLoading(true);
    }
    
    try {
      // Build URL with the specific format expected by the API
      let url = '/api/stock/get-stock-transfers?';
      url += `productId=${filterParams.productId || ''}&`;
      url += `storeId=${filterParams.storeId || ''}&`;
      url += `startDate=${filterParams.startDate || ''}&`;
      url += `endDate=${filterParams.endDate || ''}&`;
      url += `productName=${filterParams.productName || ''}&`;
      url += `page=1&limit=50`;

      const requests = [authFetch(url)];
      if (isInitialLoad) {
        requests.unshift(authFetch("/api/products"));
      }

      const responses = await Promise.all(requests);
      const adjustmentsRes = isInitialLoad ? responses[1] : responses[0];
      
      if (isInitialLoad) {
        setProducts((await responses[0].json()).data || []);
      }
      
      const transfersData = await adjustmentsRes.json();
      let transfers = transfersData.success ? transfersData.data.transfers : [];
      
      if (filterParams.transactionType && filterParams.transactionType !== 'ALL') {
        transfers = transfers.filter(t => t.transactionType === filterParams.transactionType);
      }
      
      setAdjustments(transfers);
    } catch (error) {
      if (
        !(error instanceof Error) ||
        !error.message.includes("Session expired")
      ) {
        toast({
          variant: "destructive",
          title: "Error",
          description: (error as Error).message,
        });
      }
    } finally {
      if (isInitialLoad) {
        setIsLoading(false);
      } else {
        setIsTableLoading(false);
      }
    }
  }, [authFetch, toast]);

  useEffect(() => {
    if (!authLoading) {
      if (!currentUser || !can("view", pathname)) {
        router.push("/dashboard");
      } else {
        fetchData(filters, true);
      }
    }
  }, [authLoading, currentUser, can, router, pathname]);

  const handleApplyFilters = () => {
    fetchData(filters, false);
  };

  const handleClearFilters = () => {
    const clearedFilters = { productId: '', storeId: '', startDate: '', endDate: '', productName: '', transactionType: 'ALL' };
    setFilters(clearedFilters);
    fetchData(clearedFilters, false);
  };

  const handleDialogOpenChange = (open: boolean) => {
    if (!open) {
      setAdjustmentData({
        sourceStoreId: "",
        destinationStoreId: "",
        productId: "",
        quantity: 0,
        note: "",
      });
    }
    setIsDialogOpen(open);
  };

  const handleAdjustmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const {
      productId,
      sourceStoreId,
      destinationStoreId,
      quantity,
      note,
    } = adjustmentData;
    if (!productId || !sourceStoreId || !destinationStoreId || quantity <= 0) {
      toast({
        variant: "destructive",
        title: "Missing Fields",
        description: "Please select product, source store, destination store and specify a valid quantity.",
      });
      return;
    }

    const adjustmentPayload = {
      fromStoreId: sourceStoreId,
      toStoreId: destinationStoreId,
      productId,
      qty: quantity,
      notes: note,
    };

    setIsSaving(true);
    try {
      const response = await authFetch("/api/stock/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(adjustmentPayload),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Stock adjustment completed successfully.",
        });
        setAdjustmentData({
          sourceStoreId: "",
          destinationStoreId: "",
          productId: "",
          quantity: 0,
          note: "",
        });
        setIsDialogOpen(false);
        fetchData(filters, false);
      } else {
        const error = await response.json();
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message || "Failed to adjust stock.",
        });
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

  const fetchProductStock = async (productId: string) => {
    if (!productId) return;
    try {
      const response = await authFetch(`/api/stock/product/${productId}`);
      const data = await response.json();
      if (data.success) {
        setStoresWithStock(data.data.stores || []);
      }
    } catch (error) {
      console.error('Failed to fetch stock:', error);
      setStoresWithStock([]);
    }
  };

  useEffect(() => {
    if (adjustmentData.productId) {
      fetchProductStock(adjustmentData.productId);
    } else {
      setStoresWithStock([]);
    }
  }, [adjustmentData.productId]);

  const getStoreOptions = () => {
    return storesWithStock.map(store => ({
      value: store.storeId,
      label: `${store.storeName} (Stock: ${store.stock})`
    }));
  };

  const productStock = useMemo(() => {
    if (!adjustmentData.sourceStoreId) return 0;
    const storeStock = storesWithStock.find(s => s.storeId === adjustmentData.sourceStoreId);
    return storeStock?.stock || 0;
  }, [adjustmentData.sourceStoreId, storesWithStock]);

  if (isLoading || authLoading) {
    return (
      <div className="flex justify-center p-10">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 p-4 text-white shadow-2xl">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-100 bg-clip-text text-transparent">
                  Stock Adjustment
                </h1>
                <p className="text-slate-100 text-sm">
                  Manually adjust stock levels for products
                </p>
              </div>
              {can("edit", pathname) && (
                <DialogTrigger asChild>
                  <Button
                    variant="secondary"
                    className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30"
                  >
                    <PlusCircle className="mr-2 h-4 w-4" /> New Adjustment
                  </Button>
                </DialogTrigger>
              )}
            </div>
          </div>
          <div className="absolute -top-4 -right-4 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
          <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-slate-400/20 rounded-full blur-2xl"></div>
        </div>

        <DialogContent className="sm:max-w-xl flex flex-col max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Transfer Product Stock</DialogTitle>
            <DialogDescription>
              Transfer stock quantity from one store to another.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-1">
            <form
              id="adjustment-form"
              onSubmit={handleAdjustmentSubmit}
              className="space-y-4 p-4"
            >
              <div className="space-y-2">
                <Label>Product</Label>
                <SearchableSelect
                  options={products.map((prod) => ({
                    value: prod._id,
                    label: `${prod.productName} (${prod.batchNo})`,
                  }))}
                  value={adjustmentData.productId}
                  onValueChange={(val) =>
                    setAdjustmentData((p) => ({ ...p, productId: val, sourceStoreId: '', destinationStoreId: '' }))
                  }
                  placeholder="Select a product"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>
                    From Store{" "}
                    <span className="text-xs text-muted-foreground">
                      (Stock: {productStock})
                    </span>
                  </Label>
                  <SearchableSelect
                    options={getStoreOptions()}
                    value={adjustmentData.sourceStoreId}
                    onValueChange={(val) =>
                      setAdjustmentData((p) => ({ ...p, sourceStoreId: val }))
                    }
                    placeholder={adjustmentData.productId ? "Select from store" : "Select product first"}
                    disabled={!adjustmentData.productId}
                  />
                </div>
                <div className="space-y-2">
                  <Label>To Store</Label>
                  <SearchableSelect
                    options={storesWithStock
                      .filter((s) => s.storeId !== adjustmentData.sourceStoreId)
                      .map((store) => ({ value: store.storeId, label: `${store.storeName} (Stock: ${store.stock})` }))}
                    value={adjustmentData.destinationStoreId}
                    onValueChange={(val) =>
                      setAdjustmentData((p) => ({
                        ...p,
                        destinationStoreId: val,
                      }))
                    }
                    placeholder={adjustmentData.productId ? "Select to store" : "Select product first"}
                    disabled={!adjustmentData.productId}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Quantity</Label>
                <Input
                  type="number"
                  min="1"
                  required
                  value={adjustmentData.quantity || ""}
                  onChange={(e) =>
                    setAdjustmentData((p) => ({
                      ...p,
                      quantity: parseInt(e.target.value) || 0,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Reason/Note</Label>
                <Textarea
                  placeholder="Explain the reason for this adjustment"
                  value={adjustmentData.note}
                  onChange={(e) =>
                    setAdjustmentData((p) => ({ ...p, note: e.target.value }))
                  }
                />
              </div>
            </form>
          </div>
          <DialogFooter className="border-t pt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" form="adjustment-form" disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Adjust Stock
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card className="animate-slide-up">
        <CardHeader>
          <CardTitle className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-indigo-400">
            Transfer History
          </CardTitle>
          <CardDescription>A log of all stock transfers between stores.</CardDescription>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
            <div className="space-y-1">
              <Label className="text-xs">Product</Label>
              <SearchableSelect
                options={products.map(p => ({ value: p._id, label: p.productName }))}
                value={filters.productId}
                onValueChange={(val) => setFilters(f => ({ ...f, productId: val }))}
                placeholder="All Products"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Store</Label>
              <SearchableSelect
                options={Array.from(new Set(adjustments.map(a => a.storeDetails?.name).filter(Boolean)))
                  .map(name => ({ value: adjustments.find(a => a.storeDetails?.name === name)?.store || '', label: name }))}
                value={filters.storeId}
                onValueChange={(val) => setFilters(f => ({ ...f, storeId: val }))}
                placeholder="All Stores"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Transaction Type</Label>
              <Select value={filters.transactionType} onValueChange={(val) => setFilters(f => ({ ...f, transactionType: val }))}>
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Types</SelectItem>
                  <SelectItem value="TRANSFER_IN">Transfer In</SelectItem>
                  <SelectItem value="TRANSFER_OUT">Transfer Out</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Product Name</Label>
              <SearchableSelect
                options={products.map(p => ({ value: p.productName, label: p.productName }))}
                value={filters.productName}
                onValueChange={(val) => setFilters(f => ({ ...f, productName: val }))}
                placeholder="Search product..."
                searchPlaceholder="Type to search products..."
                emptyText="No products found."
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
            <div className="space-y-1">
              <Label className="text-xs">Start Date</Label>
              <Input
                type="date"
                className="h-8"
                value={filters.startDate}
                onChange={(e) => setFilters(f => ({ ...f, startDate: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">End Date</Label>
              <Input
                type="date"
                className="h-8"
                value={filters.endDate}
                onChange={(e) => setFilters(f => ({ ...f, endDate: e.target.value }))}
              />
            </div>
            <div className="flex items-end">
              <Button size="sm" onClick={handleApplyFilters} className="h-8" disabled={isTableLoading}>
                {isTableLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Apply Filters
              </Button>
            </div>
            <div className="flex items-end">
              <Button 
                size="sm" 
                variant="outline" 
                className="h-8"
                onClick={handleClearFilters}
                disabled={isTableLoading}
              >
                Clear All
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Store</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Date</TableHead>
                  {can("delete", pathname) && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {isTableLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><div className="h-4 bg-muted animate-pulse rounded" /></TableCell>
                      <TableCell><div className="h-4 bg-muted animate-pulse rounded" /></TableCell>
                      <TableCell><div className="h-4 bg-muted animate-pulse rounded" /></TableCell>
                      <TableCell><div className="h-4 bg-muted animate-pulse rounded" /></TableCell>
                      <TableCell><div className="h-4 bg-muted animate-pulse rounded" /></TableCell>
                      <TableCell><div className="h-4 bg-muted animate-pulse rounded" /></TableCell>
                      {can("delete", pathname) && <TableCell><div className="h-4 bg-muted animate-pulse rounded" /></TableCell>}
                    </TableRow>
                  ))
                ) : adjustments.length > 0 ? (
                  adjustments.map((adj) => (
                    <TableRow key={adj._id}>
                      <TableCell>{adj.storeDetails?.name}</TableCell>
                      <TableCell>{adj.productDetails?.productName}</TableCell>
                      <TableCell>{adj.transactionType}</TableCell>
                      <TableCell
                        className={
                          adj.transactionType === "TRANSFER_OUT"
                            ? "text-destructive"
                            : "text-green-600"
                        }
                      >
                        {adj.transactionType === "TRANSFER_OUT" ? `-${adj.qty}` : `+${adj.qty}`}
                      </TableCell>
                      <TableCell>{adj.reference || "-"}</TableCell>
                      <TableCell>
                        {adj.createdAt
                          ? format(new Date(adj.createdAt), "dd-MM-yyyy HH:mm")
                          : "N/A"}
                      </TableCell>
                      {can("delete", pathname) && (
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setViewingTransfer(adj)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={can("delete", pathname) ? 7 : 6}
                      className="h-24 text-center"
                    >
                      No stock transfers recorded yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!viewingTransfer} onOpenChange={(open) => !open && setViewingTransfer(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Transfer Details</DialogTitle>
            <DialogDescription>Complete information about this stock transfer</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Product</Label>
                <p className="text-sm">{viewingTransfer?.productDetails?.productName}</p>
                <p className="text-xs text-muted-foreground">Batch: {viewingTransfer?.productDetails?.batchNo}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Store</Label>
                <p className="text-sm">{viewingTransfer?.storeDetails?.name}</p>
                <p className="text-xs text-muted-foreground">{viewingTransfer?.storeDetails?.address}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Transaction Type</Label>
                <p className={`text-sm font-medium ${
                  viewingTransfer?.transactionType === "TRANSFER_OUT" ? "text-destructive" : "text-green-600"
                }`}>
                  {viewingTransfer?.transactionType}
                </p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Quantity</Label>
                <p className="text-sm font-medium">{viewingTransfer?.qty}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Date</Label>
                <p className="text-sm">
                  {viewingTransfer?.createdAt ? format(new Date(viewingTransfer.createdAt), "dd-MM-yyyy HH:mm") : "N/A"}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Reference</Label>
              <p className="text-sm">{viewingTransfer?.reference || "No reference"}</p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Notes</Label>
              <p className="text-sm">{viewingTransfer?.notes || "No notes"}</p>
            </div>

            {viewingTransfer?.productDetails && (
              <div className="border-t pt-4">
                <Label className="text-sm font-medium">Product Details</Label>
                <div className="grid grid-cols-2 gap-4 mt-2 text-xs">
                  <div>SKU: {viewingTransfer.productDetails.sku}</div>
                  <div>HSN/SAC: {viewingTransfer.productDetails.hsnSac}</div>
                  <div>MRP: ₹{viewingTransfer.productDetails.mrp}</div>
                  <div>Purchase Price: ₹{viewingTransfer.productDetails.purchasePrice}</div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setViewingTransfer(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
