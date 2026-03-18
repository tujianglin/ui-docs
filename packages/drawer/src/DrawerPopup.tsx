import type { CSSMotionProps } from '@vc-com/motion';
import CSSMotion from '@vc-com/motion';
import pickAttrs from '@vc-com/util/lib/pickAttrs';
import { reactiveComputed } from '@vueuse/core';
import { clsx } from 'clsx';
import { computed, defineComponent, onBeforeUnmount, onMounted, ref, watch, type CSSProperties } from 'vue';
import { useFullProps, useRef, type FocusEvent } from 'vue-jsx-vapor';
import type { VueNode } from '../../util/src/types';
import { useDrawerContextInject, useDrawerContextProvide, type DrawerContextProps } from './context';
import type { DrawerPanelAccessibility, DrawerPanelEvents } from './DrawerPanel';
import DrawerPanel from './DrawerPanel';
import useDrag from './hooks/useDrag';
import useFocusable from './hooks/useFocusable';
import type { DrawerClassNames, DrawerStyles } from './inter';
import { parseWidthHeight } from './util';

export type Placement = 'left' | 'right' | 'top' | 'bottom';

export interface PushConfig {
  distance?: number | string;
}

export interface DrawerPopupProps extends DrawerPanelEvents, DrawerPanelAccessibility {
  prefixCls: string;
  open?: boolean;
  inline?: boolean;
  push?: boolean | PushConfig;
  forceRender?: boolean;
  keyboard?: boolean;

  // Focus
  autoFocus?: boolean;
  focusTrap?: boolean;

  // Root
  rootClassName?: string;
  rootStyle?: CSSProperties;
  zIndex?: number;

  // Drawer
  placement?: Placement;
  id?: string;
  class?: string;
  style?: CSSProperties;
  width?: number | string;
  height?: number | string;
  /** Size of the drawer (width for left/right placement, height for top/bottom placement) */
  size?: number | string;
  /** Maximum size of the drawer */
  maxSize?: number;

  // Mask
  mask?: boolean;
  maskClosable?: boolean;
  maskClassName?: string;
  maskStyle?: CSSProperties;

  // Motion
  motion?: CSSMotionProps | ((placement: Placement) => CSSMotionProps);
  maskMotion?: CSSMotionProps;

  // Events
  afterOpenChange?: (open: boolean) => void;
  onClose?: (event: any) => void;

  // classNames
  classNames?: DrawerClassNames;

  // styles
  styles?: DrawerStyles;
  drawerRender?: (node: VueNode) => VueNode;

  // resizable
  /** Default size for uncontrolled resizable drawer */
  defaultSize?: number | string;
  resizable?:
    | boolean
    | {
        onResize?: (size: number) => void;
        onResizeStart?: () => void;
        onResizeEnd?: () => void;
      };
}

