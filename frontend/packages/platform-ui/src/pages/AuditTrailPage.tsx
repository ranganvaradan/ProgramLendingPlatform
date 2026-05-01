import { useState, useEffect } from 'react';
import { auditApi } from '@plp/shared';

interface AuditEntry {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  actorId: string;
  actorRole: string;
  oldValues: string;
  newValues: string;
  createdAt: string;
}

const actionStyles: Record<string, string> = {
  REQUESTED: 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20',
  APPROVED: 'bg-blue-50 text-blue-700 ring-1 ring-blue-600/20',
  DISBURSED: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20',
  REJECTED: 'bg-red-50 text-red-600 ring-1 ring-red-500/20',
  REPAYMENT: 'bg-violet-50 text-violet-700 ring-1 ring-violet-600/20',
};

export default function AuditTrailPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const pageSize = 25;

  useEffect(() => {
    setLoading(true);
    auditApi.list(page, pageSize)
      .then((res) => {
        const content = res.data.content || res.data.data || res.data || [];
        setEntries(content);
        setHasMore(content.length >= pageSize);
      })
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Audit Trail</h1>
        <p className="text-sm text-slate-500 mt-1">Complete record of all system actions and state changes</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-pulse text-slate-400 text-sm">Loading audit trail...</div>
          </div>
        ) : entries.length === 0 ? (
          <div className="flex items-center justify-center h-48">
            <div className="text-center">
              <div className="text-slate-400 text-sm">No audit entries</div>
              <p className="text-xs text-slate-400 mt-1">Audit logs will appear as loan operations are performed</p>
            </div>
          </div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Timestamp</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Entity</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Action</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Actor</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Changes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {entries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-50/80">
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="text-xs text-slate-700 font-medium">
                        {new Date(entry.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {new Date(entry.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="text-xs font-medium text-slate-700">{entry.entityType}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{entry.entityId?.substring(0, 8)}...</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold ${
                        actionStyles[entry.action] || 'bg-slate-50 text-slate-600 ring-1 ring-slate-500/20'
                      }`}>
                        {entry.action}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs text-slate-600">{entry.actorRole || '—'}</span>
                    </td>
                    <td className="px-5 py-3.5 max-w-xs">
                      <div className="text-xs text-slate-500 truncate" title={entry.newValues || ''}>
                        {entry.newValues ? (entry.newValues.length > 60 ? entry.newValues.substring(0, 60) + '...' : entry.newValues) : '—'}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
              <span className="text-xs text-slate-500">Page {page + 1}</span>
              <div className="flex gap-2">
                <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-md hover:bg-slate-50 disabled:opacity-40">
                  Previous
                </button>
                <button onClick={() => setPage(page + 1)} disabled={!hasMore}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-md hover:bg-slate-50 disabled:opacity-40">
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
