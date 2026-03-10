import Render from '@vc-com/render';
import ResizeObserver from '@vc-com/resize-observer';
import type { VueNode } from '@vc-com/util/lib/types';
import { clsx } from 'clsx';
import { computed, defineComponent, nextTick, ref, watch, type CSSProperties } from 'vue';
import type { HTMLAttributes } from 'vue-jsx-vapor';
import Item from './Item';
import RawItem from './RawItem';
import { OverflowContextProvider } from './context';
import useEffectState, { useBatcher } from './hooks/useEffectState';

const RESPONSIVE = 'responsive' as const;
const INVALIDATE = 'invalidate' as const;

export { useOverflowContextInject } from './context';

export interface OverflowProps<ItemType> extends Omit<HTMLAttributes<any>, 'prefix'> {
  prefixCls?: string;
  class?: string;
  style?: CSSProperties;
  data?: ItemType[];
  itemKey?: PropertyKey | ((item: ItemType) => PropertyKey);
  /** Used for `responsive`. It will limit render node to avoid perf issue */
  itemWidth?: number;
  renderItem?: (item: ItemType, info: { index: number }) => VueNode;
  /** @private Do not use in your production. Render raw node that need wrap Item by developer self */
  renderRawItem?: (item: ItemType, index: number) => VueNode;
  maxCount?: number | typeof RESPONSIVE | typeof INVALIDATE;
  renderRest?: ((omittedItems: ItemType[]) => VueNode) | VueNode;
  /** @private Do not use in your production. Render raw node that need wrap Item by developer self */
  renderRawRest?: (omittedItems: ItemType[]) => VueNode;
  prefix?: (() => VueNode) | VueNode;
  suffix?: (() => VueNode) | VueNode;
  component?: any;
  itemComponent?: any;

  /** @private This API may be refactor since not well design */
  onVisibleChange?: (visibleCount: number) => void;

  /** When set to `full`, ssr will render full items by default and remove at client side */
  ssr?: 'full';
}

function defaultRenderRest<ItemType>(omittedItems: ItemType[]) {
  return `+ ${omittedItems.length} ...`;
}

