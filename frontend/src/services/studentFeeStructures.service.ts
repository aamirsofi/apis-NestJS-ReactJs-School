import api from './api';
import { extractArrayData, extractApiData } from '@/utils/apiHelpers';

export interface StudentFeeStructure {
  id: number;
  studentId: number;
  feeStructureId: number;
  academicYearId: number;
  academicRecordId?: number;
  amount: number;
  originalAmount?: number;
  discountAmount: number;
  discountPercentage?: number;
  dueDate: string;
  installmentStartDate?: string;
  installmentCount?: number;
  installmentNumber?: number;
  installmentAmount?: number;
  status: 'pending' | 'paid' | 'overdue';
  student?: {
    id: number;
    studentId: string;
    firstName: string;
    lastName: string;
  };
  feeStructure?: {
    id: number;
    name: string;
    amount: number;
  };
  academicYear?: {
    id: number;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

export const studentFeeStructuresService = {
  async getAll(
    studentId?: number,
    academicYearId?: number,
    schoolId?: number,
  ): Promise<StudentFeeStructure[]> {
    const params: any = {};
    if (studentId) params.studentId = studentId;
    if (academicYearId) params.academicYearId = academicYearId;
    if (schoolId) params.schoolId = schoolId;

    const response = await api.instance.get('/student-fee-structures', { params });
    return extractArrayData<StudentFeeStructure>(response) || response.data || [];
  },

  async getById(id: number): Promise<StudentFeeStructure> {
    const response = await api.instance.get<StudentFeeStructure>(`/student-fee-structures/${id}`);
    return extractApiData<StudentFeeStructure>(response) || response.data;
  },
};

