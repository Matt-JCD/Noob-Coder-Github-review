"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RepoInput() {
  const [url, setUrl] = useState("");
  const [token, setToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const saved = localStorage.getItem("github_token");
    if (saved) {
      setToken(saved);
      setShowToken(true);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    if (token) {
      localStorage.setItem("github_token", token);
    } else {
      localStorage.removeItem("github_token");
    }

    const params = new URLSearchParams({ url: url.trim() });
    router.push(`/explore?${params.toString()}`);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-xl space-y-4">
      <div className="relative">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://github.com/owner/repo"
          className="w-full rounded-xl border border-border-color bg-bg-surface px-5 py-4 text-lg text-text-primary placeholder:text-text-muted outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
          autoFocus
        />
        <button
          type="submit"
          disabled={!url.trim()}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-accent px-5 py-2 font-medium text-bg-primary transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          Explore
        </button>
      </div>

      <div className="text-center">
        <button
          type="button"
          onClick={() => setShowToken(!showToken)}
          className="text-sm text-text-muted hover:text-text-secondary transition-colors"
        >
          {showToken ? "Hide" : "Have a GitHub token?"} (for private repos)
        </button>
      </div>

      {showToken && (
        <input
          type="password"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="ghp_... (optional — for private repos and higher rate limits)"
          className="w-full rounded-xl border border-border-color bg-bg-surface px-5 py-3 text-sm text-text-primary placeholder:text-text-muted outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
        />
      )}
    </form>
  );
}
