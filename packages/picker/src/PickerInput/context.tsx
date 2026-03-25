import { inject, provide, reactive, type InjectionKey, type Reactive } from 'vue';
import type { GenerateConfig } from '../generate';
import type { FilledClassNames, FilledStyles } from '../hooks/useSemantic';
import type { Components, Locale } from '../interface';

export interface PickerContextProps {
  prefixCls: string;
  locale: Locale;
  generateConfig: GenerateConfig;
  /** Customize button component */
  button?: Components['button'];
  input?: Components['input'];
  classNames: FilledClassNames;
  styles: FilledStyles;
}

const PickerContext: InjectionKey<Reactive<PickerContextProps>> = Symbol('PickerContext');

export const usePickerContextInject = (): Reactive<Partial<PickerContextProps>> => {
  return inject(PickerContext, reactive({}));
};

export const usePickerContextProvider = (props: Reactive<PickerContextProps>) => {
  provide(PickerContext, props);
};
