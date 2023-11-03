// Script to sync the database's cities table to reflect the cities.json input file
//  Inputs:
//    - "cities.json" file
//  Effects:
//    - Adds new row for each new city
//    - Updates existing row for each updated city
//    - Deletes existing row for each removed city
//  How to use:
//    1. Run "node .dev/update-db-cities.js" in the terminal from the root project directory

import { DOT_DATA_PATH } from './constants.js';
import { db, read } from './utils.js';

const run = async () => {
  const cities = await read(`${DOT_DATA_PATH}cities.json`);
  console.log('Adding/updating rows...');
  for (let i = 0; i < cities.length; ) {
    const end = Math.min(cities.length, i + 1000);
    console.log(`  For cities.slice(${i}, ${end})...`);
    const updateResult = await db.replaceInto('cities').values(cities.slice(i, end)).executeTakeFirstOrThrow();
    console.log(`  ${updateResult.numInsertedOrUpdatedRows} rows successfully inserted/updated!`);
    i = end;
  }

  console.log('Deleting rows for old cities...');
  const deleteResult = await db
    .deleteFrom('cities')
    .where(
      'geonameid',
      'not in',
      cities.map(city => city.geonameid)
    )
    .executeTakeFirstOrThrow();
  console.log(`Deleted ${deleteResult.numDeletedRows} rows successfully!`);
};

run();
