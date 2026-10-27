# Agentic QA Framework

A TypeScript framework that turns a user story and application URL into traceable QA scenarios and reviewed Playwright tests. Deterministic orchestration coordinates AI-assisted analysis, read-only browser inspection, code validation, human approval, test execution, failure analysis, and reporting.

## Workflow and components

1. **Requirements Analyst** extracts only stated business rules and records ambiguities.
2. **Test Designer** creates scenarios and validates unique IDs, rule references, and rule coverage.
3. **Browser Explorer** inspects the configured application without intentionally submitting forms or changing application data.
4. **Automation Engineer** generates a Playwright TypeScript spec using observed locator evidence.
5. **Validation and approval** checks the generated code and displays it for review. Execution requires typing `APPROVE` in an interactive terminal.
6. **Playwright Executor** runs the approved spec with a fixed CLI and records the results.
7. **Failure Analyst and report generator** classify failures conservatively and create Markdown and JSON reports.

Key implementation areas are `src/agents/`, `src/schemas/`, `src/tools/`, `src/core/`, and `src/reports/`. The workflow order is controlled by TypeScript; an LLM does not decide which stage runs next.

## Prerequisites

- Node.js 20 or later.
- An OpenAI API key with access to the selected model.
- Network access to the configured application.
- Chromium installed through Playwright.

## Installation and setup

Run these commands from the `agentic-qa` project directory:

```bash
npm install
npx playwright install chromium
npm run typecheck
```

Copy `.env.example` to `.env`, then set the values appropriate for your environment. Keep `.env` private; it is excluded by `.gitignore`. Never put API keys in source code, issue reports, or chat messages.

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `OPENAI_API_KEY` | Yes | — | API credential for the Agents SDK. |
| `QA_MODEL` | No | `gpt-4.1-mini` | Model used by the agents. |
| `BASE_URL` | No | `https://demo.playwright.dev/todomvc` | Application to inspect and test. HTTPS is required except loopback development URLs. |
| `HEADLESS` | No | `true` | Run Chromium headlessly when `true`. |
| `QA_APPROVAL_MODE` | No | `interactive` | `interactive` asks for the exact word `APPROVE`; `manual` does not authorize execution. |
| `QA_STORY_PATH` | No | `requirements/story.md` | User-story file, relative to the project directory unless absolute. |

The starter story is `requirements/story.md`. Review or replace it before starting a run.

## Run the workflow

```bash
npm run qa
```

Review the generated spec printed in the terminal. Type `APPROVE` only after reviewing and accepting it; any other response prevents test execution. Run from an interactive terminal because non-interactive sessions cannot approve execution.

Generated test source is saved under `generated/tests/`. Run static TypeScript checks with:

```bash
npm run typecheck
```

`npm run test:e2e` executes existing specs under `generated/tests/`; it does **not** generate tests or invoke the agent workflow:

```bash
npm run test:e2e
```

## Artifacts and reports

Each workflow run gets a unique directory under `artifacts/<run-id>/`. It can contain the workflow state, requirements analysis, test plan, browser exploration, automation metadata and source copy, Playwright JSON results, failure analysis, and final `qa-report.md` and `qa-report.json`. `generated/tests/` also holds executable specs for Playwright.

The final status is `PASSED`, `FAILED`, `BLOCKED`, or `INCOMPLETE`. A passing status requires actual successful test results; skipped or missing execution is not reported as passed.

## Troubleshooting

- **Missing or rejected API key:** confirm `OPENAI_API_KEY` is set in the project `.env` and is valid for the configured model. A placeholder key is rejected at startup; an invalid or revoked key may result in HTTP 401. Rotate any key that has been exposed.
- **Application URL error:** check `BASE_URL` is an absolute URL. The explorer restricts navigation; private network destinations are blocked except explicitly selected loopback hosts.
- **Story file not found:** check `QA_STORY_PATH` and run the command from the project directory, or set an absolute story path.
- **Chromium launch failure:** install the browser with `npx playwright install chromium` and confirm the machine supports Playwright's browser dependencies.
- **Workflow blocked at approval:** use an interactive terminal and type `APPROVE` exactly. `QA_APPROVAL_MODE=manual` intentionally does not grant approval.
- **Test failures:** inspect the run's Playwright JSON, `test-results/`, and HTML report, then review the failure-analysis evidence. The framework does not automatically alter tests to make them pass.

## Security limitations

Browser inspection is read-only by default and constrains origins/private destinations, but this is not a general-purpose hardened browser sandbox. Generated source is checked for syntax, types, imports, and prohibited constructs, but static checks are **not** a security sandbox. Human approval is required, yet generated tests execute as local Node.js code with the current user's permissions. Use a disposable/isolated environment, least-privilege credentials, and non-production test data. Do not provide production secrets. The framework does not yet provide OS-level execution isolation.

## Future enhancements

Potential follow-ups include accessibility and visual testing agents, API tests, test-data generation, CI integrations, richer reporting, approval dashboards, observability/cost tracking, regression selection, and resumable workflow checkpoints. These are not part of the current MVP.
