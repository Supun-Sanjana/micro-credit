import { Prisma } from "@prisma/client";
import { subDays } from "date-fns";
import {
  Organization,
  User,
  Branch,
  Centre,
  Member,
  LoanProduct,
  Loan,
  Guarantor,
  Repayment,
  CashFlow,
} from "./types";

const now = new Date();

export const mockOrganization: Organization = {
  id: "org_1",
  name: "SGP Microfinance",
  createdAt: now,
  updatedAt: now,
};

export const mockUsers: User[] = [
  {
    id: "usr_1",
    email: "admin@solida.com",
    name: "Solida Admin",
    role: "SYSTEM_ADMIN",
    organizationId: "org_1",
    createdAt: new Date("2026-09-01"),
    updatedAt: new Date("2026-09-01"),
    password: "hashed_password",
    branchId: null
  },
  {
    id: "usr_2",
    email: "officer@solida.com",
    name: "Field Officer Nimal",
    role: "FIELD_OFFICER",
    organizationId: "org_1",
    createdAt: new Date("2026-09-01"),
    updatedAt: new Date("2026-09-01"),
    password: "hashed_password",
    branchId: "brn_1"
  },
];

export const mockBranches: Branch[] = [
  {
    id: "br_1",
    code: "SA01",
    name: "GALLE",
    address: "123 Main St, Galle",
    organizationId: "org_1",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "br_2",
    code: "SA02",
    name: "MATARA",
    address: "456 Beach Rd, Matara",
    organizationId: "org_1",
    createdAt: now,
    updatedAt: now,
  },
];

export const mockCentres: Centre[] = [
  {
    id: "ctr_1",
    centreNumber: 1,
    centreCode: "SA01/001",
    name: "THALAPITIYA",
    isMicro: false,
    branchId: "br_1",
    officerId: null,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "ctr_2",
    centreNumber: 1,
    centreCode: "SA02/M01",
    name: "PALATUWA",
    isMicro: true,
    branchId: "br_2",
    officerId: null,
    createdAt: now,
    updatedAt: now,
  },
];

export const mockMembers: Member[] = [
  {
    id: "mem_1",
    memberNumber: "SA01/001/001",
    name: "Sunil Perera",
    nic: "851234567V",
    address: "Thalapitiya, Galle",
    contact1: "0771234567",
    contact2: "",
    groupNumber: 1,
    centreId: "ctr_1",
    organizationId: "org_1",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "mem_2",
    memberNumber: "SA01/001/002",
    name: "Nimali Silva",
    nic: "902345678V",
    address: "Thalapitiya, Galle",
    contact1: "0712345678",
    contact2: "",
    groupNumber: 1,
    centreId: "ctr_1",
    organizationId: "org_1",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "mem_3",
    memberNumber: "SA02/M01/001",
    name: "Kamal Fernando",
    nic: "823456789V",
    address: "Palatuwa, Matara",
    contact1: "0753456789",
    contact2: "",
    groupNumber: 2,
    centreId: "ctr_2",
    organizationId: "org_1",
    createdAt: now,
    updatedAt: now,
  },
];

export const mockLoanProducts: LoanProduct[] = [
  {
    id: "prod_1",
    name: "Quick 13W",
    loanType: "QUICK",
    numberOfWeeks: 13,
    multiplier: new Prisma.Decimal(1.17),
    calculationMethod: "FLAT",
    interestMethod: "FLAT",
    repaymentFrequency: "WEEKLY",
    term: null, gracePeriod: 0, minimumAmount: null, maximumAmount: null, minimumTerm: null, maximumTerm: null,
    isActive: true,
    organizationId: "org_1",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "prod_2",
    name: "Business 18W",
    loanType: "BUSINESS",
    numberOfWeeks: 18,
    multiplier: new Prisma.Decimal(1.17),
    calculationMethod: "FLAT",
    interestMethod: "FLAT",
    repaymentFrequency: "WEEKLY",
    term: null, gracePeriod: 0, minimumAmount: null, maximumAmount: null, minimumTerm: null, maximumTerm: null,
    isActive: true,
    organizationId: "org_1",
    createdAt: now,
    updatedAt: now,
  },
];

