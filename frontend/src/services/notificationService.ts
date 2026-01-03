import api from './api';

export interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'payment' | 'fee_due' | 'announcement';
  status: 'unread' | 'read' | 'archived';
  link?: string;
  icon?: string;
  userId?: number;
  schoolId?: number;
  isBroadcast: boolean;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationResponse {
  data: Notification[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const notificationService = {
  async getAll(params?: {
    page?: number;
    limit?: number;
    schoolId?: number;
  }): Promise<NotificationResponse> {
    const response = await api.instance.get('/notifications', { params });
    return response.data;
  },

  async getUnreadCount(schoolId?: number): Promise<number> {
    const response = await api.instance.get('/notifications/unread-count', {
      params: { schoolId },
    });
    return response.data;
  },

  async getById(id: number): Promise<Notification> {
    const response = await api.instance.get(`/notifications/${id}`);
    return response.data;
  },

  async markAsRead(id: number): Promise<Notification> {
    const response = await api.instance.patch(`/notifications/${id}/read`);
    return response.data;
  },

  async markAllAsRead(schoolId?: number): Promise<void> {
    await api.instance.post('/notifications/mark-all-read', null, {
      params: { schoolId },
    });
  },

  async create(data: {
    title: string;
    message: string;
    type?: Notification['type'];
    userId?: number;
    schoolId?: number;
    isBroadcast?: boolean;
    link?: string;
  }): Promise<Notification> {
    const response = await api.instance.post('/notifications', data);
    return response.data;
  },

  async createBroadcast(data: {
    title: string;
    message: string;
    type?: Notification['type'];
    schoolId?: number;
    link?: string;
  }): Promise<Notification> {
    const response = await api.instance.post('/notifications/broadcast', data, {
      params: { schoolId: data.schoolId },
    });
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await api.instance.delete(`/notifications/${id}`);
  },
};


