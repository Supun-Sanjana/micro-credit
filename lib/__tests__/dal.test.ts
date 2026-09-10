import { getScopedDal } from "../dal"
import { auth } from "@/auth"
import prisma from "../prisma"

// Mock the auth module
jest.mock("@/auth", () => ({
  auth: jest.fn(),
}))

describe("Data Access Layer (DAL) - Organization Isolation", () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it("should throw an error if user has no organizationId", async () => {
    (auth as jest.Mock).mockResolvedValueOnce({
      user: { id: "user-1", role: "USER", organizationId: null },
    })

    await expect(getScopedDal()).rejects.toThrow("Unauthorized: No organization context found")
  })

  it("should scope branch finds to the user's organizationId", async () => {
    const orgId = "org-A"
    ;(auth as jest.Mock).mockResolvedValueOnce({
      user: { id: "user-2", role: "USER", organizationId: orgId },
    })

    // Mock Prisma findMany
    const prismaFindManyMock = jest.spyOn(prisma.branch, "findMany").mockResolvedValueOnce([])

    const dal = await getScopedDal()
    await dal.branches.findMany({ where: { name: "GALLE" } })

    expect(prismaFindManyMock).toHaveBeenCalledWith({
      where: { name: "GALLE", organizationId: orgId },
    })
  })

  it("should prevent access to branches from other organizations via findUnique", async () => {
    const orgId = "org-A"
    ;(auth as jest.Mock).mockResolvedValueOnce({
      user: { id: "user-2", role: "USER", organizationId: orgId },
    })

    // Mock Prisma findUnique to return a branch belonging to org-B
    const prismaFindUniqueMock = jest.spyOn(prisma.branch, "findUnique").mockResolvedValueOnce({
      id: "branch-1",
      code: "B1",
      name: "OTHER",
      address: null,
      organizationId: "org-B",
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const dal = await getScopedDal()
    const result = await dal.branches.findUnique({ where: { id: "branch-1" } })

    // Even though prisma returned a result, the DAL should intercept and return null
    // because organizationId does not match orgId.
    expect(result).toBeNull()
    expect(prismaFindUniqueMock).toHaveBeenCalledWith({ where: { id: "branch-1" } })
  })
})
