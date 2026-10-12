-- CreateTable
CREATE TABLE "CashShort" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "shortDate" DATE NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CashShort_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CashShort_userId_shortDate_idx" ON "CashShort"("userId", "shortDate");

-- AddForeignKey
ALTER TABLE "CashShort" ADD CONSTRAINT "CashShort_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
