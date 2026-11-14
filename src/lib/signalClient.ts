import type { SignalConfig } from "./config";
import { fetchSignalFn, type SignalResult } from "./signal.functions";
export type { SignalResult };
export const localEstimate = (c: SignalConfig): SignalResult => ({
  query: c.query, question: "Estimate (no market data): " + c.query,
  probability: c.fallback, source: "estimate", fetched_at: new Date().toISOString(),
});
export async function fetchSignal(c: SignalConfig): Promise<SignalResult> {
  try {
    const r = await fetchSignalFn({ data: { query: c.query, match: [...c.match], fallback: c.fallback } });
    return r.query === c.query && Number.isFinite(r.probability) ? r : localEstimate(c);
  } catch { return localEstimate(c); }
}
