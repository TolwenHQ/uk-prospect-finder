# Changelog

## 1.0.0 (November 2026)

First release.

- Searches Companies House (your own free key) by sector and area. Plain-English trade names or SIC codes; postcode districts or a town.
- Keeps active limited companies only (Ltd, LLP, PLC). Drops holding companies, chains, dormant companies and those with insolvency history.
- Tries the obvious web addresses for each company and accepts a site only when it shows the company number, postcode, or name and town.
- Checks each site for HTTPS, a mobile viewport, visible contact details and the copyright year, then scores and ranks.
- Writes `prospects-<date>.csv` and `prospects-<date>.md`.
- Four presets: web-design, bookkeeping, marketing, commercial-cleaning.
- `--demo` mode on fictional data. Claude Code plugin with a skill and an agent.
