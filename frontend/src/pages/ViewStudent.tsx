import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout';
import { studentsService } from '../services/students.service';
import { studentAcademicRecordsService } from '../services/studentAcademicRecords.service';
import { paymentsService } from '../services/payments.service';
import { Student, StudentAcademicRecord, Payment } from '../types';
import {
  FiArrowLeft,
  FiEdit,
  FiUser,
  FiMail,
  FiPhone,
  FiMapPin,
  FiCalendar,
  FiDollarSign,
  FiBook,
  FiCreditCard,
  FiLoader,
  FiCopy,
  FiTrendingUp,
  FiCheckCircle,
  FiClock,
  FiAward,
  FiHome,
  FiBriefcase,
  FiShield,
} from 'react-icons/fi';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { DataTable } from '@/components/DataTable';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { Separator } from '@/components/ui/separator';

export default function ViewStudent() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [student, setStudent] = useState<Student | null>(null);
  const [academicRecords, setAcademicRecords] = useState<StudentAcademicRecord[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      loadStudentData();
    }
  }, [id]);

  const loadStudentData = async () => {
    try {
      setLoading(true);
      setError('');
      const studentId = parseInt(id!);
      
      const [studentData, recordsData, paymentsData] = await Promise.all([
        studentsService.getById(studentId),
        studentAcademicRecordsService.getAll(studentId),
        paymentsService.getAll().then(payments => 
          payments.filter(p => p.studentId === studentId)
        ),
      ]);

      setStudent(studentData);
      setAcademicRecords(recordsData);
      setPayments(paymentsData);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load student data');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    const schoolId = searchParams.get('schoolId');
    if (schoolId) {
      navigate(`/super-admin/students/${id}/edit?schoolId=${schoolId}`);
    } else {
      navigate(`/super-admin/students/${id}/edit`);
    }
  };

  const handleDuplicate = () => {
    const schoolId = searchParams.get('schoolId');
    if (schoolId) {
      navigate(`/super-admin/students/new?duplicate=${id}&schoolId=${schoolId}`);
    } else {
      navigate(`/super-admin/students/new?duplicate=${id}`);
    }
  };

  const getCurrentClass = (): string => {
    const currentRecord = academicRecords.find(r => r.academicYear?.isCurrent);
    if (currentRecord?.class) {
      return `${currentRecord.class.name}${currentRecord.section ? ` - ${currentRecord.section}` : ''}`;
    }
    return 'Not assigned';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const formatDate = (date: string | Date | null | undefined) => {
    if (!date) return 'N/A';
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return format(dateObj, 'dd MMM yyyy');
    } catch {
      return 'N/A';
    }
  };

  // Calculate stats
  const totalPayments = payments.length;
  const totalPaid = payments
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0);
  const pendingPayments = payments.filter(p => p.status !== 'completed').length;
  const lastPayment = payments.length > 0 
    ? payments.sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())[0]
    : null;

  // Payment columns
  const paymentColumns: ColumnDef<Payment>[] = [
    {
      accessorKey: 'paymentDate',
      header: 'Date',
      cell: ({ row }) => formatDate(row.original.paymentDate),
    },
    {
      accessorKey: 'feeStructure',
      header: 'Fee Structure',
      cell: ({ row }) => row.original.feeStructure?.name || 'N/A',
    },
    {
      accessorKey: 'amount',
      header: 'Amount',
      cell: ({ row }) => (
        <span className="font-semibold text-green-600">
          {formatCurrency(row.original.amount)}
        </span>
      ),
    },
    {
      accessorKey: 'paymentMethod',
      header: 'Method',
      cell: ({ row }) => (
        <Badge variant="outline" className="capitalize">
          {row.original.paymentMethod}
        </Badge>
      ),
    },
    {
      accessorKey: 'receiptNumber',
      header: 'Receipt',
      cell: ({ row }) => (
        <span className="font-mono text-sm">{row.original.receiptNumber || 'N/A'}</span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge
          variant={row.original.status === 'completed' ? 'default' : 'secondary'}
          className={
            row.original.status === 'completed'
              ? 'bg-green-100 text-green-800 hover:bg-green-100'
              : ''
          }
        >
          {row.original.status === 'completed' && (
            <FiCheckCircle className="w-3 h-3 mr-1" />
          )}
          {row.original.status}
        </Badge>
      ),
    },
  ];

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <FiLoader className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading student details...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !student) {
    return (
      <Layout>
        <div className="container mx-auto py-6 px-4">
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiUser className="w-8 h-8 text-destructive" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Student Not Found</h3>
                <p className="text-muted-foreground mb-4">{error || 'The student you are looking for does not exist.'}</p>
                <Button onClick={() => navigate('/super-admin/students')}>
                  <FiArrowLeft className="w-4 h-4 mr-2" />
                  Back to Students
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto py-6 px-4 space-y-6">
        {/* Breadcrumb */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/">Home</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/super-admin/students">Students</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>View Student</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 p-8 md:p-10 text-white shadow-2xl border border-white/10">
          {/* Animated Background Pattern */}
          <div className="absolute inset-0 opacity-30">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[length:40px_40px]"></div>
            <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.05)_25%,rgba(255,255,255,0.05)_50%,transparent_50%,transparent_75%,rgba(255,255,255,0.05)_75%)] bg-[length:20px_20px]"></div>
          </div>
          
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-white/10 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-white/10 to-transparent rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
          
          <div className="relative z-10">
            {/* Top Bar with Back Button */}
            <div className="flex items-center justify-between mb-8">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/super-admin/students')}
                className="text-white/80 hover:text-white hover:bg-white/10 backdrop-blur-sm rounded-xl"
              >
                <FiArrowLeft className="w-5 h-5" />
              </Button>
              <Badge
                variant={student.status === 'active' ? 'default' : 'secondary'}
                className={`${
                  student.status === 'active'
                    ? 'bg-green-500/90 hover:bg-green-500 text-white shadow-lg backdrop-blur-sm'
                    : 'bg-gray-500/90 hover:bg-gray-500 text-white shadow-lg backdrop-blur-sm'
                } text-sm px-4 py-1.5 rounded-full border border-white/20`}
              >
                {student.status === 'active' && <FiCheckCircle className="w-3 h-3 mr-1.5" />}
                {student.status}
              </Badge>
            </div>

            {/* Main Content */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-8">
              {/* Student Photo */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-500 rounded-3xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
                {student.photoUrl ? (
                  <div className="relative">
                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 rounded-3xl blur opacity-75 group-hover:opacity-100 transition-opacity"></div>
                    <img
                      src={
                        student.photoUrl.startsWith('http') 
                          ? student.photoUrl 
                          : student.photoUrl.startsWith('/uploads')
                          ? `/api${student.photoUrl}`  // Use /api prefix for proxied requests
                          : `/api/uploads/students/${student.photoUrl.split('/').pop() || student.photoUrl}`
                      }
                      alt={`${student.firstName} ${student.lastName}`}
                      className="relative w-36 h-36 md:w-40 md:h-40 rounded-3xl object-cover border-4 border-white/30 shadow-2xl ring-4 ring-white/20 transition-transform group-hover:scale-105"
                      onError={(e) => {
                        console.error('Failed to load image. Original URL:', student.photoUrl);
                        console.error('Attempted URL:', e.target.getAttribute('src'));
                        // Show placeholder instead of hiding
                        const img = e.target as HTMLImageElement;
                        img.style.display = 'none';
                        const placeholder = img.parentElement?.querySelector('.photo-placeholder') as HTMLElement;
                        if (placeholder) {
                          placeholder.style.display = 'flex';
                        }
                      }}
                    />
                    <div className="photo-placeholder hidden absolute inset-0 w-36 h-36 md:w-40 md:h-40 rounded-3xl bg-white/20 backdrop-blur-md border-4 border-white/30 shadow-2xl items-center justify-center">
                      <FiUser className="w-20 h-20 text-white/70" />
                    </div>
                    <div className="absolute -bottom-3 -right-3 w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full border-4 border-white shadow-xl flex items-center justify-center animate-pulse">
                      <FiCheckCircle className="w-6 h-6 text-white" />
                    </div>
                  </div>
                ) : (
                  <div className="relative w-36 h-36 md:w-40 md:h-40 rounded-3xl bg-white/20 backdrop-blur-md border-4 border-white/30 shadow-2xl flex items-center justify-center group-hover:bg-white/25 transition-colors">
                    <FiUser className="w-20 h-20 text-white/70" />
                  </div>
                )}
              </div>

              {/* Student Info */}
              <div className="flex-1 min-w-0">
                <div className="mb-6">
                  <h1 className="text-4xl md:text-5xl font-extrabold mb-3 bg-gradient-to-r from-white via-white to-white/80 bg-clip-text text-transparent drop-shadow-lg">
                    {student.firstName} {student.lastName}
                  </h1>
                  <div className="flex flex-wrap items-center gap-4 text-white/90">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
                      <FiUser className="w-4 h-4" />
                      <span className="text-sm font-medium">ID: {student.studentId}</span>
                    </div>
                    {student.admissionNumber && (
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
                        <FiAward className="w-4 h-4" />
                        <span className="text-sm font-medium">Admission: {student.admissionNumber}</span>
                      </div>
                    )}
                    {student.email && (
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
                        <FiMail className="w-4 h-4" />
                        <span className="text-sm font-medium truncate max-w-[200px]">{student.email}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="group bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 hover:bg-white/15 hover:border-white/30 transition-all cursor-pointer hover:scale-105 hover:shadow-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-blue-400/30 rounded-lg flex items-center justify-center">
                        <FiBook className="w-4 h-4 text-blue-200" />
                      </div>
                      <div className="text-white/70 text-xs font-medium uppercase tracking-wide">Current Class</div>
                    </div>
                    <div className="text-xl font-bold text-white">{getCurrentClass()}</div>
                  </div>
                  <div className="group bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 hover:bg-white/15 hover:border-white/30 transition-all cursor-pointer hover:scale-105 hover:shadow-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-green-400/30 rounded-lg flex items-center justify-center">
                        <FiCreditCard className="w-4 h-4 text-green-200" />
                      </div>
                      <div className="text-white/70 text-xs font-medium uppercase tracking-wide">Payments</div>
                    </div>
                    <div className="text-xl font-bold text-white">{totalPayments}</div>
                  </div>
                  <div className="group bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 hover:bg-white/15 hover:border-white/30 transition-all cursor-pointer hover:scale-105 hover:shadow-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-purple-400/30 rounded-lg flex items-center justify-center">
                        <FiDollarSign className="w-4 h-4 text-purple-200" />
                      </div>
                      <div className="text-white/70 text-xs font-medium uppercase tracking-wide">Total Paid</div>
                    </div>
                    <div className="text-xl font-bold text-white">{formatCurrency(totalPaid)}</div>
                  </div>
                  <div className="group bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 hover:bg-white/15 hover:border-white/30 transition-all cursor-pointer hover:scale-105 hover:shadow-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-orange-400/30 rounded-lg flex items-center justify-center">
                        <FiClock className="w-4 h-4 text-orange-200" />
                      </div>
                      <div className="text-white/70 text-xs font-medium uppercase tracking-wide">Pending</div>
                    </div>
                    <div className="text-xl font-bold text-white">{pendingPayments}</div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-row lg:flex-col gap-3 w-full lg:w-auto">
                <Button
                  onClick={handleEdit}
                  className="bg-gradient-to-br from-white/95 to-white/90 backdrop-blur-md border-2 border-white/50 text-blue-600 hover:from-white hover:to-white/95 hover:border-white shadow-xl hover:shadow-2xl transition-all hover:scale-[1.02] rounded-xl font-semibold px-5 py-6 text-sm md:text-base flex-1 lg:flex-none group relative overflow-hidden"
                  size="lg"
                >
                  {/* Shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  <div className="relative flex items-center justify-center gap-2.5">
                    <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all">
                      <FiEdit className="w-5 h-5 text-white" />
                    </div>
                    <span className="hidden sm:inline font-bold">Edit Student</span>
                    <span className="sm:hidden font-bold">Edit</span>
                  </div>
                </Button>
                <Button
                  onClick={handleDuplicate}
                  className="bg-white/10 backdrop-blur-md border-2 border-white/40 text-white hover:bg-white/20 hover:border-white/60 transition-all hover:scale-[1.02] rounded-xl font-semibold px-5 py-6 text-sm md:text-base flex-1 lg:flex-none group relative overflow-hidden"
                  size="lg"
                >
                  {/* Shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  <div className="relative flex items-center justify-center gap-2.5">
                    <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center group-hover:bg-white/30 transition-all border border-white/30 shadow-lg group-hover:shadow-xl group-hover:scale-110">
                      <FiCopy className="w-5 h-5 text-white" />
                    </div>
                    <span className="hidden sm:inline font-bold">Duplicate</span>
                    <span className="sm:hidden font-bold">Copy</span>
                  </div>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Academic Records</p>
                  <p className="text-2xl font-bold">{academicRecords.length}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <FiAward className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Completed Payments</p>
                  <p className="text-2xl font-bold text-green-600">
                    {payments.filter(p => p.status === 'completed').length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <FiCheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Pending Payments</p>
                  <p className="text-2xl font-bold text-orange-600">{pendingPayments}</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <FiClock className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Amount Paid</p>
                  <p className="text-2xl font-bold text-purple-600">{formatCurrency(totalPaid)}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <FiTrendingUp className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FiUser className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle>Basic Information</CardTitle>
                    <CardDescription>Personal details and contact information</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <Separator />
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      First Name
                    </label>
                    <p className="text-base font-semibold">{student.firstName}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Last Name
                    </label>
                    <p className="text-base font-semibold">{student.lastName}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Email Address
                    </label>
                    <div className="flex items-center gap-2">
                      <FiMail className="w-4 h-4 text-muted-foreground" />
                      <p className="text-base">{student.email}</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Phone Number
                    </label>
                    <div className="flex items-center gap-2">
                      <FiPhone className="w-4 h-4 text-muted-foreground" />
                      <p className="text-base">{student.phone || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Date of Birth
                    </label>
                    <div className="flex items-center gap-2">
                      <FiCalendar className="w-4 h-4 text-muted-foreground" />
                      <p className="text-base">{formatDate(student.dateOfBirth)}</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Gender
                    </label>
                    <Badge variant="outline" className="w-fit">
                      {student.gender || 'N/A'}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Blood Group
                    </label>
                    <Badge variant="outline" className="w-fit bg-red-50 text-red-700 border-red-200">
                      {student.bloodGroup || 'N/A'}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Status
                    </label>
                    <Badge
                      variant={student.status === 'active' ? 'default' : 'secondary'}
                      className={
                        student.status === 'active'
                          ? 'bg-green-100 text-green-800 hover:bg-green-100'
                          : ''
                      }
                    >
                      {student.status === 'active' && <FiCheckCircle className="w-3 h-3 mr-1" />}
                      {student.status}
                    </Badge>
                  </div>
                </div>
                {student.address && (
                  <>
                    <Separator className="my-6" />
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Address
                      </label>
                      <div className="flex items-start gap-2">
                        <FiMapPin className="w-4 h-4 text-muted-foreground mt-1" />
                        <p className="text-base">{student.address}</p>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Academic Information */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <FiBook className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <CardTitle>Academic Information</CardTitle>
                    <CardDescription>Class assignments and academic history</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <Separator />
              <CardContent className="pt-6">
                <div className="space-y-6">
                  <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-100">
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      Current Class
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                        <FiBook className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-purple-900">{getCurrentClass()}</p>
                        <p className="text-sm text-purple-700">
                          {academicRecords.find(r => r.academicYear?.isCurrent)?.academicYear?.name || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                  {academicRecords.length > 0 && (
                    <div>
                      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4">
                        Academic History
                      </div>
                      <div className="space-y-3">
                        {academicRecords.map((record, index) => (
                          <div
                            key={record.id}
                            className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold shadow-md">
                                {index + 1}
                              </div>
                              <div>
                                <p className="font-semibold">
                                  {record.academicYear?.name || 'N/A'}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {record.class?.name || 'N/A'}
                                  {record.section && ` • Section ${record.section}`}
                                  {record.rollNumber && ` • Roll: ${record.rollNumber}`}
                                </p>
                              </div>
                            </div>
                            <Badge
                              variant={record.status === 'active' ? 'default' : 'secondary'}
                              className={
                                record.status === 'active'
                                  ? 'bg-green-100 text-green-800 hover:bg-green-100'
                                  : ''
                              }
                            >
                              {record.status === 'active' && <FiCheckCircle className="w-3 h-3 mr-1" />}
                              {record.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Payment History */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <FiCreditCard className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <CardTitle>Payment History</CardTitle>
                      <CardDescription>
                        {payments.length} payment{payments.length !== 1 ? 's' : ''} recorded
                      </CardDescription>
                    </div>
                  </div>
                  {lastPayment && (
                    <Badge variant="outline" className="text-xs">
                      Last: {formatDate(lastPayment.paymentDate)}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <Separator />
              <CardContent className="pt-6">
                {payments.length > 0 ? (
                  <DataTable
                    columns={paymentColumns}
                    data={payments}
                    enablePagination={true}
                    pageSize={10}
                  />
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                      <FiCreditCard className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">No payments recorded yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Admission Details */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <FiAward className="w-5 h-5 text-indigo-600" />
                  </div>
                  <CardTitle className="text-lg">Admission Details</CardTitle>
                </div>
              </CardHeader>
              <Separator />
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Admission Date
                  </label>
                  <div className="flex items-center gap-2">
                    <FiCalendar className="w-4 h-4 text-muted-foreground" />
                    <p className="text-base font-semibold">
                      {formatDate(student.admissionDate)}
                    </p>
                  </div>
                </div>
                {student.admissionNumber && (
                  <>
                    <Separator />
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Admission Number
                      </label>
                      <p className="text-base font-semibold font-mono">{student.admissionNumber}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Parent/Guardian Information */}
            {(student.parentName || student.parentPhone || student.parentEmail) && (
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                      <FiHome className="w-5 h-5 text-pink-600" />
                    </div>
                    <CardTitle className="text-lg">Parent/Guardian</CardTitle>
                  </div>
                </CardHeader>
                <Separator />
                <CardContent className="pt-6 space-y-4">
                  {student.parentName && (
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Name
                      </label>
                      <p className="text-base font-semibold">{student.parentName}</p>
                    </div>
                  )}
                  {student.parentRelation && (
                    <>
                      <Separator />
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          Relation
                        </label>
                        <Badge variant="outline" className="capitalize">
                          {student.parentRelation}
                        </Badge>
                      </div>
                    </>
                  )}
                  {student.parentPhone && (
                    <>
                      <Separator />
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          Phone
                        </label>
                        <div className="flex items-center gap-2">
                          <FiPhone className="w-4 h-4 text-muted-foreground" />
                          <p className="text-base">{student.parentPhone}</p>
                        </div>
                      </div>
                    </>
                  )}
                  {student.parentEmail && (
                    <>
                      <Separator />
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          Email
                        </label>
                        <div className="flex items-center gap-2">
                          <FiMail className="w-4 h-4 text-muted-foreground" />
                          <p className="text-base break-all">{student.parentEmail}</p>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Additional Information */}
            {(student.routeId || student.busNumber || student.openingBalance) && (
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                      <FiBriefcase className="w-5 h-5 text-orange-600" />
                    </div>
                    <CardTitle className="text-lg">Additional Info</CardTitle>
                  </div>
                </CardHeader>
                <Separator />
                <CardContent className="pt-6 space-y-4">
                  {student.openingBalance && (
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Opening Balance
                      </label>
                      <div className="flex items-center gap-2">
                        <FiDollarSign className="w-4 h-4 text-green-600" />
                        <p className="text-base font-semibold text-green-600">
                          {formatCurrency(parseFloat(student.openingBalance.toString()))}
                        </p>
                      </div>
                    </div>
                  )}
                  {student.busNumber && (
                    <>
                      <Separator />
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          Bus Number
                        </label>
                        <Badge variant="outline" className="font-mono">
                          {student.busNumber}
                        </Badge>
                      </div>
                    </>
                  )}
                  {student.busSeatNumber && (
                    <>
                      <Separator />
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          Bus Seat
                        </label>
                        <Badge variant="outline" className="font-mono">
                          {student.busSeatNumber}
                        </Badge>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
