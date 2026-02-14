"use client";

import { useExplorer } from "@/context/ExplorerContext";

export default function Breadcrumbs() {
  const { state, navigateToDepth } = useExplorer();

  if (!state.repoMeta) return null;

  const segments: { label: string; depth: number }[] = [
    { label: state.repoMeta.repo, depth: 0 },
  ];

  // Add path segments from columns (skip root)
  for (let i = 1; i < state.columns.length; i++) {
    const colPath = state.columns[i].path;
    const name = colPath.split("/").pop() || colPath;
    segments.push({ label: name, depth: i });
  }

  // Add file detail if present
  if (state.fileDetail) {
    segments.push({
      label: state.fileDetail.name,
      depth: state.columns.length,
    });
  }

  return (
    <div className="flex items-center gap-1 px-4 py-2 bg-bg-secondary border-b border-border-color text-sm overflow-x-auto">
      {segments.map((seg, i) => (
        <span key={i} className="flex items-center gap-1 shrink-0">
          {i > 0 && <span className="text-text-muted">/</span>}
          {i < segments.length - 1 ? (
            <button
              onClick={() => navigateToDepth(seg.depth)}
              className="text-text-secondary hover:text-accent transition-colors"
            >
              {seg.label}
            </button>
          ) : (
            <span className="text-text-primary font-medium">{seg.label}</span>
          )}
        </span>
      ))}
    </div>
  );
}
