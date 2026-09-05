-- CreateEnum
CREATE TYPE "CounterOfferStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'COUNTERED');

-- AlterTable
ALTER TABLE "quotations" ADD COLUMN     "counter_offer_at" TIMESTAMP(3),
ADD COLUMN     "counter_offer_responded_at" TIMESTAMP(3),
ADD COLUMN     "counter_offer_status" "CounterOfferStatus",
ADD COLUMN     "countered_discount_pct" DECIMAL(5,2),
ADD COLUMN     "countered_total_amount" DECIMAL(12,2),
ADD COLUMN     "overall_discount_pct" DECIMAL(5,2) NOT NULL DEFAULT 0,
ADD COLUMN     "unit_price_total" DECIMAL(12,2);
