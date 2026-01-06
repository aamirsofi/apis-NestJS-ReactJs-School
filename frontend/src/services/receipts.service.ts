import api from './api';
import { extractApiData } from '@/utils/apiHelpers';

export interface ReceiptData {
  receiptNumber: string;
  receiptDate: string;
  payment: {
    id: number;
    amount: number;
    paymentMethod: string;
    paymentDate: string;
    transactionId?: string;
    notes?: string;
  };
  student: {
    id: number;
    studentId: string;
    name: string;
    class: string;
  };
  fee: {
    name: string;
    totalAmount: number;
    paidAmount: number;
    remainingBalance: number;
    dueDate?: string;
  };
  school: {
    name: string;
    address?: string;
    phone?: string;
    email?: string;
    logo?: string;
  };
}

export const receiptsService = {
  async getReceiptData(paymentId: number): Promise<ReceiptData> {
    const response = await api.instance.get<ReceiptData>(`/receipts/${paymentId}`);
    return extractApiData<ReceiptData>(response) || response.data;
  },
};

