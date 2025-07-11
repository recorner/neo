import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
  const user = locals.user;
  
  if (!user) {
    throw redirect(302, '/auth/login');
  }

  // Only sellers and admins can access this page
  if (!user.role?.includes('SELLER') && !user.role?.includes('ADMIN')) {
    throw redirect(302, '/');
  }

  return {
    user
  };
};
