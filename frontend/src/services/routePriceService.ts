import api from "./api";

export interface RoutePrice {
  id: number;
  schoolId: number;
  routeId: number;
  classId: number;
  categoryHeadId: number;
  amount: number;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
  route?: {
    id: number;
    name: string;
  };
  class?: {
    id: number;
    name: string;
  };
  categoryHead?: {
    id: number;
    name: string;
  };
}

export interface Meta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface RoutePriceResponse {
  data: RoutePrice[];
  meta: Meta;
}

export const routePriceService = {
  getRoutePrices: async (params: {
    page?: number;
    limit?: number;
    schoolId?: string | number;
    search?: string;
    routeId?: number;
    classId?: number;
    categoryHeadId?: number;
  }): Promise<RoutePriceResponse | RoutePrice[]> => {
    const response = await api.instance.get("/super-admin/route-prices", {
      params: {
        page: params.page,
        limit: params.limit,
        schoolId: params.schoolId || undefined,
        search: params.search || undefined,
        routeId: params.routeId || undefined,
        classId: params.classId || undefined,
        categoryHeadId: params.categoryHeadId || undefined,
      },
    });
    // Handle both paginated and non-paginated responses
    if (response.data?.data && Array.isArray(response.data.data)) {
      return response.data as RoutePriceResponse;
    }
    return response.data as RoutePrice[];
  },

  getRoutePriceById: async (id: number): Promise<RoutePrice> => {
    const response = await api.instance.get(`/super-admin/route-prices/${id}`);
    return response.data as RoutePrice;
  },

  createRoutePrice: async (
    schoolId: string | number,
    data: {
      routeId: number;
      classId: number;
      categoryHeadId: number;
      amount: number;
      status?: 'active' | 'inactive';
    }
  ): Promise<RoutePrice> => {
    const response = await api.instance.post(
      `/super-admin/route-prices?schoolId=${schoolId}`,
      data
    );
    return response.data as RoutePrice;
  },

  updateRoutePrice: async (
    id: number,
    schoolId: string | number,
    data: {
      routeId?: number;
      classId?: number;
      categoryHeadId?: number;
      amount?: number;
      status?: 'active' | 'inactive';
    }
  ): Promise<RoutePrice> => {
    const response = await api.instance.patch(
      `/super-admin/route-prices/${id}?schoolId=${schoolId}`,
      data
    );
    return response.data as RoutePrice;
  },

  deleteRoutePrice: async (id: number, schoolId: string | number): Promise<void> => {
    await api.instance.delete(`/super-admin/route-prices/${id}?schoolId=${schoolId}`);
  },

  bulkDeleteRoutePrices: async (
    ids: number[],
    schoolId: string | number,
  ): Promise<{ deleted: number; failed: number; errors: Array<{ id: number; error: string }> }> => {
    // Ensure schoolId is a valid number
    const validSchoolId = typeof schoolId === 'number' ? schoolId : Number(schoolId);
    if (isNaN(validSchoolId)) {
      throw new Error(`Invalid schoolId: ${schoolId}`);
    }
    
    const response = await api.instance.delete(`/super-admin/route-prices/bulk`, {
      params: { schoolId: validSchoolId },
      data: { ids },
    });
    return response.data;
  },
};

