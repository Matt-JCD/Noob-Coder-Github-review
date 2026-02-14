import { RepoMeta, TreeNode } from "@/types";

function isValidToken(token: string): boolean {
  const t = token.trim();
  // Real GitHub tokens start with ghp_, gho_, ghu_, ghs_, ghr_, or github_pat_
  return t.length > 20 && (
    t.startsWith("ghp_") ||
    t.startsWith("gho_") ||
    t.startsWith("ghu_") ||
    t.startsWith("ghs_") ||
    t.startsWith("ghr_") ||
    t.startsWith("github_pat_")
  );
}

function getHeaders(token?: string): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
  };
  if (token && isValidToken(token)) {
    headers["Authorization"] = `Bearer ${token.trim()}`;
  }
  return headers;
}

export function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  try {
    const u = new URL(url);
    if (u.hostname !== "github.com") return null;
    const parts = u.pathname.split("/").filter(Boolean);
    if (parts.length < 2) return null;
    return { owner: parts[0], repo: parts[1] };
  } catch {
    return null;
  }
}

export async function fetchRepoMeta(
  owner: string,
  repo: string,
  token?: string
): Promise<RepoMeta> {
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
    headers: getHeaders(token),
  });

  if (!res.ok) {
    if (res.status === 404) throw new Error("Repository not found. Check the URL or provide a GitHub token for private repos.");
    if (res.status === 403) {
      const remaining = res.headers.get("x-ratelimit-remaining");
      const reset = res.headers.get("x-ratelimit-reset");
      if (remaining === "0" && reset) {
        const resetDate = new Date(parseInt(reset) * 1000);
        const minutes = Math.ceil((resetDate.getTime() - Date.now()) / 60000);
        throw new Error(`GitHub API rate limit reached. Try again in ${minutes} minutes, or add a GitHub token to increase your limit.`);
      }
      throw new Error("GitHub API access forbidden. You may need a token for this repository.");
    }
    throw new Error(`GitHub API error: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  return {
    owner,
    repo,
    description: data.description || "",
    defaultBranch: data.default_branch,
    stars: data.stargazers_count,
    language: data.language || "",
  };
}

export async function fetchRepoTree(
  owner: string,
  repo: string,
  branch: string,
  token?: string
): Promise<TreeNode[]> {
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`,
    { headers: getHeaders(token) }
  );

  if (!res.ok) {
    throw new Error(`Failed to fetch repository tree: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();

  if (data.truncated) {
    console.warn("GitHub tree was truncated — this is a very large repository.");
  }

  return (data.tree as Array<{ path: string; type: string; sha: string; size?: number }>).map(
    (item) => ({
      path: item.path,
      type: item.type as "blob" | "tree",
      sha: item.sha,
      size: item.size,
    })
  );
}

export async function fetchFileContent(
  owner: string,
  repo: string,
  path: string,
  token?: string
): Promise<string> {
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
    { headers: getHeaders(token) }
  );

  if (!res.ok) {
    throw new Error(`Failed to fetch file: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();

  if (data.encoding === "base64" && data.content) {
    return Buffer.from(data.content, "base64").toString("utf-8");
  }

  if (data.type === "symlink" || data.type === "submodule") {
    return `[This is a ${data.type}, not a regular file]`;
  }

  // For large files, try the raw download
  if (data.download_url) {
    const rawRes = await fetch(data.download_url);
    if (rawRes.ok) return rawRes.text();
  }

  throw new Error("Unable to read file content — it may be a binary file.");
}
