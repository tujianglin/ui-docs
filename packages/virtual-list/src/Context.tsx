import { defineComponent, inject, provide, type InjectionKey } from 'vue';

type WheelLockContextProps = (lock: boolean) => void;

const WheelLockContext: InjectionKey<WheelLockContextProps> = Symbol('WheelLockContext');

export const useWheelLockContextInject = () => inject(WheelLockContext, null);

export const WheelLockContextProvider = defineComponent(({ value }: { value?: WheelLockContextProps }) => {
  provide(WheelLockContext, value);
  return () => <slot></slot>;
});
