import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";
import { describe, expect, it } from "vitest";

interface WorkflowStep {
  run?: string;
  uses?: string;
  with?: Record<string, unknown>;
}

interface WorkflowJob {
  needs?: string;
  permissions?: Record<string, string>;
  concurrency?: {
    group: string;
    "cancel-in-progress": boolean;
  };
  environment?: {
    name: string;
    url: string;
  };
  steps: WorkflowStep[];
}

interface PagesWorkflow {
  on: {
    push: { branches: string[] };
    workflow_dispatch: null;
  };
  permissions: Record<string, string>;
  jobs: {
    build: WorkflowJob;
    deploy: WorkflowJob;
  };
}

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const workflowPath = resolve(projectRoot, ".github/workflows/deploy-pages.yml");
const workflow = parse(readFileSync(workflowPath, "utf8")) as PagesWorkflow;

describe("GitHub Pages deployment workflow", () => {
  it("deploys main manually or after a push", () => {
    expect(workflow.on.push.branches).toEqual(["main"]);
    expect(workflow.on).toHaveProperty("workflow_dispatch", null);
  });

  it("isolates privileged Pages permissions from dependency execution", () => {
    expect(workflow.permissions).toEqual({});
    expect(workflow.jobs.build.permissions).toEqual({ contents: "read" });
    expect(workflow.jobs.deploy.permissions).toEqual({
      pages: "write",
      "id-token": "write",
    });
  });

  it("cancels obsolete builds without cancelling an active deployment", () => {
    expect(workflow.jobs.build.concurrency).toEqual({
      group: "pages-build-${{ github.ref }}",
      "cancel-in-progress": true,
    });
    expect(workflow.jobs.deploy.concurrency).toEqual({
      group: "pages-deploy",
      "cancel-in-progress": false,
    });
  });

  it("blocks deployment until every project quality gate succeeds", () => {
    const commands = workflow.jobs.build.steps.flatMap(({ run }) => (run ? [run] : []));

    expect(commands).toContain("npm ci");
    expect(commands).toContain("npx playwright install --with-deps chromium");
    expect(commands).toContain("npm run check");
    expect(commands).toContain("npm test");
    expect(commands).toContain("npm run work:pdf -- --all");
    expect(commands).toContain("npm run build");
    expect(commands).toContain("npm run verify:build");
    expect(commands).toContain("npm run test:e2e");

    const pdfIndex = workflow.jobs.build.steps.findIndex(({ run }) => run === "npm run work:pdf -- --all");
    const buildIndex = workflow.jobs.build.steps.findIndex(({ run }) => run === "npm run build");
    const verifyIndex = workflow.jobs.build.steps.findIndex(({ run }) => run === "npm run verify:build");
    const e2eIndex = workflow.jobs.build.steps.findIndex(({ run }) => run === "npm run test:e2e");
    const uploadIndex = workflow.jobs.build.steps.findIndex(({ uses }) =>
      uses?.startsWith("actions/upload-pages-artifact@"),
    );
    expect(pdfIndex).toBeGreaterThan(-1);
    expect(pdfIndex).toBeLessThan(buildIndex);
    expect(buildIndex).toBeLessThan(verifyIndex);
    expect(verifyIndex).toBeLessThan(e2eIndex);
    expect(e2eIndex).toBeLessThan(uploadIndex);
    expect(workflow.jobs.deploy.needs).toBe("build");
  });

  it("allows only the expected SHA-pinned actions and uploads generated output", () => {
    const actionReferences = Object.values(workflow.jobs)
      .flatMap(({ steps }) => steps)
      .flatMap(({ uses }) => (uses ? [uses] : []));
    const uploadStep = workflow.jobs.build.steps.find(({ uses }) =>
      uses?.startsWith("actions/upload-pages-artifact@"),
    );

    expect(actionReferences).toEqual([
      "actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1",
      "actions/setup-node@249970729cb0ef3589644e2896645e5dc5ba9c38",
      "actions/upload-pages-artifact@7b1f4a764d45c48632c6b24a0339c27f5614fb0b",
      "actions/deploy-pages@368f82528645a54fb793d4d04e342629a3f51346",
    ]);
    expect(uploadStep?.with).toEqual({ path: "./dist" });
  });

  it("publishes through the protected GitHub Pages environment", () => {
    expect(workflow.jobs.deploy.environment).toEqual({
      name: "github-pages",
      url: "${{ steps.deployment.outputs.page_url }}",
    });
  });
});
