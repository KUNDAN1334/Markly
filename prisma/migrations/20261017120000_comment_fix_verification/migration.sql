-- CreateEnum
CREATE TYPE "CommentStatus" AS ENUM ('OPEN', 'FIXED', 'VERIFIED');

-- AlterTable
ALTER TABLE "Comment" ADD COLUMN     "status" "CommentStatus" NOT NULL DEFAULT 'OPEN';

-- Backfill: comments that were already resolved count as verified.
UPDATE "Comment" SET "status" = 'VERIFIED' WHERE "resolved" = true;

-- CreateTable
CREATE TABLE "CommentStatusEvent" (
    "id" TEXT NOT NULL,
    "commentId" TEXT NOT NULL,
    "fromStatus" "CommentStatus" NOT NULL,
    "toStatus" "CommentStatus" NOT NULL,
    "note" TEXT,
    "actorUserId" TEXT,
    "actorName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommentStatusEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CommentStatusEvent_commentId_createdAt_idx" ON "CommentStatusEvent"("commentId", "createdAt");

-- AddForeignKey
ALTER TABLE "CommentStatusEvent" ADD CONSTRAINT "CommentStatusEvent_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommentStatusEvent" ADD CONSTRAINT "CommentStatusEvent_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
