CREATE TYPE "LoanActivityType" AS ENUM ('CREATED', 'ADDITION', 'ADJUSTMENT');

CREATE TABLE "LoanActivity" (
    "id" TEXT NOT NULL,
    "loanId" TEXT NOT NULL,
    "type" "LoanActivityType" NOT NULL,
    "amountDelta" DOUBLE PRECISION NOT NULL,
    "balanceAfter" DOUBLE PRECISION NOT NULL,
    "activityDate" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoanActivity_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "LoanActivity_loanId_activityDate_idx" ON "LoanActivity"("loanId", "activityDate");

ALTER TABLE "LoanActivity" ADD CONSTRAINT "LoanActivity_loanId_fkey"
FOREIGN KEY ("loanId") REFERENCES "Loan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
