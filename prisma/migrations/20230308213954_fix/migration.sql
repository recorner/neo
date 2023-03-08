/*
  Warnings:

  - Added the required column `address` to the `Payout` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Payout" ADD COLUMN     "address" TEXT NOT NULL;
