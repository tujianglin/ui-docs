import { inject, provide, reactive, type InjectionKey, type Reactive } from 'vue';
import type { ComponentType, StepsProps } from './Steps';

export interface StepsContextProps {
  prefixCls: string;
  classNames: NonNullable<StepsProps['classNames']>;
  styles: NonNullable<StepsProps['styles']>;
  ItemComponent: ComponentType;
}

const StepsContext: InjectionKey<Reactive<StepsContextProps>> = Symbol('StepsContext');

export const useStepsContextInject = () => {
  return inject(StepsContext, reactive({} as StepsContextProps));
};

export const useStepsContextProvider = (props: Reactive<StepsContextProps>) => {
  provide(StepsContext, props);
};
