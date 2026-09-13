import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

test.describe('Cross-Organization Security', () => {
  test.setTimeout(60000);

  let crossOrgLoanId: string = '';
  let evilOrgId: string = '';

  test.beforeAll(async () => {
    // Setup a real loan in a different organization
    const otherOrg = await prisma.organization.create({
      data: {
        name: 'Evil Corp',
        branches: {
          create: [{
            name: 'Evil Branch',
            code: 'EB01',
            centres: {
              create: [{
                name: 'Evil Centre',
                centreCode: 'EC01',
                centreNumber: 1
              }]
            }
          }]
        }
      },
      include: {
        branches: {
          include: { centres: true }
        }
      }
    });
    evilOrgId = otherOrg.id;
    const evilCentreId = otherOrg.branches[0].centres[0].id;

    const otherMember = await prisma.member.create({
      data: {
        organizationId: otherOrg.id,
        centreId: evilCentreId,
        name: 'Evil Member',
        nic: '999999999V',
        address: 'Evil HQ',
        contact1: '0779999999',
        memberNumber: 'EVIL-01'
      }
    });

    const otherLoan = await prisma.loan.create({
      data: {
        memberId: otherMember.id,
        loanType: 'QUICK',
        loanAmount: 50000,
        weeklyRental: 1000,
        numberOfWeeks: 50,
        totalReceivable: 50000,
        outstanding: 50000,
        status: 'ACTIVE'
      }
    });

    crossOrgLoanId = otherLoan.id;
  });

  test.afterAll(async () => {
    // Cleanup using cascade or manual delete
    if (evilOrgId) {
      await prisma.loanRepayment.deleteMany({ where: { loan: { member: { organizationId: evilOrgId } } } });
      await prisma.loan.deleteMany({ where: { member: { organizationId: evilOrgId } } });
      await prisma.member.deleteMany({ where: { organizationId: evilOrgId } });
      await prisma.centre.deleteMany({ where: { branch: { organizationId: evilOrgId } } });
      await prisma.branch.deleteMany({ where: { organizationId: evilOrgId } });
      await prisma.organization.delete({ where: { id: evilOrgId } });
    }
  });

  test('rejects collection POST with valid loanId from another organization', async ({ page }) => {
    // 1. Login as standard Tenant (micro.local)
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[type="email"]', 'admin@micro.local');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');

    await page.waitForLoadState('networkidle');
    await page.waitForURL('**/dashboard', { timeout: 15000 });
    await expect(page).toHaveURL('/dashboard', { timeout: 15000 });

    // 2. POST to /api/collection with the REAL loanId from the other org
    const response = await page.request.post('/api/collection', {
      data: {
        date: new Date().toISOString(),
        centreId: 'cuid_centre_123',
        entries: [
          {
            loanId: crossOrgLoanId,
            scheduleId: 'cuid_schedule_123',
            instalmentNumber: 1,
            amount: 5000,
            status: 'FULL',
            note: 'Hacked cross-org payment'
          }
        ]
      }
    });

    // 3. Assert response status is 403 (unauthorized/invalid loan)
    expect(response.status()).toBe(403);
    const body = await response.json();
    expect(body.error).toContain('Invalid or unauthorized loan ID');
  });
});
