import { NextRequest, NextResponse } from "next/server";
import { parseGitHubUrl, fetchRepoMeta, fetchRepoTree } from "@/lib/github";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, token } = body as { url: string; token?: string };

    const rawToken = token || process.env.GITHUB_TOKEN || undefined;
    const effectiveToken = rawToken && rawToken.trim() ? rawToken.trim() : undefined;

    const parsed = parseGitHubUrl(url);
    if (!parsed) {
      return NextResponse.json(
        { error: "Invalid GitHub URL. Please paste a link like https://github.com/owner/repo" },
        { status: 400 }
      );
    }

    const { owner, repo } = parsed;

    const meta = await fetchRepoMeta(owner, repo, effectiveToken);
    const tree = await fetchRepoTree(owner, repo, meta.defaultBranch, effectiveToken);

    return NextResponse.json({ meta, tree });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
