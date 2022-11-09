import dayjs from 'dayjs';
import { NextApiRequest, NextApiResponse } from 'next';
import { API_GEONAMEID_KEY, API_SEARCH_QUERY_KEY, CITY_SEARCH_RESULTS_MAX_AGE } from '../../constants';
import { QueryHelper } from '../../helpers';
import { CitiesHelper } from '../../helpers/api';
import { APIRoute, getPath, Response } from '../../models/api';
import { City } from '../../models/cities';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const getPartialResponse = async (): Promise<Pick<Response<City[]>, 'data' | 'warnings' | 'errors'>> => {
    const warnings: string[] = [];
    const errors: string[] = [];

    const id = req.query[API_GEONAMEID_KEY];
    const query = req.query[API_SEARCH_QUERY_KEY];

    // Use "id" queryParam if provided; parse and return if it matches
    if (typeof id === 'string' && id.length) {
      const match = await CitiesHelper.getByGeonameid(id);
      if (match != null) {
        if (query != null) {
          warnings.push(`'${API_SEARCH_QUERY_KEY}' was ignored since '${API_GEONAMEID_KEY}' takes precedence`);
        }
        return { data: [match], warnings, errors };
      }
      warnings.push(`'${API_GEONAMEID_KEY}' was invalid`);
    }

    // Use "query" queryParam if provided; search using search query
    if (typeof query === 'string') {
      const formattedQuery = QueryHelper.formatQuery(query);
      const results = await CitiesHelper.searchFor(formattedQuery);
      return { data: results, warnings, errors };
    }
    errors.push(`Could not search since neither '${API_GEONAMEID_KEY}' nor '${API_SEARCH_QUERY_KEY}' were valid`);
    return { data: [], warnings, errors };
  };

  try {
    const partialResponse = await getPartialResponse();

    const response: Response<City[]> = {
      ...partialResponse,
      validUntil: dayjs().unix() + CITY_SEARCH_RESULTS_MAX_AGE,
      latestReadTime: dayjs().unix()
    };
    if (process.env.NODE_ENV !== 'development') {
      res.setHeader(
        'Cache-Control',
        `public, immutable, stale-while-revalidate, max-age=${CITY_SEARCH_RESULTS_MAX_AGE}`
      );
    }
    res.status(200).json(response);
  } catch (err) {
    console.log(`[${getPath(APIRoute.CITY_SEARCH)}]`, err);
    const errorResponse: Response<null> = {
      data: null,
      warnings: [],
      errors: ['Failed to fetch data'],
      validUntil: 0,
      latestReadTime: 0
    };
    res.status(500).json(errorResponse);
  }
}
