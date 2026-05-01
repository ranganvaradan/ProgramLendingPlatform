import { useEffect, useState } from 'react';
import { anchorApi } from '@plp/shared';
import type { Anchor } from '@plp/shared';

export default function AnchorsPage() {
  const [anchors, setAnchors] = useState<Anchor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    anchorApi.list().then((res) => {
      setAnchors(res.data.data || []);
    }).catch((err) => {
      console.error('Failed to fetch anchors:', err);
    }).finally(() => {
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-slate-400 text-sm">Loading anchors...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Anchors</h1>
          <p className="text-sm text-slate-500 mt-1">Manage registered anchor entities</p>
        </div>
        <button className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 shadow-sm">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Register Anchor
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Entity</th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">GSTIN</th>
              <th className="px-5 py-3.5 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {anchors.map((a) => (
              <tr key={a.id} className="hover:bg-slate-50/80">
                <td className="px-5 py-4">
                  <div className="font-medium text-slate-800">{a.entityName}</div>
                  <div className="text-xs text-slate-400 font-mono mt-0.5">{a.anchorCode}</div>
                </td>
                <td className="px-5 py-4">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700">
                    {a.entityType}
                  </span>
                </td>
                <td className="px-5 py-4 font-mono text-xs text-slate-600">{a.gstin || '—'}</td>
                <td className="px-5 py-4 text-center">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold ${
                    a.status === 'ACTIVE'
                      ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20'
                      : 'bg-slate-50 text-slate-600 ring-1 ring-slate-500/20'
                  }`}>{a.status}</span>
                </td>
              </tr>
            ))}
            {anchors.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-12 text-center">
                  <div className="text-slate-400 text-sm">No anchors registered</div>
                  <p className="text-xs text-slate-400 mt-1">Register your first anchor to begin lending operations</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
