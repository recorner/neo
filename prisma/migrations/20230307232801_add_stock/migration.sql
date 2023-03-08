/*
  Warnings:

  - The values [SERVICE] on the enum `ProductType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ProductType_new" AS ENUM ('DOWNLOAD', 'LICENSE');
ALTER TABLE "Product" ALTER COLUMN "type" DROP DEFAULT;
ALTER TABLE "Product" ALTER COLUMN "type" TYPE "ProductType_new" USING ("type"::text::"ProductType_new");
ALTER TYPE "ProductType" RENAME TO "ProductType_old";
ALTER TYPE "ProductType_new" RENAME TO "ProductType";
DROP TYPE "ProductType_old";
ALTER TABLE "Product" ALTER COLUMN "type" SET DEFAULT 'DOWNLOAD';
COMMIT;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "stock" TEXT NOT NULL DEFAULT '',
ALTER COLUMN "type" SET DEFAULT 'DOWNLOAD';
