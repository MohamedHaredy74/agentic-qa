import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { WorkflowState } from "./workflow-state.js";

export class ArtifactManager {
 readonly runDirectory: string;
 constructor(runId: string, root = "artifacts") { this.runDirectory = path.resolve(root, runId); }
 async initialize(): Promise<void> { await Promise.all(["generated/tests", "html-report", "test-results"].map((dir) => mkdir(path.join(this.runDirectory, dir), { recursive: true }))); }
 async writeJson(name: string, value: unknown): Promise<void> { await writeFile(path.join(this.runDirectory, name), `${JSON.stringify(value, null, 2)}\n`, "utf8"); }
 async writeText(name: string, value: string): Promise<void> { await writeFile(path.join(this.runDirectory, name), value, "utf8"); }
 async persistState(state: WorkflowState): Promise<void> { await this.writeJson("workflow-state.json", state); }
}
