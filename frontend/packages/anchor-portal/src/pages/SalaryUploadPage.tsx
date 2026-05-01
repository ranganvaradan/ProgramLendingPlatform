import { useState, useEffect, useRef } from 'react';
import { anchorApi, programApi, salaryApi, portalApi } from '@plp/shared';
import type { Anchor, Program, EmployeeSalaryData } from '@plp/shared';

const inputCls = 'w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white outline-none';
const labelCls = 'block text-sm font-medium text-slate-700 mb-1.5';

export default function SalaryUploadPage() {
  const [anchors, setAnchors] = useState<Anchor[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [selectedAnchor, setSelectedAnchor] = useState('');
  const [selectedProgram, setSelectedProgram] = useState('');
  const [payPeriod, setPayPeriod] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [uploadResult, setUploadResult] = useState<{ rows: number; error?: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [salaryRecords, setSalaryRecords] = useState<EmployeeSalaryData[]>([]);
  const [tab, setTab] = useState<'upload' | 'manual' | 'view'>('upload');
  const fileRef = useRef<HTMLInputElement>(null);

  const [manual, setManual] = useState({
    borrowerId: '', employeeCode: '', grossSalary: '', netSalary: '',
    daysWorked: '0', totalWorkingDays: '30', deductions: '0',
  });
  const [manualMsg, setManualMsg] = useState('');

  useEffect(() => {
    Promise.all([
      anchorApi.list().then((r) => setAnchors(r.data.data || [])),
      programApi.list().then((r) => setPrograms(r.data.data || [])),
    ]).catch(console.error);
  }, []);

  const filteredPrograms = programs.filter(
    (p) => p.anchorId === selectedAnchor && p.productType === 'PAY_DAY_LOAN'
  );

  const handleUpload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file || !selectedAnchor || !selectedProgram || !payPeriod) return;
    setUploading(true);
    setUploadResult(null);
    try {
      const res = await portalApi.anchorSalaryUpload(selectedAnchor, selectedProgram, payPeriod, file);
      setUploadResult({ rows: res.data.data.rowsProcessed });
      loadSalaryData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      setUploadResult({ rows: 0, error: message });
    } finally {
      setUploading(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setManualMsg('');
    try {
      await salaryApi.create({
        borrowerId: manual.borrowerId,
        anchorId: selectedAnchor,
        programId: selectedProgram,
        employeeCode: manual.employeeCode,
        payPeriod,
        grossSalary: parseFloat(manual.grossSalary),
        netSalary: parseFloat(manual.netSalary),
        daysWorked: parseInt(manual.daysWorked),
        totalWorkingDays: parseInt(manual.totalWorkingDays),
        deductions: parseFloat(manual.deductions || '0'),
        source: 'MANUAL',
      });
      setManualMsg('Salary entry saved successfully');
      setManual({ borrowerId: '', employeeCode: '', grossSalary: '', netSalary: '', daysWorked: '0', totalWorkingDays: '30', deductions: '0' });
      loadSalaryData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Save failed';
      setManualMsg('Error: ' + message);
    }
  };

  const loadSalaryData = () => {
    if (!selectedAnchor || !payPeriod) return;
    portalApi.anchorSalary(selectedAnchor, payPeriod)
      .then((r) => setSalaryRecords(r.data.data || []))
      .catch(console.error);
  };

  useEffect(() => {
    if (selectedAnchor && payPeriod) loadSalaryData();
  }, [selectedAnchor, payPeriod]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Salary Upload &amp; Management</h1>
        <p className="text-sm text-slate-500 mt-1">Upload or manually enter employee salary data</p>
      </div>

      {/* Context selectors */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={labelCls}>Anchor</label>
            <select value={selectedAnchor} onChange={(e) => { setSelectedAnchor(e.target.value); setSelectedProgram(''); }}
              className={inputCls}>
              <option value="">Select anchor</option>
              {anchors.map((a) => <option key={a.id} value={a.id}>{a.entityName}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Program (PDL)</label>
            <select value={selectedProgram} onChange={(e) => setSelectedProgram(e.target.value)}
              className={inputCls} disabled={!selectedAnchor}>
              <option value="">Select program</option>
              {filteredPrograms.map((p) => <option key={p.id} value={p.id}>{p.programName}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Pay Period</label>
            <input type="month" value={payPeriod} onChange={(e) => setPayPeriod(e.target.value)} className={inputCls} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 border-b border-slate-200">
        {(['upload', 'manual', 'view'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px ${
              tab === t ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}>
            {t === 'upload' ? 'CSV Upload' : t === 'manual' ? 'Manual Entry' : 'View Data'}
          </button>
        ))}
      </div>

      {/* CSV Upload Tab */}
      {tab === 'upload' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Upload Salary CSV</h3>
          <p className="text-xs text-slate-500 mb-4">
            Columns: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">employee_code, borrower_code, gross_salary, net_salary, days_worked, total_working_days, deductions</code>
          </p>
          <div className="flex items-center gap-4">
            <input ref={fileRef} type="file" accept=".csv" className="text-sm text-slate-600" />
            <button onClick={handleUpload} disabled={uploading || !selectedProgram}
              className="px-5 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 disabled:opacity-50">
              {uploading ? 'Uploading...' : 'Upload CSV'}
            </button>
          </div>
          {uploadResult && (
            <div className={`mt-4 p-4 rounded-lg text-sm flex items-center gap-2 ${
              uploadResult.error ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            }`}>
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                {uploadResult.error
                  ? <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  : <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                }
              </svg>
              {uploadResult.error || `Successfully processed ${uploadResult.rows} records`}
            </div>
          )}
        </div>
      )}

      {/* Manual Entry Tab */}
      {tab === 'manual' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Manual Salary Entry</h3>
          <form onSubmit={handleManualSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Borrower ID</label>
              <input value={manual.borrowerId} onChange={(e) => setManual({...manual, borrowerId: e.target.value})} className={inputCls} required />
            </div>
            <div>
              <label className={labelCls}>Employee Code</label>
              <input value={manual.employeeCode} onChange={(e) => setManual({...manual, employeeCode: e.target.value})} className={inputCls} required />
            </div>
            <div>
              <label className={labelCls}>Gross Salary</label>
              <input type="number" step="0.01" value={manual.grossSalary} onChange={(e) => setManual({...manual, grossSalary: e.target.value})} className={inputCls} required />
            </div>
            <div>
              <label className={labelCls}>Net Salary</label>
              <input type="number" step="0.01" value={manual.netSalary} onChange={(e) => setManual({...manual, netSalary: e.target.value})} className={inputCls} required />
            </div>
            <div>
              <label className={labelCls}>Days Worked</label>
              <input type="number" value={manual.daysWorked} onChange={(e) => setManual({...manual, daysWorked: e.target.value})} className={inputCls} required />
            </div>
            <div>
              <label className={labelCls}>Total Working Days</label>
              <input type="number" value={manual.totalWorkingDays} onChange={(e) => setManual({...manual, totalWorkingDays: e.target.value})} className={inputCls} required />
            </div>
            <div>
              <label className={labelCls}>Deductions</label>
              <input type="number" step="0.01" value={manual.deductions} onChange={(e) => setManual({...manual, deductions: e.target.value})} className={inputCls} />
            </div>
            <div className="flex items-end">
              <button type="submit" disabled={!selectedProgram}
                className="px-5 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 disabled:opacity-50">
                Save Entry
              </button>
            </div>
          </form>
          {manualMsg && (
            <div className={`mt-4 p-4 rounded-lg text-sm ${manualMsg.startsWith('Error') ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
              {manualMsg}
            </div>
          )}
        </div>
      )}

      {/* View Data Tab */}
      {tab === 'view' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center">
            <h3 className="text-sm font-semibold text-slate-700">
              Salary Records — {payPeriod}
            </h3>
            <span className="text-xs text-slate-400">{salaryRecords.length} records</span>
          </div>
          {salaryRecords.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Employee</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Gross</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Net</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Accumulated</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Eligible</th>
                  <th className="px-5 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Days</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {salaryRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80">
                    <td className="px-5 py-3">
                      <div className="font-mono text-xs text-slate-600">{r.employeeCode}</div>
                    </td>
                    <td className="px-5 py-3 text-right text-slate-700">{formatCurrency(r.grossSalary)}</td>
                    <td className="px-5 py-3 text-right text-slate-700">{formatCurrency(r.netSalary)}</td>
                    <td className="px-5 py-3 text-right text-slate-700">{formatCurrency(r.accumulatedSalary)}</td>
                    <td className="px-5 py-3 text-right font-semibold text-emerald-600">{formatCurrency(r.eligibleAmount)}</td>
                    <td className="px-5 py-3 text-center text-slate-600">{r.daysWorked}/{r.totalWorkingDays}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="px-5 py-12 text-center text-slate-400 text-sm">No salary records for this period</div>
          )}
        </div>
      )}
    </div>
  );
}
