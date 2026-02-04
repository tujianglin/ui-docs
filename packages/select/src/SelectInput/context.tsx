import { reactiveComputed } from '@vueuse/core';
import { defineComponent, inject, provide, reactive, type InjectionKey, type Reactive } from 'vue';
import type { SelectInputProps } from '.';

export type ContentContextProps = SelectInputProps;

const SelectInputContext: InjectionKey<Reactive<ContentContextProps>> = Symbol('SelectInputContext');

export const useSelectInputContextInject = () => {
  return inject(SelectInputContext, reactive({} as ContentContextProps));
};

export const SelectInputContextProvider = defineComponent(({ value }: { value: ContentContextProps }) => {
  const slots = defineSlots({ default: () => <></> });
  provide(
    SelectInputContext,
    reactiveComputed(() => value),
  );
  return () => <slots.default />;
});
