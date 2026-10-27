import { exploreApplication } from "../tools/browser-explorer.tool.js";
import type { ExplorationResult } from "../schemas/exploration.schema.js";

export async function explore(baseURL: string, headless: boolean): Promise<ExplorationResult> {
 return exploreApplication(baseURL, headless);
}
