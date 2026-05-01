import { useState } from 'react';
import { eligibilityApi, portalApi } from '@plp/shared';
import type { EligibilityResult } from '@plp/shared';

export default function LoanRequestPage() {
  const [borrowerId, setBorrowerId] = useState('');
  const [programId, setProgramId] = useState('');
  const [amount, setAmount] = useState('');
  const [eligibility, setEligibility] = useState<EligibilityResult | null>(null);
  const [checking, setChecking] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const checkEligibility = async () => {
    if (!borrowerId || !programId || !amount) return;
    setChecking(true);
    setEligibility(null);
    try {
      const res = await eligibilityApi.check(borrowerId, programId, parseFloat(amount));
      setEligibility(res.data.data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Eligibility check failed';
      setResult({ success: false, message: msg });
    } finally {
      setChecking(false);
    }
  };

  const requestLoan = async () => {
    if (!eligibility?.eligible) return;
    setRequesting(true);
    try {
      await portalApi.borrowerRequestLoan({
        borrowerId,
        programId,
        productType: 'PAY_DAY_LOAN',
        requestedAmount: parseFloat(amount),
        interestRate: 18.0,
        tenureDays: 30,
      });
      setResult({ success: true, message: 'Loan request submitted successfully!' });
      setEligibility(null);
      setAmount('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Loan request failed';
      setResult({ success: false, message: msg });
    } finally {
      setRequesting(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Request Pay Day Loan</h2>

      <div className="bg-white rounded-lg shadow p-6 max-w-lg">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Your Borrower ID</label>
            <input value={borrowerId} onChange={(e) => setBorrowerId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="UUID" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Program ID</label>
            <input value={programId} onChange={(e) => setProgramId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="UUID" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Requested Amount (₹)</label>
            <input type="number" step="100" value={amount} onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>

          <button onClick={checkEligibility} disabled={checking || !borrowerId || !programId || !amount}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
            {checking ? 'Checking...' : 'Check Eligibility'}
          </button>
        </div>

        {eligibility && (
          <div className={`mt-4 p-4 rounded-lg ${eligibility.eligible ? 'bg-green-50' : 'bg-red-50'}`}>
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-lg ${eligibility.eligible ? 'text-green-600' : 'text-red-600'}`}>
                {eligibility.eligible ? 'Eligible' : 'Not Eligible'}
              </span>
            </div>
            <div className="text-sm space-y-1">
              <p>Eligible Amount: <strong>₹{eligibility.eligibleAmount.toLocaleString('en-IN')}</strong></p>
              <p>Active Loans: <strong>{eligibility.activeLoans}</strong></p>
              {eligibility.reasons.length > 0 && (
                <ul className="list-disc list-inside text-red-600">
                  {eligibility.reasons.map((r, i) => <li key={i}>{r}</li>)}
                </ul>
              )}
            </div>
            {eligibility.eligible && (
              <button onClick={requestLoan} disabled={requesting}
                className="mt-3 w-full bg-green-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50">
                {requesting ? 'Submitting...' : 'Submit Loan Request'}
              </button>
            )}
          </div>
        )}

        {result && (
          <div className={`mt-4 p-3 rounded-lg text-sm ${result.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {result.message}
          </div>
        )}
      </div>
    </div>
  );
}
