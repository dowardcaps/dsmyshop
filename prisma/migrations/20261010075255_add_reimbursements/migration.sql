-- CreateTable
CREATE TABLE "Reimbursement" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reimbursementDate" DATE NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reimbursement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Reimbursement_userId_reimbursementDate_idx" ON "Reimbursement"("userId", "reimbursementDate");

-- AddForeignKey
ALTER TABLE "Reimbursement" ADD CONSTRAINT "Reimbursement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
