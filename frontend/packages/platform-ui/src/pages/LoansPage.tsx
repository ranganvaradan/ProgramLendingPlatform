import { useEffect, useState } from 'react';
import { loanApi } from '@plp/shared';
import type { Loan } from '@plp/shared';

export default function LoansPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState('');

  const reload = () => {
    loanApi.list().then((res) => setLoans(res.data.data || [])).catch(console.error);
  };

  useEffect(() => {
    loanApi.list().then((res) => {
      setLoans(res.data.data || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleApprove = async (loan: Loan) => {
    setActionMsg('');
    try {
      await loanApi.approve(loan.id, { sanctionedAmount: loan.requestedAmount });
      setActionMsg(`Loan ${loan.loanNumber} approved`);
      reload();
    } catch (err) {
      setActionMsg(`Approve failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleDisburse = async (loan: Loan) => {
    setActionMsg('');
    try {
      const amount = loan.sanctionedAmount || loan.requestedAmount;
      await loanApi.disburse(loan.id, amount);
      setActionMsg(`Loan ${loan.loanNumber} disbursed`);
      reload();
    } catch (err) {
      setActionMsg(`Disburse failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleReject = async (loan: Loan) => {
    setActionMsg('');
    try {
      await loanApi.reject(loan.id, 'Rejected by admin');
      setActionMsg(`Loan ${loan.loanNumber} rejected`);
      reload();
    } catch (err) {
      setActionMsg(`Reject failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-slate-400 text-sm">Loading loans...</div>
      </div>
    );
  }

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Loans</h1>
        <p className="text-sm text-slate-500 mt-1">All loan applications and active loans</p>
      </div>

      {actionMsg && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${
          actionMsg.includes('failed') ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
        }`}>{actionMsg}</div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total', value: loans.length, color: 'text-slate-700' },
          { label: 'Active', value: loans.filter(l => ['DISBURSED', 'REPAYMENT_DUE'].includes(l.status)).length, color: 'text-emerald-600' },
          { label: 'Pending', value: loans.filter(l => ['REQUESTED', 'APPROVED'].includes(l.status)).length, color: 'text-amber-600' },
          { label: 'Overdue', value: loans.filter(l => l.status === 'OVERDUE').length, color: 'text-red-600' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-lg border border-slate-200 px-4 py-3">
            <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-slate-500">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Loan</th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Product</th>
              <th className="px-5 py-3.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
              <th className="px-5 py-3.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Rate</th>
              <th className="px-5 py-3.5 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Tenure</th>
              <th className="px-5 py-3.5 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-5 py-3.5 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loans.map((l) => (
              <tr key={l.id} className="hover:bg-slate-50/80">
                <td className="px-5 py-3.5">
                  <div className="font-mono text-xs font-medium text-slate-700">{l.loanNumber}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{l.requestDate}</div>
                </td>
                <td className="px-5 py-3.5">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    l.productType === 'PAY_DAY_LOAN' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'
                  }`}>
                    {l.productType === 'PAY_DAY_LOAN' ? 'PDL' : 'ID'}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-right font-medium text-slate-700">{formatCurrency(l.requestedAmount)}</td>
                <td className="px-5 py-3.5 text-right text-slate-600">{l.interestRate}%</td>
                <td className="px-5 py-3.5 text-center text-slate-600">{l.tenureDays}d</td>
                <td className="px-5 py-3.5 text-center">
                  <LoanStatusBadge status={l.status} />
                </td>
                <td className="px-5 py-3.5 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    {l.status === 'REQUESTED' && (
                      <>
                        <button onClick={() => handleApprove(l)}
                          className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 rounded hover:bg-emerald-100">
                          Approve
                        </button>
                        <button onClick={() => handleReject(l)}
                          className="px-2.5 py-1 text-xs font-semibold text-red-700 bg-red-50 rounded hover:bg-red-100">
                          Reject
                        </button>
                      </>
                    )}
                    {l.status === 'APPROVED' && (
                      <button onClick={() => handleDisburse(l)}
                        className="px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 rounded hover:bg-blue-100">
                        Disburse
                      </button>
                    )}
                    {!['REQUESTED', 'APPROVED'].includes(l.status) && (
                      <span className="text-xs text-slate-400">{l.dueDate || '—'}</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {loans.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center">
                  <div className="text-slate-400 text-sm">No loans found</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function LoanStatusBadge({ status }: { status: string }) {
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
