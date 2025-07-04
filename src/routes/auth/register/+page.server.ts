import type { Actions } from './$types';
import { validate } from '$lib/captcha';
import { fail, redirect } from '@sveltejs/kit';
import prisma from '$lib/prisma';
import argon from 'argon2';

export const actions: Actions = {
  async register({ cookies, request }) {
    const body = await request.formData();

    const captcha = cookies.get('captcha') as string;
    const rng = cookies.get('rng') as string;
    cookies.delete('captcha', { path: '/' });
    cookies.delete('rng', { path: '/' });
    if (!validate(captcha, rng, body.get('captcha') as string)) {
      return fail(400, { error: 'captcha' });
    }

    const username = body.get('username') as string;
    const password = body.get('password') as string;
    const userIcon = body.get('userIcon') as string; // Get user icon from form data
    const md2faCodes = generateMd2faCodes().sort(); // Generate and sort md2fa codes
    const hashedMd2faCodes = await Promise.all(md2faCodes.map(code => argon.hash(code))); // Hash md2fa codes

    // Password validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>]).{6,}$/;
    if (typeof password !== 'string' || !passwordRegex.test(password)) {
      return fail(400, { error: 'password' });
    }

    // Check if the user already exists in the database
    const existingUser = await prisma.user.findUnique({
      where: {
        username: username,
      },
    });

    if (existingUser) {
      return fail(400, { error: 'username' }); // User already exists
    }

    // Store user data in the database
    const user = await prisma.user.create({
      data: {
        username,
        password: await argon.hash(password),
        userIcon: userIcon, // Store user icon in the database
        md2faCodes: hashedMd2faCodes, // Store hashed md2fa codes in the database
        role: [], // Set default empty role array
      },
    });

    // Redirect to the backup page with sorted codes and username
    throw redirect(302, `/auth/backup?codes=${md2faCodes.join(',')}&username=${username}`);
  },
};

// Function to generate md2fa codes (example implementation, modify as needed)
function generateMd2faCodes() {
  const codes = [];
  for (let i = 0; i < 5; i++) {
    const code = 'bigfat' + generateRandomString(20); // Generate a code starting with 'bigfat' and followed by 20 random characters
    codes.push(code);
  }
  return codes;
}

// Function to generate a random string of given length
function generateRandomString(length: number) {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    result += charset[randomIndex];
  }
  return result;
}
