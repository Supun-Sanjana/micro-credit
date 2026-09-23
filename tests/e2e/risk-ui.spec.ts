import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

test.describe('Risk Alerts and Credit Assessment UI', () => {
  test.setTimeout(90000); // 90 seconds timeout for Next.js initial compilation

  let fieldOfficerEmail = 'risk_field_officer@micro.local';
  let fieldOfficerPassword = 'password123';
  let testLoanId = '';

  test.beforeAll(async () => {
    // 1. Find the organization for admin@micro.local
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@micro.local' }
    });
    
    if (!adminUser) throw new Error('No admin user found');
    const orgId = adminUser.organizationId;

    // 2. Delete any existing RiskAlert records for that organization so we have a clean slate.
    await prisma.riskAlert.deleteMany({
      where: { organizationId: orgId }
    });

    // 3. Create exactly ONE RiskAlert via Prisma
    await prisma.riskAlert.create({
      data: {
        organizationId: orgId,
        type: 'DUPLICATE_NIC',
        severity: 'CRITICAL',
        entityType: 'Member',
        entityId: 'test-member-id',
        description: 'Test duplicate NIC alert',
        status: 'OPEN'
      }
    });

    // Create a FIELD_OFFICER for testing
    const hashedPassword = await bcrypt.hash(fieldOfficerPassword, 10);
    
    await prisma.user.upsert({
      where: { email: fieldOfficerEmail },
      update: {
        password: hashedPassword,
        role: 'FIELD_OFFICER',
        organizationId: orgId
      },
      create: {
        email: fieldOfficerEmail,
        name: 'Test Field Officer',
        password: hashedPassword,
        role: 'FIELD_OFFICER',
        organizationId: orgId
      }
    });

    // Setup dummy Member, Loan, Credit Assessment for Credit Assessment Card on Loan Page
    let loan = await prisma.loan.findFirst({
      where: { member: { organizationId: orgId } }
    });

    if (!loan) {
      let branch = await prisma.branch.findFirst({ where: { organizationId: orgId } });
      if (!branch) {
        branch = await prisma.branch.create({
          data: {
            code: 'B-TEST',
            name: 'Test Branch',
            organizationId: orgId
          }
        });
      }

      let centre = await prisma.centre.findFirst({ where: { branchId: branch.id } });
      if (!centre) {
        centre = await prisma.centre.create({
          data: {
            centreNumber: 9999,
            centreCode: 'C-TEST',
            name: 'Test Centre',
            branchId: branch.id
          }
        });
      }

      let member = await prisma.member.findFirst({ where: { organizationId: orgId } });
      if (!member) {
        member = await prisma.member.create({
          data: {
            memberNumber: 'M-TEST',
            name: 'Test Member',
            nic: '123456789V',
            centreId: centre.id,
            organizationId: orgId
          }
        });
      }

      loan = await prisma.loan.create({
        data: {
          memberId: member.id,
          loanType: 'MICRO',
          loanAmount: 10000,
          weeklyRental: 1000,
          numberOfWeeks: 10,
          totalReceivable: 10000,
          outstanding: 10000,
          status: 'ACTIVE'
        }
      });
    }

    testLoanId = loan.id;

    // Delete existing assessments for this member and create a new one to be sure
    await prisma.creditAssessment.deleteMany({
      where: { memberId: loan.memberId, loanId: loan.id }
    });
    
    await prisma.creditAssessment.create({
      data: {
        organizationId: orgId,
        memberId: loan.memberId,
        loanId: loan.id,
        score: 85,
        grade: 'A',
        factors: ['+ Good repayment history', '- High debt-to-income'],
        inputs: {},
        createdById: adminUser.id
      }
    });
  });

  test.afterAll(async () => {
    await prisma.$disconnect();
  });

  test('1. Sidebar Navigation (Admin)', async ({ page }) => {
    await page.goto('/app/login');
    await page.waitForLoadState('networkidle');

    await page.fill('input[type="email"]', 'admin@micro.local');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');

    await page.waitForURL('**/dashboard');
    
    // Assert that the aside contains a link to "Risk"
    await expect(page.locator('aside').getByRole('link', { name: 'Risk', exact: true })).toBeVisible();
  });

  test('2. Risk Alerts Dashboard', async ({ page }) => {
    await page.goto('/app/login');
    await page.waitForLoadState('networkidle');

    await page.fill('input[type="email"]', 'admin@micro.local');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');

    await page.waitForURL('**/dashboard');

    await page.goto('/app/risk');
    await page.waitForLoadState('networkidle');

    // Assert h1 contains "Risk Alerts"
    await expect(page.locator('h1')).toContainText('Risk Alerts');

    // Assert the table contains our seeded alert
    await expect(page.getByRole('cell', { name: 'DUPLICATE NIC', exact: true })).toBeVisible();
    await expect(page.getByText('Critical')).toBeVisible();

    // Click Acknowledge
    const acknowledgeBtn = page.getByRole('button', { name: /acknowledge/i });
    if (await acknowledgeBtn.isVisible()) {
      await acknowledgeBtn.click();
    }
    
    // Assert status changes
    await expect(page.getByText('ACKNOWLEDGED')).toBeVisible();
  });

  test('3. RBAC Restriction for FIELD_OFFICER', async ({ page }) => {
    await page.goto('/app/login');
    await page.waitForLoadState('networkidle');

    await page.fill('input[type="email"]', fieldOfficerEmail);
    await page.fill('input[name="password"]', fieldOfficerPassword);
    await page.click('button[type="submit"]');

    await page.waitForURL('**/dashboard');
    
    // Assert Risk Alerts link is NOT visible in sidebar
    await expect(page.locator('aside').getByRole('link', { name: 'Risk', exact: true })).not.toBeVisible();
  });

  test('4. Credit Assessment Card on Loan Page', async ({ page }) => {
    await page.goto('/app/login');
    await page.waitForLoadState('networkidle');

    await page.fill('input[type="email"]', 'admin@micro.local');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');

    await page.waitForURL('**/dashboard');

    await page.goto(`/app/loans/${testLoanId}`);
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('Credit Assessment')).toBeVisible();
  });
});
