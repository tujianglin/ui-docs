import { ref, type Ref } from 'vue';
import isMobile from '../isMobile';
import { useLayoutEffect } from './useLayoutEffect';

/**
 * Vue 版本的 useMobile
 *
 * @description
 * 检测用户是否在移动设备上。注意此 hook 仅在客户端 effect 中检测，
 * 因此在 SSR 中始终返回 false。
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import useMobile from '@/hooks/useMobile';
 *
 * const mobile = useMobile();
 *
 * // 根据设备类型显示不同内容
 * </script>
 *
 * <template>
 *   <div v-if="mobile.value">移动端视图</div>
 *   <div v-else>桌面端视图</div>
 * </template>
 * ```
 *
 * @useCases 适用场景
 * 1. **响应式布局** - 根据设备类型切换布局
 * 2. **功能适配** - 移动端和桌面端使用不同的交互方式
 * 3. **性能优化** - 移动端加载更轻量的组件
 *
 * @returns 包含是否是移动设备的 Ref<boolean>
 */
const useMobile = (): Ref<boolean> => {
  const mobile = ref(false);

  useLayoutEffect(() => {
    mobile.value = isMobile();
  }, []);

  return mobile;
};

export default useMobile;
