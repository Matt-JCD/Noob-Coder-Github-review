import { NextRequest, NextResponse } from "next/server";
import { explainSingleItem } from "@/lib/explainer";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, type, path, repoDescription, children, extension } = body as {
      name: string;
      type: "folder" | "file";
      path: string;
      repoDescription: string;
      children?: string;
      extension?: string;
    };

    const { explanation, usage } = await explainSingleItem(
      name,
      type,
      path,
      repoDescription,
      children,
      extension
    );

    // Sonnet pricing: $3/1M input, $15/1M output
    const cost = (usage.inputTokens * 3 + usage.outputTokens * 15) / 1_000_000;
    return NextResponse.json({ explanation, usage: { ...usage, cost } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
