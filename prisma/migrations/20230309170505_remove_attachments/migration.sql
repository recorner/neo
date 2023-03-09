/*
  Warnings:

  - You are about to drop the column `attachmentId` on the `Category` table. All the data in the column will be lost.
  - You are about to drop the `Attachment` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Attachment" DROP CONSTRAINT "Attachment_userId_fkey";

-- DropForeignKey
ALTER TABLE "Category" DROP CONSTRAINT "Category_attachmentId_fkey";

-- AlterTable
ALTER TABLE "Category" DROP COLUMN "attachmentId",
ADD COLUMN     "image" TEXT;

-- DropTable
DROP TABLE "Attachment";
