import { filterEmpty } from '@vc-com/util/lib/props-util';
import { cloneVNode, defineComponent, shallowRef } from 'vue';

export interface ItemProps {
  setRef: (element: HTMLElement) => void;
}

export const Item = defineComponent(
  ({ setRef }: ItemProps) => {
    const slots = defineSlots();
    const currentElement = shallowRef<HTMLElement | null>(null);

    const refFunc = (node) => {
      if (currentElement.value !== node) {
        currentElement.value = node;
        setRef(node);
      }
    };

    return () => {
      const child = filterEmpty(slots.default?.())[0];
      if (!child) return null;

      return cloneVNode(child, { ref: refFunc });
    };
  },
  { inheritAttrs: false },
);
