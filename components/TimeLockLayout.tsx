"use client";

import { useEffect, useState } from "react";
import { Clock, Lock, AlertCircle, Coffee, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { API_BASE_URL } from "@/config/api";
import { useAuth } from "@/hooks/use-auth";

interface TimeLockLayoutProps {
  children: React.ReactNode;
  apiEndpoint?: string;
}

interface TimeConfig {
  key: string;
  pageName: string;
  openTime: string;
  closeTime: string;
  timezone: string;
  isEnabled: boolean;
  allowWeekends: boolean;
  daysOfWeek: number[];
  breakTimes: Array<{
    startTime: string;
    endTime: string;
    reason: string;
  }>;
  holidays: Array<{
    date: string;
    reason: string;
  }>;
  gracePeriodMinutes: number;
  messages: {
    beforeOpen: string;
    afterClose: string;
    onBreak: string;
    onHoliday: string;
  };
  serverTime: string;
  isAccessible: boolean;
  reason: string;
  nextOpenTime?: string;
}

export function TimeLockLayout({ 
  children, 
  apiEndpoint = `${API_BASE_URL}/api/settings/access-time?key=pos_access_time`
}: TimeLockLayoutProps) {
  const { authFetch } = useAuth();
  const [timeConfig, setTimeConfig] = useState<TimeConfig | null>(null);
  const [countdown, setCountdown] = useState("");
  const [currentTime, setCurrentTime] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const res = await authFetch(apiEndpoint);
        
        if (!res.ok) {
          throw new Error(`API returned ${res.status}: ${res.statusText}`);
        }
        
        const data = await res.json();
        
        if (!data.success || !data.data) {
          throw new Error(data.message || 'Invalid API response');
        }
        
        // Client-side access check using local time
        const config = data.data;
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const currentTime = currentHour * 60 + currentMinute;
        
        const [openHour, openMin] = config.openTime.split(':').map(Number);
        const [closeHour, closeMin] = config.closeTime.split(':').map(Number);
        const openTime = openHour * 60 + openMin;
        const closeTime = closeHour * 60 + closeMin;
        
        let isAccessible = false;
        let reason = 'BEFORE_OPEN';
        
        // Check if overnight schedule
        if (openTime > closeTime) {
          isAccessible = currentTime >= openTime || currentTime <= closeTime;
          reason = isAccessible ? '' : (currentTime < openTime ? 'BEFORE_OPEN' : 'AFTER_CLOSE');
        } else {
          isAccessible = currentTime >= openTime && currentTime <= closeTime;
          reason = isAccessible ? '' : (currentTime < openTime ? 'BEFORE_OPEN' : 'AFTER_CLOSE');
        }
        
        // Override backend's isAccessible with client calculation
        config.isAccessible = isAccessible;
        config.reason = reason;
        
        setTimeConfig(config);
        setError(null);
        setRetryCount(0);
      } catch (err) {
        const errorMessage = (err as Error).message || 'Failed to connect to server';
        setError(errorMessage);
        setRetryCount(prev => prev + 1);
        console.error('TimeLock API Error:', errorMessage);
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
    const interval = setInterval(checkAccess, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [apiEndpoint, authFetch]);

  useEffect(() => {
    if (!timeConfig || timeConfig.isAccessible) return;

    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-US', { hour12: true }));

      if (timeConfig.nextOpenTime) {
        const target = new Date(timeConfig.nextOpenTime).getTime();
        const diff = target - now.getTime();

        if (diff <= 0) {
          setCountdown("Opening now...");
          window.location.reload();
        } else {
          const hours = Math.floor(diff / 3600000);
          const mins = Math.floor((diff % 3600000) / 60000);
          const secs = Math.floor((diff % 60000) / 1000);
          setCountdown(`${hours}h ${mins}m ${secs}s`);
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [timeConfig]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Clock className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Block access on error
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
        <Card className="w-full max-w-md shadow-lg border-red-200">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="flex justify-center">
              <div className="p-4 bg-red-100 rounded-full">
                <AlertTriangle className="h-12 w-12 text-red-600" />
              </div>
            </div>
            
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Connection Error</h2>
              <Badge variant="destructive" className="mb-2">Access Denied</Badge>
            </div>
            
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Unable to verify access</AlertTitle>
              <AlertDescription className="text-sm">
                {error}
              </AlertDescription>
            </Alert>
            
            <div className="pt-4 border-t">
              <p className="text-xs text-gray-500">
                Retry attempt: {retryCount}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                The page will automatically retry every 3 minutes
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Allow access if not enabled
  if (!timeConfig || !timeConfig.isEnabled || timeConfig.isAccessible) {
    return <>{children}</>;
  }

  // Determine icon and color based on reason
  const getReasonDisplay = () => {
    switch (timeConfig.reason) {
      case 'BEFORE_OPEN':
        return { icon: Clock, color: 'blue', bgColor: 'bg-blue-100', textColor: 'text-blue-600' };
      case 'AFTER_CLOSE':
        return { icon: Lock, color: 'red', bgColor: 'bg-red-100', textColor: 'text-red-600' };
      case 'ON_BREAK':
        return { icon: Coffee, color: 'orange', bgColor: 'bg-orange-100', textColor: 'text-orange-600' };
      case 'HOLIDAY':
        return { icon: AlertCircle, color: 'purple', bgColor: 'bg-purple-100', textColor: 'text-purple-600' };
      case 'DAY_NOT_ALLOWED':
        return { icon: Lock, color: 'red', bgColor: 'bg-red-100', textColor: 'text-red-600' };
      default:
        return { icon: Lock, color: 'gray', bgColor: 'bg-gray-100', textColor: 'text-gray-600' };
    }
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const formatOperatingHours = () => {
    const open = formatTime(timeConfig.openTime);
    const close = formatTime(timeConfig.closeTime);
    
    // Check if it's an overnight schedule
    const openHour = parseInt(timeConfig.openTime.split(':')[0]);
    const closeHour = parseInt(timeConfig.closeTime.split(':')[0]);
    
    if (openHour > closeHour) {
      return `${open} - ${close} (next day)`;
    }
    return `${open} - ${close}`;
  };

  const { icon: Icon, bgColor, textColor } = getReasonDisplay();
  
  const getFormattedMessage = () => {
    if (timeConfig.reason === 'AFTER_CLOSE' || timeConfig.reason === 'BEFORE_OPEN') {
      const hours = formatOperatingHours();
      return `${timeConfig.pageName} is closed. Operating hours: ${hours}. Contact admin for access.`;
    }
    return timeConfig.reason === 'ON_BREAK' ? timeConfig.messages.onBreak :
           timeConfig.reason === 'HOLIDAY' ? timeConfig.messages.onHoliday :
           timeConfig.reason === 'DAY_NOT_ALLOWED' ? 'Access not allowed on this day. Please contact admin.' :
           'Access restricted';
  };
  
  const message = getFormattedMessage();

  return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardContent className="pt-6 text-center space-y-4">
          <div className="flex justify-center">
            <div className={`p-4 ${bgColor} rounded-full`}>
              <Icon className={`h-12 w-12 ${textColor}`} />
            </div>
          </div>
          
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Restricted</h2>
            <Badge variant="outline" className="mb-2">{timeConfig.pageName}</Badge>
          </div>
          
          <p className="text-gray-600 text-sm px-4">{message}</p>
          
          {countdown && timeConfig.reason === 'BEFORE_OPEN' && (
            <div className="pt-4 pb-2">
              <p className="text-sm text-gray-500 mb-2">Opening in</p>
              <div className="text-4xl font-mono font-bold text-primary animate-pulse">
                {countdown}
              </div>
            </div>
          )}
          
          {timeConfig.reason === 'ON_BREAK' && countdown && (
            <div className="pt-4 pb-2">
              <p className="text-sm text-gray-500 mb-2">Break ends in</p>
              <div className="text-3xl font-mono font-bold text-orange-600">
                {countdown}
              </div>
            </div>
          )}
          
          <div className="pt-4 border-t">
            <p className="text-xs text-gray-400">
              Current Time: {currentTime}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Operating Hours: {formatOperatingHours()}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Timezone: {timeConfig.timezone}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
