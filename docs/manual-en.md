# Solida Microfinance Platform - Comprehensive User Manual

Welcome to **Solida**, the comprehensive cloud-based SaaS platform designed specifically for modern microfinance institutions (MFIs). This manual provides an exhaustive, step-by-step guide for all user roles, ensuring you can effectively manage members, process loans, handle daily field collections, and oversee your entire institutional operations.

This manual is divided into role-based sections. Please navigate to the section that corresponds to your responsibilities within the organization. 

---

## 1. Introduction & Getting Started

### 1.1 Understanding Solida
Solida is designed to streamline microfinance operations. It handles everything from the initial onboarding of a member (KYC) to the final settlement of a loan, including double-entry accounting and offline field collections. Solida is built for speed, compliance, and scalability, allowing institutions to grow from a single branch to a nationwide network.

### 1.2 System Requirements
Before you begin, ensure you have the following:
- **Desktop/Laptop (for Admins & Back-office):** A modern web browser (Google Chrome, Mozilla Firefox, or Microsoft Edge). Safari is also supported.
- **Mobile Device (for Field Officers):** An Android or iOS device with a modern browser. The application is highly optimized for Chrome on Android.
- **Internet Connection:** While field operations support offline mode, initial synchronization requires a stable 3G/4G or Wi-Fi connection.

### 1.3 Login & Dashboard
To access Solida, you must have an active internet connection and a registered user account provided by your System Administrator.

**Step-by-step Login:**
1. Navigate to your institution's specific Solida web portal URL (e.g., `https://app.solida.com/login`).
2. You will be greeted by the secure login screen.
3. Enter your registered email address in the **Email** field. Ensure there are no leading or trailing spaces.
4. Enter your secure password in the **Password** field.
5. If you have forgotten your password, click the "Forgot Password?" link to initiate the reset process via email.
6. Click the **Sign In** button.
7. Upon successful authentication, the system checks your role and redirects you to the appropriate **Dashboard**.

**Dashboard Overview & Key Metrics:**
The Dashboard is the control center of your operations. It provides a high-level overview of your institution's health. The metrics displayed depend heavily on your user role.

- **Active Loans:** Displays the total number of loans currently in the `ACTIVE` status. This represents your active portfolio.
- **Total Disbursements:** The monetary value of all loans issued within the current day, week, or month (toggleable).
- **Daily Collections:** A real-time, live-updating tracker of cash collected by field officers today. This is crucial for end-of-day reconciliation.
- **Portfolio at Risk (PAR):** A critical metric showing the percentage of your loan portfolio that is delayed in repayment. Solida automatically calculates PAR-1, PAR-7, PAR-30, and PAR-90 based on missed installments.
- **Recent Activities Feed:** A timeline of recent actions taken by users within your branch, such as new members added or loans approved.

> **Tip:** Always log out at the end of your session by clicking your profile icon in the top right corner and selecting "Sign out". Never share your password, as Solida tracks all actions via an immutable Audit Log linked to your specific user account.

### 1.4 User Roles & Permissions
Solida employs strict Role-Based Access Control (RBAC). 
- **System Admin:** Can manage all branches, configure accounting, change billing, and alter core settings.
- **Head Office:** Similar to System Admin but restricted from billing and destructive actions.
- **Branch Manager:** Can only view and approve data related to their specific assigned branch.
- **Accountant:** Focused on the General Ledger, Journal Entries, Cashflow, and Reports.
- **Field Officer:** Restricted mostly to the mobile views for collecting payments, viewing centre schedules, and basic member creation.

---

## 2. System Admin & Head Office Operations

This section covers the core operations available on the desktop web application. It is meant for Branch Managers, Accountants, and System Administrators.

### 2.1 Member KYC & Profiles (`/app/members`)
The Member section is where you onboard new clients and manage their Know Your Customer (KYC) data. Accurate KYC is crucial for risk management, credit scoring, and regulatory compliance.

