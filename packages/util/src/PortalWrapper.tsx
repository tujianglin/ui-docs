import { defineComponent, onMounted, onUnmounted, ref, watch, type PropType, type VNode } from 'vue';
import canUseDom from './Dom/canUseDom';
import ScrollLocker from './Dom/scrollLocker';
import Portal from './Portal';
import raf from './raf';
import setStyle from './setStyle';

let openCount = 0;
const supportDom = canUseDom();

/** @private 仅测试使用 */
export function getOpenCount() {
  return process.env.NODE_ENV === 'test' ? openCount : 0;
}

// https://github.com/ant-design/ant-design/issues/19340
// https://github.com/ant-design/ant-design/issues/19332
let cacheOverflow: Record<string, any> = {};

const getParent = (getContainer?: GetContainer): HTMLElement | null => {
  if (!supportDom) {
    return null;
  }
  if (getContainer) {
    if (typeof getContainer === 'string') {
      return document.querySelectorAll(getContainer)[0] as HTMLElement;
    }
    if (typeof getContainer === 'function') {
      return getContainer();
    }
    if (typeof getContainer === 'object' && getContainer instanceof window.HTMLElement) {
      return getContainer;
    }
  }
  return document.body;
};

export type GetContainer = string | HTMLElement | (() => HTMLElement);

export interface PortalWrapperSlotProps {
  getOpenCount: () => number;
  getContainer: () => HTMLElement | null;
  switchScrollingEffect: () => void;
  scrollLocker: ScrollLocker;
}

/**
 * Vue PortalWrapper 组件
 *
 * @description
 * Portal 的高级封装，提供滚动锁定、容器管理等功能。
 *
 * @example
 * ```vue
 * <template>
 *   <PortalWrapper v-model:visible="visible" :get-container="() => document.body">
 *     <template #default="{ getContainer, switchScrollingEffect }">
 *       <div class="modal-content">
 *         Modal Content
 *       </div>
 *     </template>
 *   </PortalWrapper>
 * </template>
 * ```
 *
 * @useCases 适用场景
 * 1. **模态框** - 带滚动锁定的模态框容器
 * 2. **抽屉** - 侧边滑出的抽屉组件
 * 3. **全屏遮罩** - 需要禁止页面滚动的遮罩
 */
const PortalWrapper = defineComponent({
  name: 'PortalWrapper',
  props: {
    visible: {
      type: Boolean,
      default: false,
    },
    getContainer: {
      type: [String, Object, Function] as PropType<GetContainer>,
      default: undefined,
    },
    wrapperClassName: {
      type: String,
      default: undefined,
    },
    forceRender: {
      type: Boolean,
      default: false,
    },
  },
  setup(props, { slots }) {
    const container = ref<HTMLElement | undefined>();
    const portalRef = ref<any>(null);
    let rafId: number | undefined;
    let scrollLocker: ScrollLocker;

    // 初始化 scrollLocker
    scrollLocker = new ScrollLocker({
      container: getParent(props.getContainer) as HTMLElement,
    });

    const setWrapperClassName = () => {
      if (container.value && props.wrapperClassName && props.wrapperClassName !== container.value.className) {
        container.value.className = props.wrapperClassName;
      }
    };

    const attachToParent = (force = false): boolean => {
      if (force || (container.value && !container.value.parentNode)) {
        const parent = getParent(props.getContainer);
        if (parent && container.value) {
          parent.appendChild(container.value);
          return true;
        }
        return false;
      }
      return true;
    };

    const getContainerElement = (): HTMLElement | null => {
      if (!supportDom) {
        return null;
      }
      if (!container.value) {
        container.value = document.createElement('div');
        attachToParent(true);
      }
      setWrapperClassName();
      return container.value;
    };

    const removeCurrentContainer = () => {
      container.value?.parentNode?.removeChild(container.value);
    };

    const switchScrollingEffect = () => {
      if (openCount === 1 && !Object.keys(cacheOverflow).length) {
        cacheOverflow = setStyle({
          overflow: 'hidden',
          overflowX: 'hidden',
          overflowY: 'hidden',
        });
      } else if (!openCount) {
        setStyle(cacheOverflow);
        cacheOverflow = {};
      }
    };

    const updateOpenCount = (prevVisible?: boolean) => {
      const { visible, getContainer: getContainerProp } = props;

      if (visible !== prevVisible && supportDom && getParent(getContainerProp) === document.body) {
        if (visible && !prevVisible) {
          openCount += 1;
        } else if (prevVisible) {
          openCount -= 1;
        }
      }
    };

    const updateScrollLocker = (prevVisible?: boolean) => {
      const { visible, getContainer: getContainerProp } = props;

      if (visible && visible !== prevVisible && supportDom && getParent(getContainerProp) !== scrollLocker.getContainer()) {
        scrollLocker.reLock({
          container: getParent(getContainerProp) as HTMLElement,
        });
      }
    };

    // 初始化
    onMounted(() => {
      updateOpenCount();

      if (!attachToParent()) {
        rafId = raf(() => {
          // 强制更新
        });
      }
    });

    // 监听 visible 变化
    let prevVisible = props.visible;
    watch(
      () => props.visible,
      (newVisible) => {
        updateOpenCount(prevVisible);
        updateScrollLocker(prevVisible);
        setWrapperClassName();
        attachToParent();
        prevVisible = newVisible;
      },
    );

    // 监听 getContainer 变化
    watch(
      () => props.getContainer,
      () => {
        removeCurrentContainer();
      },
    );

    onUnmounted(() => {
      const { visible, getContainer: getContainerProp } = props;
      if (supportDom && getParent(getContainerProp) === document.body) {
        openCount = visible && openCount ? openCount - 1 : openCount;
      }
      removeCurrentContainer();
      if (rafId) {
        raf.cancel(rafId);
      }
    });

    return () => {
      const { forceRender, visible } = props;
      let portal: VNode | null = null;

      const childProps: PortalWrapperSlotProps = {
        getOpenCount: () => openCount,
        getContainer: getContainerElement,
        switchScrollingEffect,
        scrollLocker,
      };

      if (forceRender || visible || portalRef.value) {
        // @ts-ignore
        portal = (
          <Portal getContainer={getContainerElement as () => HTMLElement} ref={portalRef}>
            {slots.default?.(childProps)}
          </Portal>
        );
      }

      return portal;
    };
  },
});

export { PortalWrapper };
