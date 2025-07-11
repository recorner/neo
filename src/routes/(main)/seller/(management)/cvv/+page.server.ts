import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import prisma from '$lib/prisma';

export const load: PageServerLoad = async ({ locals, url }) => {
  const user = locals.user;
  
  if (!user) {
    throw redirect(302, '/auth/login');
  }

  // Only sellers and admins can access this page
  if (!user.role?.includes('SELLER') && !user.role?.includes('ADMIN')) {
    throw redirect(302, '/');
  }

  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = 50;
  const offset = (page - 1) * limit;

  // Build filters
  const where: any = {};
  
  // For sellers, only show their own cards
  if (user.role?.includes('SELLER') && !user.role?.includes('ADMIN')) {
    where.sellerId = user.id;
  }

  // Search (BIN or country)
  const search = url.searchParams.get('search');
  if (search) {
    where.OR = [
      { cardNumber: { startsWith: search } },
      { country: { contains: search, mode: 'insensitive' } }
    ];
  }

  // Country filter
  const country = url.searchParams.get('country');
  if (country) {
    where.country = country;
  }

  // Status filter
  const status = url.searchParams.get('status');
  if (status) {
    where.status = status;
  }

  // Price range
  const priceMin = url.searchParams.get('priceMin');
  const priceMax = url.searchParams.get('priceMax');
  if (priceMin || priceMax) {
    where.price = {};
    if (priceMin) where.price.gte = parseFloat(priceMin);
    if (priceMax) where.price.lte = parseFloat(priceMax);
  }

  // Discounted filter
  const isDiscounted = url.searchParams.get('isDiscounted');
  if (isDiscounted === 'true') {
    where.isDiscounted = true;
  }

  // Expiry year range
  const expYearMin = url.searchParams.get('expYearMin');
  const expYearMax = url.searchParams.get('expYearMax');
  if (expYearMin || expYearMax) {
    where.expYear = {};
    if (expYearMin) where.expYear.gte = expYearMin;
    if (expYearMax) where.expYear.lte = expYearMax;
  }

  try {
    // Get cards with pagination
    const [cards, totalCount] = await Promise.all([
      prisma.creditCard.findMany({
        where,
        include: {
          seller: {
            select: {
              id: true,
              username: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip: offset,
        take: limit
      }),
      prisma.creditCard.count({ where })
    ]);

    return {
      user,
      cards,
      totalCount,
      currentPage: page,
      filters: {
        search: search || '',
        country: country || '',
        status: status || '',
        priceMin: priceMin || '',
        priceMax: priceMax || '',
        isDiscounted: isDiscounted === 'true',
        expYearMin: expYearMin || '',
        expYearMax: expYearMax || ''
      }
    };

  } catch (error) {
    console.error('Error loading cards:', error);
    return {
      user,
      cards: [],
      totalCount: 0,
      currentPage: 1,
      filters: {}
    };
  }
};
