import { reactiveComputed } from '@vueuse/core';
import { defineComponent, inject, provide, reactive, type InjectionKey, type Reactive } from 'vue';

export interface RefContextProps {
  panel?: HTMLDivElement;
}

const RefContext: InjectionKey<Reactive<RefContextProps>> = Symbol('RefContext');

export const useRefContextInject = (): Reactive<RefContextProps> => {
  return inject(RefContext, reactive({} as RefContextProps));
};

export const RefContextProvider = defineComponent(({ value }: { value: RefContextProps }) => {
  provide(
    RefContext,
    reactiveComputed(() => value),
  );
  return () => <slot></slot>;
});
