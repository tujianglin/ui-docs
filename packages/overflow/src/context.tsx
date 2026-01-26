import { reactiveComputed } from '@vueuse/core';
import { defineComponent, inject, provide, reactive, type InjectionKey, type Reactive } from 'vue';

type OverflowContextProps = {
  prefixCls: string;
  responsive: boolean;
  order: number;
  registerSize: (key: PropertyKey, width: number | null) => void;
  display: boolean;

  invalidate: boolean;

  // Item Usage
  item?: any;
  itemKey?: PropertyKey;

  // Rest Usage
  class?: string;
};

const OverflowContext: InjectionKey<Reactive<OverflowContextProps>> = Symbol('OverflowContext');

export const useOverflowContextInject = () => {
  return inject(OverflowContext, reactive(null));
};

export const OverflowContextProvider = defineComponent(
  (props: { value?: OverflowContextProps }) => {
    const slots = defineSlots({
      default: () => <></>,
    });
    provide(
      OverflowContext,
      reactiveComputed(() => props.value || ({} as any)),
    );
    return () => <slots.default></slots.default>;
  },
  { inheritAttrs: false },
);
