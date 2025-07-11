/*
  Warnings:

  - A unique constraint covering the columns `[telegramId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "CardStatus" AS ENUM ('UNCHECKED', 'LIVE', 'DEAD');

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'BUYER';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "telegramId" TEXT,
ADD COLUMN     "telegramLinked" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "md2faCodes" DROP DEFAULT;

-- CreateTable
CREATE TABLE "CreditCard" (
    "id" SERIAL NOT NULL,
    "cardNumber" TEXT NOT NULL,
    "expMonth" TEXT NOT NULL,
    "expYear" TEXT NOT NULL,
    "cvv" TEXT NOT NULL,
    "fullName" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zip" TEXT,
    "country" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "ssn" TEXT,
    "dob" TEXT,
    "mmn" TEXT,
    "dl" TEXT,
    "sortCode" TEXT,
    "atmPin" TEXT,
    "carrierPin" TEXT,
    "cardBalance" TEXT,
    "userAgent" TEXT,
    "ip" TEXT,
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "isRefundable" BOOLEAN NOT NULL DEFAULT false,
    "isDiscounted" BOOLEAN NOT NULL DEFAULT false,
    "isChecked" BOOLEAN NOT NULL DEFAULT false,
    "status" "CardStatus" NOT NULL DEFAULT 'UNCHECKED',
    "sellerId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "checkedAt" TIMESTAMP(3),
    "checkedById" INTEGER,

    CONSTRAINT "CreditCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CardCheck" (
    "id" SERIAL NOT NULL,
    "cardId" INTEGER NOT NULL,
    "checkerId" INTEGER NOT NULL,
    "result" "CardStatus" NOT NULL,
    "cost" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CardCheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TelegramSession" (
    "id" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "loginCode" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TelegramSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CreditCard_cardNumber_idx" ON "CreditCard"("cardNumber");

-- CreateIndex
CREATE INDEX "CreditCard_zip_idx" ON "CreditCard"("zip");

-- CreateIndex
CREATE INDEX "CreditCard_country_idx" ON "CreditCard"("country");

-- CreateIndex
CREATE INDEX "CreditCard_status_idx" ON "CreditCard"("status");

-- CreateIndex
CREATE INDEX "CreditCard_sellerId_idx" ON "CreditCard"("sellerId");

-- CreateIndex
CREATE INDEX "CreditCard_price_idx" ON "CreditCard"("price");

-- CreateIndex
CREATE INDEX "CreditCard_isDiscounted_idx" ON "CreditCard"("isDiscounted");

-- CreateIndex
CREATE INDEX "CardCheck_checkerId_idx" ON "CardCheck"("checkerId");

-- CreateIndex
CREATE INDEX "CardCheck_cardId_idx" ON "CardCheck"("cardId");

-- CreateIndex
CREATE UNIQUE INDEX "TelegramSession_sessionId_key" ON "TelegramSession"("sessionId");

-- CreateIndex
CREATE INDEX "TelegramSession_chatId_idx" ON "TelegramSession"("chatId");

-- CreateIndex
CREATE INDEX "TelegramSession_sessionId_idx" ON "TelegramSession"("sessionId");

-- CreateIndex
CREATE INDEX "TelegramSession_loginCode_idx" ON "TelegramSession"("loginCode");

-- CreateIndex
CREATE UNIQUE INDEX "User_telegramId_key" ON "User"("telegramId");

-- AddForeignKey
ALTER TABLE "CreditCard" ADD CONSTRAINT "CreditCard_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditCard" ADD CONSTRAINT "CreditCard_checkedById_fkey" FOREIGN KEY ("checkedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CardCheck" ADD CONSTRAINT "CardCheck_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "CreditCard"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CardCheck" ADD CONSTRAINT "CardCheck_checkerId_fkey" FOREIGN KEY ("checkerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TelegramSession" ADD CONSTRAINT "TelegramSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
