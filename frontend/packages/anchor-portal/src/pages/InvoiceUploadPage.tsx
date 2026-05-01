import { useState, useEffect, useRef } from 'react';
import { anchorApi, programApi, portalApi } from '@plp/shared';
import type { Anchor, Program, Invoice } from '@plp/shared';

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
    try {
      await portalApi.anchorVerifyInvoice(id);
      loadInvoices();
    } catch (err) {
      console.error(err);
    }
  };

  const handleConfirm = async (id: string) => {
    try {
      await portalApi.anchorConfirmInvoice(id);
      loadInvoices();
    } catch (err) {
      console.error(err);
    }
  };

  const statusColor = (s: string) => {
    switch (s) {
      case 'UPLOADED': return 'bg-gray-100 text-gray-700';
      case 'VERIFIED': return 'bg-blue-100 text-blue-700';
      case 'ELIGIBLE': return 'bg-green-100 text-green-700';
      case 'PARTIALLY_DISCOUNTED': return 'bg-yellow-100 text-yellow-700';
      case 'FULLY_DISCOUNTED': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Invoice Upload & Management</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Anchor</label>
          <select value={selectedAnchor} onChange={(e) => { setSelectedAnchor(e.target.value); setSelectedProgram(''); }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg">
            <option value="">-- Select --</option>
            {anchors.map((a) => <option key={a.id} value={a.id}>{a.entityName}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Program (Invoice Discounting)</label>
          <select value={selectedProgram} onChange={(e) => setSelectedProgram(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg" disabled={!selectedAnchor}>
            <option value="">-- Select --</option>
            {filteredPrograms.map((p) => <option key={p.id} value={p.id}>{p.programName}</option>)}
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {(['upload', 'manual', 'view'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === t ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
            {t === 'upload' ? 'CSV Upload' : t === 'manual' ? 'Manual Entry' : 'View Invoices'}
          </button>
        ))}
      </div>

      {/* CSV Upload Tab */}
      {tab === 'upload' && (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="font-medium mb-4">Upload Invoice CSV</h3>
          <p className="text-sm text-gray-600 mb-4">
            CSV format: <code>invoiceNumber,borrowerCode,invoiceDate(yyyy-MM-dd),dueDate(yyyy-MM-dd),invoiceAmount,taxAmount</code>
          </p>
          <div className="flex items-center gap-4">
            <input type="file" ref={fileRef} accept=".csv" className="text-sm" />
            <button onClick={handleUpload} disabled={uploading || !selectedAnchor || !selectedProgram}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 disabled:opacity-50">
              {uploading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
          {uploadResult && (
            <div className={`mt-4 p-3 rounded-lg text-sm ${uploadResult.error ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
              {uploadResult.error || `${uploadResult.rows} invoice(s) processed successfully`}
            </div>
          )}
        </div>
      )}

      {/* Manual Entry Tab */}
      {tab === 'manual' && (
        <form onSubmit={handleManualSubmit} className="bg-white p-6 rounded-lg shadow-sm border space-y-4">
          <h3 className="font-medium mb-2">Manual Invoice Entry</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Number*</label>
              <input type="text" value={manual.invoiceNumber}
                onChange={(e) => setManual({ ...manual, invoiceNumber: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Borrower ID (Buyer)*</label>
              <input type="text" value={manual.borrowerId}
                onChange={(e) => setManual({ ...manual, borrowerId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Date*</label>
              <input type="date" value={manual.invoiceDate}
                onChange={(e) => setManual({ ...manual, invoiceDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Due Date*</label>
              <input type="date" value={manual.dueDate}
                onChange={(e) => setManual({ ...manual, dueDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Amount*</label>
              <input type="number" step="0.01" value={manual.invoiceAmount}
                onChange={(e) => setManual({ ...manual, invoiceAmount: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tax Amount (GST)</label>
              <input type="number" step="0.01" value={manual.taxAmount}
                onChange={(e) => setManual({ ...manual, taxAmount: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">PO Number</label>
              <input type="text" value={manual.poNumber}
                onChange={(e) => setManual({ ...manual, poNumber: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">GRN Number</label>
              <input type="text" value={manual.grnNumber}
                onChange={(e) => setManual({ ...manual, grnNumber: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Seller GSTIN</label>
              <input type="text" value={manual.gstinSeller}
                onChange={(e) => setManual({ ...manual, gstinSeller: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Buyer GSTIN</label>
              <input type="text" value={manual.gstinBuyer}
                onChange={(e) => setManual({ ...manual, gstinBuyer: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Terms</label>
              <input type="text" value={manual.paymentTerms}
                onChange={(e) => setManual({ ...manual, paymentTerms: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="e.g., Net 30" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input type="text" value={manual.description}
                onChange={(e) => setManual({ ...manual, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button type="submit" disabled={!selectedAnchor || !selectedProgram}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 disabled:opacity-50">
              Save Invoice
            </button>
            {manualMsg && <span className={`text-sm ${manualMsg.startsWith('Error') ? 'text-red-600' : 'text-green-600'}`}>{manualMsg}</span>}
          </div>
        </form>
      )}

      {/* View Invoices Tab */}
      {tab === 'view' && (
        <div className="bg-white rounded-lg shadow-sm border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-3 py-2 text-left">Invoice #</th>
                <th className="px-3 py-2 text-left">Date</th>
                <th className="px-3 py-2 text-left">Due Date</th>
                <th className="px-3 py-2 text-right">Amount</th>
                <th className="px-3 py-2 text-right">Tax</th>
                <th className="px-3 py-2 text-right">Net</th>
                <th className="px-3 py-2 text-right">Eligible</th>
                <th className="px-3 py-2 text-right">Available</th>
                <th className="px-3 py-2 text-center">Status</th>
                <th className="px-3 py-2 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.length === 0 ? (
                <tr><td colSpan={10} className="px-3 py-8 text-center text-gray-400">No invoices found</td></tr>
              ) : invoices.map((inv) => (
                <tr key={inv.id} className="border-b hover:bg-gray-50">
                  <td className="px-3 py-2 font-medium">{inv.invoiceNumber}</td>
                  <td className="px-3 py-2">{inv.invoiceDate}</td>
                  <td className="px-3 py-2">{inv.dueDate}</td>
                  <td className="px-3 py-2 text-right">{inv.invoiceAmount?.toLocaleString()}</td>
                  <td className="px-3 py-2 text-right">{inv.taxAmount?.toLocaleString()}</td>
                  <td className="px-3 py-2 text-right">{inv.netAmount?.toLocaleString()}</td>
                  <td className="px-3 py-2 text-right">{inv.eligibleAmount?.toLocaleString()}</td>
                  <td className="px-3 py-2 text-right">{inv.availableAmount?.toLocaleString()}</td>
                  <td className="px-3 py-2 text-center">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColor(inv.status)}`}>{inv.status}</span>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <div className="flex gap-1 justify-center">
                      {inv.status === 'UPLOADED' && !inv.verified && (
                        <button onClick={() => handleVerify(inv.id)}
                          className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700">Verify</button>
                      )}
                      {inv.verified && !inv.anchorConfirmed && (
                        <button onClick={() => handleConfirm(inv.id)}
                          className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700">Confirm</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