**Understanding the Member Fields:**
- **Member Number:** A unique identifier generated automatically by the system or entered manually if migrating from a legacy system.
- **NIC:** National Identity Card number. Crucial for cross-referencing and preventing duplicate loans.
- **Contact 1 & 2:** Primary and secondary phone numbers. Used for SMS receipts and follow-ups.
- **Address:** Residential and business addresses.

**Step-by-step Member Onboarding:**
1. Navigate to **Operations > Members** on the left sidebar navigation menu.
2. Click the **New Member** button in the top right corner of the screen.
3. **Personal Details:** Enter the member's full name, date of birth, and select their gender from the dropdown.
4. **NIC (National Identity Card):** Enter the exact NIC number. 
   - *What it means:* This is used by the system to prevent duplicate registrations. The system will throw an error if this NIC already exists in your organization's database.
5. **Contact Information:** Fill out Contact 1 (primary mobile) and Contact 2 (optional alternative).
6. **Address Details:** Provide the full residential address. You can also add GPS coordinates if required by your organizational policy.
7. **Centre Assignment:** Select a **Centre** from the dropdown list. 
   - *What it means:* Centres dictate which Field Officer is responsible for collecting from this member during their daily routes.
8. **Group Assignment:** Assign the member to a specific Group number within the Centre. This is vital for group-lending methodologies.
9. **Financial Profile:** Input their declared monthly income, business expenses, and household expenses. The system calculates disposable income automatically to determine loan affordability.
10. Review all entered data carefully.
11. Click **Save Member**. A success notification will appear, and you will be redirected to the new member's detail page.

**Member Detail Page Walkthrough:**
When viewing a member (`/app/members/[id]`), you will see a comprehensive view structured into tabs:
- **Overview Tab:** Displays their profile details (NIC, Contact, Address). It also features a crucial "Loan History" table showing all past and present loans, and a "Guarantor For" table showing if they have guaranteed someone else's loan.
- **Documents Section:** Where KYC documents (photos, IDs) are securely stored.
- **Savings Accounts Tab:** For tracking voluntary member deposits and withdrawals.

### 2.2 Document Verification Rules (`/app/documents`)
Solida digitizes the paper trail, reducing physical storage needs and improving auditability. Field officers or branch staff can upload photos of documents directly to the system.

**Document Upload Rules & Constraints:**
1. **Size Limit:** Files must strictly be **under 1MB**. This ensures the platform remains fast and storage costs are minimized.
2. **Image Auto-compression:** If you upload images (JPG/PNG) via the mobile web browser, Solida uses a Canvas auto-compression technique. It dynamically resizes and compresses the image before uploading, saving bandwidth and storage.
3. **PDF Files:** If you are uploading a PDF (e.g., a scanned bank statement or a large contract) that is over 1MB, the system will reject it. 
   - *Action required:* You must use an external PDF compression tool (like ILovePDF or Adobe Acrobat) to shrink the file size before attempting to upload it to Solida.
4. **Supported Formats:** Only JPG, PNG, and PDF formats are permitted.

**Step-by-step Document Verification (For Back-office):**
1. Navigate to **Operations > Document Verification**.
2. You will see a queue of `PENDING` documents uploaded by field officers.
3. Click on a document row to view the image/PDF in a modal window.
4. Compare the document against the data entered in the system (e.g., check if the uploaded NIC matches the entered NIC number).
5. If valid, click **Approve**. The document status changes to `VERIFIED`.
6. If invalid (blurry, incorrect, expired), click **Reject**, and enter a mandatory rejection reason. The field officer will be notified to re-upload.

> **Warning:** Do not approve blurry or unreadable documents. Regulatory audits require clear copies of KYC documents.

### 2.3 Loan Products Config (`/app/loan-products`)
Before issuing any loans, the System Administrator must define the types of loans your MFI offers. This enforces consistency and prevents officers from creating arbitrary loan terms.

**Understanding Loan Product Fields:**
- **Product Name:** A descriptive name (e.g., "Micro Business Loan - 12 Weeks").
- **Loan Type:** Category classification (Quick, Business, Micro). Used for reporting and dashboard filtering.
- **Calculation Method:** 
  - *Flat:* Interest is calculated on the total principal for the entire duration. Very common in microfinance.
  - *Declining Balance:* Interest is calculated only on the remaining outstanding principal.
