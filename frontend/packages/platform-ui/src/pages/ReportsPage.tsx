import { useState, useEffect } from 'react';
import { reportApi } from '@plp/shared';

type Tab = 'disbursement' | 'portfolio' | 'overdue';

export default function ReportsPage() {
  const [tab, setTab] = useState<Tab>('disbursement');
  const [data, setData] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadReport(); }, [tab]);

  async function loadReport() {
    setLoading(true);
    try {
      let res;
      if (tab === 'disbursement') res = await reportApi.disbursementSummary();
      else if (tab === 'portfolio') res = await reportApi.portfolioSummary();
      else res = await reportApi.overdueReport();
      setData(res.data?.data || []);
    } catch { setData([]); }
    setLoading(false);
  }

  async function handleExport() {
    try {
      let res;
      if (tab === 'disbursement') res = await reportApi.exportDisbursement();
      else if (tab === 'portfolio') res = await reportApi.exportPortfolio();
      else res = await reportApi.exportOverdue();
      const blob = new Blob([res.data], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${tab}_report.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) { console.error('Export failed', e); }
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'disbursement', label: 'Disbursement Summary' },
    { key: 'portfolio', label: 'Portfolio Summary' },
    { key: 'overdue', label: 'Overdue / DPD' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <button onClick={handleExport} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">
          Export CSV
        </button>
      </div>

      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              tab === t.key ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}>{t.label}</button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading report...</div>
      ) : data.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No data available for this report.</div>
      ) : (
        <div className="bg-white rounded-lg border overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {Object.keys(data[0]).map(key => (
                  <th key={key} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.map((row, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  {Object.values(row).map((val, j) => (
                    <td key={j} className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                      {typeof val === 'number' ? val.toLocaleString('en-IN') : String(val ?? '')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
