import type { Actions } from './$types';
import { fail } from '@sveltejs/kit';
import prisma from '$lib/prisma';
import argon from 'argon2';

export const actions: Actions = {
  async register({ request }) {
    const body = await request.formData();

    const username = body.get('username') as string;
    const password = body.get('password') as string;
    const confirmPassword = body.get('confirmPassword') as string;
    const telegramUsername = body.get('telegramUsername') as string;
    
    // Basic validation
    if (!username || !password || !confirmPassword) {
      return fail(400, { error: 'missing' });
    }

    // Username validation
    if (!/^[a-zA-Z0-9_]{3,16}$/.test(username)) {
      return fail(400, { error: 'username' });
    }

    // Check if passwords match
    if (password !== confirmPassword) {
      return fail(400, { error: 'confirmPassword' });
    }

    // Password validation - at least 6 characters (simplified)
    if (password.length < 6) {
      return fail(400, { error: 'password' });
    }

    try {
      // Check if the user already exists by username
      const existingUser = await prisma.user.findUnique({
        where: { username },
        select: { id: true }
      });

      if (existingUser) {
        return fail(400, { error: 'username' });
      }

      // Generate M2FA codes
      const md2faCodes = generateMd2faCodes().sort();
      const hashedMd2faCodes = await Promise.all(md2faCodes.map(code => argon.hash(code)));

      // Create user
      const newUser = await prisma.user.create({
        data: {
          username,
          password: await argon.hash(password),
          md2faCodes: hashedMd2faCodes,
          role: ['BUYER'],
          telegram: telegramUsername || null,
        },
      });

      // Return success with codes for backup page
      return {
        success: true,
        md2faCodes,
        username,
      };
      
    } catch (error) {
      console.error('Registration error:', error);
      return fail(500, { error: 'server' });
    }
  }
};

// Function to generate M2FA codes
function generateMd2faCodes(): string[] {
  const codes = [];
  for (let i = 0; i < 10; i++) {
    const code = 'bigfat' + generateRandomString(20);
    codes.push(code);
  }
  return codes;
}

// Function to generate a random string of given length
function generateRandomString(length: number): string {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    result += charset[randomIndex];
  }
  return result;
}
