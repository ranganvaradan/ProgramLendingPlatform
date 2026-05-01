import { useState, useEffect, useRef } from 'react';
import { anchorApi, programApi, portalApi } from '@plp/shared';
import type { Anchor, Program, Invoice } from '@plp/shared';

const inputCls = 'w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white outline-none';
const labelCls = 'block text-sm font-medium text-slate-700 mb-1.5';

export default function InvoiceUploadPage() {
  const [anchors, setAnchors] = useState<Anchor[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [selectedAnchor, setSelectedAnchor] = useState('');
  const [selectedProgram, setSelectedProgram] = useState('');
  const [uploadResult, setUploadResult] = useState<{ rows: number; error?: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [tab, setTab] = useState<'upload' | 'manual' | 'view'>('upload');
  const fileRef = useRef<HTMLInputElement>(null);

  const [manual, setManual] = useState({
    invoiceNumber: '', borrowerId: '', invoiceDate: '', dueDate: '',
    invoiceAmount: '', taxAmount: '0', poNumber: '', grnNumber: '',
    gstinSeller: '', gstinBuyer: '', paymentTerms: '', description: '',
  });
  const [manualMsg, setManualMsg] = useState('');

  useEffect(() => {
    Promise.all([
      anchorApi.list().then((r) => setAnchors(r.data.data || [])),
      programApi.list().then((r) => setPrograms(r.data.data || [])),
    ]).catch(console.error);
  }, []);

  const filteredPrograms = programs.filter(
    (p) => p.anchorId === selectedAnchor && p.productType === 'INVOICE_DISCOUNTING'
  );

  const handleUpload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file || !selectedAnchor || !selectedProgram) return;
    setUploading(true);
    setUploadResult(null);
    try {
      const res = await portalApi.anchorInvoiceUpload(selectedAnchor, selectedProgram, file);
      setUploadResult({ rows: res.data.data.rowsProcessed });
      loadInvoices();
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
      await portalApi.anchorCreateInvoice({
        invoiceNumber: manual.invoiceNumber,
        borrowerId: manual.borrowerId,
        anchorId: selectedAnchor,
        programId: selectedProgram,
        invoiceDate: manual.invoiceDate,
        dueDate: manual.dueDate,
        invoiceAmount: parseFloat(manual.invoiceAmount),
        taxAmount: parseFloat(manual.taxAmount || '0'),
        netAmount: parseFloat(manual.invoiceAmount) + parseFloat(manual.taxAmount || '0'),
        poNumber: manual.poNumber || null,
        grnNumber: manual.grnNumber || null,
        gstinSeller: manual.gstinSeller || null,
        gstinBuyer: manual.gstinBuyer || null,
        paymentTerms: manual.paymentTerms || null,
        description: manual.description || null,
        source: 'MANUAL',
      });
      setManualMsg('Invoice entry saved successfully');
      setManual({
        invoiceNumber: '', borrowerId: '', invoiceDate: '', dueDate: '',
        invoiceAmount: '', taxAmount: '0', poNumber: '', grnNumber: '',
        gstinSeller: '', gstinBuyer: '', paymentTerms: '', description: '',
      });
      loadInvoices();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Save failed';
      setManualMsg('Error: ' + message);
    }
  };

  const loadInvoices = () => {
    if (!selectedAnchor) return;
    portalApi.anchorInvoices(selectedAnchor, selectedProgram || undefined)
      .then((r) => setInvoices(r.data.data || []))
      .catch(console.error);
  };

  useEffect(() => {
    if (selectedAnchor) loadInvoices();
  }, [selectedAnchor, selectedProgram]);

  const handleVerify = async (id: string) => {
    try { await portalApi.anchorVerifyInvoice(id); loadInvoices(); } catch (err) { console.error(err); }
  };
  const handleConfirm = async (id: string) => {
    try { await portalApi.anchorConfirmInvoice(id); loadInvoices(); } catch (err) { console.error(err); }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Invoice Upload &amp; Management</h1>
        <p className="text-sm text-slate-500 mt-1">Upload invoices, verify, and manage discounting workflow</p>
      </div>

      {/* Context selectors */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Anchor</label>
            <select value={selectedAnchor} onChange={(e) => { setSelectedAnchor(e.target.value); setSelectedProgram(''); }}
              className={inputCls}>
              <option value="">Select anchor</option>
              {anchors.map((a) => <option key={a.id} value={a.id}>{a.entityName}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Program (Invoice Discounting)</label>
            <select value={selectedProgram} onChange={(e) => setSelectedProgram(e.target.value)}
              className={inputCls} disabled={!selectedAnchor}>
              <option value="">Select program</option>
              {filteredPrograms.map((p) => <option key={p.id} value={p.id}>{p.programName}</option>)}
            </select>
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
            {t === 'upload' ? 'CSV Upload' : t === 'manual' ? 'Manual Entry' : 'View Invoices'}
          </button>
        ))}
      </div>

      {/* CSV Upload Tab */}
      {tab === 'upload' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Upload Invoice CSV</h3>
          <p className="text-xs text-slate-500 mb-4">
            Format: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">invoiceNumber, borrowerCode, invoiceDate (yyyy-MM-dd), dueDate, invoiceAmount, taxAmount</code>
          </p>
          <div className="flex items-center gap-4">
            <input type="file" ref={fileRef} accept=".csv" className="text-sm text-slate-600" />
            <button onClick={handleUpload} disabled={uploading || !selectedAnchor || !selectedProgram}
              className="px-5 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 disabled:opacity-50">
              {uploading ? 'Uploading...' : 'Upload CSV'}
            </button>
          </div>
          {uploadResult && (
            <div className={`mt-4 p-4 rounded-lg text-sm flex items-center gap-2 ${
              uploadResult.error ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            }`}>
              {uploadResult.error || `${uploadResult.rows} invoice(s) processed successfully`}
            </div>
          )}
        </div>
      )}

      {/* Manual Entry Tab */}
      {tab === 'manual' && (
        <form onSubmit={handleManualSubmit} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Manual Invoice Entry</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Invoice Number *</label>
              <input type="text" value={manual.invoiceNumber} onChange={(e) => setManual({ ...manual, invoiceNumber: e.target.value })} className={inputCls} required />
            </div>
            <div>
              <label className={labelCls}>Borrower ID (Buyer) *</label>
              <input type="text" value={manual.borrowerId} onChange={(e) => setManual({ ...manual, borrowerId: e.target.value })} className={inputCls} required />
            </div>
            <div>
              <label className={labelCls}>Invoice Date *</label>
              <input type="date" value={manual.invoiceDate} onChange={(e) => setManual({ ...manual, invoiceDate: e.target.value })} className={inputCls} required />
            </div>
            <div>
              <label className={labelCls}>Due Date *</label>
              <input type="date" value={manual.dueDate} onChange={(e) => setManual({ ...manual, dueDate: e.target.value })} className={inputCls} required />
            </div>
            <div>
              <label className={labelCls}>Invoice Amount *</label>
              <input type="number" step="0.01" value={manual.invoiceAmount} onChange={(e) => setManual({ ...manual, invoiceAmount: e.target.value })} className={inputCls} required />
            </div>
            <div>
              <label className={labelCls}>Tax Amount (GST)</label>
              <input type="number" step="0.01" value={manual.taxAmount} onChange={(e) => setManual({ ...manual, taxAmount: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>PO Number</label>
              <input type="text" value={manual.poNumber} onChange={(e) => setManual({ ...manual, poNumber: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>GRN Number</label>
              <input type="text" value={manual.grnNumber} onChange={(e) => setManual({ ...manual, grnNumber: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>GSTIN (Seller)</label>
              <input type="text" value={manual.gstinSeller} onChange={(e) => setManual({ ...manual, gstinSeller: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>GSTIN (Buyer)</label>
              <input type="text" value={manual.gstinBuyer} onChange={(e) => setManual({ ...manual, gstinBuyer: e.target.value })} className={inputCls} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-4">
            <button type="submit" disabled={!selectedProgram}
              className="px-5 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 disabled:opacity-50">
              Save Invoice
            </button>
          </div>
          {manualMsg && (
            <div className={`mt-4 p-4 rounded-lg text-sm ${manualMsg.startsWith('Error') ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
              {manualMsg}
            </div>
          )}
        </form>
      )}

      {/* View Invoices Tab */}
      {tab === 'view' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center">
            <h3 className="text-sm font-semibold text-slate-700">Invoices</h3>
            <span className="text-xs text-slate-400">{invoices.length} records</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Invoice #</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Dates</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Net</th>
                  <th className="px-5 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.length === 0 ? (
                  <tr><td colSpan={6} className="px-5 py-12 text-center text-slate-400 text-sm">No invoices found</td></tr>
                ) : invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/80">
                    <td className="px-5 py-3">
                      <div className="font-mono text-xs font-medium text-slate-700">{inv.invoiceNumber}</div>
                      {inv.poNumber && <div className="text-[11px] text-slate-400 mt-0.5">PO: {inv.poNumber}</div>}
                    </td>
                    <td className="px-5 py-3">
                      <div className="text-xs text-slate-600">{inv.invoiceDate}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">Due: {inv.dueDate}</div>
                    </td>
                    <td className="px-5 py-3 text-right text-slate-700">{formatCurrency(inv.invoiceAmount)}</td>
                    <td className="px-5 py-3 text-right font-medium text-slate-800">{formatCurrency(inv.netAmount)}</td>
                    <td className="px-5 py-3 text-center">
                      <InvoiceBadge status={inv.status} />
                    </td>
                    <td className="px-5 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {inv.status === 'UPLOADED' && (
                          <button onClick={() => handleVerify(inv.id)}
                            className="px-2.5 py-1 text-xs font-semibold text-blue-600 bg-blue-50 rounded hover:bg-blue-100">
                            Verify
                          </button>
                        )}
                        {inv.status === 'VERIFIED' && (
                          <button onClick={() => handleConfirm(inv.id)}
                            className="px-2.5 py-1 text-xs font-semibold text-emerald-600 bg-emerald-50 rounded hover:bg-emerald-100">
                            Confirm
                          </button>
                        )}
                        {!['UPLOADED', 'VERIFIED'].includes(inv.status) && (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function InvoiceBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    UPLOADED: 'bg-slate-50 text-slate-600 ring-1 ring-slate-400/20',
    VERIFIED: 'bg-blue-50 text-blue-700 ring-1 ring-blue-600/20',
    ELIGIBLE: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20',
    PARTIALLY_DISCOUNTED: 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20',
    FULLY_DISCOUNTED: 'bg-purple-50 text-purple-700 ring-1 ring-purple-600/20',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold ${styles[status] || 'bg-slate-50 text-slate-600'}`}>
      {status}
    </span>
  );
}
