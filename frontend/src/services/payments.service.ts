import api from './api';
import { Payment } from '../types';
import { extractArrayData, extractApiData } from '@/utils/apiHelpers';

export interface CreatePaymentData {
  studentId: number;
  studentFeeStructureId: number; // Changed from feeStructureId
  amount: number;
  paymentMethod: 'cash' | 'bank_transfer' | 'card' | 'online' | 'cheque';
  paymentDate: string;
  transactionId?: string;
  receiptNumber?: string;
  notes?: string;
  status?: 'pending' | 'completed' | 'failed' | 'refunded';
  schoolId?: number; // Optional: for super_admin or when school context is not available
}

export const paymentsService = {
  async getAll(studentId?: number, studentFeeStructureId?: number): Promise<Payment[]> {
    const params: any = {};
    if (studentId) params.studentId = studentId;
    if (studentFeeStructureId) params.studentFeeStructureId = studentFeeStructureId;
    
    const response = await api.instance.get<Payment[]>('/payments', { params });
    return extractArrayData<Payment>(response) || response.data || [];
  },

  async getById(id: number): Promise<Payment> {
    const response = await api.instance.get<Payment>(`/payments/${id}`);
    return extractApiData<Payment>(response) || response.data;
  },

  async create(data: CreatePaymentData): Promise<Payment> {
    const response = await api.instance.post<Payment>('/payments', data);
    return extractApiData<Payment>(response) || response.data;
  },

  async update(id: number, data: Partial<CreatePaymentData>): Promise<Payment> {
    const response = await api.instance.patch<Payment>(`/payments/${id}`, data);
    return extractApiData<Payment>(response) || response.data;
  },

  async delete(id: number): Promise<void> {
    await api.instance.delete(`/payments/${id}`);
  },
};

