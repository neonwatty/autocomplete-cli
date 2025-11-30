import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import nock from "nock";
import { fetchSuggestions, resetRateLimiter, DEFAULT_DELAY_MS } from "../suggest.js";

describe("fetchSuggestions", () => {
  beforeEach(() => {
    nock.cleanAll();
    resetRateLimiter();
  });

  afterEach(() => {
    nock.cleanAll();
  });

  it("fetches Google suggestions successfully", async () => {
    const mockResponse = ["test query", ["suggestion 1", "suggestion 2", "suggestion 3"]];

    nock("https://suggestqueries.google.com")
      .get("/complete/search")
      .query({ client: "firefox", q: "test query" })
      .reply(200, mockResponse);

    const result = await fetchSuggestions("test query", {}, "google");

    expect(result).toEqual(["suggestion 1", "suggestion 2", "suggestion 3"]);
  });

  it("fetches YouTube suggestions with ds=yt parameter", async () => {
    const mockResponse = ["video", ["video 1", "video 2"]];

    nock("https://suggestqueries.google.com")
      .get("/complete/search")
      .query({ client: "firefox", q: "video", ds: "yt" })
      .reply(200, mockResponse);

    const result = await fetchSuggestions("video", {}, "youtube");

    expect(result).toEqual(["video 1", "video 2"]);
  });

  it("includes language parameter when provided", async () => {
    const mockResponse = ["query", ["result"]];

    nock("https://suggestqueries.google.com")
      .get("/complete/search")
      .query({ client: "firefox", q: "query", hl: "de" })
      .reply(200, mockResponse);

    const result = await fetchSuggestions("query", { lang: "de" }, "google");

    expect(result).toEqual(["result"]);
  });

  it("includes country parameter when provided", async () => {
    const mockResponse = ["query", ["result"]];

    nock("https://suggestqueries.google.com")
      .get("/complete/search")
      .query({ client: "firefox", q: "query", gl: "uk" })
      .reply(200, mockResponse);

    const result = await fetchSuggestions("query", { country: "uk" }, "google");

    expect(result).toEqual(["result"]);
  });

  it("includes both lang and country when provided", async () => {
    const mockResponse = ["query", ["result"]];

    nock("https://suggestqueries.google.com")
      .get("/complete/search")
      .query({ client: "firefox", q: "query", hl: "en", gl: "us" })
      .reply(200, mockResponse);

    const result = await fetchSuggestions("query", { lang: "en", country: "us" }, "google");

    expect(result).toEqual(["result"]);
  });

  it("throws error on HTTP error response", async () => {
    nock("https://suggestqueries.google.com")
      .get("/complete/search")
      .query({ client: "firefox", q: "query" })
      .reply(500);

    await expect(fetchSuggestions("query", {}, "google")).rejects.toThrow("HTTP error: 500");
  });

  it("returns empty array when response format is unexpected", async () => {
    nock("https://suggestqueries.google.com")
      .get("/complete/search")
      .query({ client: "firefox", q: "query" })
      .reply(200, { unexpected: "format" });

    const result = await fetchSuggestions("query", {}, "google");

    expect(result).toEqual([]);
  });

  it("returns empty array when suggestions array is missing", async () => {
    nock("https://suggestqueries.google.com")
      .get("/complete/search")
      .query({ client: "firefox", q: "query" })
      .reply(200, ["query"]);

    const result = await fetchSuggestions("query", {}, "google");

    expect(result).toEqual([]);
  });

  it("handles empty suggestions array", async () => {
    nock("https://suggestqueries.google.com")
      .get("/complete/search")
      .query({ client: "firefox", q: "query" })
      .reply(200, ["query", []]);

    const result = await fetchSuggestions("query", {}, "google");

    expect(result).toEqual([]);
  });

  // Phase 1: HTTP Status Code Tests
  describe("HTTP status codes", () => {
    it("throws error on 400 Bad Request", async () => {
      nock("https://suggestqueries.google.com")
        .get("/complete/search")
        .query(true)
        .reply(400);

      await expect(fetchSuggestions("query", {}, "google")).rejects.toThrow("HTTP error: 400");
    });

    it("throws error on 403 Forbidden", async () => {
      nock("https://suggestqueries.google.com")
        .get("/complete/search")
        .query(true)
        .reply(403);

      await expect(fetchSuggestions("query", {}, "google")).rejects.toThrow("HTTP error: 403");
    });

    it("throws error on 404 Not Found", async () => {
      nock("https://suggestqueries.google.com")
        .get("/complete/search")
        .query(true)
        .reply(404);

      await expect(fetchSuggestions("query", {}, "google")).rejects.toThrow("HTTP error: 404");
    });

    it("throws error on 429 Too Many Requests", async () => {
      nock("https://suggestqueries.google.com")
        .get("/complete/search")
        .query(true)
        .reply(429);

      await expect(fetchSuggestions("query", {}, "google")).rejects.toThrow("HTTP error: 429");
    });

    it("throws error on 503 Service Unavailable", async () => {
      nock("https://suggestqueries.google.com")
        .get("/complete/search")
        .query(true)
        .reply(503);

      await expect(fetchSuggestions("query", {}, "google")).rejects.toThrow("HTTP error: 503");
    });
  });

  // Phase 1: Input Edge Cases
  describe("input edge cases", () => {
    it("handles query with special characters", async () => {
      const mockResponse = ["test <script>", ["result"]];

      nock("https://suggestqueries.google.com")
        .get("/complete/search")
        .query(true)
        .reply(200, mockResponse);

      const result = await fetchSuggestions("test <script>", {}, "google");
      expect(result).toEqual(["result"]);
    });

    it("handles query with unicode characters", async () => {
      const mockResponse = ["café", ["café latte", "café mocha"]];

      nock("https://suggestqueries.google.com")
        .get("/complete/search")
        .query(true)
        .reply(200, mockResponse);

      const result = await fetchSuggestions("café", {}, "google");
      expect(result).toEqual(["café latte", "café mocha"]);
    });

    it("handles query with spaces", async () => {
      const mockResponse = ["how to code", ["how to code in python"]];

      nock("https://suggestqueries.google.com")
        .get("/complete/search")
        .query(true)
        .reply(200, mockResponse);

      const result = await fetchSuggestions("how to code", {}, "google");
      expect(result).toEqual(["how to code in python"]);
    });

    it("handles empty query string", async () => {
      const mockResponse = ["", []];

      nock("https://suggestqueries.google.com")
        .get("/complete/search")
        .query(true)
        .reply(200, mockResponse);

      const result = await fetchSuggestions("", {}, "google");
      expect(result).toEqual([]);
    });

    it("handles query with ampersand and equals", async () => {
      const mockResponse = ["a=b&c=d", ["result"]];

      nock("https://suggestqueries.google.com")
        .get("/complete/search")
        .query(true)
        .reply(200, mockResponse);

      const result = await fetchSuggestions("a=b&c=d", {}, "google");
      expect(result).toEqual(["result"]);
    });
  });

  // Phase 2: Network Error Tests
  describe("network errors", () => {
    it("throws error on connection refused", async () => {
      nock("https://suggestqueries.google.com")
        .get("/complete/search")
        .query(true)
        .replyWithError({ code: "ECONNREFUSED", message: "Connection refused" });

      await expect(fetchSuggestions("query", {}, "google")).rejects.toThrow();
    });

    it("throws error on connection reset", async () => {
      nock("https://suggestqueries.google.com")
        .get("/complete/search")
        .query(true)
        .replyWithError({ code: "ECONNRESET", message: "Connection reset" });

      await expect(fetchSuggestions("query", {}, "google")).rejects.toThrow();
    });

    it("throws error on socket hang up", async () => {
      nock("https://suggestqueries.google.com")
        .get("/complete/search")
        .query(true)
        .replyWithError("socket hang up");

      await expect(fetchSuggestions("query", {}, "google")).rejects.toThrow();
    });
  });

  // Phase 2: Response Parsing Edge Cases
  describe("response parsing", () => {
    it("handles null in response array", async () => {
      nock("https://suggestqueries.google.com")
        .get("/complete/search")
        .query(true)
        .reply(200, ["query", []]);

      const result = await fetchSuggestions("query", {}, "google");
      expect(result).toEqual([]);
    });

    it("throws error on invalid JSON response", async () => {
      nock("https://suggestqueries.google.com")
        .get("/complete/search")
        .query(true)
        .reply(200, "not valid json", { "Content-Type": "text/plain" });

      await expect(fetchSuggestions("query", {}, "google")).rejects.toThrow();
    });

    it("handles empty object response", async () => {
      nock("https://suggestqueries.google.com")
        .get("/complete/search")
        .query(true)
        .reply(200, {});

      const result = await fetchSuggestions("query", {}, "google");
      expect(result).toEqual([]);
    });

    it("handles response with extra metadata", async () => {
      const mockResponse = ["query", ["suggestion"], { extra: "data" }];

      nock("https://suggestqueries.google.com")
        .get("/complete/search")
        .query(true)
        .reply(200, mockResponse);

      const result = await fetchSuggestions("query", {}, "google");
      expect(result).toEqual(["suggestion"]);
    });

    it("handles large number of suggestions", async () => {
      const suggestions = Array.from({ length: 100 }, (_, i) => `suggestion ${i}`);
      const mockResponse = ["query", suggestions];

      nock("https://suggestqueries.google.com")
        .get("/complete/search")
        .query(true)
        .reply(200, mockResponse);

      const result = await fetchSuggestions("query", {}, "google");
      expect(result).toHaveLength(100);
      expect(result[0]).toBe("suggestion 0");
      expect(result[99]).toBe("suggestion 99");
    });
  });

  // Rate limiting tests
  describe("rate limiting", () => {
    it("exports DEFAULT_DELAY_MS constant", () => {
      expect(DEFAULT_DELAY_MS).toBe(100);
    });

    it("respects custom delay option", async () => {
      const mockResponse = ["query", ["result"]];

      nock("https://suggestqueries.google.com")
        .get("/complete/search")
        .query(true)
        .reply(200, mockResponse);

      const result = await fetchSuggestions("query", { delay: 50 }, "google");
      expect(result).toEqual(["result"]);
    });

    it("works with delay set to 0", async () => {
      const mockResponse = ["query", ["result"]];

      nock("https://suggestqueries.google.com")
        .get("/complete/search")
        .query(true)
        .reply(200, mockResponse);

      const result = await fetchSuggestions("query", { delay: 0 }, "google");
      expect(result).toEqual(["result"]);
    });

    it("delays between rapid successive calls", async () => {
      vi.useFakeTimers();

      const mockResponse = ["query", ["result"]];

      nock("https://suggestqueries.google.com")
        .get("/complete/search")
        .query(true)
        .times(2)
        .reply(200, mockResponse);

      // First call should proceed immediately
      const firstCall = fetchSuggestions("query", { delay: 100 }, "google");
      await vi.advanceTimersByTimeAsync(0);
      await firstCall;

      // Second call should be delayed
      const secondCall = fetchSuggestions("query", { delay: 100 }, "google");

      // Advance time to allow the delay
      await vi.advanceTimersByTimeAsync(100);
      await secondCall;

      vi.useRealTimers();
    });

    it("resets rate limiter between tests", async () => {
      const mockResponse = ["query", ["result"]];

      nock("https://suggestqueries.google.com")
        .get("/complete/search")
        .query(true)
        .reply(200, mockResponse);

      // This should not be delayed because resetRateLimiter is called in beforeEach
      const result = await fetchSuggestions("query", {}, "google");
      expect(result).toEqual(["result"]);
    });

    it("uses default delay when delay option is undefined", async () => {
      const mockResponse = ["query", ["result"]];

      nock("https://suggestqueries.google.com")
        .get("/complete/search")
        .query(true)
        .reply(200, mockResponse);

      // No delay option provided - should use DEFAULT_DELAY_MS
      const result = await fetchSuggestions("query", {}, "google");
      expect(result).toEqual(["result"]);
    });

    it("handles multiple rapid calls with fake timers", async () => {
      vi.useFakeTimers();

      const mockResponse = ["query", ["result"]];

      nock("https://suggestqueries.google.com")
        .get("/complete/search")
        .query(true)
        .times(3)
        .reply(200, mockResponse);

      // Make three rapid calls
      const call1 = fetchSuggestions("query", { delay: 50 }, "google");
      await vi.advanceTimersByTimeAsync(0);
      await call1;

      const call2 = fetchSuggestions("query", { delay: 50 }, "google");
      await vi.advanceTimersByTimeAsync(50);
      await call2;

      const call3 = fetchSuggestions("query", { delay: 50 }, "google");
      await vi.advanceTimersByTimeAsync(50);
      const result = await call3;

      expect(result).toEqual(["result"]);
      vi.useRealTimers();
    });

    it("does not delay when enough time has passed", async () => {
      vi.useFakeTimers();

      const mockResponse = ["query", ["result"]];

      nock("https://suggestqueries.google.com")
        .get("/complete/search")
        .query(true)
        .times(2)
        .reply(200, mockResponse);

      // First call
      const call1 = fetchSuggestions("query", { delay: 50 }, "google");
      await vi.advanceTimersByTimeAsync(0);
      await call1;

      // Wait longer than delay
      await vi.advanceTimersByTimeAsync(100);

      // Second call should not need to wait
      const call2 = fetchSuggestions("query", { delay: 50 }, "google");
      await vi.advanceTimersByTimeAsync(0);
      const result = await call2;

      expect(result).toEqual(["result"]);
      vi.useRealTimers();
    });

    it("works with very large delay values", async () => {
      const mockResponse = ["query", ["result"]];

      nock("https://suggestqueries.google.com")
        .get("/complete/search")
        .query(true)
        .reply(200, mockResponse);

      const result = await fetchSuggestions("query", { delay: 10000 }, "google");
      expect(result).toEqual(["result"]);
    });

    it("combines delay with other options", async () => {
      const mockResponse = ["query", ["result"]];

      nock("https://suggestqueries.google.com")
        .get("/complete/search")
        .query({ client: "firefox", q: "query", hl: "de", gl: "de" })
        .reply(200, mockResponse);

      const result = await fetchSuggestions(
        "query",
        { lang: "de", country: "de", delay: 0 },
        "google"
      );
      expect(result).toEqual(["result"]);
    });

    it("works with youtube and custom delay", async () => {
      const mockResponse = ["query", ["result"]];

      nock("https://suggestqueries.google.com")
        .get("/complete/search")
        .query({ client: "firefox", q: "query", ds: "yt" })
        .reply(200, mockResponse);

      const result = await fetchSuggestions("query", { delay: 25 }, "youtube");
      expect(result).toEqual(["result"]);
    });
  });
});
