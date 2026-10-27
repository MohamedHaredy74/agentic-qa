import { defineConfig } from "@playwright/test";

export default defineConfig({
 testDir: "./generated/tests",
 fullyParallel: false,
 workers: 1,
 timeout: 30_000,
 expect: { timeout: 5_000 },
 use: { browserName: "chromium", headless: process.env.HEADLESS !== "false", trace: "retain-on-failure", screenshot: "only-on-failure", actionTimeout: 10_000 },
 reporter: [["list"], ["json", { outputFile: process.env.PLAYWRIGHT_JSON_OUTPUT_NAME ?? "artifacts/playwright-results.json" }], ["html", { outputFolder: process.env.PLAYWRIGHT_HTML_OUTPUT_DIR ?? "artifacts/html-report", open: "never" }]],
 outputDir: process.env.PLAYWRIGHT_TEST_OUTPUT_DIR ?? "artifacts/test-results",
});
