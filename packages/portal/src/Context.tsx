import type { InjectionKey, Ref } from 'vue';

export type QueueCreate = (appendFunc: VoidFunction) => void;

export const OrderContextKey: InjectionKey<Ref<QueueCreate | undefined>> = Symbol('OrderContext');
