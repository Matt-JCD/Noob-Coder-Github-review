"use client";

import { useExplorer } from "@/context/ExplorerContext";

export default function TokenTracker() {
  const { state, resetTokenUsage } = useExplorer();
  const { inputTokens, outputTokens, estimatedCost } = state.tokenUsage;

  if (inputTokens === 0 && outputTokens === 0) {
    return (
      <div className="flex items-center gap-2 text-xs text-text-muted">
        No tokens used yet
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 text-xs">
      <span className="text-text-secondary">
        {inputTokens.toLocaleString()} in / {outputTokens.toLocaleString()} out
      </span>
      <span className="text-accent font-medium">
        ~${estimatedCost.toFixed(4)}
      </span>
      <button
        onClick={resetTokenUsage}
        className="text-text-muted hover:text-text-secondary transition-colors"
        title="Reset token counter"
      >
        Reset
      </button>
    </div>
  );
}
