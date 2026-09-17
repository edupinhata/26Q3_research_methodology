import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const execFileAsync = promisify(execFile);
const projectRoot = resolve(import.meta.dirname, "../..");
const cliPath = resolve(projectRoot, "scripts/academic-workflow-cli.mjs");

describe("academic workflow CLI", () => {
  it("documents the three user commands and the all-documents PDF mode", async () => {
    const { stdout } = await execFileAsync(process.execPath, [cliPath, "--help"], { cwd: projectRoot });

    expect(stdout).toContain("work:new -- <id>");
    expect(stdout).toContain("work:pdf -- <id>");
    expect(stdout).toContain("work:pdf -- --all");
    expect(stdout).toContain("work:finalize -- <id>");

    const commandHelp = await execFileAsync(process.execPath, [cliPath, "new", "--help"], { cwd: projectRoot });
    expect(commandHelp.stdout).toContain("work:new -- <id>");
  });
});
