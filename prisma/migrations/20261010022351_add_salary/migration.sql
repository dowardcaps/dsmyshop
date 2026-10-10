-- CreateTable
CREATE TABLE "Employee" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "monthlySalary" DECIMAL(12,2) NOT NULL,
    "startDate" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalaryPeriod" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "payDate" DATE NOT NULL,
    "grossAmount" DECIMAL(12,2) NOT NULL,
    "paidOn" DATE,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalaryPeriod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalaryAdvance" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "periodId" TEXT NOT NULL,
    "advanceDate" DATE NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalaryAdvance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Employee_userId_name_key" ON "Employee"("userId", "name");

-- CreateIndex
CREATE INDEX "SalaryPeriod_userId_payDate_idx" ON "SalaryPeriod"("userId", "payDate");

-- CreateIndex
CREATE UNIQUE INDEX "SalaryPeriod_employeeId_payDate_key" ON "SalaryPeriod"("employeeId", "payDate");

-- CreateIndex
CREATE INDEX "SalaryAdvance_periodId_idx" ON "SalaryAdvance"("periodId");

-- CreateIndex
CREATE INDEX "SalaryAdvance_userId_advanceDate_idx" ON "SalaryAdvance"("userId", "advanceDate");

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalaryPeriod" ADD CONSTRAINT "SalaryPeriod_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalaryPeriod" ADD CONSTRAINT "SalaryPeriod_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalaryAdvance" ADD CONSTRAINT "SalaryAdvance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalaryAdvance" ADD CONSTRAINT "SalaryAdvance_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalaryAdvance" ADD CONSTRAINT "SalaryAdvance_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "SalaryPeriod"("id") ON DELETE CASCADE ON UPDATE CASCADE;
