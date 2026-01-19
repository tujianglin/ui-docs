import { onMounted, ref, type Ref } from 'vue';

let uuid = 0;

/** @private 仅在开发环境使用。不在生产环境工作。 */
export function resetUuid() {
  if (process.env.NODE_ENV !== 'production') {
    uuid = 0;
  }
}

/**
 * Vue 版本的 useId
 *
 * @description
 * 生成唯一的 ID，优先使用开发者传入的 ID，否则自动生成。
 * 支持 SSR 场景，首次渲染使用 'ssr-id'，客户端挂载后切换为真实 ID。
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import useId from '@/hooks/useId';
 *
 * // 自动生成唯一 ID
 * const autoId = useId();
 *
 * // 使用开发者传入的 ID
 * const customId = useId('my-custom-id');
 * </script>
 *
 * <template>
 *   <input :id="autoId.value" />
 *   <label :for="autoId.value">Label</label>
 * </template>
 * ```
 *
 * @useCases 适用场景
 * 1. **表单元素** - 关联 input 和 label
 * 2. **ARIA 属性** - aria-labelledby, aria-describedby 等
 * 3. **DOM 查询** - 需要唯一标识的元素
 *
 * @param id - 可选的自定义 ID
 * @returns 包含 ID 值的 Ref
 */
export function useId(id?: string): Ref<string> {
  const innerId = ref<string>('ssr-id');

  onMounted(() => {
    // 开发者传入的 ID 优先
    if (id) {
      innerId.value = id;
      return;
    }

    // 测试环境固定返回
    if (process.env.NODE_ENV === 'test') {
      innerId.value = 'test-id';
      return;
    }

    // 生成唯一 ID
    const nextId = uuid;
    uuid += 1;
    innerId.value = `vue_unique_${nextId}`;
  });

  // 如果有传入 ID，直接返回
  if (id) {
    innerId.value = id;
  }

  return innerId;
}
