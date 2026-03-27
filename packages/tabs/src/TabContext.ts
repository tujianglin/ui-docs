import { inject, provide, reactive, type InjectionKey, type Reactive } from 'vue';
import type { Tab } from './interface';

export interface TabContextProps {
  tabs: Tab[];
  prefixCls: string;
}

const TabContext: InjectionKey<Reactive<TabContextProps>> = Symbol('TabContext');

export const useTabContextInject = () => {
  return inject(TabContext, reactive({} as TabContextProps));
};

export const useTabContextProvider = (props: Reactive<TabContextProps>) => {
  provide(TabContext, props);
};
