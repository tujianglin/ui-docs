import type { PortalProps } from '@vc-com/portal';
import Portal from '@vc-com/portal';
import { getDOM } from '@vc-com/util/lib/Dom/findDOMNode';
import { reactiveComputed } from '@vueuse/core';
import { computed, defineComponent, nextTick, onMounted, ref, watch, type Ref } from 'vue';
import { useFullProps, useRef } from 'vue-jsx-vapor';
import { useRefContextProvide } from './context';
import type { DrawerPanelAccessibility, DrawerPanelEvents } from './DrawerPanel';
import type { DrawerPopupProps } from './DrawerPopup';
import DrawerPopup from './DrawerPopup';
import type { DrawerClassNames, DrawerStyles } from './inter';
import { warnCheck } from './util';

export type Placement = 'left' | 'top' | 'right' | 'bottom';

export interface DrawerProps
  extends Omit<DrawerPopupProps, 'prefixCls' | 'inline' | 'scrollLocker'>, DrawerPanelEvents, DrawerPanelAccessibility {
  prefixCls?: string;
  open?: boolean;
  onClose?: (e: MouseEvent | KeyboardEvent | KeyboardEvent) => void;
  destroyOnHidden?: boolean;
  getContainer?: PortalProps['getContainer'];
  panelRef?: Ref<HTMLDivElement>;
  classNames?: DrawerClassNames;
  styles?: DrawerStyles;
  /** Size of the drawer (width for left/right placement, height for top/bottom placement) */
  size?: number | string;
  /** Maximum size of the drawer */
  maxSize?: number;
  /** Default size for uncontrolled resizable drawer */
  defaultSize?: number | string;
  /** Resizable configuration - boolean to enable/disable or object with optional callbacks */
  resizable?:
    | boolean
    | {
        onResize?: (size: number) => void;
        onResizeStart?: () => void;
        onResizeEnd?: () => void;
      };
  focusTriggerAfterClose?: boolean;
}

const Drawer = defineComponent(
  ({
    open = false,
    prefixCls = 'rc-drawer',
    placement = 'right' as Placement,
    autoFocus = true,
    keyboard = true,
    size,
    maxSize,
    mask = true,
    maskClosable = true,
    getContainer,
    forceRender,
    afterOpenChange,
    destroyOnHidden,
    onMouseenter,
    onMouseover,
    onMouseleave,
    onClick,
    onKeydown,
    onKeyup,
    onClose,
    resizable,
    defaultSize,
    focusTriggerAfterClose,

    // Refs
    panelRef,
  }: DrawerProps) => {
    const props = useFullProps() as DrawerProps;
    const animatedVisible = ref(false);

    // ============================= Warn =============================
    if (process.env.NODE_ENV !== 'production') {
      warnCheck(props);
    }

    // ============================= Open =============================
    const mounted = ref(false);

    onMounted(() => {
      mounted.value = true;
    });

    const mergedOpen = computed(() => (mounted.value ? open : false));

    // ============================ Focus =============================
    const popupRef = useRef<HTMLDivElement>(null);

    const lastActiveRef = useRef<HTMLElement>(null);
    watch(
      mergedOpen,
      async () => {
        await nextTick();
        if (mergedOpen.value) {
          lastActiveRef.value = document.activeElement as HTMLElement;
        }
      },
      { immediate: true, flush: 'post' },
    );

    // ============================= Open =============================
    const internalAfterOpenChange: DrawerProps['afterOpenChange'] = (nextVisible) => {
      animatedVisible.value = nextVisible;
      afterOpenChange?.(nextVisible);

      if (
        !nextVisible &&
        focusTriggerAfterClose !== false &&
        lastActiveRef.value &&
        !popupRef.value?.contains(lastActiveRef.value)
      ) {
        lastActiveRef.value?.focus({ preventScroll: true });
      }
    };

    // =========================== Context ============================
    const refContext = computed(() => ({ panel: panelRef?.value }));

    // ============================ Render ============================
    if (!forceRender && !animatedVisible.value && !mergedOpen.value && destroyOnHidden) {
      return null;
    }

    const eventHandlers = computed(() => ({
      onMouseenter,
      onMouseover,
      onMouseleave,
      onClick,
      onKeydown,
      onKeyup,
    }));

    const drawerPopupProps = computed(() => ({
      ...props,
      open: mergedOpen.value,
      prefixCls,
      placement,
      autoFocus,
      keyboard,
      size,
      maxSize,
      defaultSize,
      mask,
      maskClosable,
      inline: getContainer === false,
      afterOpenChange: internalAfterOpenChange,
      ref: (el) => (popupRef.value = getDOM(el) as HTMLDivElement),
      resizable,
      ...eventHandlers.value,
    }));

    const onEsc: PortalProps['onEsc'] = ({ top, event }) => {
      if (top && keyboard) {
        event.stopPropagation();
        onClose?.(event);
      }
    };

    useRefContextProvide(reactiveComputed(() => refContext.value));

    return () => (
      <Portal
        open={mergedOpen.value || forceRender || animatedVisible.value}
        autoDestroy={false}
        getContainer={getContainer}
        autoLock={mask && (mergedOpen.value || animatedVisible.value)}
        onEsc={onEsc}
      >
        <DrawerPopup {...drawerPopupProps.value}>
          <slot></slot>
        </DrawerPopup>
      </Portal>
    );
  },
  { inheritAttrs: false, name: process.env.NODE_ENV !== 'production' ? 'Drawer' : undefined },
);

export default Drawer;
