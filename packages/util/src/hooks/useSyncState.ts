import { ref, triggerRef } from 'vue';
import useEvent from './useEvent';

type Updater<T> = T | ((prevValue: T) => T);

export type SetState<T> = (nextValue: Updater<T>) => void;

/**
 * Vue 版本的 useSyncState
 *
 * @description
 * 类似于 Vue 的 ref，但始终能获取到最新的值。
 * 当 Vue 将多个状态更新合并为一次时非常有用。
 * 例如，onTransitionEnd 可能一次触发多个事件，这些事件的状态更新会被 Vue 合并。
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import useSyncState from '@/hooks/useSyncState';
 *
 * const [getCount, setCount] = useSyncState(0);
 *
 * function handleMultipleUpdates() {
 *   setCount(1);
 *   console.log(getCount()); // 始终返回 1，而不是旧值
 *   setCount(2);
 *   console.log(getCount()); // 始终返回 2
 * }
 * </script>
 * ```
 *
 * @useCases 适用场景
 * 1. **批量状态更新** - 需要在多次更新间获取最新值
 * 2. **过渡事件** - transitionend 等可能连续触发的事件
 * 3. **同步依赖** - 需要确保读取到的是最新值
 *
 * @param defaultValue - 默认值
 * @returns [get, set] 元组 - get 函数返回当前值，set 函数更新值
 */
function useSyncState<T>(defaultValue?: T): [get: () => T, set: SetState<T>] {
  const currentValueRef = ref<T>(defaultValue as T);

  const getValue = useEvent(() => {
    return currentValueRef.value;
  });

  const setValue = useEvent((updater: Updater<T>) => {
    currentValueRef.value = typeof updater === 'function' ? (updater as (prevValue: T) => T)(currentValueRef.value) : updater;

    // 触发更新
    triggerRef(currentValueRef);
  });

  return [getValue, setValue];
}

export default useSyncState;
