import { chromium } from "@playwright/test";
import { isIP } from "node:net";
import { lookup } from "node:dns/promises";
import { ExplorationResultSchema, type ExplorationResult } from "../schemas/exploration.schema.js";

function isPrivateHost(hostname: string): boolean {
 const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");
 if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local")) return true;
 if (!isIP(host)) return false;
 const octets = host.split(".").map(Number);
 if (octets.length !== 4) return host === "::1" || host.startsWith("fc") || host.startsWith("fd") || host.startsWith("fe80:");
 return octets[0] === 10 || octets[0] === 127 || (octets[0] === 192 && octets[1] === 168) || (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) || (octets[0] === 169 && octets[1] === 254) || octets[0] === 0;
}

export async function exploreApplication(baseURL: string, headless: boolean): Promise<ExplorationResult> {
 const target = new URL(baseURL);
 if (target.protocol !== "https:" && target.hostname !== "localhost" && target.hostname !== "127.0.0.1") throw new Error("Browser exploration requires HTTPS except for loopback development URLs.");
 if (isPrivateHost(target.hostname) && target.hostname !== "localhost" && target.hostname !== "127.0.0.1") throw new Error("Private network navigation is blocked.");
 const browser = await chromium.launch({ headless });
 try {
  const page = await browser.newPage();
    await page.route("**/*", async (route) => {
     const requestUrl = new URL(route.request().url());
     const navigation = route.request().isNavigationRequest();
     const localTarget = target.hostname === "localhost" || target.hostname === "127.0.0.1";
      let privateResolution = isPrivateHost(requestUrl.hostname);
      if (!privateResolution && !isIP(requestUrl.hostname)) {
       try { privateResolution = (await lookup(requestUrl.hostname, { all: true })).some((address) => isPrivateHost(address.address)); }
       catch { await route.abort("failed"); return; }
      }
      if ((navigation && requestUrl.origin !== target.origin) || (requestUrl.protocol !== "https:" && !(localTarget && requestUrl.origin === target.origin)) || (privateResolution && !(localTarget && requestUrl.origin === target.origin))) {
        await route.abort("blockedbyclient");
        return;
     }
     await route.continue();
    });
  await page.goto(target.href, { waitUntil: "domcontentloaded", timeout: 30_000 });
  const data = await page.evaluate(() => {
   const elements = Array.from(document.querySelectorAll("input, button, a, [role], select, textarea")).slice(0, 100).map((el) => {
    const e = el as HTMLElement;
    const aria = e.getAttribute("aria-label");
    const label = e.getAttribute("placeholder") || e.getAttribute("aria-label") || e.innerText?.trim() || "";
    const role = e.getAttribute("role") || ({ INPUT: "textbox", BUTTON: "button", A: "link", SELECT: "combobox", TEXTAREA: "textbox" } as Record<string, string>)[e.tagName] || null;
    const testId = e.getAttribute("data-testid");
    const locator = testId ? `[data-testid="${testId}"]` : aria ? `[aria-label="${aria}"]` : e.getAttribute("placeholder") ? `[placeholder="${e.getAttribute("placeholder")}"]` : role && label ? `getByRole('${role}', { name: ${JSON.stringify(label)} })` : e.tagName.toLowerCase();
    return { role, accessibleName: label || null, testId, locator, confidence: (testId || aria || label) ? 0.9 : 0.4 };
   });
   return { title: document.title, elements };
  });
  return ExplorationResultSchema.parse({ pages: [{ url: page.url(), title: data.title, elements: data.elements }], observations: [`Inspected ${data.elements.length} interactive elements without submitting forms.`], limitations: ["Exploration is read-only and inspects only the initial page."] });
 } finally { await browser.close(); }
}
