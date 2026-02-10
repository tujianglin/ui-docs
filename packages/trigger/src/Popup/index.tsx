import type { CSSMotionProps } from '@vc-com/motion';
import CSSMotion from '@vc-com/motion';
import type { PortalProps } from '@vc-com/portal';
import ResizeObserver, { type ResizeObserverProps } from '@vc-com/resize-observer';
import { composeRef } from '@vc-com/util/lib/ref';
import { reactiveComputed } from '@vueuse/core';
import clsx from 'clsx';
import { computed, defineComponent, nextTick, ref, shallowRef, watch, type CSSProperties } from 'vue';
import type { MouseEventHandler } from 'vue-jsx-vapor';
import type { TriggerProps } from '../';
import useOffsetStyle from '../hooks/useOffsetStyle';
import type { AlignType, ArrowPos, ArrowTypeOuter } from '../interface';
import Arrow from './Arrow';
import Mask from './Mask';
import PopupContent from './PopupContent';

export interface MobileConfig {
  mask?: boolean;
  /** Set popup motion. You can ref `rc-motion` for more info. */
  motion?: CSSMotionProps;
  /** Set mask motion. You can ref `rc-motion` for more info. */
  maskMotion?: CSSMotionProps;
}

export interface PopupProps {
  onEsc?: PortalProps['onEsc'];
  prefixCls: string;
  class?: string;
  style?: CSSProperties;
  popup?: TriggerProps['popup'];
  target: HTMLElement;
  onMouseEnter?: MouseEventHandler<HTMLDivElement>;
  onMouseLeave?: MouseEventHandler<HTMLDivElement>;
  onPointerEnter?: (e: PointerEvent) => void;
  onPointerDownCapture?: MouseEventHandler<HTMLDivElement>;
  zIndex?: number;

  mask?: boolean;
  onVisibleChanged: (visible: boolean) => void;

  // Arrow
  align?: AlignType;
  arrow?: ArrowTypeOuter;
  arrowPos: ArrowPos;

  // Open
  open: boolean;
  /** Tell Portal that should keep in screen. e.g. should wait all motion end */
  keepDom: boolean;
  fresh?: boolean;

  // Click
  onClick?: MouseEventHandler<HTMLDivElement>;

  // Motion
  motion?: CSSMotionProps;
  maskMotion?: CSSMotionProps;

  // Portal
  forceRender?: boolean;
  getPopupContainer?: TriggerProps['getPopupContainer'];
  autoDestroy?: boolean;
  portal: any;

  // Align
  ready: boolean;
  offsetX: number;
  offsetY: number;
  offsetR: number;
  offsetB: number;
  onAlign: VoidFunction;
  onPrepare: () => Promise<void>;

  // stretch
  stretch?: string;
  targetWidth?: number;
  targetHeight?: number;

  // Resize
  onResize?: ResizeObserverProps['onResize'];

  // Mobile
  mobile?: MobileConfig;
}

