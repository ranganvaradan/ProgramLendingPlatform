import { useState } from 'react';
import { reportApi } from '@plp/shared';

type ReportType = 'disbursement' | 'portfolio' | 'overdue';

export default function ReportsPage() {
  const [downloading, setDownloading] = useState(false);

  async function download(type: ReportType) {
    setDownloading(true);
    try {
      let res;
      if (type === 'disbursement') res = await reportApi.exportDisbursement();
      else if (type === 'portfolio') res = await reportApi.exportPortfolio();
      else res = await reportApi.exportOverdue();
      const blob = new Blob([res.data], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}_report.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) { console.error('Download failed', e); }
    setDownloading(false);
  }

  const reports = [
    { type: 'disbursement' as ReportType, label: 'Disbursement Summary', desc: 'Daily disbursement totals by product type' },
    { type: 'portfolio' as ReportType, label: 'Portfolio Summary', desc: 'Program-wise portfolio health with NPA metrics' },
    { type: 'overdue' as ReportType, label: 'Overdue / DPD Report', desc: 'Overdue loans with DPD aging buckets' },
  ];

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-4">Reports</h1>
      <p className="text-sm text-gray-500 mb-6">Download reports in CSV format for your program.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {reports.map(r => (
          <div key={r.type} className="bg-white rounded-lg border p-5">
            <h3 className="font-semibold text-gray-900 mb-1">{r.label}</h3>
            <p className="text-sm text-gray-500 mb-4">{r.desc}</p>
            <button onClick={() => download(r.type)} disabled={downloading}
              className="w-full py-2 bg-emerald-600 text-white rounded text-sm hover:bg-emerald-700 disabled:opacity-50">
              {downloading ? 'Downloading...' : 'Download CSV'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
