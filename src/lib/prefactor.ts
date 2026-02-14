import { init, getTracer as _getTracer, extractTokenUsage, shutdown } from "@prefactor/langchain";
import { SpanType } from "@prefactor/core";

let initialized = false;

function ensureInit() {
  if (initialized) return;
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
  ensureInit();
  return _getTracer();
}

export { getTracer, SpanType, shutdown, extractTokenUsage };
