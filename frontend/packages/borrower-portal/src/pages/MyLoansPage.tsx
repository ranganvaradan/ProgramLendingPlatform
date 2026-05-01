import { useState } from 'react';
import { portalApi } from '@plp/shared';
import type { Loan } from '@plp/shared';

export default function MyLoansPage() {
  const [borrowerId, setBorrowerId] = useState('');
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const fetchLoans = () => {
    if (!borrowerId) return;
    setLoading(true);
    portalApi.borrowerLoans(borrowerId)
      .then((r) => {
        setLoans(r.data.data || []);
        setSearched(true);
      })
      .catch((err) => console.error('Failed to fetch loans:', err))
      .finally(() => setLoading(false));
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">My Loans</h1>
        <p className="text-sm text-slate-500 mt-1">View all your loan applications and active loans</p>
      </div>

      <div className="flex gap-3 mb-6">
        <input value={borrowerId} onChange={(e) => setBorrowerId(e.target.value)}
          placeholder="Enter your Borrower ID"
          className="flex-1 max-w-md px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none" />
        <button onClick={fetchLoans} disabled={loading || !borrowerId}
          className="px-5 py-2.5 bg-sky-600 text-white text-sm font-semibold rounded-lg hover:bg-sky-700 disabled:opacity-50">
          {loading ? 'Loading...' : 'View Loans'}
        </button>
      </div>

      {loans.length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Loan #</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Product</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Outstanding</th>
                <th className="px-5 py-3.5 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Tenure</th>
                <th className="px-5 py-3.5 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Due Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loans.map((loan) => (
                <tr key={loan.id} className="hover:bg-slate-50/80">
                  <td className="px-5 py-3.5 font-mono text-xs font-medium text-slate-700">{loan.loanNumber}</td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      loan.productType === 'PAY_DAY_LOAN' ? 'bg-sky-50 text-sky-700' : 'bg-purple-50 text-purple-700'
                    }`}>
                      {loan.productType === 'PAY_DAY_LOAN' ? 'PDL' : 'ID'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right font-medium text-slate-700">{formatCurrency(loan.requestedAmount)}</td>
                  <td className="px-5 py-3.5 text-right font-medium text-slate-700">{formatCurrency(loan.outstandingAmount)}</td>
                  <td className="px-5 py-3.5 text-center text-slate-600">{loan.tenureDays}d</td>
                  <td className="px-5 py-3.5 text-center">
                    <LoanBadge status={loan.status} />
                  </td>
                  <td className="px-5 py-3.5 text-xs text-slate-500">{loan.dueDate || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : searched ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <div className="text-slate-400 text-sm">No loans found for this borrower</div>
        </div>
      ) : null}
    </div>
  );
}

function LoanBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    DISBURSED: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20',
    APPROVED: 'bg-blue-50 text-blue-700 ring-1 ring-blue-600/20',
    REQUESTED: 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20',
    OVERDUE: 'bg-red-50 text-red-700 ring-1 ring-red-600/20',
    CLOSED: 'bg-slate-50 text-slate-600 ring-1 ring-slate-500/20',
    REJECTED: 'bg-red-50 text-red-600 ring-1 ring-red-500/20',
    REPAYMENT_DUE: 'bg-orange-50 text-orange-700 ring-1 ring-orange-600/20',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold ${styles[status] || 'bg-slate-50 text-slate-600'}`}>
      {status.replaceAll('_', ' ')}
    </span>
  );
}
