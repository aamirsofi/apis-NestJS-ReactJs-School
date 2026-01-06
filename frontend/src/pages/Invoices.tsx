import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { invoicesService } from "../services/invoices.service";
import { useSchool } from "../contexts/SchoolContext";
import {
  FiSearch,
  FiEye,
  FiFileText,
  FiInfo,
  FiDollarSign,
  FiTrendingUp,
  FiClock,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable } from "@/components/DataTable";
import { format } from "date-fns";

const invoiceStatusColors: Record<string, string> = {
  draft: "bg-gray-500 hover:bg-gray-600",
  issued: "bg-blue-500 hover:bg-blue-600",
  partially_paid: "bg-yellow-500 hover:bg-yellow-600",
  paid: "bg-green-500 hover:bg-green-600",
  overdue: "bg-red-500 hover:bg-red-600",
  cancelled: "bg-gray-400 hover:bg-gray-500",
};

export default function Invoices() {
  const { selectedSchoolId } = useSchool();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ["invoices", selectedSchoolId],
    queryFn: () =>
      invoicesService.getAll({ schoolId: selectedSchoolId as number }),
    enabled: !!selectedSchoolId,
  });

  // Calculate statistics
  const stats = useMemo(() => {
    const totalInvoices = invoices.length;
    const totalAmount = invoices.reduce(
      (sum: number, inv: any) => sum + Number(inv.totalAmount),
      0
    );
    const totalPaid = invoices.reduce(
      (sum: number, inv: any) => sum + Number(inv.paidAmount),
      0
    );
    const totalPending = invoices.reduce(
      (sum: number, inv: any) => sum + Number(inv.balanceAmount),
      0
    );
    const paidCount = invoices.filter(
      (inv: any) => inv.status === "paid"
    ).length;
    const overdueCount = invoices.filter(
      (inv: any) => inv.status === "overdue"
    ).length;

    return {
      totalInvoices,
      totalAmount,
      totalPaid,
      totalPending,
      paidCount,
      overdueCount,
    };
  }, [invoices]);

  // Filter invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice: any) => {
      // Status filter
      if (statusFilter !== "all" && invoice.status !== statusFilter) {
        return false;
      }

      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          invoice.invoiceNumber.toLowerCase().includes(searchLower) ||
          invoice.student?.firstName?.toLowerCase().includes(searchLower) ||
          invoice.student?.lastName?.toLowerCase().includes(searchLower) ||
          invoice.student?.studentId?.toLowerCase().includes(searchLower)
        );
      }

      return true;
    });
  }, [invoices, statusFilter, searchTerm]);

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "invoiceNumber",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="hover:bg-transparent"
          >
            Invoice #
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <span className="font-medium text-blue-600">
          {row.original.invoiceNumber}
        </span>
      ),
    },
    {
      accessorKey: "student",
      header: "Student",
      cell: ({ row }) => {
        const student = row.original.student;
        return student ? (
          <div>
            <div className="font-medium">{`${student.firstName} ${student.lastName}`}</div>
            <div className="text-sm text-gray-500">{student.studentId}</div>
          </div>
        ) : (
          <span className="text-gray-400">N/A</span>
        );
      },
    },
    {
      accessorKey: "issueDate",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="hover:bg-transparent"
          >
            Issue Date
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="text-sm">
          {format(new Date(row.original.issueDate), "MMM dd, yyyy")}
        </div>
      ),
    },
    {
      accessorKey: "dueDate",
      header: "Due Date",
      cell: ({ row }) => {
        const dueDate = new Date(row.original.dueDate);
        const isOverdue =
          dueDate < new Date() && row.original.status !== "paid";
        return (
          <div
            className={`text-sm ${isOverdue ? "text-red-600 font-medium" : ""}`}
          >
            {format(dueDate, "MMM dd, yyyy")}
          </div>
        );
      },
    },
    {
      accessorKey: "totalAmount",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="hover:bg-transparent"
          >
            Total
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <span className="font-medium">
          ₹{Number(row.original.totalAmount).toLocaleString()}
        </span>
      ),
    },
    {
      accessorKey: "paidAmount",
      header: "Paid",
      cell: ({ row }) => (
        <span className="text-green-600">
          ₹{Number(row.original.paidAmount).toLocaleString()}
        </span>
      ),
    },
    {
      accessorKey: "balanceAmount",
      header: "Balance",
      cell: ({ row }) => {
        const balance = Number(row.original.balanceAmount);
        return (
          <span
            className={
              balance > 0 ? "text-orange-600 font-medium" : "text-gray-400"
            }
          >
            ₹{balance.toLocaleString()}
          </span>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status;
        return (
          <Badge
            className={`${
              invoiceStatusColors[status] || "bg-gray-500"
            } text-white`}
          >
            {status.replace("_", " ").toUpperCase()}
          </Badge>
        );
      },
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => {
        const invoice = row.original;
        let periodInfo = "";
        if (
          invoice.type === "monthly" &&
          invoice.periodMonth &&
          invoice.periodYear
        ) {
          const monthName = new Date(
            2024,
            invoice.periodMonth - 1
          ).toLocaleString("default", { month: "short" });
          periodInfo = `${monthName} ${invoice.periodYear}`;
        } else if (
          invoice.type === "quarterly" &&
          invoice.periodQuarter &&
          invoice.periodYear
        ) {
          periodInfo = `Q${invoice.periodQuarter} ${invoice.periodYear}`;
        } else if (invoice.type === "yearly" && invoice.periodYear) {
          periodInfo = `${invoice.periodYear}`;
        }
        return (
          <div className="text-sm">
            <Badge variant="outline" className="mb-1">
              {invoice.type.toUpperCase()}
            </Badge>
            {periodInfo && (
              <div className="text-xs text-gray-600">{periodInfo}</div>
            )}
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/invoices/${row.original.id}`)}
            title="View Invoice"
          >
            <FiEye className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fee Invoices</h1>
          <p className="text-muted-foreground mt-2">
            View and manage all fee invoices across students
          </p>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
          <FiInfo className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-800">
            <strong>Note:</strong> Invoices are automatically created when
            recording payments in <strong>Fee Registry</strong>. This page
            provides a centralized view of all invoices for monitoring and
            reporting purposes.
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Invoices
              </CardTitle>
              <FiFileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalInvoices}</div>
              <p className="text-xs text-muted-foreground">
                {stats.paidCount} paid, {stats.overdueCount} overdue
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Amount
              </CardTitle>
              <FiDollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₹{stats.totalAmount.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                Across all invoices
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Collected
              </CardTitle>
              <FiTrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                ₹{stats.totalPaid.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.totalAmount > 0
                  ? ((stats.totalPaid / stats.totalAmount) * 100).toFixed(1)
                  : 0}
                % of total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Pending Balance
              </CardTitle>
              <FiClock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                ₹{stats.totalPending.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                Yet to be collected
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Invoices Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>All Invoices</CardTitle>
                <CardDescription className="mt-1">
                  Search, filter, and view invoice details
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search by invoice #, student name, or student ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="issued">Issued</SelectItem>
                  <SelectItem value="partially_paid">Partially Paid</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-4"></div>
                  <p className="text-muted-foreground">Loading invoices...</p>
                </div>
              </div>
            ) : filteredInvoices.length === 0 ? (
              <div className="text-center py-12">
                <FiFileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">
                  No invoices found
                </h3>
                <p className="text-gray-500">
                  {searchTerm || statusFilter !== "all"
                    ? "Try adjusting your search or filter"
                    : "Invoices will appear here when payments are recorded in Fee Registry"}
                </p>
              </div>
            ) : (
              <DataTable columns={columns} data={filteredInvoices} />
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
