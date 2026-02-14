import { NextRequest, NextResponse } from "next/server";
import { fetchFileContent } from "@/lib/github";
import { explainFile } from "@/lib/explainer";
import { getLanguageInfo } from "@/lib/fileIcons";
import { fileDetailCache } from "@/lib/cache";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { owner, repo, path, token, repoDescription } = body as {
      owner: string;
      repo: string;
      path: string;
      token?: string;
      repoDescription: string;
    };

    const rawToken = token || process.env.GITHUB_TOKEN || undefined;
    const githubToken = rawToken && rawToken.trim() ? rawToken.trim() : undefined;
    const name = path.split("/").pop() || path;
    const langInfo = getLanguageInfo(name);

    // Check cache
    const cacheKey = `${owner}/${repo}:${path}`;
    const cached = fileDetailCache.get(cacheKey);
    if (cached) {
      return NextResponse.json({ ...(cached as object), usage: { inputTokens: 0, outputTokens: 0 } });
    }

    // Fetch file content
    const content = await fetchFileContent(owner, repo, path, githubToken);

    // Check if binary
    const isBinary = content.includes("\0") || /[\x00-\x08\x0E-\x1F]/.test(content.slice(0, 1000));
    if (isBinary) {
      const result = {
        name,
        path,
        language: langInfo.name,
        languageExplanation: langInfo.explanation,
        summary: "This is a binary file (like an image or compiled code). It's not human-readable text.",
        keyFunctions: [],
        dependencies: [],
        thingsToKnow: ["Binary files can't be displayed as text. They contain data in a format that only specific programs can read."],
        content: "[Binary file — cannot display as text]",
      };
      fileDetailCache.set(cacheKey, result);
      return NextResponse.json({ ...result, usage: { inputTokens: 0, outputTokens: 0 } });
    }

    // Explain via AI
    const { result: explanation, usage } = await explainFile(
      name,
      path,
      langInfo.name,
      content,
      repoDescription
    );

    const result = {
      name,
      path,
      language: langInfo.name,
      languageExplanation: langInfo.explanation,
      summary: explanation.summary,
      keyFunctions: explanation.keyFunctions,
      dependencies: explanation.dependencies,
      thingsToKnow: explanation.thingsToKnow,
      content,
    };

    fileDetailCache.set(cacheKey, result);
    // Sonnet pricing: $3/1M input, $15/1M output
    const cost = (usage.inputTokens * 3 + usage.outputTokens * 15) / 1_000_000;
    return NextResponse.json({ ...result, usage: { ...usage, cost } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
