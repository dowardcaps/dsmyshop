-- CreateEnum
CREATE TYPE "ExpenseKind" AS ENUM ('VARIABLE', 'MATERIAL', 'FIXED');

-- AlterTable
ALTER TABLE "ExpenseCategory" ADD COLUMN     "kind" "ExpenseKind" NOT NULL DEFAULT 'VARIABLE';

-- CreateTable
CREATE TABLE "BusinessSettings" (
    "userId" TEXT NOT NULL,
    "operatingDays" INTEGER NOT NULL DEFAULT 26,
    "minDailyTarget" DECIMAL(12,2) NOT NULL DEFAULT 600,
    "dailyTarget" DECIMAL(12,2) NOT NULL DEFAULT 1000,
    "growthTarget" DECIMAL(12,2) NOT NULL DEFAULT 1500,
    "variableCostPct" DECIMAL(5,2),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessSettings_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "FixedExpense" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "startMonth" DATE NOT NULL,
    "endMonth" DATE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FixedExpense_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FixedExpense_userId_startMonth_idx" ON "FixedExpense"("userId", "startMonth");

-- AddForeignKey
ALTER TABLE "BusinessSettings" ADD CONSTRAINT "BusinessSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FixedExpense" ADD CONSTRAINT "FixedExpense_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
