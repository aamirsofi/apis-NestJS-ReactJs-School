import api from './api';
import { Student } from '../types';

export const studentsService = {
  async getAll(schoolId?: number): Promise<Student[]> {
    const params: any = {};
    if (schoolId) {
      params.schoolId = schoolId;
    }
    const response = await api.instance.get<Student[]>('/students', { params });
    return response.data;
  },

  async getById(id: number): Promise<Student> {
    const response = await api.instance.get<Student>(`/students/${id}`);
    return response.data;
  },

  async create(data: Partial<Student>, schoolId?: number): Promise<Student> {
    const params: any = {};
    if (schoolId) {
      params.schoolId = schoolId;
    }
    const response = await api.instance.post<Student>('/students', data, { params });
    return response.data;
  },

  async update(id: number, data: Partial<Student>): Promise<Student> {
    const response = await api.instance.patch<Student>(`/students/${id}`, data);
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await api.instance.delete(`/students/${id}`);
  },

  async getLastStudentId(schoolId?: number): Promise<{ lastStudentId: number | null; nextStudentId: number }> {
    const params: any = {};
    if (schoolId) {
      params.schoolId = schoolId;
    }
    const response = await api.instance.get<{ lastStudentId: number | null; nextStudentId: number }>('/students/last-id', { params });
    return response.data;
  },

  async search(schoolId: number, query: string): Promise<Student[]> {
    const trimmedQuery = query.trim();
    
    if (!trimmedQuery || trimmedQuery.length < 2) {
      return [];
    }
    
    const params: any = { schoolId };
    const lowerQuery = trimmedQuery.toLowerCase();
    
    // Try exact studentId match first (backend search)
    // If it looks like a student ID (mostly alphanumeric, no spaces), try backend search
    if (/^[A-Z0-9-]+$/i.test(trimmedQuery)) {
      params.studentId = trimmedQuery;
      const response = await api.instance.get<Student[]>('/students', { params });
      const exactMatches = response.data;
      
      // If we got exact matches, return them
      if (exactMatches.length > 0) {
        return exactMatches;
      }
    }
    
    // Fallback: fetch all students for the school and filter client-side
    // This is necessary because backend doesn't support name-based search
    const allResponse = await api.instance.get<Student[]>('/students', { params: { schoolId } });
    const allStudents = allResponse.data;
    
    // Filter by name, studentId, or email
    return allStudents.filter(
      (student) => {
        const fullName = `${student.firstName || ''} ${student.lastName || ''}`.toLowerCase();
        const studentId = student.studentId?.toLowerCase() || '';
        const email = student.email?.toLowerCase() || '';
        
        return (
          fullName.includes(lowerQuery) ||
          studentId.includes(lowerQuery) ||
          email.includes(lowerQuery)
        );
      }
    );
  },
};

