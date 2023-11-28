/* eslint-disable no-console */
import { NextRequest, NextResponse } from 'next/server';
import { PUSH_RESP_JSON_CONTENT_HEADERS, PUSH_UUID_V1_REGEX } from 'constants/server';
import { API_GEONAMEID_KEY, API_UUID_KEY } from 'constants/shared';
import { Database, db } from 'helpers/api/database';
import { NwsHelper } from 'helpers/api/nws/nws-helper';
import { CoordinatesHelper } from 'helpers/coordinates-helper';
import { CityAlertsResponse } from 'models/api/push/city-alerts.model';
import { Response as ResponseModel } from 'models/api/response.model';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

/**
 * GET: Return subscribed cities for given @param uuid as an array of objects containing subscribed city details
 * PATCH: Add a subscription to the city with the geoname @param id for given @param uuid
 * DELETE: Remove a subscription to the city with the geoname @param id for given @param uuid
 */
export default async function cityAlerts(req: NextRequest) {
  const response: Omit<ResponseModel<CityAlertsResponse | null>, 'validUntil' | 'latestReadTime'> = {
    data: null,
    warnings: [],
    errors: []
  };
  if (req.method !== 'GET' && req.method !== 'PATCH' && req.method !== 'DELETE') {
    response.errors.push(`${req.method} is not supported`);
    console.error(response.errors[0]);
    return new NextResponse(JSON.stringify(response), { headers: PUSH_RESP_JSON_CONTENT_HEADERS, status: 405 });
  }

  const reqStr = JSON.stringify(Object.fromEntries(req.nextUrl.searchParams.entries()));
  const uuid = req.nextUrl.searchParams.get(API_UUID_KEY);
  const geonameidStr = req.nextUrl.searchParams.get(API_GEONAMEID_KEY);

  // Validate request
  if (typeof uuid !== 'string' || !PUSH_UUID_V1_REGEX.test(uuid)) {
    response.errors.push('uuid is not a valid UUID');
  }
  if (req.method !== 'GET') {
    if (typeof geonameidStr !== 'string') {
      response.errors.push('id is not a string');
    } else if (!Number.isInteger(Number(geonameidStr)) || Number(geonameidStr) <= 0) {
      response.errors.push('id is not a valid number');
    }
  }
  if (response.errors.length > 0) {
    console.error(`Request validation failed for: ${reqStr}`);
    return new NextResponse(JSON.stringify(response), { headers: PUSH_RESP_JSON_CONTENT_HEADERS, status: 400 });
  }

  try {
    // Check subscription record
    const existingSubscriptionRecord = await db
      .selectFrom('pushSubscriptions')
      .select(eb => eb.fn<string>('BIN_TO_UUID', ['id']).as('uuid'))
      .where(({ eb, fn, val }) => eb('id', '=', fn('UUID_TO_BIN', [val(uuid)])))
      .executeTakeFirst();
    if (existingSubscriptionRecord == null) {
      response.errors.push('Could not locate record in pushSubcriptions for uuid');
      console.error(`${response.errors[0]}: ${reqStr}`);
      return new NextResponse(JSON.stringify(response), { headers: PUSH_RESP_JSON_CONTENT_HEADERS, status: 404 });
    }

    // Get details for previously subscribed cities
    response.data = await db
      .selectFrom('cities as c')
      .select(['c.cityName', 'c.stateCode', 'c.latitude', 'c.longitude', 'c.timeZone', 'c.geonameid'])
      .innerJoin(
        eb =>
          eb
            .selectFrom('alertCitySubscriptions as acs')
            .select(['acs.geonameid'])
            .distinct()
            .where(({ eb, fn, val }) => eb('acs.userId', '=', fn('UUID_TO_BIN', [val(uuid)])))
            .as('acs'),
        join => join.onRef('c.geonameid', '=', 'acs.geonameid')
      )
      .execute();
    for (const c of response.data) {
      c.latitude = Number(c.latitude);
      c.longitude = Number(c.longitude);
    }

    if (req.method === 'GET') {
      return new NextResponse(JSON.stringify(response), { headers: PUSH_RESP_JSON_CONTENT_HEADERS, status: 200 });
    }

    const geonameid = Number(geonameidStr);
    if (req.method === 'PATCH') {
      // Detect if an alertCitySubscriptions record already exists for geonameid
      const prevRecordIdx = response.data.findIndex(city => city.geonameid === geonameid);
      if (prevRecordIdx !== -1) {
        response.warnings.push(`City alert subscription record already exists at data[${prevRecordIdx}]`);
        return new NextResponse(JSON.stringify(response), { headers: PUSH_RESP_JSON_CONTENT_HEADERS, status: 200 });
      }

      // Query city to confirm validity & get details
      const cityToPatch = await db
        .selectFrom('cities')
        .selectAll()
        .where('geonameid', '=', geonameid)
        .executeTakeFirst();

      if (cityToPatch == null) {
        response.errors.push('req.geonameid has no matching city');
        console.error(`${response.errors[0]}: ${reqStr}`);
        return new NextResponse(JSON.stringify(response), { headers: PUSH_RESP_JSON_CONTENT_HEADERS, status: 400 });
      }

      // Fetch the city's NWS zones and update the cities table before adding subscription
      if (cityToPatch.forecastZone == null || cityToPatch.countyZone == null || cityToPatch.fireZone == null) {
        console.log(
          `Calling NWS API since one or more zones is nullish for "${cityToPatch.cityAndStateCode}" / ${geonameidStr}...`
        );
        try {
          const points = await NwsHelper.getPoints(CoordinatesHelper.cityToStr(cityToPatch));
          const updateResult = await db
            .updateTable('cities')
            .set(({ fn }) => ({
              forecastZone: points.item.properties.forecastZone.slice(-6),
              countyZone: points.item.properties.county.slice(-6),
              fireZone: points.item.properties.fireWeatherZone.slice(-6),
              zonesLastUpdated: fn('NOW', [])
            }))
            .where('geonameid', '=', cityToPatch.geonameid)
            .executeTakeFirst();
          if (updateResult.numUpdatedRows === BigInt(0)) {
            response.errors.push('Could not update zone information for city');
            console.error(response.errors[0]);
            return new NextResponse(JSON.stringify(response), { headers: PUSH_RESP_JSON_CONTENT_HEADERS, status: 500 });
          }
        } catch (err) {
          response.errors.push('Could not retrieve zone information for city');
          console.error(response.errors[0], err);
          return new NextResponse(JSON.stringify(response), { headers: PUSH_RESP_JSON_CONTENT_HEADERS, status: 500 });
        }
      }

      const insertResult = await db
        .insertInto('alertCitySubscriptions')
        .values(
          ({ fn, val }) =>
            ({
              userId: fn('UUID_TO_BIN', [val(uuid)]),
              geonameid: geonameidStr
            }) as unknown as Database['alertCitySubscriptions']
        )
        .executeTakeFirst();
      if (insertResult.numInsertedOrUpdatedRows === BigInt(1)) {
        response.data.push({
          cityName: cityToPatch.cityName,
          stateCode: cityToPatch.stateCode,
          latitude: Number(cityToPatch.latitude),
          longitude: Number(cityToPatch.longitude),
          timeZone: cityToPatch.timeZone,
          geonameid: cityToPatch.geonameid
        });
        response.data.sort((a, b) => a.geonameid - b.geonameid);
        return new NextResponse(JSON.stringify(response), { headers: PUSH_RESP_JSON_CONTENT_HEADERS, status: 201 });
      }
      response.errors.push('Record could not be created in alertCitySubscriptions');
    } else {
      // Detect if an alertCitySubscriptions record did not previously exist for geonameid
      const prevRecordIdx = response.data.findIndex(city => city.geonameid === geonameid);
      if (prevRecordIdx === -1) {
        response.warnings.push('City alert subscription record did not previously exist');
        return new NextResponse(JSON.stringify(response), { headers: PUSH_RESP_JSON_CONTENT_HEADERS, status: 200 });
      }

      const deleteResult = await db
        .deleteFrom('alertCitySubscriptions')
        .where(({ and, eb, fn, val }) =>
          and([eb('userId', '=', fn('UUID_TO_BIN', [val(uuid)])), eb('geonameid', '=', geonameid)])
        )
        .executeTakeFirst();
      if (deleteResult.numDeletedRows === BigInt(1)) {
        response.data.splice(prevRecordIdx, 1);
        return new NextResponse(JSON.stringify(response), { headers: PUSH_RESP_JSON_CONTENT_HEADERS, status: 200 });
      }
      response.errors.push('Record could not be deleted from alertCitySubscriptions');
    }

    console.error(`${response.errors[0]}: ${reqStr}`);
    return new NextResponse(JSON.stringify(response), { headers: PUSH_RESP_JSON_CONTENT_HEADERS, status: 500 });
  } catch (err) {
    console.error(err);
    response.errors.push('Unexpected error');
    return new NextResponse(JSON.stringify(response), { headers: PUSH_RESP_JSON_CONTENT_HEADERS, status: 500 });
  }
}
