import { describe, it, expect, beforeEach, afterEach } from "vitest";
import nock from "nock";
import { fetchSuggestions, BASE_URL } from "../suggest.js";

describe("fetchSuggestions", () => {
  beforeEach(() => {
    nock.cleanAll();
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
});
