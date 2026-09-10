export type {
  Organization,
  User,
  Role,
  Branch,
  Centre,
  Member,
  LoanProduct,
  Loan,
  LoanType,
  LoanStatus,
  VerificationStatus,
  LoanRepayment as Repayment,
  LoanRepayment as RepaymentSchedule,
  RepaymentMethod,
  CashFlow,
} from "@prisma/client";

// The schema currently does not have Guarantor, so we define it manually here
// to satisfy the frontend plan.
export interface Guarantor {
  id: string;
  memberId?: string; // If picking an existing member
  loanId: string;
  name: string;
  nic: string;
  contact: string;
  relationship: string;
  createdAt: Date;
  updatedAt: Date;
}
