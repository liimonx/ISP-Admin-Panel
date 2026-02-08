import axios, { AxiosResponse, AxiosRequestConfig } from "axios";
import { ApiResponse } from "../../../types";
import {
  StandardApiResponse,
  ApiError,
  NetworkError,
  ServiceConfig,
  RequestConfig,
} from "./types";
import { API_BASE_URL, DEFAULT_CONFIG, HTTP_STATUS } from "./constants";

export abstract class BaseApiService {
  protected config: ServiceConfig;

  constructor(config?: Partial<ServiceConfig>) {
    this.config = {
      baseURL: API_BASE_URL,
      ...DEFAULT_CONFIG,
      ...config,
    };
  }

  /**
   * Handle standardized API responses
   */
  protected handleResponse<T>(response: AxiosResponse): T {
    const data = response.data;

    // Check if response is in standardized format
    if (data && typeof data === "object" && "success" in data) {
      const standardData: StandardApiResponse<T> = data;
      if (!standardData.success) {
        throw new ApiError(
          standardData.message || "API request failed",
          response.status,
          "API_ERROR",
          standardData,
        );
      }
      return standardData.data;
    }

    // If not in standardized format, return the data directly
    return data;
  }

  /**
   * Handle paginated API responses
   */
  protected handlePaginatedResponse<T>(
    response: AxiosResponse,
  ): ApiResponse<T> {
    const data = response.data;

    // Handle new standardized format
    if (data.success !== undefined) {
      if (!data.success) {
        throw new ApiError(
          data.message || "API request failed",
          response.status,
          "API_ERROR",
          data,
        );
      }

      // Handle backend's subscription response format
      if (data.results && data.count !== undefined) {
        return {
          count: data.count,
          next: data.next || undefined,
          previous: data.previous || undefined,
          results: data.results,
        };
      }

      // Handle both old and new pagination formats
      const pagination = data.pagination;
      if (pagination) {
        return {
          count: pagination.total_items || pagination.count || 0,
          next: pagination.next_page
            ? `?page=${pagination.next_page}`
            : undefined,
          previous: pagination.previous_page
            ? `?page=${pagination.previous_page}`
            : undefined,
          results: data.data,
        };
      }

      // Fallback for non-paginated responses
      return {
        count: Array.isArray(data.data) ? data.data.length : 0,
        next: undefined,
        previous: undefined,
        results: Array.isArray(data.data) ? data.data : [],
      };
    }

    // Handle legacy DRF pagination format
    if (data.count !== undefined && data.results !== undefined) {
      return {
        count: data.count,
        next: data.next,
        previous: data.previous,
        results: data.results,
      };
    }

    // Fallback for any other format
    return {
      count: Array.isArray(data) ? data.length : 0,
      next: undefined,
      previous: undefined,
      results: Array.isArray(data) ? data : [],
    };
  }

  /**
   * Enhanced error handling
   */
  protected handleApiError(error: any): never {
    if (error instanceof ApiError) {
      throw error;
    }

    if (error.response) {
      const data = error.response.data;
      const status = error.response.status;

      let message = "API request failed";
      if (data?.message) {
        message = data.message;
      } else if (data?.detail) {
        message = data.detail;
      } else if (typeof data === "string") {
        message = data;
      }

      throw new ApiError(message, status, "HTTP_ERROR", data);
    } else if (error.request) {
      throw new NetworkError();
    } else {
      throw new ApiError(
        "Request failed - please try again",
        undefined,
        "REQUEST_ERROR",
      );
    }
  }

