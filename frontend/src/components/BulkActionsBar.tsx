import React from "react";
import { Button } from "@/components/ui/button";
import { FiDownload, FiTrash2, FiX, FiCheckCircle, FiXCircle, FiLoader } from "react-icons/fi";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

interface BulkActionsBarProps {
  selectedCount: number;
  onClear: () => void;
  onExport?: () => void;
  onDelete?: () => void;
  onStatusUpdate?: (status: string) => void;
  isLoading?: boolean;
  exportLabel?: string;
  deleteLabel?: string;
  statusOptions?: Array<{ value: string; label: string; icon?: React.ReactNode }>;
  customActions?: React.ReactNode;
}

export function BulkActionsBar({
  selectedCount,
  onClear,
  onExport,
  onDelete,
  onStatusUpdate,
  isLoading = false,
  exportLabel = "Export",
  deleteLabel = "Delete",
  statusOptions = [],
  customActions,
}: BulkActionsBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="mb-4 p-3 bg-indigo-50 border border-indigo-200 rounded-lg flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-indigo-900">
          {selectedCount} item{selectedCount !== 1 ? "s" : ""} selected
        </span>
        {isLoading && (
          <FiLoader className="w-4 h-4 animate-spin text-indigo-600" />
        )}
      </div>
      <div className="flex items-center gap-2">
        {customActions}
        {onExport && (
          <Button
            onClick={onExport}
            disabled={isLoading}
            className="bg-green-600 hover:bg-green-700 text-white"
            size="sm"
          >
            <FiDownload className="w-4 h-4 mr-2" />
            {exportLabel}
          </Button>
        )}
        {onStatusUpdate && statusOptions.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={isLoading}
                className="border-indigo-300 text-indigo-700 hover:bg-indigo-100"
              >
                Update Status
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {statusOptions.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => onStatusUpdate(option.value)}
                  className="flex items-center gap-2"
                >
                  {option.icon}
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        {onDelete && (
          <Button
            onClick={onDelete}
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700 text-white"
            size="sm"
          >
            <FiTrash2 className="w-4 h-4 mr-2" />
            {deleteLabel} ({selectedCount})
          </Button>
        )}
        <Button
          variant="outline"
          onClick={onClear}
          disabled={isLoading}
          size="sm"
          className="border-indigo-300 text-indigo-700 hover:bg-indigo-100"
        >
          <FiX className="w-4 h-4 mr-2" />
          Clear
        </Button>
      </div>
    </div>
  );
}

