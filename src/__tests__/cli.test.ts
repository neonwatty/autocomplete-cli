import { describe, it, expect } from "vitest";
import { execSync } from "child_process";
import { resolve } from "path";

const CLI_PATH = resolve(__dirname, "../../dist/index.js");

function runCli(args: string): { stdout: string; stderr: string; exitCode: number } {
  try {
    const stdout = execSync(`node ${CLI_PATH} ${args}`, {
      encoding: "utf-8",
      timeout: 10000,
    });
    return { stdout, stderr: "", exitCode: 0 };
  } catch (error: any) {
    return {
      stdout: error.stdout || "",
      stderr: error.stderr || "",
      exitCode: error.status || 1,
    };
  }
}

describe("CLI", () => {
  it("shows help with --help flag", () => {
    const { stdout, exitCode } = runCli("--help");

    expect(exitCode).toBe(0);
    expect(stdout).toContain("Query Google and YouTube autocomplete suggestions");
    expect(stdout).toContain("google");
    expect(stdout).toContain("youtube");
  });

  it("shows version with --version flag", () => {
    const { stdout, exitCode } = runCli("--version");

    expect(exitCode).toBe(0);
    expect(stdout.trim()).toBe("1.0.0");
  });

  it("shows google command help", () => {
    const { stdout, exitCode } = runCli("google --help");

    expect(exitCode).toBe(0);
    expect(stdout).toContain("Get Google autocomplete suggestions");
    expect(stdout).toContain("--lang");
    expect(stdout).toContain("--country");
  });

  it("shows youtube command help", () => {
    const { stdout, exitCode } = runCli("youtube --help");

    expect(exitCode).toBe(0);
    expect(stdout).toContain("Get YouTube autocomplete suggestions");
    expect(stdout).toContain("--lang");
    expect(stdout).toContain("--country");
  });

  it("runs without error when no command provided", () => {
    const { stdout, stderr, exitCode } = runCli("");

    // Commander shows help when no command is given (may be stdout or stderr)
    const output = stdout + stderr;
    expect(output).toContain("Usage:");
  });

  describe("error scenarios", () => {
    it("shows error for unknown command", () => {
      const { stderr, exitCode } = runCli("unknown");

      expect(exitCode).toBe(1);
      expect(stderr).toContain("unknown");
    });

    it("shows error when google command missing query", () => {
      const { stderr, exitCode } = runCli("google");

      expect(exitCode).toBe(1);
      expect(stderr).toContain("query");
    });

    it("shows error when youtube command missing query", () => {
      const { stderr, exitCode } = runCli("youtube");

      expect(exitCode).toBe(1);
      expect(stderr).toContain("query");
    });

    it("accepts short option flags", () => {
      const { stdout, exitCode } = runCli("google --help");

      expect(exitCode).toBe(0);
      expect(stdout).toContain("-l, --lang");
      expect(stdout).toContain("-c, --country");
    });
  });
});
