"use client";

import { useState } from "react";
import { approveReversal, rejectReversal } from "@/app/actions/reversals";
import { Button } from "@/components/ui/button";

export function ReversalActionButtons({ reversalId }: { reversalId: string }) {
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectNote, setRejectNote] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [error, setError] = useState("");

  const handleApprove = async () => {
    setIsApproving(true);
    setError("");
    try {
      const res = await approveReversal(reversalId);
      if (res.error) setError(res.error);
    } catch (err: any) {
      setError(err.message || "Failed to approve");
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    if (!rejectNote) {
      setError("Please provide a rejection note");
      return;
    }
    setIsRejecting(true);
    setError("");
    try {
      const res = await rejectReversal(reversalId, rejectNote);
      if (res.error) setError(res.error);
      else setShowRejectForm(false);
    } catch (err: any) {
      setError(err.message || "Failed to reject");
    } finally {
      setIsRejecting(false);
    }
  };

  if (showRejectForm) {
    return (
      <div className="flex flex-col gap-2 min-w-[200px]">
        <input
          type="text"
          value={rejectNote}
          onChange={(e) => setRejectNote(e.target.value)}
          placeholder="Reason for rejection..."
          className="px-2 py-1 border rounded text-sm w-full bg-white"
        />
        {error && <span className="text-red-500 text-xs">{error}</span>}
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" size="sm" onClick={() => setShowRejectForm(false)} disabled={isRejecting}>
            Cancel
          </Button>
          <Button variant="destructive" size="sm" onClick={handleReject} disabled={isRejecting}>
            {isRejecting ? "Rejecting..." : "Confirm Reject"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1 items-end">
      {error && <span className="text-red-500 text-xs mb-1">{error}</span>}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="text-red-600 border-red-200 hover:bg-red-50"
          onClick={() => setShowRejectForm(true)}
          disabled={isApproving}
        >
          Reject
        </Button>
        <Button
          size="sm"
          className="bg-green-600 text-white hover:bg-green-700"
          onClick={handleApprove}
          disabled={isApproving}
        >
          {isApproving ? "Approving..." : "Approve"}
        </Button>
      </div>
    </div>
  );
}
