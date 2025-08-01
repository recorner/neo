import prisma from '$lib/prisma';
import { userFromToken } from '$lib/util';
import { Role } from '@prisma/client';
import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async () => {
  const settings = await prisma.settings.findMany({
    select: {
      key: true,
      value: true,
    },
  });

  return { settings: Object.fromEntries(settings.map((setting) => [setting.key, setting.value])) };
};

export const actions: Actions = {
  async update({ request, cookies }) {
    const user = userFromToken(cookies.get('__token'));
    if (!user || !user.role.includes(Role.ADMIN)) throw fail(401, { error: 'unauthorized' });

    const body = await request.formData();
    const settings = Object.fromEntries(body.entries());

    await Promise.all(
      Object.keys(settings).map(async (key) => {
        await prisma.settings.upsert({
          where: {
            key,
          },
          update: {
            value: settings[key] as string,
          },
          create: {
            key,
            value: settings[key] as string,
          },
        });
      })
    );

    return { success: true };
  },
  async announce({ request, cookies }) {
    const user = userFromToken(cookies.get('__token'));
    if (!user || !user.role.includes(Role.ADMIN)) throw fail(401, { error: 'unauthorized' });

    const body = await request.formData();

    await prisma.announcement.create({
      data: {
        title: body.get('title') as string,
        body: body.get('message') as string,
        poster: {
          connect: {
            id: user.id,
          },
        },
      },
    });

    return { success: true };
  },
};
