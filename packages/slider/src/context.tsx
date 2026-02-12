import { reactiveComputed } from '@vueuse/core';
import { defineComponent, inject, provide, reactive, type InjectionKey, type Reactive } from 'vue';
import type { AriaValueFormat, Direction, SliderClassNames, SliderStyles } from './interface';

export interface SliderContextProps {
  min: number;
  max: number;
  includedStart: number;
  includedEnd: number;
  direction: Direction;
  disabled?: boolean;
  keyboard?: boolean;
  included?: boolean;
  step: number | null;
  range?: boolean;
  tabIndex: number | number[];
  ariaLabelForHandle?: string | string[];
  ariaLabelledByForHandle?: string | string[];
  ariaRequired?: boolean;
  ariaValueTextFormatterForHandle?: AriaValueFormat | AriaValueFormat[];
  classNames: SliderClassNames;
  styles: SliderStyles;
}

const SliderContext: InjectionKey<Reactive<SliderContextProps>> = Symbol('SliderContext');

export const useSliderContextInject = () => {
  return inject(
    SliderContext,
    reactive<SliderContextProps>({
      min: 0,
      max: 0,
      direction: 'ltr',
      step: 1,
      includedStart: 0,
      includedEnd: 0,
      tabIndex: 0,
      keyboard: true,
      styles: {},
      classNames: {},
    }),
  );
};

export const SliderContextProvider = defineComponent(({ value }: { value?: SliderContextProps }) => {
  provide(
    SliderContext,
    reactiveComputed(() => value),
  );
  return () => <slot></slot>;
});

export interface UnstableContextProps {
  onDragStart?: (info: { rawValues: number[]; draggingIndex: number; draggingValue: number }) => void;
  onDragChange?: (info: { rawValues: number[]; deleteIndex: number; draggingIndex: number; draggingValue: number }) => void;
}

const UnstableContext: InjectionKey<Reactive<UnstableContextProps>> = Symbol('UnstableContext');

export const useUnstableContextInject = () => {
  return inject(UnstableContext, reactive<UnstableContextProps>({}));
};

export const UnstableContextProvider = defineComponent(({ value }: { value?: UnstableContextProps }) => {
  provide(
    UnstableContext,
    reactiveComputed(() => value),
  );
  return () => <slot></slot>;
});
