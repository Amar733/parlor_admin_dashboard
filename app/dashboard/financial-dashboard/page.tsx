"use client";

import { useState, useEffect } from "react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart } from "recharts";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarDays, TrendingUp, DollarSign, CreditCard, Wallet, ShoppingCart, Users, Package, Building2, RefreshCw, ArrowUpRight, ArrowDownRight, Minus, Filter, Check, BarChart3 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";
import { usePermission } from "@/hooks/use-permission";
import { useRouter, usePathname } from "next/navigation";
import { format } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox";

interface FinancialData {
  financials: {
    totalSales: number;
    totalPurchases: number;
    totalExpenses: number;
    totalIncome: number;
    totalProfit: number;
    totalLoss: number;
    todaySales: number;
    todayPurchases: number;
  };
  charts: {
    monthlySales: Array<{
      _id: { year: number; month: number };
      total: number;
      count: number;
    }>;
    monthlyPurchases: Array<{
      _id: { year: number; month: number };
      total: number;
      count: number;
    }>;
    expensesByCategory: Array<{
      _id: string;
      categoryName: string;
      total: number;
      count: number;
    }>;
    expensesByPaymentMode: Array<{
      _id: string;
      paymentType: string | null;
      total: number;
      count: number;
    }>;
  };
  serviceSales?: {
    summary: Array<{
      serviceId: string;
      serviceName: string;
      totalQuantitySold: number;
      totalRevenue: number;
      totalOrders: number;
    }>;
    topServices: Array<{
      _id: string;
      serviceName: string;
      totalQuantitySold: number;
      totalRevenue: number;
      totalOrders: number;
    }>;
  };
  counts: {
    totalProducts: number;
    totalServices: number;
    totalPatients: number;
    totalSuppliers: number;
    totalEmployees: number;
  };
  todayCounts?: {
    todayPatients: number;
    todayProducts: number;
    todayServices: number;
    todaySuppliers: number;
    todayEmployees: number;
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const getMonthName = (month: number) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months[month - 1];
};

export default function FinancialDashboardPage() {
  const { user, authFetch, loading: authLoading } = useAuth();
  const { can } = usePermission();
  const router = useRouter();
  const pathname = usePathname();
  const [data, setData] = useState<FinancialData | null>(null);
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState<Date | undefined>(undefined);
  const [toDate, setToDate] = useState<Date | undefined>(undefined);


  const handleClearAll = () => {
    setFromDate(undefined);
    setToDate(undefined);
  };

  const fetchFinancialData = async () => {
    try {
      setLoading(true);
      let url = '/api/finance/dashboard';
      const params = new URLSearchParams();
      if (fromDate && toDate) {
        params.append('startDate', format(fromDate, 'yyyy-MM-dd'));
        params.append('endDate', format(toDate, 'yyyy-MM-dd'));
      }

      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      const response = await authFetch(url);
      if (!response.ok) throw new Error('Failed to fetch financial data');
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      } else {
        throw new Error(result.message || 'Failed to fetch data');
      }
    } catch (error) {
      console.error('Error fetching financial data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch financial data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };



  useEffect(() => {
    if (!authLoading) {
      if (!can('view', pathname)) {
        router.push('/dashboard');
      } else {
        fetchFinancialData();
      }
    }
  }, [user, authLoading, can, router, pathname]);

  useEffect(() => {
    if (user) {
      fetchFinancialData();
    }
  }, [fromDate, toDate]);

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-32 bg-gray-200 rounded-3xl"></div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-80 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-lg text-muted-foreground mb-4">Failed to load financial data</p>
          <Button onClick={fetchFinancialData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // Transform monthly sales data for charts
  const monthlySalesChart = data.charts.monthlySales?.map(item => ({
    month: `${getMonthName(item._id?.month)} ${item._id?.year}`,
    sales: item.total,
    count: item.count,
  })) || [];

  // Transform monthly purchases data for charts
  const monthlyPurchasesChart = data.charts.monthlyPurchases?.map(item => ({
    month: `${getMonthName(item._id?.month)} ${item._id?.year}`,
    purchases: item.total,
    count: item.count,
  })) || [];

  // Compute today vs average daily sales for selected range
  const rangeStart = fromDate ?? new Date();
  const rangeEnd = toDate ?? new Date();
  const msPerDay = 24 * 60 * 60 * 1000;
  const daysInRange = Math.max(1, Math.floor((rangeEnd.getTime() - rangeStart.getTime()) / msPerDay) + 1);
  const averageDailySales = (data.financials?.totalSales || 0) / daysInRange;
  const todayVsAvgDelta = (data.financials?.todaySales || 0) - averageDailySales;
  const todayVsAvgPercent = averageDailySales > 0 ? (todayVsAvgDelta / averageDailySales) * 100 : 0;
  const trend: 'up' | 'down' | 'flat' = averageDailySales === 0
    ? ((data.financials?.todaySales || 0) === 0 ? 'flat' : 'up')
    : (todayVsAvgPercent > 2 ? 'up' : todayVsAvgPercent < -2 ? 'down' : 'flat');

  // Purchases trend using todayPurchases vs average
  const averageDailyPurchases = (data.financials?.totalPurchases || 0) / daysInRange;
  const todayPurchasesVsAvgDelta = (data.financials?.todayPurchases || 0) - averageDailyPurchases;
  const todayPurchasesVsAvgPercent = averageDailyPurchases > 0 ? (todayPurchasesVsAvgDelta / averageDailyPurchases) * 100 : 0;
  const purchasesTrend: 'up' | 'down' | 'flat' = averageDailyPurchases === 0
    ? ((data.financials?.todayPurchases || 0) === 0 ? 'flat' : 'up')
    : (todayPurchasesVsAvgPercent > 2 ? 'up' : todayPurchasesVsAvgPercent < -2 ? 'down' : 'flat');

  // Profit derived trend using (sales - purchases)
  const totalProfitDerived = (data.financials?.totalSales || 0) - (data.financials?.totalPurchases || 0);
  const averageDailyProfit = totalProfitDerived / daysInRange;
  const todayProfit = (data.financials?.todaySales || 0) - (data.financials?.todayPurchases || 0);
  const todayProfitVsAvgDelta = todayProfit - averageDailyProfit;
  const todayProfitVsAvgPercent = averageDailyProfit !== 0 ? (todayProfitVsAvgDelta / Math.abs(averageDailyProfit)) * 100 : 0;
  const profitTrend: 'up' | 'down' | 'flat' = averageDailyProfit === 0
    ? (todayProfit === 0 ? 'flat' : (todayProfit > 0 ? 'up' : 'down'))
    : (todayProfitVsAvgPercent > 2 ? 'up' : todayProfitVsAvgPercent < -2 ? 'down' : 'flat');

  // Build compact profit series for sparklines by aligning months
  const monthKey = (label: string) => label; // already like "Aug 2025"
  const salesByMonth = new Map(monthlySalesChart.map(m => [monthKey(m.month), m.sales]));
  const purchasesByMonth = new Map(monthlyPurchasesChart.map(m => [monthKey(m.month), m.purchases]));
  const combinedMonths = Array.from(new Set([...salesByMonth.keys(), ...purchasesByMonth.keys()]));
  combinedMonths.sort((a, b) => {
    const [ma, ya] = a.split(' ');
    const [mb, yb] = b.split(' ');
    const monthIndex = (m: string) => ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].indexOf(m);
    return Number(ya) !== Number(yb) ? Number(ya) - Number(yb) : monthIndex(ma) - monthIndex(mb);
  });
  const monthlyProfitChart = combinedMonths.map(m => ({
    month: m,
    profit: (salesByMonth.get(m) || 0) - (purchasesByMonth.get(m) || 0)
  }));

  // Prefer backend loss if provided; otherwise derive conservatively
  const derivedNetLoss = Math.max(0,
    (data.financials?.totalExpenses ?? data.financials?.totalPurchases ?? 0) -
    (data.financials?.totalIncome ?? data.financials?.totalSales ?? 0)
  );
  const netLoss = (data.financials?.totalLoss ?? null) !== null ? data.financials?.totalLoss : derivedNetLoss;


return (
  <div className="space-y-6 md:space-y-8 animate-fade-in px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
    {/* Hero Section - FIXED */}
    <div className="relative rounded-3xl bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-700 p-4 sm:p-6 text-white shadow-2xl w-full overflow-hidden">
      <div className="absolute inset-0"></div>
      <div className="relative z-10">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-emerald-100 bg-clip-text text-transparent">
              Financial Dashboard
            </h1>
            <p className="text-emerald-100 text-sm sm:text-base">
              Monitor your clinic's financial performance and insights
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <Button 
              variant="secondary"   
              className="h-10 gap-2 bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30 w-full sm:w-auto"
              onClick={fetchFinancialData}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial">
                <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-600 pointer-events-none z-10" />
                <input
                  type="date"
                  value={fromDate ? format(fromDate, 'yyyy-MM-dd') : ''}
                  onChange={(e) => setFromDate(e.target.value ? new Date(e.target.value) : undefined)}
                  max={format(new Date(), 'yyyy-MM-dd')}
                  className="h-10 w-full sm:w-[160px] bg-white rounded-lg border-2 border-emerald-200 text-gray-900 pl-10 pr-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 shadow-sm"
                  style={{ colorScheme: 'light' }}
                />
              </div>
              <div className="relative flex-1 sm:flex-initial">
                <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-600 pointer-events-none z-10" />
                <input
                  type="date"
                  value={toDate ? format(toDate, 'yyyy-MM-dd') : ''}
                  onChange={(e) => setToDate(e.target.value ? new Date(e.target.value) : undefined)}
                  max={format(new Date(), 'yyyy-MM-dd')}
                  className="h-10 w-full sm:w-[160px] bg-white rounded-lg border-2 border-emerald-200 text-gray-900 pl-10 pr-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 shadow-sm"
                  style={{ colorScheme: 'light' }}
                />
              </div>
              {(fromDate || toDate) && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleClearAll}
                  className="h-10 px-3 bg-white hover:bg-red-50 border-2 border-red-300 text-red-600 hover:border-red-500 hover:text-red-700 font-medium transition-all shadow-sm"
                >
                  Clear
                </Button>
              )}
            </div>
          </div>

        </div>
      </div>
      <div className="absolute -top-4 -right-4 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
      <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-emerald-400/20 rounded-full blur-2xl pointer-events-none"></div>
    </div>

    {/* Financial Stats Cards - FIXED (5 cards) */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-6 w-full">
      {/* Total Sales Card */}
      <Card className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 dark:from-blue-950/50 dark:to-blue-900/30 dark:border-blue-800/50 group">
        <CardHeader className="pb-2 px-4 sm:px-6">
          <div className="flex items-center justify-between">
            <CardDescription className="text-blue-600 dark:text-blue-400 font-medium text-sm">Total Sales</CardDescription>
            <div className={`p-2 rounded-lg transition-colors ${trend === 'up' ? 'bg-green-500/20 group-hover:bg-green-500/30' : trend === 'down' ? 'bg-red-500/20 group-hover:bg-red-500/30' : 'bg-blue-500/20 group-hover:bg-blue-500/30'}`}>
              {trend === 'up' ? (
                <ArrowUpRight className="h-4 w-4 text-green-600 dark:text-green-400" />
              ) : trend === 'down' ? (
                <ArrowDownRight className="h-4 w-4 text-red-600 dark:text-red-400" />
              ) : (
                <Minus className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-end justify-between gap-2 mt-2">
            <CardTitle className="text-lg sm:text-xl md:text-2xl font-bold text-blue-700 dark:text-blue-300">
              {formatCurrency(data.financials?.totalSales || 0)}
            </CardTitle>
            <div className={`text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap ${trend === 'up' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : trend === 'down' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'}`}>
              {averageDailySales > 0 ? `${todayVsAvgPercent.toFixed(1)}% vs avg` : 'No avg yet'}
            </div>
          </div>
          <div className="mt-3">
            <ResponsiveContainer width="100%" height={40}>
              <AreaChart data={monthlySalesChart} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="salesMini" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.7}/>
                    <stop offset="95%" stopColor="#93C5FD" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="sales" stroke="#3B82F6" strokeWidth={2} fill="url(#salesMini)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="text-blue-700/70 dark:text-blue-300/70">Today</span>
            <span className={`font-semibold ${trend === 'up' ? 'text-green-600 dark:text-green-400' : trend === 'down' ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}`}>
              {formatCurrency(data.financials?.todaySales || 0)}
            </span>
          </div>
        </CardHeader>
        <div className="absolute -top-4 -right-4 w-24 h-24 bg-blue-500/10 rounded-full blur-xl"></div>
      </Card>
      
      {/* Total Expenses Card */}
      <Card className="relative overflow-hidden bg-gradient-to-br from-red-50 to-red-100 border-red-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 dark:from-red-950/50 dark:to-red-900/30 dark:border-red-800/50 group">
        <CardHeader className="pb-2 px-4 sm:px-6">
          <div className="flex items-center justify-between">
            <CardDescription className="text-red-600 dark:text-red-400 font-medium text-sm">Total Expenses</CardDescription>
            <div className={`p-2 rounded-lg transition-colors ${purchasesTrend === 'up' ? 'bg-red-500/20 group-hover:bg-red-500/30' : purchasesTrend === 'down' ? 'bg-green-500/20 group-hover:bg-green-500/30' : 'bg-red-500/20 group-hover:bg-red-500/30'}`}>
              {purchasesTrend === 'up' ? (
                <ArrowUpRight className="h-4 w-4 text-red-600 dark:text-red-400" />
              ) : purchasesTrend === 'down' ? (
                <ArrowDownRight className="h-4 w-4 text-green-600 dark:text-green-400" />
              ) : (
                <Minus className="h-4 w-4 text-red-600 dark:text-red-400" />
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-end justify-between gap-2 mt-2">
            <CardTitle className="text-lg sm:text-xl md:text-2xl font-bold text-red-700 dark:text-red-300">
              {formatCurrency(data.financials?.totalExpenses || 0)}
            </CardTitle>
            <div className={`text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap ${purchasesTrend === 'up' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' : purchasesTrend === 'down' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'}`}>
              {averageDailyPurchases > 0 ? `${todayPurchasesVsAvgPercent.toFixed(1)}% vs avg` : 'No avg yet'}
            </div>
          </div>
          <div className="mt-3">
            <ResponsiveContainer width="100%" height={40}>
              <AreaChart data={monthlyPurchasesChart} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="expensesMini" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.7}/>
                    <stop offset="95%" stopColor="#FCA5A5" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="purchases" stroke="#EF4444" strokeWidth={2} fill="url(#expensesMini)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="text-red-700/70 dark:text-red-300/70">Today</span>
            <span className={`font-semibold ${purchasesTrend === 'up' ? 'text-red-600 dark:text-red-400' : purchasesTrend === 'down' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {formatCurrency(data.financials?.todayPurchases || 0)}
            </span>
          </div>
        </CardHeader>
        <div className="absolute -top-4 -right-4 w-24 h-24 bg-red-500/10 rounded-full blur-xl"></div>
      </Card>
      
      {/* Total Purchases Card */}
      <Card className="relative overflow-hidden bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 dark:from-purple-950/50 dark:to-purple-900/30 dark:border-purple-800/50 group">
        <CardHeader className="pb-2 px-4 sm:px-6">
          <div className="flex items-center justify-between">
            <CardDescription className="text-purple-600 dark:text-purple-400 font-medium text-sm">Total Purchases</CardDescription>
            <div className={`p-2 rounded-lg transition-colors ${purchasesTrend === 'up' ? 'bg-red-500/20 group-hover:bg-red-500/30' : purchasesTrend === 'down' ? 'bg-green-500/20 group-hover:bg-green-500/30' : 'bg-purple-500/20 group-hover:bg-purple-500/30'}`}> 
              {purchasesTrend === 'up' ? (
                <ArrowUpRight className="h-4 w-4 text-red-600 dark:text-red-400" />
              ) : purchasesTrend === 'down' ? (
                <ArrowDownRight className="h-4 w-4 text-green-600 dark:text-green-400" />
              ) : (
                <Minus className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-end justify-between gap-2 mt-2">
            <CardTitle className="text-lg sm:text-xl md:text-2xl font-bold text-purple-700 dark:text-purple-300">
              {formatCurrency(data.financials?.totalPurchases || 0)}
            </CardTitle>
            <div className={`text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap ${purchasesTrend === 'up' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' : purchasesTrend === 'down' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'}`}>
              {averageDailyPurchases > 0 ? `${todayPurchasesVsAvgPercent.toFixed(1)}% vs avg` : 'No avg yet'}
            </div>
          </div>
          <div className="mt-3">
            <ResponsiveContainer width="100%" height={40}>
              <AreaChart data={monthlyPurchasesChart} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="purchasesMini" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.7}/>
                    <stop offset="95%" stopColor="#C4B5FD" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="purchases" stroke="#8B5CF6" strokeWidth={2} fill="url(#purchasesMini)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardHeader>
        <div className="absolute -top-4 -right-4 w-24 h-24 bg-purple-500/10 rounded-full blur-xl"></div>
      </Card>

      {/* Total Profit Card */}
      <Card className="relative overflow-hidden bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 dark:from-green-950/50 dark:to-green-900/30 dark:border-green-800/50 group">
        <CardHeader className="pb-2 px-4 sm:px-6">
          <div className="flex items-center justify-between">
            <CardDescription className="text-green-600 dark:text-green-400 font-medium text-sm">Total Profit</CardDescription>
            <div className={`p-2 rounded-lg transition-colors ${profitTrend === 'up' ? 'bg-green-500/20 group-hover:bg-green-500/30' : profitTrend === 'down' ? 'bg-red-500/20 group-hover:bg-red-500/30' : 'bg-green-500/20 group-hover:bg-green-500/30'}`}>
              {profitTrend === 'up' ? (
                <ArrowUpRight className="h-4 w-4 text-green-600 dark:text-green-400" />
              ) : profitTrend === 'down' ? (
                <ArrowDownRight className="h-4 w-4 text-red-600 dark:text-red-400" />
              ) : (
                <Minus className="h-4 w-4 text-green-600 dark:text-green-400" />
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-end justify-between gap-2 mt-2">
            <CardTitle className="text-lg sm:text-xl md:text-2xl font-bold text-green-700 dark:text-green-300">
              {formatCurrency(data.financials?.totalProfit || 0)}
            </CardTitle>
            <div className={`text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap ${profitTrend === 'up' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : profitTrend === 'down' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'}`}>
              {averageDailyProfit !== 0 ? `${todayProfitVsAvgPercent.toFixed(1)}% vs avg` : 'No avg yet'}
            </div>
          </div>
          <div className="mt-3">
            <ResponsiveContainer width="100%" height={40}>
              <AreaChart data={monthlyProfitChart} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="profitMini" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.7}/>
                    <stop offset="95%" stopColor="#6EE7B7" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="profit" stroke="#10B981" strokeWidth={2} fill="url(#profitMini)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="text-green-700/70 dark:text-green-300/70">Today</span>
            <span className={`font-semibold ${profitTrend === 'up' ? 'text-green-600 dark:text-green-400' : profitTrend === 'down' ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}> 
              {formatCurrency(todayProfit)}
            </span>
          </div>
        </CardHeader>
        <div className="absolute -top-4 -right-4 w-24 h-24 bg-green-500/10 rounded-full blur-xl"></div>
      </Card>

      {/* Net Loss Card */}
      <Card className="relative overflow-hidden bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 dark:from-orange-950/50 dark:to-orange-900/30 dark:border-orange-800/50 group">
        <CardHeader className="pb-2 px-4 sm:px-6">
          <div className="flex items-center justify-between">
            <CardDescription className="text-orange-600 dark:text-orange-400 font-medium text-sm">Net Loss</CardDescription>
            <div className={`p-2 rounded-lg transition-colors ${netLoss > 0 ? 'bg-red-500/20 group-hover:bg-red-500/30' : 'bg-orange-500/20 group-hover:bg-orange-500/30'}`}> 
              {netLoss > 0 ? (
                <ArrowUpRight className="h-4 w-4 text-red-600 dark:text-red-400" />
              ) : (
                <Minus className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              )}
            </div>
          </div>
          <CardTitle className="text-lg sm:text-xl md:text-2xl font-bold text-orange-700 dark:text-orange-300">
            {formatCurrency(netLoss)}
          </CardTitle>
        </CardHeader>
        <div className="absolute -top-4 -right-4 w-24 h-24 bg-orange-500/10 rounded-full blur-xl"></div>
      </Card>
    </div>

    {/* Business Overview - FIXED (7 cards) */}
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4 w-full">
      <Card className="bg-gradient-to-br from-cyan-50 to-cyan-100 border-cyan-200 dark:from-cyan-950/50 dark:to-cyan-900/30">
        <CardHeader className="pb-2 px-3 sm:px-4">
          <div className="flex items-center justify-between">
            <CardDescription className="text-cyan-600 dark:text-cyan-400 font-medium text-xs sm:text-sm truncate">Products</CardDescription>
            <Package className="h-4 w-4 text-cyan-600 dark:text-cyan-400 flex-shrink-0" />
          </div>
          <CardTitle className="text-lg sm:text-xl lg:text-2xl font-bold text-cyan-700 dark:text-cyan-300">
            {data.counts?.totalProducts || 0}
          </CardTitle>
        </CardHeader>
      </Card>

      <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200 dark:from-indigo-950/50 dark:to-indigo-900/30">
        <CardHeader className="pb-2 px-3 sm:px-4">
          <div className="flex items-center justify-between">
            <CardDescription className="text-indigo-600 dark:text-indigo-400 font-medium text-xs sm:text-sm truncate">Services</CardDescription>
            <Building2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
          </div>
          <CardTitle className="text-lg sm:text-xl lg:text-2xl font-bold text-indigo-700 dark:text-indigo-300">
            {data.counts?.totalServices || 0}
          </CardTitle>
        </CardHeader>
      </Card>

      <Card className="bg-gradient-to-br from-pink-50 to-pink-100 border-pink-200 dark:from-pink-950/50 dark:to-pink-900/30">
        <CardHeader className="pb-2 px-3 sm:px-4">
          <div className="flex items-center justify-between">
            <CardDescription className="text-pink-600 dark:text-pink-400 font-medium text-xs sm:text-sm truncate">Patients</CardDescription>
            <Users className="h-4 w-4 text-pink-600 dark:text-pink-400 flex-shrink-0" />
          </div>
          <CardTitle className="text-lg sm:text-xl lg:text-2xl font-bold text-pink-700 dark:text-pink-300">
            {data.counts?.totalPatients || 0}
          </CardTitle>
        </CardHeader>
      </Card>

      <Card className="bg-gradient-to-br from-teal-50 to-teal-100 border-teal-200 dark:from-teal-950/50 dark:to-teal-900/30">
        <CardHeader className="pb-2 px-3 sm:px-4">
          <div className="flex items-center justify-between">
            <CardDescription className="text-teal-600 dark:text-teal-400 font-medium text-xs sm:text-sm truncate">Suppliers</CardDescription>
            <Building2 className="h-4 w-4 text-teal-600 dark:text-teal-400 flex-shrink-0" />
          </div>
          <CardTitle className="text-lg sm:text-xl lg:text-2xl font-bold text-teal-700 dark:text-teal-300">
            {data.counts?.totalSuppliers || 0}
          </CardTitle>
        </CardHeader>
      </Card>

      <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200 dark:from-amber-950/50 dark:to-amber-900/30">
        <CardHeader className="pb-2 px-3 sm:px-4">
          <div className="flex items-center justify-between">
            <CardDescription className="text-amber-600 dark:text-amber-400 font-medium text-xs sm:text-sm truncate">Employees</CardDescription>
            <Users className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
          </div>
          <div className="flex flex-wrap items-end justify-between gap-1 sm:gap-2">
            <CardTitle className="text-lg sm:text-xl lg:text-2xl font-bold text-amber-700 dark:text-amber-300">
              {data.counts?.totalEmployees || 0}
            </CardTitle>
            {typeof data.todayCounts?.todayEmployees === 'number' && data.todayCounts?.todayEmployees !== 0 && (
              <span className="text-[10px] md:text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 whitespace-nowrap">
                +{data.todayCounts.todayEmployees} today
              </span>
            )}
          </div>
        </CardHeader>
      </Card>

      <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 dark:from-emerald-950/50 dark:to-emerald-900/30">
        <CardHeader className="pb-2 px-3 sm:px-4">
          <div className="flex items-center justify-between">
            <CardDescription className="text-emerald-600 dark:text-emerald-400 font-medium text-xs sm:text-sm truncate">Today's Sales</CardDescription>
            <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
          </div>
          <CardTitle className="text-base sm:text-lg lg:text-xl font-bold text-emerald-700 dark:text-emerald-300">
            {formatCurrency(data.financials?.todaySales || 0)}
          </CardTitle>
          <CardDescription className="text-emerald-600/70 dark:text-emerald-400/70 text-xs mt-1">
            Sales made today
          </CardDescription>
        </CardHeader>
      </Card>

      <Card className="bg-gradient-to-br from-violet-50 to-violet-100 border-violet-200 dark:from-violet-950/50 dark:to-violet-900/30">
        <CardHeader className="pb-2 px-3 sm:px-4">
          <div className="flex items-center justify-between">
            <CardDescription className="text-violet-600 dark:text-violet-400 font-medium text-xs sm:text-sm truncate">Today's Purchases</CardDescription>
            <ShoppingCart className="h-4 w-4 text-violet-600 dark:text-violet-400 flex-shrink-0" />
          </div>
          <CardTitle className="text-base sm:text-lg lg:text-xl font-bold text-violet-700 dark:text-violet-300">
            {formatCurrency(data.financials?.todayPurchases || 0)}
          </CardTitle>
          <CardDescription className="text-violet-600/70 dark:text-violet-400/70 text-xs mt-1">
            Purchases made today
          </CardDescription>
        </CardHeader>
      </Card>
    </div>

    {/* Charts Section - FIXED */}
    <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-3 w-full">
      {/* Monthly Sales Chart */}
      <Card className="lg:col-span-2 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 border-blue-200/50 shadow-xl">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300 text-base sm:text-lg">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
            </div>
            Monthly Sales Trend
          </CardTitle>
          <CardDescription className="text-blue-600/70 dark:text-blue-400/70 text-sm">
            Sales performance and growth over months
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 sm:h-72 md:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlySalesChart} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                <defs>
                  <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.9}/>
                    <stop offset="50%" stopColor="#60A5FA" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#93C5FD" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="month" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#6B7280' }}
                />
                <YAxis 
                  tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#6B7280' }}
                />
                <Tooltip 
                  formatter={(value) => [formatCurrency(Number(value)), 'Sales']}
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    fontSize: '12px'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="sales" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#salesGradient)"
                  dot={{ fill: '#3B82F6', strokeWidth: 1, r: 3 }}
                  activeDot={{ r: 5, stroke: '#3B82F6', strokeWidth: 1, fill: '#ffffff' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Expenses by Category - FIXED */}
      <Card className="lg:col-span-1 bg-gradient-to-br from-red-50/50 to-pink-50/50 border-red-200/50 shadow-xl">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-300 text-base sm:text-lg">
            <div className="p-2 bg-red-500/10 rounded-lg">
              <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
            </div>
            Expenses by Category
          </CardTitle>
          <CardDescription className="text-red-600/70 dark:text-red-400/70 text-sm">
            Detailed expense breakdown
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data.charts?.expensesByCategory?.length > 0 ? (
            <div className="space-y-3 sm:space-y-4 max-h-80 overflow-y-auto pr-2">
              {data.charts?.expensesByCategory?.map((expense, index) => (
                <div key={expense._id} className="p-3 sm:p-4 bg-white/60 dark:bg-gray-800/60 rounded-xl border border-red-100 dark:border-red-900/30">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate flex-1 mr-2">
                      {expense.categoryName}
                    </span>
                    <span className="text-sm font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 px-2 py-1 rounded-md whitespace-nowrap">
                      ₹{((expense?.total || 0) / 1000).toFixed(0)}K
                    </span>
                  </div>
                  <div className="w-full bg-gradient-to-r from-gray-200 to-gray-300 rounded-full h-2 dark:from-gray-700 dark:to-gray-600 shadow-inner">
                    <div 
                      className="h-2 rounded-full transition-all duration-700 shadow-sm" 
                      style={{ 
                        width: '100%',
                        background: `linear-gradient(90deg, ${COLORS[index % COLORS.length]}, ${COLORS[index % COLORS.length]}dd)`
                      }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mt-1">
                    <span className="flex items-center gap-1 truncate">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                      {expense?.count || 0} transactions
                    </span>
                    <span className="font-semibold whitespace-nowrap ml-2">{formatCurrency(expense?.total || 0)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-500 dark:text-gray-400">
              <div className="text-center">
                <CreditCard className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No expense data</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>

    {/* Service Sales Performance - FIXED */}
    <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-3 w-full">
      {/* Service Sales Summary */}
      <Card className="md:col-span-1 bg-gradient-to-br from-emerald-50/50 to-green-50/50 border-emerald-200/50 shadow-xl">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 text-base sm:text-lg">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
            </div>
            Service Sales Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.serviceSales?.summary?.length > 0 ? (
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-r from-emerald-500 to-green-600 rounded-xl text-white">
                <div className="text-sm opacity-90 mb-1">Total Service Revenue</div>
                <div className="text-xl sm:text-2xl font-bold">
                  {formatCurrency(data.serviceSales.summary.reduce((sum, s) => sum + s.totalRevenue, 0))}
                </div>
                <div className="text-xs opacity-75 mt-1">
                  {data.serviceSales.summary.reduce((sum, s) => sum + s.totalOrders, 0)} total orders
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-white/60 dark:bg-gray-800/60 rounded-lg border border-emerald-100">
                  <div className="text-xs text-emerald-600/70 mb-1">Services</div>
                  <div className="text-lg font-bold text-emerald-700">{data.serviceSales.summary.length}</div>
                </div>
                <div className="p-3 bg-white/60 dark:bg-gray-800/60 rounded-lg border border-emerald-100">
                  <div className="text-xs text-emerald-600/70 mb-1">Avg Revenue</div>
                  <div className="text-lg font-bold text-emerald-700">
                    {formatCurrency(data.serviceSales.summary.reduce((sum, s) => sum + s.totalRevenue, 0) / data.serviceSales.summary.length)}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 mx-auto mb-2 opacity-50 text-emerald-400" />
              <p className="text-sm text-emerald-600/70">No service data</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* All Services Performance - FIXED */}
      <Card className="md:col-span-2 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 border-blue-200/50 shadow-xl">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300 text-base sm:text-lg">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
            </div>
            All Services Performance
          </CardTitle>
          <CardDescription className="text-blue-600/70 dark:text-blue-400/70 text-sm">
            Complete breakdown of all service sales
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data.serviceSales?.summary?.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
              {data.serviceSales.summary
                .sort((a, b) => b.totalRevenue - a.totalRevenue)
                .map((service, index) => {
                  const maxRevenue = Math.max(...data.serviceSales!.summary.map(s => s.totalRevenue));
                  const percentage = (service.totalRevenue / maxRevenue) * 100;
                  return (
                    <div key={service.serviceId} className="p-3 bg-white/60 dark:bg-gray-800/60 rounded-lg border border-blue-100 dark:border-blue-900/30 hover:shadow-md transition-all">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-xs flex items-center justify-center font-bold flex-shrink-0">
                            {index + 1}
                          </div>
                          <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-200 truncate">
                            {service.serviceName}
                          </h4>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full whitespace-nowrap">
                            {service.totalOrders} orders
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center justify-between mb-2">
                        <div className="text-base sm:text-lg font-bold text-blue-700 dark:text-blue-300">
                          {formatCurrency(service.totalRevenue)}
                        </div>
                        <div className="text-xs text-blue-600/70 dark:text-blue-400/70 whitespace-nowrap">
                          Qty: {service.totalQuantitySold} | Avg: ₹{(service.totalRevenue / service.totalQuantitySold).toFixed(0)}
                        </div>
                      </div>
                      <div className="w-full bg-blue-100 dark:bg-blue-900/30 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-500" 
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <div className="text-center py-8">
              <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50 text-blue-400" />
              <p className="text-sm text-blue-600/70">No service performance data</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>

    {/* Monthly Purchases - FIXED */}
    <Card className="bg-gradient-to-br from-purple-50/50 to-violet-50/50 border-purple-200/50 shadow-xl w-full">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-300 text-base sm:text-lg">
          <div className="p-2 bg-purple-500/10 rounded-lg">
            <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
          </div>
          Monthly Purchases
        </CardTitle>
        <CardDescription className="text-purple-600/70 dark:text-purple-400/70 text-sm">
          Purchase summary by month
        </CardDescription>
      </CardHeader>
      <CardContent>
        {monthlyPurchasesChart.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {monthlyPurchasesChart.map((purchase, index) => (
              <div key={`${purchase.month}-${index}`} className="p-4 bg-white/60 dark:bg-gray-800/60 rounded-xl border border-purple-100 dark:border-purple-900/30 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-purple-700 dark:text-purple-300 truncate mr-2">
                    {purchase.month}
                  </span>
                  <div className="flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30 px-2 py-1 rounded-full whitespace-nowrap">
                    <ShoppingCart className="h-3 w-3" />
                    {purchase.count}
                  </div>
                </div>
                <div className="text-xl sm:text-2xl font-bold text-purple-800 dark:text-purple-200 mb-1">
                  {formatCurrency(purchase.purchases)}
                </div>
                <div className="text-xs text-purple-600/70 dark:text-purple-400/70">
                  ₹{(purchase.purchases / purchase.count).toFixed(0)} avg per purchase
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-32 text-gray-500 dark:text-gray-400">
            <div className="text-center">
              <ShoppingCart className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No purchase data available</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  </div>
);


}





