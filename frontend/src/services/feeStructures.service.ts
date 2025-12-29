import api from './api';
import { FeeStructure } from '../types';

export const feeStructuresService = {
  async getAll(): Promise<FeeStructure[]> {
    const response = await api.instance.get<FeeStructure[]>('/fee-structures');
    return response.data;
  },

  async getById(id: number): Promise<FeeStructure> {
    const response = await api.instance.get<FeeStructure>(`/fee-structures/${id}`);
    return response.data;
  },

  async create(data: Partial<FeeStructure>): Promise<FeeStructure> {
    const response = await api.instance.post<FeeStructure>('/fee-structures', data);
    return response.data;
  },

  async update(id: number, data: Partial<FeeStructure>): Promise<FeeStructure> {
    const response = await api.instance.patch<FeeStructure>(`/fee-structures/${id}`, data);
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await api.instance.delete(`/fee-structures/${id}`);
  },
};

