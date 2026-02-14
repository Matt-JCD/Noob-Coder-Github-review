import { NextRequest, NextResponse } from "next/server";
import { explainBatch } from "@/lib/explainer";
import { explanationCache } from "@/lib/cache";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items, repoDescription, repoKey, folderPath } = body as {
      items: { name: string; type: "folder" | "file"; children?: string; extension?: string }[];
      repoDescription: string;
      repoKey: string;
      folderPath: string;
    };

    // Check cache for each item, collect uncached
    const results: Record<string, string> = {};
    const uncached: typeof items = [];

    for (const item of items) {
      const cacheKey = `${repoKey}:${folderPath}:${item.name}`;
      const cached = explanationCache.get(cacheKey);
      if (cached) {
        results[item.name] = cached;
      } else {
        uncached.push(item);
      }
    }

    // Batch explain uncached items
    let usage = { inputTokens: 0, outputTokens: 0 };

    if (uncached.length > 0) {
      const response = await explainBatch(uncached, repoDescription);
      usage = response.usage;

      for (const [name, explanation] of Object.entries(response.explanations)) {
        const cacheKey = `${repoKey}:${folderPath}:${name}`;
        explanationCache.set(cacheKey, explanation);
        results[name] = explanation;
      }
    }

    return NextResponse.json({ explanations: results, usage });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    if (message.includes("rate_limit") || message.includes("429")) {
      return NextResponse.json(
        { error: "AI rate limit reached. Please wait a moment and try again." },
        { status: 429 }
      );
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