- **Interest Method:** How interest is applied to the schedule.
- **Repayment Frequency:** Daily, Weekly, Biweekly, or Monthly. Determines the interval of installments.
- **Multiplier:** The interest rate expressed as a multiplier. For example, a multiplier of `1.17` on a 10,000 loan means the total receivable is 11,700 (17% total interest).
- **Grace Period:** Number of intervals (weeks/months) before the first payment is due.
- **Minimum/Maximum Amount:** Hard limits to prevent data entry errors (e.g., Min 5,000, Max 100,000).

**Step-by-step Product Creation:**
1. Go to **Settings > Loan Products**.
2. Click **Create Product**.
3. Fill in all the fields described above according to your institutional policy.
4. Click **Save Product**. It will immediately become available in the dropdown when creating a new loan.

### 2.4 Full Loan Lifecycle Walkthrough
This is the most critical workflow in Solida. It tracks a loan from inception, through various approval stages, to active repayment, and finally to settlement.

**Stage 1: Application (Draft/Submitted)**
1. Go to a Member's profile and click the **New Loan** button.
2. Select a **Loan Product** from the dropdown list. 
3. Enter the requested **Loan Amount**. Ensure it falls within the product's min/max limits.
4. The system will auto-calculate the weekly/monthly rental and the total receivable based on the product rules.
5. Click **Save as Draft**. The loan is now in the `DRAFT` state.

**Stage 2: Guarantor Assignment**
Microfinance often requires guarantors to mitigate risk.
1. On the newly created Loan Detail page (`/app/loans/[id]`), scroll to the Guarantors section.
2. Click **Add Guarantor**.
3. You can select an existing member from the system or add an external person's details manually (Name, NIC, Contact, Relationship to borrower).
4. The system automatically checks if the guarantor already guarantees too many active loans and will warn you if they are over-leveraged.

**Stage 3: Approval Workflow (Under Review -> Approved)**
1. Once the application is complete and guarantors are added, click **Submit for Review**. The loan moves to `UNDER_REVIEW`.
2. Depending on your organization's custom Approval Rules (`/app/settings/approvals`), a Branch Manager or Head Office Admin must review the application.
3. The approver navigates to the loan page. They must check the member's **Credit Assessment Grade** (A, B, C, or D). This grade is calculated out of 100 by the AI engine based on past repayment history, missed payments, and group performance.
4. The approver reviews the uploaded KYC documents.
5. If satisfied, the approver clicks **Approve Loan**. The status becomes `APPROVED`. If rejected, it becomes `REJECTED` and requires a reason.

**Stage 4: Disbursement**
1. The member visits the branch to collect cash, or a bank transfer is initiated.
2. In Solida, navigate to the approved loan and click **Record Disbursement**.
3. Select the disbursement date and method (Cash or Bank Transfer).
4. *What happens in the background:* This is a critical system action. Solida generates the official Repayment Schedule (a fixed list of future dates and amounts due). It also posts a Journal Entry to the Accounting system, crediting the Cash/Bank account and debiting the Loan Portfolio asset account. The loan status becomes `ACTIVE`.

**Stage 5: Repayment & Management**
1. Field officers collect weekly payments using the mobile app (detailed in Section 3).
2. The Loan Detail page shows a real-time view of the **Outstanding balance** and **Total paid**.
3. **Top-up / Refinance:** If an active member needs more funds before settling their current loan, click the "Top-up / Refinance" button. 
   - *Requirement:* You must enter a new loan amount that strictly exceeds the current outstanding balance. The system will use part of the new loan to settle the old loan automatically, and issue the remainder as cash.
4. **Write-off:** If a loan is completely unrecoverable (due to death or severe default), an admin can click "Write off". 
   - *Process:* Enter a mandatory reason. The system removes the loan from the active portfolio metrics, updates the status to `DEFAULTED`, and moves the balance to loss accounts in the General Ledger.
