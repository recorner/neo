import type { PageServerLoad } from './$types';
import prisma from '$lib/prisma';
import { CardStatus } from '@prisma/client';

export const load: PageServerLoad = async ({ url }) => {
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = 20;
  const offset = (page - 1) * limit;

  // Get filter parameters
  const search = url.searchParams.get('search') || '';
  const cardType = url.searchParams.get('cardType') || '';
  const country = url.searchParams.get('country') || '';
  const minPrice = parseFloat(url.searchParams.get('minPrice') || '0');
  const maxPrice = parseFloat(url.searchParams.get('maxPrice') || '999999');
  const sortBy = url.searchParams.get('sortBy') || 'newest';

  // Build where clause with filters
  const where: any = {
    status: CardStatus.LIVE
  };

  // Search filter (card number, full name, country, BIN, ZIP code)
  if (search) {
    where.OR = [
      { cardNumber: { contains: search, mode: 'insensitive' } },
      { fullName: { contains: search, mode: 'insensitive' } },
      { country: { contains: search, mode: 'insensitive' } },
      { zip: { contains: search, mode: 'insensitive' } },
      { state: { contains: search, mode: 'insensitive' } },
      { city: { contains: search, mode: 'insensitive' } }
    ];
  }

  // Card type filter
  if (cardType) {
    const cardTypePatterns: Record<string, string> = {
      'visa': '4',
      'mastercard': '5',
      'amex': '3',
      'discover': '6'
    };
    if (cardTypePatterns[cardType.toLowerCase()]) {
      where.cardNumber = { startsWith: cardTypePatterns[cardType.toLowerCase()] };
    }
  }

  // Country filter
  if (country) {
    where.country = { equals: country, mode: 'insensitive' };
  }

  // Price range filter
  if (minPrice > 0 || maxPrice < 999999) {
    where.price = {
      gte: minPrice,
      lte: maxPrice
    };
  }

  // Sort options
  let orderBy: any = [
    { isDiscounted: 'desc' },
    { createdAt: 'desc' }
  ];

  switch (sortBy) {
    case 'price-low':
      orderBy = [{ price: 'asc' }, { isDiscounted: 'desc' }];
      break;
    case 'price-high':
      orderBy = [{ price: 'desc' }, { isDiscounted: 'desc' }];
      break;
    case 'newest':
      orderBy = [{ createdAt: 'desc' }, { isDiscounted: 'desc' }];
      break;
    case 'oldest':
      orderBy = [{ createdAt: 'asc' }, { isDiscounted: 'desc' }];
      break;
  }

  // Get cards with pagination and filtering
  const [cards, totalCount, countries, priceRange] = await Promise.all([
    prisma.creditCard.findMany({
      where,
      select: {
        id: true,
        cardNumber: true,
        expMonth: true,
        expYear: true,
        fullName: true,
        country: true,
        state: true,
        zip: true,
        price: true,
        status: true,
        isDiscounted: true,
        createdAt: true,
        seller: {
          select: {
            id: true,
            username: true,
          },
        },
      },
      orderBy,
      skip: offset,
      take: limit,
    }),
    prisma.creditCard.count({ where }),
    // Get unique countries for filter dropdown
    prisma.creditCard.findMany({
      where: { status: CardStatus.LIVE },
      select: { country: true },
      distinct: ['country'],
      orderBy: { country: 'asc' }
    }),
    // Get price range for filter
    prisma.creditCard.aggregate({
      where: { status: CardStatus.LIVE },
      _min: { price: true },
      _max: { price: true }
    })
  ]);

  const pages = Math.ceil(totalCount / limit);

  return {
    cards,
    page,
    pages,
    totalCount,
    countries: countries.map(c => c.country).filter(Boolean),
    minPrice: priceRange._min.price || 0,
    maxPrice: priceRange._max.price || 100,
    filters: {
      search,
      cardType,
      country,
      minPrice,
      maxPrice,
      sortBy
    }
  };
};
