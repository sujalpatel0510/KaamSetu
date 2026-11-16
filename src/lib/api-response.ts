import { NextResponse } from 'next/server';

export interface ApiResponseOptions {
  status?: number;
  headers?: Record<string, string>;
}

/**
 * Domain error carrying an HTTP status. Thrown inside route handlers and
 * Prisma transactions; caught by the route's catch block to map to a status.
 */
export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number = 400) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/** Extracts an HTTP status from a thrown error (ApiError-aware). */
export function errorStatus(err: unknown): number {
  if (err instanceof ApiError && Number.isInteger(err.status)) return err.status;
  return 400;
}

export class ApiResponse {
  static success<T>(data: T, message?: string, options: ApiResponseOptions = {}) {
    return NextResponse.json(
      {
        success: true,
        ...(message && { message }),
        ...(data !== undefined && typeof data === 'object' && !Array.isArray(data) ? data : { data }),
      },
      {
        status: options.status || 200,
        headers: options.headers,
      }
    );
  }

  static created<T>(data: T, message?: string) {
    return this.success(data, message, { status: 201 });
  }

  static error(message: string, status: number = 400, details?: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: message,
        ...(details ? { details } : {}),
      },
      { status }
    );
  }

  static unauthorized(message: string = 'Authentication required') {
    return this.error(message, 401);
  }

  static forbidden(message: string = 'Access denied: insufficient permissions') {
    return this.error(message, 403);
  }

  static notFound(message: string = 'Resource not found') {
    return this.error(message, 404);
  }

  static internal(message: string = 'Internal server error') {
    return this.error(message, 500);
  }
}
