import { ChatAnthropic } from "@langchain/anthropic";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import type { AIMessage } from "@langchain/core/messages";
import { getTracer, SpanType, extractTokenUsage } from "@/lib/prefactor";

const HAIKU_MODEL = "claude-haiku-4-5-20251001";
const SONNET_MODEL = "claude-sonnet-4-5-20250929";

const SYSTEM_PROMPT = `You are explaining a codebase to someone who has never written a line of code in their life. They are smart and capable — they just don't know programming terminology.

Rules:
- Never use programming jargon without explaining it. Don't say "components" — say "the individual building blocks that make up what users see on screen (buttons, forms, menus, etc.)"
- Use analogies: folders are like departments in a company, files are like individual workers, imports are like asking another department for help, APIs are like phone calls to external services
- Be specific: don't say "contains various utilities" — say "contains helper tools that do things like format dates, check if an email address is valid, and calculate prices"
- If it's boilerplate (node_modules, .next, dist, config files), say plainly: "This is plumbing that makes the app work behind the scenes. You can ignore it."
- Answer the question: "What would break or be missing if this didn't exist?"
- Write like you're explaining to a smart friend over coffee, not writing documentation.`;

interface BatchItem {
  name: string;
  type: "folder" | "file";
  children?: string;
  extension?: string;
}

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
}

function extractText(response: AIMessage): string {
  if (typeof response.content === "string") return response.content;
  if (Array.isArray(response.content)) {
    return response.content
      .filter((block): block is { type: "text"; text: string } => block.type === "text")
      .map((block) => block.text)
      .join("");
  }
  return "";
}

function extractAppUsage(response: AIMessage): TokenUsage {
  const meta = response.usage_metadata;
  return {
    inputTokens: meta?.input_tokens ?? 0,
    outputTokens: meta?.output_tokens ?? 0,
  };
}

async function invokeWithTracing(
  spanName: string,
  modelName: string,
  maxTokens: number,
  systemPrompt: string,
  userPrompt: string,
  metadata?: Record<string, unknown>,
): Promise<{ text: string; usage: TokenUsage }> {
  const tracer = getTracer();
  const span = tracer.startSpan({
    name: spanName,
    spanType: SpanType.LLM,
    inputs: { systemPrompt, userPrompt },
    metadata,
  });

  try {
    const model = new ChatAnthropic({ model: modelName, maxTokens });
    const response = await model.invoke([
      new SystemMessage(systemPrompt),
      new HumanMessage(userPrompt),
    ]);

    const text = extractText(response);
    const usage = extractAppUsage(response);
    const tokenUsage = extractTokenUsage(response) ?? undefined;

    tracer.endSpan(span, {
      outputs: { text },
      tokenUsage,
    });

    return { text, usage };
  } catch (error) {
    tracer.endSpan(span, { error: error instanceof Error ? error : new Error(String(error)) });
    throw error;
  }
}

export async function explainBatch(
  items: BatchItem[],
  repoDescription: string
): Promise<{ explanations: Record<string, string>; usage: TokenUsage }> {
  if (items.length === 0) return { explanations: {}, usage: { inputTokens: 0, outputTokens: 0 } };

  const itemList = items
    .map(
      (item, i) =>
        `${i + 1}. ${item.name} (${item.type}) - ${
          item.type === "folder"
            ? `contains: ${item.children || "unknown contents"}`
            : `file type: ${item.extension || "unknown"}`
        }`
    )
    .join("\n");

  const userPrompt = `Explain each of these items in plain English. Each explanation should be 1-2 sentences. Use analogies. Never use jargon without defining it. Answer "why does this exist?" not just "what is it called."

Project: ${repoDescription || "A software project"}

Items:
${itemList}

Respond as JSON with this exact format: {"explanations": {"item-name": "explanation text", ...}}
Use the exact item names as keys. Respond with ONLY the JSON, no other text.`;

  // Use Haiku for batch explanations — faster and cheaper for short 1-2 sentence outputs
  const { text, usage } = await invokeWithTracing(
    "explainBatch",
    HAIKU_MODEL,
    Math.max(512, items.length * 100),
    SYSTEM_PROMPT,
    userPrompt,
    { itemCount: items.length },
  );

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return { explanations: {}, usage };
    const parsed = JSON.parse(jsonMatch[0]);
    return { explanations: parsed.explanations || parsed, usage };
  } catch {
    console.error("Failed to parse batch explanation response:", text);
    return { explanations: {}, usage };
  }
}

export async function explainSingleItem(
  name: string,
  type: "folder" | "file",
  path: string,
  repoDescription: string,
  children?: string,
  extension?: string
): Promise<{ explanation: string; usage: TokenUsage }> {
  const contextStr =
    type === "folder"
      ? `This is a folder containing: ${children || "unknown contents"}`
      : `This is a file with extension: ${extension || "unknown"}`;

  const userPrompt = `Give a detailed plain-English explanation of this item from a codebase. 3-5 sentences. Be specific about what it does, why it exists, and what would break without it.

Project: ${repoDescription || "A software project"}
Item: ${name} (${type})
Path: ${path}
${contextStr}

Respond with ONLY the explanation text, no JSON or formatting.`;

  const { text, usage } = await invokeWithTracing(
    "explainSingleItem",
    SONNET_MODEL,
    500,
    SYSTEM_PROMPT,
    userPrompt,
    { itemName: name, itemType: type },
  );

  return { explanation: text.trim(), usage };
}

interface FileExplanation {
  summary: string;
  keyFunctions: { name: string; explanation: string }[];
  dependencies: { name: string; why: string }[];
  thingsToKnow: string[];
}

export async function explainFile(
  name: string,
  path: string,
  language: string,
  content: string,
  repoDescription: string
): Promise<{ result: FileExplanation; usage: TokenUsage }> {
  // Truncate content to 500 lines or 15000 chars
  const lines = content.split("\n");
  const truncatedLines = lines.slice(0, 500);
  let truncated = truncatedLines.join("\n");
  if (truncated.length > 15000) {
    truncated = truncated.slice(0, 15000) + "\n... (truncated)";
  }

  const userPrompt = `Explain this file to someone who has never coded before.

Project: ${repoDescription || "A software project"}
File: ${name}
Path: ${path}
Language: ${language}

Contents:
${truncated}

Respond in this exact JSON format (no other text):
{
  "summary": "2-3 sentence explanation of what this file does and why it exists. Answer: if I deleted this file, what would stop working?",
  "keyFunctions": [{"name": "human-readable name for this part", "explanation": "what this part does in plain English"}],
  "dependencies": [{"name": "file or package name", "why": "what this file asks it for help with"}],
  "thingsToKnow": ["important pattern or gotcha in plain English"]
}`;

  const { text, usage } = await invokeWithTracing(
    "explainFile",
    SONNET_MODEL,
    1500,
    SYSTEM_PROMPT,
    userPrompt,
    { fileName: name, language },
  );

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found");
    return { result: JSON.parse(jsonMatch[0]), usage };
  } catch {
    return {
      result: {
        summary: "Unable to generate explanation for this file.",
        keyFunctions: [],
        dependencies: [],
        thingsToKnow: [],
      },
      usage,
    };
  }
}
