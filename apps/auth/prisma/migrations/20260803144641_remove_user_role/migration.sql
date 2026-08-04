/*
  Warnings:

  - You are about to drop the column `role` on the `users` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "Status" AS ENUM ('ACTIVE', 'PENDING_VERIFICATION', 'BLOCKED');

-- AlterTable
ALTER TABLE "users" DROP COLUMN "role",
ADD COLUMN     "city" TEXT,
ADD COLUMN     "status" "Status" NOT NULL DEFAULT 'PENDING_VERIFICATION';

-- DropEnum
DROP TYPE "Role";
