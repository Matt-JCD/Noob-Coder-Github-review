"use client";

import { useState } from "react";
import { Column } from "@/types";
import { useExplorer } from "@/context/ExplorerContext";
import ExplorerItem from "./ExplorerItem";
import CostConfirm from "./CostConfirm";
import { isHidden } from "@/lib/filter";
import { estimateBatchCost } from "@/lib/estimator";

interface FolderColumnProps {
  column: Column;
  depth: number;
}

export default function FolderColumn({ column, depth }: FolderColumnProps) {
  const { state, selectFolder, selectFile, requestExplanations } = useExplorer();
  const [showEstimate, setShowEstimate] = useState(false);

  // Build a lookup for recommendations
  const recMap = new Map<string, string>();
  for (const rec of state.recommendedPaths) {
    recMap.set(rec.path, rec.reason);
  }

  const handleClick = (item: typeof column.items[0]) => {
    if (item.type === "folder") {
      selectFolder(depth, item.path);
    } else {
      selectFile(depth, item.path);
    }
  };

  // Check if any items still need explaining
  const unexplainedItems = column.items.filter(
    (item) => !item.explanation && !item.isLoading
  );
  const hasUnexplained = unexplainedItems.length > 0;
  const allExplained = unexplainedItems.length === 0 && column.items.length > 0;
  const isExplaining = column.items.some((item) => item.isLoading);

  const handleExplainAll = () => {
    setShowEstimate(true);
  };

  const handleConfirmExplain = () => {
    setShowEstimate(false);
    requestExplanations(column.path, unexplainedItems);
  };

  const estimate = estimateBatchCost(unexplainedItems.length);

  // Count hidden items if not showing hidden
  let hiddenCount = 0;
  if (!state.showHidden) {
    const allItems = state.tree.filter((node) => {
      const prefix = column.path === "" ? "" : column.path + "/";
      if (column.path === "") {
        return !node.path.includes("/");
      }
      if (!node.path.startsWith(prefix)) return false;
      const remaining = node.path.slice(prefix.length);
      return !remaining.includes("/") && remaining !== "";
    });
    hiddenCount = allItems.filter((n) => isHidden(n.path)).length;
  }

  return (
    <div className="flex-shrink-0 w-[280px] border-r border-border-color bg-bg-secondary flex flex-col h-full">
      {/* Explain button / estimate */}
      {hasUnexplained && !isExplaining && !showEstimate && (
        <div className="p-2 border-b border-border-color">
          <button
            onClick={handleExplainAll}
            className="w-full px-3 py-2 rounded-md bg-accent/10 border border-accent/30 text-accent text-xs font-medium hover:bg-accent/20 transition-colors"
          >
            Explain {unexplainedItems.length} items
          </button>
        </div>
      )}
      {isExplaining && (
        <div className="p-2 border-b border-border-color text-xs text-text-muted text-center">
          Explaining...
        </div>
      )}
      {allExplained && (
        <div className="p-2 border-b border-border-color text-xs text-green-400/70 text-center">
          All items explained
        </div>
      )}
      {showEstimate && (
        <CostConfirm
          estimate={estimate}
          onConfirm={handleConfirmExplain}
          onCancel={() => setShowEstimate(false)}
        />
      )}

      {/* Item list */}
      <div className="p-2 flex-1 overflow-y-auto space-y-0.5">
        {column.items.map((item) => (
          <ExplorerItem
            key={item.path}
            item={item}
            isSelected={column.selectedPath === item.path}
            onClick={() => handleClick(item)}
            recommendation={recMap.get(item.path)}
          />
        ))}
      </div>
      {hiddenCount > 0 && (
        <div className="px-3 py-2 border-t border-border-color text-xs text-text-muted">
          {column.items.length} shown · {hiddenCount} hidden
        </div>
      )}
    </div>
  );
}
