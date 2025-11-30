export const GOOGLE_BASE_URL = "https://suggestqueries.google.com/complete/search";
export const DUCKDUCKGO_BASE_URL = "https://duckduckgo.com/ac/";
export const AMAZON_BASE_URL = "https://completion.amazon.com/search/complete";
export const BING_BASE_URL = "https://api.bing.com/qsml.aspx";
export const DEFAULT_DELAY_MS = 100;

// Keep for backwards compatibility
export const BASE_URL = GOOGLE_BASE_URL;

let lastCallTime = 0;

export function resetRateLimiter(): void {
  lastCallTime = 0;
}

async function rateLimitedFetch(url: string, delayMs: number = DEFAULT_DELAY_MS): Promise<Response> {
  const now = Date.now();
  const elapsed = now - lastCallTime;
  if (elapsed < delayMs && lastCallTime > 0) {
    await new Promise(resolve => setTimeout(resolve, delayMs - elapsed));
  }
  lastCallTime = Date.now();
  return fetch(url);
}

export interface SuggestOptions {
  lang?: string;
  country?: string;
  delay?: number;
}

export type Source = "google" | "youtube" | "bing" | "amazon" | "duckduckgo";

export async function fetchGoogleSuggestions(
  query: string,
  options: SuggestOptions,
  isYouTube: boolean = false
): Promise<string[]> {
  const params = new URLSearchParams({
    client: "firefox",
    q: query,
  });

  if (isYouTube) {
    params.set("ds", "yt");
  }

  if (options.lang) {
    params.set("hl", options.lang);
  }

  if (options.country) {
    params.set("gl", options.country);
  }

  const url = `${GOOGLE_BASE_URL}?${params.toString()}`;
  const delayMs = options.delay ?? DEFAULT_DELAY_MS;

  const response = await rateLimitedFetch(url, delayMs);

  if (!response.ok) {
    throw new Error(`HTTP error: ${response.status}`);
  }

  const data = await response.json();

  // Response format: ["query", ["suggestion1", "suggestion2", ...]]
  if (Array.isArray(data) && Array.isArray(data[1])) {
    return data[1];
  }

  return [];
}

export async function fetchDuckDuckGoSuggestions(
  query: string,
  options: SuggestOptions
): Promise<string[]> {
  const params = new URLSearchParams({ q: query });

  const url = `${DUCKDUCKGO_BASE_URL}?${params.toString()}`;
  const delayMs = options.delay ?? DEFAULT_DELAY_MS;

  const response = await rateLimitedFetch(url, delayMs);

  if (!response.ok) {
    throw new Error(`HTTP error: ${response.status}`);
  }

  const data = await response.json();

  // Response format: [{"phrase":"suggestion1"},{"phrase":"suggestion2"}]
  if (Array.isArray(data)) {
    return data.map((item: { phrase: string }) => item.phrase).filter(Boolean);
  }

  return [];
}

export async function fetchAmazonSuggestions(
  query: string,
  options: SuggestOptions
): Promise<string[]> {
  const params = new URLSearchParams({
    "search-alias": "aps",
    client: "amazon-search-ui",
    mkt: "1",
    q: query,
  });

  const url = `${AMAZON_BASE_URL}?${params.toString()}`;
  const delayMs = options.delay ?? DEFAULT_DELAY_MS;

  const response = await rateLimitedFetch(url, delayMs);

  if (!response.ok) {
    throw new Error(`HTTP error: ${response.status}`);
  }

  const data = await response.json();

  // Response format: ["query", ["suggestion1", "suggestion2"], [], []]
  if (Array.isArray(data) && Array.isArray(data[1])) {
    return data[1];
  }

  return [];
}

export async function fetchBingSuggestions(
  query: string,
  options: SuggestOptions
): Promise<string[]> {
  const market = options.country ? `${options.lang || "en"}-${options.country.toUpperCase()}` : "en-US";
  const params = new URLSearchParams({
    Market: market,
    query: query,
  });

  const url = `${BING_BASE_URL}?${params.toString()}`;
  const delayMs = options.delay ?? DEFAULT_DELAY_MS;

  const response = await rateLimitedFetch(url, delayMs);

  if (!response.ok) {
    throw new Error(`HTTP error: ${response.status}`);
  }

  const text = await response.text();

  // Parse XML response - extract text from <Text>...</Text> elements
  const suggestions: string[] = [];
  const regex = /<Text>([^<]+)<\/Text>/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    suggestions.push(match[1]);
  }

  return suggestions;
}

// Unified fetch function for backwards compatibility
export async function fetchSuggestions(
  query: string,
  options: SuggestOptions,
  source: Source
): Promise<string[]> {
  switch (source) {
    case "google":
      return fetchGoogleSuggestions(query, options, false);
    case "youtube":
      return fetchGoogleSuggestions(query, options, true);
    case "duckduckgo":
      return fetchDuckDuckGoSuggestions(query, options);
    case "amazon":
      return fetchAmazonSuggestions(query, options);
    case "bing":
      return fetchBingSuggestions(query, options);
    default:
      throw new Error(`Unknown source: ${source}`);
  }
}

export function printSuggestions(suggestions: string[]): void {
  if (suggestions.length === 0) {
    console.log("No suggestions found.");
    return;
  }

  suggestions.forEach((s) => console.log(s));
}

export interface CommandResult {
  success: boolean;
  error?: string;
}

export async function handleCommand(
  query: string,
  options: SuggestOptions,
  source: Source
): Promise<CommandResult> {
  try {
    const suggestions = await fetchSuggestions(query, options, source);
    printSuggestions(suggestions);
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}
