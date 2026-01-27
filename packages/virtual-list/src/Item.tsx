import { defineComponent, shallowRef } from 'vue';

export interface ItemProps {
  setRef: (element: HTMLElement) => void;
}

export const Item = defineComponent(
  ({ setRef }: ItemProps) => {
    const slots = defineSlots({
      default: () => <></>,
    });
    const currentElement = shallowRef<HTMLElement | null>(null);

    const refFunc = (node) => {
      if (currentElement.value !== node) {
        currentElement.value = node;
        setRef(node);
      }
    };

    return () => <slots.default ref={refFunc}></slots.default>;
  },
  { inheritAttrs: false },
);
