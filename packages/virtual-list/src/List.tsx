import ResizeObserver from '@vc-com/resize-observer';
import type { VueNode } from '@vc-com/util/lib/types';
import clsx from 'clsx';
import type { CSSProperties } from 'vue';
import { computed, defineComponent, nextTick, ref, shallowRef, toRaw, watch } from 'vue';
import { useFullProps, useRef, type HTMLAttributes, type UIEvent, type UIEventHandler } from 'vue-jsx-vapor';
import type { InnerProps } from './Filler';
import Filler from './Filler';
import useChildren from './hooks/useChildren';
import useDiffItem from './hooks/useDiffItem';
import useFrameWheel from './hooks/useFrameWheel';
import { useGetSize } from './hooks/useGetSize';
import useHeights from './hooks/useHeights';
import useMobileTouchMove from './hooks/useMobileTouchMove';
import useOriginScroll from './hooks/useOriginScroll';
import useScrollDrag from './hooks/useScrollDrag';
import useScrollTo, { type ScrollPos, type ScrollTarget } from './hooks/useScrollTo';
import type { ExtraRenderInfo, SharedConfig } from './interface';
import type { ScrollBarDirectionType, ScrollBarRef } from './ScrollBar';
import ScrollBar from './ScrollBar';
import { getSpinSize } from './utils/scrollbarUtil';

const EMPTY_DATA = [];

const ScrollStyle: CSSProperties = {
  overflowY: 'auto',
  overflowAnchor: 'none',
};

export interface ScrollInfo {
  x: number;
  y: number;
}

export type ScrollConfig = ScrollTarget | ScrollPos;

export type ScrollTo = (arg?: number | ScrollConfig | null) => void;

export type ListRef = {
  nativeElement: HTMLDivElement;
  scrollTo: ScrollTo;
  getScrollInfo: () => ScrollInfo;
};

export interface ListProps<T> extends HTMLAttributes<any> {
  prefixCls?: string;
  data: T[];
  height?: number;
  itemHeight?: number;
  /** If not match virtual scroll condition, Set List still use height of container. */
  fullHeight?: boolean;
  itemKey: PropertyKey | ((item: T) => PropertyKey);
  component?: any;
  /** Set `false` will always use real scroll instead of virtual one */
  virtual?: boolean;
  direction?: ScrollBarDirectionType;
  /**
   * By default `scrollWidth` is same as container.
   * When set this, it will show the horizontal scrollbar and
   * `scrollWidth` will be used as the real width instead of container width.
   * When set, `virtual` will always be enabled.
   */
  scrollWidth?: number;

  styles?: {
    horizontalScrollBar?: CSSProperties;
    horizontalScrollBarThumb?: CSSProperties;
    verticalScrollBar?: CSSProperties;
    verticalScrollBarThumb?: CSSProperties;
  };
  showScrollBar?: boolean | 'optional';
  onScroll?: UIEventHandler<HTMLElement>;

  /**
   * Given the virtual offset value.
   * It's the logic offset from start position.
   */
  onVirtualScroll?: (info: ScrollInfo) => void;

  /** Trigger when render list item changed */
  onVisibleChange?: (visibleList: T[], fullList: T[]) => void;

  /** Inject to inner container props. Only use when you need pass aria related data */
  innerProps?: InnerProps;

  /** Render extra content into Filler */
  extraRender?: (info: ExtraRenderInfo) => VueNode;
}

