-- CreateTable
CREATE TABLE "ExcessMoney" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "excessDate" DATE NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExcessMoney_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExcessMoney_userId_excessDate_idx" ON "ExcessMoney"("userId", "excessDate");

-- AddForeignKey
ALTER TABLE "ExcessMoney" ADD CONSTRAINT "ExcessMoney_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
