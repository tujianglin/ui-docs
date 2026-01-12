/**
 * Vue 版本的 useEvent
 *
 * @description
 * 创建一个稳定的回调函数引用，内部的实现可以随时更新，
 * 但返回的函数引用保持不变。类似于 React 的 useEvent 提案。
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import useEvent from '@/hooks/useEvent';
 *
 * const props = defineProps<{ onClick?: () => void }>();
 *
 * // 即使 props.onClick 变化，onClickStable 引用也不变
 * const onClickStable = useEvent(props.onClick);
 *
 * // 可以安全地传递给子组件，不会导致不必要的重渲染
 * </script>
 * ```
 *
 * @useCases 适用场景
 * 1. **事件处理器** - 避免子组件因回调变化而重渲染
 * 2. **useEffect 依赖** - 在 watch 中使用而不需要添加依赖
 * 3. **防抖/节流** - 配合 debounce/throttle 使用
 *
 * @param callback - 回调函数
 * @returns 稳定的函数引用
 */
function useEvent<T extends ((...args: any[]) => any) | undefined>(
  callback: T,
): undefined extends T ? (...args: Parameters<NonNullable<T>>) => ReturnType<NonNullable<T>> | undefined : T {
  // 使用闭包保持引用
  let fn: T | undefined = callback;

  // 返回一个稳定的函数
  const memoFn = (...args: any[]) => {
    // 更新引用
    fn = callback;
    return fn?.(...args);
  };

  return memoFn as any;
}

export default useEvent;
