import { Prisma } from "@prisma/client"
import {
  allocatePayment,
  balancesFromLoan,
  distributeAllocationsToSchedules,
  SchedulePortion,
} from "../payment-allocation"

describe("Payment Allocation Engine", () => {
  describe("allocatePayment (Waterfall)", () => {
    const balances = {
      PENALTY: new Prisma.Decimal("100.00"),
      FEE: new Prisma.Decimal("50.00"),
      INTEREST: new Prisma.Decimal("200.00"),
      PRINCIPAL: new Prisma.Decimal("1000.00"),
    }

    it("allocates in order: PENALTY -> FEE -> INTEREST -> PRINCIPAL", () => {
      // Covers PENALTY (100) + FEE (50) + partial INTEREST (100) = 250
      const result = allocatePayment(new Prisma.Decimal("250.00"), balances)
      expect(result).toHaveLength(3)
      expect(result.find((a) => a.component === "PENALTY")?.amount.toFixed(2)).toBe("100.00")
      expect(result.find((a) => a.component === "FEE")?.amount.toFixed(2)).toBe("50.00")
      expect(result.find((a) => a.component === "INTEREST")?.amount.toFixed(2)).toBe("100.00")
      expect(result.find((a) => a.component === "PRINCIPAL")).toBeUndefined()

      const totalAllocated = result.reduce((sum, a) => sum.plus(a.amount), new Prisma.Decimal(0))
      expect(totalAllocated.toFixed(2)).toBe("250.00")
    })

    it("allocates full amount across all components when sufficient", () => {
      const result = allocatePayment(new Prisma.Decimal("1350.00"), balances)
      expect(result).toHaveLength(4)
      expect(result.find((a) => a.component === "PENALTY")?.amount.toFixed(2)).toBe("100.00")
      expect(result.find((a) => a.component === "FEE")?.amount.toFixed(2)).toBe("50.00")
      expect(result.find((a) => a.component === "INTEREST")?.amount.toFixed(2)).toBe("200.00")
      expect(result.find((a) => a.component === "PRINCIPAL")?.amount.toFixed(2)).toBe("1000.00")
      const totalAllocated = result.reduce((sum, a) => sum.plus(a.amount), new Prisma.Decimal(0))
      expect(totalAllocated.toFixed(2)).toBe("1350.00")
    })

    it("throws an error when payment exceeds the total outstanding balance", () => {
      expect(() => allocatePayment(new Prisma.Decimal("1350.01"), balances)).toThrow(
        /exceeds the outstanding balance/
      )
    })

    it("returns empty array for zero payment", () => {
      const result = allocatePayment(new Prisma.Decimal("0.00"), balances)
      expect(result).toHaveLength(0)
    })
  })

  describe("balancesFromLoan", () => {
    it("derives remaining interest and principal using the legacy multiplier convention", () => {
      const loan = {
        loanAmount: new Prisma.Decimal("1000.00"),
        totalReceivable: new Prisma.Decimal("1170.00"), // 17% interest = 170.00
        totalPaid: new Prisma.Decimal("100.00"),        // 100 paid -> interest reduced by 100
      }
      const derived = balancesFromLoan(loan)
      expect(derived.PENALTY.toFixed(2)).toBe("0.00")
      expect(derived.FEE.toFixed(2)).toBe("0.00")
      expect(derived.INTEREST.toFixed(2)).toBe("70.00") // 170 - 100
      expect(derived.PRINCIPAL.toFixed(2)).toBe("1000.00")
    })

    it("applies payments past interest to principal", () => {
      const loan = {
        loanAmount: new Prisma.Decimal("1000.00"),
        totalReceivable: new Prisma.Decimal("1170.00"),
        totalPaid: new Prisma.Decimal("270.00"), // 170 interest + 100 principal
      }
      const derived = balancesFromLoan(loan)
      expect(derived.INTEREST.toFixed(2)).toBe("0.00")
      expect(derived.PRINCIPAL.toFixed(2)).toBe("900.00")
    })
  })

  describe("distributeAllocationsToSchedules", () => {
    it("maps all component allocations to a single schedule when payment affects only one schedule", () => {
      const allocations = [
        { component: "INTEREST" as const, amount: new Prisma.Decimal("30.00") },
        { component: "PRINCIPAL" as const, amount: new Prisma.Decimal("70.00") },
      ]
      const portions: SchedulePortion[] = [
        { scheduleId: "sched-1", amount: new Prisma.Decimal("100.00") },
      ]

      const distributed = distributeAllocationsToSchedules(allocations, portions)
      expect(distributed).toHaveLength(2)
      expect(distributed[0]).toEqual({
        component: "INTEREST",
        amount: new Prisma.Decimal("30.00"),
        scheduleId: "sched-1",
      })
      expect(distributed[1]).toEqual({
        component: "PRINCIPAL",
        amount: new Prisma.Decimal("70.00"),
        scheduleId: "sched-1",
      })

      // Sum of allocations on sched-1 matches portion exactly
      const sumSched1 = distributed
        .filter((d) => d.scheduleId === "sched-1")
        .reduce((s, d) => s.plus(d.amount), new Prisma.Decimal(0))
      expect(sumSched1.toFixed(2)).toBe("100.00")
    })

    it("splits allocations across multiple schedules while preserving component and schedule sums", () => {
      // Payment of 150 total: 40 Interest, 110 Principal
      // Affects Schedule 1 (receives 60) and Schedule 2 (receives 90)
      const allocations = [
        { component: "INTEREST" as const, amount: new Prisma.Decimal("40.00") },
        { component: "PRINCIPAL" as const, amount: new Prisma.Decimal("110.00") },
      ]
      const portions: SchedulePortion[] = [
        { scheduleId: "sched-1", amount: new Prisma.Decimal("60.00") },
        { scheduleId: "sched-2", amount: new Prisma.Decimal("90.00") },
      ]

      const distributed = distributeAllocationsToSchedules(allocations, portions)

      // Schedule 1: 40 Interest + 20 Principal = 60
      // Schedule 2: 90 Principal = 90
      expect(distributed).toHaveLength(3)
      expect(distributed[0]).toEqual({
        component: "INTEREST",
        amount: new Prisma.Decimal("40.00"),
        scheduleId: "sched-1",
      })
      expect(distributed[1]).toEqual({
        component: "PRINCIPAL",
        amount: new Prisma.Decimal("20.00"),
        scheduleId: "sched-1",
      })
      expect(distributed[2]).toEqual({
        component: "PRINCIPAL",
        amount: new Prisma.Decimal("90.00"),
        scheduleId: "sched-2",
      })

      const sched1Sum = distributed
        .filter((d) => d.scheduleId === "sched-1")
        .reduce((s, d) => s.plus(d.amount), new Prisma.Decimal(0))
      expect(sched1Sum.toFixed(2)).toBe("60.00")

      const sched2Sum = distributed
        .filter((d) => d.scheduleId === "sched-2")
        .reduce((s, d) => s.plus(d.amount), new Prisma.Decimal(0))
      expect(sched2Sum.toFixed(2)).toBe("90.00")

      const totalInterest = distributed
        .filter((d) => d.component === "INTEREST")
        .reduce((s, d) => s.plus(d.amount), new Prisma.Decimal(0))
      expect(totalInterest.toFixed(2)).toBe("40.00")

      const totalPrincipal = distributed
        .filter((d) => d.component === "PRINCIPAL")
        .reduce((s, d) => s.plus(d.amount), new Prisma.Decimal(0))
      expect(totalPrincipal.toFixed(2)).toBe("110.00")
    })

    it("assigns scheduleId null when no schedules are targeted (loan without schedules)", () => {
      const allocations = [
        { component: "PRINCIPAL" as const, amount: new Prisma.Decimal("500.00") },
      ]
      const distributed = distributeAllocationsToSchedules(allocations, [])
      expect(distributed).toHaveLength(1)
      expect(distributed[0]).toEqual({
        component: "PRINCIPAL",
        amount: new Prisma.Decimal("500.00"),
        scheduleId: null,
      })
    })

    it("guarantees that grouping allocations by scheduleId perfectly reconciles on reversal", () => {
      // 3 schedules covered by a lump sum payment of 300
      const allocations = [
        { component: "INTEREST" as const, amount: new Prisma.Decimal("60.00") },
        { component: "PRINCIPAL" as const, amount: new Prisma.Decimal("240.00") },
      ]
      const portions: SchedulePortion[] = [
        { scheduleId: "s-1", amount: new Prisma.Decimal("100.00") },
        { scheduleId: "s-2", amount: new Prisma.Decimal("100.00") },
        { scheduleId: "s-3", amount: new Prisma.Decimal("100.00") },
      ]

      const distributed = distributeAllocationsToSchedules(allocations, portions)

      // Simulate the reversal grouping algorithm from approveReversal:
      const reversalMap = new Map<string, Prisma.Decimal>()
      for (const a of distributed) {
        if (a.scheduleId) {
          const cur = reversalMap.get(a.scheduleId) ?? new Prisma.Decimal(0)
          reversalMap.set(a.scheduleId, cur.add(a.amount))
        }
      }

      expect(reversalMap.get("s-1")?.toFixed(2)).toBe("100.00")
      expect(reversalMap.get("s-2")?.toFixed(2)).toBe("100.00")
      expect(reversalMap.get("s-3")?.toFixed(2)).toBe("100.00")
    })
  })
})
