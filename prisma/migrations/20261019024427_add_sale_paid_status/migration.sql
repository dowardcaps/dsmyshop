-- AlterTable
ALTER TABLE "Sale" ADD COLUMN     "isPaid" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "paidAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Sale_userId_isPaid_idx" ON "Sale"("userId", "isPaid");
