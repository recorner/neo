import { redirect, type Actions } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import jwt from 'jsonwebtoken';
import prisma from '$lib/prisma';

export const load: LayoutServerLoad = async ({ cookies }) => {
  // validate jwt
  let data: any;
  try {
    data = jwt.verify(cookies.get('__token'), process.env.JWT_SECRET || '1');
  } catch (e) {
    cookies.delete('__token', { path: '/' });
    throw redirect(302, '/auth/login');
  }

  const user = await prisma.user.findUnique({
    where: {
      id: data.id,
    },
    select: {
      id: true,
      username: true,
      balance: true,
      role: true,
    },
  });

  const compareArray = (a: any[], b: any[]) => {
    if (a.length !== b.length) return false;
    return a.every((item) => b.includes(item)) && b.every((item) => a.includes(item));
  };

  if (!user || !data || !compareArray(user.role, data.role)) {
    cookies.delete('__token', { path: '/' });
    throw redirect(302, '/auth/login');
  }

  // get categories
  const categories = await prisma.category
    .findMany({
      select: {
        id: true,
        name: true,
        order: true,
        image: true,
      },
    })
    .then((categories) => categories.sort((a, b) => a.order - b.order))
    .then((categories) =>
      categories.map((category) => ({
        ...category,
        image: category.image ? `${process.env.UPLOAD_PREFIX}/${category.image}` : null,
      }))
    );

  return {
    user,
    categories,
    cart: JSON.parse(cookies.get('cart') || '[]') as { id: number; quantity: number }[],
  };
};
