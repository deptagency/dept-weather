// Script to sync the database's queryCache table to reflect the cities-topN-query-cache.json input file
//  Inputs:
//    - "cities-topN-query-cache.json" file
//  Effects:
//    - Adds new row for each new cached query
//    - Updates existing row for each updated cached query
//    - Deletes existing row for each removed cached query
//  How to use:
//    1. Run "node .dev/update-db-queryCache.js" in the terminal from the root project directory

import { DOT_DATA_PATH } from './constants.js';
import { db, getMaxNExistingQueryCache, read } from './utils.js';

const run = async () => {
  const maxNExistingQueryCache = await getMaxNExistingQueryCache();
  const queryCacheObj = await read(`${DOT_DATA_PATH}${maxNExistingQueryCache.fName}`);
  const queryCache = [];
  for (const [query, v] of Object.entries(queryCacheObj)) {
    queryCache.push({
      query,
      gid0: v[0],
      gid1: v[1],
      gid2: v[2],
      gid3: v[3],
      gid4: v[4]
    });
  }

  console.log('Adding/updating rows...');
  for (let i = 0; i < queryCache.length; ) {
    const end = Math.min(queryCache.length, i + 1000);
    console.log(`  For queryCache.slice(${i}, ${end})...`);
    const updateResult = await db.replaceInto('queryCache').values(queryCache.slice(i, end)).executeTakeFirstOrThrow();
    console.log(`  ${updateResult.numInsertedOrUpdatedRows} rows successfully inserted/updated!`);
    i = end;
  }

  console.log('Deleting rows for old cities...');
  const deleteResult = await db
    .deleteFrom('queryCache')
    .where(
      'query',
      'not in',
      queryCache.map(qc => qc.query)
    )
    .executeTakeFirstOrThrow();
  console.log(`Deleted ${deleteResult.numDeletedRows} rows successfully!`);
};

run();
