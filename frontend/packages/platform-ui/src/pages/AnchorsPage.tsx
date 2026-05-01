import { useEffect, useState } from 'react';
import { anchorApi } from '@plp/shared';
import type { Anchor } from '@plp/shared';

const inputCls = 'w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white outline-none';
const labelCls = 'block text-sm font-medium text-slate-700 mb-1.5';

export default function AnchorsPage() {
  const [anchors, setAnchors] = useState<Anchor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    anchorCode: '', entityName: '', entityType: 'CORPORATE',
    gstin: '', pan: '', contactPersonName: '', contactEmail: '', contactPhone: '',
  });

  useEffect(() => {
    anchorApi.list().then((res) => setAnchors(res.data.data || []))
      .catch(console.error).finally(() => setLoading(false));
  }, []);

  const reload = () => {
    anchorApi.list().then((res) => setAnchors(res.data.data || [])).catch(console.error);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError('');
    try {
      await anchorApi.create({
        anchorCode: form.anchorCode,
        entityName: form.entityName,
        entityType: form.entityType,
        gstin: form.gstin || null,
        pan: form.pan || null,
        contactPersonName: form.contactPersonName || null,
        contactEmail: form.contactEmail || null,
        contactPhone: form.contactPhone || null,
        status: 'ACTIVE',
      });
      setShowCreate(false);
      setForm({ anchorCode: '', entityName: '', entityType: 'CORPORATE', gstin: '', pan: '', contactPersonName: '', contactEmail: '', contactPhone: '' });
      reload();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to register anchor';
      setError(msg);
    } finally {
      setCreating(false);
    }
  };

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
        <button onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 shadow-sm">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Register Anchor
        </button>
      </div>

      {/* Create Anchor Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800">Register Anchor</h2>
              <button onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6">
              {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">{error}</div>
              )}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Anchor Code *</label>
                    <input value={form.anchorCode} onChange={(e) => setForm({...form, anchorCode: e.target.value})}
                      className={inputCls} placeholder="e.g., ACME-001" required />
                  </div>
                  <div>
                    <label className={labelCls}>Entity Type *</label>
                    <select value={form.entityType} onChange={(e) => setForm({...form, entityType: e.target.value})}
                      className={inputCls}>
                      <option value="CORPORATE">Corporate</option>
                      <option value="PARTNERSHIP">Partnership</option>
                      <option value="PROPRIETORSHIP">Proprietorship</option>
                      <option value="LLP">LLP</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Entity Name *</label>
                  <input value={form.entityName} onChange={(e) => setForm({...form, entityName: e.target.value})}
                    className={inputCls} placeholder="e.g., ACME Corp Pvt Ltd" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>GSTIN</label>
                    <input value={form.gstin} onChange={(e) => setForm({...form, gstin: e.target.value})}
                      className={inputCls} placeholder="15-digit GSTIN" />
                  </div>
                  <div>
                    <label className={labelCls}>PAN</label>
                    <input value={form.pan} onChange={(e) => setForm({...form, pan: e.target.value})}
                      className={inputCls} placeholder="10-char PAN" />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Contact Person</label>
                  <input value={form.contactPersonName} onChange={(e) => setForm({...form, contactPersonName: e.target.value})}
                    className={inputCls} placeholder="Full name" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Email</label>
                    <input type="email" value={form.contactEmail} onChange={(e) => setForm({...form, contactEmail: e.target.value})}
                      className={inputCls} placeholder="email@company.com" />
                  </div>
                  <div>
                    <label className={labelCls}>Phone</label>
                    <input value={form.contactPhone} onChange={(e) => setForm({...form, contactPhone: e.target.value})}
                      className={inputCls} placeholder="+91 XXXXX XXXXX" />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setShowCreate(false)}
                  className="px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50">
                  Cancel
                </button>
                <button type="submit" disabled={creating}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  {creating ? 'Registering...' : 'Register Anchor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Entity</th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">GSTIN</th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Contact</th>
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
                <td className="px-5 py-4 text-xs text-slate-600">—</td>
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
                <td colSpan={5} className="px-5 py-12 text-center">
                  <div className="text-slate-400 text-sm">No anchors registered</div>
                  <p className="text-xs text-slate-400 mt-1">Click "Register Anchor" to begin lending operations</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
