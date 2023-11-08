import { PushSubscription as WebPushSubscription } from 'web-push';

export interface SubscribeRequest {
  uuid?: string;
  subscription: WebPushSubscription & Pick<PushSubscriptionJSON, 'expirationTime'>;
}

export type SubscribeResponse = Required<Pick<SubscribeRequest, 'uuid'>>;
