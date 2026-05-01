import axios from 'axios';

const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || 'http://localhost:8080';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('plp_access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('plp_access_token');
      localStorage.removeItem('plp_refresh_token');
      localStorage.removeItem('plp_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (email: string, password: string) =>
    apiClient.post('/api/v1/auth/login', { email, password }),
  register: (data: Record<string, unknown>) =>
    apiClient.post('/api/v1/auth/register', data),
};

export const programApi = {
  list: () => apiClient.get('/api/v1/programs'),
  get: (id: string) => apiClient.get(`/api/v1/programs/${id}`),
  create: (data: Record<string, unknown>) => apiClient.post('/api/v1/programs', data),
  update: (id: string, data: Record<string, unknown>) => apiClient.put(`/api/v1/programs/${id}`, data),
  updateStatus: (id: string, status: string) =>
    apiClient.patch(`/api/v1/programs/${id}/status`, { status }),
  getUtilization: (id: string) => apiClient.get(`/api/v1/programs/${id}/utilization`),
};

export const anchorApi = {
  list: () => apiClient.get('/api/v1/anchors'),
  get: (id: string) => apiClient.get(`/api/v1/anchors/${id}`),
  create: (data: Record<string, unknown>) => apiClient.post('/api/v1/anchors', data),
  update: (id: string, data: Record<string, unknown>) => apiClient.put(`/api/v1/anchors/${id}`, data),
};

export const borrowerApi = {
  list: (params?: Record<string, string>) => apiClient.get('/api/v1/borrowers', { params }),
  get: (id: string) => apiClient.get(`/api/v1/borrowers/${id}`),
  getLimits: (id: string) => apiClient.get(`/api/v1/borrowers/${id}/limits`),
};

export const loanApi = {
  list: (params?: Record<string, string>) => apiClient.get('/api/v1/loans', { params }),
  get: (id: string) => apiClient.get(`/api/v1/loans/${id}`),
  request: (data: Record<string, unknown>) => apiClient.post('/api/v1/loans', data),
  approve: (id: string, data?: Record<string, unknown>) =>
    apiClient.post(`/api/v1/loans/${id}/approve`, data),
  reject: (id: string, reason: string) =>
    apiClient.post(`/api/v1/loans/${id}/reject`, { reason }),
  disburse: (id: string, amount: number) =>
    apiClient.post(`/api/v1/loans/${id}/disburse`, { amount }),
  repay: (id: string, amount: number) =>
    apiClient.post(`/api/v1/loans/${id}/repay`, { amount }),
};

export const salaryApi = {
  upload: (anchorId: string, programId: string, payPeriod: string, file: File) => {
    const formData = new FormData();
    formData.append('anchorId', anchorId);
    formData.append('programId', programId);
    formData.append('payPeriod', payPeriod);
    formData.append('file', file);
    return apiClient.post('/api/v1/salary/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  create: (data: Record<string, unknown>) => apiClient.post('/api/v1/salary', data),
  list: (params: Record<string, string>) => apiClient.get('/api/v1/salary', { params }),
  getLatest: (borrowerId: string) => apiClient.get(`/api/v1/salary/borrower/${borrowerId}/latest`),
};

export const eligibilityApi = {
  check: (borrowerId: string, programId: string, requestedAmount: number) =>
    apiClient.get('/api/v1/loans/eligibility', { params: { borrowerId, programId, requestedAmount } }),
};

export const portalApi = {
  anchorDashboard: () => apiClient.get('/api/v1/portal/anchor/dashboard'),
  anchorPrograms: (anchorId: string) => apiClient.get('/api/v1/portal/anchor/programs', { params: { anchorId } }),
  anchorEmployees: (anchorId: string, programId?: string) =>
    apiClient.get('/api/v1/portal/anchor/employees', { params: { anchorId, ...(programId ? { programId } : {}) } }),
  anchorSalary: (anchorId: string, payPeriod: string) =>
    apiClient.get('/api/v1/portal/anchor/salary', { params: { anchorId, payPeriod } }),
  anchorSalaryUpload: (anchorId: string, programId: string, payPeriod: string, file: File) => {
    const formData = new FormData();
    formData.append('anchorId', anchorId);
    formData.append('programId', programId);
    formData.append('payPeriod', payPeriod);
    formData.append('file', file);
    return apiClient.post('/api/v1/portal/anchor/salary/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  borrowerDashboard: () => apiClient.get('/api/v1/portal/borrower/dashboard'),
  borrowerLoans: (borrowerId: string) => apiClient.get('/api/v1/portal/borrower/loans', { params: { borrowerId } }),
  borrowerEligibility: (borrowerId: string, programId: string, requestedAmount: number) =>
    apiClient.get('/api/v1/portal/borrower/eligibility', { params: { borrowerId, programId, requestedAmount } }),
  borrowerRequestLoan: (data: Record<string, unknown>) => apiClient.post('/api/v1/portal/borrower/loans/request', data),
};

export const integrationApi = {
  getSalaryInfo: (employeeId: string, anchorId: string) =>
    apiClient.get('/api/v1/integrations/hr/salary', { params: { employeeId, anchorId } }),
  getEarnedSalary: (employeeId: string, anchorId: string) =>
    apiClient.get('/api/v1/integrations/hr/earned-salary', { params: { employeeId, anchorId } }),
  getInvoice: (invoiceNumber: string, anchorId: string) =>
    apiClient.get(`/api/v1/integrations/erp/invoice/${invoiceNumber}`, { params: { anchorId } }),
  listInvoices: (buyerId: string, anchorId: string) =>
    apiClient.get('/api/v1/integrations/erp/invoices', { params: { buyerId, anchorId } }),
};
