import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import jwt from 'jsonwebtoken';

export const load: LayoutServerLoad = async ({ cookies }) => {
  // validate jwt
  let data: any;
  try {
    data = jwt.verify(cookies.get('token'), process.env.JWT_SECRET || '1');
  } catch (e) {
    cookies.delete('token', { path: '/' });
    throw redirect(302, '/auth/login');
  }

  return {
    user: data,
  };
};
