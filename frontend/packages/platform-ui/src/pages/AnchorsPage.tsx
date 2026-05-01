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

  if (loading) return <div className="text-gray-500">Loading anchors...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Anchors</h2>
        <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700">
          + Register Anchor
        </button>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr className="text-left text-gray-500 border-b">
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Entity Name</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">GSTIN</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {anchors.map((a) => (
              <tr key={a.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs">{a.anchorCode}</td>
                <td className="px-4 py-3 font-medium">{a.entityName}</td>
                <td className="px-4 py-3">{a.entityType}</td>
                <td className="px-4 py-3 font-mono text-xs">{a.gstin || '-'}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    a.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                  }`}>{a.status}</span>
                </td>
              </tr>
            ))}
            {anchors.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No anchors registered</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
