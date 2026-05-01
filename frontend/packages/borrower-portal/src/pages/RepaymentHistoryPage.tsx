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
      const res = await fetch(`http://localhost:8080/api/v1/loans/${loanId}/kfs`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('plp_access_token')}` },
      });
      const html = await res.text();
      const win = window.open('', '_blank');
      if (win) { win.document.write(html); win.document.close(); }
    } catch (e) { console.error('Failed to load KFS', e); }
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-4">Repayment History</h1>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : loans.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-lg">No repayment records</p>
          <p className="text-sm mt-1">Disbursed loans and repayment details will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {loans.map(loan => {
            const progress = loan.totalRepayable > 0
              ? Math.min(100, (loan.totalRepaid / loan.totalRepayable) * 100) : 0;
            return (
              <div key={loan.id} className="bg-white rounded-lg border p-5">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-semibold text-gray-900">{loan.loanNumber}</p>
                    <p className="text-xs text-gray-500">{loan.productType?.replace('_', ' ')}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    loan.status === 'CLOSED' ? 'bg-green-100 text-green-800' :
                    loan.status === 'OVERDUE' ? 'bg-red-100 text-red-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>{loan.status}</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-3">
                  <div>
                    <p className="text-gray-500">Disbursed</p>
                    <p className="font-medium">{'\u20B9'}{loan.disbursedAmount?.toLocaleString('en-IN')}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Total Repayable</p>
                    <p className="font-medium">{'\u20B9'}{loan.totalRepayable?.toLocaleString('en-IN')}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Repaid</p>
                    <p className="font-medium text-green-600">{'\u20B9'}{loan.totalRepaid?.toLocaleString('en-IN')}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Outstanding</p>
                    <p className="font-medium text-red-600">{'\u20B9'}{loan.outstandingAmount?.toLocaleString('en-IN')}</p>
                  </div>
                </div>
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Repayment Progress</span>
                    <span>{progress.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${progress}%` }} />
                  </div>
                </div>
                <div className="flex justify-between items-center text-xs text-gray-400">
                  <span>Due: {loan.dueDate || 'N/A'}</span>
                  <button onClick={() => handleViewKfs(loan.id)}
                    className="text-indigo-600 hover:underline text-sm font-medium">
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
