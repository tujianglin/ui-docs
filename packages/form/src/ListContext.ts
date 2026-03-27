import { inject, provide, type InjectionKey } from 'vue';
import type { InternalNamePath } from './interface';

export interface ListContextProps {
  getKey: (namePath: InternalNamePath) => [InternalNamePath[number], InternalNamePath];
}

const ListContext: InjectionKey<ListContextProps> = Symbol('ListContext');

// 提供便捷的 useListContext hook
export const useListContextInject = () => {
  return inject(ListContext, null);
};

export const useListContextProvider = (form: ListContextProps) => {
  provide(ListContext, form);
};
