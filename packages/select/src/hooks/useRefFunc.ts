import { useRef } from 'vue-jsx-vapor';

/**
 * Same as `React.useCallback` but always return a memoized function
 * but redirect to real function.
 */
export default function useRefFunc<T extends (...args: any[]) => any>(callback: T): T {
  const funcRef = useRef<T>(callback);
  funcRef.value = callback;

  const cacheFn = (...args: any[]) => {
    return funcRef.value(...args);
  };

  return cacheFn as any;
}
