import { userFromToken } from '$lib/util';
import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import twofactor from 'node-2fa';

export const GET: RequestHandler = async ({ cookies }) => {
  const user = userFromToken(cookies.get('__token'));
  if (!user) throw error(401, 'Unauthorized');

  // TODO: update name
  const { secret, uri } = twofactor.generateSecret({
    name: 'Test',
    account: user?.username,
  });

  return json({
    secret,
    uri,
  });
};
