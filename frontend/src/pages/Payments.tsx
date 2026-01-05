import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout';
import { paymentsService } from '../services/payments.service';
import { studentsService } from '../services/students.service';
import { studentFeeStructuresService, StudentFeeStructure } from '../services/studentFeeStructures.service';
import { academicYearsService } from '../services/academicYears.service';
import { Payment, Student } from '../types';
import { FiPlus, FiDollarSign, FiUser, FiSearch, FiLoader, FiCheckCircle, FiXCircle, FiClock } from 'react-icons/fi';
import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { useSchool } from '../contexts/SchoolContext';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { extractArrayData, extractApiData } from '@/utils/apiHelpers';
import { getErrorMessage } from '@/utils/errorHandling';
import { format } from 'date-fns';

export default function Payments() {
  const { selectedSchoolId } = useSchool();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [studentSearchId, setStudentSearchId] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentFees, setStudentFees] = useState<StudentFeeStructure[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loadingStudent, setLoadingStudent] = useState(false);
  const [loadingFees, setLoadingFees] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedFee, setSelectedFee] = useState<StudentFeeStructure | null>(null);
  const [academicYearId, setAcademicYearId] = useState<number | null>(null);
  const [academicYears, setAcademicYears] = useState<any[]>([]);

  // Payment form data
  const [paymentFormData, setPaymentFormData] = useState({
    amount: '',
    paymentMethod: 'cash' as 'cash' | 'bank_transfer' | 'card' | 'online' | 'cheque',
    paymentDate: new Date().toISOString().split('T')[0],
    transactionId: '',
    notes: '',
  });

  // Load academic years
  useEffect(() => {
    if (selectedSchoolId) {
      academicYearsService.getAll(selectedSchoolId as number).then((years) => {
        setAcademicYears(years);
        
        // Check if academicYearId is provided in URL params
        const urlAcademicYearId = searchParams.get('academicYearId');
        if (urlAcademicYearId) {
          const yearId = parseInt(urlAcademicYearId, 10);
          if (!isNaN(yearId) && years.some((y: any) => y.id === yearId)) {
            setAcademicYearId(yearId);
          }
        } else {
          const currentYear = years.find((y: any) => y.isCurrent);
          if (currentYear) {
            setAcademicYearId(currentYear.id);
          } else if (years.length > 0) {
            setAcademicYearId(years[0].id);
          }
        }
      });
    }
  }, [selectedSchoolId, searchParams]);

  // Auto-search student if studentId is provided in URL params
  useEffect(() => {
    const urlStudentId = searchParams.get('studentId');
    if (urlStudentId && selectedSchoolId && academicYearId && !selectedStudent) {
      setStudentSearchId(urlStudentId);
      // Auto-trigger search after a short delay to ensure academicYearId is set
      const timer = setTimeout(() => {
        handleSearchStudentFromUrl(urlStudentId);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [selectedSchoolId, academicYearId, searchParams]);

  // Search student from URL params
  const handleSearchStudentFromUrl = async (studentId: string) => {
    if (!studentId.trim() || !selectedSchoolId || !academicYearId) {
      return;
    }

    setLoadingStudent(true);
    setError('');
    setSelectedStudent(null);
    setStudentFees([]);
    setPayments([]);

    try {
      // Search student
      const response = await api.instance.get('/students', {
        params: { schoolId: selectedSchoolId, studentId: studentId.trim() },
      });

      const students = extractArrayData<any>(response);
      const student = students.find((s: any) => s.studentId === studentId.trim());

      if (!student) {
        setError(`Student with ID "${studentId.trim()}" not found`);
        // Clear URL params if student not found
        setSearchParams({});
        return;
      }

      setSelectedStudent(student);
      setStudentSearchId(studentId.trim());

      // Load student fees for the academic year
      await loadStudentFees(student.id, academicYearId);
    } catch (err: any) {
      console.error('Error searching student:', err);
      setError(getErrorMessage(err, 'Failed to search student'));
      // Clear URL params on error
      setSearchParams({});
    } finally {
      setLoadingStudent(false);
    }
  };

  // Clear success message
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Search student
  const handleSearchStudent = async () => {
    if (!studentSearchId.trim() || !selectedSchoolId || !academicYearId) {
      setError('Please enter a student ID and ensure school and academic year are selected');
      return;
    }

    setLoadingStudent(true);
    setError('');
    setSelectedStudent(null);
    setStudentFees([]);
    setPayments([]);

    try {
      // Search student
      const response = await api.instance.get('/students', {
        params: { schoolId: selectedSchoolId, studentId: studentSearchId.trim() },
      });

      const students = extractArrayData<any>(response);
      const student = students.find((s: any) => s.studentId === studentSearchId.trim());

      if (!student) {
        setError(`Student with ID "${studentSearchId.trim()}" not found`);
        return;
      }

      setSelectedStudent(student);

      // Load student fees for the academic year
      await loadStudentFees(student.id, academicYearId);
    } catch (err: any) {
      console.error('Error searching student:', err);
      setError(getErrorMessage(err, 'Failed to search student'));
    } finally {
      setLoadingStudent(false);
    }
  };

  // Load student fees
  const loadStudentFees = async (studentId: number, yearId: number) => {
    setLoadingFees(true);
    try {
      const fees = await studentFeeStructuresService.getAll(studentId, yearId, selectedSchoolId as number);
      setStudentFees(fees);

      // Load payments for this student
      const paymentsData = await paymentsService.getAll(studentId);
      setPayments(paymentsData);
    } catch (err: any) {
      console.error('Error loading student fees:', err);
      setError(getErrorMessage(err, 'Failed to load student fees'));
    } finally {
      setLoadingFees(false);
    }
  };

  // Calculate paid amount for a fee
  const getPaidAmount = (feeId: number): number => {
    return payments
      .filter((p) => p.studentFeeStructureId === feeId && p.status === 'completed')
      .reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0);
  };

  // Calculate remaining balance
  const getRemainingBalance = (fee: StudentFeeStructure): number => {
    const totalAmount = parseFloat(fee.amount.toString());
    const paidAmount = getPaidAmount(fee.id);
    return totalAmount - paidAmount;
  };

  // Open payment dialog
  const handlePayFee = (fee: StudentFeeStructure) => {
    setSelectedFee(fee);
    const remainingBalance = getRemainingBalance(fee);
    setPaymentFormData({
      amount: remainingBalance.toString(),
      paymentMethod: 'cash',
      paymentDate: new Date().toISOString().split('T')[0],
      transactionId: '',
      notes: '',
    });
    setShowPaymentDialog(true);
  };

  // Record payment
  const handleRecordPayment = async () => {
    if (!selectedStudent || !selectedFee) return;

    const amount = parseFloat(paymentFormData.amount);
    const remainingBalance = getRemainingBalance(selectedFee);

    if (amount <= 0) {
      setError('Payment amount must be greater than 0');
      return;
    }

    if (amount > remainingBalance) {
      setError(`Payment amount (₹${amount}) exceeds remaining balance (₹${remainingBalance.toFixed(2)})`);
      return;
    }

    try {
      setError('');
      await paymentsService.create({
        studentId: selectedStudent.id,
        studentFeeStructureId: selectedFee.id,
        amount: amount,
        paymentMethod: paymentFormData.paymentMethod,
        paymentDate: paymentFormData.paymentDate,
        transactionId: paymentFormData.transactionId || undefined,
        notes: paymentFormData.notes || undefined,
        schoolId: selectedSchoolId ? Number(selectedSchoolId) : undefined,
      });

      setSuccess('Payment recorded successfully');
      setShowPaymentDialog(false);
      setSelectedFee(null);

      // Reload fees and payments
      if (selectedStudent && academicYearId) {
        await loadStudentFees(selectedStudent.id, academicYearId);
      }
    } catch (err: any) {
      console.error('Error recording payment:', err);
      setError(getErrorMessage(err, 'Failed to record payment'));
    }
  };

  // Student fees columns
  const studentFeesColumns: ColumnDef<StudentFeeStructure>[] = useMemo(
    () => [
      {
        accessorKey: 'feeStructure',
        header: 'Fee Name',
        cell: ({ row }) => {
          const fee = row.original;
          return (
            <div>
              <div className="font-semibold">{fee.feeStructure?.name || 'Unknown Fee'}</div>
              {fee.installmentNumber && (
                <div className="text-xs text-gray-500">
                  Installment {fee.installmentNumber} of {fee.installmentCount}
                </div>
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
              Total Amount
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          );
        },
        cell: ({ row }) => {
          const amount = parseFloat(row.getValue('amount') as string);
          return <span className="font-semibold">₹{amount.toLocaleString()}</span>;
        },
      },
      {
        id: 'paidAmount',
        header: 'Paid',
        cell: ({ row }) => {
          const fee = row.original;
          const paid = getPaidAmount(fee.id);
          return (
            <span className={paid > 0 ? 'text-green-600 font-semibold' : 'text-gray-400'}>
              ₹{paid.toLocaleString()}
            </span>
          );
        },
      },
      {
        id: 'balance',
        header: 'Balance',
        cell: ({ row }) => {
          const fee = row.original;
          const balance = getRemainingBalance(fee);
          return (
            <span className={balance > 0 ? 'text-red-600 font-semibold' : 'text-green-600 font-semibold'}>
              ₹{balance.toLocaleString()}
            </span>
          );
        },
      },
      {
        accessorKey: 'dueDate',
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="h-8 px-2 lg:px-3"
            >
              Due Date
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          );
        },
        cell: ({ row }) => {
          const date = row.getValue('dueDate') as string;
          return <span>{format(new Date(date), 'MMM dd, yyyy')}</span>;
        },
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const status = row.getValue('status') as string;
          const statusConfig = {
            pending: { icon: FiClock, color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
            paid: { icon: FiCheckCircle, color: 'bg-green-100 text-green-800', label: 'Paid' },
            overdue: { icon: FiXCircle, color: 'bg-red-100 text-red-800', label: 'Overdue' },
          };
          const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
          const Icon = config.icon;
          return (
            <Badge className={config.color}>
              <Icon className="w-3 h-3 mr-1" />
              {config.label}
            </Badge>
          );
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const fee = row.original;
          const balance = getRemainingBalance(fee);
          if (balance <= 0) {
            return (
              <Button variant="ghost" size="sm" disabled>
                Paid
              </Button>
            );
          }
          return (
            <Button variant="default" size="sm" onClick={() => handlePayFee(fee)}>
              <FiDollarSign className="w-4 h-4 mr-1" />
              Pay
            </Button>
          );
        },
      },
    ],
    [payments],
  );

  // Payment history columns
  const paymentHistoryColumns: ColumnDef<Payment>[] = useMemo(
    () => [
      {
        accessorKey: 'receiptNumber',
        header: 'Receipt Number',
        cell: ({ row }) => {
          const receipt = row.getValue('receiptNumber') as string;
          return receipt ? <span className="font-mono text-sm">{receipt}</span> : <span className="text-gray-400">-</span>;
        },
      },
      {
        accessorKey: 'amount',
        header: 'Amount',
        cell: ({ row }) => {
          const amount = parseFloat(row.getValue('amount') as string);
          return <span className="font-semibold">₹{amount.toLocaleString()}</span>;
        },
      },
      {
        accessorKey: 'paymentMethod',
        header: 'Method',
        cell: ({ row }) => {
          const method = row.getValue('paymentMethod') as string;
          return <span className="capitalize">{method.replace('_', ' ')}</span>;
        },
      },
      {
        accessorKey: 'paymentDate',
        header: 'Date',
        cell: ({ row }) => {
          const date = row.getValue('paymentDate') as string;
          return <span>{format(new Date(date), 'MMM dd, yyyy')}</span>;
        },
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const status = row.getValue('status') as string;
          const statusConfig = {
            completed: { color: 'bg-green-100 text-green-800', label: 'Completed' },
            pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
            failed: { color: 'bg-red-100 text-red-800', label: 'Failed' },
            refunded: { color: 'bg-gray-100 text-gray-800', label: 'Refunded' },
          };
          const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
          return <Badge className={config.color}>{config.label}</Badge>;
        },
      },
    ],
    [],
  );

  return (
    <Layout>
      <div className="space-y-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>Payments</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Fee Payments</h1>
            <p className="text-gray-500 mt-1">Record payments for student fees</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
            {success}
          </div>
        )}

        {/* Student Search */}
        <Card>
          <CardHeader>
            <CardTitle>Search Student</CardTitle>
            <CardDescription>Enter student ID to view their fees and record payments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="academicYear">Academic Year</Label>
                <Select
                  value={academicYearId?.toString() || ''}
                  onValueChange={(value) => setAcademicYearId(parseInt(value))}
                >
                  <SelectTrigger id="academicYear">
                    <SelectValue placeholder="Select academic year" />
                  </SelectTrigger>
                  <SelectContent>
                    {academicYears.map((year) => (
                      <SelectItem key={year.id} value={year.id.toString()}>
                        {year.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <Label htmlFor="studentSearch">Student ID</Label>
                <div className="flex gap-2">
                  <Input
                    id="studentSearch"
                    placeholder="Enter student ID"
                    value={studentSearchId}
                    onChange={(e) => setStudentSearchId(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearchStudent()}
                  />
                  <Button onClick={handleSearchStudent} disabled={loadingStudent}>
                    {loadingStudent ? (
                      <FiLoader className="w-4 h-4 animate-spin" />
                    ) : (
                      <FiSearch className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Student Fees */}
        {selectedStudent && (
          <Card>
            <CardHeader>
              <CardTitle>
                Fees for {selectedStudent.firstName} {selectedStudent.lastName} ({selectedStudent.studentId})
              </CardTitle>
              <CardDescription>
                Academic Year: {academicYears.find((y) => y.id === academicYearId)?.name || 'N/A'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingFees ? (
                <div className="flex items-center justify-center p-8">
                  <FiLoader className="w-6 h-6 animate-spin mr-2" />
                  <span>Loading fees...</span>
                </div>
              ) : studentFees.length === 0 ? (
                <div className="text-center p-8 text-gray-500">
                  No fees found for this student in the selected academic year.
                </div>
              ) : (
                <>
                  <DataTable columns={studentFeesColumns} data={studentFees} />
                  
                  {/* Summary */}
                  <div className="mt-6 grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <Label className="text-xs text-gray-500">Total Fees</Label>
                      <p className="text-2xl font-bold">
                        ₹{studentFees.reduce((sum, f) => sum + parseFloat(f.amount.toString()), 0).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Total Paid</Label>
                      <p className="text-2xl font-bold text-green-600">
                        ₹{studentFees.reduce((sum, f) => sum + getPaidAmount(f.id), 0).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Total Balance</Label>
                      <p className="text-2xl font-bold text-red-600">
                        ₹{studentFees.reduce((sum, f) => sum + getRemainingBalance(f), 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Payment History */}
        {selectedStudent && payments.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>All payments recorded for this student</CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable columns={paymentHistoryColumns} data={payments} />
            </CardContent>
          </Card>
        )}

        {/* Payment Dialog */}
        <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Record Payment</DialogTitle>
              <DialogDescription>
                {selectedFee && (
                  <>
                    Fee: {selectedFee.feeStructure?.name || 'Unknown'}
                    <br />
                    Total: ₹{parseFloat(selectedFee.amount.toString()).toLocaleString()}
                    <br />
                    Already Paid: ₹{getPaidAmount(selectedFee.id).toLocaleString()}
                    <br />
                    Remaining Balance: ₹{getRemainingBalance(selectedFee).toLocaleString()}
                  </>
                )}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="paymentAmount">Payment Amount *</Label>
                <Input
                  id="paymentAmount"
                  type="number"
                  value={paymentFormData.amount}
                  onChange={(e) => setPaymentFormData({ ...paymentFormData, amount: e.target.value })}
                  placeholder="Enter amount"
                  max={selectedFee ? getRemainingBalance(selectedFee).toString() : undefined}
                />
                {selectedFee && (
                  <p className="text-xs text-gray-500 mt-1">
                    Maximum: ₹{getRemainingBalance(selectedFee).toLocaleString()}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="paymentMethod">Payment Method *</Label>
                <Select
                  value={paymentFormData.paymentMethod}
                  onValueChange={(value: any) =>
                    setPaymentFormData({ ...paymentFormData, paymentMethod: value })
                  }
                >
                  <SelectTrigger id="paymentMethod">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="paymentDate">Payment Date *</Label>
                <Input
                  id="paymentDate"
                  type="date"
                  value={paymentFormData.paymentDate}
                  onChange={(e) => setPaymentFormData({ ...paymentFormData, paymentDate: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="transactionId">Transaction ID (Optional)</Label>
                <Input
                  id="transactionId"
                  value={paymentFormData.transactionId}
                  onChange={(e) => setPaymentFormData({ ...paymentFormData, transactionId: e.target.value })}
                  placeholder="For online/bank payments"
                />
              </div>

              <div>
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={paymentFormData.notes}
                  onChange={(e) => setPaymentFormData({ ...paymentFormData, notes: e.target.value })}
                  placeholder="Additional notes"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleRecordPayment}>Record Payment</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
