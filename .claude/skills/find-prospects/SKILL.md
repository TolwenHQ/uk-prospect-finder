---
name: find-prospects
description: Find active UK limited companies in an area and sector (from Companies House) and flag which have no website or a weak one. Use when the user asks to find prospects, leads or businesses in a UK town or postcode.
argument-hint: "[sector] in [postcode districts or town]"
---

This is the cloned-repo version of the plugin's skill, so you can use `/find-prospects` without installing the plugin.

Read `skills/find-prospects/SKILL.md` in this project and follow it exactly, with one change: wherever it says `${CLAUDE_PLUGIN_ROOT}`, use this project's folder (`${CLAUDE_PROJECT_DIR}`). For example:

```bash
node "${CLAUDE_PROJECT_DIR}/scripts/find-prospects.mjs" --sector plumbing --area LS6
```

Arguments from the user: $ARGUMENTS
