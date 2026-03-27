import { inject, provide, reactive, type InjectionKey, type Reactive } from 'vue';

export interface UnstableContextProps {
  /**
   * Used for Timeline component `reverse` prop.
   * Safe to remove if refactor.
   */
  railFollowPrevStatus?: boolean;
}

const UnstableContext: InjectionKey<Reactive<UnstableContextProps>> = Symbol('UnstableContext');

export const useUnstableContextInject = (): Reactive<UnstableContextProps> => {
  return inject(UnstableContext, reactive({}));
};

export const useUnstableContextProvider = (props: Reactive<UnstableContextProps>) => {
  provide(UnstableContext, props);
};
