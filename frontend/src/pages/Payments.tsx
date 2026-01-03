import { useState, useEffect, useMemo, useCallback } from 'react';
import Layout from '../components/Layout';
import { paymentsService } from '../services/payments.service';
import { studentsService } from '../services/students.service';
import { feeStructuresService } from '../services/feeStructures.service';
import { Payment, Student, FeeStructure } from '../types';
import { FiPlus, FiEdit2, FiTrash2, FiCreditCard, FiUser, FiDollarSign } from 'react-icons/fi';
import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DataTable } from '@/components/DataTable';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb';

export default function Payments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [formData, setFormData] = useState<Partial<Payment>>({
    studentId: 0,
    feeStructureId: 0,
    amount: 0,
    paymentMethod: 'cash',
    paymentDate: new Date().toISOString().split('T')[0],
    receiptNumber: '',
    status: 'completed',
    notes: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  // Clear success message after 5 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const loadData = async () => {
    try {
      setError('');
      const [paymentsData, studentsData, structuresData] = await Promise.all([
        paymentsService.getAll(),
        studentsService.getAll(),
        feeStructuresService.getAll(),
      ]);
      setPayments(paymentsData);
      setStudents(studentsData);
      setFeeStructures(structuresData);
    } catch (err: unknown) {
      const errorMessage = err && typeof err === 'object' && 'response' in err && err.response && typeof err.response === 'object' && 'data' in err.response && err.response.data && typeof err.response.data === 'object' && 'message' in err.response.data && typeof err.response.data.message === 'string'
        ? err.response.data.message
        : 'Failed to load data';
      setError(errorMessage);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError('');
      if (editingPayment) {
        await paymentsService.update(editingPayment.id, formData);
        setSuccess('Payment updated successfully');
      } else {
        await paymentsService.create(formData);
        setSuccess('Payment created successfully');
      }
      setShowDialog(false);
      setEditingPayment(null);
      resetForm();
      loadData();
    } catch (err: unknown) {
      const errorMessage = err && typeof err === 'object' && 'response' in err && err.response && typeof err.response === 'object' && 'data' in err.response && err.response.data && typeof err.response.data === 'object' && 'message' in err.response.data && typeof err.response.data.message === 'string'
        ? err.response.data.message
        : 'Failed to save payment';
      setError(errorMessage);
    }
  };

  const resetForm = () => {
    setFormData({
      studentId: 0,
      feeStructureId: 0,
      amount: 0,
      paymentMethod: 'cash',
      paymentDate: new Date().toISOString().split('T')[0],
      receiptNumber: '',
      status: 'completed',
      notes: '',
    });
  };

  const handleEdit = (payment: Payment) => {
    setEditingPayment(payment);
    setFormData({
      studentId: payment.studentId,
      feeStructureId: payment.feeStructureId,
      amount: payment.amount,
      paymentMethod: payment.paymentMethod,
      paymentDate: payment.paymentDate.split('T')[0],
      receiptNumber: payment.receiptNumber,
      status: payment.status,
      notes: payment.notes,
    });
    setShowDialog(true);
  };

  const handleDelete = useCallback(async (id: number) => {
    if (!confirm('Are you sure you want to delete this payment?')) return;
    try {
      await paymentsService.delete(id);
      setSuccess('Payment deleted successfully');
      loadData();
    } catch (err: unknown) {
      const errorMessage = err && typeof err === 'object' && 'response' in err && err.response && typeof err.response === 'object' && 'data' in err.response && err.response.data && typeof err.response.data === 'object' && 'message' in err.response.data && typeof err.response.data.message === 'string'
        ? err.response.data.message
        : 'Failed to delete payment';
      setError(errorMessage);
    }
  }, []);

  const getStudentName = useCallback((studentId: number) => {
    const student = students.find((s) => s.id === studentId);
    return student ? `${student.firstName} ${student.lastName}` : 'Unknown';
  }, [students]);

  const getFeeStructureName = useCallback((feeStructureId: number) => {
    const structure = feeStructures.find((f) => f.id === feeStructureId);
    return structure ? structure.name : 'Unknown';
  }, [feeStructures]);

  const columns: ColumnDef<Payment>[] = useMemo(
    () => [
      {
        id: 'paymentDetails',
        header: 'Payment Details',
        cell: ({ row }) => {
          const payment = row.original;
          return (
            <div>
              <div className="flex items-center text-sm font-semibold text-gray-900">
                <FiUser className="w-4 h-4 mr-2 text-indigo-500" />
                {getStudentName(payment.studentId)}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {getFeeStructureName(payment.feeStructureId)}
              </div>
              {payment.receiptNumber && (
                <div className="text-xs text-gray-400 mt-1">Receipt: {payment.receiptNumber}</div>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: 'amount',
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="h-8 px-2 lg:px-3"
            >
              Amount
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          );
        },
        cell: ({ row }) => {
          const amount = row.getValue('amount') as number;
          return (
            <div className="flex items-center text-sm font-semibold text-gray-900">
              <FiDollarSign className="w-4 h-4 mr-1 text-indigo-500" />
              ${amount.toLocaleString()}
            </div>
          );
        },
      },
      {
        accessorKey: 'paymentMethod',
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="h-8 px-2 lg:px-3"
            >
              Method
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          );
        },
        cell: ({ row }) => {
          const method = row.getValue('paymentMethod') as string;
          return <div className="text-sm text-gray-900 capitalize">{method.replace('_', ' ')}</div>;
        },
      },
      {
        accessorKey: 'paymentDate',
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="h-8 px-2 lg:px-3"
            >
              Date
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          );
        },
        cell: ({ row }) => {
          const date = row.getValue('paymentDate') as string;
          return <div className="text-sm text-gray-900">{new Date(date).toLocaleDateString()}</div>;
        },
      },
      {
        accessorKey: 'status',
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="h-8 px-2 lg:px-3"
            >
              Status
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          );
        },
        cell: ({ row }) => {
          const status = row.getValue('status') as string;
          return (
            <Badge
              variant={
                status === 'completed'
                  ? 'default'
                  : status === 'pending'
                  ? 'secondary'
                  : status === 'failed'
                  ? 'destructive'
                  : 'outline'
              }
              className={
                status === 'completed'
                  ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white border-0'
                  : status === 'pending'
                  ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-white border-0'
                  : status === 'failed'
                  ? 'bg-gradient-to-r from-red-400 to-rose-500 text-white border-0'
                  : ''
              }
            >
              {status}
            </Badge>
          );
        },
        filterConfig: {
          column: 'status',
          title: 'Status',
          options: [
            { label: 'Completed', value: 'completed' },
            { label: 'Pending', value: 'pending' },
            { label: 'Failed', value: 'failed' },
            { label: 'Refunded', value: 'refunded' },
          ],
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const payment = row.original;
          return (
            <div className="flex items-center justify-end space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEdit(payment)}
                className="text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50"
                title="Edit"
              >
                <FiEdit2 className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(payment.id)}
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
    [handleDelete, getStudentName, getFeeStructureName]
  );

  return (
    <Layout>
      <div className="space-y-6">
        {/* Breadcrumb */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>Dashboard</BreadcrumbPage>
            </BreadcrumbItem>
            <BreadcrumbItem>
              <BreadcrumbPage>Payments</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
                  Payments
                </CardTitle>
                <CardDescription className="mt-1">
                  Manage student payments and transactions
                </CardDescription>
              </div>
              <Button
                onClick={() => {
                  setEditingPayment(null);
                  resetForm();
                  setShowDialog(true);
                }}
                className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700"
              >
                <FiPlus className="w-5 h-5 mr-2" />
                Add Payment
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Success Alert */}
        {success && (
          <Card className="border-l-4 border-l-green-400 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
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
                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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
              data={payments}
              searchKey="receiptNumber"
              searchPlaceholder="Search payments by receipt number..."
              enableRowSelection={false}
              exportFileName="payments"
              exportTitle="Payments List"
              enableExport={true}
            />
          </CardContent>
        </Card>

        {/* Dialog */}
        <Dialog open={showDialog} onOpenChange={(open) => {
          setShowDialog(open);
          if (!open) {
            setEditingPayment(null);
            resetForm();
          }
        }}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{editingPayment ? 'Edit Payment' : 'Add Payment'}</DialogTitle>
              <DialogDescription>
                {editingPayment ? 'Update payment information' : 'Record a new payment'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Student *</label>
                <Select
                  value={formData.studentId?.toString() || '0'}
                  onValueChange={(value) => setFormData({ ...formData, studentId: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Student" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Select Student</SelectItem>
                    {students.map((student) => (
                      <SelectItem key={student.id} value={student.id.toString()}>
                        {student.firstName} {student.lastName} ({student.studentId})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Fee Structure *</label>
                <Select
                  value={formData.feeStructureId?.toString() || '0'}
                  onValueChange={(value) => setFormData({ ...formData, feeStructureId: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Fee Structure" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Select Fee Structure</SelectItem>
                    {feeStructures.map((structure) => (
                      <SelectItem key={structure.id} value={structure.id.toString()}>
                        {structure.name} (${structure.amount})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Amount *</label>
                <Input
                  type="number"
                  required
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Payment Method *</label>
                  <Select
                    value={formData.paymentMethod}
                    onValueChange={(value) => setFormData({ ...formData, paymentMethod: value as 'cash' | 'bank_transfer' | 'cheque' | 'online' })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="cheque">Cheque</SelectItem>
                      <SelectItem value="online">Online</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Payment Date *</label>
                  <Input
                    type="date"
                    required
                    value={formData.paymentDate}
                    onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Receipt Number</label>
                <Input
                  type="text"
                  value={formData.receiptNumber}
                  onChange={(e) => setFormData({ ...formData, receiptNumber: e.target.value })}
                  placeholder="REC-001"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value as 'completed' | 'pending' | 'failed' | 'refunded' })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="refunded">Refunded</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Notes</label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                  placeholder="Additional notes..."
                />
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowDialog(false);
                    setEditingPayment(null);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700"
                >
                  {editingPayment ? 'Update' : 'Create'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
