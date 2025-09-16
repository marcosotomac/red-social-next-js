import { useRef, useCallback } from 'react';

/**
 * Custom hook to debounce function calls
 * Prevents rapid successive calls to the same function
 */
export function useDebounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isExecutingRef = useRef(false);

  const debouncedFunction = useCallback(
    (...args: Parameters<T>) => {
      // If already executing, ignore this call
      if (isExecutingRef.current) {
        return;
      }

      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set new timeout
      timeoutRef.current = setTimeout(async () => {
        isExecutingRef.current = true;
        try {
          await func(...args);
        } finally {
          isExecutingRef.current = false;
        }
      }, delay);
    },
    [func, delay]
  ) as T;

  return debouncedFunction;
}

/**
 * Custom hook to throttle function calls
 * Ensures function is called at most once per specified interval
 */
export function useThrottle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): T {
  const lastFuncRef = useRef<number>(0);
  const isExecutingRef = useRef(false);

  const throttledFunction = useCallback(
    (...args: Parameters<T>) => {
      // If already executing, ignore this call
      if (isExecutingRef.current) {
        return;
      }

      const now = Date.now();
      if (now - lastFuncRef.current >= limit) {
        lastFuncRef.current = now;
        isExecutingRef.current = true;
        
        Promise.resolve(func(...args)).finally(() => {
          isExecutingRef.current = false;
        });
      }
    },
    [func, limit]
  ) as T;

  return throttledFunction;
}