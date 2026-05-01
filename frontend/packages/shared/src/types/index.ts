export type UserRole =
  | 'PLATFORM_ADMIN'
  | 'PROGRAM_MANAGER'
  | 'CREDIT_ANALYST'
  | 'ANCHOR_ADMIN'
  | 'BORROWER'
  | 'TREASURY'
  | 'COMPLIANCE_OFFICER';

export type ProductType = 'PAY_DAY_LOAN' | 'INVOICE_DISCOUNTING';

export type ProgramStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'CLOSED';

export type LoanStatus =
  | 'REQUESTED'
  | 'ELIGIBILITY_CHECK'
  | 'APPROVED'
  | 'REJECTED'
  | 'DISBURSEMENT_PENDING'
  | 'DISBURSED'
  | 'REPAYMENT_DUE'
  | 'OVERDUE'
  | 'CLOSED'
  | 'CANCELLED'
  | 'WRITTEN_OFF';

export interface AuthUser {
  userId: string;
  email: string;
  fullName: string;
  role: UserRole;
  accessToken: string;
  refreshToken: string;
}

export interface Program {
  id: string;
  programCode: string;
  programName: string;
  productType: ProductType;
  anchorId: string;
  lenderId: string;
  programLimit: number;
  anchorLimit: number;
  maxBorrowerLimit: number;
  defaultInterestRate: number;
  maxTenureDays: number;
  status: ProgramStatus;
}

export interface Anchor {
  id: string;
  anchorCode: string;
  entityName: string;
  entityType: string;
  gstin: string;
  status: string;
}

export interface Borrower {
  id: string;
  borrowerCode: string;
  name: string;
  programId: string;
  anchorId: string;
  email: string;
  phone: string;
  status: string;
}

export interface BorrowerLimit {
  id: string;
  borrowerId: string;
  programId: string;
  sanctionedLimit: number;
  utilizedLimit: number;
  availableLimit: number;
  status: string;
}

export interface Loan {
  id: string;
  loanNumber: string;
  borrowerId: string;
  programId: string;
  productType: string;
  requestedAmount: number;
  sanctionedAmount: number;
  disbursedAmount: number;
  interestRate: number;
  tenureDays: number;
  totalRepayable: number;
  outstandingAmount: number;
  status: LoanStatus;
  requestDate: string;
  dueDate: string;
}

export interface EmployeeSalaryData {
  id: string;
  borrowerId: string;
  anchorId: string;
  programId: string;
  employeeCode: string;
  payPeriod: string;
  grossSalary: number;
  netSalary: number;
  daysWorked: number;
  totalWorkingDays: number;
  accumulatedSalary: number;
  deductions: number;
  eligibleAmount: number;
  eligibilityPercent: number;
  source: string;
  verified: boolean;
}

export type InvoiceStatus =
  | 'UPLOADED'
  | 'VERIFIED'
  | 'ELIGIBLE'
  | 'PARTIALLY_DISCOUNTED'
  | 'FULLY_DISCOUNTED'
  | 'EXPIRED'
  | 'REJECTED';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  anchorId: string;
  borrowerId: string;
  programId: string;
  invoiceDate: string;
  dueDate: string;
  invoiceAmount: number;
  taxAmount: number;
  netAmount: number;
  currency: string;
  poNumber?: string;
  poDate?: string;
  poAmount?: number;
  grnNumber?: string;
  grnDate?: string;
  threeWayMatch: boolean;
  marginPercent: number;
  eligibleAmount: number;
  discountedAmount: number;
  availableAmount: number;
  status: InvoiceStatus;
  verified: boolean;
  anchorConfirmed: boolean;
  source: string;
  gstinSeller?: string;
  gstinBuyer?: string;
  paymentTerms?: string;
  description?: string;
}

export interface EligibilityResult {
  borrowerId: string;
  programId: string;
  requestedAmount: number;
  eligible: boolean;
  eligibleAmount: number;
  activeLoans: number;
  reasons: string[];
}

export interface ApiResponse<T> {
  status: 'SUCCESS' | 'ERROR';
  data: T;
  message?: string;
}
