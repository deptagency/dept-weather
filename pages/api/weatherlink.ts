import { NextApiRequest, NextApiResponse } from 'next';
import { WeatherlinkHelper } from '../../helpers';

export default async function handler(_: NextApiRequest, res: NextApiResponse) {
  try {
    const current = await WeatherlinkHelper.current.get();
    res.status(200).json(current);
  } catch (err) {
    res.status(500).send({ error: 'failed to fetch data' });
  }
}
