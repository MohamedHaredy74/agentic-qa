import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";

export async function requestApproval(mode: "interactive" | "manual", prompt: string): Promise<boolean> {
 if (mode === "manual") { console.log(`${prompt}\nApproval required. Re-run with QA_APPROVAL_MODE=interactive to approve in terminal.`); return false; }
 if (!stdin.isTTY || !stdout.isTTY) { console.log(`${prompt}\nApproval denied because no interactive terminal is available.`); return false; }
 const rl = createInterface({ input: stdin, output: stdout });
 try { const answer = await rl.question(`${prompt}\nType APPROVE to continue: `); return answer.trim() === "APPROVE"; } finally { rl.close(); }
}
