
"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { usePermission } from '@/hooks/use-permission';
import { useRouter, usePathname } from 'next/navigation';
import type { ActivityLog } from '@/lib/data';
import type { DateRange } from 'react-day-picker';
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2, X, ListChecks, Calendar as CalendarIcon, ChevronRight } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { IpLocation } from '@/components/ip-location';


export default function ActivityLogPage() {
  const { user, authFetch, token, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const { can } = usePermission();
  const router = useRouter();
  const pathname = usePathname();
  
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({ searchTerm: '', action: 'all' });
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [expandedLogRowId, setExpandedLogRowId] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const response = await authFetch('/api/activity-log');
      if (!response.ok) throw new Error("Failed to fetch activity logs");
      const data = await response.json();
      setLogs(data);
      
      // Pre-fetch unique IPs
      const uniqueIps = [...new Set(data.map((log: ActivityLog) => log.request.ip).filter(Boolean))];
      uniqueIps.forEach(ip => {
        if (ip) {
          // Trigger location fetch for unique IPs only
          import('@/hooks/use-ip-location').then(({ preloadLocation }) => {
            preloadLocation?.(ip);
          });
        }
      });
    } catch (error) {
       if (!(error as Error).message.includes('Session expired')) {
          toast({ variant: 'destructive', title: 'Error', description: (error as Error).message });
       }
    } finally {
      setIsLoading(false);
    }
  }, [token, authFetch, toast]);

  useEffect(() => {
    if (!authLoading) {
      if (!can('view', pathname)) {
        router.push('/dashboard');
      } else {
        fetchLogs();
      }
    }
  }, [user, authLoading, can, router, pathname, fetchLogs]);

  const uniqueActions = useMemo(() => {
    const actions = new Set(logs.map(log => log.action));
    return ['all', ...Array.from(actions).sort()];
  }, [logs]);

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const searchTermMatch = filters.searchTerm === '' || 
        log.actor.name.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        log.entity.type.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        (log.entity.name && log.entity.name.toLowerCase().includes(filters.searchTerm.toLowerCase())) ||
        (log.request.ip && log.request.ip.includes(filters.searchTerm));

      const actionMatch = filters.action === 'all' || log.action === filters.action;
      
      let dateMatch = true;
      if (dateRange?.from && log.createdAt) {
          const logDate = new Date(log.createdAt);
          logDate.setHours(0, 0, 0, 0);
          
          const fromDate = new Date(dateRange.from);
          fromDate.setHours(0, 0, 0, 0);

          if (dateRange.to) {
              const toDate = new Date(dateRange.to);
              toDate.setHours(0,0,0,0);
              dateMatch = logDate >= fromDate && logDate <= toDate;
          } else {
              dateMatch = logDate.getTime() === fromDate.getTime();
          }
      } else if (dateRange?.from && !log.createdAt) {
          dateMatch = false;
      }

      return searchTermMatch && actionMatch && dateMatch;
    });
  }, [logs, filters, dateRange]);


  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters({ searchTerm: '', action: 'all' });
    setDateRange(undefined);
  };
  
  const renderDetailValue = (parentKey: string, value: any): React.ReactNode => {
      if (typeof value === 'object' && value !== null) {
        const objectEntries = Object.entries(value);
        return (
          <div key={parentKey} className="pl-2 space-y-1">
              {objectEntries.map(([key, val]) => (
                  <div key={`${parentKey}-${key}`} className="text-xs">
                      <span className="font-semibold capitalize">{key.replace(/_/g, ' ')}: </span>
                      <span className="text-muted-foreground">{String(val)}</span>
                  </div>
              ))}
          </div>
        );
      }
      return <span key={parentKey} className="text-muted-foreground">{String(value)}</span>;
  }
  
  const canExpandLog = (log: ActivityLog): boolean => {
    if (!log.details) return false;
    const detailEntries = Object.entries(log.details);
    if (detailEntries.length > 1) return true;
    if (detailEntries.length === 0) return false;

    // Expand if the single value is an object with more than one key
    const firstValue = detailEntries[0][1];
    if (typeof firstValue === 'object' && firstValue !== null && Object.keys(firstValue).length > 1) {
        return true;
    }

    return false;
  }

  return (
    // <div className="space-y-8 animate-fade-in">
    <div className="space-y-8 animate-fade-in w-full max-w-full overflow-x-hidden">

      {/* Hero Section */}
      <div className="relative  rounded-3xlw-full max-w-full overflow-hidden bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 p-4 text-white shadow-2xl">
        
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-100 bg-clip-text text-transparent">
              Activity Log
            </h1>
            <p className="text-slate-100 text-sm">
              Monitor all system events and user activities
            </p>
          </div>
        </div>
        <div className="absolute -top-4 -right-4 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
        <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-slate-400/20 rounded-full blur-2xl"></div>
      </div>
      
      <Card className="animate-slide-up">
        <CardHeader>
          <CardTitle className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent dark:from-green-400 dark:to-emerald-400">
            Event History
          </CardTitle>
          <CardDescription>A log of all important events that have occurred in the system</CardDescription>
          {/* <div className="flex flex-wrap items-end gap-2 pt-4"> */}
<div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-end gap-3 pt-4 w-full">

            <Input
              placeholder="Search by user, entity, IP..."
              value={filters.searchTerm}
              onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
              className="w-full sm:max-w-sm"
            />
            <Select value={filters.action} onValueChange={(value) => handleFilterChange('action', value)}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filter by action" />
              </SelectTrigger>
              <SelectContent>
                {uniqueActions.map(action => (
                  <SelectItem key={action} value={action} className="capitalize">
                    {action === 'all' ? 'All Actions' : action.replace(/_/g, ' ').toLowerCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                    id="date"
                    variant={"outline"}
                    className={cn(
                    "w-[260px] justify-start text-left font-normal",
                    !dateRange && "text-muted-foreground"
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                    dateRange.to ? (
                        <>
                        {format(dateRange.from, "LLL dd, y")} -{" "}
                        {format(dateRange.to, "LLL dd, y")}
                        </>
                    ) : (
                        format(dateRange.from, "LLL dd, y")
                    )
                    ) : (
                    <span>Pick a date range</span>
                    )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
            <Button variant="ghost" onClick={resetFilters}>
              <X className="mr-2 h-4 w-4" /> Reset
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[60vh] w-full">
           <div className="min-w-full overflow-x-auto">
            <Table className="min-w-full table-fixed sm:table-auto">
              <TableHeader className="sticky top-0 bg-card">
                <TableRow>
                  <TableHead className="min-w-[180] sm:w-[250px]">Timestamp &amp; IP</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Event Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow key="loading">
                    <TableCell colSpan={5} className="h-24 text-center">
                      <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                    </TableCell>
                  </TableRow>
                ) : filteredLogs.length > 0 ? (
                  filteredLogs.map((log, index) => {
                    // Create a unique key using index and log._id (or fallback)
                    const uniqueKey = log._id || `log-${index}-${log.createdAt || Date.now()}`;
                    const logIdentifier = log._id || uniqueKey;
                    
                    const isExpanded = expandedLogRowId === logIdentifier;
                    const canExpand = canExpandLog(log);

                    const allEntries = log.details ? Object.entries(log.details) : [];
                    let displayEntries = allEntries;
                    let isSingleObject = false;

                    if (allEntries.length === 1 && typeof allEntries[0][1] === 'object' && allEntries[0][1] !== null) {
                        isSingleObject = true;
                        if (!isExpanded) {
                            const nestedEntries = Object.entries(allEntries[0][1]);
                            displayEntries = [[allEntries[0][0], nestedEntries.slice(0, 1).reduce((acc, [k,v]) => ({...acc, [k]:v}), {})]];
                        }
                    } else if (allEntries.length > 1 && !isExpanded) {
                        displayEntries = allEntries.slice(0, 1);
                    }

                    return (
                        <TableRow key={uniqueKey}>
                          <TableCell className={cn("text-xs  whitespace-normal break-words", isExpanded && "align-top")}>
                              <div className="flex flex-col gap-2">
                                <span className="text-muted-foreground">{log.createdAt ? format(new Date(log.createdAt), 'PPpp') : 'N/A'}</span>
                                {log.request.ip && <IpLocation ip={log.request.ip} />}
                              </div>
                          </TableCell>
                          <TableCell className={cn(isExpanded && "align-top")}>{log.actor.name}</TableCell>
                          <TableCell className={cn(isExpanded && "align-top")}>
                            <span className="font-mono text-xs p-1 bg-muted rounded">{log.action}</span>
                          </TableCell>
                          <TableCell className={cn(isExpanded && "align-top")}>
                            <div className="flex flex-col">
                              <span className="font-medium">{log.entity.type}</span>
                              <span className="text-xs text-muted-foreground">{log.entity.name || `ID: ${log.entity._id}`}</span>
                            </div>
                          </TableCell>
                          <TableCell className={cn("align-top", isExpanded ? "max-w-md" : "max-w-xs")}>
                              <div className="flex items-start justify-between gap-2">
                                  {allEntries.length > 0 ? (
                                    <div className="flex-grow space-y-1">
                                      {(isExpanded ? allEntries : displayEntries).map(([key, value]) => {
                                         if (isSingleObject) {
                                           return <div key={`${uniqueKey}-${key}`}>{renderDetailValue(key, value)}</div>
                                         }
                                         return (
                                           <div key={`${uniqueKey}-${key}`}>
                                              <span className="font-semibold capitalize">{key.replace(/_/g, ' ')}: </span>
                                              {renderDetailValue(key, value)}
                                           </div>
                                         )
                                       })}
                                    </div>
                                  ) : (
                                      <span className="text-muted-foreground text-xs">-</span>
                                  )}
                                  {canExpand && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6 shrink-0"
                                      onClick={() => setExpandedLogRowId(isExpanded ? null : logIdentifier)}
                                    >
                                      <ChevronRight className={cn("h-4 w-4 transition-transform", isExpanded && "rotate-90")} />
                                    </Button>
                                  )}
                              </div>
                          </TableCell>
                        </TableRow>
                    );
                  })
                ) : (
                  <TableRow key="empty">
                    <TableCell colSpan={5} className="text-center h-48">
                      <ListChecks className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-xl font-semibold">No Logs Found</h3>
                      <p className="text-muted-foreground">No activity logs match your current filters.</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
         </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
