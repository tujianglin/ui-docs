import { createVNode, defineComponent, shallowRef, type VNode } from 'vue';
import type { DropdownProps } from './Dropdown';

export type OverlayProps = Pick<DropdownProps, 'overlay' | 'arrow' | 'prefixCls'>;

const Overlay = defineComponent(
  ({ overlay, arrow, prefixCls }: OverlayProps) => {
    const overlayRef = shallowRef();
    const setRef = (el: any) => {
      overlayRef.value = el;
    };

    return () => {
      const overlayNode = (typeof overlay === 'function' ? overlay?.() : overlay) as VNode;

      return (
        <>
          <div v-if={arrow} class={`${prefixCls}-arrow`} />
          {createVNode(overlayNode, { ref: setRef })}
        </>
      );
    };
  },
  { inheritAttrs: false },
);

export default Overlay;
