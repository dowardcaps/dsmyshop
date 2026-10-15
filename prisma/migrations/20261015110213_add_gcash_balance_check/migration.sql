-- CreateTable
CREATE TABLE "GcashBalanceCheck" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "balance" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GcashBalanceCheck_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GcashBalanceCheck_userId_createdAt_idx" ON "GcashBalanceCheck"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "GcashBalanceCheck" ADD CONSTRAINT "GcashBalanceCheck_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
