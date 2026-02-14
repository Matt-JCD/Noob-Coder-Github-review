import { init, getTracer as _getTracer, extractTokenUsage as _extractTokenUsage, shutdown } from "@prefactor/langchain";
import { SpanType } from "@prefactor/core";

let initialized = false;
const enabled = !!(process.env.PREFACTOR_API_URL && process.env.PREFACTOR_API_TOKEN);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const noopTracer = {
  startSpan: () => ({} as any),
  endSpan: () => {},
  close: async () => {},
} as unknown as ReturnType<typeof _getTracer>;

function ensureInit() {
  if (initialized || !enabled) return;
  initialized = true;
  init({
    transportType: "http",
    httpConfig: {
      apiUrl: process.env.PREFACTOR_API_URL!,
      apiToken: process.env.PREFACTOR_API_TOKEN!,
      agentId: "01khdf8m2cnz0v3y2cj533f9nk0afn5f",
      agentIdentifier: "langchain-agent-v1",
    },
  });
}

function getTracer() {
  if (!enabled) return noopTracer;
  ensureInit();
  return _getTracer();
}

function extractTokenUsage(response: unknown) {
  if (!enabled) return null;
  return _extractTokenUsage(response);
}

export { getTracer, SpanType, shutdown, extractTokenUsage };
