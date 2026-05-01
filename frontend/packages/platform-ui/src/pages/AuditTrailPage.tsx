import { useState, useEffect, useCallback } from 'react';
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

export default function AuditTrailPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const loadAudit = useCallback(async () => {
    setLoading(true);
    try {
      const res = await auditApi.list(page, 25);
      setEntries(res.data?.data || []);
      setTotal(res.data?.totalElements || 0);
    } catch { setEntries([]); }
    setLoading(false);
  }, [page]);

  useEffect(() => { loadAudit(); }, [loadAudit]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Audit Trail</h1>
      <p className="text-sm text-gray-500 mb-4">Total entries: {total}</p>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading audit trail...</div>
      ) : entries.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No audit entries yet. Events will appear here as loan lifecycle actions occur.</div>
      ) : (
        <div className="bg-white rounded-lg border overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entity</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actor</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Changes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {entries.map(e => (
                <tr key={e.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                    {new Date(e.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className="font-medium text-gray-900">{e.entityType}</span>
                    <span className="text-gray-400 ml-1 text-xs">{e.entityId?.substring(0, 8)}...</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      e.action === 'REQUESTED' ? 'bg-blue-100 text-blue-800' :
                      e.action === 'APPROVED' ? 'bg-green-100 text-green-800' :
                      e.action === 'DISBURSED' ? 'bg-purple-100 text-purple-800' :
                      e.action === 'REJECTED' ? 'bg-red-100 text-red-800' :
                      e.action === 'REPAYMENT' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>{e.action}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {e.actorRole || '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate" title={e.newValues || ''}>
                    {e.newValues || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex justify-between items-center mt-4">
        <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0}
          className="px-3 py-1 text-sm border rounded disabled:opacity-50">Previous</button>
        <span className="text-sm text-gray-500">Page {page + 1}</span>
        <button onClick={() => setPage(page + 1)} disabled={entries.length < 25}
          className="px-3 py-1 text-sm border rounded disabled:opacity-50">Next</button>
      </div>
    </div>
  );
}
