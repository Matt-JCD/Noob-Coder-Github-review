import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

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

  // Use Haiku for batch explanations — faster and cheaper for short 1-2 sentence outputs
  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: Math.max(512, items.length * 100),
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Explain each of these items in plain English. Each explanation should be 1-2 sentences. Use analogies. Never use jargon without defining it. Answer "why does this exist?" not just "what is it called."

Project: ${repoDescription || "A software project"}

Items:
${itemList}

Respond as JSON with this exact format: {"explanations": {"item-name": "explanation text", ...}}
Use the exact item names as keys. Respond with ONLY the JSON, no other text.`,
      },
    ],
  });

  const usage: TokenUsage = {
    inputTokens: message.usage.input_tokens,
    outputTokens: message.usage.output_tokens,
  };

  const text =
    message.content[0].type === "text" ? message.content[0].text : "";

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

  const message = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 500,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Give a detailed plain-English explanation of this item from a codebase. 3-5 sentences. Be specific about what it does, why it exists, and what would break without it.

Project: ${repoDescription || "A software project"}
Item: ${name} (${type})
Path: ${path}
${contextStr}

Respond with ONLY the explanation text, no JSON or formatting.`,
      },
    ],
  });

  const usage: TokenUsage = {
    inputTokens: message.usage.input_tokens,
    outputTokens: message.usage.output_tokens,
  };

  const text =
    message.content[0].type === "text" ? message.content[0].text : "";
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

  const message = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 1500,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Explain this file to someone who has never coded before.

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
}`,
      },
    ],
  });

  const usage: TokenUsage = {
    inputTokens: message.usage.input_tokens,
    outputTokens: message.usage.output_tokens,
  };

  const text =
    message.content[0].type === "text" ? message.content[0].text : "";

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
