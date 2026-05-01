import { useState, useEffect } from 'react';
import { anchorApi, borrowerApi, salaryApi } from '@plp/shared';
import type { Anchor, Borrower, EmployeeSalaryData } from '@plp/shared';

export default function EmployeesPage() {
  const [anchors, setAnchors] = useState<Anchor[]>([]);
  const [selectedAnchor, setSelectedAnchor] = useState('');
  const [employees, setEmployees] = useState<Borrower[]>([]);
  const [salaryData, setSalaryData] = useState<Record<string, EmployeeSalaryData>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    anchorApi.list().then((r) => {
      setAnchors(r.data.data || []);
    }).catch((err) => {
      console.error('Failed to fetch anchors:', err);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedAnchor) return;
    setLoading(true);
    borrowerApi.list({ anchorId: selectedAnchor }).then((r) => {
      const emps: Borrower[] = r.data.data || [];
      setEmployees(emps);
      emps.forEach((emp) => {
        salaryApi.getLatest(emp.id).then((sr) => {
          if (sr.data.data && sr.data.data.id) {
            setSalaryData((prev) => ({ ...prev, [emp.id]: sr.data.data }));
          }
        }).catch(() => {});
      });
    }).catch((err) => {
      console.error('Failed to fetch employees:', err);
    }).finally(() => setLoading(false));
  }, [selectedAnchor]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

  if (loading && anchors.length === 0) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-pulse text-slate-400 text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Employees</h1>
        <p className="text-sm text-slate-500 mt-1">Manage employees and view salary eligibility data</p>
      </div>

      <div className="mb-5">
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Select Anchor</label>
        <select value={selectedAnchor} onChange={(e) => setSelectedAnchor(e.target.value)}
          className="max-w-md px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none">
          <option value="">Select an anchor</option>
          {anchors.map((a) => (
            <option key={a.id} value={a.id}>{a.entityName} ({a.anchorCode})</option>
          ))}
        </select>
      </div>

      {employees.length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Code</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Net Salary</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Accumulated</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Eligible</th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {employees.map((emp) => {
                const sd = salaryData[emp.id];
                return (
                  <tr key={emp.id} className="hover:bg-slate-50/80">
                    <td className="px-5 py-3 font-mono text-xs font-medium text-slate-600">{emp.borrowerCode}</td>
                    <td className="px-5 py-3 font-medium text-slate-800">{emp.name}</td>
                    <td className="px-5 py-3 text-xs text-slate-500">{emp.email}</td>
                    <td className="px-5 py-3 text-right text-slate-700">{sd ? formatCurrency(sd.netSalary) : '—'}</td>
                    <td className="px-5 py-3 text-right text-slate-700">{sd ? formatCurrency(sd.accumulatedSalary) : '—'}</td>
                    <td className="px-5 py-3 text-right font-semibold text-emerald-600">{sd ? formatCurrency(sd.eligibleAmount) : '—'}</td>
                    <td className="px-5 py-3 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold ${
                        emp.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20'
                          : 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20'
                      }`}>{emp.status}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : selectedAnchor ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <div className="text-slate-400 text-sm">No employees found for this anchor</div>
        </div>
      ) : null}
    </div>
  );
}
