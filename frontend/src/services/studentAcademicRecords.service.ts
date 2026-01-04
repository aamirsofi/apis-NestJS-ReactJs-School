import api from './api';
import { StudentAcademicRecord } from '../types';

export const studentAcademicRecordsService = {
  async getAll(studentId?: number, academicYearId?: number): Promise<StudentAcademicRecord[]> {
    const params: any = {};
    if (studentId) params.studentId = studentId;
    if (academicYearId) params.academicYearId = academicYearId;
    
    const response = await api.instance.get<StudentAcademicRecord[]>('/student-academic-records', { params });
    return response.data;
  },

  async getCurrent(studentId: number): Promise<StudentAcademicRecord | null> {
    try {
      const response = await api.instance.get<StudentAcademicRecord>(`/student-academic-records/student/${studentId}/current`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  async getById(id: number): Promise<StudentAcademicRecord> {
    const response = await api.instance.get<StudentAcademicRecord>(`/student-academic-records/${id}`);
    return response.data;
  },

  async create(data: Partial<StudentAcademicRecord>): Promise<StudentAcademicRecord> {
    const response = await api.instance.post<StudentAcademicRecord>('/student-academic-records', data);
    return response.data;
  },

  async upsert(data: Partial<StudentAcademicRecord>): Promise<StudentAcademicRecord> {
    const response = await api.instance.post<StudentAcademicRecord>('/student-academic-records/upsert', data);
    return response.data;
  },

  async update(id: number, data: Partial<StudentAcademicRecord>): Promise<StudentAcademicRecord> {
    const response = await api.instance.patch<StudentAcademicRecord>(`/student-academic-records/${id}`, data);
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await api.instance.delete(`/student-academic-records/${id}`);
  },

  async promote(data: {
    studentId: number;
    currentAcademicYearId: number;
    nextAcademicYearId: number;
    nextClassId: number;
    section?: string;
  }): Promise<StudentAcademicRecord> {
    const response = await api.instance.post<StudentAcademicRecord>('/student-academic-records/promote', data);
    return response.data;
  },
};

