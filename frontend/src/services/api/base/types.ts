import { ApiResponse } from "../../../types";

// Standardized API response format from backend improvements
export interface StandardApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  pagination?: {
    count?: number;
    total_items?: number;
    next?: string;
    previous?: string;
    next_page?: number;
    previous_page?: number;
    page: number;
    page_size: number;
    total_pages: number;
  };
  timestamp: string;
}

// Custom error classes for better error handling
export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string,
    public details?: any,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export class NetworkError extends Error {
  constructor(
    message: string = "Network error - please check your connection",
  ) {
    super(message);
    this.name = "NetworkError";
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public field?: string,
  ) {
    super(message);
    this.name = "ValidationError";
  }
}

// Request configuration interface
export interface RequestConfig {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

// Service configuration interface
export interface ServiceConfig {
  baseURL: string;
  timeout: number;
  retries: number;
  retryDelay: number;
}
