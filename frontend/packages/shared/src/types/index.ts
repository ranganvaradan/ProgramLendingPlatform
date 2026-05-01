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

export interface ApiResponse<T> {
  status: 'SUCCESS' | 'ERROR';
  data: T;
  message?: string;
}