const DrawerPopup = defineComponent(
  ({
    prefixCls,
    open,
    placement,
    inline,
    push,
    forceRender,

    // Focus
    autoFocus,
    focusTrap,

    // classNames
    classNames: drawerClassNames,
    // Root
    rootClassName,
    rootStyle,
    zIndex,

    // Drawer
    class: className,
    id,
    style,
    motion,
    width,
    height,
    size,
    maxSize,

    // Mask
    mask,
    maskClosable,
    maskMotion,
    maskClassName,
    maskStyle,

    // Events
    afterOpenChange,
    onClose,
    onMouseenter,
    onMouseover,
    onMouseleave,
    onClick,
    onKeydown,
    onKeyup,

    styles,
    drawerRender,
    resizable,
    defaultSize,
  }: DrawerPopupProps) => {
    const props = useFullProps() as DrawerPopupProps;
    // ================================ Refs ================================
    const panelRef = useRef<HTMLDivElement>(null);

    defineExpose({
      get nativeElement() {
        return panelRef.value;
      },
    });

    // ========================= Focusable ==========================
    const ignoreElement = useFocusable(
      () => panelRef.value,
      computed(() => open),
      computed(() => autoFocus),
      computed(() => focusTrap),
      computed(() => mask),
    );

    // ============================ Push ============================
    const pushed = ref(false);

    const parentContext = useDrawerContextInject();

    // Merge push distance
    const pushConfig = computed<PushConfig>(() => {
      let result;
      if (typeof push === 'boolean') {
        result = push ? {} : { distance: 0 };
      } else {
        result = push || {};
      }
      return result;
    });
    const pushDistance = computed(() => pushConfig.value?.distance ?? parentContext?.pushDistance ?? 180);

    const mergedContext = computed<DrawerContextProps>(() => ({
      pushDistance: pushDistance.value,
      push: () => {
        pushed.value = true;
      },
      pull: () => {
        pushed.value = false;
      },
    }));

    // ========================= ScrollLock =========================
    // Tell parent to push
    watch(
      () => open,
      () => {
        if (open) {
          parentContext?.push?.();
        } else {
          parentContext?.pull?.();
        }
      },
      { immediate: true },
    );

    // Clean up
    onBeforeUnmount(() => parentContext?.pull?.());

    // =========================== Panel ============================
    const motionProps = computed(() => (typeof motion === 'function' ? motion(placement) : motion));

    // ============================ Size ============================
    const currentSize = ref<number>();
    const isHorizontal = computed(() => placement === 'left' || placement === 'right');

    onMounted(() => {
      console.log(size);
    });

    // Aggregate size logic with backward compatibility using useMemo
    const mergedSize = computed(() => {
      const legacySize = isHorizontal.value ? width : height;

      const nextMergedSize = size ?? legacySize ?? currentSize.value ?? defaultSize ?? (isHorizontal.value ? 378 : undefined);
      return parseWidthHeight(nextMergedSize);
    });

    // >>> Style
    const wrapperStyle = computed<CSSProperties>(() => {
      const nextWrapperStyle: CSSProperties = {};

      if (pushed.value && pushDistance.value) {
        switch (placement) {
          case 'top':
            nextWrapperStyle.transform = `translateY(${pushDistance.value}px)`;
            break;
          case 'bottom':
            nextWrapperStyle.transform = `translateY(${-pushDistance.value}px)`;
            break;
          case 'left':
            nextWrapperStyle.transform = `translateX(${pushDistance.value}px)`;

            break;
          default:
            nextWrapperStyle.transform = `translateX(${-pushDistance.value}px)`;
            break;
        }
      }

      if (isHorizontal.value) {
        nextWrapperStyle.width = `${parseWidthHeight(mergedSize.value)}px`;
      } else {
        nextWrapperStyle.height = `${parseWidthHeight(mergedSize.value)}px`;
      }

      return nextWrapperStyle;
    });

    // =========================== Resize ===========================
    const wrapperRef = useRef<HTMLDivElement>(null);

    const isResizable = computed(() => !!resizable);
    const resizeConfig = computed(() => (typeof resizable === 'object' && resizable) || {});

    const onInternalResize = (size: number) => {
      currentSize.value = size;
      resizeConfig.value?.onResize?.(size);
    };

    const { dragElementProps, isDragging } = useDrag(
      reactiveComputed(() => ({
        prefixCls: `${prefixCls}-resizable`,
        direction: placement,
        class: drawerClassNames?.dragger,
        style: styles?.dragger,
        maxSize,
        containerRef: wrapperRef.value,
        currentSize: mergedSize.value,
        onResize: onInternalResize,
        onResizeStart: resizeConfig.value?.onResizeStart,
        onResizeEnd: resizeConfig.value?.onResizeEnd,
      })),
    );

    // =========================== Events ===========================
    const eventHandlers = computed(() => ({
      onMouseenter,
      onMouseover,
      onMouseleave,
      onClick,
      onKeydown,
      onKeyup,
      onFocus: (e: FocusEvent<HTMLDivElement>) => {
        ignoreElement(e.target);
      },
    }));

    useDrawerContextProvide(reactiveComputed(() => mergedContext.value));

    // =========================== Render ==========================

    return () => {
      // ============================ Mask ============================
      const maskNode = (
        <CSSMotion key="mask" {...maskMotion} visible={mask && open}>
          {({ class: motionMaskClassName, style: motionMaskStyle, ref: maskRef }) => (
            <div
              class={clsx(`${prefixCls}-mask`, motionMaskClassName, drawerClassNames?.mask, maskClassName)}
              style={{ ...motionMaskStyle, ...maskStyle, ...styles?.mask }}
              onClick={maskClosable && open ? onClose : undefined}
              ref={maskRef}
            />
          )}
        </CSSMotion>
      );
      // >>>>> Panel
      const panelNode = (
        <CSSMotion
          key="panel"
          {...motionProps.value}
          visible={open}
          forceRender={forceRender}
          onVisibleChanged={afterOpenChange}
          removeOnLeave={false}
          leavedClassName={`${prefixCls}-content-wrapper-hidden`}
        >
          {({ class: motionClassName, style: motionStyle, ref: motionRef }) => {
            const content = (
              <DrawerPanel
                id={id}
                containerRef={motionRef}
                prefixCls={prefixCls}
                class={clsx(className, drawerClassNames?.section)}
                style={{ ...style, ...styles?.section }}
                {...pickAttrs(props, { aria: true })}
                {...eventHandlers.value}
              >
                <slot></slot>
              </DrawerPanel>
            );
            return (
              <div
                ref={wrapperRef}
                class={clsx(
                  `${prefixCls}-content-wrapper`,
                  isDragging.value && `${prefixCls}-content-wrapper-dragging`,
                  drawerClassNames?.wrapper,
                  !isDragging.value && motionClassName,
                )}
                style={{ ...motionStyle, ...wrapperStyle.value, ...styles?.wrapper }}
                {...pickAttrs(props, { data: true })}
              >
                {isResizable.value && <div {...dragElementProps} />}
                {drawerRender ? drawerRender(content) : content}
              </div>
            );
          }}
        </CSSMotion>
      );

      // >>>>> Container
      const containerStyle: CSSProperties = {
        ...rootStyle,
      };

      if (zIndex) {
        containerStyle.zIndex = zIndex;
      }
      return (
        <div
          class={clsx(prefixCls, `${prefixCls}-${placement}`, rootClassName, {
            [`${prefixCls}-open`]: open,
            [`${prefixCls}-inline`]: inline,
          })}
          style={containerStyle}
          tabindex={-1}
          ref={panelRef}
        >
          {maskNode}
          {panelNode}
        </div>
      );
    };
  },
  { inheritAttrs: false, name: process.env.NODE_ENV !== 'production' ? 'DrawerPopup' : undefined },
);

export default DrawerPopup;
