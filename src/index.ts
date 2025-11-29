#!/usr/bin/env node

import { Command } from "commander";
import { fetchSuggestions, printSuggestions, SuggestOptions } from "./suggest.js";

const program = new Command();

program
  .name("autocomplete")
  .description("Query Google and YouTube autocomplete suggestions")
  .version("1.0.0");

program
  .command("google")
  .description("Get Google autocomplete suggestions")
  .argument("<query>", "Search query")
  .option("-l, --lang <code>", "Language code (e.g., en, de, es)")
  .option("-c, --country <code>", "Country code (e.g., us, uk, in)")
  .action(async (query: string, options: SuggestOptions) => {
    try {
      const suggestions = await fetchSuggestions(query, options, "google");
      printSuggestions(suggestions);
    } catch (error) {
      console.error("Error:", (error as Error).message);
      process.exit(1);
    }
  });

program
  .command("youtube")
  .description("Get YouTube autocomplete suggestions")
  .argument("<query>", "Search query")
  .option("-l, --lang <code>", "Language code (e.g., en, de, es)")
  .option("-c, --country <code>", "Country code (e.g., us, uk, in)")
  .action(async (query: string, options: SuggestOptions) => {
    try {
      const suggestions = await fetchSuggestions(query, options, "youtube");
      printSuggestions(suggestions);
    } catch (error) {
      console.error("Error:", (error as Error).message);
      process.exit(1);
    }
  });

program.parse();
