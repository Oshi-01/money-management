-- Remember whether a month has already been initialized so deleting every
-- budget in that month does not cause automatic carry-over to recreate them.
CREATE TABLE "BudgetMonthState" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "initializedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BudgetMonthState_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BudgetMonthState_userId_month_key" ON "BudgetMonthState"("userId", "month");
CREATE INDEX "BudgetMonthState_userId_idx" ON "BudgetMonthState"("userId");

ALTER TABLE "BudgetMonthState" ADD CONSTRAINT "BudgetMonthState_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
