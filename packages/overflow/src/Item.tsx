import ResizeObserver from '@vc-com/resize-observer';
import type { VueNode } from '@vc-com/util/lib/types';
import { clsx } from 'clsx';
import { computed, defineComponent, onBeforeUnmount, type CSSProperties } from 'vue';
import { useRef, type HTMLAttributes } from 'vue-jsx-vapor';

// Use shared variable to save bundle size
const UNDEFINED = undefined;

export interface ItemProps<ItemType> extends HTMLAttributes<any> {
  prefixCls: string;
  item?: ItemType;
  class?: string;
  style?: CSSProperties;
  renderItem?: (item: ItemType, info: { index: number }) => VueNode;
  responsive?: boolean;
  // https://github.com/ant-design/ant-design/issues/35475
  /**
   * @private To make node structure stable. We need keep wrap with ResizeObserver.
   * But disable it when it's no need to real measure.
   */
  responsiveDisabled?: boolean;
  itemKey?: PropertyKey;
  registerSize: (key: PropertyKey, width: number | null) => void;
  display: boolean;
  order: number;
  component?: any;
  invalidate?: boolean;
}

const Item = defineComponent(
  ({
    prefixCls,
    invalidate,
    item,
    renderItem,
    responsive,
    responsiveDisabled,
    registerSize,
    itemKey,
    class: className,
    style,
    display,
    order,
    component: Component = 'div',
    ...restProps
  }: ItemProps<any>) => {
    const slots = defineSlots<{ default: () => any }>();
    const domRef = useRef();
    const mergedHidden = computed(() => responsive && !display);

    // ================================ Effect ================================
    function internalRegisterSize(width: number | null) {
      registerSize(itemKey!, width);
    }

    onBeforeUnmount(() => {
      internalRegisterSize(null);
    });

    defineExpose({
      get nativeElement() {
        return domRef.value;
      },
    });

    // ================================ Render ================================

    let overflowStyle = computed(() => {
      let result: CSSProperties | undefined;
      if (!invalidate) {
        result = {
          opacity: mergedHidden.value ? 0 : 1,
          height: mergedHidden.value ? 0 : UNDEFINED,
          overflowY: mergedHidden.value ? 'hidden' : UNDEFINED,
          order: responsive ? order : UNDEFINED,
          pointerEvents: mergedHidden.value ? 'none' : UNDEFINED,
          position: mergedHidden.value ? 'absolute' : UNDEFINED,
        };
      }
      return result;
    });

    const overflowProps = computed(() => {
      const result: HTMLAttributes<any> = {};
      if (mergedHidden.value) {
        result['aria-hidden'] = true;
      }
      return result;
    });

    const ItemNode = () => (
      <Component
        class={clsx(!invalidate && prefixCls, className)}
        style={{
          ...overflowStyle.value,
          ...style,
        }}
        {...overflowProps.value}
        {...restProps}
        ref={domRef}
      >
        {renderItem && item !== UNDEFINED ? renderItem(item, { index: order }) : slots.default?.()}
      </Component>
    );

    return () => {
      if (!responsive) {
        return <ItemNode></ItemNode>;
      }
      return (
        <ResizeObserver
          onResize={({ offsetWidth }) => {
            internalRegisterSize(offsetWidth);
          }}
          disabled={responsiveDisabled}
        >
          <ItemNode></ItemNode>
        </ResizeObserver>
      );
    };
  },
  { inheritAttrs: false, name: process.env.NODE_ENV !== 'production' ? 'Item' : undefined },
);

export default Item;
