-- CreateEnum
CREATE TYPE "ShopDayStatus" AS ENUM ('OPEN', 'HALF_DAY', 'CLOSED');

-- CreateTable
CREATE TABLE "ShopDay" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dayDate" DATE NOT NULL,
    "status" "ShopDayStatus" NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShopDay_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ShopDay_userId_dayDate_key" ON "ShopDay"("userId", "dayDate");

-- AddForeignKey
ALTER TABLE "ShopDay" ADD CONSTRAINT "ShopDay_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
