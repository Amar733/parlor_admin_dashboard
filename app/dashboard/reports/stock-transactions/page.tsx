"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { usePermission } from "@/hooks/use-permission";
import { useRouter, usePathname } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface StockTransaction {
  _id: string;
  product: string;
  transactionType: "IN" | "OUT" | "TRANSFER_IN" | "TRANSFER_OUT";
  qty: number;
  reference?: string;
  transactionDate: string;
  productDetails: {
    _id: string;
    productName: string;
    mrp: number;
    sellingPrice: number;
  };
  storeDetails: {
    _id: string;
    name: string;
    contactPerson: string;
  };
}

export default function StockTransactionsPage() {
  const { user, authFetch, loading: authLoading } = useAuth();
  const { can } = usePermission();
  const router = useRouter();
  const pathname = usePathname();
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [storeFilter, setStoreFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  useEffect(() => {
    if (!authLoading) {
      if (!can('view', pathname)) {
        router.push('/dashboard');
      } else {
        fetchTransactions();
      }
    }
  }, [user, authLoading, can, router, pathname]);

  const fetchTransactions = async () => {
    try {
      const response = await authFetch("/api/stock/get-stock-transactions");
      const data = await response.json();
      setTransactions(data.data?.transactions || []);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "IN": return "bg-green-100 text-green-800";
      case "OUT": return "bg-red-100 text-red-800";
      case "TRANSFER_IN": return "bg-blue-100 text-blue-800";
      case "TRANSFER_OUT": return "bg-orange-100 text-orange-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const filteredTransactions = transactions.filter(t => {
    const searchTerm = filter.toLowerCase();
    const matchesSearch = !filter || 
      t.productDetails.productName.toLowerCase().includes(searchTerm) ||
      t.reference?.toLowerCase().includes(searchTerm) ||
      t.storeDetails.name.toLowerCase().includes(searchTerm) ||
      t.storeDetails.contactPerson.toLowerCase().includes(searchTerm) ||
      t.qty.toString().includes(searchTerm) ||
      t.productDetails.sellingPrice.toString().includes(searchTerm) ||
      new Date(t.transactionDate).toLocaleDateString().toLowerCase().includes(searchTerm);
    
    const matchesType = typeFilter === "all" || t.transactionType === typeFilter;
    const matchesStore = storeFilter === "all" || t.storeDetails._id === storeFilter;
    const transactionDate = new Date(t.transactionDate);
    const matchesDate = (!fromDate || transactionDate >= new Date(fromDate)) && 
                       (!toDate || transactionDate <= new Date(toDate));
    
    return matchesSearch && matchesType && matchesStore && matchesDate;
  });

  const uniqueStores = Array.from(new Set(transactions.map(t => t.storeDetails._id)))
    .map(id => transactions.find(t => t.storeDetails._id === id)?.storeDetails)
    .filter((store): store is NonNullable<typeof store> => Boolean(store));

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Stock Transactions</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input
          placeholder="Search all fields..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="IN">Stock In</SelectItem>
            <SelectItem value="OUT">Stock Out</SelectItem>
            <SelectItem value="TRANSFER_IN">Transfer In</SelectItem>
            <SelectItem value="TRANSFER_OUT">Transfer Out</SelectItem>
          </SelectContent>
        </Select>
        <Select value={storeFilter} onValueChange={setStoreFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by store" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stores</SelectItem>
            {uniqueStores.map((store) => (
              <SelectItem key={store._id} value={store._id}>{store.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          type="date"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          placeholder="From date"
        />
        <Input
          type="date"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
          placeholder="To date"
        />
      </div>

      <div className="grid gap-4">
        {filteredTransactions.map((transaction) => (
          <Card key={transaction._id}>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{transaction.productDetails.productName}</CardTitle>
                <Badge className={getTypeColor(transaction.transactionType)}>
                  {transaction.transactionType.replace("_", " ")}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="font-medium">Quantity:</span> {transaction.qty}
                </div>
                <div>
                  <span className="font-medium">Store:</span> {transaction.storeDetails.name}
                </div>
                <div>
                  <span className="font-medium">Date:</span> {new Date(transaction.transactionDate).toLocaleDateString()}
                </div>
                <div>
                  <span className="font-medium">Price:</span> ₹{transaction.productDetails.sellingPrice.toFixed(2)}
                </div>
              </div>
              {transaction.reference && (
                <div className="text-sm">
                  <span className="font-medium">Reference:</span> {transaction.reference}
                </div>
              )}
              <div className="text-xs text-gray-500">
                Contact: {transaction.storeDetails.contactPerson}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTransactions.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No stock transactions found
        </div>
      )}
    </div>
  );
}