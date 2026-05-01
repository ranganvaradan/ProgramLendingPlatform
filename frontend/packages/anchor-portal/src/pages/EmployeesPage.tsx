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
        }).catch(() => { /* no salary data yet */ });
      });
    }).catch((err) => {
      console.error('Failed to fetch employees:', err);
    }).finally(() => setLoading(false));
  }, [selectedAnchor]);

  if (loading && anchors.length === 0) return <div className="text-gray-500">Loading...</div>;

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Employees</h2>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Select Anchor</label>
        <select
          value={selectedAnchor}
          onChange={(e) => setSelectedAnchor(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
        >
          <option value="">-- Select --</option>
          {anchors.map((a) => (
            <option key={a.id} value={a.id}>{a.entityName} ({a.anchorCode})</option>
          ))}
        </select>
      </div>

      {employees.length > 0 ? (
        <div className="bg-white rounded-lg shadow">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left">Code</th>
                <th className="px-4 py-2 text-left">Name</th>
                <th className="px-4 py-2 text-left">Email</th>
                <th className="px-4 py-2 text-right">Net Salary</th>
                <th className="px-4 py-2 text-right">Accumulated</th>
                <th className="px-4 py-2 text-right">Eligible</th>
                <th className="px-4 py-2 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => {
                const sd = salaryData[emp.id];
                return (
                  <tr key={emp.id} className="border-t border-gray-100">
                    <td className="px-4 py-2 font-mono text-xs">{emp.borrowerCode}</td>
                    <td className="px-4 py-2">{emp.name}</td>
                    <td className="px-4 py-2 text-gray-500">{emp.email}</td>
                    <td className="px-4 py-2 text-right">{sd ? `₹${sd.netSalary.toLocaleString('en-IN')}` : '—'}</td>
                    <td className="px-4 py-2 text-right">{sd ? `₹${sd.accumulatedSalary.toLocaleString('en-IN')}` : '—'}</td>
                    <td className="px-4 py-2 text-right font-medium text-emerald-600">
                      {sd ? `₹${sd.eligibleAmount.toLocaleString('en-IN')}` : '—'}
                    </td>
                    <td className="px-4 py-2 text-center">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        emp.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>{emp.status}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : selectedAnchor ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          No employees found for this anchor.
        </div>
      ) : null}
    </div>
  );
}
