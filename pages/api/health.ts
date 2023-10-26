import { NextApiRequest, NextApiResponse } from 'next';
import { LoggerHelper } from 'helpers/api/logger-helper';
import { APIRoute, getPath } from 'models/api';

const LOGGER_LABEL = getPath(APIRoute.HEALTH);
export default function health(_: NextApiRequest, res: NextApiResponse) {
  LoggerHelper.getLogger(LOGGER_LABEL).info('Sending 200 - OK...');
  res.status(200).send('OK');
}
