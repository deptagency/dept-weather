import { PushSubscription, RequestOptions } from 'web-push';

export interface NotifyRequest {
  uuid: string;
  subscription: PushSubscription;
  title: string;
  notificationOptions: NotificationOptions | undefined;
  requestOptions: RequestOptions;
}
