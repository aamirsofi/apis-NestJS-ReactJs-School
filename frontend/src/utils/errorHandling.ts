/**
 * Utility types and functions for error handling
 */

export interface ApiError {
  response?: {
    data?: {
      message?: string;
      error?: string;
    };
    status?: number;
  };
  message?: string;
}

/**
 * Extracts error message from an error object
 */
export function getErrorMessage(error: unknown, defaultMessage: string = "An error occurred"): string {
  if (error && typeof error === "object" && "response" in error) {
    const apiError = error as ApiError;
    return apiError.response?.data?.message || apiError.response?.data?.error || apiError.message || defaultMessage;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return defaultMessage;
}

/**
 * Type guard to check if error is an API error
 */
export function isApiError(error: unknown): error is ApiError {
  return (
    error !== null &&
    typeof error === "object" &&
    "response" in error &&
    typeof (error as ApiError).response === "object"
  );
}

