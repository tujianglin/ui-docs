import { reactiveComputed } from '@vueuse/core';
import { defineComponent, inject, type InjectionKey, provide, reactive } from 'vue';

export interface MotionContextProps {
  motion?: boolean;
}

export const MotionContextKey: InjectionKey<MotionContextProps> = Symbol('MotionContextKey');

export const useMotionContext = () => inject(MotionContextKey, reactive({ motion: undefined }));

export const MotionProvider = defineComponent(({ value }: { value: MotionContextProps }) => {
  const slots = defineSlots({
    default: () => <></>,
  });
  provide(
    MotionContextKey,
    reactiveComputed(() => value),
  );
  return () => <slots.default />;
});
