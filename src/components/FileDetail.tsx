"use client";

import { useExplorer } from "@/context/ExplorerContext";
import CodeViewer from "./CodeViewer";

export default function FileDetail() {
  const { state } = useExplorer();
  const detail = state.fileDetail;

  if (!detail) return null;

  if (detail.isLoading) {
    return (
      <div className="flex-shrink-0 w-[480px] border-r border-border-color bg-bg-secondary p-6 overflow-y-auto h-full">
        <div className="space-y-6">
          <div>
            <div className="skeleton h-7 w-48 mb-2" />
            <div className="skeleton h-4 w-64" />
          </div>
          <div>
            <div className="skeleton h-5 w-32 mb-2" />
            <div className="skeleton h-4 w-full mb-1" />
            <div className="skeleton h-4 w-full mb-1" />
            <div className="skeleton h-4 w-3/4" />
          </div>
          <div>
            <div className="skeleton h-5 w-28 mb-2" />
            <div className="skeleton h-4 w-full mb-1" />
            <div className="skeleton h-4 w-5/6" />
          </div>
          <div>
            <div className="skeleton h-5 w-36 mb-2" />
            <div className="skeleton h-4 w-full mb-1" />
            <div className="skeleton h-4 w-4/5" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-shrink-0 w-[480px] border-r border-border-color bg-bg-secondary p-6 overflow-y-auto h-full">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-text-primary">{detail.name}</h2>
        <p className="text-sm text-text-muted mt-1 font-mono">{detail.path}</p>
        {detail.language && (
          <p className="text-sm text-text-secondary mt-2">
            <span className="text-accent font-medium">{detail.language}</span>
            {detail.languageExplanation && (
              <span className="text-text-muted"> — {detail.languageExplanation}</span>
            )}
          </p>
        )}
      </div>

      {/* What this file does */}
      {detail.summary && (
        <section className="mb-6">
          <h3 className="text-sm font-semibold text-accent uppercase tracking-wide mb-2">
            What this file does
          </h3>
          <p className="text-sm text-text-secondary leading-relaxed">{detail.summary}</p>
        </section>
      )}

      {/* Key parts */}
      {detail.keyFunctions.length > 0 && (
        <section className="mb-6">
          <h3 className="text-sm font-semibold text-accent uppercase tracking-wide mb-2">
            The key parts
          </h3>
          <div className="space-y-3">
            {detail.keyFunctions.map((fn, i) => (
              <div key={i} className="pl-3 border-l-2 border-border-color">
                <p className="text-sm font-medium text-text-primary">{fn.name}</p>
                <p className="text-xs text-text-secondary leading-relaxed mt-0.5">
                  {fn.explanation}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Dependencies */}
      {detail.dependencies.length > 0 && (
        <section className="mb-6">
          <h3 className="text-sm font-semibold text-accent uppercase tracking-wide mb-2">
            What it needs from other files
          </h3>
          <div className="space-y-2">
            {detail.dependencies.map((dep, i) => (
              <div key={i} className="text-sm">
                <span className="text-text-primary font-medium">{dep.name}</span>
                <span className="text-text-muted"> — </span>
                <span className="text-text-secondary">{dep.why}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Things to know */}
      {detail.thingsToKnow.length > 0 && (
        <section className="mb-6">
          <h3 className="text-sm font-semibold text-accent uppercase tracking-wide mb-2">
            Things to know
          </h3>
          <ul className="space-y-1.5">
            {detail.thingsToKnow.map((thing, i) => (
              <li key={i} className="text-sm text-text-secondary flex gap-2">
                <span className="text-text-muted shrink-0">•</span>
                <span className="leading-relaxed">{thing}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Code viewer */}
      <CodeViewer code={detail.content} filename={detail.name} />
    </div>
  );
}