  /**
   * Retry mechanism with exponential backoff
   */
  protected async retryWithBackoff<T>(
    fn: () => Promise<T>,
    config?: RequestConfig,
  ): Promise<T> {
    const retries = config?.retries ?? this.config.retries;
    const baseDelay = config?.retryDelay ?? this.config.retryDelay;

    let lastError: any;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await fn();
      } catch (error: any) {
        lastError = error;

        // Don't retry on certain status codes
        if (
          error.response?.status &&
          [
            HTTP_STATUS.BAD_REQUEST,
            HTTP_STATUS.UNAUTHORIZED,
            HTTP_STATUS.FORBIDDEN,
            HTTP_STATUS.NOT_FOUND,
          ].includes(error.response.status)
        ) {
          throw error;
        }

        // Don't retry on the last attempt
        if (attempt === retries) {
          break;
        }

        // Only retry on rate limit or server errors
        if (
          error.response?.status === HTTP_STATUS.TOO_MANY_REQUESTS ||
          error.response?.status >= HTTP_STATUS.INTERNAL_SERVER_ERROR
        ) {
          const delay = baseDelay * Math.pow(2, attempt);
          await new Promise((resolve) => setTimeout(resolve, delay));
        } else {
          throw error;
        }
      }
    }

    throw lastError;
  }

  /**
   * Validate ID parameter
   */
  protected validateId(id: number, entityName: string = "entity"): void {
    if (!Number.isInteger(id) || id <= 0) {
      throw new ApiError(
        `Invalid ${entityName} ID: ${id}`,
        undefined,
        "VALIDATION_ERROR",
      );
    }
  }

  /**
   * Validate array of IDs
   */
  protected validateIds(
    ids: number[],
    entityName: string = "entity",
  ): number[] {
    const validIds = ids.filter((id) => Number.isInteger(id) && id > 0);
    if (validIds.length === 0) {
      throw new ApiError(
        `No valid ${entityName} IDs provided`,
        undefined,
        "VALIDATION_ERROR",
      );
    }
    return validIds;
  }

  /**
   * Sanitize search query
   */
  protected sanitizeSearchQuery(query: string): string {
    const sanitized = query.replace(/[^a-zA-Z0-9\s@.-]/g, "").trim();
    if (!sanitized) {
      throw new ApiError("Invalid search query", undefined, "VALIDATION_ERROR");
    }
    return sanitized;
  }

  /**
   * Validate status value against allowed values
   */
  protected validateStatus(
    status: string,
    validStatuses: readonly string[],
    entityName: string = "entity",
  ): void {
    if (!validStatuses.includes(status)) {
      throw new ApiError(
        `Invalid ${entityName} status: ${status}. Valid values: ${validStatuses.join(", ")}`,
        undefined,
        "VALIDATION_ERROR",
      );
    }
  }

  /**
   * Build URL with base URL
   */
  protected buildUrl(endpoint: string): string {
    return `${this.config.baseURL}${endpoint}`;
  }

  /**
   * Generic GET request
   */
  protected async get<T>(
    endpoint: string,
    params?: Record<string, any>,
    config?: RequestConfig,
  ): Promise<T> {
    return this.retryWithBackoff(async () => {
      try {
        const response = await axios.get(this.buildUrl(endpoint), {
          params,
          timeout: config?.timeout ?? this.config.timeout,
        });
        return this.handleResponse<T>(response);
      } catch (error) {
        this.handleApiError(error);
      }
    }, config);
  }

  /**
   * Generic GET request for paginated data
   */
  protected async getPaginated<T>(
    endpoint: string,
    params?: Record<string, any>,
    config?: RequestConfig,
  ): Promise<ApiResponse<T>> {
    return this.retryWithBackoff(async () => {
      try {
        const response = await axios.get(this.buildUrl(endpoint), {
          params,
          timeout: config?.timeout ?? this.config.timeout,
        });
        return this.handlePaginatedResponse<T>(response);
      } catch (error) {
        this.handleApiError(error);
      }
    }, config);
  }

  /**
   * Generic POST request
   */
  protected async post<T>(
    endpoint: string,
    data?: any,
    config?: RequestConfig,
  ): Promise<T> {
    return this.retryWithBackoff(async () => {
      try {
        const response = await axios.post(this.buildUrl(endpoint), data, {
          timeout: config?.timeout ?? this.config.timeout,
        });
        return this.handleResponse<T>(response);
      } catch (error) {
        this.handleApiError(error);
      }
    }, config);
  }

  /**
   * Generic PUT request
   */
  protected async put<T>(
    endpoint: string,
    data?: any,
    config?: RequestConfig,
  ): Promise<T> {
    return this.retryWithBackoff(async () => {
      try {
        const response = await axios.put(this.buildUrl(endpoint), data, {
          timeout: config?.timeout ?? this.config.timeout,
        });
        return this.handleResponse<T>(response);
      } catch (error) {
        this.handleApiError(error);
      }
    }, config);
  }

  /**
   * Generic PATCH request
   */
  protected async patch<T>(
    endpoint: string,
    data?: any,
    config?: RequestConfig,
  ): Promise<T> {
    return this.retryWithBackoff(async () => {
      try {
        const response = await axios.patch(this.buildUrl(endpoint), data, {
          timeout: config?.timeout ?? this.config.timeout,
        });
        return this.handleResponse<T>(response);
      } catch (error) {
        this.handleApiError(error);
      }
    }, config);
  }

  /**
   * Generic DELETE request
   */
  protected async delete(
    endpoint: string,
    config?: RequestConfig,
  ): Promise<void> {
    return this.retryWithBackoff(async () => {
      try {
        await axios.delete(this.buildUrl(endpoint), {
          timeout: config?.timeout ?? this.config.timeout,
        });
      } catch (error) {
        this.handleApiError(error);
      }
    }, config);
  }
}
