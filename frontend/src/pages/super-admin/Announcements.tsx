import { useState, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import {
  FiEdit,
  FiTrash2,
  FiLoader,
  FiBell,
  FiPlus,
  FiEye,
  FiArchive,
  FiSend,
} from "react-icons/fi";
import api from "../../services/api";
import { useSchool } from "../../contexts/SchoolContext";
import { useAuth } from "../../contexts/AuthContext";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/DataTable";
import { announcementService, Announcement } from "@/services/announcementService";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getErrorMessage } from "@/utils/errorHandling";
import { format } from "date-fns";

export default function Announcements() {
  const { selectedSchoolId, schools } = useSchool();
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [filterSchoolId, setFilterSchoolId] = useState<string | number | "all">("all");
  const [filterTarget, setFilterTarget] = useState<string | "all">("all");
  const [includeArchived, setIncludeArchived] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    priority: "medium" as "low" | "medium" | "high" | "urgent",
    status: "draft" as "draft" | "published" | "archived",
    target: "all" as "all" | "students" | "parents" | "teachers" | "administrators",
    publishAt: "",
    expiresAt: "",
    sendEmail: false,
    sendSMS: false,
    schoolId: "" as string | number,
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const queryClient = useQueryClient();

  // For super admin: show all announcements (no school filter)
  // For other users: filter by their school
  const isSuperAdmin = user?.role === "super_admin";
  
  // Determine the school ID to use for query
  // For super admin: use filterSchoolId if not "all", otherwise undefined
  // For other users: use their school
  const querySchoolId = isSuperAdmin
    ? (filterSchoolId === "all" ? undefined : filterSchoolId)
    : (selectedSchoolId || user?.schoolId || undefined);

  const { data, isLoading } = useQuery({
    queryKey: ["announcements", querySchoolId, page, limit, includeArchived, filterTarget],
    queryFn: () =>
      announcementService.getAll({
        page,
        limit,
        schoolId: querySchoolId,
        includeArchived,
        target: filterTarget === "all" ? undefined : filterTarget,
      }),
  });

  const createMutation = useMutation({
    mutationFn: (data: Parameters<typeof announcementService.create>[0]) =>
      announcementService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      setSuccess("Announcement created successfully!");
      setDialogOpen(false);
      resetForm();
      setTimeout(() => setSuccess(""), 5000);
    },
    onError: (err: unknown) => {
      setError(getErrorMessage(err, "Failed to create announcement"));
      setTimeout(() => setError(""), 5000);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: Parameters<typeof announcementService.update>[1];
    }) => announcementService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      setSuccess("Announcement updated successfully!");
      setDialogOpen(false);
      resetForm();
      setTimeout(() => setSuccess(""), 5000);
    },
    onError: (err: unknown) => {
      setError(getErrorMessage(err, "Failed to update announcement"));
      setTimeout(() => setError(""), 5000);
    },
  });

  const publishMutation = useMutation({
    mutationFn: (id: number) => announcementService.publish(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      setSuccess("Announcement published successfully!");
      setTimeout(() => setSuccess(""), 5000);
    },
    onError: (err: unknown) => {
      setError(getErrorMessage(err, "Failed to publish announcement"));
      setTimeout(() => setError(""), 5000);
    },
  });

  const archiveMutation = useMutation({
    mutationFn: (id: number) => announcementService.archive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      setSuccess("Announcement archived successfully!");
      setTimeout(() => setSuccess(""), 5000);
    },
    onError: (err: unknown) => {
      setError(getErrorMessage(err, "Failed to archive announcement"));
      setTimeout(() => setError(""), 5000);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => announcementService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      setSuccess("Announcement deleted successfully!");
      setTimeout(() => setSuccess(""), 5000);
    },
    onError: (err: unknown) => {
      setError(getErrorMessage(err, "Failed to delete announcement"));
      setTimeout(() => setError(""), 5000);
    },
  });

  const resetForm = useCallback(() => {
    setFormData({
      title: "",
      content: "",
      priority: "medium",
      status: "draft",
      target: "all",
      publishAt: "",
      expiresAt: "",
      sendEmail: false,
      sendSMS: false,
      schoolId: isSuperAdmin ? "" : (selectedSchoolId || user?.schoolId || ""),
    });
    setEditingAnnouncement(null);
  }, [isSuperAdmin, selectedSchoolId, user?.schoolId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // For super admin, use formData.schoolId if provided, otherwise selectedSchoolId
    // For other users, use their schoolId
    const schoolIdToUse = isSuperAdmin 
      ? (formData.schoolId || selectedSchoolId || user?.schoolId)
      : (selectedSchoolId || user?.schoolId);
    
    if (!schoolIdToUse) {
      setError("Please select a school");
      return;
    }

    // Convert datetime-local format to ISO 8601 string
    const convertToISO = (dateString: string): string | undefined => {
      if (!dateString || dateString.trim() === '') {
        return undefined;
      }
      // datetime-local format: "YYYY-MM-DDTHH:mm"
      // Convert to ISO 8601: "YYYY-MM-DDTHH:mm:ss.sssZ"
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return undefined;
      }
      return date.toISOString();
    };

    const publishAtISO = convertToISO(formData.publishAt);
    const expiresAtISO = convertToISO(formData.expiresAt);

    // Build payload, excluding undefined values
    const payload: {
      title: string;
      content: string;
      priority?: string;
      status?: string;
      target?: string;
      publishAt?: string;
      expiresAt?: string;
      sendEmail?: boolean;
      sendSMS?: boolean;
      schoolId: number;
      attachments?: Array<{ name: string; url: string; type: string; size: number }>;
    } = {
      title: formData.title,
      content: formData.content,
      priority: formData.priority,
      status: formData.status,
      target: formData.target,
      sendEmail: formData.sendEmail,
      sendSMS: formData.sendSMS,
      schoolId: schoolIdToUse,
    };

    // Only include dates if they have values
    if (publishAtISO) {
      payload.publishAt = publishAtISO;
    }
    if (expiresAtISO) {
      payload.expiresAt = expiresAtISO;
    }

    if (editingAnnouncement) {
      updateMutation.mutate({ id: editingAnnouncement.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleEdit = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      priority: announcement.priority,
      status: announcement.status,
      target: announcement.target,
      publishAt: announcement.publishAt
        ? format(new Date(announcement.publishAt), "yyyy-MM-dd'T'HH:mm")
        : "",
      expiresAt: announcement.expiresAt
        ? format(new Date(announcement.expiresAt), "yyyy-MM-dd'T'HH:mm")
        : "",
      sendEmail: announcement.sendEmail,
      sendSMS: announcement.sendSMS,
      schoolId: announcement.schoolId || "",
    });
    setDialogOpen(true);
  };

  const handlePaginationChange = useCallback(
    (pageIndex: number, pageSize: number) => {
      setPage(pageIndex + 1);
      setLimit(pageSize);
    },
    []
  );

  const handleSearchChange = useCallback((searchValue: string) => {
    setSearch(searchValue);
    setPage(1);
  }, []);

  const priorityColors = {
    low: "bg-gray-100 text-gray-800",
    medium: "bg-blue-100 text-blue-800",
    high: "bg-orange-100 text-orange-800",
    urgent: "bg-red-100 text-red-800",
  };

  const statusColors = {
    draft: "bg-gray-100 text-gray-800",
    published: "bg-green-100 text-green-800",
    archived: "bg-yellow-100 text-yellow-800",
  };

  const columns: ColumnDef<Announcement>[] = useMemo(
    () => [
      {
        accessorKey: "title",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
              className="h-8 px-2 lg:px-3"
            >
              Title
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          );
        },
        cell: ({ row }) => {
          return (
            <div className="font-semibold">{row.getValue("title")}</div>
          );
        },
      },
      {
        accessorKey: "priority",
        header: "Priority",
        cell: ({ row }) => {
          const priority = row.getValue("priority") as string;
          return (
            <Badge className={priorityColors[priority as keyof typeof priorityColors]}>
              {priority.charAt(0).toUpperCase() + priority.slice(1)}
            </Badge>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const status = row.getValue("status") as string;
          return (
            <Badge className={statusColors[status as keyof typeof statusColors]}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
          );
        },
      },
      {
        accessorKey: "target",
        header: "Target",
        cell: ({ row }) => {
          const target = row.getValue("target") as string;
          return (
            <span className="text-sm text-gray-600 capitalize">
              {target.replace("_", " ")}
            </span>
          );
        },
      },
      {
        accessorKey: "views",
        header: "Views",
        cell: ({ row }) => {
          return <span className="text-sm text-gray-600">{row.getValue("views")}</span>;
        },
      },
      {
        accessorKey: "createdAt",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
              className="h-8 px-2 lg:px-3"
            >
              Created
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          );
        },
        cell: ({ row }) => {
          return (
            <span className="text-sm text-gray-600">
              {format(new Date(row.getValue("createdAt")), "MMM dd, yyyy")}
            </span>
          );
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const announcement = row.original;
          return (
            <div className="flex items-center justify-end gap-1">
              {announcement.status === "draft" && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => publishMutation.mutate(announcement.id)}
                  className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50 transition-colors"
                  title="Publish"
                >
                  <FiSend className="w-4 h-4" />
                </Button>
              )}
              {announcement.status === "published" && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => archiveMutation.mutate(announcement.id)}
                  className="h-8 w-8 text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 transition-colors"
                  title="Archive"
                >
                  <FiArchive className="w-4 h-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleEdit(announcement)}
                className="h-8 w-8 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 transition-colors"
                title="Edit"
              >
                <FiEdit className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => deleteMutation.mutate(announcement.id)}
                className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors"
                title="Delete"
              >
                <FiTrash2 className="w-4 h-4" />
              </Button>
            </div>
          );
        },
        enableSorting: false,
      },
    ],
    [handleEdit, publishMutation, archiveMutation, deleteMutation]
  );

  const filteredAnnouncements = useMemo(() => {
    if (!data?.data) return [];
    if (!search) return data.data;
    const searchLower = search.toLowerCase();
    return data.data.filter(
      (announcement) =>
        announcement.title.toLowerCase().includes(searchLower) ||
        announcement.content.toLowerCase().includes(searchLower)
    );
  }, [data?.data, search]);

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
            <BreadcrumbPage>Announcements</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
                Announcements Management
              </CardTitle>
              <CardDescription>
                Create and manage announcements for your school community
              </CardDescription>
            </div>
            <Button
              onClick={() => {
                resetForm();
                setDialogOpen(true);
              }}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
            >
              <FiPlus className="w-4 h-4 mr-2" />
              New Announcement
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Success/Error Messages */}
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

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4 flex-wrap">
            {isSuperAdmin && (
              <div className="flex items-center gap-2">
                <Label htmlFor="filter-school" className="whitespace-nowrap">Filter by School:</Label>
                <Select
                  value={filterSchoolId === "all" ? "all" : filterSchoolId.toString()}
                  onValueChange={(value: string) => {
                    setFilterSchoolId(value === "all" ? "all" : parseInt(value, 10));
                    setPage(1); // Reset to first page when filter changes
                  }}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select school" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Schools</SelectItem>
                    {schools.map((school) => (
                      <SelectItem key={school.id} value={school.id.toString()}>
                        {school.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Label htmlFor="filter-target" className="whitespace-nowrap">Target Audience:</Label>
              <Select
                value={filterTarget}
                onValueChange={(value: string) => {
                  setFilterTarget(value);
                  setPage(1); // Reset to first page when filter changes
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select target" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Audiences</SelectItem>
                  <SelectItem value="students">Students</SelectItem>
                  <SelectItem value="parents">Parents</SelectItem>
                  <SelectItem value="teachers">Teachers</SelectItem>
                  <SelectItem value="administrators">Administrators</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="include-archived"
                checked={includeArchived}
                onChange={(e) => {
                  setIncludeArchived(e.target.checked);
                  setPage(1); // Reset to first page when filter changes
                }}
                className="rounded border-gray-300"
              />
              <Label htmlFor="include-archived" className="cursor-pointer">
                Include Archived
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <FiLoader className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={filteredAnnouncements}
              searchKey="title"
              searchPlaceholder="Search announcements..."
              manualPagination={true}
              pageCount={data?.meta?.totalPages || 0}
              totalRows={data?.meta?.total || 0}
              externalPageIndex={page - 1}
              externalPageSize={limit}
              externalSearchValue={search}
              onPaginationChange={handlePaginationChange}
              onSearchChange={handleSearchChange}
              exportFileName="announcements"
              exportTitle="Announcements List"
              enableExport={true}
            />
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingAnnouncement ? "Edit Announcement" : "Create Announcement"}
            </DialogTitle>
            <DialogDescription>
              {editingAnnouncement
                ? "Update the announcement details"
                : "Create a new announcement for your school community"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="content">Content *</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) =>
                    setFormData({ ...formData, content: e.target.value })
                  }
                  required
                  rows={6}
                  className="mt-1"
                />
              </div>

              {isSuperAdmin && (
                <div>
                  <Label htmlFor="schoolId">School *</Label>
                  <Select
                    value={formData.schoolId?.toString() || ""}
                    onValueChange={(value: string) =>
                      setFormData({ ...formData, schoolId: value ? parseInt(value, 10) : "" })
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select a school" />
                    </SelectTrigger>
                    <SelectContent>
                      {schools.map((school) => (
                        <SelectItem key={school.id} value={school.id.toString()}>
                          {school.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value: any) =>
                      setFormData({ ...formData, priority: value })
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="target">Target Audience</Label>
                  <Select
                    value={formData.target}
                    onValueChange={(value: any) =>
                      setFormData({ ...formData, target: value })
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="students">Students</SelectItem>
                      <SelectItem value="parents">Parents</SelectItem>
                      <SelectItem value="teachers">Teachers</SelectItem>
                      <SelectItem value="administrators">Administrators</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="publishAt">Publish At</Label>
                  <Input
                    id="publishAt"
                    type="datetime-local"
                    value={formData.publishAt}
                    onChange={(e) =>
                      setFormData({ ...formData, publishAt: e.target.value })
                    }
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="expiresAt">Expires At</Label>
                  <Input
                    id="expiresAt"
                    type="datetime-local"
                    value={formData.expiresAt}
                    onChange={(e) =>
                      setFormData({ ...formData, expiresAt: e.target.value })
                    }
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="sendEmail"
                    checked={formData.sendEmail}
                    onChange={(e) =>
                      setFormData({ ...formData, sendEmail: e.target.checked })
                    }
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="sendEmail">Send Email</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="sendSMS"
                    checked={formData.sendSMS}
                    onChange={(e) =>
                      setFormData({ ...formData, sendSMS: e.target.checked })
                    }
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="sendSMS">Send SMS</Label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setDialogOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {editingAnnouncement ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

