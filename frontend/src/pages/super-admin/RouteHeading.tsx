import { useState } from "react";
import api from "../../services/api";
import {
  useRoutesData,
  Route,
} from "../../hooks/pages/super-admin/useRoutesData";
import RoutesForm from "./components/RoutesForm";
import RoutesFilters from "./components/RoutesFilters";
import RoutesTable from "./components/RoutesTable";
import RoutesDialogs from "./components/RoutesDialogs";

export default function RouteHeading() {
  const [editingRoute, setEditingRoute] = useState<Route | null>(null);
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
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | number>("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteItem, setDeleteItem] = useState<{
    id: number;
    schoolId: number;
  } | null>(null);

  // Use custom hook for data fetching
  const {
    routes,
    paginationMeta,
    loadingRoutes,
    refetchRoutes,
    schools,
    loadingSchools,
  } = useRoutesData({
    page,
    limit,
    search,
    selectedSchoolId,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError("");
      setSuccess("");

      if (!formData.schoolId) {
        setError("Please select a school");
        return;
      }

      const payload: Record<string, unknown> = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        status: formData.status,
      };

      if (editingRoute) {
        await api.instance.patch(
          `/super-admin/routes/${editingRoute.id}?schoolId=${formData.schoolId}`,
          payload
        );
        setSuccess("Route updated successfully!");
      } else {
        await api.instance.post(
          `/super-admin/routes?schoolId=${formData.schoolId}`,
          payload
        );
        setSuccess("Route created successfully!");
      }

      const currentSchoolId = formData.schoolId;

      if (editingRoute) {
        setEditingRoute(null);
        resetForm();
      } else {
        resetForm(true, currentSchoolId);
      }

      refetchRoutes();

      setTimeout(() => setSuccess(""), 5000);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Failed to save route";
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

  const handleEdit = (route: Route) => {
    setEditingRoute(route);
    setFormData({
      name: route.name,
      description: route.description || "",
      status: route.status,
      schoolId: route.schoolId,
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
        `/super-admin/routes/${deleteItem.id}?schoolId=${deleteItem.schoolId}`
      );
      setSuccess("Route deleted successfully!");
      setDeleteDialogOpen(false);
      setDeleteItem(null);
      refetchRoutes();
      setTimeout(() => setSuccess(""), 5000);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Failed to delete route";
      setError(errorMessage);
      setTimeout(() => setError(""), 5000);
    }
  };

  const handleCancel = () => {
    setEditingRoute(null);
    resetForm();
    setError("");
    setSuccess("");
  };

  return (
    <div className="space-y-6">
      {/* Success/Error Messages */}
      {success && (
        <div className="card-modern rounded-xl p-4 bg-green-50 border-l-4 border-green-400">
          <p className="text-green-700">{success}</p>
        </div>
      )}
      {error && (
        <div className="card-modern rounded-xl p-4 bg-red-50 border-l-4 border-red-400">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Side - Add/Edit Form */}
        <RoutesForm
          formData={formData}
          setFormData={setFormData}
          editingRoute={editingRoute}
          schools={schools}
          loadingSchools={loadingSchools}
          handleSubmit={handleSubmit}
          handleCancel={handleCancel}
        />

        {/* Right Side - List */}
        <div className="card-modern rounded-xl p-4 lg:col-span-2">
          {/* Search and Filter */}
          <RoutesFilters
            search={search}
            setSearch={setSearch}
            selectedSchoolId={selectedSchoolId}
            setSelectedSchoolId={setSelectedSchoolId}
            schools={schools}
            setPage={setPage}
          />

          {/* Table */}
          <RoutesTable
            routes={routes}
            loading={loadingRoutes}
            paginationMeta={paginationMeta}
            page={page}
            limit={limit}
            setPage={setPage}
            setLimit={setLimit}
            search={search}
            selectedSchoolId={selectedSchoolId}
            handleEdit={handleEdit}
            handleDeleteClick={handleDeleteClick}
          />
        </div>
      </div>

      {/* Dialogs */}
      <RoutesDialogs
        deleteDialogOpen={deleteDialogOpen}
        setDeleteDialogOpen={setDeleteDialogOpen}
        handleDelete={handleDelete}
      />
    </div>
  );
}
