import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { invoicesService, FeeInvoice, GenerateInvoiceFromFeeStructuresData } from '../services/invoices.service';
import { studentsService } from '../services/students.service';
import { academicYearsService } from '../services/academicYears.service';
import { useSchool } from '../contexts/SchoolContext';
import { FiPlus, FiSearch, FiEye, FiEdit, FiTrash2, FiFileText, FiRefreshCw } from 'react-icons/fi';
import { Label } from '@/components/ui/label';
import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DataTable } from '@/components/DataTable';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { format } from 'date-fns';
import { getErrorMessage } from '@/utils/errorHandling';

const invoiceStatusColors: Record<string, string> = {
  draft: 'bg-gray-500',
  issued: 'bg-blue-500',
  partially_paid: 'bg-yellow-500',
  paid: 'bg-green-500',
  overdue: 'bg-red-500',
  cancelled: 'bg-gray-400',
};

export default function Invoices() {
  const { selectedSchoolId } = useSchool();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedInvoice, setSelectedInvoice] = useState<FeeInvoice | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [generateForm, setGenerateForm] = useState<GenerateInvoiceFromFeeStructuresData>({
    studentId: 0,
    academicYearId: 0,
    type: 'monthly',
    periodMonth: new Date().getMonth() + 1,
    periodYear: new Date().getFullYear(),
  });
  const [studentSearch, setStudentSearch] = useState('');
  const [students, setStudents] = useState<any[]>([]);

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['invoices', selectedSchoolId, statusFilter],
    queryFn: () => invoicesService.getAll({ schoolId: selectedSchoolId as number }),
    enabled: !!selectedSchoolId,
  });

  const { data: academicYears = [] } = useQuery({
    queryKey: ['academicYears', selectedSchoolId],
    queryFn: () => academicYearsService.getAll(selectedSchoolId as number),
    enabled: !!selectedSchoolId,
  });

  const { data: currentAcademicYear } = useQuery({
    queryKey: ['currentAcademicYear', selectedSchoolId],
    queryFn: () => academicYearsService.getCurrent(selectedSchoolId as number),
    enabled: !!selectedSchoolId,
  });

  useEffect(() => {
    if (currentAcademicYear && !generateForm.academicYearId) {
      setGenerateForm((prev) => ({ ...prev, academicYearId: currentAcademicYear.id }));
    }
  }, [currentAcademicYear]);

  useEffect(() => {
    if (studentSearch.length >= 2 && selectedSchoolId) {
      studentsService
        .search(selectedSchoolId as number, studentSearch)
        .then((results) => setStudents(results))
        .catch(() => setStudents([]));
    } else {
      setStudents([]);
    }
  }, [studentSearch, selectedSchoolId]);

  const generateMutation = useMutation({
    mutationFn: (data: GenerateInvoiceFromFeeStructuresData) =>
      invoicesService.generateFromFeeStructures(data, selectedSchoolId as number),
    onSuccess: (invoice) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      setShowGenerateDialog(false);
      navigate(`/invoices/${invoice.id}`);
    },
    onError: (error) => {
      alert(`Error generating invoice: ${getErrorMessage(error)}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => invoicesService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      setShowDeleteDialog(false);
      setSelectedInvoice(null);
    },
  });

  const filteredInvoices = invoices.filter((invoice) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      invoice.invoiceNumber.toLowerCase().includes(searchLower) ||
      invoice.student?.firstName?.toLowerCase().includes(searchLower) ||
      invoice.student?.lastName?.toLowerCase().includes(searchLower) ||
      invoice.student?.studentId?.toLowerCase().includes(searchLower)
    );
  });

  const columns: ColumnDef<FeeInvoice>[] = [
    {
      accessorKey: 'invoiceNumber',
      header: 'Invoice #',
      cell: ({ row }) => (
        <span className="font-medium">{row.original.invoiceNumber}</span>
      ),
    },
    {
      accessorKey: 'student',
      header: 'Student',
      cell: ({ row }) => {
        const student = row.original.student;
        return student
          ? `${student.firstName} ${student.lastName} (${student.studentId})`
          : 'N/A';
      },
    },
    {
      accessorKey: 'issueDate',
      header: 'Issue Date',
      cell: ({ row }) => format(new Date(row.original.issueDate), 'MMM dd, yyyy'),
    },
    {
      accessorKey: 'dueDate',
      header: 'Due Date',
      cell: ({ row }) => format(new Date(row.original.dueDate), 'MMM dd, yyyy'),
    },
    {
      accessorKey: 'totalAmount',
      header: 'Total Amount',
      cell: ({ row }) => `₹${row.original.totalAmount.toLocaleString()}`,
    },
    {
      accessorKey: 'paidAmount',
      header: 'Paid',
      cell: ({ row }) => `₹${row.original.paidAmount.toLocaleString()}`,
    },
    {
      accessorKey: 'balanceAmount',
      header: 'Balance',
      cell: ({ row }) => `₹${row.original.balanceAmount.toLocaleString()}`,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.status;
        return (
          <Badge className={invoiceStatusColors[status] || 'bg-gray-500'}>
            {status.replace('_', ' ').toUpperCase()}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'type',
      header: 'Type / Period',
      cell: ({ row }) => {
        const invoice = row.original;
        let periodInfo = '';
        if (invoice.type === 'monthly' && invoice.periodMonth && invoice.periodYear) {
          const monthName = new Date(2024, invoice.periodMonth - 1).toLocaleString('default', { month: 'long' });
          periodInfo = ` (${monthName} ${invoice.periodYear})`;
        } else if (invoice.type === 'quarterly' && invoice.periodQuarter && invoice.periodYear) {
          periodInfo = ` (Q${invoice.periodQuarter} ${invoice.periodYear})`;
        } else if (invoice.type === 'yearly' && invoice.periodYear) {
          periodInfo = ` (${invoice.periodYear})`;
        }
        return (
          <span className="text-sm">
            <Badge variant="outline">{invoice.type.toUpperCase()}</Badge>
            {periodInfo && <span className="ml-2 text-gray-600">{periodInfo}</span>}
          </span>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/invoices/${row.original.id}`)}
          >
            <FiEye className="h-4 w-4" />
          </Button>
          {row.original.status === 'draft' && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(`/invoices/${row.original.id}/edit`)}
              >
                <FiEdit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedInvoice(row.original);
                  setShowDeleteDialog(true);
                }}
              >
                <FiTrash2 className="h-4 w-4 text-red-500" />
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Fee Invoices</h1>
            <p className="text-gray-600 mt-1">Manage student fee invoices</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowGenerateDialog(true)}>
              <FiRefreshCw className="h-4 w-4 mr-2" />
              Generate from Fee Structures
            </Button>
            <Button onClick={() => navigate('/invoices/new')}>
              <FiPlus className="h-4 w-4 mr-2" />
              Create Invoice
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-4">
              <div className="flex-1">
                <Input
                  placeholder="Search by invoice number, student name or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-md"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="issued">Issued</SelectItem>
                  <SelectItem value="partially_paid">Partially Paid</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isLoading ? (
              <div className="text-center py-8">Loading...</div>
            ) : (
              <DataTable columns={columns} data={filteredInvoices} />
            )}
          </CardContent>
        </Card>

        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Invoice</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete invoice {selectedInvoice?.invoiceNumber}? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => selectedInvoice && deleteMutation.mutate(selectedInvoice.id)}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Generate Invoice from Fee Structures</DialogTitle>
              <DialogDescription>
                Generate an invoice automatically from fee structures assigned to the student's class.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Search Student *</Label>
                <Input
                  placeholder="Search by student ID or name..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                />
                {students.length > 0 && (
                  <div className="mt-2 border rounded-md max-h-48 overflow-y-auto">
                    {students.map((student) => (
                      <div
                        key={student.id}
                        className="p-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => {
                          setGenerateForm({ ...generateForm, studentId: student.id });
                          setStudentSearch(`${student.firstName} ${student.lastName} (${student.studentId})`);
                          setStudents([]);
                        }}
                      >
                        {student.firstName} {student.lastName} ({student.studentId})
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Academic Year *</Label>
                  <Select
                    value={generateForm.academicYearId.toString()}
                    onValueChange={(value) =>
                      setGenerateForm({ ...generateForm, academicYearId: parseInt(value) })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select academic year" />
                    </SelectTrigger>
                    <SelectContent>
                      {academicYears.map((year: any) => (
                        <SelectItem key={year.id} value={year.id.toString()}>
                          {year.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Invoice Type *</Label>
                  <Select
                    value={generateForm.type}
                    onValueChange={(value: any) => {
                      setGenerateForm({
                        ...generateForm,
                        type: value,
                        periodMonth: value === 'monthly' ? new Date().getMonth() + 1 : undefined,
                        periodQuarter: value === 'quarterly' ? Math.ceil((new Date().getMonth() + 1) / 3) : undefined,
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {generateForm.type === 'monthly' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Month *</Label>
                    <Select
                      value={generateForm.periodMonth?.toString()}
                      onValueChange={(value) =>
                        setGenerateForm({ ...generateForm, periodMonth: parseInt(value) })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                          <SelectItem key={month} value={month.toString()}>
                            {new Date(2024, month - 1).toLocaleString('default', { month: 'long' })}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Year *</Label>
                    <Input
                      type="number"
                      value={generateForm.periodYear}
                      onChange={(e) =>
                        setGenerateForm({ ...generateForm, periodYear: parseInt(e.target.value) })
                      }
                    />
                  </div>
                </div>
              )}

              {generateForm.type === 'quarterly' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Quarter *</Label>
                    <Select
                      value={generateForm.periodQuarter?.toString()}
                      onValueChange={(value) =>
                        setGenerateForm({ ...generateForm, periodQuarter: parseInt(value) })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Q1 (Jan-Mar)</SelectItem>
                        <SelectItem value="2">Q2 (Apr-Jun)</SelectItem>
                        <SelectItem value="3">Q3 (Jul-Sep)</SelectItem>
                        <SelectItem value="4">Q4 (Oct-Dec)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Year *</Label>
                    <Input
                      type="number"
                      value={generateForm.periodYear}
                      onChange={(e) =>
                        setGenerateForm({ ...generateForm, periodYear: parseInt(e.target.value) })
                      }
                    />
                  </div>
                </div>
              )}

              {generateForm.type === 'yearly' && (
                <div>
                  <Label>Year *</Label>
                  <Input
                    type="number"
                    value={generateForm.periodYear}
                    onChange={(e) =>
                      setGenerateForm({ ...generateForm, periodYear: parseInt(e.target.value) })
                    }
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowGenerateDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (!generateForm.studentId || !generateForm.academicYearId) {
                    alert('Please select student and academic year');
                    return;
                  }
                  if (generateForm.type === 'monthly' && !generateForm.periodMonth) {
                    alert('Please select month');
                    return;
                  }
                  if (generateForm.type === 'quarterly' && !generateForm.periodQuarter) {
                    alert('Please select quarter');
                    return;
                  }
                  generateMutation.mutate(generateForm);
                }}
                disabled={generateMutation.isPending}
              >
                {generateMutation.isPending ? 'Generating...' : 'Generate Invoice'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}

