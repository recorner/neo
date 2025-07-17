/*
  Warnings:

  - You are about to drop the `TopUp` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'WAITING', 'CONFIRMED', 'FAILED', 'EXPIRED', 'REFUNDED');

-- DropForeignKey
ALTER TABLE "TopUp" DROP CONSTRAINT "TopUp_userId_fkey";

-- DropTable
DROP TABLE "TopUp";

-- CreateTable
CREATE TABLE "top_ups" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "reference" TEXT,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "top_ups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentNotification" (
    "id" SERIAL NOT NULL,
    "topUpId" INTEGER NOT NULL,
    "telegramUsername" TEXT,
    "notificationSent" BOOLEAN NOT NULL DEFAULT false,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentNotification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "top_ups_reference_key" ON "top_ups"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentNotification_topUpId_key" ON "PaymentNotification"("topUpId");

-- CreateIndex
CREATE INDEX "PaymentNotification_telegramUsername_idx" ON "PaymentNotification"("telegramUsername");

-- CreateIndex
CREATE INDEX "PaymentNotification_notificationSent_idx" ON "PaymentNotification"("notificationSent");

-- AddForeignKey
ALTER TABLE "top_ups" ADD CONSTRAINT "top_ups_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentNotification" ADD CONSTRAINT "PaymentNotification_topUpId_fkey" FOREIGN KEY ("topUpId") REFERENCES "top_ups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
