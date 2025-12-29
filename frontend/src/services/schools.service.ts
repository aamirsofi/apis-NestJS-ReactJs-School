import api from './api';
import { School } from '../types';

export const schoolsService = {
  async getAll(): Promise<School[]> {
    const response = await api.instance.get<School[]>('/schools');
    return response.data;
  },

  async getById(id: number): Promise<School> {
    const response = await api.instance.get<School>(`/schools/${id}`);
    return response.data;
  },

  async create(data: Partial<School>): Promise<School> {
    const response = await api.instance.post<School>('/schools', data);
    return response.data;
  },

  async update(id: number, data: Partial<School>): Promise<School> {
    const response = await api.instance.patch<School>(`/schools/${id}`, data);
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await api.instance.delete(`/schools/${id}`);
  },
};

