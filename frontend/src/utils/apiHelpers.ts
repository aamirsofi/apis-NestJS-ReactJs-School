import { AxiosResponse } from 'axios';

/**
 * Standard API Response Format
 */
export interface StandardApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

/**
 * Extract data from API response, handling both paginated and direct responses
 */
export function extractApiData<T>(response: AxiosResponse<any>): T {
  const responseData = response.data;

  // Handle standard format { success: true, data: [...], meta: {...} }
  if (responseData && typeof responseData === 'object' && 'success' in responseData) {
    return responseData.data;
  }

  // Handle paginated format { data: [...], meta: {...} }
  if (responseData && typeof responseData === 'object' && 'data' in responseData && 'meta' in responseData) {
    return responseData.data;
  }

  // Handle direct array or object response
  if (Array.isArray(responseData) || (responseData && typeof responseData === 'object')) {
    return responseData;
  }

  // Fallback: return as-is
  return responseData;
}

/**
 * Extract pagination meta from API response
 */
export function extractApiMeta(response: AxiosResponse<any>): StandardApiResponse<any>['meta'] {
  const responseData = response.data;

  // Handle standard format
  if (responseData && typeof responseData === 'object' && 'meta' in responseData) {
    return responseData.meta;
  }

  return undefined;
}

/**
 * Check if response is successful
 */
export function isApiSuccess(response: AxiosResponse<any>): boolean {
  const responseData = response.data;

  if (responseData && typeof responseData === 'object' && 'success' in responseData) {
    return responseData.success === true;
  }

  // If no success field, assume success if status is 2xx
  return response.status >= 200 && response.status < 300;
}

/**
 * Safe array extraction - always returns an array
 */
export function extractArrayData<T>(response: AxiosResponse<any>): T[] {
  const data = extractApiData<T[]>(response);
  
  if (Array.isArray(data)) {
    return data;
  }
  
  // If data is not an array, return empty array
  console.warn('Expected array but got:', typeof data, data);
  return [];
}


