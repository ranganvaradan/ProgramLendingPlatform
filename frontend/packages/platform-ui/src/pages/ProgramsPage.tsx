import { useEffect, useState } from 'react';
import { programApi } from '@plp/shared';
import type { Program } from '@plp/shared';

export default function ProgramsPage() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    programApi.list().then((res) => {
      setPrograms(res.data.data || []);
    }).catch((err) => {
      console.error('Failed to fetch programs:', err);
    }).finally(() => {
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="text-gray-500">Loading programs...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Programs</h2>
        <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700">
          + Create Program
        </button>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr className="text-left text-gray-500 border-b">
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Program Name</th>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Program Limit</th>
              <th className="px-4 py-3">Interest Rate</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {programs.map((p) => (
              <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs">{p.programCode}</td>
                <td className="px-4 py-3 font-medium">{p.programName}</td>
                <td className="px-4 py-3">{p.productType === 'PAY_DAY_LOAN' ? 'Pay Day Loan' : 'Invoice Discounting'}</td>
                <td className="px-4 py-3">₹{(p.programLimit / 100000).toFixed(1)}L</td>
                <td className="px-4 py-3">{p.defaultInterestRate}%</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    p.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                  }`}>{p.status}</span>
                </td>
              </tr>
            ))}
            {programs.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No programs yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