5. **Record Recovery:** If a written-off loan is later unexpectedly recovered (partially or fully), use the "Record recovery" button to log the collected amount against the written-off balance, reversing the loss entry.

**Stage 6: Settlement**
Once the `Outstanding` balance hits exactly `0.00` through regular payments, the system automatically changes the loan status to `SETTLED`. No manual intervention is required.

> **Tip:** Do not manually edit repayment schedules unless absolutely necessary due to a system error. If a member's terms need to change legally, use the formal "Restructure Loan" feature to officially generate a new schedule version which preserves audit history.

### 2.5 Group Lending & Centre Management
Microfinance heavily relies on group and centre structures for peer pressure, efficient collection, and social cohesion.

- **Centres (`/app/centres`):** Represent a geographical meeting point (e.g., a village community hall, a specific junction). 
  - *Management:* You must assign a specific Field Officer to manage each centre. The centre dictates the officer's daily route. You also define the meeting day (e.g., every Tuesday) and time.
- **Groups (`/app/groups`):** Sub-units within a centre (usually consisting of 3 to 5 people). 
  - *Management:* You appoint a group leader. Peer-guarantor models are tracked at this level. If one group member defaults, the system can flag the other group members during their next loan application.

### 2.6 Accounting & Cashflow (`/app/accounting`, `/app/cashflow`)
Solida includes a full, integrated double-entry accounting system, eliminating the need for separate, disconnected accounting software like QuickBooks or Xero.

**Chart of Accounts (CoA):**
Every transaction maps to a specific account in the CoA.
- **Assets:** Cash in hand, Bank accounts, Loan Portfolio (Principal outstanding).
- **Liabilities:** Member Savings deposits, External Borrowings.
- **Equity:** Retained earnings, Share capital.
- **Income:** Interest Income, Processing Fees, Penalty Fees.
- **Expenses:** Officer Salaries, Office Rent, Utilities.

**Journal Entries & Automation:**
- *Automated Entries:* When a loan is disbursed or a payment is collected via the mobile app, Solida automatically posts a perfectly balanced Journal Entry in the background. You do not need to manually enter these.
- *Manual Entries:* For operational expenses (e.g., paying the electricity bill), an accountant must navigate to the Journal Entries page, select the appropriate Expense and Asset (Cash) accounts, and post a manual double-entry.

**Cashflow Monitoring:**
The `/app/cashflow` page provides a daily tracking view of cash issued vs. cash recovered per branch. It is essential for liquidity management, ensuring the branch always has enough cash on hand for tomorrow's planned disbursements.

### 2.7 Subscription & Invoice Flow (`/app/settings/billing`)
To keep your Solida platform active and accessible, you must manage your subscription billing. Failure to pay will result in the platform being locked into a read-only state.

**Step-by-step Billing Flow:**
1. Navigate to **Settings > Billing** in the sidebar.
2. **Select Plan:** Review the available plans.
   - *Starter:* LKR 7,500/mo (3 officers, 1 branch, 500MB storage)
   - *Growth:* LKR 15,000/mo (10 officers, 3 branches, 3GB storage)
   - *Enterprise:* LKR 35,000/mo (30 officers, 10 branches, 10GB storage)
3. Select your desired tier based on your current operational scale.
4. **Download Invoice:** Click the `Download Invoice` button.
5. The system will generate a PDF Proforma Invoice. 
   - *Crucial Step:* Note the **Invoice Number** at the top right of the PDF. It is formatted as `INV-YYYYMMDD-PLANNAME-XXXXX`.
6. **Bank Transfer:** Perform an offline bank transfer or physical cash deposit at a bank branch using the exact details provided below. 
   - *Requirement:* **You MUST use the Invoice Number as your payment reference/remark during the bank transfer.** This is how our system links your payment to your account.
7. **Submit Payment Claim:** Return to the Solida Billing page and scroll down to the "Submit Payment Claim" form.
8. Enter the exact **Payment Amount (LKR)** you transferred.
9. Enter the **Bank Reference / Invoice Number** you noted earlier.
10. Upload a clear photo or PDF of the deposit slip/bank transfer receipt.
11. Click **Submit Payment Claim**.
12. The claim goes to a `PENDING` status. A Solida Platform Admin will manually verify the funds in the bank. Once verified, your account limits and expiration date will automatically upgrade.

