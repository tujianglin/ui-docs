import raf from '@vc-com/util/lib/raf';
import { clsx } from 'clsx';
import { computed, defineComponent, onBeforeUnmount, onMounted, ref, shallowRef, watch, type CSSProperties } from 'vue';
import { useRef, type MouseEventHandler } from 'vue-jsx-vapor';
import { getPageXY } from './hooks/useScrollDrag';

export type ScrollBarDirectionType = 'ltr' | 'rtl';

export interface ScrollBarProps {
  prefixCls: string;
  scrollOffset: number;
  scrollRange: number;
  rtl: boolean;
  onScroll: (scrollOffset: number, horizontal?: boolean) => void;
  onStartMove: () => void;
  onStopMove: () => void;
  horizontal?: boolean;
  style?: CSSProperties;
  thumbStyle?: CSSProperties;
  spinSize: number;
  containerSize: number;
  showScrollBar?: boolean | 'optional';
}

export interface ScrollBarRef {
  delayHidden: () => void;
}

const ScrollBar = defineComponent(
  ({
    prefixCls,
    rtl,
    scrollOffset,
    scrollRange,
    onStartMove,
    onStopMove,
    onScroll,
    horizontal,
    spinSize,
    containerSize,
    style,
    thumbStyle: propsThumbStyle,
    showScrollBar,
  }: ScrollBarProps) => {
    const dragging = ref(false);
    const pageXY = ref<number | null>(null);
    const startTop = ref<number | null>(null);

    const isLTR = computed(() => !rtl);

    // ========================= Refs =========================
    const scrollbarRef = useRef<HTMLDivElement>();
    const thumbRef = useRef<HTMLDivElement>();

    // ======================= Visible ========================
    const visible = ref(showScrollBar);
    const visibleTimeoutRef = shallowRef<ReturnType<typeof setTimeout>>();

    const delayHidden = () => {
      if (showScrollBar === true || showScrollBar === false) return;
      clearTimeout(visibleTimeoutRef.value);
      visible.value = true;
      visibleTimeoutRef.value = setTimeout(() => {
        visible.value = false;
      }, 3000);
    };

    // ======================== Range =========================
    const enableScrollRange = computed(() => scrollRange - containerSize || 0);
    const enableOffsetRange = computed(() => containerSize - spinSize || 0);

    // ========================= Top ==========================
    const top = computed(() => {
      if (scrollOffset === 0 || enableScrollRange.value === 0) {
        return 0;
      }
      const ptg = scrollOffset / enableScrollRange.value;
      return ptg * enableOffsetRange.value;
    });

    // ====================== Container =======================
    const onContainerMouseDown: MouseEventHandler = (e) => {
      e.stopPropagation();
      e.preventDefault();
    };

    // ======================== Thumb =========================
    const stateRef = shallowRef({
      top: top.value,
      dragging: dragging.value,
      pageY: pageXY.value,
      startTop: startTop.value,
    });

    watch([top, dragging, pageXY, startTop], () => {
      stateRef.value = {
        top: top.value,
        dragging: dragging.value,
        pageY: pageXY.value,
        startTop: startTop.value,
      };
    });

    const onThumbMouseDown = (e) => {
      dragging.value = true;
      pageXY.value = getPageXY(e, horizontal);
      startTop.value = stateRef.value.top;

      onStartMove();
      e.stopPropagation();
      e.preventDefault();
    };

    // ======================== Effect ========================

    // React make event as passive, but we need to preventDefault
    // Add event on dom directly instead.
    // ref: https://github.com/facebook/react/issues/9809
    onMounted(() => {
      const onScrollbarTouchStart = (e: TouchEvent) => {
        e.preventDefault();
      };

      const scrollbarEle = scrollbarRef.value;
      const thumbEle = thumbRef.value;
      scrollbarEle.addEventListener('touchstart', onScrollbarTouchStart, { passive: false });
      thumbEle.addEventListener('touchstart', onThumbMouseDown, { passive: false });

      onBeforeUnmount(() => {
        scrollbarEle.removeEventListener('touchstart', onScrollbarTouchStart);
        thumbEle.removeEventListener('touchstart', onThumbMouseDown);
      });
    });

    // Pass to effect

    watch(
      [dragging],
      (_n, _o, onCleanup) => {
        if (dragging.value) {
          let moveRafId: number;

          const onMouseMove = (e: MouseEvent | TouchEvent) => {
            const { dragging: stateDragging, pageY: statePageY, startTop: stateStartTop } = stateRef.value;
            raf.cancel(moveRafId);

            const rect = scrollbarRef.value.getBoundingClientRect();
            const scale = containerSize / (horizontal ? rect.width : rect.height);

            if (stateDragging) {
              const offset = (getPageXY(e, horizontal) - statePageY) * scale;
              let newTop = stateStartTop;

              if (!isLTR.value && horizontal) {
                newTop -= offset;
              } else {
                newTop += offset;
              }

              const tmpEnableScrollRange = enableScrollRange.value;
              const tmpEnableOffsetRange = enableOffsetRange.value;

              const ptg: number = tmpEnableOffsetRange ? newTop / tmpEnableOffsetRange : 0;

              let newScrollTop = Math.ceil(ptg * tmpEnableScrollRange);
              newScrollTop = Math.max(newScrollTop, 0);
              newScrollTop = Math.min(newScrollTop, tmpEnableScrollRange);
              moveRafId = raf(() => {
                onScroll(newScrollTop, horizontal);
              });
            }
          };

          const onMouseUp = () => {
            dragging.value = false;

            onStopMove();
          };

          window.addEventListener('mousemove', onMouseMove, { passive: true });
          window.addEventListener('touchmove', onMouseMove, { passive: true });
          window.addEventListener('mouseup', onMouseUp, { passive: true });
          window.addEventListener('touchend', onMouseUp, { passive: true });

          onCleanup(() => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('touchmove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
            window.removeEventListener('touchend', onMouseUp);

            raf.cancel(moveRafId);
          });
        }
      },
      { immediate: true },
    );

    watch([() => scrollOffset], (_n, _o, onCleanup) => {
      delayHidden();
      onCleanup(() => {
        clearTimeout(visibleTimeoutRef.value);
      });
    });

    // ====================== Imperative ======================
    defineExpose({
      delayHidden,
    });

    // ======================== Render ========================
    const scrollbarPrefixCls = computed(() => `${prefixCls}-scrollbar`);

    const containerStyle = computed(() => {
      const result: CSSProperties = {
        position: 'absolute',
        visibility: visible.value ? null : 'hidden',
      };
      if (horizontal) {
        Object.assign(result, {
          height: '8px',
          left: 0,
          right: 0,
          bottom: 0,
        });
      } else {
        Object.assign(result, {
          width: '8px',
          top: 0,
          bottom: 0,
          [isLTR.value ? 'right' : 'left']: 0,
        });
      }
      return result;
    });

    const thumbStyle = computed(() => {
      const result: CSSProperties = {
        position: 'absolute',
        borderRadius: '99px',
        background: 'var(--rc-virtual-list-scrollbar-bg, rgba(0, 0, 0, 0.5))',
        cursor: 'pointer',
        userSelect: 'none',
      };
      if (horizontal) {
        Object.assign(result, {
          height: '100%',
          width: `${spinSize}px`,
          [isLTR.value ? 'left' : 'right']: `${top.value}px`,
        });
      } else {
        Object.assign(result, {
          width: '100%',
          height: `${spinSize}px`,
          top: `${top.value}px`,
        });
      }
      return result;
    });

    return () => (
      <div
        ref={scrollbarRef}
        class={clsx(scrollbarPrefixCls.value, {
          [`${scrollbarPrefixCls.value}-horizontal`]: horizontal,
          [`${scrollbarPrefixCls.value}-vertical`]: !horizontal,
          [`${scrollbarPrefixCls.value}-visible`]: visible.value,
        })}
        style={{ ...containerStyle.value, ...style }}
        onMousedown={onContainerMouseDown}
        onMousemove={delayHidden}
      >
        <div
          ref={thumbRef}
          class={clsx(`${scrollbarPrefixCls.value}-thumb`, {
            [`${scrollbarPrefixCls.value}-thumb-moving`]: dragging.value,
          })}
          style={{ ...thumbStyle.value, ...propsThumbStyle }}
          onMousedown={onThumbMouseDown}
        />
      </div>
    );
  },
  { inheritAttrs: false, name: process.env.NODE_ENV !== 'production' ? 'ScrollBar' : undefined },
);

export default ScrollBar;
