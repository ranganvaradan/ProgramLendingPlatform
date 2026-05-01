import { useAuth } from '@plp/shared';

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Welcome, {user?.fullName || 'Borrower'}</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-5">
          <div className="text-sm text-gray-500">My Eligible Amount</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">Check Eligibility</div>
          <p className="text-xs text-gray-400 mt-2">Based on your accumulated salary</p>
        </div>
        <div className="bg-white rounded-lg shadow p-5">
          <div className="text-sm text-gray-500">Active Loans</div>
          <div className="text-2xl font-bold text-green-600 mt-1">View My Loans</div>
          <p className="text-xs text-gray-400 mt-2">Track status and repayments</p>
        </div>
        <div className="bg-white rounded-lg shadow p-5">
          <div className="text-sm text-gray-500">Quick Action</div>
          <div className="text-2xl font-bold text-purple-600 mt-1">Request Loan</div>
          <p className="text-xs text-gray-400 mt-2">Pay Day Loan up to eligible limit</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="font-semibold text-gray-700 mb-3">How Pay Day Loans Work</h3>
        <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
          <li>Your employer uploads salary data for the current pay period</li>
          <li>Eligible loan amount is calculated based on accumulated salary and eligibility percentage</li>
          <li>You request a loan up to your eligible amount</li>
          <li>After approval, the loan is disbursed to your bank account</li>
          <li>Repayment is deducted from your next salary</li>
        </ol>
      </div>
    </div>
  );
}
