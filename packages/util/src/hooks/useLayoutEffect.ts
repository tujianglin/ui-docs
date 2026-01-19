import { onMounted, onUnmounted, ref, watch, type WatchSource } from 'vue';
import canUseDom from '../Dom/canUseDom';

/**
 * Vue 版本的 useLayoutEffect
 *
 * @description
 * 类似于 React 的 useLayoutEffect，但适用于 Vue 3 Composition API。
 * 在 SSR 环境或测试环境下会降级为普通的 effect。
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import useLayoutEffect from '@/hooks/useLayoutEffect';
 *
 * useLayoutEffect((isFirstMount) => {
 *   if (isFirstMount) {
 *     console.log('首次挂载');
 *   } else {
 *     console.log('依赖更新');
 *   }
 *   return () => console.log('清理');
 * }, [someDep]);
 * </script>
 * ```
 *
 * @param callback - 回调函数，接收一个 boolean 参数表示是否是首次挂载
 * @param deps - 依赖数组（可选）
 */
const useLayoutEffect = (callback: (mount: boolean) => void | VoidFunction, deps?: WatchSource[]) => {
  const firstMountRef = ref<boolean>(true);
  let cleanup: void | VoidFunction;

  // 执行回调的函数
  const runCallback = () => {
    // 先执行清理
    if (typeof cleanup === 'function') {
      cleanup();
    }
    // 执行回调
    cleanup = callback(firstMountRef.value);
  };

  // 仅在客户端执行
  if (canUseDom()) {
    onMounted(() => {
      runCallback();
      firstMountRef.value = false;
    });

    // 监听依赖变化
    if (deps && deps.length > 0) {
      watch(deps, () => {
        runCallback();
      });
    }

    onUnmounted(() => {
      if (typeof cleanup === 'function') {
        cleanup();
      }
      firstMountRef.value = true;
    });
  }
};

/**
 * 仅在更新时执行的 effect（跳过首次挂载）
 */
export const useLayoutUpdateEffect = (callback: () => void | VoidFunction, deps?: WatchSource[]) => {
  useLayoutEffect((firstMount) => {
    if (!firstMount) {
      return callback();
    }
  }, deps);
};

export { useLayoutEffect };
