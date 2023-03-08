import { redirect, type Actions } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import jwt from 'jsonwebtoken';
import prisma from '$lib/prisma';

export const load: LayoutServerLoad = async ({ cookies }) => {
  // validate jwt
  let data: any;
  try {
    data = jwt.verify(cookies.get('token'), process.env.JWT_SECRET || '1');
  } catch (e) {
    cookies.delete('token', { path: '/' });
    throw redirect(302, '/auth/login');
  }

  const user = await prisma.user.findUnique({
    where: {
      id: data.id,
    },
    select: {
      username: true,
      balance: true,
      role: true,
    },
  });

  if (!user) {
    cookies.delete('token', { path: '/' });
    throw redirect(302, '/auth/login');
  }

  // get categories
  const categories = await prisma.category
    .findMany({
      select: {
        id: true,
        name: true,
        order: true,
        image: {
          select: {
            filename: true,
          },
        },
      },
    })
    .then((categories) => categories.sort((a, b) => a.order - b.order));

  return {
    user,
    categories,
  };
};
