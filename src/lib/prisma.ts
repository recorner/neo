import Prisma, * as PrismaScope from '@prisma/client';

const PrismaClient = Prisma?.PrismaClient || PrismaScope?.PrismaClient;
export default new PrismaClient();
