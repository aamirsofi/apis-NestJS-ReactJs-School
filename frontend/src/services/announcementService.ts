import api from './api';

export interface Announcement {
  id: number;
  title: string;
  content: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'draft' | 'published' | 'archived';
  target: 'all' | 'students' | 'parents' | 'teachers' | 'administrators';
  publishAt?: string;
  expiresAt?: string;
  sendEmail: boolean;
  sendSMS: boolean;
  createdById: number;
  createdBy?: {
    id: number;
    name: string;
    email: string;
  };
  schoolId: number;
  school?: {
    id: number;
    name: string;
  };
  attachments?: Array<{
    name: string;
    url: string;
    type: string;
    size: number;
  }>;
  views: number;
  createdAt: string;
  updatedAt: string;
}

export interface AnnouncementResponse {
  data: Announcement[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const announcementService = {
  async getAll(params?: {
    page?: number;
    limit?: number;
    schoolId?: number;
    includeArchived?: boolean;
    target?: string;
  }): Promise<AnnouncementResponse> {
    const response = await api.instance.get('/announcements', { params });
    return response.data;
  },

  async getPublished(params?: {
    schoolId?: number;
    target?: string;
  }): Promise<Announcement[]> {
    const response = await api.instance.get('/announcements/published', {
      params,
    });
    return response.data;
  },

  async getById(id: number): Promise<Announcement> {
    const response = await api.instance.get(`/announcements/${id}`);
    return response.data;
  },

  async create(data: {
    title: string;
    content: string;
    priority?: Announcement['priority'];
    status?: Announcement['status'];
    target?: Announcement['target'];
    publishAt?: string;
    expiresAt?: string;
    sendEmail?: boolean;
    sendSMS?: boolean;
    schoolId: number;
    attachments?: Announcement['attachments'];
  }): Promise<Announcement> {
    const response = await api.instance.post('/announcements', data);
    return response.data;
  },

  async update(
    id: number,
    data: Partial<Omit<Announcement, 'id' | 'createdAt' | 'updatedAt'>>,
  ): Promise<Announcement> {
    const response = await api.instance.patch(`/announcements/${id}`, data);
    return response.data;
  },

  async publish(id: number): Promise<Announcement> {
    const response = await api.instance.patch(`/announcements/${id}/publish`);
    return response.data;
  },

  async archive(id: number): Promise<Announcement> {
    const response = await api.instance.patch(`/announcements/${id}/archive`);
    return response.data;
  },

  async incrementViews(id: number): Promise<void> {
    await api.instance.post(`/announcements/${id}/view`);
  },

  async delete(id: number): Promise<void> {
    await api.instance.delete(`/announcements/${id}`);
  },
};


