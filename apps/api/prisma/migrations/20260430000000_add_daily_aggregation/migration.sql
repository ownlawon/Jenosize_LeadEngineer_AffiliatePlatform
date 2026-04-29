-- CreateTable
CREATE TABLE "ClickDaily" (
    "date" DATE NOT NULL,
    "count" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "ImpressionDaily" (
    "date" DATE NOT NULL,
    "count" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "ClickDaily_date_key" ON "ClickDaily"("date");

-- CreateIndex
CREATE INDEX "ClickDaily_date_idx" ON "ClickDaily"("date");

-- CreateIndex
CREATE UNIQUE INDEX "ImpressionDaily_date_key" ON "ImpressionDaily"("date");

-- CreateIndex
CREATE INDEX "ImpressionDaily_date_idx" ON "ImpressionDaily"("date");
