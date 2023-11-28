/* eslint-disable no-console */
import { NextRequest, NextResponse } from 'next/server';
import { PUSH_RESP_JSON_CONTENT_HEADERS, PUSH_URL_REGEX, PUSH_UUID_V1_REGEX } from 'constants/server';
import { db } from 'helpers/api/database';
import { SubscribeRequest, SubscribeResponse } from 'models/api/push/subscribe.model';
import { Response as ResponseModel } from 'models/api/response.model';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

const validateRequest = (subReq: SubscribeRequest, response: Pick<ResponseModel<null>, 'errors' | 'warnings'>) => {
  if (subReq.subscription == null || typeof subReq.subscription !== 'object') {
    response.errors.push('req.subscription is not an object');
  } else {
    if (typeof subReq.subscription.endpoint !== 'string' || !PUSH_URL_REGEX.test(subReq.subscription.endpoint)) {
      response.errors.push('req.subscription.endpoint is not a valid URL string');
    }
    if (subReq.subscription.keys == null || typeof subReq.subscription.keys !== 'object') {
      response.errors.push('req.subscription.keys is not an object');
    } else {
      if (typeof subReq.subscription.keys.p256dh !== 'string' || subReq.subscription.keys.p256dh.length === 0) {
        response.errors.push('req.subscription.keys.p256dh is not a valid string');
      }
      if (typeof subReq.subscription.keys.auth !== 'string' || subReq.subscription.keys.auth.length === 0) {
        response.errors.push('req.subscription.keys.auth is not a valid string');
      }
    }
    if (
      subReq.subscription.expirationTime != null &&
      (typeof subReq.subscription.expirationTime !== 'number' || !isNaN(subReq.subscription.expirationTime))
    ) {
      response.errors.push('req.subscription.expirationTime is not a valid number');
    }
  }
};

export default async function subscribe(req: NextRequest) {
  const response: Omit<ResponseModel<SubscribeResponse | null>, 'validUntil' | 'latestReadTime'> = {
    data: null,
    warnings: [],
    errors: []
  };
  if (req.method !== 'PUT') {
    response.errors.push(`${req.method} is not supported`);
    console.error(response.errors[0]);
    return new NextResponse(JSON.stringify(response), { headers: PUSH_RESP_JSON_CONTENT_HEADERS, status: 405 });
  }

  let subReq: SubscribeRequest;
  try {
    subReq = await req.json();
  } catch {
    response.errors.push('Invalid request body');
    console.error(response.errors[0]);
    return new NextResponse(JSON.stringify(response), { headers: PUSH_RESP_JSON_CONTENT_HEADERS, status: 400 });
  }

  let uuid: string | undefined;
  if ('uuid' in subReq) {
    if (typeof subReq.uuid === 'string' && PUSH_UUID_V1_REGEX.test(subReq.uuid)) {
      uuid = subReq.uuid;
    } else {
      response.warnings.push('req.uuid is not a valid UUID');
    }
  }

  validateRequest(subReq, response);
  if (response.errors.length > 0) {
    console.error(`Request validation failed for: ${JSON.stringify(subReq)}`);
    return new NextResponse(JSON.stringify(response), { headers: PUSH_RESP_JSON_CONTENT_HEADERS, status: 400 });
  }

  try {
    const sub = {
      endpoint: subReq.subscription.endpoint,
      keyP256dh: subReq.subscription.keys.p256dh,
      keyAuth: subReq.subscription.keys.auth
    };

    const selectQuery = db
      .selectFrom('pushSubscriptions')
      .select(eb => eb.fn<string>('BIN_TO_UUID', ['id']).as('uuid'))
      .where('endpoint', '=', subReq.subscription.endpoint);

    // 1. Attempt to update any existing record with the same endpoint
    const updateForEndpointResult = await db
      .updateTable('pushSubscriptions')
      .set(({ fn, val }) => ({
        ...sub,
        expirationTime:
          subReq.subscription.expirationTime != null
            ? fn('FROM_UNIXTIME', [val(subReq.subscription.expirationTime)])
            : undefined
      }))
      .where('endpoint', '=', subReq.subscription.endpoint)
      .executeTakeFirst();
    if (updateForEndpointResult.numUpdatedRows === BigInt(1)) {
      response.data = await selectQuery.executeTakeFirstOrThrow();
      console.log(`Updated record with same endpoint for ${response.data.uuid}`);
      return new NextResponse(JSON.stringify(response), { headers: PUSH_RESP_JSON_CONTENT_HEADERS, status: 200 });
    }

    // 2. If request includes UUID, attempt to update existing record with the same UUID
    if (uuid != null) {
      const updateForUuidResult = await db
        .updateTable('pushSubscriptions')
        .set(({ fn, val }) => ({
          ...sub,
          expirationTime:
            subReq.subscription.expirationTime != null
              ? fn('FROM_UNIXTIME', [val(subReq.subscription.expirationTime)])
              : undefined
        }))
        .where(({ eb, fn, val }) => eb('id', '=', fn('UUID_TO_BIN', [val(uuid)])))
        .executeTakeFirst();
      if (updateForUuidResult.numUpdatedRows === BigInt(1)) {
        response.data = { uuid };
        console.log(`Updated record with same uuid for ${response.data.uuid}`);
        return new NextResponse(JSON.stringify(response), {
          headers: PUSH_RESP_JSON_CONTENT_HEADERS,
          status: 200
        });
      }
    }

    // 3. Add new entry
    await db
      .insertInto('pushSubscriptions')
      .values(({ fn, val }) => ({
        ...sub,
        id: fn('UUID_TO_BIN', [fn('UUID', [])]),
        expirationTime:
          subReq.subscription.expirationTime != null
            ? fn('FROM_UNIXTIME', [val(subReq.subscription.expirationTime)])
            : undefined
      }))
      .executeTakeFirstOrThrow();
    response.data = await selectQuery.executeTakeFirstOrThrow();
    console.log(`Added record for ${response.data.uuid}`);
    return new NextResponse(JSON.stringify(response), { headers: PUSH_RESP_JSON_CONTENT_HEADERS, status: 201 });
  } catch (err) {
    console.error(err);
    response.errors.push('Unexpected error');
    return new NextResponse(JSON.stringify(response), { headers: PUSH_RESP_JSON_CONTENT_HEADERS, status: 500 });
  }
}
