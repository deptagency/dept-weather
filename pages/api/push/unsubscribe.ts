/* eslint-disable no-console */
import { NextRequest, NextResponse } from 'next/server';
import { PUSH_RESP_JSON_CONTENT_HEADERS, PUSH_URL_REGEX, PUSH_UUID_V1_REGEX } from 'constants/server';
import { Database, db } from 'helpers/api/database';
import { UnSubscribeRequest, UnSubscribeResponse } from 'models/api/push/unsubscribe.model';
import { Response as ResponseModel } from 'models/api/response.model';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

/**
 * DELETE: Delete entry in pushSubscriptions for @param subscription.endpoint or @param uuid
 */
export default async function unsubscribe(req: NextRequest) {
  const response: Omit<ResponseModel<UnSubscribeResponse | null>, 'validUntil' | 'latestReadTime'> = {
    data: null,
    warnings: [],
    errors: []
  };
  if (req.method !== 'DELETE') {
    response.errors.push(`${req.method} is not supported`);
    console.error(response.errors[0]);
    return new NextResponse(JSON.stringify(response), { headers: PUSH_RESP_JSON_CONTENT_HEADERS, status: 405 });
  }

  let unSubReq: UnSubscribeRequest;
  try {
    unSubReq = await req.json();
  } catch {
    response.errors.push('Invalid request body');
    console.error(response.errors[0]);
    return new NextResponse(JSON.stringify(response), { headers: PUSH_RESP_JSON_CONTENT_HEADERS, status: 400 });
  }

  let uuid: string | undefined;
  if ('uuid' in unSubReq) {
    if (typeof unSubReq.uuid === 'string' && PUSH_UUID_V1_REGEX.test(unSubReq.uuid)) {
      uuid = unSubReq.uuid;
    } else {
      response.warnings.push('req.uuid is not a valid UUID');
    }
  }

  let endpoint: string | undefined;
  if ('subscription' in unSubReq) {
    if (unSubReq.subscription == null || typeof unSubReq.subscription !== 'object') {
      response.warnings.push('req.subscription is not an object');
    } else if (
      typeof unSubReq.subscription.endpoint !== 'string' ||
      !PUSH_URL_REGEX.test(unSubReq.subscription.endpoint)
    ) {
      response.warnings.push('req.subscription.endpoint is not a valid URL string');
    } else {
      endpoint = unSubReq.subscription.endpoint;
    }
  }

  if (uuid == null && endpoint == null) {
    response.errors.push('Neither req.uuid nor req.subscription.endpoint are valid');
    console.error(`${response.errors} for: ${JSON.stringify(unSubReq)}`);
    return new NextResponse(JSON.stringify(response), { headers: PUSH_RESP_JSON_CONTENT_HEADERS, status: 400 });
  }

  try {
    let existingRecord: { uuid: Database['pushSubscriptions']['id'] } | null = null;
    // Lookup pushSubscriptions record by endpoint
    if (endpoint != null) {
      existingRecord =
        (await db
          .selectFrom('pushSubscriptions')
          .select(eb => eb.fn<string>('BIN_TO_UUID', ['id']).as('uuid'))
          .where('endpoint', '=', endpoint)
          .executeTakeFirst()) ?? null;
    }
    // Fallback to lookup pushSubscriptions record by uuid if not found by endpoint
    if (existingRecord == null && uuid != null) {
      existingRecord =
        (await db
          .selectFrom('pushSubscriptions')
          .select(eb => eb.fn<string>('BIN_TO_UUID', ['id']).as('uuid'))
          .where('id', '=', ({ fn, val }) => fn('UUID_TO_BIN', [val(uuid)]))
          .executeTakeFirst()) ?? null;
    }

    if (existingRecord != null) {
      // Use existing record's uuid in case query param not provided or incorrect
      uuid = existingRecord.uuid;

      // Unsubscribe from all city subscriptions
      await db
        .deleteFrom('alertCitySubscriptions')
        .where('userId', '=', ({ fn, val }) => fn('UUID_TO_BIN', [val(uuid)]))
        .execute();

      // Delete existing pushSubscriptions record
      const deleteForUuidResult = await db
        .deleteFrom('pushSubscriptions')
        .where('id', '=', ({ fn, val }) => fn('UUID_TO_BIN', [val(uuid)]))
        .executeTakeFirst();
      if (deleteForUuidResult.numDeletedRows === BigInt(1)) {
        response.data = { uuid };
        console.log(`Deleted record for ${uuid}`);
        return new NextResponse(JSON.stringify(response), { headers: PUSH_RESP_JSON_CONTENT_HEADERS, status: 200 });
      }
    }

    response.errors.push('Could not locate record');
    console.error(`${response.errors} for: ${JSON.stringify(unSubReq)}`);
    return new NextResponse(JSON.stringify(response), { headers: PUSH_RESP_JSON_CONTENT_HEADERS, status: 404 });
  } catch (err) {
    console.error(err);
    response.errors.push('Unexpected error');
    return new NextResponse(JSON.stringify(response), { headers: PUSH_RESP_JSON_CONTENT_HEADERS, status: 500 });
  }
}
