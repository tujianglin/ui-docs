import { defineComponent, inject, provide, type InjectionKey, type PropType } from 'vue';
import type { SizeInfo } from '.';

type onCollectionResize = (size: SizeInfo, element: HTMLElement, data: any) => void;

const CollectionContext: InjectionKey<onCollectionResize> = Symbol('CollectionContext');

export const useCollectionContextInject = () => {
  return inject(CollectionContext, null);
};

export const CollectionContextProvider = defineComponent({
  props: {
    value: Function as PropType<onCollectionResize>,
  },
  setup(props, { slots }) {
    provide(CollectionContext, props.value);
    return () => slots.default?.();
  },
});
