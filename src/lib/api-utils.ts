/**
 * Utility functions for API operations
 */

/**
 * Build query parameters from an object
 */
export function buildQueryParams(params: Record<string, any>): URLSearchParams {
  const queryParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      if (typeof value === "boolean") {
        queryParams.append(key, value.toString());
      } else {
        queryParams.append(key, String(value));
      }
    }
  });

  return queryParams;
}

/**
 * Handle API response consistently
 */
export function handleApiResponse<T>(response: any): {
  data: T | null;
  error: Error | null;
  success: boolean;
} {
  if (response.success === false) {
    return {
      data: null,
      error: new Error(response.message || "API request failed"),
      success: false,
    };
  }

  return {
    data: response.data || response,
    error: null,
    success: true,
  };
}

/**
 * Simple in-memory cache factory
 */
export function createApiCache<T>(ttl: number = 5 * 60 * 1000) {
  let cache: T | null = null;
  let timestamp: number | null = null;

  return {
    get(): T | null {
      if (!cache || !timestamp) return null;

      const now = Date.now();
      if (now - timestamp > ttl) {
        cache = null;
        timestamp = null;
        return null;
      }

      return cache;
    },

    set(data: T): void {
      cache = data;
      timestamp = Date.now();
    },

    clear(): void {
      cache = null;
      timestamp = null;
    },

    isValid(): boolean {
      if (!timestamp) return false;
      const now = Date.now();
      return now - timestamp <= ttl;
    },
  };
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}
