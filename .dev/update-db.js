// Script to sync the database's cities & alertCitySubscriptions tables to reflect the cities.json input file
//  Inputs:
//    - "cities.json" file
//  Effects:
//    - Adds new row for each new city
//    - Updates existing row for each updated city
//    - Deletes existing rows in cities & alertCitySubscriptions for each removed city
//  How to use:
//    1. Run "node .dev/update-db.js" in the terminal from the root project directory

import { DOT_DATA_PATH } from './constants.js';
import { db, read } from './utils.js';

const ZONE_KEYS = ['forecastZone', 'countyZone', 'fireZone'];

const run = async () => {
  const cities = (await read(`${DOT_DATA_PATH}cities.json`)).map(city => {
    const cityAndStateCode = `${city.cityName}, ${city.stateCode}`;
    return {
      ...city,
      cityAndStateCode,
      cityAndStateCodeLower: cityAndStateCode.toLowerCase()
    };
  });

  console.log('Getting cities with zone data from database...');
  const dbCitiesWithZoneData = await db
    .selectFrom('cities')
    .selectAll()
    .where(eb => eb.or(ZONE_KEYS.map(zoneKey => eb(zoneKey, 'is not', null))))
    .execute();
  for (const dbCity of dbCitiesWithZoneData) {
    const city = cities.find(city => city.geonameid === dbCity.geonameid);
    if (city != null) {
      // Copy zone data from database
      for (const zoneKey of [...ZONE_KEYS, 'zonesLastUpdated']) {
        city[zoneKey] = dbCity[zoneKey];
      }

      // If latitude or longitude changed, mark the zonesLastUpdated to be very old so the cron job updates them
      const didCoordinatesChange =
        Number(dbCity.latitude) !== city.latitude || Number(dbCity.longitude) !== city.longitude;
      if (didCoordinatesChange) {
        console.log(
          `  * Coordinates changed from "${Number(dbCity.latitude)},${Number(dbCity.longitude)}" to "${city.latitude},${
            city.longitude
          }" for ${city.geonameid} / "${city.cityAndStateCode}"`
        );
      }
      city.zonesLastUpdated = didCoordinatesChange ? '1970-01-01' : city.zonesLastUpdated;
    }
  }

  console.log('Adding/updating rows...');
  for (let i = 0; i < cities.length; ) {
    const end = Math.min(cities.length, i + 1000);
    console.log(`  For cities.slice(${i}, ${end})...`);
    const updateResult = await db.replaceInto('cities').values(cities.slice(i, end)).executeTakeFirstOrThrow();
    console.log(`  ${updateResult.numInsertedOrUpdatedRows} rows successfully inserted/updated!`);
    i = end;
  }

  console.log('Deleting alertCitySubscriptions for old cities...');
  const deleteSubsResult = await db
    .deleteFrom('alertCitySubscriptions')
    .where(
      'geonameid',
      'not in',
      cities.map(city => city.geonameid)
    )
    .executeTakeFirstOrThrow();
  console.log(`  Deleted ${deleteSubsResult.numDeletedRows} alertCitySubscriptions rows successfully!`);

  console.log('Deleting rows for old cities...');
  const deleteCitiesResult = await db
    .deleteFrom('cities')
    .where(
      'geonameid',
      'not in',
      cities.map(city => city.geonameid)
    )
    .executeTakeFirstOrThrow();
  console.log(`  Deleted ${deleteCitiesResult.numDeletedRows} cities rows successfully!`);
};

run();
