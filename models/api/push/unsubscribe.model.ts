import { SubscribeRequest, SubscribeResponse } from 'models/api/push/subscribe.model';

export type UnSubscribeRequest = UnSubReqForUuid | UnSubReqForEndpoint;

export type UnSubReqForUuid = Required<Pick<SubscribeRequest, 'uuid'>>;

export interface UnSubReqForEndpoint {
  subscription: Pick<SubscribeRequest['subscription'], 'endpoint'>;
}

export type UnSubscribeResponse = SubscribeResponse;
