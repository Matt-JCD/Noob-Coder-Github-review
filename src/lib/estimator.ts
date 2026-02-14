// Rough token estimation heuristics
// These don't need to be perfect — within 2x is fine.
// The point is giving the user a sense of cost before committing.

// Batch explanations use Haiku (faster, cheaper)
const HAIKU_INPUT_PRICE = 0.80; // $ per 1M input tokens
const HAIKU_OUTPUT_PRICE = 4; // $ per 1M output tokens

// File explanations use Sonnet (better quality for detailed analysis)
const SONNET_INPUT_PRICE = 3; // $ per 1M input tokens
const SONNET_OUTPUT_PRICE = 15; // $ per 1M output tokens

// For batch folder explanations:
// ~200 tokens per item for prompt context (name, path, type, children)
// ~100 tokens for system prompt overhead (shared across batch)
// ~150 tokens output per item (1-2 sentence explanation)
const TOKENS_PER_ITEM_INPUT = 200;
const SYSTEM_PROMPT_OVERHEAD = 100;
const TOKENS_PER_ITEM_OUTPUT = 150;

// For file explanations:
// Input = file content (roughly bytes / 4) + 200 for prompt overhead
// Output = ~500 tokens for detailed explanation
const BYTES_TO_TOKENS_RATIO = 4;
const FILE_PROMPT_OVERHEAD = 200;
const FILE_OUTPUT_ESTIMATE = 500;

export interface CostEstimate {
  inputTokens: number;
  outputTokens: number;
  estimatedCost: number;
  itemCount: number;
  description: string;
  model: string;
}

export function estimateBatchCost(itemCount: number): CostEstimate {
  const inputTokens = SYSTEM_PROMPT_OVERHEAD + itemCount * TOKENS_PER_ITEM_INPUT;
  const outputTokens = itemCount * TOKENS_PER_ITEM_OUTPUT;
  const estimatedCost =
    (inputTokens * HAIKU_INPUT_PRICE + outputTokens * HAIKU_OUTPUT_PRICE) / 1_000_000;

  return {
    inputTokens,
    outputTokens,
    estimatedCost,
    itemCount,
    description: `${itemCount} item${itemCount === 1 ? "" : "s"}`,
    model: "Haiku",
  };
}

export function estimateFileCost(fileSizeBytes: number): CostEstimate {
  const contentTokens = Math.ceil(fileSizeBytes / BYTES_TO_TOKENS_RATIO);
  // Cap at 15000 chars / 4 = 3750 tokens (file content is truncated to 15000 chars)
  const cappedTokens = Math.min(contentTokens, 3750);
  const inputTokens = FILE_PROMPT_OVERHEAD + cappedTokens;
  const outputTokens = FILE_OUTPUT_ESTIMATE;
  const estimatedCost =
    (inputTokens * SONNET_INPUT_PRICE + outputTokens * SONNET_OUTPUT_PRICE) / 1_000_000;

  return {
    inputTokens,
    outputTokens,
    estimatedCost,
    itemCount: 1,
    description: "1 file",
    model: "Sonnet",
  };
}

export function estimateDeepDiveCost(): CostEstimate {
  const inputTokens = 200;
  const outputTokens = 300;
  const estimatedCost =
    (inputTokens * SONNET_INPUT_PRICE + outputTokens * SONNET_OUTPUT_PRICE) / 1_000_000;

  return {
    inputTokens,
    outputTokens,
    estimatedCost,
    itemCount: 1,
    description: "Deep dive",
    model: "Sonnet",
  };
}

export function formatCost(cost: number): string {
  if (cost < 0.01) return `<$0.01`;
  return `~$${cost.toFixed(2)}`;
}
