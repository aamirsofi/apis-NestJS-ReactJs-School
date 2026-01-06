import api from './api';

export interface AnalyticsOverview {
  totalRevenue: number;
  totalPayments: number;
  averagePayment: number;
  growthRate: number;
  totalSchools: number;
  totalStudents: number;
  collectionRate: number;
}

export interface RevenueData {
  id: number;
  period: string;
  totalRevenue: number;
  totalPayments: number;
  averagePayment: number;
  growthRate: number;
  paymentCount: number;
}

export interface SchoolPerformance {
  id: number;
  schoolName: string;
  totalStudents: number;
  totalRevenue: number;
  averageFee: number;
  collectionRate: number;
  growthRate: number;
  status: "excellent" | "good" | "average" | "needs_attention";
}

export const analyticsService = {
  async getOverview(schoolId?: number): Promise<AnalyticsOverview> {
    const params: any = {};
    if (schoolId) params.schoolId = schoolId;
    const response = await api.instance.get<AnalyticsOverview>('/analytics/overview', { params });
    return response.data;
  },

  async getRevenueAnalytics(schoolId?: number, fromDate?: string, toDate?: string): Promise<RevenueData[]> {
    const params: any = {};
    if (schoolId) params.schoolId = schoolId;
    if (fromDate) params.fromDate = fromDate;
    if (toDate) params.toDate = toDate;
    const response = await api.instance.get<RevenueData[]>('/analytics/revenue', { params });
    return response.data;
  },

  async getSchoolPerformance(): Promise<SchoolPerformance[]> {
    const response = await api.instance.get<SchoolPerformance[]>('/analytics/school-performance');
    return response.data;
  },
};

