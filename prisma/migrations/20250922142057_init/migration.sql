/*
  Warnings:

  - You are about to drop the column `link` on the `Folder` table. All the data in the column will be lost.
  - Added the required column `path` to the `Folder` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Folder" DROP COLUMN "link",
ADD COLUMN     "path" TEXT NOT NULL;
