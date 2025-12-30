import api from './api';
import { User } from '../types';

export interface UpdateProfileDto {
  name?: string;
  email?: string;
  password?: string;
  currentPassword?: string;
}

export const usersService = {
  async getUserById(id: number): Promise<User> {
    const response = await api.instance.get<User>(`/users/${id}`);
    return response.data;
  },

  async updateProfile(id: number, data: UpdateProfileDto): Promise<User> {
    const response = await api.instance.patch<User>(`/users/${id}`, data);
    return response.data;
  },

  async updatePassword(id: number, currentPassword: string, newPassword: string): Promise<void> {
    await api.instance.patch(`/users/${id}`, {
      currentPassword,
      password: newPassword,
    });
  },
};

