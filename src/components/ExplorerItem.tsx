"use client";

import { ColumnItem } from "@/types";
import { getFileIcon } from "@/lib/fileIcons";

interface ExplorerItemProps {
  item: ColumnItem;
  isSelected: boolean;
  onClick: () => void;
  onDeepDive?: () => void;
  recommendation?: string;
}

export default function ExplorerItem({ item, isSelected, onClick, onDeepDive, recommendation }: ExplorerItemProps) {
  const icon = getFileIcon(item.name, item.type);

  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors flex items-start gap-2.5 group ${
        isSelected
          ? "bg-bg-selected"
          : "hover:bg-bg-surface-hover"
      }`}
    >
      <span className="text-base mt-0.5 shrink-0">{icon}</span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1">
          <span className={`text-sm font-medium truncate ${isSelected ? "text-accent" : "text-text-primary"}`}>
            {item.name}
          </span>
          {item.type === "folder" && item.childCount !== undefined && (
            <span className="text-text-muted text-xs shrink-0">
              ({item.childCount})
            </span>
          )}
          {recommendation && (
            <span className="text-accent-dim text-xs shrink-0" title={recommendation}>
              ★
            </span>
          )}
        </div>
        {recommendation && !item.explanation && !item.isLoading && (
          <p className="text-xs text-accent-dim/70 mt-0.5 leading-relaxed">
            {recommendation}
          </p>
        )}
        {item.isLoading && !item.explanation ? (
          <div className="mt-1 space-y-1">
            <div className="skeleton h-3 w-full" />
            <div className="skeleton h-3 w-3/4" />
          </div>
        ) : item.explanation ? (
          <>
            <p className={`text-xs text-text-secondary mt-0.5 leading-relaxed ${item.isDeepDive ? "" : "line-clamp-2"}`}>
              {item.explanation}
            </p>
            {!item.isDeepDive && onDeepDive && (
              <span
                role="link"
                tabIndex={0}
                onClick={(e) => { e.stopPropagation(); onDeepDive(); }}
                onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); onDeepDive(); } }}
                className="text-[10px] text-accent/50 hover:text-accent mt-0.5 transition-colors cursor-pointer inline-block"
              >
                Deep dive
              </span>
            )}
            {item.isDeepDive && (
              <span className="text-[10px] text-accent/40 mt-0.5 inline-block">
                Sonnet
              </span>
            )}
          </>
        ) : null}
      </div>
      {item.type === "folder" && (
        <span className={`text-text-muted mt-1 shrink-0 transition-colors ${isSelected ? "text-accent" : "group-hover:text-text-secondary"}`}>
          ›
        </span>
      )}
    </button>
  );
}
