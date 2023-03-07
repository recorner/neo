import type { Actions } from './$types';
import { validate } from '$lib/captcha';
import { fail, redirect } from '@sveltejs/kit';
import prisma from '$lib/prisma';
import argon from 'argon2';
import jwt from 'jsonwebtoken';

export const actions: Actions = {
  async login({ cookies, request }) {
    const body = await request.formData();

    const captcha = cookies.get('captcha') as string;
    const rng = cookies.get('rng') as string;
    cookies.delete('captcha', { path: '/' });
    cookies.delete('rng', { path: '/' });
    if (!validate(captcha, rng, body.get('captcha') as string)) {
      return fail(400, { error: 'captcha' });
    }

    const username = body.get('username');
    const password = body.get('password');

    if (typeof username !== 'string' || !RegExp('[a-zA-Z0-9_]{3,16}').test(username)) {
      return fail(400, { error: 'credentials' });
    }

    if (typeof password !== 'string' || password.length < 8) {
      return fail(400, { error: 'credentials' });
    }

    const user = await prisma.user.findUnique({
      where: {
        username,
      },
    });

    if (!user || !(await argon.verify(user.password, password))) {
      return fail(400, { error: 'credentials' });
    }

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
      },
      process.env.JWT_SECRET || '1',
      {
        expiresIn: '2d',
      }
    );

    cookies.set('token', token, {
      path: '/',
      maxAge: 1000 * 60 * 60 * 24 * 2,
      httpOnly: true,
      sameSite: 'lax',
    });

    throw redirect(302, '/');
  },
};
