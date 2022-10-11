import { NextApiRequest, NextApiResponse } from 'next';

export default function health(_: NextApiRequest, res: NextApiResponse) {
  res.status(200).send('OK');
}
