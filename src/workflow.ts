import { loadEnvironment } from "./config/environment.js";
import { runWorkflow } from "./core/orchestrator.js";

try {
 const environment = loadEnvironment();
 const status = await runWorkflow(environment);
 if (status !== "PASSED") process.exitCode = 1;
} catch (error) {
 console.error(error instanceof Error ? error.message : String(error));
 process.exitCode = 1;
}
