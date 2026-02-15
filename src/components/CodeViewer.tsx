"use client";

import { useState, useEffect } from "react";

interface CodeViewerProps {
  code: string;
  filename: string;
}

export default function CodeViewer({ code, filename }: CodeViewerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [html, setHtml] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || html) return;

    let cancelled = false;
    setIsLoading(true);

    async function highlight() {
      try {
        const { codeToHtml } = await import("shiki");
        // Detect language from filename
        const ext = filename.includes(".") ? filename.split(".").pop() : "";
        const langMap: Record<string, string> = {
          ts: "typescript",
          tsx: "tsx",
          js: "javascript",
          jsx: "jsx",
          json: "json",
          md: "markdown",
          css: "css",
          scss: "scss",
          html: "html",
          py: "python",
          rb: "ruby",
          go: "go",
          rs: "rust",
          sh: "bash",
          bash: "bash",
          yaml: "yaml",
          yml: "yaml",
          toml: "toml",
          sql: "sql",
          graphql: "graphql",
          dockerfile: "dockerfile",
          xml: "xml",
          svg: "xml",
        };

        const lang = langMap[ext || ""] || "text";

        const result = await codeToHtml(code, {
          lang,
          theme: "github-dark-default",
        });

        if (!cancelled) {
          setHtml(result);
          setIsLoading(false);
        }
      } catch {
        if (!cancelled) {
          // Fallback to plain code block
          const escaped = code
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
          setHtml(`<pre><code>${escaped}</code></pre>`);
          setIsLoading(false);
        }
      }
    }

    highlight();
    return () => {
      cancelled = true;
    };
  }, [isOpen, code, filename, html]);

  if (!code || code.startsWith("[")) return null;

  return (
    <div className="mt-4 border border-border-color rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 text-left text-sm text-text-secondary hover:text-text-primary bg-bg-surface hover:bg-bg-surface-hover transition-colors flex items-center gap-2"
      >
        <span className={`transition-transform ${isOpen ? "rotate-90" : ""}`}>
          ▶
        </span>
        <span>
          Source code — you don&apos;t need to read this, but it&apos;s here if
          you&apos;re curious
        </span>
      </button>
      {isOpen && (
        <div className="max-h-[600px] overflow-auto bg-bg-primary text-sm">
          {isLoading ? (
            <div className="p-4 text-text-muted">Loading syntax highlighting...</div>
          ) : (
            <div
              className="[&_pre]:!bg-transparent [&_pre]:p-4 [&_pre]:!m-0 [&_code]:text-xs [&_code]:leading-relaxed"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          )}
        </div>
      )}
    </div>
  );
}
