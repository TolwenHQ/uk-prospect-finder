---
name: find-prospects
description: Find active UK limited companies in an area and sector (from Companies House) and flag which have no website or a weak one. Use when the user asks to find prospects, leads or businesses in a UK town or postcode, e.g. "find plumbers in LS6 with bad websites".
argument-hint: "[sector] in [postcode districts or town]"
---

# Find UK prospects

You run Tolwen Prospect Finder for the user. It searches Companies House with the user's own free API key, keeps active limited companies (Ltd, LLP, PLC) in the area, looks for each one's website, checks it, and writes a ranked CSV and summary.

TOOL_ROOT is `${CLAUDE_PLUGIN_ROOT}`. Results are written to `./prospects/` in the folder the user is working in.

## 1. Work out the search

From the user's request (`$ARGUMENTS` if given), decide:

- `--sector`: trades in plain English ("plumbers, electricians") or 5-digit SIC codes. Run `node "${CLAUDE_PLUGIN_ROOT}/scripts/find-prospects.mjs" --list-sectors` if you're unsure a name is known.
- `--area`: UK postcode districts, comma-separated (`LS6,LS7`), or one town name (`"Harrogate"`). Districts are more precise.
- `--age`: company age in years, like `2-15` or `5+`. Leave it out unless the user says.
- `--limit`: how many companies to check (default 25, max 200). Each takes a few seconds.
- `--preset`: `web-design`, `bookkeeping`, `marketing` or `commercial-cleaning`, if the user says what they sell. A preset picks the sectors, age range and order; `--sector` overrides its sectors.

If the area is missing, ask for it. Don't guess an area.

If the user just wants to see what it does, run it with `--demo`: fictional data, no key needed, nothing goes online.

## 2. Run it

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/find-prospects.mjs" --sector "<sectors>" --area "<area>" [--age 2-15] [--limit 25] [--preset web-design]
```

Use a long timeout (up to 10 minutes). It prints progress in five steps.

**If it says no API key was found:** stop and help the user set one up, without the key ever entering the chat.

1. Tell them how to get the free key, in plain words:
   - Go to https://developer.company-information.service.gov.uk/ and create an account.
   - Choose "Your applications", then "Create an application" (any name, Live environment).
   - Choose "Create new key", pick "REST", and **copy** the key.
2. Ask them to reply "copied" once the key is on their clipboard. Tell them not to paste it into the chat.
3. When they reply, run:
   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/scripts/setup-key.mjs" --from-clipboard
   ```
   It tests the key and saves it to `.env` in the current folder, without printing it.
4. Then run the search again.

Never ask the user to paste the key into the conversation. Never print, echo or `cat` a `.env` file. If they paste a key into the chat anyway:
- Don't repeat it.
- Ask them to copy it to the clipboard and use step 3.
- Suggest they create a fresh key afterwards.

## 3. Report back

Read the `prospects-<date>.md` file it wrote. Tell the user:

- How many companies matched, how many were filtered out (and the main reasons) and how many were checked.
- The top 10, each with its status and the reason in one short line.
- Where the CSV and summary are saved.

Be accurate and modest:

- "No website found" means none at the obvious addresses, not that none exists.
- A score is what one automated check saw today.
- Never say a business will buy, that this "books clients", "makes money" or anything like it. <!-- secret-scan: allow -->

## Rules

- Never contact anyone, send anything or mark anyone as contacted. This tool only finds and checks.
- Public data only. No LinkedIn and no scraping of sites whose terms forbid it. The tool respects robots.txt and Companies House rate limits.
- If the user then wants to email these companies, remind them:
  - Under UK PECR, cold marketing email is only allowed to limited companies, LLPs and PLCs, never sole traders or partnerships without consent.
  - Every email must say who it's from and include a working opt-out.
  - Use only addresses the business publishes itself.
  - The README has the compliance notes.
