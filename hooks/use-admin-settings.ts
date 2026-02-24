import { useState, useEffect } from "react";
import { API_BASE_URL } from "@/config/api";

interface AdminSettings {
  companyName: string;
  logo: string;
}

const CACHE_KEY = "admin-settings";

export function useAdminSettings() {
  const [settings, setSettings] = useState<AdminSettings>(() => {
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        return JSON.parse(cached);
      }
    }
    return {
      companyName: "Admin",
      logo: "",
    };
  });
  const [isLoading, setIsLoading] = useState(() => {
    if (typeof window !== "undefined") {
      return !localStorage.getItem(CACHE_KEY);
    }
    return true;
  });

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/cms/home/adminSetting`
        );
        if (response.ok) {
          const res = await response.json();
          const newSettings = {
            companyName: res.data?.companyName || "Admin",
            logo: res.data?.logo || "",
          };
          setSettings(newSettings);
          localStorage.setItem(CACHE_KEY, JSON.stringify(newSettings));
        }
      } catch (error) {
        console.error("Failed to load admin settings:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  return { settings, isLoading };
}
