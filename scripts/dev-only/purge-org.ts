import { purgeOrganization } from "../../lib/org-purge"

async function main() {
  const orgId = process.argv[2]
  const executeFlag = process.argv.includes("--execute")

  if (!orgId) {
    console.error("Usage: npx tsx scripts/dev-only/purge-org.ts <orgId> [--execute]")
    process.exit(1)
  }

  console.log(`Starting purge for organization: ${orgId}`)
  console.log(`Mode: ${executeFlag ? "LIVE (DELETING DATA)" : "DRY RUN"}`)

  try {
    const result = await purgeOrganization(orgId, {
      reason: "TRIAL_EXPIRED_AUTO",
      triggeredBy: "dev-script",
      dryRun: !executeFlag,
    })

    console.log("Purge result:", JSON.stringify(result, null, 2))
  } catch (error: any) {
    console.error("Purge failed:", error.message)
    process.exit(1)
  }
}

main()
