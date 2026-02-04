/**
 * BaseSelect provide some parsed data into context.
 * You can use this hooks to get them.
 */

import { reactiveComputed } from '@vueuse/core';
import { defineComponent, inject, provide, reactive, type InjectionKey, type Reactive } from 'vue';
import type { BaseSelectProps } from '../BaseSelect';

export interface BaseSelectContextProps extends BaseSelectProps {
  triggerOpen: boolean;
  multiple: boolean;
  toggleOpen: (open?: boolean) => void;
  lockOptions: boolean;
}

const BaseSelectContext: InjectionKey<Reactive<BaseSelectContextProps>> = Symbol('BaseSelectContext');

export const useBaseSelectContextInject = () => {
  return inject(BaseSelectContext, reactive({} as BaseSelectContextProps));
};

export const BaseSelectContextProvider = defineComponent(({ value }: { value: BaseSelectContextProps }) => {
  const slots = defineSlots({ default: () => <></> });
  provide(
    BaseSelectContext,
    reactiveComputed(() => value),
  );
  return () => <slots.default />;
});
