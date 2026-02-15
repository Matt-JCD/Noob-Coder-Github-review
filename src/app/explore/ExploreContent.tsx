"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { useExplorer } from "@/context/ExplorerContext";
import Breadcrumbs from "@/components/Breadcrumbs";
import ColumnExplorer from "@/components/ColumnExplorer";
import TokenTracker from "@/components/TokenTracker";
import LoadingTimer from "@/components/LoadingTimer";

export default function ExploreContent() {
  const searchParams = useSearchParams();
  const { state, loadRepo, toggleHidden } = useExplorer();
  const loaded = useRef(false);

  const url = searchParams.get("url");

  useEffect(() => {
    if (url && !loaded.current) {
      loaded.current = true;
      const token = localStorage.getItem("github_token") || undefined;
      loadRepo(url, token);
    }
  }, [url, loadRepo]);

  if (state.isLoadingRepo) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-text-secondary">Loading repository...</p>
          <p className="text-text-muted text-sm mt-1 mb-2">Fetching file tree from GitHub</p>
          <LoadingTimer estimatedSeconds={5} />
        </div>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <p className="text-red-400/80 text-lg font-medium mb-2">Something went wrong</p>
          <p className="text-text-secondary">{state.error}</p>
          <a
            href="/"
            className="inline-block mt-6 px-6 py-2 rounded-lg bg-bg-surface hover:bg-bg-surface-hover text-text-primary transition-colors"
          >
            Try another repo
          </a>
        </div>
      </div>
    );
  }

  if (!state.repoMeta) return null;

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-2 border-b border-border-color bg-bg-primary shrink-0">
        <div className="flex items-center gap-3">
          <a href="/" className="flex items-center gap-2 group">
            <Image
              src="/prefactor-symbol-white.png"
              alt="Prefactor"
              width={24}
              height={24}
            />
            <span className="text-sm font-semibold text-accent group-hover:underline">
              Codebase Explainer
            </span>
          </a>
          <span className="text-text-muted">&middot;</span>
          <span className="text-sm text-text-secondary">
            {state.repoMeta.owner}/{state.repoMeta.repo}
          </span>
          {state.repoMeta.stars > 0 && (
            <span className="text-xs text-text-muted">
              ★ {state.repoMeta.stars.toLocaleString()}
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <TokenTracker />
          <button
            onClick={toggleHidden}
            className="text-xs px-3 py-1.5 rounded-md border border-border-color text-text-secondary hover:text-text-primary hover:bg-bg-surface transition-colors"
          >
            {state.showHidden ? "Hide boilerplate" : "Show all files"}
          </button>
        </div>
      </header>

      {/* Breadcrumbs */}
      <Breadcrumbs />

      {/* Columns */}
      <ColumnExplorer />
    </div>
  );
}
