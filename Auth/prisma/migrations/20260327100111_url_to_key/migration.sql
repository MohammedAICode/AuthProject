/*
  Warnings:

  - You are about to drop the column `profileImgURL` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "profileImgURL",
ADD COLUMN     "profileImgKey" TEXT;
