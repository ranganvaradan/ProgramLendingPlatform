import { useState, useEffect } from 'react';
import { anchorApi, programApi } from '@plp/shared';
import type { Anchor, Program } from '@plp/shared';

export default function DashboardPage() {
  const [anchors, setAnchors] = useState<Anchor[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      anchorApi.list().then((r) => setAnchors(r.data.data || [])),
      programApi.list().then((r) => setPrograms(r.data.data || [])),
    ]).catch((err) => {
      console.error('Failed to load dashboard data:', err);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-gray-500">Loading dashboard...</div>;

  const pdlPrograms = programs.filter((p) => p.productType === 'PAY_DAY_LOAN');

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Anchor Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-5">
          <div className="text-3xl font-bold text-emerald-600">{anchors.length}</div>
          <div className="text-sm text-gray-500 mt-1">Registered Anchors</div>
        </div>
        <div className="bg-white rounded-lg shadow p-5">
          <div className="text-3xl font-bold text-blue-600">{pdlPrograms.length}</div>
          <div className="text-sm text-gray-500 mt-1">Pay Day Loan Programs</div>
        </div>
        <div className="bg-white rounded-lg shadow p-5">
          <div className="text-3xl font-bold text-purple-600">{programs.length}</div>
          <div className="text-sm text-gray-500 mt-1">Total Programs</div>
        </div>
      </div>

      {pdlPrograms.length > 0 ? (
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-700">Pay Day Loan Programs</h3>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left">Program</th>
                <th className="px-4 py-2 text-left">Code</th>
                <th className="px-4 py-2 text-right">Limit</th>
                <th className="px-4 py-2 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {pdlPrograms.map((p) => (
                <tr key={p.id} className="border-t border-gray-100">
                  <td className="px-4 py-2">{p.programName}</td>
                  <td className="px-4 py-2 font-mono text-xs">{p.programCode}</td>
                  <td className="px-4 py-2 text-right">{p.programLimit?.toLocaleString('en-IN')}</td>
                  <td className="px-4 py-2 text-center">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      p.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>{p.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          No Pay Day Loan programs found. Programs are created from the Platform Admin portal.
        </div>
      )}
    </div>
  );
}
