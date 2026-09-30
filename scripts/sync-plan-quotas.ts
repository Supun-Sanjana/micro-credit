/**
 * One-shot script: syncs SubscriptionPlan DB records to match lib/plans.ts quotas.
 * Run: npx tsx scripts/sync-plan-quotas.ts
 */
import prisma from "../lib/prisma"
import { SUBSCRIPTION_PLANS } from "../lib/plans"

async function main() {
  console.log("Syncing plan quotas from lib/plans.ts → DB...\n")

  for (const plan of SUBSCRIPTION_PLANS) {
    // Match by planId string (stored in SubscriptionPlan.planId field) or by name
    const result = await prisma.subscriptionPlan.updateMany({
      where: {
        OR: [
          { id: plan.id },
          { name: plan.name },
        ],
      },
      data: {
        storageQuotaMb: plan.storageQuotaMb,
        maxOfficerSeats: plan.maxOfficerSeats,
        maxBranches: plan.maxBranches,
        monthlyPrice: plan.monthlyPrice,
      },
    })
    console.log(`  [${plan.name}] storageQuotaMb=${plan.storageQuotaMb}, seats=${plan.maxOfficerSeats}, branches=${plan.maxBranches} → ${result.count} row(s) updated`)
  }

  console.log("\nDone.")
  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  prisma.$disconnect()
  process.exit(1)
})
