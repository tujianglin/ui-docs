import { inject, provide, type ComputedRef, type InjectionKey } from 'vue';

export type QueueCreate = (appendFunc: VoidFunction) => void;

const OrderContext: InjectionKey<ComputedRef<QueueCreate>> = Symbol('OrderContext');

export const useOrderContextInject = () => inject(OrderContext, null);

export const useOrderContextProvider = (queueCreate: ComputedRef<QueueCreate>) => {
  provide(OrderContext, queueCreate);
};
