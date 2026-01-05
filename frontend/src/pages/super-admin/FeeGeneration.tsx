import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowUpDown, CheckCircle2, XCircle, Clock, Loader, Search, Eye, Download, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { DataTable } from '@/components/DataTable';
import { useSchool } from '../../contexts/SchoolContext';
import { useAuth } from '../../contexts/AuthContext';
import feeGenerationService, {
  GenerateFeesDto,
} from '../../services/feeGenerationService';
import { academicYearsService } from '../../services/academicYears.service';
import { studentFeeStructuresService, StudentFeeStructure } from '../../services/studentFeeStructures.service';
import { paymentsService } from '../../services/payments.service';
import api from '../../services/api';
import { getErrorMessage } from '@/utils/errorHandling';
import { extractArrayData, extractApiData } from '@/utils/apiHelpers';
import { FiLoader, FiSearch, FiPlus, FiDollarSign, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import { format, startOfMonth, endOfMonth, subMonths, eachMonthOfInterval } from 'date-fns';
import { Textarea } from '@/components/ui/textarea';

interface StudentDetails {
  id: number;
  studentId: string;
  firstName: string;
  lastName: string;
  parentName?: string;
  parentPhone?: string;
  address?: string;
  class?: {
    id: number;
    name: string;
  };
  classId?: number; // Add classId for direct access
  categoryHead?: {
    id: number;
    name: string;
  };
  categoryHeadId?: number; // Add categoryHeadId for direct access
  route?: {
    id: number;
    name: string;
  };
  routeId?: number;
  openingBalance?: number;
}

interface FeeBreakdown {
  feeHead: string;
  feeStructureId: number;
  monthlyAmounts: Record<string, number>; // month key -> amount
  total: number;
  received: number;
  balance: number;
}

export default function FeeGeneration() {
  const { user } = useAuth();
  const { selectedSchoolId } = useSchool();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [studentSearchId, setStudentSearchId] = useState('');
  const [studentDetails, setStudentDetails] = useState<StudentDetails | null>(null);
  const [loadingStudent, setLoadingStudent] = useState(false);
  const [academicYearId, setAcademicYearId] = useState<number | null>(null);
  const [feeBreakdown, setFeeBreakdown] = useState<FeeBreakdown[]>([]);
  const [loadingBreakdown, setLoadingBreakdown] = useState(false);
  
  // Payment related state
  const [studentFeeStructures, setStudentFeeStructures] = useState<StudentFeeStructure[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [selectedFeeStructure, setSelectedFeeStructure] = useState<StudentFeeStructure | null>(null);
  const [paymentFormData, setPaymentFormData] = useState({
    amountReceived: '', // Total amount received (will be allocated to fees)
    discount: '',
    paymentMethod: 'cash' as 'cash' | 'bank_transfer' | 'card' | 'online' | 'cheque',
    paymentDate: new Date().toISOString().split('T')[0],
    transactionId: '',
    notes: '',
  });
  // Fee head priority selection (which fees to pay)
  const [selectedFeeHeads, setSelectedFeeHeads] = useState<Set<number>>(new Set());
  const [paymentAllocation, setPaymentAllocation] = useState<Record<number, number>>({});
  const [recordingPayment, setRecordingPayment] = useState(false);

  // Fetch academic years
  const { data: academicYears = [], isLoading: loadingAcademicYears } = useQuery({
    queryKey: ['academicYears', selectedSchoolId],
    queryFn: () => academicYearsService.getAll(selectedSchoolId || undefined),
    enabled: !!selectedSchoolId,
  });

  // Set current academic year as default
  useEffect(() => {
    if (academicYears.length > 0 && !academicYearId) {
      const currentYear = academicYears.find((y) => y.isCurrent);
      if (currentYear) {
        setAcademicYearId(currentYear.id);
      } else {
        setAcademicYearId(academicYears[0].id);
      }
    }
  }, [academicYears, academicYearId]);

  // Fetch generation history
  // Search student by ID
  const handleSearchStudent = async () => {
    if (!studentSearchId.trim() || !selectedSchoolId || !academicYearId) {
      setError('Please enter a student ID and ensure school and academic year are selected');
      return;
    }

    setLoadingStudent(true);
    setError('');
    setStudentDetails(null);
    setFeeBreakdown([]);
    setStudentFeeStructures([]);
    setPayments([]);

    try {
      // Search student by studentId - try direct lookup first if numeric
      let student: any = null;
      let studentData: any = null;
      
      const searchId = studentSearchId.trim();
      
      // Try direct lookup by database ID if it's numeric
      const numericId = parseInt(searchId, 10);
      if (!isNaN(numericId)) {
        try {
          const directResponse = await api.instance.get(`/students/${numericId}`, {
            params: { schoolId: selectedSchoolId },
          });
          studentData = extractApiData<any>(directResponse) || directResponse.data;
          if (studentData && studentData.schoolId === Number(selectedSchoolId)) {
            // Verify it matches the search ID (either database ID or studentId)
            if (studentData.id === numericId || studentData.studentId === searchId) {
              student = { id: studentData.id, studentId: studentData.studentId };
            }
          }
        } catch (err) {
          // Direct lookup failed, continue with search
          console.log('Direct lookup failed, trying search...');
        }
      }
      
      // If direct lookup didn't work, search by studentId
      if (!student || !studentData) {
        const response = await api.instance.get('/students', {
          params: { schoolId: selectedSchoolId, studentId: searchId },
        });

        const students = extractArrayData<any>(response);
        
        if (!students || students.length === 0) {
          setError(`Student with ID "${searchId}" not found`);
          setStudentDetails(null);
          setFeeBreakdown([]);
          setStudentFeeStructures([]);
          setPayments([]);
          return;
        }

        // Find exact match by studentId (case-insensitive, trimmed)
        student = students.find((s: any) => 
          s.studentId && s.studentId.toString().trim().toLowerCase() === searchId.toLowerCase()
        );
        
        if (!student) {
          // Try to find by database ID if searchId is numeric
          if (!isNaN(parseInt(searchId, 10))) {
            const dbIdMatch = students.find((s: any) => s.id === parseInt(searchId, 10));
            if (dbIdMatch) {
              student = dbIdMatch;
            }
          }
          
          if (!student) {
            setError(`Student with ID "${searchId}" not found. Found ${students.length} result(s) but none matched exactly.`);
            setStudentDetails(null);
            setFeeBreakdown([]);
            setStudentFeeStructures([]);
            setPayments([]);
            return;
          }
        }
        
        // Get full student details with relations
        const studentDetailResponse = await api.instance.get(`/students/${student.id}`, {
          params: { schoolId: selectedSchoolId },
        });
        studentData = extractApiData<any>(studentDetailResponse) || studentDetailResponse.data;
      }
      
      if (!studentData) {
        setError(`Failed to load student details for ID "${searchId}"`);
        setLoadingStudent(false);
        return;
      }
      
      // Ensure we have the relations loaded - reload if needed
      if (!studentData.categoryHead && !studentData.categoryHeadId) {
        // Try to reload with relations explicitly
        try {
          const reloadResponse = await api.instance.get(`/students/${studentData.id}`, {
            params: { schoolId: selectedSchoolId },
          });
          const reloadedData = extractApiData<any>(reloadResponse) || reloadResponse.data;
          if (reloadedData) {
            studentData = reloadedData;
          }
        } catch (err) {
          console.warn('Failed to reload student with relations:', err);
        }
      }

      // Get academic record for the academic year
      const academicRecordResponse = await api.instance.get('/student-academic-records', {
        params: { studentId: student.id, academicYearId },
      });

      const records = extractArrayData<any>(academicRecordResponse);
      const academicRecord = records.length > 0 ? records[0] : null;

      // Pre-check: Verify student has required information
      const missingFields: string[] = [];
      if (!academicRecord?.class || !academicRecord?.classId) {
        missingFields.push('Class');
      }
      // Check both categoryHead relation and categoryHeadId
      const hasCategoryHead = studentData.categoryHead?.id || studentData.categoryHeadId;
      if (!hasCategoryHead) {
        missingFields.push('Fee Category');
      }
      // Check both route relation and routeId
      const hasRoute = studentData.route?.id || studentData.routeId;
      if (!hasRoute) {
        missingFields.push('Route');
      }

      if (missingFields.length > 0) {
        setError(
          `Student is missing required information: ${missingFields.join(', ')}. ` +
          `Please update the student profile first before generating fees.`
        );
        setStudentDetails(null);
        setFeeBreakdown([]);
        setLoadingStudent(false);
        return;
      }

      // Get categoryHeadId from URL parameter as fallback
      const urlCategoryHeadId = searchParams.get('categoryHeadId');
      const finalCategoryHeadId = 
        studentData.categoryHeadId || 
        studentData.categoryHead?.id || 
        (urlCategoryHeadId ? parseInt(urlCategoryHeadId, 10) : undefined);
      
      setStudentDetails({
        id: studentData.id,
        studentId: studentData.studentId,
        firstName: studentData.firstName,
        lastName: studentData.lastName,
        parentName: studentData.parentName,
        parentPhone: studentData.parentPhone,
        address: studentData.address,
        class: academicRecord?.class,
        classId: academicRecord?.classId || academicRecord?.class?.id, // Add classId for direct access
        categoryHead: studentData.categoryHead,
        categoryHeadId: finalCategoryHeadId, // Use URL parameter as fallback
        route: studentData.route,
        routeId: studentData.routeId,
        openingBalance: studentData.openingBalance || 0,
      });
      
      // Update URL parameters with student info
      const newParams = new URLSearchParams(searchParams);
      newParams.set('studentId', studentData.studentId);
      if (finalCategoryHeadId) {
        newParams.set('categoryHeadId', finalCategoryHeadId.toString());
      }
      if (academicYearId) {
        newParams.set('academicYearId', academicYearId.toString());
      }
      setSearchParams(newParams, { replace: true });

      // Load student fee structures and payments first (needed for accurate breakdown)
      await loadStudentFeeStructures(studentData.id, academicYearId);
      
      // Generate fee breakdown (will use loaded payments for accurate calculations)
      await generateFeeBreakdown(studentData.id, academicYearId, academicRecord?.classId);
    } catch (err: any) {
      console.error('Error searching student:', err);
      setError(getErrorMessage(err, `Failed to search student: ${err.message || 'Unknown error'}`));
      setStudentDetails(null);
      setFeeBreakdown([]);
      setStudentFeeStructures([]);
      setPayments([]);
    } finally {
      setLoadingStudent(false);
    }
  };

  // Generate fee breakdown
  const generateFeeBreakdown = async (
    studentId: number,
    academicYearId: number,
    classId?: number,
  ) => {
    if (!classId || !selectedSchoolId) return;

    setLoadingBreakdown(true);
    try {
      // Get academic year details
      const academicYear = academicYears.find((y) => y.id === academicYearId);
      if (!academicYear) return;

      // Pre-check: Verify student has required information
      // Check both class object and classId for robustness
      const hasClass = studentDetails?.class || studentDetails?.classId || classId;
      if (!hasClass) {
        setError('Student must have a class assigned. Please update the student profile first.');
        setLoadingBreakdown(false);
        return;
      }
      
      // Use classId from academic record if available, otherwise from studentDetails
      const effectiveClassId = classId || studentDetails?.classId || studentDetails?.class?.id;
      if (!effectiveClassId) {
        setError('Student must have a class assigned. Please update the student profile first.');
        setLoadingBreakdown(false);
        return;
      }

      // Check categoryHead - use categoryHeadId if relation is not loaded
      // Also check URL parameter as fallback
      const urlCategoryHeadId = searchParams.get('categoryHeadId');
      const effectiveCategoryHeadId = 
        studentDetails?.categoryHeadId || 
        studentDetails?.categoryHead?.id || 
        (urlCategoryHeadId ? parseInt(urlCategoryHeadId, 10) : undefined);
      
      console.log('[FeeGeneration] Category Head Check:', {
        categoryHeadId: studentDetails?.categoryHeadId,
        categoryHead: studentDetails?.categoryHead,
        urlCategoryHeadId,
        effectiveCategoryHeadId,
      });
      
      if (!effectiveCategoryHeadId || isNaN(effectiveCategoryHeadId)) {
        setError('Student must have a fee category assigned. Please update the student profile first.');
        setLoadingBreakdown(false);
        return;
      }

      // Check route - use routeId if relation is not loaded
      const effectiveRouteId = studentDetails?.routeId || studentDetails?.route?.id;
      if (!effectiveRouteId) {
        setError('Student must have a route assigned. Please update the student profile first.');
        setLoadingBreakdown(false);
        return;
      }

      const categoryHeadId = effectiveCategoryHeadId;
      const routeId = effectiveRouteId;

      // Get fee structures for the class AND category
      const feeStructuresResponse = await api.instance.get('/fee-structures', {
        params: { 
          schoolId: selectedSchoolId, 
          classId: effectiveClassId, // Use effectiveClassId instead of classId
          categoryHeadId, // Filter by category
          status: 'active' 
        },
      });

      const feeStructures = extractArrayData<any>(feeStructuresResponse);
      console.log(`Fee structures found for class ${effectiveClassId} and category ${categoryHeadId}:`, feeStructures);
      
      if (feeStructures.length === 0) {
        setError(
          `No fee structures found for class "${studentDetails.class?.name || effectiveClassId}" ` +
          `and category "${studentDetails.categoryHead?.name || categoryHeadId}". ` +
          `Please create fee plans for this class and category combination first.`
        );
        setLoadingBreakdown(false);
        return;
      }

      // Get existing student fees and payments
      let existingFees: any[] = [];
      let existingPayments: any[] = [];
      try {
        const existingFeesResponse = await api.instance.get('/student-fee-structures', {
          params: { studentId, academicYearId },
        });
        existingFees = extractArrayData<any>(existingFeesResponse);
        console.log('Existing fees found:', existingFees);
        
        // Load payments for this student
        const paymentsResponse = await api.instance.get('/payments', {
          params: { studentId },
        });
        existingPayments = extractArrayData<any>(paymentsResponse) || [];
        console.log('Existing payments found:', existingPayments);
      } catch (err) {
        console.warn('Failed to fetch existing fees/payments (continuing anyway):', err);
        // Continue without existing fees - will show balance as full amount
      }

      // Calculate months from academic year start to previous month
      const academicYearStart = new Date(academicYear.startDate);
      const previousMonth = subMonths(new Date(), 1);
      const months = eachMonthOfInterval({
        start: startOfMonth(academicYearStart),
        end: endOfMonth(previousMonth),
      });

      // Build fee breakdown
      const breakdown: FeeBreakdown[] = [];

      // Add opening balance as Ledger Balance (include if non-zero, whether positive or negative)
      // Positive = debt (student owes), Negative = credit (student has credit)
      if (studentDetails?.openingBalance !== undefined && studentDetails.openingBalance !== null) {
        const openingBalance = parseFloat(studentDetails.openingBalance.toString());
        if (openingBalance !== 0) {
          breakdown.push({
            feeHead: openingBalance > 0 ? 'Ledger Balance (Outstanding)' : 'Ledger Balance (Credit)',
            feeStructureId: 0,
            monthlyAmounts: {},
            total: openingBalance,
            received: 0,
            balance: openingBalance,
          });
        }
      }

      // Process each fee structure
      for (const feeStructure of feeStructures) {
        // Get fee category to check applicable months
        let applicableMonths = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]; // Default to all months
        try {
          const categoryResponse = await api.instance.get(
            `/fee-categories/${feeStructure.feeCategoryId}`,
          );
          const category = extractApiData<any>(categoryResponse) || categoryResponse.data;
          applicableMonths = category?.applicableMonths || applicableMonths;
          console.log(`Category for fee structure ${feeStructure.id}:`, category);
        } catch (err) {
          console.warn(`Failed to fetch category for fee structure ${feeStructure.id}:`, err);
          // Use default months if category fetch fails
        }

        const monthlyAmounts: Record<string, number> = {};
        let total = 0;

        // Calculate monthly amounts based on applicable months
        months.forEach((month) => {
          const monthNumber = month.getMonth() + 1; // 1-12
          if (applicableMonths.includes(monthNumber)) {
            const monthKey = format(month, 'MMM yy');
            const amount = parseFloat(feeStructure.amount.toString());
            monthlyAmounts[monthKey] = amount;
            total += amount;
          }
        });

        // Calculate received and balance from existing fees and payments
        const existingFee = existingFees.find((f) => f.feeStructureId === feeStructure.id);
        let received = 0;
        if (existingFee) {
          const feePayments = existingPayments.filter(
            (p) => p.studentFeeStructureId === existingFee.id && p.status === 'completed'
          );
          received = feePayments.reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0);
        }

        breakdown.push({
          feeHead: feeStructure.name,
          feeStructureId: feeStructure.id,
          monthlyAmounts,
          total,
          received,
          balance: total - received,
        });
      }

      // Find and add bus fee based on student's route and class
      if (studentDetails?.routeId && effectiveClassId) {
        try {
          // Find route plan by routeId and classId
          const routePlansResponse = await api.instance.get('/super-admin/route-plans', {
            params: {
              schoolId: selectedSchoolId,
              routeId: studentDetails.routeId,
              classId: effectiveClassId,
            },
          });

          const routePlans = extractArrayData<any>(routePlansResponse);

          // Find matching route plan (prefer class-specific, fallback to general)
          const routePlan =
            routePlans.find((rp) => rp.classId === classId) ||
            routePlans.find((rp) => !rp.classId) ||
            routePlans[0];

          if (routePlan) {
            // Find the actual transport fee structure for this student
            // Look for fee structures with the transport category
            let transportFeeStructureId = 0;
            let transportReceived = 0;
            
            try {
              // Get transport fee structures for this student
              const transportFees = existingFees.filter((f) => {
                // Check if this fee structure matches the route plan's category
                return f.feeStructure?.feeCategoryId === routePlan.feeCategoryId;
              });
              
              if (transportFees.length > 0) {
                // Use the first transport fee structure found
                transportFeeStructureId = transportFees[0].feeStructureId;
                
                // Calculate received amount for transport fee
                const transportPayments = existingPayments.filter(
                  (p) => transportFees.some((tf) => tf.id === p.studentFeeStructureId) && p.status === 'completed'
                );
                transportReceived = transportPayments.reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0);
              }
            } catch (err) {
              console.warn('Error finding transport fee structure:', err);
            }
            
            const busFeeAmount = parseFloat(routePlan.amount.toString());
            const monthlyAmounts: Record<string, number> = {};
            let total = 0;

            // Get transport fee category to check applicable months
            try {
              const transportCategoryResponse = await api.instance.get(
                `/fee-categories/${routePlan.feeCategoryId}`,
              );
              const transportCategory = transportCategoryResponse.data;
              const applicableMonths =
                transportCategory?.applicableMonths ||
                [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]; // Default to all months

              months.forEach((month) => {
                const monthNumber = month.getMonth() + 1; // 1-12
                if (applicableMonths.includes(monthNumber)) {
                  const monthKey = format(month, 'MMM yy');
                  monthlyAmounts[monthKey] = busFeeAmount;
                  total += busFeeAmount;
                }
              });
            } catch {
              // If category fetch fails, apply to all months
              months.forEach((month) => {
                const monthKey = format(month, 'MMM yy');
                monthlyAmounts[monthKey] = busFeeAmount;
                total += busFeeAmount;
              });
            }

            breakdown.push({
              feeHead: 'Transport Fee',
              feeStructureId: transportFeeStructureId || 0, // Use actual fee structure ID if found, otherwise 0
              monthlyAmounts,
              total,
              received: transportReceived,
              balance: total - transportReceived,
            });
          }
        } catch (err) {
          console.error('Error fetching route plan:', err);
          // Continue without bus fee if route plan not found
        }
      }

      console.log('Fee breakdown generated:', breakdown);
      console.log('Breakdown length:', breakdown.length);
      // Log each item in breakdown for debugging
      breakdown.forEach((item, index) => {
        console.log(`Breakdown item ${index}:`, {
          feeHead: item.feeHead,
          feeStructureId: item.feeStructureId,
          total: item.total,
        });
      });
      setFeeBreakdown(breakdown);
    } catch (err: any) {
      console.error('Error generating fee breakdown:', err);
      setError(getErrorMessage(err, 'Failed to generate fee breakdown'));
      setFeeBreakdown([]); // Clear breakdown on error
    } finally {
      setLoadingBreakdown(false);
    }
  };

  // Generate fees mutation
  const generateMutation = useMutation({
    mutationFn: (data: GenerateFeesDto) => feeGenerationService.generateFees(data),
    onSuccess: (result) => {
      console.log('Fee generation success result:', result);
      // Handle both direct result and wrapped result
      const finalResult = result && typeof result === 'object' && 'data' in result 
        ? result.data 
        : result;
      
      if (!finalResult || typeof finalResult !== 'object') {
        console.error('Invalid result format:', finalResult);
        setError('Invalid response from server');
        return;
      }

      const generated = finalResult.generated || 0;
      const failed = finalResult.failed || 0;
      
      if (generated === 0 && failed === 0) {
        setError('No fees were generated. Fees may already exist for this student.');
      } else {
        setSuccess(
          `Successfully generated ${generated} fees. ${failed > 0 ? `${failed} failed.` : ''} You can now record payments for this student.`,
        );
      }
      setError('');
      queryClient.invalidateQueries({ queryKey: ['feeGenerationHistory'] });
      // Refresh fee breakdown and load student fee structures
      if (studentDetails && academicYearId) {
        generateFeeBreakdown(
          studentDetails.id,
          academicYearId,
          studentDetails.classId || studentDetails.class?.id,
        );
        // Load student fee structures for payment
        loadStudentFeeStructures(studentDetails.id, academicYearId);
      }
      setTimeout(() => setSuccess(''), 8000); // Show success message longer to allow clicking Pay Now
    },
    onError: (error: any) => {
      console.error('Fee generation error:', error);
      console.error('Error response:', error.response);
      console.error('Error response data:', error.response?.data);
      const errorMessage = getErrorMessage(error, 'Failed to generate fees');
      console.error('Error message:', errorMessage);
      setError(errorMessage);
      setSuccess('');
      setTimeout(() => setError(''), 10000); // Show error for 10 seconds
    },
  });

  // Load student fee structures for payment
  const loadStudentFeeStructures = async (studentId: number, yearId: number) => {
    try {
      const fees = await studentFeeStructuresService.getAll(studentId, yearId, selectedSchoolId as number);
      setStudentFeeStructures(fees);
      
      // Load payments for this student
      const paymentsData = await paymentsService.getAll(studentId);
      setPayments(paymentsData);
    } catch (err: any) {
      console.error('Error loading student fee structures:', err);
      // Don't show error, just log it
    }
  };

  // Calculate paid amount for a fee structure
  const getPaidAmountForFee = (feeStructureId: number): number => {
    const studentFeeStructure = studentFeeStructures.find((sfs) => sfs.feeStructureId === feeStructureId);
    if (!studentFeeStructure) return 0;
    
    return payments
      .filter((p) => p.studentFeeStructureId === studentFeeStructure.id && p.status === 'completed')
      .reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0);
  };

  // Get student fee structure by fee structure ID
  // If multiple installments exist, find the first one with outstanding balance
  const getStudentFeeStructure = (feeStructureId: number): StudentFeeStructure | null => {
    const matchingStructures = studentFeeStructures.filter((sfs) => sfs.feeStructureId === feeStructureId);
    if (matchingStructures.length === 0) return null;
    
    // If only one, return it
    if (matchingStructures.length === 1) return matchingStructures[0];
    
    // If multiple installments, find the first one with outstanding balance
    // Calculate balance for each and return the first unpaid one
    for (const sfs of matchingStructures) {
      const paid = payments
        .filter((p) => p.studentFeeStructureId === sfs.id && p.status === 'completed')
        .reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0);
      const balance = parseFloat(sfs.amount.toString()) - paid;
      if (balance > 0) {
        return sfs; // Return first unpaid installment
      }
    }
    
    // If all are paid, return the first one (for reference)
    return matchingStructures[0];
  };

  // Open payment dialog for a fee
  const handlePayFee = (feeStructureId: number) => {
    // Get balance from fee breakdown (matches what's displayed in table)
    const feeBreakdownItem = feeBreakdown.find((f) => f.feeStructureId === feeStructureId);
    if (!feeBreakdownItem || feeBreakdownItem.balance <= 0) {
      setError('This fee has no outstanding balance');
      return;
    }
    
    // Find student fee structure - prefer one with outstanding balance
    const studentFeeStructure = getStudentFeeStructure(feeStructureId);
    if (!studentFeeStructure || !studentDetails) {
      setError('Fee structure not found for this student');
      return;
    }

    // Use breakdown balance (total across all installments)
    const remainingBalance = feeBreakdownItem.balance;

    setSelectedFeeStructure(studentFeeStructure);
    setPaymentFormData({
      amount: '', // Empty so user can enter amount
      paymentMethod: 'cash',
      paymentDate: new Date().toISOString().split('T')[0],
      transactionId: '',
      notes: '',
    });
    setShowPaymentForm(true);
  };

  // Calculate payment allocation based on amount received and selected fee heads
  const calculatePaymentAllocation = (amountReceived: number, selectedHeads: Set<number>) => {
    const allocation: Record<number, number> = {};
    let remainingAmount = amountReceived;

    // Get fees with outstanding balance, sorted by selected priority
    // Map feeStructureId to the ID used in selectedHeads (handle Transport Fee with -1)
    const feesToPay = feeBreakdown
      .filter((f) => {
        if (f.balance <= 0) return false;
        if (f.feeHead === 'Ledger Balance (Outstanding)' || f.feeHead === 'Ledger Balance (Credit)') return false;
        
        // For Transport Fee with feeStructureId = 0, check if -1 is selected
        if (f.feeStructureId === 0 && f.feeHead === 'Transport Fee') {
          return selectedHeads.has(-1);
        }
        // For other fees, check if feeStructureId is selected
        return selectedHeads.has(f.feeStructureId);
      })
      .map((f) => {
        // Map to the ID used in selectedHeads
        const feeId = f.feeStructureId === 0 && f.feeHead === 'Transport Fee' ? -1 : f.feeStructureId;
        return { ...f, mappedFeeId: feeId };
      })
      .sort((a, b) => {
        // Sort by selection order (first selected = first priority)
        const aIndex = Array.from(selectedHeads).indexOf(a.mappedFeeId);
        const bIndex = Array.from(selectedHeads).indexOf(b.mappedFeeId);
        return aIndex - bIndex;
      });

    // Allocate amount to fees in priority order
    for (const fee of feesToPay) {
      if (remainingAmount <= 0) break;
      const allocationAmount = Math.min(remainingAmount, fee.balance);
      // Use mappedFeeId for allocation (so Transport Fee uses -1)
      allocation[fee.mappedFeeId] = allocationAmount;
      remainingAmount -= allocationAmount;
    }

    return { allocation, remainingAmount };
  };

  // Recalculate allocation function
  const recalculateAllocation = useCallback(() => {
    const amountReceived = parseFloat(paymentFormData.amountReceived) || 0;
    const discount = parseFloat(paymentFormData.discount) || 0;
    const netAmount = Math.max(0, amountReceived - discount);
    
    if (netAmount > 0 && selectedFeeHeads.size > 0 && feeBreakdown.length > 0) {
      const { allocation } = calculatePaymentAllocation(netAmount, selectedFeeHeads);
      setPaymentAllocation(allocation);
    } else {
      setPaymentAllocation({});
    }
  }, [paymentFormData.amountReceived, paymentFormData.discount, selectedFeeHeads, feeBreakdown]);

  // Recalculate when dependencies change
  useEffect(() => {
    recalculateAllocation();
  }, [recalculateAllocation]);

  // Handle amount received change
  const handleAmountReceivedChange = (value: string) => {
    const newFormData = { ...paymentFormData, amountReceived: value };
    setPaymentFormData(newFormData);
    
    // Recalculate immediately with new value
    const amount = parseFloat(value) || 0;
    const discount = parseFloat(newFormData.discount) || 0;
    const netAmount = Math.max(0, amount - discount);
    
    if (netAmount > 0 && selectedFeeHeads.size > 0 && feeBreakdown.length > 0) {
      const { allocation } = calculatePaymentAllocation(netAmount, selectedFeeHeads);
      setPaymentAllocation(allocation);
    } else {
      setPaymentAllocation({});
    }
  };

  // Handle discount change
  const handleDiscountChange = (value: string) => {
    const newFormData = { ...paymentFormData, discount: value };
    setPaymentFormData(newFormData);
    
    // Recalculate immediately with new value
    const amountReceived = parseFloat(newFormData.amountReceived) || 0;
    const discount = parseFloat(value) || 0;
    const netAmount = Math.max(0, amountReceived - discount);
    
    if (netAmount > 0 && selectedFeeHeads.size > 0 && feeBreakdown.length > 0) {
      const { allocation } = calculatePaymentAllocation(netAmount, selectedFeeHeads);
      setPaymentAllocation(allocation);
    } else {
      setPaymentAllocation({});
    }
  };

  // Handle fee head selection change
  const handleFeeHeadToggle = (feeStructureId: number) => {
    const newSelected = new Set(selectedFeeHeads);
    if (newSelected.has(feeStructureId)) {
      newSelected.delete(feeStructureId);
    } else {
      newSelected.add(feeStructureId);
    }
    setSelectedFeeHeads(newSelected);

    // Recalculate allocation with discount
    const amountReceived = parseFloat(paymentFormData.amountReceived) || 0;
    const discount = parseFloat(paymentFormData.discount) || 0;
    const netAmount = Math.max(0, amountReceived - discount);
    
    if (netAmount > 0 && newSelected.size > 0) {
      const { allocation } = calculatePaymentAllocation(netAmount, newSelected);
      setPaymentAllocation(allocation);
    } else {
      setPaymentAllocation({});
    }
  };

  // Handle "Pay Now" button - open payment dialog with all fees
  const handlePayNow = () => {
    if (!studentDetails || feeBreakdown.length === 0) {
      setError('No fees available to pay');
      return;
    }

    // Find all fees with outstanding balance
    const feesWithBalance = feeBreakdown.filter((f) => f.feeStructureId > 0 && f.balance > 0);
    if (feesWithBalance.length === 0) {
      setError('No outstanding fees to pay');
      return;
    }

    // Default: select first fee (usually Tuition Fee)
    const defaultFeeId = feesWithBalance[0]?.feeStructureId;
    if (defaultFeeId) {
      setSelectedFeeHeads(new Set([defaultFeeId]));
    }

    setSelectedFeeStructure(null); // Not needed for multi-fee payment
    setPaymentFormData({
      amountReceived: '',
      discount: '',
      paymentMethod: 'cash',
      paymentDate: new Date().toISOString().split('T')[0],
      transactionId: '',
      notes: '',
    });
    setPaymentAllocation({});
    setShowPaymentForm(true);
  };

  // Record payment
  const handleRecordPayment = async () => {
    if (!studentDetails || !academicYearId) {
      setError('Missing required information to record payment');
      return;
    }

    const amountReceived = parseFloat(paymentFormData.amountReceived) || 0;
    if (isNaN(amountReceived) || amountReceived <= 0) {
      setError('Please enter a valid amount received');
      return;
    }

    // Check if using new multi-fee payment system
    if (selectedFeeHeads.size > 0 && Object.keys(paymentAllocation).length > 0) {
      // Multi-fee payment based on allocation
      const totalAllocated = Object.values(paymentAllocation).reduce((sum, amt) => sum + amt, 0);
      if (totalAllocated <= 0) {
        setError('Please select at least one fee head to pay');
        return;
      }
      
      setRecordingPayment(true);
      setError('');

      try {
        const paymentsToCreate: any[] = [];
        let totalUnallocated = 0;
        
        // Create payments for each fee based on allocation
        for (const [feeStructureIdStr, allocatedAmount] of Object.entries(paymentAllocation)) {
          if (allocatedAmount <= 0) continue;
          
          const feeStructureId = Number(feeStructureIdStr);
          
          // Handle Transport Fee with special ID -1
          if (feeStructureId === -1) {
            // Find transport fee structures by matching route plan category
            const transportFeeBreakdown = feeBreakdown.find((f) => f.feeHead === 'Transport Fee');
            if (!transportFeeBreakdown) {
              totalUnallocated += allocatedAmount;
              continue;
            }
            
            // If transport fee has a real feeStructureId, use it; otherwise find by category
            let transportFees: any[] = [];
            if (transportFeeBreakdown.feeStructureId > 0) {
              transportFees = studentFeeStructures.filter(
                (sfs) => sfs.feeStructureId === transportFeeBreakdown.feeStructureId
              );
            } else {
              // Find transport fees by matching route plan category
              // This is a fallback if feeStructureId wasn't found during breakdown generation
              const routePlanResponse = await api.instance.get('/super-admin/route-plans', {
                params: {
                  schoolId: selectedSchoolId,
                  routeId: studentDetails.routeId,
                  classId: effectiveClassId,
                },
              });
              const routePlans = extractArrayData<any>(routePlanResponse);
              const routePlan = routePlans.find((rp) => rp.classId === effectiveClassId) || routePlans[0];
              
              if (routePlan) {
                transportFees = studentFeeStructures.filter((sfs) => {
                  return sfs.feeStructure?.feeCategoryId === routePlan.feeCategoryId;
                });
              }
            }
            
            if (transportFees.length === 0) {
              totalUnallocated += allocatedAmount;
              continue;
            }
            
            // Use transport fees as installments
            const allInstallments = transportFees;
            let remainingAmount = allocatedAmount;
            
            // Distribute payment across transport fee installments
            if (allInstallments.length > 1) {
              const unpaidInstallments = allInstallments
                .map((sfs) => {
                  const paid = payments
                    .filter((p) => p.studentFeeStructureId === sfs.id && p.status === 'completed')
                    .reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0);
                  const balance = parseFloat(sfs.amount.toString()) - paid;
                  return { sfs, balance, dueDate: sfs.dueDate ? new Date(sfs.dueDate) : new Date(0) };
                })
                .filter((item) => item.balance > 0)
                .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
              
              for (const item of unpaidInstallments) {
                if (remainingAmount <= 0) break;
                const paymentForThisInstallment = Math.min(remainingAmount, item.balance);
                paymentsToCreate.push({
                  studentId: Number(studentDetails.id),
                  studentFeeStructureId: Number(item.sfs.id),
                  amount: Number(paymentForThisInstallment.toFixed(2)),
                  paymentDate: paymentFormData.paymentDate,
                  paymentMethod: paymentFormData.paymentMethod || 'cash',
                  transactionId: paymentFormData.transactionId?.trim() || undefined,
                  notes: paymentFormData.notes?.trim() || undefined,
                  schoolId: selectedSchoolId ? Number(selectedSchoolId) : undefined,
                });
                remainingAmount -= paymentForThisInstallment;
              }
              
              if (remainingAmount > 0) {
                totalUnallocated += remainingAmount;
              }
            } else {
              // Single transport fee installment
              const sfs = allInstallments[0];
              const paid = payments
                .filter((p) => p.studentFeeStructureId === sfs.id && p.status === 'completed')
                .reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0);
              const balance = parseFloat(sfs.amount.toString()) - paid;
              const paymentAmount = Math.min(allocatedAmount, balance);
              
              if (paymentAmount > 0) {
                paymentsToCreate.push({
                  studentId: Number(studentDetails.id),
                  studentFeeStructureId: Number(sfs.id),
                  amount: Number(paymentAmount.toFixed(2)),
                  paymentDate: paymentFormData.paymentDate,
                  paymentMethod: paymentFormData.paymentMethod || 'cash',
                  transactionId: paymentFormData.transactionId?.trim() || undefined,
                  notes: paymentFormData.notes?.trim() || undefined,
                  schoolId: selectedSchoolId ? Number(selectedSchoolId) : undefined,
                });
              }
              
              if (allocatedAmount > balance) {
                totalUnallocated += (allocatedAmount - balance);
              }
            }
            continue;
          }
          
          // Regular fee structure handling
          // Get student fee structures for this fee structure ID
          const allInstallments = studentFeeStructures.filter(
            (sfs) => sfs.feeStructureId === feeStructureId
          );
          
          if (allInstallments.length === 0) {
            totalUnallocated += allocatedAmount;
            continue;
          }
          
          let remainingAmount = allocatedAmount;
          
          // If multiple installments, distribute across unpaid ones
          if (allInstallments.length > 1) {
            const unpaidInstallments = allInstallments
              .map((sfs) => {
                const paid = payments
                  .filter((p) => p.studentFeeStructureId === sfs.id && p.status === 'completed')
                  .reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0);
                const balance = parseFloat(sfs.amount.toString()) - paid;
                return { sfs, balance, dueDate: sfs.dueDate ? new Date(sfs.dueDate) : new Date(0) };
              })
              .filter((item) => item.balance > 0)
              .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime()); // Oldest first
            
            for (const item of unpaidInstallments) {
              if (remainingAmount <= 0) break;
              const paymentForThisInstallment = Math.min(remainingAmount, item.balance);
              paymentsToCreate.push({
                studentId: Number(studentDetails.id),
                studentFeeStructureId: Number(item.sfs.id),
                amount: Number(paymentForThisInstallment.toFixed(2)),
                paymentDate: paymentFormData.paymentDate,
                paymentMethod: paymentFormData.paymentMethod || 'cash',
                transactionId: paymentFormData.transactionId?.trim() || undefined,
                notes: paymentFormData.notes?.trim() || undefined,
                schoolId: selectedSchoolId ? Number(selectedSchoolId) : undefined,
              });
              remainingAmount -= paymentForThisInstallment;
            }
            
            // Track unallocated amount
            if (remainingAmount > 0) {
              totalUnallocated += remainingAmount;
            }
          } else {
            // Single installment - check balance first
            const sfs = allInstallments[0];
            const paid = payments
              .filter((p) => p.studentFeeStructureId === sfs.id && p.status === 'completed')
              .reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0);
            const balance = parseFloat(sfs.amount.toString()) - paid;
            
            // Cap payment at remaining balance
            const paymentAmount = Math.min(allocatedAmount, balance);
            
            if (paymentAmount > 0) {
              paymentsToCreate.push({
                studentId: Number(studentDetails.id),
                studentFeeStructureId: Number(sfs.id),
                amount: Number(paymentAmount.toFixed(2)),
                paymentDate: paymentFormData.paymentDate,
                paymentMethod: paymentFormData.paymentMethod || 'cash',
                transactionId: paymentFormData.transactionId?.trim() || undefined,
                notes: paymentFormData.notes?.trim() || undefined,
                schoolId: selectedSchoolId ? Number(selectedSchoolId) : undefined,
              });
            }
            
            // Track unallocated amount
            if (allocatedAmount > balance) {
              totalUnallocated += (allocatedAmount - balance);
            }
          }
        }
        
        // Warn if there's unallocated amount
        if (totalUnallocated > 0) {
          setError(`Warning: ₹${totalUnallocated.toFixed(2)} could not be allocated. Payment amounts were capped at remaining balances.`);
        }
        
        if (paymentsToCreate.length === 0) {
          setError('No payments could be created. All fees may already be fully paid.');
          setRecordingPayment(false);
          return;
        }
        
        // Create all payments
        for (const paymentData of paymentsToCreate) {
          await paymentsService.create(paymentData);
        }

        const paymentCount = paymentsToCreate.length;
        const totalPaid = paymentsToCreate.reduce((sum, p) => sum + p.amount, 0);
        setSuccess(
          paymentCount > 1
            ? `Payment of ₹${totalPaid.toFixed(2)} recorded successfully across ${paymentCount} fee(s)`
            : `Payment of ₹${totalPaid.toFixed(2)} recorded successfully`
        );
        setShowPaymentForm(false);
        setSelectedFeeHeads(new Set());
        setPaymentAllocation({});
        setPaymentFormData({
          amountReceived: '',
          discount: '',
          paymentMethod: 'cash',
          paymentDate: new Date().toISOString().split('T')[0],
          transactionId: '',
          notes: '',
        });
        setSelectedFeeStructure(null);
        setSelectedFeeHeads(new Set());
        setPaymentAllocation({});

        // Reload fee structures and payments
        await loadStudentFeeStructures(studentDetails.id, academicYearId);
        
        // Refresh fee breakdown
        if (studentDetails && academicYearId) {
          generateFeeBreakdown(
            studentDetails.id,
            academicYearId,
            studentDetails.classId || studentDetails.class?.id,
          );
        }

        setTimeout(() => setSuccess(''), 5000);
      } catch (err: any) {
        console.error('Error recording payment:', err);
        console.error('Error response:', err.response);
        console.error('Error response data:', err.response?.data);
        
        let errorMessage = 'Failed to record payment';
        if (err.response?.data) {
          if (typeof err.response.data === 'string') {
            errorMessage = err.response.data;
          } else if (err.response.data.message) {
            errorMessage = Array.isArray(err.response.data.message) 
              ? err.response.data.message.join(', ')
              : err.response.data.message;
          } else if (err.response.data.error) {
            errorMessage = err.response.data.error;
          }
        } else if (err.message) {
          errorMessage = err.message;
        }
        
        setError(errorMessage);
      } finally {
        setRecordingPayment(false);
      }
      return;
    }

    // Legacy single-fee payment (for backward compatibility)
    if (!selectedFeeStructure) {
      setError('Please select a fee to pay');
      return;
    }

    const amount = parseFloat(paymentFormData.amountReceived) || parseFloat(paymentFormData.amount || '0');
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid payment amount');
      return;
    }

    // Get balance from fee breakdown (matches what's displayed in table)
    const feeBreakdownItem = feeBreakdown.find((f) => f.feeStructureId === selectedFeeStructure.feeStructureId);
    const totalAmount = feeBreakdownItem 
      ? feeBreakdownItem.total 
      : parseFloat(selectedFeeStructure.amount.toString());
    const paidAmount = feeBreakdownItem 
      ? feeBreakdownItem.received 
      : getPaidAmountForFee(selectedFeeStructure.feeStructureId);
    const remainingBalance = feeBreakdownItem 
      ? feeBreakdownItem.balance 
      : (totalAmount - paidAmount);

    if (amount > remainingBalance) {
      setError(`Payment amount (₹${amount.toFixed(2)}) exceeds remaining balance (₹${remainingBalance.toFixed(2)})`);
      return;
    }

    setRecordingPayment(true);
    setError('');

    try {
      // If there are multiple installments, find unpaid ones and pay against them
      const allInstallments = studentFeeStructures.filter(
        (sfs) => sfs.feeStructureId === selectedFeeStructure.feeStructureId
      );
      
      let remainingPaymentAmount = amount;
      const paymentsToCreate: any[] = [];
      
      if (allInstallments.length > 1) {
        // Multiple installments - pay against unpaid ones starting from oldest
        const unpaidInstallments = allInstallments
          .map((sfs) => {
            const paid = payments
              .filter((p) => p.studentFeeStructureId === sfs.id && p.status === 'completed')
              .reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0);
            const balance = parseFloat(sfs.amount.toString()) - paid;
            return { sfs, balance, dueDate: sfs.dueDate ? new Date(sfs.dueDate) : new Date(0) };
          })
          .filter((item) => item.balance > 0)
          .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime()); // Oldest first
        
        for (const item of unpaidInstallments) {
          if (remainingPaymentAmount <= 0) break;
          
          const paymentForThisInstallment = Math.min(remainingPaymentAmount, item.balance);
          paymentsToCreate.push({
            studentId: Number(studentDetails.id),
            studentFeeStructureId: Number(item.sfs.id),
            amount: Number(paymentForThisInstallment.toFixed(2)),
            paymentDate: paymentFormData.paymentDate,
            paymentMethod: paymentFormData.paymentMethod || 'cash',
            transactionId: paymentFormData.transactionId?.trim() || undefined,
            notes: paymentFormData.notes?.trim() || undefined,
            schoolId: selectedSchoolId ? Number(selectedSchoolId) : undefined,
          });
          
          remainingPaymentAmount -= paymentForThisInstallment;
        }
        
        if (remainingPaymentAmount > 0) {
          setError(`Payment amount exceeds total outstanding balance. Maximum payment: ₹${(amount - remainingPaymentAmount).toFixed(2)}`);
          setRecordingPayment(false);
          return;
        }
      } else {
        // Single installment - pay against it
        const paymentData: any = {
          studentId: Number(studentDetails.id),
          studentFeeStructureId: Number(selectedFeeStructure.id),
          amount: Number(amount.toFixed(2)),
          paymentDate: paymentFormData.paymentDate,
          paymentMethod: paymentFormData.paymentMethod || 'cash',
        };
        
        if (paymentFormData.transactionId?.trim()) {
          paymentData.transactionId = paymentFormData.transactionId.trim();
        }
        if (paymentFormData.notes?.trim()) {
          paymentData.notes = paymentFormData.notes.trim();
        }
        if (selectedSchoolId) {
          paymentData.schoolId = Number(selectedSchoolId);
        }
        
        paymentsToCreate.push(paymentData);
      }
      
      console.log('Creating payment(s) with data:', JSON.stringify(paymentsToCreate, null, 2));
      
      // Create all payments
      for (const paymentData of paymentsToCreate) {
        await paymentsService.create(paymentData);
      }

      const paymentCount = paymentsToCreate.length;
      const totalPaid = paymentsToCreate.reduce((sum, p) => sum + p.amount, 0);
      setSuccess(
        paymentCount > 1
          ? `Payment of ₹${totalPaid.toFixed(2)} recorded successfully across ${paymentCount} installment(s)`
          : `Payment of ₹${amount.toFixed(2)} recorded successfully`
      );
      setShowPaymentForm(false);
      setSelectedFeeStructure(null);
      setSelectedFeeHeads(new Set());
      setPaymentAllocation({});
      setPaymentFormData({
        amountReceived: '',
        discount: '',
        paymentMethod: 'cash',
        paymentDate: new Date().toISOString().split('T')[0],
        transactionId: '',
        notes: '',
      });

      // Reload fee structures and payments
      await loadStudentFeeStructures(studentDetails.id, academicYearId);
      
      // Refresh fee breakdown
      if (studentDetails && academicYearId) {
        generateFeeBreakdown(
          studentDetails.id,
          academicYearId,
          studentDetails.classId || studentDetails.class?.id,
        );
      }

      setTimeout(() => setSuccess(''), 5000);
    } catch (err: any) {
      console.error('Error recording payment:', err);
      console.error('Error response:', err.response);
      console.error('Error response data:', err.response?.data);
      
      // Extract detailed error message
      let errorMessage = 'Failed to record payment';
      if (err.response?.data) {
        if (typeof err.response.data === 'string') {
          errorMessage = err.response.data;
        } else if (err.response.data.message) {
          errorMessage = Array.isArray(err.response.data.message) 
            ? err.response.data.message.join(', ')
            : err.response.data.message;
        } else if (err.response.data.error) {
          errorMessage = err.response.data.error;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setRecordingPayment(false);
    }
  };

  const handleGenerateFees = () => {
    if (!studentDetails || !academicYearId) {
      setError('Please search for a student first');
      return;
    }

    if (feeBreakdown.length === 0) {
      setError('No fees to generate. Please ensure fee breakdown is loaded.');
      return;
    }

    // Get fee structure IDs from breakdown (excluding opening balance and bus fee)
    const feeStructureIds = feeBreakdown
      .filter((f) => f.feeStructureId > 0)
      .map((f) => f.feeStructureId);

    console.log('Fee breakdown:', feeBreakdown);
    console.log('Fee structure IDs to generate:', feeStructureIds);

    if (feeStructureIds.length === 0) {
      setError('No fee structures to generate. Please ensure fee plans are assigned to this class.');
      return;
    }

    if (!selectedSchoolId) {
      setError('School ID is required. Please select a school.');
      return;
    }

    const data: GenerateFeesDto = {
      studentIds: [studentDetails.id],
      academicYearId,
      feeStructureIds,
      dueDate: format(new Date(), 'yyyy-MM-dd'),
      schoolId: selectedSchoolId || undefined, // Include schoolId for super_admin
      regenerateExisting: true, // Allow regenerating existing fees
    };

    console.log('Generating fees with data:', JSON.stringify(data, null, 2));
    generateMutation.mutate(data);
  };

  // Calculate month columns
  const monthColumns = useMemo(() => {
    if (!academicYearId || academicYears.length === 0) return [];
    const academicYear = academicYears.find((y) => y.id === academicYearId);
    if (!academicYear) return [];

    const academicYearStart = new Date(academicYear.startDate);
    const previousMonth = subMonths(new Date(), 1);
    const months = eachMonthOfInterval({
      start: startOfMonth(academicYearStart),
      end: endOfMonth(previousMonth),
    });

    return months.map((month) => format(month, 'MMM yy'));
  }, [academicYearId, academicYears]);

  // Calculate totals
  const totals = useMemo(() => {
    const monthlyTotals: Record<string, number> = {};
    let grandTotal = 0;
    let grandReceived = 0;
    let grandBalance = 0;

    monthColumns.forEach((month) => {
      monthlyTotals[month] = 0;
    });

    feeBreakdown.forEach((fee) => {
      grandTotal += fee.total;
      grandReceived += fee.received;
      grandBalance += fee.balance;
      monthColumns.forEach((month) => {
        monthlyTotals[month] += fee.monthlyAmounts[month] || 0;
      });
    });

    return { monthlyTotals, grandTotal, grandReceived, grandBalance };
  }, [feeBreakdown, monthColumns]);

  // Payment history columns
  const paymentHistoryColumns: ColumnDef<any>[] = useMemo(() => [
    {
      accessorKey: 'receiptNumber',
      header: 'Receipt Number',
      cell: ({ row }) => {
        const receipt = row.getValue('receiptNumber') as string;
        return receipt ? (
          <span className="font-mono text-sm font-semibold">{receipt}</span>
        ) : (
          <span className="text-gray-400">-</span>
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
        const amount = parseFloat(row.getValue('amount') as string);
        return <span className="font-semibold text-green-600">₹{amount.toLocaleString()}</span>;
      },
    },
    {
      accessorKey: 'paymentMethod',
      header: 'Payment Method',
      cell: ({ row }) => {
        const method = row.getValue('paymentMethod') as string;
        return <span className="capitalize">{method.replace('_', ' ')}</span>;
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
            Payment Date
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const date = row.getValue('paymentDate') as string;
        return <span>{format(new Date(date), 'MMM dd, yyyy')}</span>;
      },
    },
    {
      accessorKey: 'studentFeeStructure',
      header: 'Fee',
      cell: ({ row }) => {
        const payment = row.original;
        return (
          <span className="text-sm">
            {payment.studentFeeStructure?.feeStructure?.name || 'Unknown Fee'}
          </span>
        );
      },
    },
    {
      accessorKey: 'transactionId',
      header: 'Transaction ID',
      cell: ({ row }) => {
        const txnId = row.getValue('transactionId') as string;
        return txnId ? (
          <span className="font-mono text-xs">{txnId}</span>
        ) : (
          <span className="text-gray-400">-</span>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue('status') as string;
        const statusConfig = {
          completed: { icon: FiCheckCircle, color: 'bg-green-100 text-green-800', label: 'Completed' },
          pending: { icon: FiLoader, color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
          failed: { icon: FiXCircle, color: 'bg-red-100 text-red-800', label: 'Failed' },
          refunded: { icon: FiXCircle, color: 'bg-gray-100 text-gray-800', label: 'Refunded' },
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
  ], []);

  return (
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/super-admin">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/super-admin/finance">Finance</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbPage>Fee Generation</BreadcrumbPage>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
            Fee Generation
          </CardTitle>
          <CardDescription>
            Search student by ID and generate fees up to previous month
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Success/Error Messages */}
      {success && (
        <Card className="border-l-4 border-l-green-400 bg-green-50">
          <CardContent className="py-3 px-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-green-700 font-medium">{success}</p>
              {studentDetails && (
                <Button
                  size="sm"
                  variant="outline"
                  className="ml-4"
                  onClick={handlePayNow}
                >
                  <DollarSign className="mr-2 h-4 w-4" />
                  Pay Now
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      {error && (
        <Card className="border-l-4 border-l-red-400 bg-red-50">
          <CardContent className="py-3 px-4">
            <p className="text-sm text-red-700 font-medium">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Student Search */}
      <Card>
        <CardHeader>
          <CardTitle>Search Student</CardTitle>
          <CardDescription>Enter student ID to fetch details and generate fees</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label>Academic Year</Label>
              <Select
                value={academicYearId?.toString() || ''}
                onValueChange={(value) => setAcademicYearId(parseInt(value))}
                disabled={loadingAcademicYears}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select academic year" />
                </SelectTrigger>
                <SelectContent>
                  {academicYears.map((year) => (
                    <SelectItem key={year.id} value={year.id.toString()}>
                      {year.name} {year.isCurrent && '(Current)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label>Student ID</Label>
              <Input
                placeholder="Enter student ID"
                value={studentSearchId}
                onChange={(e) => setStudentSearchId(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSearchStudent();
                  }
                }}
              />
            </div>
            <Button onClick={handleSearchStudent} disabled={loadingStudent || !studentSearchId.trim()}>
              {loadingStudent ? (
                <>
                  <FiLoader className="mr-2 h-4 w-4 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <FiSearch className="mr-2 h-4 w-4" />
                  Search
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Student Details */}
      {studentDetails && (
        <Card>
          <CardHeader>
            <CardTitle>Student Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label className="text-xs text-gray-500">Name</Label>
                <p className="font-semibold">
                  {studentDetails.firstName} {studentDetails.lastName}
                </p>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Father Name</Label>
                <p className="font-semibold">{studentDetails.parentName || '-'}</p>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Contact Number</Label>
                <p className="font-semibold">{studentDetails.parentPhone || '-'}</p>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Address</Label>
                <p className="font-semibold">{studentDetails.address || '-'}</p>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Class</Label>
                <p className="font-semibold">{studentDetails.class?.name || '-'}</p>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Fee Category</Label>
                <p className="font-semibold">{studentDetails.categoryHead?.name || '-'}</p>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Route</Label>
                <p className="font-semibold">{studentDetails.route?.name || '-'}</p>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Opening Balance</Label>
                <p className="font-semibold">
                  ₹{studentDetails.openingBalance?.toLocaleString() || '0'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Fee Breakdown Table */}
      {studentDetails && feeBreakdown.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Fee Breakdown</CardTitle>
            <CardDescription>Monthly fee breakdown up to previous month</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingBreakdown ? (
              <div className="flex justify-center py-8">
                <FiLoader className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2 font-semibold">Fee Head</th>
                      {monthColumns.map((month) => (
                        <th key={month} className="text-right p-2 font-semibold">
                          {month}
                        </th>
                      ))}
                      <th className="text-right p-2 font-semibold">Total</th>
                      <th className="text-right p-2 font-semibold">Received</th>
                      <th className="text-right p-2 font-semibold">Balance</th>
                      <th className="text-center p-2 font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {feeBreakdown.map((fee, idx) => {
                      // Only show payment button for actual fee structures (not opening balance or transport fee)
                      const canPay = fee.feeStructureId > 0 && fee.balance > 0;
                      const studentFeeStructure = fee.feeStructureId > 0 ? getStudentFeeStructure(fee.feeStructureId) : null;
                      
                      return (
                        <tr key={idx} className="border-b">
                          <td className="p-2 font-medium">{fee.feeHead}</td>
                          {monthColumns.map((month) => (
                            <td key={month} className="text-right p-2">
                              {fee.monthlyAmounts[month] ? `₹${fee.monthlyAmounts[month].toLocaleString()}` : '-'}
                            </td>
                          ))}
                          <td className="text-right p-2 font-semibold">
                            ₹{fee.total.toLocaleString()}
                          </td>
                          <td className="text-right p-2 text-green-600">
                            ₹{fee.received.toLocaleString()}
                          </td>
                          <td className="text-right p-2 text-red-600">
                            ₹{fee.balance.toLocaleString()}
                          </td>
                          <td className="text-center p-2">
                            {canPay && studentFeeStructure ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handlePayFee(fee.feeStructureId)}
                                className="h-8"
                              >
                                <FiDollarSign className="h-3 w-3 mr-1" />
                                Pay
                              </Button>
                            ) : (
                              <span className="text-gray-400 text-xs">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    <tr className="border-t-2 font-bold">
                      <td className="p-2">Total Amount</td>
                      {monthColumns.map((month) => (
                        <td key={month} className="text-right p-2">
                          ₹{totals.monthlyTotals[month]?.toLocaleString() || '0'}
                        </td>
                      ))}
                      <td className="text-right p-2">₹{totals.grandTotal.toLocaleString()}</td>
                      <td className="text-right p-2 text-green-600">
                        ₹{totals.grandReceived.toLocaleString()}
                      </td>
                      <td className="text-right p-2 text-red-600">
                        ₹{totals.grandBalance.toLocaleString()}
                      </td>
                      <td className="p-2"></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
            <div className="mt-4 flex justify-end gap-2">
              {studentDetails && (
                <Button
                  variant="outline"
                  onClick={handlePayNow}
                >
                  <DollarSign className="mr-2 h-4 w-4" />
                  Pay Now
                </Button>
              )}
              <Button onClick={handleGenerateFees} disabled={generateMutation.isPending}>
                {generateMutation.isPending ? (
                  <>
                    <FiLoader className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FiPlus className="mr-2 h-4 w-4" />
                    Generate Fees
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Form Section - Inline below fee breakdown */}
      {showPaymentForm && studentDetails && (
        <Card className="mt-4 border-2 border-blue-200">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Record Payment</CardTitle>
                <CardDescription>
                  Enter amount received and select fee heads in order of priority
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowPaymentForm(false);
                  setSelectedFeeHeads(new Set());
                  setPaymentAllocation({});
                  setPaymentFormData({
                    amountReceived: '',
                    discount: '',
                    paymentMethod: 'cash',
                    paymentDate: new Date().toISOString().split('T')[0],
                    transactionId: '',
                    notes: '',
                  });
                }}
              >
                ✕
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Amount Received */}
              <div>
                <Label htmlFor="amountReceived">Amount Received *</Label>
                <Input
                  id="amountReceived"
                  type="number"
                  step="0.01"
                  min="0"
                  value={paymentFormData.amountReceived}
                  onChange={(e) => handleAmountReceivedChange(e.target.value)}
                  placeholder="Enter amount received"
                />
              </div>

              {/* Fee Head Priority Selection */}
              <div>
                <Label className="text-sm font-semibold mb-2 block">
                  Fee Head Priority
                </Label>
                <p className="text-xs text-gray-500 mb-3">
                  Select fee heads in order of priority. Amounts will be allocated to checked heads first.
                </p>
                <div className="space-y-2 border rounded-lg p-3">
                  {feeBreakdown
                    .filter((f) => f.balance > 0 && f.feeHead !== 'Ledger Balance (Outstanding)' && f.feeHead !== 'Ledger Balance (Credit)')
                    .map((fee) => {
                      // For Transport Fee with feeStructureId = 0, use a special identifier
                      // Otherwise use the actual feeStructureId
                      const feeId = fee.feeStructureId === 0 && fee.feeHead === 'Transport Fee' ? -1 : fee.feeStructureId;
                      const isSelected = selectedFeeHeads.has(feeId);
                      const allocation = paymentAllocation[feeId] || 0;
                      const priority = isSelected ? Array.from(selectedFeeHeads).indexOf(feeId) + 1 : null;
                      
                      return (
                        <div key={feeId} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded">
                          <Checkbox
                            id={`fee-${feeId}`}
                            checked={isSelected}
                            onCheckedChange={() => handleFeeHeadToggle(feeId)}
                          />
                          <Label
                            htmlFor={`fee-${feeId}`}
                            className="flex-1 cursor-pointer flex items-center justify-between"
                          >
                            <span className="flex items-center gap-2">
                              {priority && (
                                <Badge variant="outline" className="text-xs">
                                  Priority {priority}
                                </Badge>
                              )}
                              <span className="font-medium">{fee.feeHead}</span>
                            </span>
                            <span className="text-sm text-gray-600">
                              Balance: ₹{fee.balance.toLocaleString()}
                              {allocation > 0 && (
                                <span className="ml-2 text-green-600 font-semibold">
                                  → ₹{allocation.toLocaleString()}
                                </span>
                              )}
                            </span>
                          </Label>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Allocation Summary */}
              {(Object.keys(paymentAllocation).length > 0 || paymentFormData.amountReceived || paymentFormData.discount) && (() => {
                const amountReceived = parseFloat(paymentFormData.amountReceived) || 0;
                const discount = parseFloat(paymentFormData.discount) || 0;
                const netAmount = Math.max(0, amountReceived - discount);
                const totalAllocated = Object.values(paymentAllocation).reduce((sum, amt) => sum + amt, 0);
                
                return (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm font-semibold mb-2">Payment Allocation:</p>
                    <div className="space-y-1 text-sm">
                      {amountReceived > 0 && (
                        <div className="flex justify-between text-gray-600">
                          <span>Amount Received:</span>
                          <span>₹{amountReceived.toLocaleString()}</span>
                        </div>
                      )}
                      {discount > 0 && (
                        <div className="flex justify-between text-orange-600">
                          <span>Discount:</span>
                          <span>- ₹{discount.toLocaleString()}</span>
                        </div>
                      )}
                      {(amountReceived > 0 || discount > 0) && (
                        <div className="flex justify-between font-semibold border-t pt-1 mt-1">
                          <span>Net Amount:</span>
                          <span>₹{netAmount.toLocaleString()}</span>
                        </div>
                      )}
                      {Object.entries(paymentAllocation).map(([feeId, amount]) => {
                        // Handle Transport Fee with special ID -1
                        const feeIdNum = Number(feeId);
                        let fee;
                        if (feeIdNum === -1) {
                          // Transport Fee uses -1, but breakdown has feeStructureId = 0
                          fee = feeBreakdown.find((f) => f.feeHead === 'Transport Fee');
                        } else {
                          fee = feeBreakdown.find((f) => f.feeStructureId === feeIdNum);
                        }
                        const feeName = fee?.feeHead?.trim() || (feeIdNum === -1 ? 'Transport Fee' : `Fee ID ${feeId}`);
                        return (
                          <div key={feeId} className="flex justify-between">
                            <span>{feeName}:</span>
                            <span className="font-semibold">₹{amount.toLocaleString()}</span>
                          </div>
                        );
                      })}
                      {totalAllocated > 0 && (
                        <div className="border-t pt-1 mt-1 flex justify-between font-semibold">
                          <span>Total Allocated:</span>
                          <span>₹{totalAllocated.toLocaleString()}</span>
                        </div>
                      )}
                      {netAmount > totalAllocated && (
                        <div className="text-xs text-gray-500 mt-1">
                          Unallocated: ₹{(netAmount - totalAllocated).toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Payment Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="discount">Discount</Label>
                  <Input
                    id="discount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={paymentFormData.discount}
                    onChange={(e) => handleDiscountChange(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="paymentMethod">Payment Method *</Label>
                  <Select
                    value={paymentFormData.paymentMethod}
                    onValueChange={(value: any) => setPaymentFormData({ ...paymentFormData, paymentMethod: value })}
                  >
                    <SelectTrigger>
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
                <Label htmlFor="transactionId">Transaction ID / Receipt No</Label>
                <Input
                  id="transactionId"
                  value={paymentFormData.transactionId}
                  onChange={(e) => setPaymentFormData({ ...paymentFormData, transactionId: e.target.value })}
                  placeholder="Optional - for bank transfers, cards, receipt number, etc."
                />
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={paymentFormData.notes}
                  onChange={(e) => setPaymentFormData({ ...paymentFormData, notes: e.target.value })}
                  placeholder="Optional additional notes"
                  rows={3}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowPaymentForm(false);
                    setSelectedFeeHeads(new Set());
                    setPaymentAllocation({});
                    setPaymentFormData({
                      amountReceived: '',
                      discount: '',
                      paymentMethod: 'cash',
                      paymentDate: new Date().toISOString().split('T')[0],
                      transactionId: '',
                      notes: '',
                    });
                  }}
                  disabled={recordingPayment}
                >
                  Cancel
                </Button>
                <Button onClick={handleRecordPayment} disabled={recordingPayment}>
                  {recordingPayment ? (
                    <>
                      <FiLoader className="mr-2 h-4 w-4 animate-spin" />
                      Recording...
                    </>
                  ) : (
                    <>
                      <FiDollarSign className="mr-2 h-4 w-4" />
                      Save Payment
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment History */}
      {studentDetails && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Payment History</CardTitle>
                <CardDescription>
                  Previous payments for {studentDetails.firstName} {studentDetails.lastName} ({studentDetails.studentId})
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {payments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FiDollarSign className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>No payments recorded yet</p>
              </div>
            ) : (
              <DataTable
                columns={paymentHistoryColumns}
                data={payments.filter((p) => p.status === 'completed')}
                loading={false}
                searchKey="receiptNumber"
              />
            )}
          </CardContent>
        </Card>
      )}

    </div>
  );
}