const Popup = defineComponent((props: PopupProps) => {
  const {
    onEsc,
    popup,
    class: className,
    prefixCls,
    style,
    target,

    onVisibleChanged,

    // Open
    open,
    keepDom,
    fresh,

    // Click
    onClick,

    // Mask
    mask,

    // Arrow
    arrow,
    arrowPos,
    align,

    // Motion
    motion,
    maskMotion,

    // Mobile
    mobile,

    // Portal
    forceRender,
    getPopupContainer,
    autoDestroy,
    portal: Portal,

    zIndex,

    onMouseEnter,
    onMouseLeave,
    onPointerEnter,
    onPointerDownCapture,

    ready,
    offsetX,
    offsetY,
    offsetR,
    offsetB,
    onAlign,
    onPrepare,

    // Resize
    onResize,

    stretch,
    targetWidth,
    targetHeight,
  } = $(props);

  const popupContent = computed(() => (typeof popup === 'function' ? (popup as any)?.() : popup));

  // We can not remove holder only when motion finished.
  const isNodeVisible = computed(() => open || keepDom);

  // ========================= Mobile =========================
  const isMobile = computed(() => !!mobile);

  // ========================== Mask ==========================
  const { mergedMask, mergedMaskMotion, mergedPopupMotion } = $(
    reactiveComputed(() => {
      if (mobile) {
        return { mergedMask: mobile.mask, mergedMaskMotion: mobile.maskMotion, mergedPopupMotion: mobile.motion };
      }

      return { mergedMask: mask, mergedMaskMotion: maskMotion, mergedPopupMotion: motion };
    }),
  );

  // ======================= Container ========================
  const getPopupContainerNeedParams = computed(() => getPopupContainer?.length > 0);

  const show = shallowRef(!getPopupContainer || !getPopupContainerNeedParams.value);

  // Delay to show since `getPopupContainer` need target element
  watch(
    [show, getPopupContainerNeedParams, () => target],
    async () => {
      await nextTick();
      if (!show.value && getPopupContainerNeedParams.value && target) {
        show.value = true;
      }
    },
    { flush: 'post', immediate: true },
  );

  // ========================= Resize =========================
  const onInternalResize: ResizeObserverProps['onResize'] = (size, ele) => {
    onResize?.(size, ele);
    onAlign();
  };

  // ========================= Styles =========================
  const offsetStyle = useOffsetStyle(
    isMobile,
    computed(() => ready),
    computed(() => open),
    computed(() => align),
    computed(() => offsetR),
    computed(() => offsetB),
    computed(() => offsetX),
    computed(() => offsetY),
  );

  const domRef = ref();

  defineExpose({
    nativeElement: domRef,
  });
  // >>>>> Misc
  const miscStyle = computed(() => {
    const result: CSSProperties = {};
    if (stretch) {
      if (stretch.includes('height') && targetHeight) {
        result.height = `${targetHeight}px`;
      } else if (stretch.includes('minHeight') && targetHeight) {
        result.minHeight = `${targetHeight}px`;
      }
      if (stretch.includes('width') && targetWidth) {
        result.width = `${targetWidth}px`;
      } else if (stretch.includes('minWidth') && targetWidth) {
        result.minWidth = `${targetWidth}px`;
      }
    }

    if (!open) {
      result.pointerEvents = 'none';
    }
    return result;
  });

  // ========================= Render =========================
  return () => {
    if (!show.value) {
      return null;
    }

    return (
      <Portal
        open={forceRender || isNodeVisible.value}
        getContainer={getPopupContainer && (() => getPopupContainer(target))}
        autoDestroy={autoDestroy}
        onEsc={onEsc}
      >
        <Mask
          prefixCls={prefixCls}
          open={open}
          zIndex={zIndex}
          mask={mergedMask}
          motion={mergedMaskMotion}
          mobile={isMobile.value}
        />
        <ResizeObserver onResize={onInternalResize} disabled={!open}>
          <CSSMotion
            motionAppear
            motionEnter
            motionLeave
            removeOnLeave={false}
            forceRender={forceRender}
            leavedClassName={`${prefixCls}-hidden`}
            {...mergedPopupMotion}
            onAppearPrepare={onPrepare}
            onEnterPrepare={onPrepare}
            visible={open}
            onVisibleChanged={(nextVisible) => {
              motion?.onVisibleChanged?.(nextVisible);
              onVisibleChanged(nextVisible);
            }}
          >
            {({ class: motionClassName, style: motionStyle, ref: motionRef }) => {
              const cls = clsx(prefixCls, motionClassName, className, {
                [`${prefixCls}-mobile`]: isMobile.value,
              });

              return (
                <div
                  ref={composeRef(domRef, motionRef)}
                  class={cls}
                  style={
                    {
                      '--arrow-x': `${arrowPos.x || 0}px`,
                      '--arrow-y': `${arrowPos.y || 0}px`,
                      ...offsetStyle.value,
                      ...miscStyle.value,
                      ...motionStyle,
                      boxSizing: 'border-box',
                      zIndex,
                      ...style,
                    } as CSSProperties
                  }
                  onMouseenter={onMouseEnter}
                  onMouseleave={onMouseLeave}
                  onPointerenter={onPointerEnter}
                  onClick={onClick}
                  {...{
                    onPointerdownCapture: onPointerDownCapture,
                  }}
                >
                  {arrow && <Arrow prefixCls={prefixCls} arrow={arrow} arrowPos={arrowPos} align={align} />}
                  <PopupContent cache={!open && !fresh}>{popupContent.value}</PopupContent>
                </div>
              );
            }}
          </CSSMotion>
        </ResizeObserver>
        <slot></slot>
      </Portal>
    );
  };
});

export default Popup;
