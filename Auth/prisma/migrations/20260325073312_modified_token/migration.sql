/*
  Warnings:

  - The `modifiedBy` column on the `Token` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "modifiedByType" AS ENUM ('SYSTEM');

-- AlterTable
ALTER TABLE "Token" DROP COLUMN "modifiedBy",
ADD COLUMN     "modifiedBy" "modifiedByType" NOT NULL DEFAULT 'SYSTEM';
