/*
  Warnings:

  - You are about to drop the column `folderId` on the `File` table. All the data in the column will be lost.
  - You are about to drop the `Folder` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `userId` to the `File` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."File" DROP CONSTRAINT "File_folderId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Folder" DROP CONSTRAINT "Folder_userId_fkey";

-- AlterTable
ALTER TABLE "public"."File" DROP COLUMN "folderId",
ADD COLUMN     "userId" TEXT NOT NULL;

-- DropTable
DROP TABLE "public"."Folder";

-- AddForeignKey
ALTER TABLE "public"."File" ADD CONSTRAINT "File_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
