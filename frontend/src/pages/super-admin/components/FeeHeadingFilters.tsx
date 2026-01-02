import { FiSearch, FiX } from "react-icons/fi";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FeeHeadingFiltersProps {
  search: string;
  setSearch: (value: string) => void;
  selectedType: string;
  setSelectedType: (value: string) => void;
  setPage: (page: number) => void;
}

export function FeeHeadingFilters({
  search,
  setSearch,
  selectedType,
  setSelectedType,
  setPage,
}: FeeHeadingFiltersProps) {
  return (
    <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="relative">
        <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <Input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search by name or description..."
          className="w-full pl-10 pr-10"
        />
        {search && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch("");
              setPage(1);
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 h-auto p-1 text-gray-400 hover:text-gray-600"
          >
            <FiX className="w-4 h-4" />
          </Button>
        )}
      </div>

      <div>
        <Select
          value={selectedType || "__EMPTY__"}
          onValueChange={(value) => {
            setSelectedType(value === "__EMPTY__" ? "" : value);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Filter by Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__EMPTY__">All Types</SelectItem>
            <SelectItem value="school">School Fee</SelectItem>
            <SelectItem value="transport">Transport Fee</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

