import { useEffect, useState } from 'react';
import { loanApi } from '@plp/shared';
import type { Loan } from '@plp/shared';

export default function LoansPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loanApi.list().then((res) => {
      setLoans(res.data.data || []);
    }).catch((err) => {
      console.error('Failed to fetch loans:', err);
    }).finally(() => {
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="text-gray-500">Loading loans...</div>;

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Loans</h2>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr className="text-left text-gray-500 border-b">
              <th className="px-4 py-3">Loan Number</th>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Interest</th>
              <th className="px-4 py-3">Tenure</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Due Date</th>
            </tr>
          </thead>
          <tbody>
            {loans.map((l) => (
              <tr key={l.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs">{l.loanNumber}</td>
                <td className="px-4 py-3">{l.productType === 'PAY_DAY_LOAN' ? 'PDL' : 'ID'}</td>
                <td className="px-4 py-3">₹{l.requestedAmount?.toLocaleString()}</td>
                <td className="px-4 py-3">{l.interestRate}%</td>
                <td className="px-4 py-3">{l.tenureDays}d</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${loanStatusColor(l.status)}`}>
                    {l.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs">{l.dueDate || '-'}</td>
              </tr>
            ))}
            {loans.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No loans found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function loanStatusColor(status: string) {
  switch (status) {
    case 'DISBURSED': return 'bg-green-100 text-green-700';
    case 'APPROVED': return 'bg-blue-100 text-blue-700';
    case 'REQUESTED': return 'bg-yellow-100 text-yellow-700';
    case 'OVERDUE': return 'bg-red-100 text-red-700';
    case 'CLOSED': return 'bg-gray-100 text-gray-700';
    case 'REJECTED': return 'bg-red-100 text-red-600';
    default: return 'bg-gray-100 text-gray-700';
  }
}
