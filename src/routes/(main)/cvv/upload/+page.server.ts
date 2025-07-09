import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
  const user = locals.user;
  
  if (!user) {
    throw redirect(302, '/auth/login');
  }
  
  // Check if user has seller or admin role
  const canUpload = user.role?.includes('SELLER') || user.role?.includes('ADMIN');
  
  if (!canUpload) {
    throw redirect(302, '/cvv');
  }

  return {
    user
  };
};