export const mockLoans: Loan[] = [
  {
    id: "loan_1",
    memberId: "mem_1",
    loanProductId: "prod_1",
    loanType: "QUICK",
    loanNumber: "1ST",
    loanAmount: new Prisma.Decimal(50000),
    weeklyRental: new Prisma.Decimal(4500),
    numberOfWeeks: 13,
    totalReceivable: new Prisma.Decimal(58500),
    grantedDate: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000), // 2 weeks ago
    expireDate: new Date(now.getTime() + 11 * 7 * 24 * 60 * 60 * 1000),
    status: "ACTIVE",
    verificationStatus: "VERIFIED",
    verificationNote: "OK",
    totalPaid: new Prisma.Decimal(9000),
    outstanding: new Prisma.Decimal(49500),
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "loan_2",
    memberId: "mem_2",
    loanProductId: "prod_2",
    loanType: "BUSINESS",
    loanNumber: "2ND",
    loanAmount: new Prisma.Decimal(100000),
    weeklyRental: new Prisma.Decimal(6500),
    numberOfWeeks: 18,
    totalReceivable: new Prisma.Decimal(117000),
    grantedDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    expireDate: new Date(now.getTime() + 17 * 7 * 24 * 60 * 60 * 1000),
    status: "ACTIVE",
    verificationStatus: "VERIFIED",
    verificationNote: "2ND LOAN",
    totalPaid: new Prisma.Decimal(0),
    outstanding: new Prisma.Decimal(117000),
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "loan_3",
    memberId: "mem_3",
    loanProductId: "prod_1",
    loanType: "QUICK",
    loanNumber: "1ST",
    loanAmount: new Prisma.Decimal(30000),
    weeklyRental: new Prisma.Decimal(2700),
    numberOfWeeks: 13,
    totalReceivable: new Prisma.Decimal(35100),
    grantedDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    expireDate: new Date(now.getTime() + 13 * 7 * 24 * 60 * 60 * 1000),
    status: "PENDING" as any, // Not an official status, but maybe we can use VERIFICATION PENDING
    verificationStatus: "PENDING",
    verificationNote: "Needs address verify",
    totalPaid: new Prisma.Decimal(0),
    outstanding: new Prisma.Decimal(35100),
    createdAt: now,
    updatedAt: now,
  },
];

export const mockGuarantors: Guarantor[] = [
  {
    id: "guar_1",
    memberId: "mem_2", // Nimali is guarantor for Sunil
    loanId: "loan_1",
    name: "Nimali Silva",
    nic: "902345678V",
    contact: "0712345678",
    relationship: "Friend",
    createdAt: now,
    updatedAt: now,
  },
];

export const mockRepayments: Repayment[] = [
  {
    id: "rep_1",
    loanId: "loan_1",
    instalmentNumber: 1,
    scheduledDate: now,
    paidDate: now,
    amount: new Prisma.Decimal(4500),
    method: "CASH",
    note: "OK",
    collectedBy: "usr_2",
    transactionType: "PAYMENT", reversalOfId: null, allocationMethod: null,
    createdAt: now,
  },
  {
    id: "rep_2",
    loanId: "loan_2",
    instalmentNumber: 2,
    scheduledDate: subDays(now, 7),
    paidDate: subDays(now, 7),
    amount: new Prisma.Decimal(6200),
    method: "CASH",
    note: "OK",
    collectedBy: "usr_2",
    transactionType: "PAYMENT", reversalOfId: null, allocationMethod: null,
    createdAt: now,
  },
];

export const mockCashFlows: CashFlow[] = [
  {
    id: "cf_1",
    branchId: "br_1",
    date: new Date(),
    centreName: "THALAPITIYA",
    loanType: "QUICK",
    loansIssued: 0,
    amountIssued: new Prisma.Decimal(0),
    dcAmount: new Prisma.Decimal(4500),
    recoveryAmount: new Prisma.Decimal(4500),
    totalRecovery: new Prisma.Decimal(9000),
    interestAmount: null,
    capitalAmount: null,
    note: "Normal collection",
    createdAt: now,
    updatedAt: now,
  },
];
