import { inject, provide, reactive, type InjectionKey, type Reactive } from 'vue';

export interface NotificationContextProps {
  classNames?: {
    notice?: string;
    list?: string;
  };
}

const NotificationContext: InjectionKey<Reactive<NotificationContextProps>> = Symbol('NotificationContext');

export const useNotificationContextInject = (): Reactive<NotificationContextProps> => {
  return inject(NotificationContext, reactive({}));
};

export const useNotificationContextProvider = (props: Reactive<NotificationContextProps>) => {
  provide(NotificationContext, props);
};
