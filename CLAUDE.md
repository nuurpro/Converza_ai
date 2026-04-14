# Converza — Claude Code Instructions

## gstack

Use the `/browse` skill from gstack for all web browsing tasks. Never use `mcp__claude-in-chrome__*` tools directly.

If gstack skills aren't working, run the following to build the binary and register skills:

```bash
cd .claude/skills/gstack && ./setup
```

Available gstack skills:

- `/office-hours` — Strategic planning and prioritization session
- `/plan-ceo-review` — CEO-level review of a plan or proposal
- `/plan-eng-review` — Engineering review of a technical plan
- `/plan-design-review` — Design review of a plan
- `/design-consultation` — Design consultation and advice
- `/review` — Code review
- `/ship` — Ship a feature end-to-end
- `/land-and-deploy` — Land and deploy a change
- `/canary` — Canary deployment workflow
- `/benchmark` — Run and analyze benchmarks
- `/browse` — Web browsing (use this instead of mcp__claude-in-chrome__* tools)
- `/qa` — Full QA workflow
- `/qa-only` — QA without code changes
- `/design-review` — Review a design implementation
- `/setup-browser-cookies` — Set up browser cookies for authenticated browsing
- `/setup-deploy` — Set up deployment configuration
- `/retro` — Retrospective on recent work
- `/investigate` — Deep investigation of an issue or codebase
- `/document-release` — Document a release
- `/codex` — Codex-style code generation
- `/cso` — Chief Strategy Officer review
- `/careful` — Extra-careful mode for high-risk changes
- `/freeze` — Freeze a branch or file from changes
- `/guard` — Guard a file or pattern from accidental changes
- `/unfreeze` — Unfreeze a previously frozen branch or file
- `/gstack-upgrade` — Upgrade gstack to the latest version
