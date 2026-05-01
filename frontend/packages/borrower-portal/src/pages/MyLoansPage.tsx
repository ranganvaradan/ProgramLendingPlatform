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

  const statusColor = (status: string) => {
    switch (status) {
      case 'DISBURSED': return 'bg-green-100 text-green-700';
      case 'APPROVED': return 'bg-blue-100 text-blue-700';
      case 'REQUESTED': return 'bg-yellow-100 text-yellow-700';
      case 'CLOSED': return 'bg-gray-100 text-gray-700';
      case 'OVERDUE': return 'bg-red-100 text-red-700';
      case 'REJECTED': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">My Loans</h2>

      <div className="flex gap-3 mb-6">
        <input value={borrowerId} onChange={(e) => setBorrowerId(e.target.value)}
          placeholder="Enter your Borrower ID"
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm w-80" />
        <button onClick={fetchLoans} disabled={loading || !borrowerId}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50">
          {loading ? 'Loading...' : 'View Loans'}
        </button>
      </div>

      {loans.length > 0 ? (
        <div className="bg-white rounded-lg shadow">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left">Loan #</th>
                <th className="px-4 py-2 text-right">Amount</th>
                <th className="px-4 py-2 text-right">Outstanding</th>
                <th className="px-4 py-2 text-center">Tenure</th>
                <th className="px-4 py-2 text-center">Status</th>
                <th className="px-4 py-2 text-left">Due Date</th>
              </tr>
            </thead>
            <tbody>
              {loans.map((loan) => (
                <tr key={loan.id} className="border-t border-gray-100">
                  <td className="px-4 py-2 font-mono text-xs">{loan.loanNumber}</td>
                  <td className="px-4 py-2 text-right">₹{loan.requestedAmount.toLocaleString('en-IN')}</td>
                  <td className="px-4 py-2 text-right">₹{loan.outstandingAmount.toLocaleString('en-IN')}</td>
                  <td className="px-4 py-2 text-center">{loan.tenureDays}d</td>
                  <td className="px-4 py-2 text-center">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColor(loan.status)}`}>
                      {loan.status}
                    </span>
                  </td>
                  <td className="px-4 py-2">{loan.dueDate || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : searched ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          No loans found for this borrower.
        </div>
      ) : null}
    </div>
  );
}
