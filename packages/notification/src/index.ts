import type { NotificationAPI, NotificationConfig } from './hooks/useNotification';
import useNotification from './hooks/useNotification';
import Notice from './Notice';
import { useNotificationContextInject, useNotificationContextProvider } from './NotificationProvider';

export { Notice, useNotification, useNotificationContextInject, useNotificationContextProvider };
export type { NotificationAPI, NotificationConfig };
