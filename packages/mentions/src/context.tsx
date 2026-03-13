import { reactiveComputed } from '@vueuse/core';
import { defineComponent, inject, provide, reactive, type InjectionKey, type Reactive } from 'vue';

export interface UnstableContextProps {
  /** Only used for antd site v6 preview usage. */
  open?: boolean;
}

// We will never use default, here only to fix TypeScript warning
const UnstableContext: InjectionKey<Reactive<UnstableContextProps>> = Symbol('UnstableContext');

export const useUnstableContextInject = () => {
  return inject(UnstableContext, reactive({} as UnstableContextProps));
};

export const UnstableContextProvider = defineComponent(({ value }: { value: UnstableContextProps }) => {
  provide(
    UnstableContext,
    reactiveComputed(() => value),
  );
  return () => <slot></slot>;
});
