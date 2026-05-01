import { useState, useEffect, useRef } from 'react';
import { anchorApi, programApi, salaryApi, portalApi } from '@plp/shared';
import type { Anchor, Program, EmployeeSalaryData } from '@plp/shared';

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

  // Manual entry state
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

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Salary Upload & Management</h2>

      {/* Context selectors */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Anchor</label>
          <select value={selectedAnchor} onChange={(e) => { setSelectedAnchor(e.target.value); setSelectedProgram(''); }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg">
            <option value="">-- Select --</option>
            {anchors.map((a) => <option key={a.id} value={a.id}>{a.entityName}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Program (PDL)</label>
          <select value={selectedProgram} onChange={(e) => setSelectedProgram(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg" disabled={!selectedAnchor}>
            <option value="">-- Select --</option>
            {filteredPrograms.map((p) => <option key={p.id} value={p.id}>{p.programName}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Pay Period</label>
          <input type="month" value={payPeriod} onChange={(e) => setPayPeriod(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b border-gray-200">
        {(['upload', 'manual', 'view'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
              tab === t ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>
            {t === 'upload' ? 'CSV Upload' : t === 'manual' ? 'Manual Entry' : 'View Data'}
          </button>
        ))}
      </div>

      {/* CSV Upload Tab */}
      {tab === 'upload' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold text-gray-700 mb-4">Upload Salary CSV</h3>
          <p className="text-sm text-gray-500 mb-4">
            CSV columns: <code className="bg-gray-100 px-1 rounded">employee_code, borrower_code, gross_salary, net_salary, days_worked, total_working_days, deductions</code>
          </p>
          <div className="flex items-center gap-4">
            <input ref={fileRef} type="file" accept=".csv" className="text-sm" />
            <button onClick={handleUpload} disabled={uploading || !selectedProgram}
              className="px-4 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 disabled:opacity-50">
              {uploading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
          {uploadResult && (
            <div className={`mt-4 p-3 rounded-lg text-sm ${
              uploadResult.error ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
            }`}>
              {uploadResult.error || `Successfully processed ${uploadResult.rows} records.`}
            </div>
          )}
        </div>
      )}

      {/* Manual Entry Tab */}
      {tab === 'manual' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold text-gray-700 mb-4">Manual Salary Entry</h3>
          <form onSubmit={handleManualSubmit} className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Borrower ID</label>
              <input value={manual.borrowerId} onChange={(e) => setManual({...manual, borrowerId: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Employee Code</label>
              <input value={manual.employeeCode} onChange={(e) => setManual({...manual, employeeCode: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gross Salary</label>
              <input type="number" step="0.01" value={manual.grossSalary}
                onChange={(e) => setManual({...manual, grossSalary: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Net Salary</label>
              <input type="number" step="0.01" value={manual.netSalary}
                onChange={(e) => setManual({...manual, netSalary: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Days Worked</label>
              <input type="number" value={manual.daysWorked}
                onChange={(e) => setManual({...manual, daysWorked: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Working Days</label>
              <input type="number" value={manual.totalWorkingDays}
                onChange={(e) => setManual({...manual, totalWorkingDays: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Deductions</label>
              <input type="number" step="0.01" value={manual.deductions}
                onChange={(e) => setManual({...manual, deductions: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            <div className="flex items-end">
              <button type="submit" disabled={!selectedProgram}
                className="px-4 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 disabled:opacity-50">
                Save Entry
              </button>
            </div>
          </form>
          {manualMsg && (
            <div className={`mt-4 p-3 rounded-lg text-sm ${
              manualMsg.startsWith('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
            }`}>{manualMsg}</div>
          )}
        </div>
      )}

      {/* View Data Tab */}
      {tab === 'view' && (
        <div className="bg-white rounded-lg shadow">
          {salaryRecords.length > 0 ? (
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left">Employee</th>
                  <th className="px-3 py-2 text-left">Period</th>
                  <th className="px-3 py-2 text-right">Gross</th>
                  <th className="px-3 py-2 text-right">Net</th>
                  <th className="px-3 py-2 text-center">Days</th>
                  <th className="px-3 py-2 text-right">Accumulated</th>
                  <th className="px-3 py-2 text-right">Eligible</th>
                  <th className="px-3 py-2 text-center">Source</th>
                  <th className="px-3 py-2 text-center">Verified</th>
                </tr>
              </thead>
              <tbody>
                {salaryRecords.map((r) => (
                  <tr key={r.id} className="border-t border-gray-100">
                    <td className="px-3 py-2 font-mono text-xs">{r.employeeCode}</td>
                    <td className="px-3 py-2">{r.payPeriod}</td>
                    <td className="px-3 py-2 text-right">₹{r.grossSalary.toLocaleString('en-IN')}</td>
                    <td className="px-3 py-2 text-right">₹{r.netSalary.toLocaleString('en-IN')}</td>
                    <td className="px-3 py-2 text-center">{r.daysWorked}/{r.totalWorkingDays}</td>
                    <td className="px-3 py-2 text-right">₹{r.accumulatedSalary.toLocaleString('en-IN')}</td>
                    <td className="px-3 py-2 text-right font-medium text-emerald-600">₹{r.eligibleAmount.toLocaleString('en-IN')}</td>
                    <td className="px-3 py-2 text-center">
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        r.source === 'HR_SYSTEM' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                      }`}>{r.source}</span>
                    </td>
                    <td className="px-3 py-2 text-center">{r.verified ? 'Yes' : 'No'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center text-gray-500">
              No salary data for this anchor and period. Use CSV Upload or Manual Entry to add data.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
