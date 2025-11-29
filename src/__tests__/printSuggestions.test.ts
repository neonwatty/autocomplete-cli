import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { printSuggestions } from "../suggest.js";

describe("printSuggestions", () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it("prints 'No suggestions found.' for empty array", () => {
    printSuggestions([]);

    expect(consoleSpy).toHaveBeenCalledTimes(1);
    expect(consoleSpy).toHaveBeenCalledWith("No suggestions found.");
  });

  it("prints each suggestion on its own line", () => {
    printSuggestions(["suggestion 1", "suggestion 2", "suggestion 3"]);

    expect(consoleSpy).toHaveBeenCalledTimes(3);
    expect(consoleSpy).toHaveBeenNthCalledWith(1, "suggestion 1");
    expect(consoleSpy).toHaveBeenNthCalledWith(2, "suggestion 2");
    expect(consoleSpy).toHaveBeenNthCalledWith(3, "suggestion 3");
  });

  it("prints single suggestion correctly", () => {
    printSuggestions(["only one"]);

    expect(consoleSpy).toHaveBeenCalledTimes(1);
    expect(consoleSpy).toHaveBeenCalledWith("only one");
  });
});
