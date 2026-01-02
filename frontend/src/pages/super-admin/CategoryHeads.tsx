import { useState, useMemo, useCallback } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { FiEdit, FiTrash2, FiTag } from "react-icons/fi";
import { Link } from "react-router-dom";
import api from "../../services/api";
import { useSchool } from "../../contexts/SchoolContext";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  useCategoryHeadsData,
  CategoryHead,
} from "../../hooks/pages/super-admin/useCategoryHeadsData";
import { useCategoryHeadsImport } from "../../hooks/pages/super-admin/useCategoryHeadsImport";
import CategoryHeadsForm from "./components/CategoryHeadsForm";
import CategoryHeadsDialogs from "./components/CategoryHeadsDialogs";
import { DataTable } from "@/components/DataTable";
import { BulkActionsBar } from "@/components/BulkActionsBar";
import { exportToCSV } from "@/utils/export";
import { FiCheckCircle, FiXCircle } from "react-icons/fi";

export default function CategoryHeads() {
  const [mode, setMode] = useState<"add" | "import">("add");
  const [editingCategoryHead, setEditingCategoryHead] =
    useState<CategoryHead | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    status: "active" as string,
    schoolId: "" as string | number,
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const { selectedSchoolId, setSelectedSchoolId } = useSchool();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteItem, setDeleteItem] = useState<{
    id: number;
    schoolId: number;
  } | null>(null);
  const [selectedCategoryHeads, setSelectedCategoryHeads] = useState<
    CategoryHead[]
  >([]);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [isBulkOperating, setIsBulkOperating] = useState(false);

  // Use custom hook for data fetching
  const {
    categoryHeads,
    paginationMeta,
    loadingCategoryHeads,
    refetchCategoryHeads,
  } = useCategoryHeadsData({
    page,
    limit,
    search,
    selectedSchoolId: selectedSchoolId || "",
  });

  // Use custom hook for import
  const {
    importSchoolId: hookImportSchoolId,
    setImportSchoolId: setHookImportSchoolId,
    importFile,
    setImportFile,
    importPreview,
    isImporting,
    importResult,
    getRootProps,
    getInputProps,
    isDragActive,
    downloadSampleCSV,
    handleBulkImport,
  } = useCategoryHeadsImport({
    refetchCategoryHeads,
    setError,
    setSuccess,
  });

  // Sync importSchoolId with context school
  const importSchoolId = selectedSchoolId || hookImportSchoolId;
  const setImportSchoolId = (schoolId: string | number) => {
    setHookImportSchoolId(schoolId);
    if (schoolId) {
      setSelectedSchoolId(schoolId);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError("");
      setSuccess("");

      if (!formData.schoolId) {
        setError("Please select a school");
        return;
      }

      const payload: any = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        status: formData.status,
      };

      if (editingCategoryHead) {
        await api.instance.patch(
          `/super-admin/category-heads/${editingCategoryHead.id}?schoolId=${formData.schoolId}`,
          payload
        );
        setSuccess("Category head updated successfully!");
      } else {
        await api.instance.post(
          `/super-admin/category-heads?schoolId=${formData.schoolId}`,
          payload
        );
        setSuccess("Category head created successfully!");
      }

      const currentSchoolId = formData.schoolId;

      if (editingCategoryHead) {
        setEditingCategoryHead(null);
        resetForm();
      } else {
        resetForm(true, currentSchoolId);
      }

      refetchCategoryHeads();

      setTimeout(() => setSuccess(""), 5000);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Failed to save category head";
      setError(errorMessage);
      setTimeout(() => setError(""), 5000);
    }
  };

  const resetForm = (
    retainSchool: boolean = false,
    schoolId?: string | number
  ) => {
    setFormData({
      name: "",
      description: "",
      status: "active",
      schoolId: retainSchool && schoolId ? schoolId : "",
    });
  };

  const handleEdit = (categoryHead: CategoryHead) => {
    setEditingCategoryHead(categoryHead);
    setFormData({
      name: categoryHead.name,
      description: categoryHead.description || "",
      status: categoryHead.status,
      schoolId: categoryHead.schoolId,
    });
    setError("");
    setSuccess("");
  };

  const handleDeleteClick = (id: number, schoolId: number) => {
    setDeleteItem({ id, schoolId });
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteItem) return;

    try {
      setError("");
      await api.instance.delete(
        `/super-admin/category-heads/${deleteItem.id}?schoolId=${deleteItem.schoolId}`
      );
      setSuccess("Category head deleted successfully!");
      setDeleteDialogOpen(false);
      setDeleteItem(null);
      refetchCategoryHeads();
      setTimeout(() => setSuccess(""), 5000);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Failed to delete category head";
      setError(errorMessage);
      setTimeout(() => setError(""), 5000);
    }
  };

  const handleCancel = () => {
    setEditingCategoryHead(null);
    resetForm();
    setError("");
    setSuccess("");
  };

  const handlePaginationChange = useCallback(
    (pageIndex: number, pageSize: number) => {
      setPage(pageIndex + 1); // API uses 1-based indexing
      setLimit(pageSize);
    },
    []
  );

  const handleSearchChange = useCallback((searchValue: string) => {
    setSearch(searchValue);
    setPage(1); // Reset to first page on search
  }, []);

  // Bulk operations
  const handleBulkExport = useCallback(() => {
    if (selectedCategoryHeads.length === 0) {
      setError("Please select at least one category head to export");
      return;
    }

    const columns = [
      { header: "Name", accessorKey: "name" },
      {
        header: "Description",
        accessorFn: (ch: CategoryHead) => ch.description || "",
      },
      { header: "Status", accessorKey: "status" },
      {
        header: "School",
        accessorFn: (ch: CategoryHead) =>
          ch.school?.name || `School ID: ${ch.schoolId}`,
      },
      {
        header: "Created At",
        accessorFn: (ch: CategoryHead) =>
          new Date(ch.createdAt).toLocaleDateString(),
      },
    ];

    exportToCSV(
      selectedCategoryHeads,
      columns,
      `category-heads-${new Date().toISOString().split("T")[0]}.csv`
    );
    setSuccess(
      `Exported ${selectedCategoryHeads.length} category head(s) successfully!`
    );
    setTimeout(() => setSuccess(""), 3000);
  }, [selectedCategoryHeads, setError, setSuccess]);

  const handleBulkDeleteClick = useCallback(() => {
    if (selectedCategoryHeads.length === 0) {
      setError("Please select at least one category head to delete");
      return;
    }
    setBulkDeleteDialogOpen(true);
  }, [selectedCategoryHeads, setError]);

  const handleBulkDelete = useCallback(async () => {
    if (selectedCategoryHeads.length === 0) return;

    setIsBulkOperating(true);
    try {
      setError("");
      const deletePromises = selectedCategoryHeads.map((ch) =>
        api.instance.delete(
          `/super-admin/category-heads/${ch.id}?schoolId=${ch.schoolId}`
        )
      );

      await Promise.all(deletePromises);
      setSuccess(
        `Successfully deleted ${selectedCategoryHeads.length} category head(s)!`
      );
      setSelectedCategoryHeads([]);
      setBulkDeleteDialogOpen(false);
      refetchCategoryHeads();
      setTimeout(() => setSuccess(""), 5000);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Failed to delete category heads";
      setError(errorMessage);
      setTimeout(() => setError(""), 5000);
    } finally {
      setIsBulkOperating(false);
    }
  }, [selectedCategoryHeads, refetchCategoryHeads, setError, setSuccess]);

  const handleBulkStatusUpdate = useCallback(
    async (status: string) => {
      if (selectedCategoryHeads.length === 0) return;

      setIsBulkOperating(true);
      try {
        setError("");
        const updatePromises = selectedCategoryHeads.map((ch) =>
          api.instance.patch(
            `/super-admin/category-heads/${ch.id}?schoolId=${ch.schoolId}`,
            {
              status,
            }
          )
        );

        await Promise.all(updatePromises);
        setSuccess(
          `Successfully updated ${selectedCategoryHeads.length} category head(s) to ${status}!`
        );
        setSelectedCategoryHeads([]);
        refetchCategoryHeads();
        setTimeout(() => setSuccess(""), 5000);
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.message || "Failed to update category heads";
        setError(errorMessage);
        setTimeout(() => setError(""), 5000);
      } finally {
        setIsBulkOperating(false);
      }
    },
    [selectedCategoryHeads, refetchCategoryHeads, setError, setSuccess]
  );

  // Define columns for the data table
  const columns: ColumnDef<CategoryHead>[] = useMemo(
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
              Name
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          );
        },
        cell: ({ row }) => {
          const categoryHead = row.original;
          return (
            <div>
              <div className="font-semibold text-gray-900">
                {categoryHead.name}
              </div>
              {categoryHead.description && (
                <div className="text-xs text-gray-500 mt-0.5">
                  {categoryHead.description}
                </div>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "school",
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
          const categoryHead = row.original;
          return (
            <div className="text-sm text-gray-600">
              {categoryHead.school?.name ||
                `School ID: ${categoryHead.schoolId}`}
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
            <span
              className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                status === "active"
                  ? "bg-green-100 text-green-800"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
          );
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const categoryHead = row.original;
          return (
            <div className="flex items-center justify-end gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleEdit(categoryHead)}
                className="h-8 w-8 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 transition-colors"
                title="Edit"
              >
                <FiEdit className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() =>
                  handleDeleteClick(categoryHead.id, categoryHead.schoolId)
                }
                className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors"
                title="Delete"
              >
                <FiTrash2 className="w-4 h-4" />
              </Button>
            </div>
          );
        },
      },
    ],
    [handleEdit, handleDeleteClick]
  );

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/super-admin/dashboard">Dashboard</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/super-admin/settings/fee-settings/category-heads">
                Settings
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Category Heads</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
            Category Heads Management
          </CardTitle>
          <CardDescription>
            Manage category heads (e.g., General, Sponsored) for fee plans
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Success/Error Messages - Below header banner */}
      {success && (
        <Card className="border-l-4 border-l-green-400 bg-green-50">
          <CardContent className="pt-6">
            <p className="text-green-700">{success}</p>
          </CardContent>
        </Card>
      )}
      {error && (
        <Card className="border-l-4 border-l-red-400 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-700">{error}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Side - Add/Edit Form */}
        <CategoryHeadsForm
          mode={mode}
          setMode={setMode}
          formData={formData}
          setFormData={setFormData}
          editingCategoryHead={editingCategoryHead}
          handleSubmit={handleSubmit}
          handleCancel={handleCancel}
          importSchoolId={importSchoolId}
          setImportSchoolId={setImportSchoolId}
          importFile={importFile}
          setImportFile={setImportFile}
          importPreview={importPreview}
          isImporting={isImporting}
          importResult={importResult}
          getRootProps={getRootProps}
          getInputProps={getInputProps}
          isDragActive={isDragActive}
          downloadSampleCSV={downloadSampleCSV}
          handleBulkImport={handleBulkImport}
        />

        {/* Right Side - List */}
        <Card className="lg:col-span-2">
          <CardContent className="pt-6">
            {/* Bulk Actions Bar */}
            <BulkActionsBar
              selectedCount={selectedCategoryHeads.length}
              onClear={() => setSelectedCategoryHeads([])}
              onExport={handleBulkExport}
              onDelete={handleBulkDeleteClick}
              onStatusUpdate={handleBulkStatusUpdate}
              isLoading={isBulkOperating}
              exportLabel="Export"
              deleteLabel="Delete"
              statusOptions={[
                {
                  value: "active",
                  label: "Set to Active",
                  icon: <FiCheckCircle className="w-4 h-4" />,
                },
                {
                  value: "inactive",
                  label: "Set to Inactive",
                  icon: <FiXCircle className="w-4 h-4" />,
                },
              ]}
            />

            {/* Table */}
            {loadingCategoryHeads ? (
              <div className="flex items-center justify-center py-12">
                <FiTag className="w-8 h-8 animate-spin text-indigo-600" />
              </div>
            ) : categoryHeads.length === 0 ? (
              <div className="text-center py-12">
                <FiTag className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">
                  {search || selectedSchoolId
                    ? "No category heads found matching your criteria"
                    : "No category heads found. Create one to get started."}
                </p>
              </div>
            ) : (
              <DataTable
                columns={columns}
                data={categoryHeads}
                searchKey="name"
                searchPlaceholder="Search category heads..."
                enableRowSelection={true}
                onRowSelectionChange={setSelectedCategoryHeads}
                manualPagination={true}
                pageCount={paginationMeta?.totalPages || 0}
                totalRows={paginationMeta?.total || 0}
                externalPageIndex={page - 1}
                externalPageSize={limit}
                externalSearchValue={search}
                onPaginationChange={handlePaginationChange}
                onSearchChange={handleSearchChange}
                exportFileName="category-heads"
                exportTitle="Category Heads List"
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      <CategoryHeadsDialogs
        deleteDialogOpen={deleteDialogOpen}
        setDeleteDialogOpen={setDeleteDialogOpen}
        handleDelete={handleDelete}
        bulkDeleteDialogOpen={bulkDeleteDialogOpen}
        setBulkDeleteDialogOpen={setBulkDeleteDialogOpen}
        handleBulkDelete={handleBulkDelete}
        selectedCount={selectedCategoryHeads.length}
        isLoading={isBulkOperating}
      />
    </div>
  );
}
