import { useState, useEffect } from 'react';
import { loanApi, useAuth } from '@plp/shared';

interface Loan {
  id: string;
  loanNumber: string;
  productType: string;
  disbursedAmount: number;
  totalRepayable: number;
  totalRepaid: number;
  outstandingAmount: number;
  status: string;
  dueDate: string;
  requestDate: string;
}

export default function RepaymentHistoryPage() {
  const { user } = useAuth();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.userId) loadLoans();
  }, [user]);

  async function loadLoans() {
    setLoading(true);
    try {
      const res = await loanApi.list({ borrowerId: user!.userId });
      const allLoans = res.data?.data || [];
      setLoans(allLoans.filter((l: Loan) =>
        ['DISBURSED', 'REPAYMENT_DUE', 'OVERDUE', 'CLOSED'].includes(l.status)
      ));
    } catch { setLoans([]); }
    setLoading(false);
  }

  async function handleViewKfs(loanId: string) {
    try {
      const res = await fetch(`/api/v1/loans/${loanId}/kfs`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('plp_access_token')}` },
      });
      const html = await res.text();
      const win = window.open('', '_blank');
      if (win) { win.document.write(html); win.document.close(); }
    } catch (e) { console.error('Failed to load KFS', e); }
  }

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Repayment History</h1>
        <p className="text-sm text-slate-500 mt-1">Track your loan repayments and outstanding balances</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-pulse text-slate-400 text-sm">Loading repayment data...</div>
        </div>
      ) : loans.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <div className="text-slate-400 text-sm">No repayment records</div>
          <p className="text-xs text-slate-400 mt-1">Disbursed loans and repayment details will appear here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {loans.map(loan => {
            const progress = loan.totalRepayable > 0
              ? Math.min(100, (loan.totalRepaid / loan.totalRepayable) * 100) : 0;
            return (
              <div key={loan.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-semibold text-slate-800">{loan.loanNumber}</span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        loan.productType === 'PAY_DAY_LOAN' ? 'bg-sky-50 text-sky-700' : 'bg-purple-50 text-purple-700'
                      }`}>
                        {loan.productType?.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold ${
                    loan.status === 'CLOSED' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20' :
                    loan.status === 'OVERDUE' ? 'bg-red-50 text-red-700 ring-1 ring-red-600/20' :
                    'bg-sky-50 text-sky-700 ring-1 ring-sky-600/20'
                  }`}>{loan.status}</span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  <div className="bg-slate-50 rounded-lg p-3">
                    <div className="text-xs text-slate-500">Disbursed</div>
                    <div className="text-sm font-bold text-slate-800 mt-0.5">{formatCurrency(loan.disbursedAmount)}</div>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <div className="text-xs text-slate-500">Total Repayable</div>
                    <div className="text-sm font-bold text-slate-800 mt-0.5">{formatCurrency(loan.totalRepayable)}</div>
                  </div>
                  <div className="bg-emerald-50 rounded-lg p-3">
                    <div className="text-xs text-emerald-600">Repaid</div>
                    <div className="text-sm font-bold text-emerald-700 mt-0.5">{formatCurrency(loan.totalRepaid)}</div>
                  </div>
                  <div className="bg-red-50 rounded-lg p-3">
                    <div className="text-xs text-red-600">Outstanding</div>
                    <div className="text-sm font-bold text-red-700 mt-0.5">{formatCurrency(loan.outstandingAmount)}</div>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-slate-500">Repayment Progress</span>
                    <span className="font-semibold text-slate-700">{progress.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className={`h-2 rounded-full ${progress >= 100 ? 'bg-emerald-500' : 'bg-sky-500'}`}
                      style={{ width: `${progress}%` }} />
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500">Due: {loan.dueDate || 'N/A'}</span>
                  <button onClick={() => handleViewKfs(loan.id)}
                    className="text-xs font-semibold text-sky-600 hover:text-sky-700">
                    View KFS
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
