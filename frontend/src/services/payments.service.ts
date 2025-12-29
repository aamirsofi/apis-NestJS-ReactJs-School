import api from './api';
import { Payment } from '../types';

export const paymentsService = {
  async getAll(studentId?: number): Promise<Payment[]> {
    const url = studentId ? `/payments?studentId=${studentId}` : '/payments';
    const response = await api.instance.get<Payment[]>(url);
    return response.data;
  },

  async getById(id: number): Promise<Payment> {
    const response = await api.instance.get<Payment>(`/payments/${id}`);
    return response.data;
  },

  async create(data: Partial<Payment>): Promise<Payment> {
    const response = await api.instance.post<Payment>('/payments', data);
    return response.data;
  },

  async update(id: number, data: Partial<Payment>): Promise<Payment> {
    const response = await api.instance.patch<Payment>(`/payments/${id}`, data);
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await api.instance.delete(`/payments/${id}`);
  },
};

