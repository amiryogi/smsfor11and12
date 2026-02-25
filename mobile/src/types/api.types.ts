/** Standard success response envelope (from backend) */
export interface ApiResponse<T> {
  success: true;
  data: T;
  meta?: PaginationMeta;
  message?: string;
}

/** Standard error response envelope */
export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
  statusCode: number;
}

/** Pagination metadata */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/** Paginated response shorthand */
export type PaginatedResponse<T> = ApiResponse<T[]>;
