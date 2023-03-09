import type { Actions } from './$types';
import { validate } from '$lib/captcha';
import { fail, redirect } from '@sveltejs/kit';
import prisma from '$lib/prisma';
import argon from 'argon2';
import jwt from 'jsonwebtoken';
import n2fa from 'node-2fa';

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
      select: {
        id: true,
        username: true,
        password: true,
        role: true,
        twoFactorSecret: true,
      },
    });

    if (!user || !(await argon.verify(user.password, password))) {
      return fail(400, { error: 'credentials' });
    }

    if (user.twoFactorSecret) {
      cookies.set(
        '2fa',
        jwt.sign(
          {
            toAuthenticate: user.id,
          },
          process.env.JWT_SECRET || '1',
          {
            expiresIn: '5m',
          }
        ),
        {
          path: '/',
          maxAge: 1000 * 60 * 5,
          httpOnly: true,
          sameSite: 'lax',
        }
      );
      return fail(400, { error: '2fa' });
    }

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
        username: user.username,
      },
      process.env.JWT_SECRET || '1',
      {
        expiresIn: '2d',
      }
    );

    cookies.set('__token', token, {
      path: '/',
      maxAge: 1000 * 60 * 60 * 24 * 2,
      httpOnly: true,
      sameSite: 'lax',
    });

    throw redirect(302, '/');
  },
  async twofactor({ cookies, request }) {
    if (!cookies.get('2fa')) return fail(400, { error: 'credentials' });

    const body = await request.formData();
    const code = body.get('code');

    if (typeof code !== 'string' || !RegExp('[0-9]{6}').test(code)) return fail(400, { error: 'code' });

    let data: any;
    try {
      data = jwt.verify(cookies.get('2fa'), process.env.JWT_SECRET || '1');
    } catch (e) {
      return fail(400, { error: 'credentials' });
    }

    const user = await prisma.user.findUnique({
      where: {
        id: data.toAuthenticate,
      },
      select: {
        id: true,
        username: true,
        twoFactorSecret: true,
        role: true,
      },
    });
    if (!user || !user.twoFactorSecret) return fail(400, { error: 'credentials' });

    const verification = n2fa.verifyToken(user.twoFactorSecret, code);
    if (!verification || verification.delta !== 0) return fail(400, { error: 'code' });

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
        username: user.username,
      },
      process.env.JWT_SECRET || '1',
      {
        expiresIn: '2d',
      }
    );

    cookies.set('__token', token, {
      path: '/',
      maxAge: 1000 * 60 * 60 * 24 * 2,
      httpOnly: true,
      sameSite: 'lax',
    });

    cookies.delete('2fa', { path: '/' });

    throw redirect(302, '/');
  },
};
