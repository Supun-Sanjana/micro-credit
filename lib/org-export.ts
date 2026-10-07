import { Prisma } from "@prisma/client"
import prisma from "@/lib/prisma"
import { CSV_BOM, csvRow } from "./csv"

type ExportEntityConfig = {
  model: any
  where: (organizationId: string) => any
  exclude: string[]
}

export const EXPORT_ENTITIES: Record<string, ExportEntityConfig> = {
  members: {
    model: prisma.member,
    where: (orgId) => ({ organizationId: orgId }),
    exclude: [],
  },
  guarantors: {
    model: prisma.guarantor,
    where: (orgId) => ({ loan: { member: { organizationId: orgId } } }),
    exclude: [],
  },
  loans: {
    model: prisma.loan,
    where: (orgId) => ({ member: { organizationId: orgId } }),
    exclude: [],
  },
  repayments: {
    model: prisma.loanRepayment,
    where: (orgId) => ({ organizationId: orgId }),
    exclude: [],
  },
  repayment_schedules: {
    model: prisma.repaymentSchedule,
    where: (orgId) => ({ loan: { member: { organizationId: orgId } } }),
    exclude: [],
  },
  savings_accounts: {
    model: prisma.savingsAccount,
    where: (orgId) => ({ organizationId: orgId }),
    exclude: [],
  },
  savings_transactions: {
    model: prisma.savingsTransaction,
    where: (orgId) => ({ organizationId: orgId }),
    exclude: [],
  },
  journal_entries: {
    model: prisma.journalEntry,
    where: (orgId) => ({ organizationId: orgId }),
    exclude: [],
  },
  journal_lines: {
    model: prisma.journalLine,
    where: (orgId) => ({ journalEntry: { organizationId: orgId } }),
    exclude: [],
  },
  member_documents: {
    model: prisma.memberDocument,
    where: (orgId) => ({ organizationId: orgId }),
    exclude: ["storagePath"],
  },
}

export const EXPORT_ENTITY_LABELS: Record<string, string> = {
  members: "Members",
  guarantors: "Guarantors",
  loans: "Loans",
  repayments: "Loan Repayments",
  repayment_schedules: "Repayment Schedules",
  savings_accounts: "Savings Accounts",
  savings_transactions: "Savings Transactions",
  journal_entries: "Journal Entries",
  journal_lines: "Journal Lines",
  member_documents: "Member Documents",
}

const DMMF_MODEL_NAMES: Record<string, string> = {
  members: "Member",
  guarantors: "Guarantor",
  loans: "Loan",
  repayments: "LoanRepayment",
  repayment_schedules: "RepaymentSchedule",
  savings_accounts: "SavingsAccount",
  savings_transactions: "SavingsTransaction",
  journal_entries: "JournalEntry",
  journal_lines: "JournalLine",
  member_documents: "MemberDocument",
}

function getColumns(entityKey: string): string[] {
  const config = EXPORT_ENTITIES[entityKey]
  const modelName = DMMF_MODEL_NAMES[entityKey]
  const modelMeta = Prisma.dmmf.datamodel.models.find((m) => m.name === modelName)

  if (!modelMeta) {
    throw new Error(`Model meta not found for ${modelName}`)
  }

  return modelMeta.fields
    .filter((f) => f.kind === "scalar" || f.kind === "enum")
    .map((f) => f.name)
    .filter((name) => !config.exclude.includes(name))
}

export function createEntityCsvStream(
  entityKey: string,
  organizationId: string
): ReadableStream<Uint8Array> {
  if (!EXPORT_ENTITIES[entityKey]) {
    throw new Error("UNKNOWN_ENTITY")
  }

  const config = EXPORT_ENTITIES[entityKey]
  const columns = getColumns(entityKey)

  return new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()
      controller.enqueue(encoder.encode(CSV_BOM + csvRow(columns)))

      let cursor: string | undefined = undefined
      let keepFetching = true

      while (keepFetching) {
        const queryArgs: any = {
          where: config.where(organizationId),
          take: 1000,
          orderBy: { id: "asc" },
        }

        if (cursor) {
          queryArgs.cursor = { id: cursor }
          queryArgs.skip = 1
        }

        const rows = await config.model.findMany(queryArgs)

        if (rows.length > 0) {
          let chunk = ""
          for (const row of rows) {
            const rowValues = columns.map((col) => row[col])
            chunk += csvRow(rowValues)
          }
          controller.enqueue(encoder.encode(chunk))

          cursor = rows[rows.length - 1].id
        }

        if (rows.length < 1000) {
          keepFetching = false
        }
      }

      controller.close()
    },
  })
}
