import { useEffect, useState } from 'react';
import { programApi, anchorApi } from '@plp/shared';
import type { Program, Anchor } from '@plp/shared';

const inputCls = 'w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white outline-none';
const labelCls = 'block text-sm font-medium text-slate-700 mb-1.5';

export default function ProgramsPage() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [anchors, setAnchors] = useState<Anchor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    programCode: '', programName: '', productType: 'PAY_DAY_LOAN',
    anchorId: '', lenderId: '00000000-0000-0000-0000-000000000001',
    programLimit: '', anchorLimit: '', maxBorrowerLimit: '',
    defaultInterestRate: '', maxTenureDays: '30',
    maxConcurrentLoans: '1', gracePeriodDays: '3', coolingOffDays: '3',
  });

  useEffect(() => {
    Promise.all([
      programApi.list().then((res) => setPrograms(res.data.data || [])),
      anchorApi.list().then((res) => setAnchors(res.data.data || [])),
    ]).catch(console.error).finally(() => setLoading(false));
  }, []);

  const reload = () => {
    programApi.list().then((res) => setPrograms(res.data.data || [])).catch(console.error);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError('');
    try {
      await programApi.create({
        programCode: form.programCode,
        programName: form.programName,
        productType: form.productType,
        anchorId: form.anchorId,
        lenderId: form.lenderId,
        programLimit: parseFloat(form.programLimit),
        anchorLimit: parseFloat(form.anchorLimit),
        maxBorrowerLimit: parseFloat(form.maxBorrowerLimit),
        defaultInterestRate: parseFloat(form.defaultInterestRate),
        maxTenureDays: parseInt(form.maxTenureDays),
        maxConcurrentLoans: parseInt(form.maxConcurrentLoans),
        gracePeriodDays: parseInt(form.gracePeriodDays),
        coolingOffDays: parseInt(form.coolingOffDays),
        status: 'ACTIVE',
      });
      setShowCreate(false);
      setForm({
        programCode: '', programName: '', productType: 'PAY_DAY_LOAN',
        anchorId: '', lenderId: '00000000-0000-0000-0000-000000000001',
        programLimit: '', anchorLimit: '', maxBorrowerLimit: '',
        defaultInterestRate: '', maxTenureDays: '30',
        maxConcurrentLoans: '1', gracePeriodDays: '3', coolingOffDays: '3',
      });
      reload();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create program';
      setError(msg);
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-slate-400 text-sm">Loading programs...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Programs</h1>
          <p className="text-sm text-slate-500 mt-1">Manage lending programs and configurations</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 shadow-sm">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Create Program
        </button>
      </div>

      {/* Create Program Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800">Create Program</h2>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Program Code *</label>
                  <input value={form.programCode} onChange={(e) => setForm({...form, programCode: e.target.value})}
                    className={inputCls} placeholder="e.g., PDL-ACME-001" required />
                </div>
                <div>
                  <label className={labelCls}>Program Name *</label>
                  <input value={form.programName} onChange={(e) => setForm({...form, programName: e.target.value})}
                    className={inputCls} placeholder="e.g., ACME Pay Day Loan" required />
                </div>
                <div>
                  <label className={labelCls}>Product Type *</label>
                  <select value={form.productType} onChange={(e) => setForm({...form, productType: e.target.value})}
                    className={inputCls}>
                    <option value="PAY_DAY_LOAN">Pay Day Loan</option>
                    <option value="INVOICE_DISCOUNTING">Invoice Discounting</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Anchor *</label>
                  <select value={form.anchorId} onChange={(e) => setForm({...form, anchorId: e.target.value})}
                    className={inputCls} required>
                    <option value="">Select anchor</option>
                    {anchors.map((a) => <option key={a.id} value={a.id}>{a.entityName}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Program Limit (INR) *</label>
                  <input type="number" step="0.01" value={form.programLimit}
                    onChange={(e) => setForm({...form, programLimit: e.target.value})}
                    className={inputCls} placeholder="e.g., 10000000" required />
                </div>
                <div>
                  <label className={labelCls}>Anchor Limit (INR) *</label>
                  <input type="number" step="0.01" value={form.anchorLimit}
                    onChange={(e) => setForm({...form, anchorLimit: e.target.value})}
                    className={inputCls} placeholder="e.g., 5000000" required />
                </div>
                <div>
                  <label className={labelCls}>Max Borrower Limit (INR) *</label>
                  <input type="number" step="0.01" value={form.maxBorrowerLimit}
                    onChange={(e) => setForm({...form, maxBorrowerLimit: e.target.value})}
                    className={inputCls} placeholder="e.g., 100000" required />
                </div>
                <div>
                  <label className={labelCls}>Interest Rate (% p.a.) *</label>
                  <input type="number" step="0.01" value={form.defaultInterestRate}
                    onChange={(e) => setForm({...form, defaultInterestRate: e.target.value})}
                    className={inputCls} placeholder="e.g., 18" required />
                </div>
                <div>
                  <label className={labelCls}>Max Tenure (days)</label>
                  <input type="number" value={form.maxTenureDays}
                    onChange={(e) => setForm({...form, maxTenureDays: e.target.value})}
                    className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Max Concurrent Loans</label>
                  <input type="number" value={form.maxConcurrentLoans}
                    onChange={(e) => setForm({...form, maxConcurrentLoans: e.target.value})}
                    className={inputCls} />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setShowCreate(false)}
                  className="px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50">
                  Cancel
                </button>
                <button type="submit" disabled={creating}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  {creating ? 'Creating...' : 'Create Program'}
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
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Program</th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Product Type</th>
              <th className="px-5 py-3.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Program Limit</th>
              <th className="px-5 py-3.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Interest Rate</th>
              <th className="px-5 py-3.5 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {programs.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50/80">
                <td className="px-5 py-4">
                  <div className="font-medium text-slate-800">{p.programName}</div>
                  <div className="text-xs text-slate-400 font-mono mt-0.5">{p.programCode}</div>
                </td>
                <td className="px-5 py-4">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${
                    p.productType === 'PAY_DAY_LOAN'
                      ? 'bg-blue-50 text-blue-700'
                      : 'bg-purple-50 text-purple-700'
                  }`}>
                    {p.productType === 'PAY_DAY_LOAN' ? 'Pay Day Loan' : 'Invoice Discounting'}
                  </span>
                </td>
                <td className="px-5 py-4 text-right font-medium text-slate-700">
                  {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(p.programLimit)}
                </td>
                <td className="px-5 py-4 text-right text-slate-600">{p.defaultInterestRate}% p.a.</td>
                <td className="px-5 py-4 text-center">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold ${
                    p.status === 'ACTIVE'
                      ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20'
                      : 'bg-slate-50 text-slate-600 ring-1 ring-slate-500/20'
                  }`}>{p.status}</span>
                </td>
              </tr>
            ))}
            {programs.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center">
                  <div className="text-slate-400 text-sm">No programs created yet</div>
                  <p className="text-xs text-slate-400 mt-1">Click "Create Program" to get started</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
