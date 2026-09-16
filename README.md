# Micro-Credit (Solida)

Micro-Credit (Solida) is a multi-tenant SaaS platform built for microfinance institutions (MFIs) to manage their daily operations, field collections, and portfolio risk. 

It provides an end-to-end solution for:
- **Organization Hierarchy:** Manage Branches, Centres, and Members.
- **Loan Lifecycle:** Define loan products, originate loans, and track repayment schedules.
- **Field Collections:** Record cash and bank transfer repayments, and calculate daily cash flow.
- **Reporting:** Monitor Portfolio-at-Risk (PAR), Collection Efficiency, and Aging Reports.
- **Platform Administration:** Billing, subscription management, and system-wide audit logging.

## Tech Stack
- **Framework:** Next.js 14 (App Router)
- **Database:** PostgreSQL (Neon)
- **ORM:** Prisma 5
- **Authentication:** Auth.js v5 (Database Sessions)
- **Storage:** Supabase Storage (for KYC documents)
- **Styling:** Tailwind CSS

## Getting Started

First, ensure your environment variables are configured in `.env`:
```
DATABASE_URL="..."
AUTH_SECRET="..."
```

Then, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Documentation

See `design.md` for architectural decisions and the database schema.
See `implementation_plan.md` for planned features.

## Contributing

See `CONTRIBUTING.md` for development guidelines.
