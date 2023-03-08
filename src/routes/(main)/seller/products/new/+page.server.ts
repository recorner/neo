import { userFromToken } from '$lib/util';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { ProductType, Role } from '@prisma/client';
import prisma from '$lib/prisma';

export const actions: Actions = {
  async publish({ request, cookies }) {
    const user = userFromToken(cookies.get('token'));
    console.log(user);
    if (!user?.id || !user.role.includes(Role.SELLER)) return fail(401, { error: 'unauthorized' });

    const body = await request.formData();

    const product = await prisma.product.create({
      data: {
        name: body.get('name') as string,
        description: body.get('description') as string,
        type: body.get('type') === 'download' ? ProductType.DOWNLOAD : ProductType.LICENSE,
        price: Number(body.get('price')),
        stock: body.get('stock') as string,
        seller: {
          connect: {
            id: user.id,
          },
        },
        category: {
          connect: {
            id: Number(body.get('category')),
          },
        },
      },
    });

    if (product) {
      throw redirect(302, `/seller/products/${product.id}`);
    } else {
      return fail(500, { error: 'product' });
    }
  },
};
