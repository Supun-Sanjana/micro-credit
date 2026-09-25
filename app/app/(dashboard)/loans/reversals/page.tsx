import { getReversalRequests } from "@/app/actions/reversals";
import Link from "next/link";
import { ReversalActionButtons } from "./reversal-action-buttons";

export default async function ReversalsPage() {
  const requests = await getReversalRequests();

  return (
    <div className="flex flex-col gap-8 lg:gap-12">
      <div className="flex justify-between items-end gap-6">
        <div>
          <h1 className="text-[44px] font-serif text-navy-900">Payment Reversals</h1>
          <p className="text-slate-500">Review and approve payment reversal requests.</p>
        </div>
      </div>

      <section className="overflow-x-auto rounded-[24px] bg-slate-50 p-8 text-navy-900 shadow-subtle">
        <h2 className="mb-6 text-xl font-medium">Reversal Queue</h2>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-300">
              <th className="py-3 px-2 font-medium">Loan #</th>
              <th className="py-3 px-2 font-medium">Member</th>
              <th className="py-3 px-2 font-medium">Payment Amount</th>
              <th className="py-3 px-2 font-medium">Payment Date</th>
              <th className="py-3 px-2 font-medium">Reason</th>
              <th className="py-3 px-2 font-medium">Requested By</th>
              <th className="py-3 px-2 font-medium">Status</th>
              <th className="py-3 px-2 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((req) => (
              <tr key={req.id} className="border-b border-gray-200 hover:bg-black/5">
                <td className="py-4 px-2">
                  <Link className="underline text-blue-600 hover:text-blue-800" href={`/app/loans/${req.repayment.loan.id}`}>
                    {req.repayment.loan.loanNumber || "View Loan"}
                  </Link>
                </td>
                <td className="py-4 px-2">{req.repayment.loan.member.name}</td>
                <td className="py-4 px-2 font-medium">LKR {Number(req.repayment.amount).toLocaleString()}</td>
                <td className="py-4 px-2">{new Date(req.repayment.paidDate).toLocaleDateString()}</td>
                <td className="py-4 px-2 max-w-[200px] truncate" title={req.reason}>{req.reason}</td>
                <td className="py-4 px-2">{req.requestedBy.name || req.requestedBy.email}</td>
                <td className="py-4 px-2">
                  <span className={`px-2 py-1 rounded text-sm font-medium ${
                    req.status === 'REQUESTED' ? 'bg-yellow-100 text-yellow-800' : 
                    req.status === 'APPROVED' ? 'bg-green-100 text-green-800' : 
                    'bg-red-100 text-red-800'
                  }`}>
                    {req.status}
                  </span>
                </td>
                <td className="py-4 px-2 text-right">
                  {req.status === "REQUESTED" ? (
                    <ReversalActionButtons reversalId={req.id} />
                  ) : (
                    <span className="text-sm text-slate-500">
                      {req.status} by {req.approvedById ? "Admin" : "System"}
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {requests.length === 0 && (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-500">
                  No reversal requests found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
