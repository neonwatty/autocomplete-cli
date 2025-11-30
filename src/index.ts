#!/usr/bin/env node

import { Command } from "commander";
import { handleCommand, SuggestOptions } from "./suggest.js";

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
    const result = await handleCommand(query, options, "google");
    if (!result.success) {
      console.error("Error:", result.error);
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
    const result = await handleCommand(query, options, "youtube");
    if (!result.success) {
      console.error("Error:", result.error);
      process.exit(1);
    }
  });

program.parse();
