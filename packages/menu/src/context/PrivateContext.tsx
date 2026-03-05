import { defineComponent, inject, provide, type InjectionKey } from 'vue';
import type { MenuProps } from '../Menu';

export interface PrivateContextProps {
  _internalRenderMenuItem?: MenuProps['_internalRenderMenuItem'];
  _internalRenderSubMenuItem?: MenuProps['_internalRenderSubMenuItem'];
}

const PrivateContext: InjectionKey<PrivateContextProps> = Symbol('PrivateContext');

export const usePrivateContextInject = () => {
  return inject(PrivateContext, {});
};

export const PrivateContextProvider = defineComponent((props: { value: PrivateContextProps }) => {
  provide(PrivateContext, props.value);
  return () => <slot></slot>;
});
