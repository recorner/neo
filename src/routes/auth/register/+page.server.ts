import type { Actions } from './$types';
import { validate } from '$lib/captcha';
import { fail, redirect } from '@sveltejs/kit';
import prisma from '$lib/prisma';

export const actions: Actions = {
  async register({ cookies, request }) {
    const body = await request.formData();

    if (!validate(cookies.get('captcha'), cookies.get('rng'), body.get('captcha'))) {
      return fail(400, { error: 'captcha' });
    }

    cookies.delete('captcha', { path: '/' });
    cookies.delete('rng', { path: '/' });

    const username = body.get('username');
    const password = body.get('password');

    if (password !== body.get('confirmPassword')) {
      return fail(400, { error: 'confirmPassword' });
    }

    if (typeof username !== 'string' || !RegExp('[a-zA-Z0-9_]{3,16}').test(username)) {
      return fail(400, { error: 'username' });
    }

    if (typeof password !== 'string' || password.length < 8) {
      return fail(400, { error: 'password' });
    }

    return await prisma.user
      .create({
        data: {
          username,
          password,
        },
      })
      .then((user) => {
        if (user) {
          throw redirect(302, '/auth/login');
        }
      })
      .catch((e) => {
        console.log(e);
        if (e.code === 'P2002') {
          return fail(400, { error: 'username' });
        }
      });
  },
};