**Official Billing Bank Details:**
Please use only these details for subscription payments:
- **Bank Name:** Bank of Ceylon (BOC)
- **Account Name:** MicroCredit Platform Ltd
- **Account Number:** 0084 1029 8452
- **Branch & Swift:** Colombo Corporate (BOCELKJA)

---

## 3. Field Officer Operations (Mobile & Offline)

The Field Officer module (`/app/field`) is a specialized interface designed for mobile devices. It is built to function reliably in challenging network environments where 3G/4G signals frequently drop.

### 3.1 The Offline Sync Flow
Solida uses standard web technologies (IndexedDB) to store data locally on the field officer's phone, allowing them to work completely without the internet.

**Detailed Step-by-Step Offline Flow:**
1. **Morning Prep (Online):** While at the branch office, at home, or somewhere with a strong Wi-Fi/4G connection, the officer must open the Solida app on their phone browser.
2. Navigate to the assigned **Centre** for the day. 
3. The app automatically fetches the "Collection Sheet". You will see a small loading spinner. 
   - *What happens:* Once loaded, the data (member names, expected amounts, loan IDs) is saved securely to the phone's internal IndexedDB storage.
4. **Go Offline:** The officer travels to the remote village. They lose internet connection. 
   - *Indicator:* A red `CloudOff (Offline)` indicator will automatically appear at the top right of the screen.
5. **Record Collections:** The officer conducts the centre meeting. They tap on members' names and enter the cash amounts collected. They tap "Confirm Collection".
6. *Offline Saving:* Because they are offline, Solida saves these repayment records locally into the phone's database. The screen will show a success message but mark them internally as pending sync.
7. **Return Online:** The officer travels back to town or the branch office where network coverage is restored.
8. The officer opens the app. The system detects the network, and an automatic sync indicator (spinning arrows) appears. 
9. The offline records are pushed to the main server instantly. The system processes them as if they were entered live.

> **CRITICAL WARNING:** Do NOT clear your mobile browser's cache, cookies, or site data while you have unsynced offline collections. Doing so will permanently delete the local database, and that collection data will be irrevocably lost! Always ensure sync is complete before closing tabs or clearing history.

### 3.2 Executing Centre Collections (`/field/centres`)
When viewing a Centre's collection sheet, you will see a list of all members expected to pay today.

**Step-by-step Recording of a Payment:**
1. Tap a member's name on the list. A bottom drawer slides up.
2. The drawer shows the *Exact Due Amount* (which is the sum of Principal Due + Interest Due for that specific week).
3. **Full Payment:** Tap the "Full" button. The system auto-fills the input field with the exact due amount. Tap Confirm.
4. **Partial Payment:** Tap the "Partial" button. Manually type in the lesser amount received (e.g., if the due amount is 1000, but they only have 600). Tap Confirm. The system will calculate the arrears automatically.
5. **Missed Payment:** Tap the "Missed" button if the member did not pay anything.
   - *Requirement:* You must select a reason from the dropdown menu (e.g., `NO_CASH`, `MEMBER_UNAVAILABLE`, `BUSINESS_CLOSED`, `REFUSED`).
   - You can also add optional text notes for context. Tap Save Missed Payment.

### 3.3 Issuing Digital Receipts (`/field/receipt`)
After recording a payment, the app can generate a digital receipt.
1. The receipt displays the Paid Amount, Date, Member Name, and remaining Outstanding Balance.
2. The officer can show this receipt to the member as a QR code, which the member can scan with their own smartphone to save a copy.
3. If SMS integration is enabled by the System Admin, a receipt SMS will automatically be fired to the member's primary contact number.

