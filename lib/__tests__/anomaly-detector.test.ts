import { checkDuplicateNIC } from '../intelligence/anomaly-detector'
import { PrismaClient } from '@prisma/client'

jest.mock('@prisma/client', () => {
  const mPrismaClient = {
    member: {
      findMany: jest.fn(),
    },
    riskAlert: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  }
  return { PrismaClient: jest.fn(() => mPrismaClient) }
})

const prisma = new PrismaClient() as any

describe('Anomaly Detector', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('Duplicate NIC detected correctly', async () => {
    prisma.member.findMany.mockResolvedValue([{ id: 'm1', nic: '123456789V' }])
    prisma.riskAlert.findFirst.mockResolvedValue(null) // no existing alert
    prisma.riskAlert.create.mockResolvedValue({})

    await checkDuplicateNIC('123456789V', 'org1')

    expect(prisma.member.findMany).toHaveBeenCalledWith({
      where: {
        organizationId: 'org1',
        nic: '123456789V',
        id: undefined
      }
    })
    expect(prisma.riskAlert.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        type: 'DUPLICATE_NIC',
        severity: 'CRITICAL',
        status: 'OPEN'
      })
    })
  })

  it('Idempotency: second call with same entity does NOT create a second OPEN alert', async () => {
    prisma.member.findMany.mockResolvedValue([{ id: 'm1', nic: '123456789V' }])
    prisma.riskAlert.findFirst.mockResolvedValue({ id: 'alert1' }) // existing alert
    
    await checkDuplicateNIC('123456789V', 'org1')

    expect(prisma.riskAlert.findFirst).toHaveBeenCalled()
    expect(prisma.riskAlert.create).not.toHaveBeenCalled()
  })
})