export default defineComponent(
  ({
    prefixCls = 'rc-virtual-list',
    class: className,
    height,
    itemHeight,
    fullHeight = true,
    style,
    data,
    itemKey,
    virtual,
    direction,
    scrollWidth,
    component: Component = 'div',
    onScroll,
    onVirtualScroll,
    onVisibleChange,
    innerProps,
    extraRender,
    styles,
    showScrollBar = 'optional',
    ...restProps
  }: ListProps<any>) => {
    const slots = defineSlots({
      default: (_props?: { item: any; index: number; style: CSSProperties; offsetX: number }) => <></>,
    });
    const props = useFullProps() as unknown as ListProps<any>;

    // Keep `itemKey` in a plain variable to avoid triggering Vue reactivity tracking
    // for every `getKey` call (which can be extremely hot for large lists).
    let itemKeyProp = itemKey;
    watch(
      () => itemKey,
      (val) => {
        itemKeyProp = val;
      },
    );

    // =============================== Item PropertyKey ===============================
    const getKey = (item: any): PropertyKey => {
      const _itemKey = itemKeyProp;
      if (typeof _itemKey === 'function') {
        return _itemKey(item);
      }
      return item?.[_itemKey as string];
    };

    // ================================ Height ================================
    const [setInstanceRef, collectHeight, heights, heightUpdatedMark] = useHeights(getKey, null, null);

    // ================================= MISC =================================
    const useVirtual = computed(() => !!(virtual !== false && height && itemHeight));
    const containerHeight = computed(() => Object.values(heights.maps).reduce((total, curr) => total + curr, 0));
    const inVirtual = computed(
      () => useVirtual.value && data && (Math.max(itemHeight * data.length, containerHeight.value) > height || !!scrollWidth),
    );
    const isRTL = computed(() => direction === 'rtl');

    const mergedClassName = computed(() => clsx(prefixCls, { [`${prefixCls}-rtl`]: isRTL.value }, className));
    const mergedData = computed(() => data || EMPTY_DATA);
    const componentRef = useRef<HTMLDivElement>();
    const fillerInnerRef = useRef<HTMLDivElement>();
    const containerRef = useRef<HTMLDivElement>();

    // =============================== Item Key ===============================

    const offsetTop = ref(0);
    const offsetLeft = ref(0);
    const scrollMoving = ref(false);

    const onScrollbarStartMove = () => {
      scrollMoving.value = true;
    };
    const onScrollbarStopMove = () => {
      scrollMoving.value = false;
    };

    const sharedConfig: SharedConfig<any> = {
      getKey,
    };

    // ================================ Scroll ================================
    function syncScrollTop(newTop: number | ((prev: number) => number)) {
      let value: number;
      if (typeof newTop === 'function') {
        value = newTop(offsetTop.value);
      } else {
        value = newTop;
      }

      const alignedTop = keepInRange(value);
      componentRef.value.scrollTop = alignedTop;
      offsetTop.value = alignedTop;
    }

    // ================================ Legacy ================================
    // Put ref here since the range is generate by follow
    const rangeRef = shallowRef({ start: 0, end: mergedData.value?.length });

    const diffItemRef = useRef<any>();
    const [diffItem] = useDiffItem(mergedData, getKey);
    watch(
      diffItem,
      () => {
        diffItemRef.value = diffItem.value;
      },
      { deep: true, immediate: true },
    );

    // ========================== Visible Calculation =========================
    const scrollHeight = ref(0);
    const start = ref(0);
    const end = ref(0);
    const fillerOffset = ref<number | undefined>(undefined);

    // ================================ Range ================================
    watch(
      [inVirtual, useVirtual, offsetTop, mergedData, heightUpdatedMark, () => props.height],
      () => {
        if (!useVirtual.value) {
          scrollHeight.value = 0;
          start.value = 0;
          end.value = mergedData.value.length - 1;
          fillerOffset.value = undefined;
          return;
        }

        if (!inVirtual.value) {
          scrollHeight.value = fillerInnerRef.value?.offsetHeight || 0;
          start.value = 0;
          end.value = mergedData.value.length - 1;
          fillerOffset.value = undefined;
          return;
        }
        const { itemHeight, height } = props;
        const dataLen = mergedData.value.length;

        // Fast path when no item has measured height yet (common on first render).
        // Avoid looping through the entire data list, which can be extremely slow for large datasets.
        if (!dataLen) {
          scrollHeight.value = 0;
          start.value = 0;
          end.value = -1;
          fillerOffset.value = 0;
          return;
        }

        if (heights.id.value === 0) {
          const safeItemHeight = itemHeight!;
          const safeListHeight = height!;

          const startIndex = Math.max(0, Math.floor(offsetTop.value / safeItemHeight));
          const startOffset = startIndex * safeItemHeight;

          let endIndex = startIndex + Math.ceil(safeListHeight / safeItemHeight);
          endIndex = Math.min(endIndex + 1, dataLen - 1);

          scrollHeight.value = dataLen * safeItemHeight;
          start.value = startIndex;
          end.value = endIndex;
          fillerOffset.value = startOffset;
          return;
        }

        let itemTop = 0;
        let startIndex: number | undefined;
        let startOffset: number | undefined;
        let endIndex: number | undefined;

        const data = toRaw(mergedData.value);
        const _offsetTop = offsetTop.value;
        for (let i = 0; i < dataLen; i += 1) {
          const item = data[i];
          const key = getKey(item);

          const cacheHeight = heights.get(key);
          const currentItemBottom = itemTop + (cacheHeight === undefined ? itemHeight! : cacheHeight);

          if (currentItemBottom >= _offsetTop && startIndex === undefined) {
            startIndex = i;
            startOffset = itemTop;
          }

          if (currentItemBottom > _offsetTop + height! && endIndex === undefined) {
            endIndex = i;
          }

          itemTop = currentItemBottom;
        }

        if (startIndex === undefined) {
          startIndex = 0;
          startOffset = 0;
          endIndex = Math.ceil(height! / itemHeight!);
        }
        if (endIndex === undefined) {
          endIndex = data.length - 1;
        }

        endIndex = Math.min(endIndex + 1, data.length - 1);

        scrollHeight.value = itemTop;
        start.value = startIndex;
        end.value = endIndex;
        fillerOffset.value = startOffset;
      },
      { immediate: true },
    );

    watch(start, () => {
      rangeRef.value.start = start.value;
    });
    watch(end, () => {
      rangeRef.value.end = end.value;
    });

    // When scroll up, first visible item get real height may not same as `itemHeight`,
    // Which will make scroll jump.
    // Let's sync scroll top to avoid jump
    watch(scrollHeight, () => {
      const changedRecord = heights.getRecord();
      if (changedRecord.size === 1) {
        const recordKey = Array.from(changedRecord.keys())[0];
        const prevCacheHeight = changedRecord.get(recordKey);

        const startItem = mergedData.value[start.value];
        if (startItem && prevCacheHeight === undefined) {
          const startIndexKey = getKey(startItem);
          if (startIndexKey === recordKey) {
            const realStartHeight = heights.get(recordKey);
            const diffHeight = realStartHeight - itemHeight!;
            syncScrollTop((ori) => ori + diffHeight);
          }
        }
      }

      // When list height shrinks (e.g. collapse motion), browser may clamp `scrollTop`
      // but our `offsetTop` ref won't update automatically. Clamp it here to avoid
      // leaving blank space at the bottom in virtual mode.
      if (useVirtual.value && height) {
        const maxScrollTop = Math.max(0, scrollHeight.value - height);
        if (offsetTop.value > maxScrollTop) {
          syncScrollTop(maxScrollTop);
        }
      }

      heights.resetRecord();
    });

    // ================================= Size =================================
    const size = ref({ width: 0, height });

    const onHolderResize = (sizeInfo: { offsetWidth: number; offsetHeight: number }) => {
      size.value = {
        width: sizeInfo.offsetWidth,
        height: sizeInfo.offsetHeight,
      };
    };

    // Hack on scrollbar to enable flash call
    const verticalScrollBarRef = useRef<ScrollBarRef>();
    const horizontalScrollBarRef = useRef<ScrollBarRef>();

    const horizontalScrollBarSpinSize = computed(() => getSpinSize(size.value.width, scrollWidth));
    const verticalScrollBarSpinSize = computed(() => getSpinSize(size.value.height, scrollHeight.value));

    // =============================== In Range ===============================
    const maxScrollHeight = computed(() => scrollHeight.value - height);
    const maxScrollHeightRef = shallowRef(maxScrollHeight.value);
    watch(maxScrollHeight, (val) => {
      maxScrollHeightRef.value = val;
    });
    function keepInRange(newScrollTop: number) {
      let newTop = newScrollTop;
      if (!Number.isNaN(maxScrollHeightRef.value)) {
        newTop = Math.min(newTop, maxScrollHeightRef.value);
      }
      newTop = Math.max(newTop, 0);
      return newTop;
    }

    const isScrollAtTop = computed(() => offsetTop.value <= 0);
    const isScrollAtBottom = computed(() => offsetTop.value >= maxScrollHeight.value);
    const isScrollAtLeft = computed(() => offsetLeft.value <= 0);
    const isScrollAtRight = computed(() => offsetLeft.value >= scrollWidth);

    const originScroll = useOriginScroll(isScrollAtTop, isScrollAtBottom, isScrollAtLeft, isScrollAtRight);

    // =============================== Scroll ===============================
    const getVirtualScrollInfo = () => ({
      x: isRTL.value ? -offsetLeft.value : offsetLeft.value,
      y: offsetTop.value,
    });

    const lastVirtualScrollInfoRef = shallowRef(getVirtualScrollInfo());

    const triggerScroll = (params?: { x?: number; y?: number }) => {
      if (onVirtualScroll) {
        const nextInfo = { ...getVirtualScrollInfo(), ...params };

        if (lastVirtualScrollInfoRef.value.x !== nextInfo.x || lastVirtualScrollInfoRef.value.y !== nextInfo.y) {
          onVirtualScroll(nextInfo);

          lastVirtualScrollInfoRef.value = nextInfo;
        }
      }
    };

    function onScrollBar(newScrollOffset: number, horizontal?: boolean) {
      const newOffset = newScrollOffset;

      if (horizontal) {
        nextTick(() => {
          offsetLeft.value = newOffset;
        });
        triggerScroll();
      } else {
        syncScrollTop(newOffset);
      }
    }

    // When data size reduce. It may trigger native scroll event back to fit scroll position
    function onFallbackScroll(e: UIEvent<HTMLDivElement>) {
      const { scrollTop: newScrollTop } = e.currentTarget;
      if (newScrollTop !== offsetTop.value) {
        syncScrollTop(newScrollTop);
      }

      // Trigger origin onScroll
      onScroll?.(e);
      triggerScroll();
    }

    const keepInHorizontalRange = (nextOffsetLeft: number) => {
      let tmpOffsetLeft = nextOffsetLeft;
      // oxlint-disable-next-line no-extra-boolean-cast
      const max = !!scrollWidth ? scrollWidth - size.value.width : 0;
      tmpOffsetLeft = Math.max(tmpOffsetLeft, 0);
      tmpOffsetLeft = Math.min(tmpOffsetLeft, max);

      return tmpOffsetLeft;
    };

    const onWheelDelta: Parameters<typeof useFrameWheel>[6] = (offsetXY, fromHorizontal) => {
      if (fromHorizontal) {
        nextTick(() => {
          const nextOffsetLeft = offsetLeft.value + (isRTL.value ? -offsetXY : offsetXY);

          offsetLeft.value = keepInHorizontalRange(nextOffsetLeft);
        });

        triggerScroll();
      } else {
        syncScrollTop((top) => {
          const newTop = top + offsetXY;

          return newTop;
        });
      }
    };

    // Since this added in global,should use ref to keep update
    const [onRawWheel, onFireFoxScroll] = useFrameWheel(
      useVirtual,
      isScrollAtTop,
      isScrollAtBottom,
      isScrollAtLeft,
      isScrollAtRight,
      computed(() => !!scrollWidth),
      onWheelDelta,
    );

    useMobileTouchMove(inVirtual, componentRef, (isHorizontal, delta, smoothOffset, e) => {
      const event = e as TouchEvent & {
        _virtualHandled?: boolean;
      };

      if (originScroll(isHorizontal, delta, smoothOffset)) {
        return false;
      }

      // Fix nest List trigger TouchMove event
      if (!event || !event._virtualHandled) {
        if (event) {
          event._virtualHandled = true;
        }

        onRawWheel({
          preventDefault() {},
          deltaX: isHorizontal ? delta : 0,
          deltaY: isHorizontal ? 0 : delta,
        } as WheelEvent);

        return true;
      }

      return false;
    });

    // MouseDown drag for scroll
    useScrollDrag(inVirtual, componentRef, (offset) => {
      syncScrollTop((top) => top + offset);
    });

    watch(
      [useVirtual, isScrollAtTop, isScrollAtBottom],
      async (_n, _o, onCleanup) => {
        await nextTick();
        // Firefox only
        function onMozMousePixelScroll(e) {
          // scrolling at top/bottom limit
          const scrollingUpAtTop = isScrollAtTop.value && e.detail < 0;
          const scrollingDownAtBottom = isScrollAtBottom.value && e.detail > 0;
          if (useVirtual.value && !scrollingUpAtTop && !scrollingDownAtBottom) {
            e.preventDefault();
          }
        }

        const componentEle = componentRef.value;
        componentEle.addEventListener('wheel', onRawWheel, { passive: false });
        componentEle.addEventListener('DOMMouseScroll', onFireFoxScroll as any, { passive: true });
        componentEle.addEventListener('MozMousePixelScroll', onMozMousePixelScroll, { passive: false });

        onCleanup(() => {
          componentEle.removeEventListener('wheel', onRawWheel);
          componentEle.removeEventListener('DOMMouseScroll', onFireFoxScroll as any);
          componentEle.removeEventListener('MozMousePixelScroll', onMozMousePixelScroll as any);
        });
      },
      { flush: 'post', immediate: true },
    );

    // Sync scroll left
    watch(
      [() => size.value.width, () => scrollWidth],
      async () => {
        await nextTick();
        if (scrollWidth) {
          const newOffsetLeft = keepInHorizontalRange(offsetLeft.value);
          offsetLeft.value = newOffsetLeft;
          triggerScroll({ x: newOffsetLeft });
        }
      },
      { flush: 'post' },
    );

    // ================================= Ref ==================================
    const delayHideScrollBar = () => {
      verticalScrollBarRef.value?.delayHidden();
      horizontalScrollBarRef.value?.delayHidden();
    };

    const scrollTo = useScrollTo(
      componentRef as any,
      mergedData,
      heights,
      computed(() => itemHeight),
      getKey,
      () => collectHeight(true),
      syncScrollTop,
      delayHideScrollBar,
    );

    defineExpose({
      get nativeElement() {
        return containerRef.value;
      },
      getScrollInfo: getVirtualScrollInfo,
      scrollTo: (config: any) => {
        function isPosScroll(arg: any): arg is ScrollPos {
          return arg && typeof arg === 'object' && ('left' in arg || 'top' in arg);
        }
        if (isPosScroll(config)) {
          if (config.left !== undefined) {
            offsetLeft.value = keepInHorizontalRange(config.left);
          }
          scrollTo(config.top as any);
        } else {
          scrollTo(config);
        }
      },
    });

    // ================================ Effect ================================
    /** We need told outside that some list not rendered */
    watch(
      [start, end, mergedData],
      () => {
        if (onVisibleChange) {
          const renderList = mergedData.value.slice(start.value, end.value + 1);
          onVisibleChange(renderList, mergedData.value);
        }
      },
      {
        flush: 'post',
      },
    );

    // ================================ Extra =================================
    const getSize = useGetSize(
      mergedData,
      getKey,
      heights,
      computed(() => itemHeight),
    );

    const extraContent = computed(() =>
      extraRender?.({
        start: start.value,
        end: end.value,
        virtual: inVirtual.value,
        offsetX: offsetLeft.value,
        offsetY: fillerOffset.value,
        rtl: isRTL.value,
        getSize,
      }),
    );

    // ================================= Ref ==================================

    const listChildren = useChildren(
      mergedData,
      start,
      end,
      computed(() => scrollWidth),
      offsetLeft,
      setInstanceRef,
      (item, index, props) => slots.default?.({ item, index, ...props }),
      sharedConfig,
    );

    const componentStyle = computed(() => {
      let result: CSSProperties = null;
      if (height) {
        result = { [fullHeight ? 'height' : 'maxHeight']: `${height}px`, ...ScrollStyle };

        if (useVirtual.value) {
          result.overflowY = 'hidden';

          if (scrollWidth) {
            result.overflowX = 'hidden';
          }

          if (scrollMoving.value) {
            result.pointerEvents = 'none';
          }
        }
      }
      return result;
    });

    const containerProps = computed(() => {
      const result: HTMLAttributes<HTMLDivElement> = {};
      if (isRTL.value) {
        result.dir = 'rtl';
      }
      return result;
    });

    return () => (
      <div
        ref={containerRef}
        style={{
          ...(style as CSSProperties),
          position: 'relative',
        }}
        class={mergedClassName.value}
        {...containerProps.value}
        {...restProps}
      >
        <ResizeObserver onResize={onHolderResize}>
          <Component
            class={`${prefixCls}-holder`}
            style={componentStyle.value}
            ref={componentRef}
            onScroll={onFallbackScroll}
            onMouseenter={delayHideScrollBar}
          >
            <Filler
              prefixCls={prefixCls}
              height={scrollHeight.value}
              offsetX={offsetLeft.value}
              offsetY={fillerOffset.value}
              scrollWidth={scrollWidth}
              onInnerResize={collectHeight}
              ref={fillerInnerRef}
              innerProps={innerProps}
              rtl={isRTL.value}
              extra={extraContent.value}
            >
              {listChildren.value}
            </Filler>
          </Component>
        </ResizeObserver>

        <ScrollBar
          v-if={inVirtual.value && scrollHeight.value > height}
          ref={verticalScrollBarRef}
          prefixCls={prefixCls}
          scrollOffset={offsetTop.value}
          scrollRange={scrollHeight.value}
          rtl={isRTL.value}
          onScroll={onScrollBar}
          onStartMove={onScrollbarStartMove}
          onStopMove={onScrollbarStopMove}
          spinSize={verticalScrollBarSpinSize.value}
          containerSize={size.value.height}
          style={styles?.verticalScrollBar}
          thumbStyle={styles?.verticalScrollBarThumb}
          showScrollBar={showScrollBar}
        />

        <ScrollBar
          v-if={inVirtual.value && scrollWidth > size.value.width}
          ref={horizontalScrollBarRef}
          prefixCls={prefixCls}
          scrollOffset={offsetLeft.value}
          scrollRange={scrollWidth}
          rtl={isRTL.value}
          onScroll={onScrollBar}
          onStartMove={onScrollbarStartMove}
          onStopMove={onScrollbarStopMove}
          spinSize={horizontalScrollBarSpinSize.value}
          containerSize={size.value.width}
          horizontal
          style={styles?.horizontalScrollBar}
          thumbStyle={styles?.horizontalScrollBarThumb}
          showScrollBar={showScrollBar}
        />
      </div>
    );
  },
  { inheritAttrs: false },
);