### 3.4 Reconcile & Day End (`/field/reconcile`)
At the end of the day, the field officer must hand over the physical cash they collected to the branch cashier.
1. Open the **Reconcile** tab in the mobile menu.
2. The screen displays the **Total Cash Collected** according to all the digital inputs made during the day.
3. The officer counts their physical cash. The physical cash must match the digital total exactly.
4. If there is a discrepancy (shortage or excess), the officer must resolve it with the cashier.
5. The branch cashier logs into their desktop dashboard, verifies the handed-over amount, and clicks confirm to close the officer's daily sheet.

---

## 4. Platform Super Admin (SaaS Management)

This section is strictly for Solida's internal engineering and support staff who manage the SaaS infrastructure. Regular MFI users do not have access to these pages.

### 4.1 Organizations Management (`/admin/orgs`)
This is the master list of all tenants on the platform.
- View all registered MFIs.
- Monitor their active users, storage usage (measured precisely in MB/GB), and plan limits.
- **Suspension:** If an organization violates the Terms of Service or fails to pay their subscription for an extended period, a Super Admin can manually suspend their account here. This instantly blocks all logins for that MFI.

### 4.2 Payment Claims Verification (`/admin/claims`)
When an MFI submits a payment claim (as described in Section 2.7), it appears in this centralized queue.

**Strict Verification Workflow:**
1. Click on a pending claim in the dashboard.
2. Review the submitted Bank Reference / Invoice Number and the uploaded proof image.
3. Open the corporate Bank of Ceylon online banking portal in a separate window.
4. Verify that the funds (exact amount) have indeed hit account `0084 1029 8452` with the matching reference number.
5. If verified, return to Solida and click **Verify Claim**.
6. *Background Action:* The system automatically extends the MFI's subscription by 1 month (or 1 year) and upgrades their limits if they changed plans. An automated email is sent to the MFI admin.
7. If the funds cannot be found, click **Reject Claim** and enter a detailed reason so the MFI can investigate with their bank.

### 4.3 Subscription Plans Configuration (`/admin/plans`)
Manage the pricing, naming, and tier constraints of the SaaS offering.
- **Max Officer Seats:** Hard limit on how many Field Officer accounts the MFI can create. Enforced at the database level.
- **Max Branches:** Limits the geographical expansion capability in the UI.
- **Storage Quota:** Limits document uploads. Once reached, the MFI must upgrade or delete old documents.

