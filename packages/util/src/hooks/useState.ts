import { onUnmounted, ref, type Ref } from 'vue';

type Updater<T> = T | ((prevValue: T) => T);

export type SetState<T> = (
  nextValue: Updater<T>,
  /**
   * 组件销毁后是否忽略更新。
   * 开发者需确保忽略是安全的。
   */
  ignoreDestroy?: boolean,
) => void;

/**
 * Vue 版本的安全 useState
 *
 * @description
 * 类似于 React 的 useState，但 `setState` 接受 `ignoreDestroy` 参数，
 * 在组件销毁后可选择不更新状态，避免潜在的内存泄漏风险。
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import useState from '@/hooks/useState';
 *
 * const [count, setCount] = useState(0);
 *
 * // 普通更新
 * setCount(1);
 *
 * // 函数式更新
 * setCount(prev => prev + 1);
 *
 * // 异步操作中安全更新（忽略组件已销毁的情况）
 * setTimeout(() => {
 *   setCount(10, true); // 第二个参数为 true 表示忽略销毁状态
 * }, 1000);
 * </script>
 * ```
 *
 * @useCases 适用场景
 * 1. **异步回调** - 防止异步操作完成时组件已卸载导致的警告
 * 2. **定时器** - setTimeout/setInterval 回调中更新状态
 * 3. **网络请求** - fetch/axios 完成后更新状态
 *
 * @param defaultValue - 初始值或返回初始值的函数
 * @returns [value, setState] 元组
 */
const useSafeState = <T>(defaultValue?: T | (() => T)): [Ref<T>, SetState<T>] => {
  const destroyRef = ref<boolean>(false);
  const value = ref<T>(typeof defaultValue === 'function' ? (defaultValue as () => T)() : (defaultValue as T)) as Ref<T>;

  onUnmounted(() => {
    destroyRef.value = true;
  });

  function safeSetState(updater: Updater<T>, ignoreDestroy?: boolean) {
    if (ignoreDestroy && destroyRef.value) {
      return;
    }
    value.value = typeof updater === 'function' ? (updater as (prevValue: T) => T)(value.value) : updater;
  }

  return [value, safeSetState];
};

export default useSafeState;
