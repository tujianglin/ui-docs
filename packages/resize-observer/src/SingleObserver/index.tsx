import { filterEmpty } from '@vc-com/util/lib/props-util';
import { resolveToElement } from '@vc-com/util/lib/vnode';
import { computed, createVNode, defineComponent, isVNode } from 'vue';
import { useRef } from 'vue-jsx-vapor';
import type { ResizeObserverProps } from '..';
import { useCollectionContextInject } from '../Collection';
import useResizeObserver from '../useResizeObserver';

export interface SingleObserverProps extends ResizeObserverProps {}

const SingleObserver = defineComponent(
  (props: SingleObserverProps, { slots }) => {
    defineSlots<{ default: () => any }>();
    const { disabled, onResize, data } = $(props);

    const elementRef = useRef<Element>(null);
    const setWrapperRef = (el: any) => {
      const dom = resolveToElement(el);
      elementRef.value = dom;
    };

    const onCollectionResize = useCollectionContextInject();

    const getDomElement = () => {
      return elementRef.value as HTMLElement;
    };

    defineExpose({
      getDomElement,
    });

    // =========================== Observe ============================
    useResizeObserver(
      computed(() => !disabled),
      computed(() => getDomElement()),
      onResize,
      (sizeInfo, target) => {
        onCollectionResize?.(sizeInfo, target, data);
      },
    );

    // ============================ Render ============================
    return () => {
      const children = filterEmpty(slots.default?.());
      if (children.length === 1 && isVNode(children[0])) {
        return createVNode(children[0], {
          ref: setWrapperRef,
        });
      }
      return <slots.default />;
    };
  },
  { inheritAttrs: false, name: process.env.NODE_ENV !== 'production' && 'SingleObserver' },
);

export default SingleObserver;
