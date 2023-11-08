/* eslint-disable no-console */
import { NextRequest, NextResponse } from 'next/server';
import { db } from 'helpers/api/database';
import { UnSubscribeRequest, UnSubscribeResponse } from 'models/api/push/unsubscribe.model';
import { Response as ResponseModel } from 'models/api/response.model';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

const UUID_V1_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const URL_REGEX =
  /^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_+.~#?&/=]*)$/;
const RESP_JSON_CONTENT_HEADERS: HeadersInit = { 'content-type': 'application/json' };

export default async function unsubscribe(req: NextRequest) {
  const response: Omit<ResponseModel<UnSubscribeResponse | null>, 'validUntil' | 'latestReadTime'> = {
    data: null,
    warnings: [],
    errors: []
  };
  if (req.method !== 'PATCH') {
    response.errors.push(`${req.method} is not supported`);
    console.error(response.errors[0]);
    return new NextResponse(JSON.stringify(response), { status: 405 });
  }

  let unSubReq: UnSubscribeRequest;
  try {
    unSubReq = await req.json();
  } catch {
    response.errors.push('Invalid request body');
    console.error(response.errors[0]);
    return new NextResponse(JSON.stringify(response), { headers: RESP_JSON_CONTENT_HEADERS, status: 400 });
  }

  let uuid: string | undefined;
  if ('uuid' in unSubReq) {
    if (typeof unSubReq.uuid === 'string' && UUID_V1_REGEX.test(unSubReq.uuid)) {
      uuid = unSubReq.uuid;
    } else {
      response.warnings.push('req.uuid was not a valid UUID');
    }
  }

  let endpoint: string | undefined;
  if ('subscription' in unSubReq) {
    if (unSubReq.subscription == null || typeof unSubReq.subscription !== 'object') {
      response.warnings.push('req.subscription was not an object');
    } else if (typeof unSubReq.subscription.endpoint !== 'string' || !URL_REGEX.test(unSubReq.subscription.endpoint)) {
      response.warnings.push('req.subscription.endpoint was not a valid URL string');
    } else {
      endpoint = unSubReq.subscription.endpoint;
    }
  }

  if (uuid == null && endpoint == null) {
    response.errors.push('Neither req.uuid nor req.subscription.endpoint were valid');
    console.error(`${response.errors} for: ${JSON.stringify(unSubReq)}`);
    return new NextResponse(JSON.stringify(response), { headers: RESP_JSON_CONTENT_HEADERS, status: 400 });
  }

  try {
    const emptySub = {
      endpoint: null,
      expirationTime: null,
      keyP256dh: null,
      keyAuth: null
    };

    // 1. Attempt to update existing record with the same endpoint
    if (endpoint != null) {
      // Get the uuid from the existingRecord before clearing the subscription data
      const existingRecord =
        (await db
          .selectFrom('pushSubscriptions')
          .select(eb => eb.fn<string>('BIN_TO_UUID', ['id']).as('uuid'))
          .where('endpoint', '=', endpoint)
          .executeTakeFirst()) ?? null;

      if (existingRecord != null) {
        const updateForEndpointResult = await db
          .updateTable('pushSubscriptions')
          .set(({ fn }) => ({
            ...emptySub,
            unSubscribedAt: fn('NOW', [])
          }))
          .where('endpoint', '=', endpoint)
          .executeTakeFirst();
        if (updateForEndpointResult.numUpdatedRows === BigInt(1)) {
          response.data = existingRecord;
          console.log(`Updated record with same endpoint for ${response.data.uuid}`);
          return new NextResponse(JSON.stringify(response), { headers: RESP_JSON_CONTENT_HEADERS, status: 200 });
        }
      }
    }

    // 2. Attempt to update existing record with the same UUID
    if (uuid != null) {
      const updateForUuidResult = await db
        .updateTable('pushSubscriptions')
        .set(({ fn }) => ({
          ...emptySub,
          unSubscribedAt: fn('NOW', [])
        }))
        .where(({ eb, fn, val }) => eb('id', '=', fn('UUID_TO_BIN', [val(uuid)])))
        .executeTakeFirst();
      if (updateForUuidResult.numUpdatedRows === BigInt(1)) {
        response.data = { uuid };
        console.log(`Updated record with same uuid for ${response.data.uuid}`);
        return new NextResponse(JSON.stringify(response), { headers: RESP_JSON_CONTENT_HEADERS, status: 200 });
      }
    }

    response.errors.push('Could not locate record');
    console.error(`${response.errors} for: ${JSON.stringify(unSubReq)}`);
    return new NextResponse(JSON.stringify(response), { headers: RESP_JSON_CONTENT_HEADERS, status: 404 });
  } catch (err) {
    console.error(err);
    response.errors.push('Failed to update record in database');
    return new NextResponse(JSON.stringify(response), { headers: RESP_JSON_CONTENT_HEADERS, status: 500 });
  }
}
