import { inject, provide, reactive, type InjectionKey, type Reactive } from 'vue';

export interface DrawerContextProps {
  pushDistance?: number | string;
  push?: VoidFunction;
  pull?: VoidFunction;
}

const DrawerContext: InjectionKey<Reactive<DrawerContextProps>> = Symbol('DrawerContext');

export const useDrawerContextInject = (): Reactive<DrawerContextProps> => {
  return inject(DrawerContext, reactive({}));
};

export const useDrawerContextProvide = (value: DrawerContextProps) => {
  provide(DrawerContext, value);
};

export interface RefContextProps {
  panel?: HTMLDivElement;
}

const RefContext: InjectionKey<Reactive<RefContextProps>> = Symbol('RefContext');

export const useRefContextInject = (): Reactive<RefContextProps> => {
  return inject(RefContext, reactive({} as RefContextProps));
};

export const useRefContextProvide = (value: RefContextProps) => {
  provide(RefContext, value);
};
