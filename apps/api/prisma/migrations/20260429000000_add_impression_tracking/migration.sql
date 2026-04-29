-- CreateTable
CREATE TABLE "Impression" (
    "id" TEXT NOT NULL,
    "linkId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "referrer" TEXT,
    "userAgent" TEXT,
    "ipHash" TEXT,

    CONSTRAINT "Impression_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Impression_linkId_timestamp_idx" ON "Impression"("linkId", "timestamp");

-- CreateIndex
CREATE INDEX "Impression_timestamp_idx" ON "Impression"("timestamp");

-- AddForeignKey
ALTER TABLE "Impression" ADD CONSTRAINT "Impression_linkId_fkey" FOREIGN KEY ("linkId") REFERENCES "Link"("id") ON DELETE CASCADE ON UPDATE CASCADE;
