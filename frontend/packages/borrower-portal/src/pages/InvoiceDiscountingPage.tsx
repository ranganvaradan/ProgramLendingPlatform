import { useState, useEffect } from 'react';
import { portalApi, programApi, apiClient } from '@plp/shared';
import type { Invoice, Program } from '@plp/shared';

export default function InvoiceDiscountingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [borrowerId, setBorrowerId] = useState('');
  const [selectedProgram, setSelectedProgram] = useState('');
  const [loading, setLoading] = useState(false);

  // Eligibility check state
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [requestedAmount, setRequestedAmount] = useState('');
  const [eligibilityResult, setEligibilityResult] = useState<Record<string, unknown> | null>(null);
  const [requestMsg, setRequestMsg] = useState('');
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    programApi.list()
      .then((r) => setPrograms((r.data.data || []).filter((p: Program) => p.productType === 'INVOICE_DISCOUNTING')))
      .catch(console.error);
  }, []);

  const loadInvoices = async () => {
    if (!borrowerId) return;
    setLoading(true);
    try {
      const [, invoiceRes] = await Promise.all([
        portalApi.borrowerLoans(borrowerId).catch(() => null),
        apiClient.get(`/api/v1/invoices/borrower/${borrowerId}/eligible`).catch(() => ({ data: [] })),
      ]);
      setInvoices(invoiceRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const checkEligibility = async () => {
    if (!selectedInvoice || !borrowerId || !selectedProgram || !requestedAmount) return;
    setEligibilityResult(null);
    try {
      const res = await portalApi.borrowerInvoiceEligibility(
        borrowerId, selectedProgram, selectedInvoice.id, parseFloat(requestedAmount)
      );
      setEligibilityResult(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const requestDiscounting = async () => {
    if (!selectedInvoice || !borrowerId || !selectedProgram || !requestedAmount) return;
    setRequesting(true);
    setRequestMsg('');
    try {
      const program = programs.find((p) => p.id === selectedProgram);
      await portalApi.borrowerRequestLoan({
        borrowerId,
        programId: selectedProgram,
        anchorId: selectedInvoice.anchorId,
        productType: 'INVOICE_DISCOUNTING',
        requestedAmount: parseFloat(requestedAmount),
        interestRate: program?.defaultInterestRate || 12,
        tenureDays: Math.max(1, Math.ceil((new Date(selectedInvoice.dueDate).getTime() - Date.now()) / 86400000)),
        invoiceId: selectedInvoice.id,
      });
      setRequestMsg('Discounting request submitted successfully!');
      setSelectedInvoice(null);
      setRequestedAmount('');
      setEligibilityResult(null);
      loadInvoices();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Request failed';
      setRequestMsg('Error: ' + message);
    } finally {
      setRequesting(false);
    }
  };

  const statusColor = (s: string) => {
    switch (s) {
      case 'VERIFIED': return 'bg-blue-100 text-blue-700';
      case 'ELIGIBLE': return 'bg-green-100 text-green-700';
      case 'PARTIALLY_DISCOUNTED': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Invoice Discounting</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Your Borrower ID</label>
          <div className="flex gap-2">
            <input type="text" value={borrowerId} onChange={(e) => setBorrowerId(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg" placeholder="Enter borrower ID" />
            <button onClick={loadInvoices} disabled={!borrowerId || loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
              {loading ? 'Loading...' : 'Load'}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Program</label>
          <select value={selectedProgram} onChange={(e) => setSelectedProgram(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg">
            <option value="">-- Select --</option>
            {programs.map((p) => <option key={p.id} value={p.id}>{p.programName}</option>)}
          </select>
        </div>
      </div>

      {requestMsg && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${requestMsg.startsWith('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          {requestMsg}
        </div>
      )}

      {/* Eligible Invoices Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-x-auto mb-6">
        <div className="px-4 py-3 border-b bg-gray-50">
          <h3 className="font-medium text-gray-700">Eligible Invoices</h3>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-3 py-2 text-left">Invoice #</th>
              <th className="px-3 py-2 text-left">Due Date</th>
              <th className="px-3 py-2 text-right">Net Amount</th>
              <th className="px-3 py-2 text-right">Eligible</th>
              <th className="px-3 py-2 text-right">Available</th>
              <th className="px-3 py-2 text-center">Status</th>
              <th className="px-3 py-2 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {invoices.length === 0 ? (
              <tr><td colSpan={7} className="px-3 py-8 text-center text-gray-400">No eligible invoices found. Enter your Borrower ID and click Load.</td></tr>
            ) : invoices.map((inv) => (
              <tr key={inv.id} className={`border-b hover:bg-gray-50 ${selectedInvoice?.id === inv.id ? 'bg-blue-50' : ''}`}>
                <td className="px-3 py-2 font-medium">{inv.invoiceNumber}</td>
                <td className="px-3 py-2">{inv.dueDate}</td>
                <td className="px-3 py-2 text-right">{inv.netAmount?.toLocaleString()}</td>
                <td className="px-3 py-2 text-right">{inv.eligibleAmount?.toLocaleString()}</td>
                <td className="px-3 py-2 text-right">{inv.availableAmount?.toLocaleString()}</td>
                <td className="px-3 py-2 text-center">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColor(inv.status)}`}>{inv.status}</span>
                </td>
                <td className="px-3 py-2 text-center">
                  <button onClick={() => { setSelectedInvoice(inv); setRequestedAmount(inv.availableAmount?.toString() || ''); setEligibilityResult(null); }}
                    className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700">
                    Select
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Discounting Request Form */}
      {selectedInvoice && (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="font-medium text-gray-800 mb-4">Request Discounting — Invoice #{selectedInvoice.invoiceNumber}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-sm">
            <div className="bg-gray-50 p-3 rounded">
              <span className="text-gray-500">Net Amount</span>
              <p className="font-bold text-lg">{selectedInvoice.netAmount?.toLocaleString()}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <span className="text-gray-500">Eligible Amount</span>
              <p className="font-bold text-lg text-green-700">{selectedInvoice.eligibleAmount?.toLocaleString()}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <span className="text-gray-500">Available Amount</span>
              <p className="font-bold text-lg text-blue-700">{selectedInvoice.availableAmount?.toLocaleString()}</p>
            </div>
          </div>

          <div className="flex items-end gap-4 mb-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Requested Amount</label>
              <input type="number" step="0.01" value={requestedAmount}
                onChange={(e) => setRequestedAmount(e.target.value)}
                max={selectedInvoice.availableAmount}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
            <button onClick={checkEligibility} disabled={!requestedAmount || !selectedProgram}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg text-sm hover:bg-gray-700 disabled:opacity-50">
              Check Eligibility
            </button>
            <button onClick={requestDiscounting}
              disabled={requesting || !requestedAmount || !selectedProgram || (eligibilityResult !== null && !eligibilityResult.eligible)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
              {requesting ? 'Submitting...' : 'Request Discounting'}
            </button>
          </div>

          {eligibilityResult && (
            <div className={`p-4 rounded-lg text-sm ${eligibilityResult.eligible ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <p className="font-medium mb-1">{eligibilityResult.eligible ? 'Eligible for discounting' : 'Not eligible'}</p>
              {Array.isArray(eligibilityResult.reasons) && eligibilityResult.reasons.length > 0 && (
                <ul className="list-disc list-inside text-gray-600">
                  {(eligibilityResult.reasons as string[]).map((r, i) => <li key={i}>{r}</li>)}
                </ul>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
