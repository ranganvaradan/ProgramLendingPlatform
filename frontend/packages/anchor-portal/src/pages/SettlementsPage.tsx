import { useState, useEffect } from 'react';
import { loanApi } from '@plp/shared';

interface Loan {
  id: string;
  loanNumber: string;
  productType: string;
  borrowerId: string;
  requestedAmount: number;
  disbursedAmount: number;
  outstandingAmount: number;
  totalRepaid: number;
  status: string;
  dueDate: string;
  requestDate: string;
}

export default function SettlementsPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadLoans(); }, []);

  async function loadLoans() {
    setLoading(true);
    try {
      const res = await loanApi.list();
      const allLoans: Loan[] = res.data?.data || [];
      setLoans(allLoans.filter(l =>
        ['DISBURSED', 'REPAYMENT_DUE', 'OVERDUE', 'CLOSED'].includes(l.status)
      ));
    } catch { setLoans([]); }
    setLoading(false);
  }

  const totalDisbursed = loans.reduce((s, l) => s + (l.disbursedAmount || 0), 0);
  const totalOutstanding = loans.reduce((s, l) => s + (l.outstandingAmount || 0), 0);
  const totalRepaid = loans.reduce((s, l) => s + (l.totalRepaid || 0), 0);

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-4">Settlement Tracking</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border p-4">
          <p className="text-sm text-gray-500">Active Loans</p>
          <p className="text-2xl font-bold text-gray-900">{loans.filter(l => l.status !== 'CLOSED').length}</p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <p className="text-sm text-gray-500">Total Disbursed</p>
          <p className="text-2xl font-bold text-indigo-600">{'\u20B9'}{totalDisbursed.toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <p className="text-sm text-gray-500">Total Repaid</p>
          <p className="text-2xl font-bold text-green-600">{'\u20B9'}{totalRepaid.toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <p className="text-sm text-gray-500">Outstanding</p>
          <p className="text-2xl font-bold text-red-600">{'\u20B9'}{totalOutstanding.toLocaleString('en-IN')}</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading settlements...</div>
      ) : loans.length === 0 ? (
        <div className="text-center py-12 text-gray-400">No disbursed loans to track.</div>
      ) : (
        <div className="bg-white rounded-lg border overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Loan #</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Disbursed</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Repaid</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Outstanding</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loans.map(l => (
                <tr key={l.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{l.loanNumber}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{l.productType?.replace('_', ' ')}</td>
                  <td className="px-4 py-3 text-sm text-right">{'\u20B9'}{l.disbursedAmount?.toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3 text-sm text-right text-green-600">{'\u20B9'}{(l.totalRepaid || 0).toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3 text-sm text-right text-red-600">{'\u20B9'}{l.outstandingAmount?.toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{l.dueDate || 'N/A'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      l.status === 'CLOSED' ? 'bg-green-100 text-green-800' :
                      l.status === 'OVERDUE' ? 'bg-red-100 text-red-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>{l.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
