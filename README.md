# Tolwen Prospect Finder

A free Claude Code plugin from Tolwen. It finds active UK limited companies in an area and sector, then flags which ones have no website or a weak one.

![Demo: the tool running on fictional demo data](docs/demo.gif)

*The demo runs in `--demo` mode, with fictional companies and websites. Try it yourself with `node scripts/find-prospects.mjs --demo`.*

## What it does

1. **Searches Companies House** with your own free API key. Search by trade ("plumbers", "dog groomers") or SIC code, in postcode districts (`LS6,LS7`) or a town.
2. **Keeps only active limited companies** (Ltd, LLP, PLC) in your area and company age range. Holding companies, chains, dormant companies and those with insolvency history are dropped.
3. **Looks for each company's website** at the obvious addresses. It accepts a site only when the page shows the company number, the postcode, or the name and town.
4. **Checks each site.** Is there a site at all? Does it use HTTPS? Is it set up for phones? Are contact details visible? How old is the copyright year?
5. **Scores and ranks them**, best first, with a plain reason for each score. You get `prospects-<date>.csv` and `prospects-<date>.md` in a `prospects` folder.

**What it doesn't do:**
- It doesn't contact anyone, send emails or find personal details.
- It doesn't use LinkedIn or scrape search engines.
- It doesn't guess email addresses.
- It doesn't know about websites at unusual addresses. "No website found" means none at the obvious addresses, so check before you mention it.

## Quick start (Windows or Mac)

**1. Install Node.js.** Download the LTS version from [nodejs.org](https://nodejs.org/) and run the installer. Accept the defaults. That's the only thing you need to install.

**2. Add the plugin in Claude Code.** Type these two lines in Claude Code, one at a time:

```
/plugin marketplace add TolwenHQ/uk-prospect-finder
/plugin install tolwen-prospect-finder@tolwen
```

**3. Ask for prospects.** For example:

> Find plumbers and electricians in LS6 and LS7 with weak websites

The first time, Claude will help you get a free Companies House API key, which takes about 5 minutes:

1. Go to the [Companies House developer hub](https://developer.company-information.service.gov.uk/) and create an account.
2. Choose **Your applications**, then **Create an application** (any name, Live environment).
3. Choose **Create new key**, then **REST**, and copy the key.
4. Tell Claude "I've copied my key". It saves the key to a `.env` file in your folder, straight from your clipboard, so the key never appears in the chat.

You can also run the skill directly with `/tolwen-prospect-finder:find-prospects plumbers in LS6`.

### Without the plugin

Download this repository (green **Code** button, then **Download ZIP**, then unzip it), or `git clone` it. Then open a terminal in that folder.
- **Windows:** in the folder, click the address bar, type `cmd` and press Enter.
- **Mac:** right-click the folder and choose **New Terminal at Folder**.

```
node scripts/setup-key.mjs
node scripts/find-prospects.mjs --sector plumbing --area LS6
```

If you use Claude Code inside the folder, `/find-prospects` works too.

## Options

| Option | Example | What it does |
|---|---|---|
| `--sector` | `plumbing, electrical` or `43220` | Trades in plain English or SIC codes. `--list-sectors` shows them all. |
| `--area` | `LS6,LS7` or `"Harrogate"` | Postcode districts (precise) or a town name. |
| `--age` | `2-15`, `5+` | Company age in years. Default `0-30`. |
| `--limit` | `40` | How many companies to check. Default 25, max 200. |
| `--preset` | `web-design` | Ready-made search: `web-design`, `bookkeeping`, `marketing`, `commercial-cleaning`. |
| `--out` | `my-results` | Where to save the files. Default `./prospects`. |
| `--demo` | | Runs on fictional data. No key needed, and nothing goes online. |

A run of 25 companies takes a few minutes. The tool waits between requests to stay polite and within limits.

## Compliance notes

Please read [docs/compliance.md](docs/compliance.md) before you contact anyone. In short:

- **Email (PECR):** cold marketing email is only allowed to corporate subscribers: limited companies, LLPs and PLCs. This tool keeps only those, by company type. Never cold email sole traders or partnerships without consent.
- **Every email must say who it's from and include a working opt-out.** Keep a suppression list and honour it.
- **UK GDPR:** a named business address is still personal data. Use legitimate interests, write a short assessment, and keep only business contact details.
- **Phone:** check numbers against TPS and CTPS before calling.
- **Sources:** Companies House's official API (well under its rate limit) and public home pages (robots.txt respected).

## Questions and problems

Open an [issue](https://github.com/TolwenHQ/uk-prospect-finder/issues). Please never paste your API key into an issue.

## Licence

MIT. See [LICENSE](LICENSE).

---

Want the next steps too (site audits, drafting checked emails, an approval queue, sending through your own Gmail with opt-outs and a suppression list)? Those are in [Tolwen Outreach](https://whop.com/tolwen/tolwen-outreach-engine), part of the Tolwen membership.
