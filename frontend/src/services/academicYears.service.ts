import api from './api';
import { AcademicYear } from '../types';

export const academicYearsService = {
  async getAll(schoolId?: number): Promise<AcademicYear[]> {
    const params: any = {};
    if (schoolId) {
      params.schoolId = schoolId;
    }
    const response = await api.instance.get<AcademicYear[]>('/academic-years', { params });
    return response.data;
  },

  async getCurrent(schoolId?: number): Promise<AcademicYear> {
    const params: any = {};
    if (schoolId) {
      params.schoolId = schoolId;
    }
    const response = await api.instance.get<AcademicYear>('/academic-years/current', { params });
    return response.data;
  },

  async getById(id: number): Promise<AcademicYear> {
    const response = await api.instance.get<AcademicYear>(`/academic-years/${id}`);
    return response.data;
  },

  async create(data: Partial<AcademicYear>, schoolId?: number): Promise<AcademicYear> {
    const params: any = {};
    if (schoolId) {
      params.schoolId = schoolId;
    }
    const response = await api.instance.post<AcademicYear>('/academic-years', data, { params });
    return response.data;
  },

  async update(id: number, data: Partial<AcademicYear>): Promise<AcademicYear> {
    const response = await api.instance.patch<AcademicYear>(`/academic-years/${id}`, data);
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await api.instance.delete(`/academic-years/${id}`);
  },
};

