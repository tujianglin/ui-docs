import { ref, watch, type WatchSource } from 'vue';

/**
 * Vue 版本的 useEffect
 *
 * @description
 * 类似于 React 的 useEffect，但会在回调中传递上一次的依赖值，
 * 并且不需要关心依赖数组长度变化。
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import useEffect from '@/hooks/useEffect';
 * import { ref } from 'vue';
 *
 * const count = ref(0);
 * const name = ref('hello');
 *
 * useEffect((prevDeps) => {
 *   console.log('上一次的值:', prevDeps);
 *   console.log('当前值:', [count.value, name.value]);
 * }, [count, name]);
 * </script>
 * ```
 *
 * @useCases 适用场景
 * 1. **对比前后值** - 需要知道上一次的依赖值
 * 2. **条件执行** - 根据变化情况决定是否执行操作
 * 3. **动画过渡** - 基于前后值差异计算过渡效果
 *
 * @param callback - 回调函数，接收上一次的依赖值数组
 * @param deps - 依赖数组
 */
function useEffect(callback: (prevDeps: any[]) => void, deps: WatchSource[]) {
  const prevRef = ref<any[]>(deps.map((d) => (typeof d === 'function' ? d() : d)));

  watch(
    deps,
    (newDeps) => {
      const prevDeps = prevRef.value;
      // 检查是否有变化
      if (newDeps.length !== prevDeps.length || newDeps.some((dep, index) => dep !== prevDeps[index])) {
        callback(prevDeps);
      }
      prevRef.value = [...newDeps];
    },
    { immediate: false },
  );
}

export default useEffect;
