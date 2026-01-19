import { reactiveComputed } from '@vueuse/core';
import { defineComponent, inject, type InjectionKey, type PropType, provide, reactive } from 'vue';

export interface MotionContextProps {
  motion?: boolean;
}

export const MotionContextKey: InjectionKey<MotionContextProps> = Symbol('MotionContextKey');

export const useMotionContext = () => inject(MotionContextKey, reactive({ motion: undefined }));

export const MotionProvider = defineComponent({
  props: {
    value: Object as PropType<MotionContextProps>,
  },
  setup(props, { slots }) {
    provide(
      MotionContextKey,
      reactiveComputed(() => props.value),
    );
    return () => <slots.default />;
  },
});
