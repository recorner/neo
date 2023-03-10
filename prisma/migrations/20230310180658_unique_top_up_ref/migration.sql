/*
  Warnings:

  - A unique constraint covering the columns `[reference]` on the table `TopUp` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "TopUp_reference_key" ON "TopUp"("reference");
