/* tslint:disable: no-object-literal-type-assertion */
import type { RenderNode } from '@vc-com/util/lib/types';
import { reactiveComputed } from '@vueuse/core';
import { defineComponent, inject, provide, reactive, type InjectionKey, type Reactive } from 'vue';
import type { FocusEventHandler, UIEventHandler } from 'vue-jsx-vapor';
import type { OptionProps } from './Option';

export interface MentionsContextProps {
  notFoundContent: RenderNode;
  activeIndex: number;
  setActiveIndex: (index: number) => void;
  selectOption: (option: OptionProps) => void;
  onFocus: FocusEventHandler<HTMLElement>;
  onBlur: FocusEventHandler<HTMLElement>;
  onScroll: UIEventHandler<HTMLElement>;
}

// We will never use default, here only to fix TypeScript warning
const MentionsContext: InjectionKey<Reactive<MentionsContextProps>> = Symbol('MentionsContext');

export const useMentionsContextInject = () => {
  return inject(MentionsContext, reactive({} as MentionsContextProps));
};

export const MentionsContextProvider = defineComponent(({ value }: { value: MentionsContextProps }) => {
  provide(
    MentionsContext,
    reactiveComputed(() => value),
  );

  return () => <slot></slot>;
});
