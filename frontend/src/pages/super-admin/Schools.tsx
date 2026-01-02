import { useState, useEffect, useMemo, useCallback } from "react";
import { schoolService, School } from "../../services/schoolService";
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiMapPin,
  FiMail,
  FiPhone,
  FiGlobe,
} from "react-icons/fi";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DataTable } from "@/components/DataTable";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";

export default function Schools() {
  const [schools, setSchools] = useState<School[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [editingSchool, setEditingSchool] = useState<School | null>(null);
  const [formData, setFormData] = useState<Partial<School>>({
    name: "",
    subdomain: "",
    email: "",
    phone: "",
    address: "",
    status: "active",
  });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("active");
  const [paginationMeta, setPaginationMeta] = useState<{
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  } | null>(null);

  useEffect(() => {
    loadSchools();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, search, statusFilter]);

  // Clear success message after 5 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const loadSchools = useCallback(async () => {
    try {
      setError("");
      const response = await schoolService.getSchools({
        page,
        limit,
        search: search || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined, // Undefined means all statuses
      });
      setSchools(response.data || []);
      setPaginationMeta(response.meta || null);
    } catch (err: unknown) {
      const errorMessage =
        err &&
        typeof err === "object" &&
        "response" in err &&
        err.response &&
        typeof err.response === "object" &&
        "data" in err.response &&
        err.response.data &&
        typeof err.response.data === "object" &&
        "message" in err.response.data &&
        typeof err.response.data.message === "string"
          ? err.response.data.message
          : "Failed to load schools";
      setError(errorMessage);
    }
  }, [page, limit, search, statusFilter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError("");
      if (editingSchool) {
        await schoolService.update(editingSchool.id, formData);
        setSuccess("School updated successfully");
      } else {
        await schoolService.create(formData);
        setSuccess("School created successfully");
      }
      setShowDialog(false);
      setEditingSchool(null);
      resetForm();
      loadSchools();
    } catch (err: unknown) {
      const errorMessage =
        err &&
        typeof err === "object" &&
        "response" in err &&
        err.response &&
        typeof err.response === "object" &&
        "data" in err.response &&
        err.response.data &&
        typeof err.response.data === "object" &&
        "message" in err.response.data &&
        typeof err.response.data.message === "string"
          ? err.response.data.message
          : "Failed to save school";
      setError(errorMessage);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      subdomain: "",
      email: "",
      phone: "",
      address: "",
      status: "active",
    });
  };

  const handleEdit = (school: School) => {
    setEditingSchool(school);
    setFormData({
      name: school.name,
      subdomain: school.subdomain,
      email: school.email || "",
      phone: school.phone || "",
      address: school.address || "",
      status: school.status,
    });
    setShowDialog(true);
  };

  const handleDelete = useCallback(
    async (id: number) => {
      if (
        !confirm(
          "Are you sure you want to delete this school? This action cannot be undone."
        )
      )
        return;
      try {
        await schoolService.delete(id);
        setSuccess("School deleted successfully");
        loadSchools();
      } catch (err: unknown) {
        const errorMessage =
          err &&
          typeof err === "object" &&
          "response" in err &&
          err.response &&
          typeof err.response === "object" &&
          "data" in err.response &&
          err.response.data &&
          typeof err.response.data === "object" &&
          "message" in err.response.data &&
          typeof err.response.data.message === "string"
            ? err.response.data.message
            : "Failed to delete school";
        setError(errorMessage);
      }
    },
    [loadSchools]
  );

  const handlePaginationChange = useCallback(
    (pageIndex: number, pageSize: number) => {
      setPage(pageIndex + 1); // DataTable uses 0-based index, API uses 1-based
      setLimit(pageSize);
    },
    []
  );

  const handleSearchChange = useCallback((searchValue: string) => {
    setSearch(searchValue);
    setPage(1); // Reset to first page on search
  }, []);

  const columns: ColumnDef<School>[] = useMemo(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
              className="h-8 px-2 lg:px-3"
            >
              School
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          );
        },
        cell: ({ row }) => {
          const school = row.original;
          return (
            <div className="flex items-center">
              <div className="flex-shrink-0 h-12 w-12">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                  <FiMapPin className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="ml-4">
                <div className="text-sm font-semibold text-gray-900">
                  {school.name}
                </div>
                {school.address && (
                  <div className="text-sm text-gray-500 truncate max-w-xs">
                    {school.address}
                  </div>
                )}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "subdomain",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
              className="h-8 px-2 lg:px-3"
            >
              Subdomain
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          );
        },
        cell: ({ row }) => {
          const school = row.original;
          return (
            <div className="flex items-center text-sm text-gray-900">
              <FiGlobe className="w-4 h-4 mr-2 text-indigo-500" />
              <span className="font-mono bg-gradient-to-r from-indigo-100 to-purple-100 px-3 py-1 rounded-lg text-indigo-700 font-semibold">
                {school.subdomain}
              </span>
            </div>
          );
        },
      },
      {
        id: "contact",
        header: "Contact",
        cell: ({ row }) => {
          const school = row.original;
          return (
            <div className="text-sm text-gray-900">
              {school.email && (
                <div className="flex items-center mb-1">
                  <FiMail className="w-4 h-4 mr-2 text-gray-400" />
                  {school.email}
                </div>
              )}
              {school.phone && (
                <div className="flex items-center">
                  <FiPhone className="w-4 h-4 mr-2 text-gray-400" />
                  {school.phone}
                </div>
              )}
              {!school.email && !school.phone && (
                <span className="text-gray-400">No contact info</span>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "status",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
              className="h-8 px-2 lg:px-3"
            >
              Status
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          );
        },
        cell: ({ row }) => {
          const status = row.getValue("status") as string;
          return (
            <Badge
              variant={
                status === "active"
                  ? "default"
                  : status === "suspended"
                  ? "destructive"
                  : "secondary"
              }
              className={
                status === "active"
                  ? "bg-gradient-to-r from-green-400 to-emerald-500 text-white border-0"
                  : status === "suspended"
                  ? "bg-gradient-to-r from-red-400 to-rose-500 text-white border-0"
                  : "bg-gradient-to-r from-gray-400 to-gray-500 text-white border-0"
              }
            >
              {status}
            </Badge>
          );
        },
        filterConfig: {
          column: "status",
          title: "Status",
          options: [
            { label: "Active", value: "active" },
            { label: "Inactive", value: "inactive" },
            { label: "Suspended", value: "suspended" },
          ],
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const school = row.original;
          return (
            <div className="flex items-center justify-end space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEdit(school)}
                className="text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50"
                title="Edit"
              >
                <FiEdit2 className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(school.id)}
                className="text-red-600 hover:text-red-900 hover:bg-red-50"
                title="Delete"
              >
                <FiTrash2 className="w-5 h-5" />
              </Button>
            </div>
          );
        },
        enableSorting: false,
      },
    ],
    [handleDelete]
  );

  const filterButtons = (
    <Select value={statusFilter} onValueChange={setStatusFilter}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Filter by status" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Status</SelectItem>
        <SelectItem value="active">Active</SelectItem>
        <SelectItem value="inactive">Inactive</SelectItem>
        <SelectItem value="suspended">Suspended</SelectItem>
      </SelectContent>
    </Select>
  );

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage>Dashboard</BreadcrumbPage>
          </BreadcrumbItem>
          <BreadcrumbItem>
            <BreadcrumbPage>Schools</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
                Schools
              </CardTitle>
              <CardDescription className="mt-1">
                Manage school information and settings
              </CardDescription>
            </div>
            <Button
              onClick={() => {
                setEditingSchool(null);
                resetForm();
                setShowDialog(true);
              }}
              className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700"
            >
              <FiPlus className="w-5 h-5 mr-2" />
              Add School
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Success Alert */}
      {success && (
        <Card className="border-l-4 border-l-green-400 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <svg
                className="w-5 h-5 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-sm text-green-700">{success}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Alert */}
      {error && (
        <Card className="border-l-4 border-l-red-400 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <svg
                className="w-5 h-5 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* DataTable */}
      <Card>
        <CardContent className="pt-6">
          <DataTable
            columns={columns}
            data={schools}
            searchKey="name"
            searchPlaceholder="Search schools by name..."
            enableRowSelection={false}
            filterButtons={filterButtons}
            manualPagination={true}
            pageCount={paginationMeta?.totalPages || 0}
            totalRows={paginationMeta?.total || 0}
            onPaginationChange={handlePaginationChange}
            onSearchChange={handleSearchChange}
            externalPageIndex={page - 1}
            externalPageSize={limit}
            externalSearchValue={search}
            exportFileName="schools"
            exportTitle="Schools List"
            enableExport={true}
          />
        </CardContent>
      </Card>

      {/* Dialog */}
      <Dialog
        open={showDialog}
        onOpenChange={(open) => {
          setShowDialog(open);
          if (!open) {
            setEditingSchool(null);
            resetForm();
          }
        }}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editingSchool ? "Edit School" : "Add New School"}
            </DialogTitle>
            <DialogDescription>
              {editingSchool
                ? "Update school information"
                : "Create a new school"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                School Name *
              </label>
              <Input
                type="text"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="ABC School"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Subdomain *
              </label>
              <div className="flex items-center gap-2">
                <span className="text-gray-500 text-sm font-medium">
                  https://
                </span>
                <Input
                  type="text"
                  required
                  value={formData.subdomain}
                  onChange={(e) =>
                    setFormData({ ...formData, subdomain: e.target.value })
                  }
                  className="flex-1 font-mono"
                  placeholder="school1"
                />
                <span className="text-gray-500 text-sm font-medium">
                  .yourdomain.com
                </span>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Used for multi-tenant access
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email
                </label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="contact@school.com"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Phone
                </label>
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="+1234567890"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Address
              </label>
              <Textarea
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                rows={3}
                placeholder="123 Main Street, City, State"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Status *
              </label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    status: value as "active" | "inactive" | "suspended",
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowDialog(false);
                  setEditingSchool(null);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700"
              >
                {editingSchool ? "Update School" : "Create School"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
