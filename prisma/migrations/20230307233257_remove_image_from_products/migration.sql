/*
  Warnings:

  - You are about to drop the column `attachmentId` on the `Product` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Product" DROP CONSTRAINT "Product_attachmentId_fkey";

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "attachmentId";
