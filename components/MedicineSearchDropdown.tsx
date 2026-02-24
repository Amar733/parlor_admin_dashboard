"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, Package } from "lucide-react";

interface ProductSearchResult {
  product: {
    _id: string;
    productName: string;
    type: string;
  };
  isService: boolean;
  totalStock: number | null;
}

interface MedicineSearchDropdownProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (productName: string, stock: number | null) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export default function MedicineSearchDropdown({
  value,
  onChange,
  onSelect,
  disabled = false,
  placeholder = "Search medicine...",
  className = "",
}: MedicineSearchDropdownProps) {
  const { authFetch } = useAuth();
  const [searchResults, setSearchResults] = useState<ProductSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const searchMedicines = async (query: string) => {
    if (!authFetch || !query.trim()) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    setIsSearching(true);
    setShowDropdown(true);
    try {
      const response = await authFetch(`/api/products/with-stock?search=${encodeURIComponent(query)}`);
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setSearchResults(result.data.filter((item: ProductSearchResult) => !item.isService));
        }
      }
    } catch (error) {
      console.error("Failed to search medicines:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    searchMedicines(newValue);
  };

  const handleSelect = (result: ProductSearchResult) => {
    const productName = result.product.productName;
    onChange(productName);
    setShowDropdown(false);
    setSearchResults([]);
    if (onSelect) {
      onSelect(productName, result.totalStock);
    }
    // Force resize after selection
    setTimeout(() => {
      const textarea = containerRef.current?.querySelector('textarea');
      if (textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
      }
    }, 0);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const textarea = containerRef.current?.querySelector('textarea');
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = textarea.scrollHeight + 'px';
    }
  }, [value]);

  return (
    <div ref={containerRef} className="relative w-full" onClick={(e) => e.stopPropagation()}>
      <textarea
        className={`w-full bg-transparent border-none outline-none resize-none overflow-hidden ${className}`}
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          handleInputChange(e as any);
          e.target.style.height = 'auto';
          e.target.style.height = e.target.scrollHeight + 'px';
        }}
        onInput={(e: any) => {
          e.target.style.height = 'auto';
          e.target.style.height = e.target.scrollHeight + 'px';
        }}
        disabled={disabled}
        autoComplete="off"
        rows={1}
        style={{ minHeight: '1.5rem' }}
      />

      {showDropdown && (searchResults.length > 0 || isSearching) && (
        <div className="absolute top-full left-0 w-full min-w-[280px] max-w-md bg-white border border-teal-200 rounded-lg shadow-xl z-[60] max-h-72 overflow-y-auto mt-1">
          {isSearching ? (
            <div className="flex items-center justify-center p-4 text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              <span className="text-sm">Searching...</span>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-400">No medicines found</div>
          ) : (
            <div className="py-2">
              {searchResults.map((result) => (
                <div
                  key={result.product._id}
                  className="px-4 py-3 hover:bg-teal-50 cursor-pointer transition-colors border-b last:border-b-0 border-gray-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelect(result);
                  }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                      <Package className="w-3.5 h-3.5 text-teal-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-xs text-gray-900 whitespace-normal break-words">
                          {result.product.productName}
                        </div>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      {result.totalStock !== null ? (
                        <div
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            result.totalStock > 10
                              ? "bg-green-100 text-green-700"
                              : result.totalStock > 0
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          Qty: {result.totalStock}
                        </div>
                      ) : (
                        <div className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-500">
                          No stock
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
