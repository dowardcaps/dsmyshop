-- DropForeignKey
ALTER TABLE "InventoryItem" DROP CONSTRAINT "InventoryItem_serviceItemId_fkey";

-- DropIndex
DROP INDEX "InventoryItem_serviceItemId_key";

-- CreateTable
CREATE TABLE "InventoryLink" (
    "id" TEXT NOT NULL,
    "inventoryItemId" TEXT NOT NULL,
    "serviceItemId" TEXT NOT NULL,
    "unitsPerSale" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InventoryLink_inventoryItemId_idx" ON "InventoryLink"("inventoryItemId");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryLink_serviceItemId_key" ON "InventoryLink"("serviceItemId");

-- AddForeignKey
ALTER TABLE "InventoryLink" ADD CONSTRAINT "InventoryLink_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryLink" ADD CONSTRAINT "InventoryLink_serviceItemId_fkey" FOREIGN KEY ("serviceItemId") REFERENCES "ServiceItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
