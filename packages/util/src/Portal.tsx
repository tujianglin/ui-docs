import { defineComponent, onMounted, onUnmounted, ref, Teleport, watch, type PropType } from 'vue';
import canUseDom from './Dom/canUseDom';

export interface PortalProps {
  /** 获取容器元素的函数 */
  getContainer: () => HTMLElement;
  /** 更新后的回调 */
  didUpdate?: () => void;
}

/**
 * Vue Portal 组件
 *
 * @description
 * 将子组件渲染到指定的 DOM 容器中。类似于 React 的 createPortal，
 * 但使用 Vue 3 的 Teleport 实现。
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import Portal from '@/Portal';
 * </script>
 *
 * <template>
 *   <Portal :getContainer="() => document.body">
 *     <div class="modal">Modal Content</div>
 *   </Portal>
 * </template>
 * ```
 *
 * @useCases 适用场景
 * 1. **模态框** - 渲染到 body 避免 CSS 层叠上下文问题
 * 2. **下拉菜单** - 渲染到 body 避免 overflow 裁剪
 * 3. **通知消息** - 渲染到固定位置的容器
 */
const Portal = defineComponent({
  name: 'Portal',
  props: {
    getContainer: {
      type: Function as PropType<() => HTMLElement>,
      required: true,
    },
    didUpdate: {
      type: Function as PropType<() => void>,
      default: undefined,
    },
  },
  setup(props, { slots, expose }) {
    const containerRef = ref<HTMLElement | null>(null);
    const parentRef = ref<ParentNode | null>(null);
    const initRef = ref<boolean>(false);

    // 暴露空对象供外部检查
    expose({});

    // 在客户端同步创建容器
    if (!initRef.value && canUseDom()) {
      containerRef.value = props.getContainer();
      parentRef.value = containerRef.value?.parentNode ?? null;
      initRef.value = true;
    }

    onMounted(() => {
      props.didUpdate?.();
    });

    // 监听 props 变化
    watch(
      () => props,
      () => {
        props.didUpdate?.();
      },
      { deep: true },
    );

    onMounted(() => {
      // 如果容器被移除，重新添加
      if (containerRef.value?.parentNode === null && parentRef.value !== null) {
        parentRef.value.appendChild(containerRef.value);
      }
    });

    onUnmounted(() => {
      // 清理：移除容器
      containerRef.value?.parentNode?.removeChild(containerRef.value);
    });

    return () => {
      if (containerRef.value) {
        return <Teleport to={containerRef.value}>{slots.default?.()}</Teleport>;
      }
      return null;
    };
  },
});

export default Portal;
