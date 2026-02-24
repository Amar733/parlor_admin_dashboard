"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface Option {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SearchableSelectProps {
  options: Option[];
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  className?: string;
  disabled?: boolean;
  onSearchChange?: (search: string) => Promise<Option[]> | void;
  loading?: boolean;
}

export function SearchableSelect({
  options,
  value,
  onValueChange,
  placeholder = "Select option...",
  searchPlaceholder = "Search...",
  emptyText = "No option found.",
  className,
  disabled = false,
  onSearchChange,
  loading = false,
}: SearchableSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [searchResults, setSearchResults] = React.useState<Option[]>([]);
  const [selectedFromSearch, setSelectedFromSearch] = React.useState<Option | null>(null);

  const selectedOption = options.find((option) => option.value === value) || 
    (selectedFromSearch?.value === value ? selectedFromSearch : null);
  
  const filteredOptions = search && searchResults.length > 0 ? searchResults : 
    options.filter(option => option.label.toLowerCase().includes(search.toLowerCase()));

  const handleSelect = (optionValue: string) => {
    const selectedFromResults = searchResults.find(opt => opt.value === optionValue);
    const selectedFromOptions = options.find(opt => opt.value === optionValue);
    
    if (selectedFromResults) {
      setSelectedFromSearch(selectedFromResults);
    } else if (selectedFromOptions) {
      setSelectedFromSearch(null);
    }
    
    onValueChange(optionValue);
    setOpen(false);
    setSearch("");
    setSearchResults([]);
  };

  const handleSearchChange = (searchValue: string) => {
    setSearch(searchValue);
  };

  // Debounced search
  React.useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (search && onSearchChange) {
        const results = await onSearchChange(search);
        if (results && Array.isArray(results)) {
          // Map API results to Option format
          const mappedResults = results.map((item: any) => {
            let label = item.label;
            
            if (!label) {
              if (item.firstName && item.lastName) {
                label = `${item.firstName} ${item.lastName}${item.contact ? ` (${item.contact})` : ''}`;
              } else if (item.productName && item.sellingPrice !== undefined) {
                const capitalizedName = item.productName.charAt(0).toUpperCase() + item.productName.slice(1);
                label = `${capitalizedName} - ₹${(item.sellingPrice || 0).toFixed(2)}`;
              } else {
                label = item.companyName || item.name || item.productName || String(item);
              }
            }
            
            return {
              value: item.value || item._id || item.id,
              label: label
            };
          });
          setSearchResults(mappedResults);
        }
      } else {
        setSearchResults([]);
      }
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [search, onSearchChange]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between h-10", className)}
          disabled={disabled}
        >
          <span className="truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <div className="p-2">
          <Input
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="h-9"
          />
        </div>
        <div 
          className="max-h-64 overflow-auto"
          onWheel={(e) => {
            e.currentTarget.scrollTop += e.deltaY;
          }}
        >
          {loading ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
              Loading...
            </div>
          ) : filteredOptions.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              {emptyText}
            </div>
          ) : (
            filteredOptions.map((option, index) => (
              <div
                key={`${option.value}-${index}`}
                className={cn(
                  "flex items-center px-2 py-1.5 text-sm",
                  option.disabled 
                    ? "cursor-not-allowed opacity-50 text-muted-foreground" 
                    : "cursor-pointer hover:bg-accent hover:text-accent-foreground"
                )}
                onClick={() => !option.disabled && handleSelect(option.value)}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === option.value ? "opacity-100" : "opacity-0"
                  )}
                />
                {option.label}
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}