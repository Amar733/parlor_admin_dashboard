"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { usePermission } from "@/hooks/use-permission";
import { useRouter, usePathname } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Package, TrendingUp, TrendingDown, AlertTriangle, MapPin, DollarSign, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, RotateCcw } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Store {
  storeId: string;
  storeName: string;
  storeAddress: string;
  totalProducts: number;
  totalQuantity: number;
  totalValue: number;
}

interface Product {
  productId: string;
  productName: string;
  categoryName: string;
  type?: string;
  currentStock: number | string;
  mrp: number;
  sellingPrice: number;
  stockValue: number;
  minStockThreshold: number;
  isLowStock: boolean;
  isSoldOut: boolean;
  todayIncrease: number;
  todayDecrease: number;
  todayNetChange: number;
  lastTransaction: string | null;
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

interface ProductsResponse {
  type: "products";
  storeId: string;
  products: Product[];
  pagination: Pagination;
  summary: {
    totalProducts: number;
    availableProducts: number;
    lowStockItems: number;
    soldOutItems: number;
    totalStockValue: number;
    todayTotalIncrease: number;
    todayTotalDecrease: number;
  };
}

const StoreSkeleton = () => (
  <Card>
    <CardContent className="p-6">
      <div className="flex justify-between items-start">
        <div className="space-y-3 flex-1">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
          <div className="flex items-center gap-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
        <Skeleton className="h-10 w-28" />
      </div>
    </CardContent>
  </Card>
);

const ProductSkeleton = () => (
  <Card>
    <CardContent className="p-4">
      <div className="flex justify-between items-start">
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-5 w-16" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
        <div className="space-y-1">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
    </CardContent>
  </Card>
);

export default function StoreReportPage() {
  const { user, authFetch, loading: authLoading } = useAuth();
  const { can } = usePermission();
  const router = useRouter();
  const pathname = usePathname();
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStore, setSelectedStore] = useState<ProductsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingStoreId, setLoadingStoreId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInput, setPageInput] = useState('1');
  const [stockFilter, setStockFilter] = useState<string | undefined>();

  useEffect(() => {
    if (!authLoading) {
      if (!can('view', pathname)) {
        router.push('/dashboard');
      } else {
        fetchStores();
      }
    }
  }, [user, authLoading, can, router, pathname]);

  const fetchStores = async () => {
    try {
      const response = await authFetch("/api/stock/get-stock-overview");
      const data = await response.json();
      if (data.success) {
        setStores(data.data.stores);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch stores",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStoreDetails = async (storeId: string, filter?: string, page: number = 1) => {
    setLoadingStoreId(storeId);
    try {
      let url = `/api/stock/get-stock-overview?storeId=${storeId}&page=${page}&limit=50`;
      if (filter) {
        url += `&stockFilter=${filter}`;
      }
      const response = await authFetch(url);
      const data = await response.json();
      if (data.success) {
        setSelectedStore(data.data);
        setCurrentPage(page);
        setStockFilter(filter);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch store details",
        variant: "destructive",
      });
    } finally {
      setLoadingStoreId(null);
    }
  };

  const handlePageChange = (page: number) => {
    if (selectedStore) {
      fetchStoreDetails(selectedStore.storeId, stockFilter, page);
    }
  };

  useEffect(() => {
    setPageInput(currentPage.toString());
  }, [currentPage]);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <StoreSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (selectedStore) {
    return (
      <div className="p-4 sm:p-6 space-y-6 sm:space-y-8 animate-fade-in">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-3 sm:p-4 border border-primary/20">
          <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <Button variant="outline" onClick={() => setSelectedStore(null)} className="border-primary/20 hover:bg-primary/10 w-fit">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Stores
            </Button>
            <Button 
              variant="outline" 
              onClick={() => fetchStoreDetails(selectedStore.storeId, undefined, 1)} 
              className="border-primary/20 hover:bg-primary/10 w-fit"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset Filter
            </Button>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse"></div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  Store Products
                </h1>
              </div>
              <p className="text-muted-foreground text-sm">
                Detailed inventory overview and stock analytics
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          <div 
            className="group relative overflow-hidden border-0 bg-gradient-to-br from-blue-500/10 to-blue-600/5 hover:from-blue-500/20 hover:to-blue-600/10 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/25 cursor-pointer rounded-lg"
            onClick={() => fetchStoreDetails(selectedStore.storeId, 'available', 1)}
          >
            <Card className="border-0 bg-transparent shadow-none">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
                <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  Total Products
                </CardTitle>
                <div className="p-2 rounded-lg bg-blue-500/20 group-hover:bg-blue-500/30 transition-colors duration-300">
                  <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="text-lg sm:text-xl font-bold text-blue-900 dark:text-blue-100 mb-1">{selectedStore.summary.totalProducts}</div>
                <p className="text-xs text-blue-600/70 dark:text-blue-400/70">
                  Total products
                </p>
              </CardContent>
            </Card>
          </div>

          <div 
            className="group relative overflow-hidden border-0 bg-gradient-to-br from-green-500/10 to-green-600/5 hover:from-green-500/20 hover:to-green-600/10 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-green-500/25 cursor-pointer rounded-lg"
            onClick={() => fetchStoreDetails(selectedStore.storeId, 'available', 1)}
          >
            <Card className="border-0 bg-transparent shadow-none">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
                <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">
                  Stock Value
                </CardTitle>
                <div className="p-2 rounded-lg bg-green-500/20 group-hover:bg-green-500/30 transition-colors duration-300">
                  <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="text-lg sm:text-xl font-bold text-green-900 dark:text-green-100 mb-1 break-words">₹{selectedStore.summary.totalStockValue.toLocaleString()}</div>
                <p className="text-xs text-green-600/70 dark:text-green-400/70">
                  Total inventory value
                </p>
              </CardContent>
            </Card>
          </div>

          <div 
            className="group relative overflow-hidden border-0 bg-gradient-to-br from-red-500/10 to-red-600/5 hover:from-red-500/20 hover:to-red-600/10 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-red-500/25 cursor-pointer rounded-lg"
            onClick={() => fetchStoreDetails(selectedStore.storeId, 'lowstock', 1)}
          >
            <Card className="border-0 bg-transparent shadow-none">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
                <CardTitle className="text-sm font-medium text-red-700 dark:text-red-300">
                  Low Stock Items
                </CardTitle>
                <div className="p-2 rounded-lg bg-red-500/20 group-hover:bg-red-500/30 transition-colors duration-300">
                  <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="text-lg sm:text-xl font-bold text-red-900 dark:text-red-100 mb-1">{selectedStore.summary.lowStockItems}</div>
                <p className="text-xs text-red-600/70 dark:text-red-400/70">
                  Needs restocking
                </p>
              </CardContent>
            </Card>
          </div>

          <div 
            className="group relative overflow-hidden border-0 bg-gradient-to-br from-purple-500/10 to-purple-600/5 hover:from-purple-500/20 hover:to-purple-600/10 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/25 cursor-pointer rounded-lg"
            onClick={() => fetchStoreDetails(selectedStore.storeId, 'available', 1)}
          >
            <Card className="border-0 bg-transparent shadow-none">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
                <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">
                  Available Items
                </CardTitle>
                <div className="p-2 rounded-lg bg-purple-500/20 group-hover:bg-purple-500/30 transition-colors duration-300">
                  <Package className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="text-lg sm:text-xl font-bold text-purple-900 dark:text-purple-100 mb-1">{selectedStore.summary.availableProducts}</div>
                <p className="text-xs text-purple-600/70 dark:text-purple-400/70">
                  In stock items
                </p>
              </CardContent>
            </Card>
          </div>

          <div 
            className="group relative overflow-hidden border-0 bg-gradient-to-br from-slate-500/10 to-slate-600/5 hover:from-slate-500/20 hover:to-slate-600/10 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-slate-500/25 cursor-pointer rounded-lg"
            onClick={() => fetchStoreDetails(selectedStore.storeId, 'soldout', 1)}
          >
            <Card className="border-0 bg-transparent shadow-none">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
                <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Sold Out Items
                </CardTitle>
                <div className="p-2 rounded-lg bg-gray-500/20 group-hover:bg-gray-500/30 transition-colors duration-300">
                  <AlertTriangle className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">{selectedStore.summary.soldOutItems}</div>
                <p className="text-xs text-gray-600/70 dark:text-gray-400/70">
                  Out of stock
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 hover:from-emerald-500/20 hover:to-emerald-600/10 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-emerald-500/25">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
              <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                Today Increase
              </CardTitle>
              <div className="p-2 rounded-lg bg-emerald-500/20 group-hover:bg-emerald-500/30 transition-colors duration-300">
                <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-lg sm:text-xl font-bold text-emerald-900 dark:text-emerald-100 mb-1">+{selectedStore.summary.todayTotalIncrease}</div>
              <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70">
                Stock added today
              </p>
            </CardContent>
          </Card>

          <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-orange-500/10 to-orange-600/5 hover:from-orange-500/20 hover:to-orange-600/10 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-orange-500/25">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
              <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-300">
                Today Decrease
              </CardTitle>
              <div className="p-2 rounded-lg bg-orange-500/20 group-hover:bg-orange-500/30 transition-colors duration-300">
                <TrendingDown className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-lg sm:text-xl font-bold text-orange-900 dark:text-orange-100 mb-1">{selectedStore.summary.todayTotalDecrease}</div>
              <p className="text-xs text-orange-600/70 dark:text-orange-400/70">
                Stock consumed today
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-secondary/5 to-secondary/10 backdrop-blur-sm">
          <CardHeader className="relative">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-1.5 w-1.5 rounded-full bg-secondary animate-pulse"></div>
              <CardTitle className="bg-gradient-to-r from-secondary to-secondary/70 bg-clip-text text-transparent">Product Inventory</CardTitle>
            </div>
            <CardDescription>
              Detailed view of all products with stock levels and pricing information.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingStoreId ? (
              Array.from({ length: 3 }).map((_, i) => <ProductSkeleton key={i} />)
            ) : (
              selectedStore.products.map((product) => (
                <Card key={product.productId} className="group relative overflow-hidden border-0 bg-gradient-to-br from-accent/5 to-accent/10 hover:from-accent/10 hover:to-accent/15 transition-all duration-300 hover:shadow-lg">
                  <CardContent className="p-6 relative">
                    <div className="flex justify-between items-start">
                      <div className="space-y-4 flex-1">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <Package className="h-5 w-5 text-primary" />
                          </div>
                          <div className="space-y-1">
                            <h3 className="text-lg font-bold text-foreground">{product.productName}</h3>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="text-xs">{product.categoryName}</Badge>
                              {product.type && (
                                <Badge variant="outline" className="text-xs">{product.type}</Badge>
                              )}
                              {product.type !== 'Service' && product.currentStock === 0 ? (
                                <Badge variant="destructive" className="flex items-center gap-1 text-xs animate-pulse">
                                  <AlertTriangle className="h-3 w-3" />
                                  Sold Out
                                </Badge>
                              ) : product.type !== 'Service' && product.isLowStock && (
                                <Badge variant="destructive" className="flex items-center gap-1 text-xs animate-pulse">
                                  <AlertTriangle className="h-3 w-3" />
                                  Low Stock
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className={`grid grid-cols-1 sm:grid-cols-2 ${product.type === 'Service' ? 'lg:grid-cols-2' : 'lg:grid-cols-4'} gap-3 sm:gap-4`}>
                          {product.type !== 'Service' && (
                            <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                              <Package className="h-4 w-4 text-blue-600" />
                              <div>
                                <div className="text-xs text-muted-foreground">Current Stock</div>
                                <div className="font-semibold text-blue-600">{product.currentStock}</div>
                              </div>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                            <DollarSign className="h-4 w-4 text-green-600" />
                            <div>
                              <div className="text-xs text-muted-foreground">MRP</div>
                              <div className="font-semibold text-green-600">₹{product.mrp.toFixed(2)}</div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                            <DollarSign className="h-4 w-4 text-purple-600" />
                            <div>
                              <div className="text-xs text-muted-foreground">Selling Price</div>
                              <div className="font-semibold text-purple-600">₹{product.sellingPrice.toFixed(2)}</div>
                            </div>
                          </div>
                          
                          {product.type !== 'Service' && (
                            <div className="flex items-center gap-3 p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                              <DollarSign className="h-4 w-4 text-orange-600" />
                              <div>
                                <div className="text-xs text-muted-foreground">Stock Value</div>
                                <div className="font-semibold text-orange-600">₹{product.stockValue.toFixed(2)}</div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {product.type !== 'Service' && (
                        <div className="mt-4 lg:mt-0 lg:ml-6 flex lg:flex-col gap-3 lg:space-y-3">
                          <div className="text-center p-3 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                            <div className="flex items-center justify-center gap-1 text-sm font-medium text-green-700 dark:text-green-300">
                              <TrendingUp className="h-3 w-3" />
                              <span>+{product.todayIncrease}</span>
                            </div>
                            <div className="text-xs text-green-600/70 dark:text-green-400/70">Today In</div>
                          </div>
                          
                          <div className="text-center p-3 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/20 dark:to-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                            <div className="flex items-center justify-center gap-1 text-sm font-medium text-red-700 dark:text-red-300">
                              <TrendingDown className="h-3 w-3" />
                              <span>-{product.todayDecrease}</span>
                            </div>
                            <div className="text-xs text-red-600/70 dark:text-red-400/70">Today Out</div>
                          </div>
                          
                          <div className="text-center p-3 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950/20 dark:to-gray-900/20 rounded-lg border border-gray-200 dark:border-gray-800">
                            <div className={`text-sm font-bold ${product.todayNetChange > 0 ? 'text-green-600' : product.todayNetChange < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                              {product.todayNetChange > 0 ? '+' : ''}{product.todayNetChange}
                            </div>
                            <div className="text-xs text-gray-600/70 dark:text-gray-400/70">Net Change</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
            
            {selectedStore.pagination && selectedStore.pagination.totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Showing {selectedStore.products.length > 0 ? ((selectedStore.pagination.currentPage - 1) * selectedStore.pagination.itemsPerPage) + 1 : 0} to {Math.min(selectedStore.pagination.currentPage * selectedStore.pagination.itemsPerPage, selectedStore.pagination.totalItems)} of {selectedStore.pagination.totalItems} products
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(1)}
                    disabled={selectedStore.pagination.currentPage === 1 || loadingStoreId !== null}
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(selectedStore.pagination.currentPage - 1)}
                    disabled={selectedStore.pagination.currentPage === 1 || loadingStoreId !== null}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="flex items-center space-x-1">
                    <span className="text-sm">Page</span>
                    <Input
                      type="text"
                      value={pageInput}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === '' || /^\d+$/.test(value)) {
                          setPageInput(value);
                          if (value !== '' && parseInt(value) >= 1 && parseInt(value) <= selectedStore.pagination.totalPages) {
                            handlePageChange(parseInt(value));
                          }
                        }
                      }}
                      onBlur={() => setPageInput(selectedStore.pagination.currentPage.toString())}
                      onFocus={(e) => e.target.select()}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          const page = parseInt(pageInput);
                          if (page >= 1 && page <= selectedStore.pagination.totalPages) {
                            handlePageChange(page);
                          } else {
                            setPageInput(selectedStore.pagination.currentPage.toString());
                          }
                        }
                      }}
                      className="w-16 h-8 text-center text-sm"
                      disabled={loadingStoreId !== null}
                    />
                    <span className="text-sm">of {selectedStore.pagination.totalPages}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(selectedStore.pagination.currentPage + 1)}
                    disabled={selectedStore.pagination.currentPage === selectedStore.pagination.totalPages || loadingStoreId !== null}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(selectedStore.pagination.totalPages)}
                    disabled={selectedStore.pagination.currentPage === selectedStore.pagination.totalPages || loadingStoreId !== null}
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 sm:space-y-8 animate-fade-in">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-3 sm:p-4 border border-primary/20">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="relative">
          <div className="flex items-center gap-2 mb-1">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse"></div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Store Reports
            </h1>
          </div>
          <p className="text-muted-foreground text-sm">
            Comprehensive overview of all store locations and their inventory status
          </p>
        </div>
      </div>
      
      <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-secondary/5 to-secondary/10 backdrop-blur-sm">
        <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-transparent"></div>
        <CardHeader className="relative">
          <CardDescription>
            Click on any store to view detailed product inventory and stock analytics.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {stores.map((store) => (
            <Card key={store.storeId} className="group relative overflow-hidden border-0 bg-gradient-to-br from-accent/5 to-accent/10 hover:from-accent/10 hover:to-accent/15 transition-all duration-300 hover:shadow-xl hover:scale-[1.02]">
              <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardContent className="p-4 sm:p-6 relative">
                <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
                  <div className="space-y-4 flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="p-2 sm:p-3 rounded-xl bg-gradient-to-br from-primary/10 to-primary/20 border border-primary/20 w-fit">
                        <Package className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-lg sm:text-xl font-bold text-foreground group-hover:text-primary transition-colors duration-300">{store.storeName}</h3>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span className="text-sm">{store.storeAddress}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                      <div className="group/metric relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 p-4 border border-blue-200 dark:border-blue-800 hover:shadow-lg transition-all duration-300">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover/metric:opacity-100 transition-opacity duration-300"></div>
                        <div className="flex items-center gap-3 relative">
                          <div className="p-2 rounded-lg bg-blue-500/20 group-hover/metric:bg-blue-500/30 transition-colors duration-300">
                            <Package className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <div className="text-sm text-blue-600/70 dark:text-blue-400/70">Products</div>
                            <div className="text-lg font-bold text-blue-700 dark:text-blue-300">{store.totalProducts}</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="group/metric relative overflow-hidden rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20 p-4 border border-purple-200 dark:border-purple-800 hover:shadow-lg transition-all duration-300">
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover/metric:opacity-100 transition-opacity duration-300"></div>
                        <div className="flex items-center gap-3 relative">
                          <div className="p-2 rounded-lg bg-purple-500/20 group-hover/metric:bg-purple-500/30 transition-colors duration-300">
                            <Package className="h-5 w-5 text-purple-600" />
                          </div>
                          <div>
                            <div className="text-sm text-purple-600/70 dark:text-purple-400/70">Quantity</div>
                            <div className="text-lg font-bold text-purple-700 dark:text-purple-300">{store.totalQuantity}</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="group/metric relative overflow-hidden rounded-xl bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 p-4 border border-green-200 dark:border-green-800 hover:shadow-lg transition-all duration-300">
                        <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover/metric:opacity-100 transition-opacity duration-300"></div>
                        <div className="flex items-center gap-3 relative">
                          <div className="p-2 rounded-lg bg-green-500/20 group-hover/metric:bg-green-500/30 transition-colors duration-300">
                            <DollarSign className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <div className="text-sm text-green-600/70 dark:text-green-400/70">Total Value</div>
                            <div className={`text-base sm:text-lg font-bold break-words ${store.totalValue < 0 ? 'text-red-600' : 'text-green-700 dark:text-green-300'}`}>
                              ₹{store.totalValue.toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-center lg:justify-start">
                    <Button 
                      onClick={() => fetchStoreDetails(store.storeId)}
                      disabled={loadingStoreId === store.storeId}
                      className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 border-0 shadow-lg hover:shadow-xl transition-all duration-300 w-full sm:w-auto"
                      size="lg"
                    >
                      {loadingStoreId === store.storeId ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                          <span className="hidden sm:inline">Loading...</span>
                          <span className="sm:hidden">Loading</span>
                        </>
                      ) : (
                        <>
                          <span className="hidden sm:inline">View Details</span>
                          <span className="sm:hidden">Details</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}