import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  FiFilter,
  FiX,
  FiCalendar,
  FiDollarSign,
  FiChevronDown,
  FiChevronUp,
} from "react-icons/fi";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export type FilterType = 
  | "select" 
  | "multiSelect" 
  | "dateRange" 
  | "date" 
  | "numberRange" 
  | "number"
  | "text";

export interface AdvancedFilterConfig {
  id: string;
  label: string;
  type: FilterType;
  column: string;
  options?: Array<{ label: string; value: string | number }>;
  placeholder?: string;
  icon?: React.ReactNode;
}

export interface FilterValue {
  [key: string]: 
    | string 
    | number 
    | string[] 
    | number[] 
    | { from: Date | null; to: Date | null }
    | { from: number | null; to: number | null }
    | null;
}

interface AdvancedFiltersProps {
  filters: AdvancedFilterConfig[];
  values: FilterValue;
  onChange: (values: FilterValue) => void;
  onClear?: () => void;
  className?: string;
}

export function AdvancedFilters({
  filters,
  values,
  onChange,
  onClear,
  className,
}: AdvancedFiltersProps) {
  const [openFilters, setOpenFilters] = useState<Set<string>>(new Set());
  const [datePopovers, setDatePopovers] = useState<Record<string, boolean>>({});

  const updateFilter = (filterId: string, value: any) => {
    onChange({
      ...values,
      [filterId]: value,
    });
  };

  const clearFilter = (filterId: string) => {
    const newValues = { ...values };
    delete newValues[filterId];
    onChange(newValues);
  };

  const getActiveFiltersCount = () => {
    return Object.keys(values).filter(
      (key) =>
        values[key] !== null &&
        values[key] !== undefined &&
        values[key] !== "" &&
        (Array.isArray(values[key]) ? (values[key] as any[]).length > 0 : true) &&
        (typeof values[key] === "object" && !Array.isArray(values[key])
          ? Object.values(values[key] as any).some((v) => v !== null)
          : true)
    ).length;
  };

  const activeCount = getActiveFiltersCount();

  const renderFilter = (filter: AdvancedFilterConfig) => {
    const value = values[filter.id];

    switch (filter.type) {
      case "select":
        return (
          <Select
            value={value ? String(value) : undefined}
            onValueChange={(val) => updateFilter(filter.id, val === "all" ? null : val)}
          >
            <SelectTrigger className="w-[180px] h-9">
              <SelectValue placeholder={filter.placeholder || `Select ${filter.label}`} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All {filter.label}</SelectItem>
              {filter.options?.map((option) => (
                <SelectItem key={option.value} value={String(option.value)}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case "multiSelect":
        const selectedValues = Array.isArray(value) ? value : [];
        return (
          <Popover
            open={datePopovers[filter.id] || false}
            onOpenChange={(open) =>
              setDatePopovers({ ...datePopovers, [filter.id]: open })
            }
          >
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-[180px] h-9 justify-between"
              >
                <span className="truncate">
                  {selectedValues.length > 0
                    ? `${selectedValues.length} selected`
                    : filter.placeholder || `Select ${filter.label}`}
                </span>
                <FiChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0" align="start">
              <div className="p-2 space-y-2 max-h-[300px] overflow-y-auto">
                {filter.options?.map((option) => {
                  const isSelected = selectedValues.includes(String(option.value));
                  return (
                    <div
                      key={option.value}
                      className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                      onClick={() => {
                        const newValues = isSelected
                          ? selectedValues.filter((v) => v !== String(option.value))
                          : [...selectedValues, String(option.value)];
                        updateFilter(filter.id, newValues.length > 0 ? newValues : null);
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="rounded border-gray-300"
                      />
                      <label className="text-sm cursor-pointer flex-1">
                        {option.label}
                      </label>
                    </div>
                  );
                })}
              </div>
            </PopoverContent>
          </Popover>
        );

      case "date":
        const dateValue = value as Date | null;
        return (
          <Popover
            open={datePopovers[filter.id] || false}
            onOpenChange={(open) =>
              setDatePopovers({ ...datePopovers, [filter.id]: open })
            }
          >
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[240px] h-9 justify-start text-left font-normal",
                  !dateValue && "text-muted-foreground"
                )}
              >
                <FiCalendar className="mr-2 h-4 w-4" />
                {dateValue ? format(dateValue, "PPP") : filter.placeholder || "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateValue || undefined}
                onSelect={(date) => {
                  updateFilter(filter.id, date || null);
                  setDatePopovers({ ...datePopovers, [filter.id]: false });
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        );

      case "dateRange":
        const dateRangeValue = (value as { from: Date | null; to: Date | null }) || {
          from: null,
          to: null,
        };
        return (
          <Popover
            open={datePopovers[filter.id] || false}
            onOpenChange={(open) =>
              setDatePopovers({ ...datePopovers, [filter.id]: open })
            }
          >
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[240px] h-9 justify-start text-left font-normal",
                  !dateRangeValue.from && "text-muted-foreground"
                )}
              >
                <FiCalendar className="mr-2 h-4 w-4" />
                {dateRangeValue.from && dateRangeValue.to
                  ? `${format(dateRangeValue.from, "MMM dd")} - ${format(dateRangeValue.to, "MMM dd")}`
                  : dateRangeValue.from
                  ? format(dateRangeValue.from, "PPP")
                  : filter.placeholder || "Pick a date range"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="range"
                selected={{
                  from: dateRangeValue.from || undefined,
                  to: dateRangeValue.to || undefined,
                }}
                onSelect={(range) => {
                  updateFilter(filter.id, {
                    from: range?.from || null,
                    to: range?.to || null,
                  });
                  if (range?.from && range?.to) {
                    setDatePopovers({ ...datePopovers, [filter.id]: false });
                  }
                }}
                numberOfMonths={2}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        );

      case "number":
        return (
          <Input
            type="number"
            placeholder={filter.placeholder || `Enter ${filter.label}`}
            value={value ? String(value) : ""}
            onChange={(e) =>
              updateFilter(
                filter.id,
                e.target.value ? Number(e.target.value) : null
              )
            }
            className="w-[180px] h-9"
          />
        );

      case "numberRange":
        const numberRangeValue = (value as { from: number | null; to: number | null }) || {
          from: null,
          to: null,
        };
        return (
          <div className="flex items-center gap-2 w-[240px]">
            <Input
              type="number"
              placeholder="Min"
              value={numberRangeValue.from !== null ? String(numberRangeValue.from) : ""}
              onChange={(e) =>
                updateFilter(filter.id, {
                  ...numberRangeValue,
                  from: e.target.value ? Number(e.target.value) : null,
                })
              }
              className="h-9"
            />
            <span className="text-muted-foreground">-</span>
            <Input
              type="number"
              placeholder="Max"
              value={numberRangeValue.to !== null ? String(numberRangeValue.to) : ""}
              onChange={(e) =>
                updateFilter(filter.id, {
                  ...numberRangeValue,
                  to: e.target.value ? Number(e.target.value) : null,
                })
              }
              className="h-9"
            />
          </div>
        );

      case "text":
        return (
          <Input
            placeholder={filter.placeholder || `Search ${filter.label}`}
            value={value ? String(value) : ""}
            onChange={(e) => updateFilter(filter.id, e.target.value || null)}
            className="w-[180px] h-9"
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Filter Bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <FiFilter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Filters:</span>
          {activeCount > 0 && (
            <Badge variant="secondary" className="ml-1">
              {activeCount} active
            </Badge>
          )}
        </div>

        {filters.map((filter) => (
          <div key={filter.id} className="flex items-center gap-2">
            {filter.icon && <span className="text-muted-foreground">{filter.icon}</span>}
            <Label className="text-sm whitespace-nowrap">{filter.label}:</Label>
            {renderFilter(filter)}
            {values[filter.id] && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => clearFilter(filter.id)}
              >
                <FiX className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}

        {activeCount > 0 && onClear && (
          <Button
            variant="outline"
            size="sm"
            onClick={onClear}
            className="h-9"
          >
            <FiX className="mr-2 h-4 w-4" />
            Clear All
          </Button>
        )}
      </div>

      {/* Active Filter Chips */}
      {activeCount > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          {Object.entries(values).map(([filterId, filterValue]) => {
            if (
              !filterValue ||
              filterValue === "" ||
              (Array.isArray(filterValue) && filterValue.length === 0) ||
              (typeof filterValue === "object" &&
                !Array.isArray(filterValue) &&
                Object.values(filterValue).every((v) => v === null))
            ) {
              return null;
            }

            const filter = filters.find((f) => f.id === filterId);
            if (!filter) return null;

            let displayValue = "";
            if (Array.isArray(filterValue)) {
              const selectedOptions = filter.options?.filter((opt) =>
                filterValue.includes(String(opt.value))
              );
              displayValue = selectedOptions?.map((opt) => opt.label).join(", ") || "";
            } else if (
              typeof filterValue === "object" &&
              "from" in filterValue &&
              "to" in filterValue
            ) {
              if (filter.type === "dateRange") {
                const range = filterValue as { from: Date | null; to: Date | null };
                if (range.from && range.to) {
                  displayValue = `${format(range.from, "MMM dd")} - ${format(range.to, "MMM dd")}`;
                } else if (range.from) {
                  displayValue = `From ${format(range.from, "MMM dd")}`;
                }
              } else {
                const range = filterValue as { from: number | null; to: number | null };
                if (range.from !== null && range.to !== null) {
                  displayValue = `${range.from} - ${range.to}`;
                } else if (range.from !== null) {
                  displayValue = `From ${range.from}`;
                } else if (range.to !== null) {
                  displayValue = `Up to ${range.to}`;
                }
              }
            } else {
              const option = filter.options?.find(
                (opt) => String(opt.value) === String(filterValue)
              );
              displayValue = option?.label || String(filterValue);
            }

            return (
              <Badge
                key={filterId}
                variant="secondary"
                className="flex items-center gap-1 px-2 py-1"
              >
                <span className="font-medium">{filter.label}:</span>
                <span>{displayValue}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 ml-1 hover:bg-transparent"
                  onClick={() => clearFilter(filterId)}
                >
                  <FiX className="h-3 w-3" />
                </Button>
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}