### 4.4 Global Audit Logs (`/admin/audit-logs`)
A system-level log tracking highly sensitive actions performed by Platform Admins (e.g., manually altering a tenant's subscription status or accessing tenant metadata) for compliance, security, and accountability.

---
*End of Comprehensive User Manual - Generated for Solida Platform*

---

## 5. Frequently Asked Questions (FAQ)

### 5.1 General
**Q: I forgot my password. What do I do?**
A: Use the "Forgot Password" link on the login page. Enter your email address to receive a password reset link.

**Q: Can I use Solida on my mobile phone?**
A: Yes, Solida is fully responsive. For Field Officers, the mobile experience is specifically optimized for offline use.

**Q: How secure is my data?**
A: Solida uses industry-standard encryption for data at rest and in transit. Regular backups are performed to ensure data integrity.

### 5.2 Loans
**Q: Can I change a loan's repayment schedule after it has been approved?**
A: No, approved schedules are locked for audit purposes. You must use the "Restructure Loan" feature to generate a new schedule.

**Q: What happens if a member overpays?**
A: The system automatically records the overpayment as an advance and applies it to the next scheduled installment.

**Q: Can a member have multiple active loans?**
A: Yes, provided they meet the credit assessment criteria and fall within the limits set by your institution's loan products.

### 5.3 Billing
**Q: When is my subscription payment due?**
A: Payments are typically due on the anniversary date of your subscription. You will receive email reminders 7 days and 3 days prior.

**Q: What happens if I miss a payment?**
A: Your account will enter a 7-day grace period. After that, it will be restricted to read-only access until the payment is cleared.

### 5.4 Troubleshooting
**Q: The app is stuck on 'Syncing' when I return online.**
A: Ensure you have a stable internet connection. Try refreshing the page. Do not clear your browser cache.

**Q: I cannot upload a document.**
A: Check the file size. It must be under 1MB. Ensure it is a supported format (JPG, PNG, PDF).

---

## 5. Frequently Asked Questions (FAQ)

### 5.1 General
**Q: I forgot my password. What do I do?**
A: Use the "Forgot Password" link on the login page. Enter your email address to receive a password reset link.

**Q: Can I use Solida on my mobile phone?**
A: Yes, Solida is fully responsive. For Field Officers, the mobile experience is specifically optimized for offline use.

**Q: How secure is my data?**
A: Solida uses industry-standard encryption for data at rest and in transit. Regular backups are performed to ensure data integrity.

### 5.2 Loans
**Q: Can I change a loan's repayment schedule after it has been approved?**
A: No, approved schedules are locked for audit purposes. You must use the "Restructure Loan" feature to generate a new schedule.

**Q: What happens if a member overpays?**
A: The system automatically records the overpayment as an advance and applies it to the next scheduled installment.

**Q: Can a member have multiple active loans?**
A: Yes, provided they meet the credit assessment criteria and fall within the limits set by your institution's loan products.

### 5.3 Billing
**Q: When is my subscription payment due?**
A: Payments are typically due on the anniversary date of your subscription. You will receive email reminders 7 days and 3 days prior.

**Q: What happens if I miss a payment?**
A: Your account will enter a 7-day grace period. After that, it will be restricted to read-only access until the payment is cleared.

### 5.4 Troubleshooting
**Q: The app is stuck on 'Syncing' when I return online.**
A: Ensure you have a stable internet connection. Try refreshing the page. Do not clear your browser cache.

**Q: I cannot upload a document.**
A: Check the file size. It must be under 1MB. Ensure it is a supported format (JPG, PNG, PDF).

---

## 5. Frequently Asked Questions (FAQ)

### 5.1 General
**Q: I forgot my password. What do I do?**
A: Use the "Forgot Password" link on the login page. Enter your email address to receive a password reset link.

**Q: Can I use Solida on my mobile phone?**
A: Yes, Solida is fully responsive. For Field Officers, the mobile experience is specifically optimized for offline use.

**Q: How secure is my data?**
A: Solida uses industry-standard encryption for data at rest and in transit. Regular backups are performed to ensure data integrity.

### 5.2 Loans
**Q: Can I change a loan's repayment schedule after it has been approved?**
A: No, approved schedules are locked for audit purposes. You must use the "Restructure Loan" feature to generate a new schedule.

**Q: What happens if a member overpays?**
A: The system automatically records the overpayment as an advance and applies it to the next scheduled installment.

**Q: Can a member have multiple active loans?**
A: Yes, provided they meet the credit assessment criteria and fall within the limits set by your institution's loan products.

### 5.3 Billing
**Q: When is my subscription payment due?**
A: Payments are typically due on the anniversary date of your subscription. You will receive email reminders 7 days and 3 days prior.

**Q: What happens if I miss a payment?**
A: Your account will enter a 7-day grace period. After that, it will be restricted to read-only access until the payment is cleared.

### 5.4 Troubleshooting
**Q: The app is stuck on 'Syncing' when I return online.**
A: Ensure you have a stable internet connection. Try refreshing the page. Do not clear your browser cache.

**Q: I cannot upload a document.**
A: Check the file size. It must be under 1MB. Ensure it is a supported format (JPG, PNG, PDF).

---

## 5. Frequently Asked Questions (FAQ)

### 5.1 General
**Q: I forgot my password. What do I do?**
A: Use the "Forgot Password" link on the login page. Enter your email address to receive a password reset link.

**Q: Can I use Solida on my mobile phone?**
A: Yes, Solida is fully responsive. For Field Officers, the mobile experience is specifically optimized for offline use.

**Q: How secure is my data?**
A: Solida uses industry-standard encryption for data at rest and in transit. Regular backups are performed to ensure data integrity.

### 5.2 Loans
**Q: Can I change a loan's repayment schedule after it has been approved?**
A: No, approved schedules are locked for audit purposes. You must use the "Restructure Loan" feature to generate a new schedule.

**Q: What happens if a member overpays?**
A: The system automatically records the overpayment as an advance and applies it to the next scheduled installment.

**Q: Can a member have multiple active loans?**
A: Yes, provided they meet the credit assessment criteria and fall within the limits set by your institution's loan products.

### 5.3 Billing
**Q: When is my subscription payment due?**
A: Payments are typically due on the anniversary date of your subscription. You will receive email reminders 7 days and 3 days prior.

**Q: What happens if I miss a payment?**
A: Your account will enter a 7-day grace period. After that, it will be restricted to read-only access until the payment is cleared.

### 5.4 Troubleshooting
**Q: The app is stuck on 'Syncing' when I return online.**
A: Ensure you have a stable internet connection. Try refreshing the page. Do not clear your browser cache.

**Q: I cannot upload a document.**
A: Check the file size. It must be under 1MB. Ensure it is a supported format (JPG, PNG, PDF).

---

## 5. Frequently Asked Questions (FAQ)

### 5.1 General
**Q: I forgot my password. What do I do?**
A: Use the "Forgot Password" link on the login page. Enter your email address to receive a password reset link.

**Q: Can I use Solida on my mobile phone?**
A: Yes, Solida is fully responsive. For Field Officers, the mobile experience is specifically optimized for offline use.

**Q: How secure is my data?**
A: Solida uses industry-standard encryption for data at rest and in transit. Regular backups are performed to ensure data integrity.

### 5.2 Loans
**Q: Can I change a loan's repayment schedule after it has been approved?**
A: No, approved schedules are locked for audit purposes. You must use the "Restructure Loan" feature to generate a new schedule.

**Q: What happens if a member overpays?**
A: The system automatically records the overpayment as an advance and applies it to the next scheduled installment.

**Q: Can a member have multiple active loans?**
A: Yes, provided they meet the credit assessment criteria and fall within the limits set by your institution's loan products.

### 5.3 Billing
**Q: When is my subscription payment due?**
A: Payments are typically due on the anniversary date of your subscription. You will receive email reminders 7 days and 3 days prior.

**Q: What happens if I miss a payment?**
A: Your account will enter a 7-day grace period. After that, it will be restricted to read-only access until the payment is cleared.

### 5.4 Troubleshooting
**Q: The app is stuck on 'Syncing' when I return online.**
A: Ensure you have a stable internet connection. Try refreshing the page. Do not clear your browser cache.

**Q: I cannot upload a document.**
A: Check the file size. It must be under 1MB. Ensure it is a supported format (JPG, PNG, PDF).

---

## 5. Frequently Asked Questions (FAQ)

### 5.1 General
**Q: I forgot my password. What do I do?**
A: Use the "Forgot Password" link on the login page. Enter your email address to receive a password reset link.

**Q: Can I use Solida on my mobile phone?**
A: Yes, Solida is fully responsive. For Field Officers, the mobile experience is specifically optimized for offline use.

**Q: How secure is my data?**
A: Solida uses industry-standard encryption for data at rest and in transit. Regular backups are performed to ensure data integrity.

### 5.2 Loans
**Q: Can I change a loan's repayment schedule after it has been approved?**
A: No, approved schedules are locked for audit purposes. You must use the "Restructure Loan" feature to generate a new schedule.

**Q: What happens if a member overpays?**
A: The system automatically records the overpayment as an advance and applies it to the next scheduled installment.

**Q: Can a member have multiple active loans?**
A: Yes, provided they meet the credit assessment criteria and fall within the limits set by your institution's loan products.

### 5.3 Billing
**Q: When is my subscription payment due?**
A: Payments are typically due on the anniversary date of your subscription. You will receive email reminders 7 days and 3 days prior.

**Q: What happens if I miss a payment?**
A: Your account will enter a 7-day grace period. After that, it will be restricted to read-only access until the payment is cleared.

### 5.4 Troubleshooting
**Q: The app is stuck on 'Syncing' when I return online.**
A: Ensure you have a stable internet connection. Try refreshing the page. Do not clear your browser cache.

**Q: I cannot upload a document.**
A: Check the file size. It must be under 1MB. Ensure it is a supported format (JPG, PNG, PDF).
