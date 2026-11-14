// Queries/tokens are conservative placeholders until current active market titles are verified.
// Lack of an exact match is an ESTIMATE (50%, no edge), never a fabricated live probability.
export const SIGNAL_A = {
  name: "Federal Reserve rate-cut probability",
  query: "Fed Decision in December",
  match: ["fed", "decrease"],
  fallback: 50,
} as const;
export const SIGNAL_B = {
  name: "Mortgage rate below 6% probability",
  query: "mortgage rate below 6%",
  match: ["mortgage", "6%"],
  fallback: 50,
} as const;
export const REQUEST_TIMEOUT_MS = 10000;
