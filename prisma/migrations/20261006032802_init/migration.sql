-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'GCASH', 'BANK_TRANSFER', 'OTHER');

-- CreateEnum
CREATE TYPE "GcashTransactionType" AS ENUM ('CASH_IN', 'CASH_OUT', 'LOAD');

-- CreateEnum
CREATE TYPE "GcashProvider" AS ENUM ('GCASH', 'DITO', 'TNT', 'SMART', 'GLOBE', 'TM', 'OTHER');

-- CreateEnum
CREATE TYPE "DebtStatus" AS ENUM ('UNPAID', 'PARTIALLY_PAID', 'PAID');

-- CreateEnum
CREATE TYPE "AdjustmentType" AS ENUM ('SALARY', 'REIMBURSEMENT', 'OTHER_INCOME', 'OTHER_ADJUSTMENT');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SaleCategory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SaleCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sale" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "transactionNumber" TEXT NOT NULL,
    "transactionDate" DATE NOT NULL,
    "customerName" TEXT,
    "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'CASH',
    "notes" TEXT,
    "totalAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "importKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SaleItem" (
    "id" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(12,2) NOT NULL,
    "subtotal" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SaleItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GcashTransaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "transactionDate" DATE NOT NULL,
    "transactionType" "GcashTransactionType" NOT NULL,
    "provider" "GcashProvider" NOT NULL DEFAULT 'GCASH',
    "amount" DECIMAL(12,2) NOT NULL,
    "charge" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "importKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GcashTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpenseCategory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExpenseCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "expenseDate" DATE NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "notes" TEXT,
    "importKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Debt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "originalAmount" DECIMAL(12,2) NOT NULL,
    "debtDate" DATE NOT NULL,
    "status" "DebtStatus" NOT NULL DEFAULT 'UNPAID',
    "importKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Debt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DebtPayment" (
    "id" TEXT NOT NULL,
    "debtId" TEXT NOT NULL,
    "paymentDate" DATE NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "notes" TEXT,
    "importKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DebtPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonthlyAdjustment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "adjustmentDate" DATE NOT NULL,
    "adjustmentType" "AdjustmentType" NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "notes" TEXT,
    "importKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MonthlyAdjustment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "SaleCategory_userId_name_key" ON "SaleCategory"("userId", "name");

-- CreateIndex
CREATE INDEX "Sale_userId_transactionDate_idx" ON "Sale"("userId", "transactionDate");

-- CreateIndex
CREATE INDEX "Sale_paymentMethod_idx" ON "Sale"("paymentMethod");

-- CreateIndex
CREATE UNIQUE INDEX "Sale_userId_transactionNumber_key" ON "Sale"("userId", "transactionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Sale_userId_importKey_key" ON "Sale"("userId", "importKey");

-- CreateIndex
CREATE INDEX "SaleItem_saleId_idx" ON "SaleItem"("saleId");

-- CreateIndex
CREATE INDEX "SaleItem_categoryId_idx" ON "SaleItem"("categoryId");

-- CreateIndex
CREATE INDEX "GcashTransaction_userId_transactionDate_idx" ON "GcashTransaction"("userId", "transactionDate");

-- CreateIndex
CREATE INDEX "GcashTransaction_transactionType_idx" ON "GcashTransaction"("transactionType");

-- CreateIndex
CREATE INDEX "GcashTransaction_provider_idx" ON "GcashTransaction"("provider");

-- CreateIndex
CREATE UNIQUE INDEX "GcashTransaction_userId_importKey_key" ON "GcashTransaction"("userId", "importKey");

-- CreateIndex
CREATE UNIQUE INDEX "ExpenseCategory_userId_name_key" ON "ExpenseCategory"("userId", "name");

-- CreateIndex
CREATE INDEX "Expense_userId_expenseDate_idx" ON "Expense"("userId", "expenseDate");

-- CreateIndex
CREATE INDEX "Expense_categoryId_idx" ON "Expense"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "Expense_userId_importKey_key" ON "Expense"("userId", "importKey");

-- CreateIndex
CREATE INDEX "Debt_userId_debtDate_idx" ON "Debt"("userId", "debtDate");

-- CreateIndex
CREATE INDEX "Debt_status_idx" ON "Debt"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Debt_userId_importKey_key" ON "Debt"("userId", "importKey");

-- CreateIndex
CREATE INDEX "DebtPayment_debtId_idx" ON "DebtPayment"("debtId");

-- CreateIndex
CREATE INDEX "DebtPayment_paymentDate_idx" ON "DebtPayment"("paymentDate");

-- CreateIndex
CREATE UNIQUE INDEX "DebtPayment_debtId_importKey_key" ON "DebtPayment"("debtId", "importKey");

-- CreateIndex
CREATE INDEX "MonthlyAdjustment_userId_adjustmentDate_idx" ON "MonthlyAdjustment"("userId", "adjustmentDate");

-- CreateIndex
CREATE INDEX "MonthlyAdjustment_adjustmentType_idx" ON "MonthlyAdjustment"("adjustmentType");

-- CreateIndex
CREATE UNIQUE INDEX "MonthlyAdjustment_userId_importKey_key" ON "MonthlyAdjustment"("userId", "importKey");

-- AddForeignKey
ALTER TABLE "SaleCategory" ADD CONSTRAINT "SaleCategory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleItem" ADD CONSTRAINT "SaleItem_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleItem" ADD CONSTRAINT "SaleItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "SaleCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GcashTransaction" ADD CONSTRAINT "GcashTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseCategory" ADD CONSTRAINT "ExpenseCategory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ExpenseCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Debt" ADD CONSTRAINT "Debt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DebtPayment" ADD CONSTRAINT "DebtPayment_debtId_fkey" FOREIGN KEY ("debtId") REFERENCES "Debt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonthlyAdjustment" ADD CONSTRAINT "MonthlyAdjustment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
