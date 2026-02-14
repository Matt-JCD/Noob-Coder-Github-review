"use client";

import { CostEstimate, formatCost } from "@/lib/estimator";

interface CostConfirmProps {
  estimate: CostEstimate;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function CostConfirm({ estimate, onConfirm, onCancel }: CostConfirmProps) {
  return (
    <div className="mx-2 my-2 p-3 rounded-lg bg-bg-surface border border-border-color text-sm">
      <p className="text-text-primary mb-2">
        {estimate.description} to explain
      </p>
      <p className="text-text-secondary text-xs mb-3">
        ~{estimate.inputTokens.toLocaleString()} input + ~{estimate.outputTokens.toLocaleString()} output tokens
        {" "}≈ {formatCost(estimate.estimatedCost)}
      </p>
      <div className="flex gap-2">
        <button
          onClick={onConfirm}
          className="px-3 py-1.5 rounded-md bg-accent text-bg-primary text-xs font-medium hover:opacity-90 transition-opacity"
        >
          Go ahead
        </button>
        <button
          onClick={onCancel}
          className="px-3 py-1.5 rounded-md border border-border-color text-text-secondary text-xs hover:text-text-primary hover:bg-bg-surface-hover transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
