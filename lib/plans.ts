export interface PlanFeatureGroup {
  category: string
  features: string[]
}

export interface PlanConfig {
  id: string
  name: string
  badge?: string
  tagline: string
  monthlyPrice: number
  maxOfficerSeats: number
  maxBranches: number
  storageQuotaMb: number
  storageDisplay: string
  highlighted?: boolean
  featureGroups: PlanFeatureGroup[]
}

export const SUBSCRIPTION_PLANS: PlanConfig[] = [
  {
    id: "plan_starter",
    name: "Starter",
    badge: "Community MFI",
    tagline: "Essential core lending, member KYC, and daily collections for single-branch institutions.",
    monthlyPrice: 7500,
    maxOfficerSeats: 3,
    maxBranches: 1,
    storageQuotaMb: 512,
    storageDisplay: "500 MB",
    highlighted: false,
    featureGroups: [
      {
        category: "Core Lending & Member KYC",
        features: [
          "Up to 3 Field Officer / Staff seats",
          "1 Branch location",
          "Complete member KYC profiles & NIC tracking",
          "Configurable loan products & weekly / monthly terms",
          "Automatic repayment schedule calculation",
          "500 MB document & collateral storage",
        ],
      },
      {
        category: "Field & Centre Operations",
        features: [
          "Officer collection sheet view",
          "Mobile-responsive field entry",
          "Basic centre & group organization",
        ],
      },
      {
        category: "Accounting & Reports",
        features: [
          "Daily cash collection summaries",
          "Automated loan balance & repayment receipts",
          "Core portfolio outstanding report",
        ],
      },
      {
        category: "Security & Support",
        features: [
          "Role-based security (Admin & Officer)",
          "Standard email support",
          "Daily database backup",
        ],
      },
    ],
  },
  {
    id: "plan_placeholder", // maps to Growth tier in DB
    name: "Growth",
    badge: "Most Popular",
    tagline: "Complete multi-center operations, offline field sync, double-entry accounting, and risk management.",
    monthlyPrice: 15000,
    maxOfficerSeats: 10,
    maxBranches: 3,
    storageQuotaMb: 3072,
    storageDisplay: "3 GB",
    highlighted: true,
    featureGroups: [
      {
        category: "Core Lending & Member KYC",
        features: [
          "Up to 10 Field Officer / Staff seats",
          "Up to 3 Branch locations",
          "Everything in Starter, plus:",
          "Group lending methodology & peer guarantor tracking",
          "Centre meeting schedules & group leader assignments",
          "Loan restructuring, refinances & write-off handling",
          "Multiple guarantor verification & KYC document uploads",
          "3 GB secure document storage",
        ],
      },
      {
        category: "Field & Mobile Operations",
        features: [
          "Offline-first PWA mode for field officers with auto-sync",
          "GPS centre locations & officer daily itineraries",
          "Smart repayment allocation (Principal, Interest, Charges)",
          "Instant digital field receipts & collection audit",
        ],
      },
      {
        category: "Accounting & Financial Governance",
        features: [
          "Full double-entry general ledger & chart of accounts",
          "Automated daily cash flow statements & bank reconciliation",
          "Portfolio At Risk (PAR 1 / 7 / 30 / 90) & loan aging analysis",
          "Repayment reversal workflow with supervisor approvals",
        ],
      },
      {
        category: "Intelligence & Security",
        features: [
          "Duplicate NIC & phone number anomaly detection",
          "Top-bar notification center & live operational alerts",
          "Branch isolation & multi-role scoping (Head Office, Manager, Officer, Accountant)",
          "Priority email & chat support with 24h SLA",
        ],
      },
    ],
  },
  {
    id: "plan_enterprise",
    name: "Enterprise",
    badge: "Maximum Scale",
    tagline: "Advanced AI credit assessments, regulatory audit logging, multi-tier approvals, and dedicated capacity.",
    monthlyPrice: 35000,
    maxOfficerSeats: 30,
    maxBranches: 10,
    storageQuotaMb: 10240,
    storageDisplay: "10 GB",
    highlighted: false,
    featureGroups: [
      {
        category: "Core Lending & Member KYC",
        features: [
          "Up to 30 Field Officer / Staff seats (expandable)",
          "Up to 10 Branch locations (expandable)",
          "Everything in Growth, plus:",
          "Voluntary member savings accounts & deposit tracking",
          "Multi-tier credit approval workflow with threshold limits",
          "10 GB high-capacity document storage",
        ],
      },
      {
        category: "Field & Mobile Operations",
        features: [
          "GPS officer check-in logs",
          "QR-code digital receipt verification for borrowers",
          "Custom field collection rules & grace period overrides",
        ],
      },
      {
        category: "Accounting & Compliance",
        features: [
          "Multi-branch consolidated trial balance & balance sheets",
          "Full regulatory audit logging & tamper-evident activity trails",
          "Automated cron subscription & background risk monitors",
          "Custom exportable financial reporting (Excel & CSV)",
        ],
      },
      {
        category: "AI & Risk Intelligence",
        features: [
          "AI credit score assessment & borrower risk profiling",
          "Real-time fraud detection & suspicious activity alerts",
          "High-risk repayment warnings & default prediction",
        ],
      },
      {
        category: "Enterprise Support & SLA",
        features: [
          "Dedicated account manager & 24/7 priority emergency support",
          "Automated database snapshot backups & custom 99.9% SLA",
          "Assisted data migration & team onboarding",
        ],
      },
    ],
  },
]

export function getPlanConfig(planIdOrName?: string | null): PlanConfig | undefined {
  if (!planIdOrName) return undefined
  const query = planIdOrName.toLowerCase().trim()
  return SUBSCRIPTION_PLANS.find(
    (p) => p.id.toLowerCase() === query || p.name.toLowerCase() === query
  )
}
