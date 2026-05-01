import { useEffect, useState } from 'react';
import { programApi, loanApi } from '@plp/shared';
import type { Program, Loan } from '@plp/shared';

export default function DashboardPage() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [progRes, loanRes] = await Promise.all([
          programApi.list(),
          loanApi.list(),
        ]);
        setPrograms(progRes.data.data || []);
        setLoans(loanRes.data.data || []);
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) return <div className="text-gray-500">Loading...</div>;

  const activePrograms = programs.filter((p) => p.status === 'ACTIVE').length;
  const activeLoans = loans.filter((l) => ['DISBURSED', 'REPAYMENT_DUE'].includes(l.status)).length;
  const overdueLoans = loans.filter((l) => l.status === 'OVERDUE').length;

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Programs" value={programs.length} color="indigo" />
        <StatCard title="Active Programs" value={activePrograms} color="green" />
        <StatCard title="Active Loans" value={activeLoans} color="blue" />
        <StatCard title="Overdue Loans" value={overdueLoans} color="red" />
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Recent Programs</h3>
        {programs.length === 0 ? (
          <p className="text-gray-500 text-sm">No programs created yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-gray-500">
                <th className="pb-2">Code</th>
                <th className="pb-2">Name</th>
                <th className="pb-2">Product</th>
                <th className="pb-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {programs.slice(0, 10).map((p) => (
                <tr key={p.id} className="border-b border-gray-100">
                  <td className="py-2 font-mono text-xs">{p.programCode}</td>
                  <td className="py-2">{p.programName}</td>
                  <td className="py-2">{p.productType}</td>
                  <td className="py-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColor(p.status)}`}>
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, color }: { title: string; value: number; color: string }) {
  const colorMap: Record<string, string> = {
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    green: 'bg-green-50 text-green-700 border-green-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    red: 'bg-red-50 text-red-700 border-red-200',
  };
  return (
    <div className={`rounded-xl border p-5 ${colorMap[color]}`}>
      <div className="text-sm font-medium opacity-80">{title}</div>
      <div className="text-3xl font-bold mt-1">{value}</div>
    </div>
  );
}

function statusColor(status: string) {
  switch (status) {
    case 'ACTIVE': return 'bg-green-100 text-green-700';
    case 'DRAFT': return 'bg-gray-100 text-gray-700';
    case 'PAUSED': return 'bg-yellow-100 text-yellow-700';
    case 'CLOSED': return 'bg-red-100 text-red-700';
    default: return 'bg-gray-100 text-gray-700';
  }
}
