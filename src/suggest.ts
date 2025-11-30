export const BASE_URL = "https://suggestqueries.google.com/complete/search";

export interface SuggestOptions {
  lang?: string;
  country?: string;
}

export async function fetchSuggestions(
  query: string,
  options: SuggestOptions,
  source: "google" | "youtube"
): Promise<string[]> {
  const params = new URLSearchParams({
    client: "firefox",
    q: query,
  });

  if (source === "youtube") {
    params.set("ds", "yt");
  }

  if (options.lang) {
    params.set("hl", options.lang);
  }

  if (options.country) {
    params.set("gl", options.country);
  }

  const url = `${BASE_URL}?${params.toString()}`;

  const response = await fetch(url);

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
  source: "google" | "youtube"
): Promise<CommandResult> {
  try {
    const suggestions = await fetchSuggestions(query, options, source);
    printSuggestions(suggestions);
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}