const Overflow = defineComponent(
  ({
    prefixCls = 'rc-overflow',
    data = [],
    renderItem,
    renderRawItem,
    itemKey,
    itemWidth = 10,
    ssr,
    style,
    class: className,
    maxCount,
    renderRest,
    renderRawRest,
    prefix,
    suffix,
    component: Component = 'div',
    itemComponent,
    onVisibleChange,
    ...restProps
  }: OverflowProps<any>) => {
    const fullySSR = computed(() => ssr === 'full');

    const notifyEffectUpdate = useBatcher();

    const [containerWidth, setContainerWidth] = useEffectState<number>(notifyEffectUpdate, null);
    const mergedContainerWidth = computed(() => containerWidth.value || 0);

    const [itemWidths, setItemWidths] = useEffectState(notifyEffectUpdate, new Map<PropertyKey, number>());

    const [prevRestWidth, setPrevRestWidth] = useEffectState<number>(notifyEffectUpdate, 0);
    const [restWidth, setRestWidth] = useEffectState<number>(notifyEffectUpdate, 0);

    const [prefixWidth, setPrefixWidth] = useEffectState<number>(notifyEffectUpdate, 0);
    const [suffixWidth, setSuffixWidth] = useEffectState<number>(notifyEffectUpdate, 0);
    const suffixFixedStart = ref<number>(null);

    const displayCount = ref<number>(null);
    const mergedDisplayCount = computed(() => {
      if (displayCount.value === null && fullySSR.value) {
        return Number.MAX_SAFE_INTEGER;
      }

      return displayCount.value || 0;
    });

    const restReady = ref(false);

    const itemPrefixCls = computed(() => `${prefixCls}-item`);

    // Always use the max width to avoid blink
    const mergedRestWidth = computed(() => Math.max(prevRestWidth.value, restWidth.value));

    // ================================= Data =================================
    const isResponsive = computed(() => maxCount === RESPONSIVE);
    const shouldResponsive = computed(() => data.length && isResponsive.value);
    const invalidate = computed(() => maxCount === INVALIDATE);

    /**
     * When is `responsive`, we will always render rest node to get the real width of it for calculation
     */
    const showRest = computed(() => shouldResponsive.value || (typeof maxCount === 'number' && data.length > maxCount));

    const mergedData = computed(() => {
      let items = data;

      if (shouldResponsive.value) {
        if (containerWidth.value === null && fullySSR.value) {
          items = data;
        } else {
          items = data.slice(0, Math.min(data.length, mergedContainerWidth.value / itemWidth));
        }
      } else if (typeof maxCount === 'number') {
        items = data.slice(0, maxCount);
      }

      return items;
    });

    const omittedItems = computed(() => {
      if (shouldResponsive.value) {
        return data.slice(mergedDisplayCount.value + 1);
      }
      return data.slice(mergedData.value.length);
    });

    // ================================= Item =================================
    const getKey = (item: any, index: number) => {
      if (typeof itemKey === 'function') {
        return itemKey(item);
      }
      return (itemKey && (item as any)?.[itemKey]) ?? index;
    };

    const mergedRenderItem = renderItem || ((item: any) => item);

    function updateDisplayCount(count: number, suffixFixedStartVal: number, notReady?: boolean) {
      // React 18 will sync render even when the value is same in some case.
      // We take `mergedData` as deps which may cause dead loop if it's dynamic generate.
      // ref: https://github.com/ant-design/ant-design/issues/36559
      if (displayCount.value === count && (suffixFixedStartVal === undefined || suffixFixedStartVal === suffixFixedStart.value)) {
        return;
      }

      displayCount.value = count;
      if (!notReady) {
        restReady.value = count < data.length - 1;

        onVisibleChange?.(count);
      }

      if (suffixFixedStartVal !== undefined) {
        suffixFixedStart.value = suffixFixedStartVal;
      }
    }

    // ================================= Size =================================
    function onOverflowResize(_: object, element: HTMLElement) {
      setContainerWidth(element.clientWidth);
    }

    function registerSize(key: PropertyKey, width: number | null) {
      setItemWidths((origin) => {
        const clone = new Map(origin);

        if (width === null) {
          clone.delete(key);
        } else {
          clone.set(key, width);
        }
        return clone;
      });
    }

    function registerOverflowSize(_: PropertyKey, width: number | null) {
      setRestWidth(width!);
      setPrevRestWidth(restWidth.value);
    }

    function registerPrefixSize(_: PropertyKey, width: number | null) {
      setPrefixWidth(width!);
    }

    function registerSuffixSize(_: PropertyKey, width: number | null) {
      setSuffixWidth(width!);
    }

    // ================================ Effect ================================
    function getItemWidth(index: number) {
      return itemWidths.value.get?.(getKey(mergedData.value[index], index));
    }

    watch(
      [mergedContainerWidth, itemWidths, restWidth, prefixWidth, suffixWidth, mergedData],
      async () => {
        await nextTick();
        if (mergedContainerWidth.value && typeof mergedRestWidth.value === 'number' && mergedData.value) {
          let totalWidth = prefixWidth.value + suffixWidth.value;

          const len = mergedData.value.length;
          const lastIndex = len - 1;

          // When data count change to 0, reset this since not loop will reach
          if (!len) {
            updateDisplayCount(0, null);
            return;
          }

          for (let i = 0; i < len; i += 1) {
            let currentItemWidth = getItemWidth(i);

            // Fully will always render
            if (fullySSR.value) {
              currentItemWidth = currentItemWidth || 0;
            }

            // Break since data not ready
            if (currentItemWidth === undefined) {
              updateDisplayCount(i - 1, undefined, true);
              break;
            }

            // Find best match
            totalWidth += currentItemWidth;

            if (
              // Only one means `totalWidth` is the final width
              (lastIndex === 0 && totalWidth <= mergedContainerWidth.value) ||
              // Last two width will be the final width
              (i === lastIndex - 1 && totalWidth + getItemWidth(lastIndex)! <= mergedContainerWidth.value)
            ) {
              // Additional check if match the end
              updateDisplayCount(lastIndex, null);
              break;
            } else if (totalWidth + mergedRestWidth.value > mergedContainerWidth.value) {
              // Can not hold all the content to show rest
              updateDisplayCount(i - 1, totalWidth - currentItemWidth - suffixWidth.value + restWidth.value);
              break;
            }
          }

          if (suffix && getItemWidth(0) + suffixWidth.value > mergedContainerWidth.value) {
            suffixFixedStart.value = null;
          }
        }
      },
      { flush: 'post', immediate: true, deep: true },
    );

    // ================================ Render ================================
    const displayRest = computed(() => restReady.value && !!omittedItems.value.length);

    const suffixStyle = computed(() => {
      let result: CSSProperties = {};
      if (suffixFixedStart.value !== null && shouldResponsive.value) {
        result = {
          position: 'absolute',
          left: `${suffixFixedStart.value}px`,
          top: 0,
        };
      }
      return result;
    });

    const itemSharedProps = computed(() => ({
      prefixCls: itemPrefixCls.value,
      responsive: shouldResponsive.value,
      component: itemComponent,
      invalidate: invalidate.value,
    }));

    // >>>>> Choice render fun by `renderRawItem`
    const internalRenderItemNode = (item: any, index: number) => {
      const key = getKey(item, index);
      if (renderRawItem) {
        return (
          <OverflowContextProvider
            key={key}
            value={{
              ...itemSharedProps.value,
              order: index,
              item,
              itemKey: key,
              registerSize,
              display: index <= mergedDisplayCount.value,
            }}
          >
            {renderRawItem(item, index)}
          </OverflowContextProvider>
        );
      } else {
        return (
          <Item
            {...itemSharedProps.value}
            order={index}
            key={key}
            item={item}
            renderItem={mergedRenderItem}
            itemKey={key}
            registerSize={registerSize}
            display={index <= mergedDisplayCount.value}
          />
        );
      }
    };

    // >>>>> Rest node
    const restContextProps = computed(() => ({
      order: displayRest.value ? mergedDisplayCount.value : Number.MAX_SAFE_INTEGER,
      class: `${itemPrefixCls.value}-rest`,
      registerSize: registerOverflowSize,
      display: displayRest.value,
    }));

    const mergedRenderRest = computed(() => renderRest || defaultRenderRest);

    const RestNode = () =>
      renderRawRest ? (
        <OverflowContextProvider value={{ ...itemSharedProps.value, ...restContextProps.value }}>
          {renderRawRest(omittedItems.value)}
        </OverflowContextProvider>
      ) : (
        <Item {...itemSharedProps.value} {...restContextProps.value}>
          {typeof mergedRenderRest.value === 'function' ? mergedRenderRest.value(omittedItems.value) : mergedRenderRest.value}
        </Item>
      );

    const OverflowNode = () => (
      <Component class={clsx(!invalidate.value && prefixCls, className)} style={style} ref={ref} {...restProps}>
        {/* Prefix Node */}
        <Item
          v-if={prefix}
          {...itemSharedProps.value}
          responsive={isResponsive.value}
          responsiveDisabled={!shouldResponsive.value}
          order={-1}
          class={`${itemPrefixCls.value}-prefix`}
          registerSize={registerPrefixSize}
          display
        >
          <Render content={prefix}></Render>
        </Item>

        {mergedData.value.map(internalRenderItemNode)}

        {/* Rest Count Item */}
        <RestNode v-if={showRest.value}></RestNode>

        {/* Suffix Node */}
        <Item
          v-if={suffix}
          {...itemSharedProps.value}
          responsive={isResponsive.value}
          responsiveDisabled={!shouldResponsive.value}
          order={mergedDisplayCount.value}
          class={`${itemPrefixCls.value}-suffix`}
          registerSize={registerSuffixSize}
          display
          style={suffixStyle.value}
        >
          <Render content={prefix}></Render>
        </Item>
      </Component>
    );

    return () =>
      isResponsive.value ? (
        <ResizeObserver onResize={onOverflowResize} disabled={!shouldResponsive.value}>
          <OverflowNode></OverflowNode>
        </ResizeObserver>
      ) : (
        <OverflowNode></OverflowNode>
      );
  },
  { inheritAttrs: false, name: process.env.NODE_ENV !== 'production' ? 'Overflow' : undefined },
);

type FilledOverflowType = typeof Overflow & {
  Item: typeof RawItem;
  RESPONSIVE: typeof RESPONSIVE;
  /** Will work as normal `component`. Skip patch props like `prefixCls`. */
  INVALIDATE: typeof INVALIDATE;
};

const ForwardOverflow = Overflow as FilledOverflowType;

ForwardOverflow.Item = RawItem;
ForwardOverflow.RESPONSIVE = RESPONSIVE;
ForwardOverflow.INVALIDATE = INVALIDATE;

// Convert to generic type
export default ForwardOverflow;
