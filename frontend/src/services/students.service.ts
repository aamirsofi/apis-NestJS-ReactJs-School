import api from './api';
import { Student } from '../types';

export const studentsService = {
  async getAll(): Promise<Student[]> {
    const response = await api.instance.get<Student[]>('/students');
    return response.data;
  },

  async getById(id: number): Promise<Student> {
    const response = await api.instance.get<Student>(`/students/${id}`);
    return response.data;
  },

  async create(data: Partial<Student>): Promise<Student> {
    const response = await api.instance.post<Student>('/students', data);
    return response.data;
  },

  async update(id: number, data: Partial<Student>): Promise<Student> {
    const response = await api.instance.patch<Student>(`/students/${id}`, data);
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await api.instance.delete(`/students/${id}`);
  },
};

