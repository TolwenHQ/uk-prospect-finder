# Compliance notes (UK)

This tool finds and checks companies. It never contacts anyone. What you do with the list afterwards is up to you, and UK law applies. These notes are a plain-English summary, not legal advice. Check the ICO's guidance for anything you're unsure about: https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/

## Email (PECR)

- **Only limited companies.** Under the Privacy and Electronic Communications Regulations (PECR), you may send unsolicited marketing email to *corporate subscribers* without their consent. Corporate subscribers are limited companies, LLPs and PLCs.
- **Not sole traders or partnerships.** In England, Wales and Northern Ireland, PECR treats sole traders and ordinary partnerships as individuals. You need their consent first.
- **The tool enforces this.** It keeps only Ltd, LLP and PLC companies (and companies limited by guarantee). It drops everything else by company type. It does not just warn you.
- **Every email must:**
  - say clearly who it's from
  - include a working way to opt out (a "reply no thanks" line is fine)
- **Keep a suppression list.** Record everyone who opts out, and check it before every send.
- **Use only addresses the company publishes itself**, such as info@ or hello@ on its own website. Don't guess addresses. Don't buy lists.

## Personal data (UK GDPR)

- **Business email addresses can still be personal data.** An address like jane@example.co.uk relates to a person, so UK GDPR applies alongside PECR.
- **Legitimate interests** is the usual lawful basis for B2B outreach. Write a short Legitimate Interests Assessment (LIA) before you start.
- **Minimise data.** This tool records business details only: no director names and no home addresses. Keep it that way.
- **Have a short privacy notice** that says what you hold and why. Point to it if anyone asks.

## Phone calls

- Before any marketing call, check the number against:
  - the **Telephone Preference Service (TPS)**, which sole traders can join
  - the **Corporate TPS (CTPS)**, for companies
- Calling a registered number for marketing is not allowed unless they've told you they're happy to be called.

## Web and data sources

- **Companies House.** Data comes from the official API, using your own free key. The tool stays well under the 600 requests per 5 minutes limit.
- **Websites.** The tool reads public home pages only. It respects each site's robots.txt and pauses between requests to the same site.
- **No scraping of sites that forbid it.** No LinkedIn and no search-engine scraping.

## What to say, and not say

Describe what you saw ("your site doesn't use HTTPS") and what you offer. Don't promise results. Don't invent urgency. Don't claim anything you can't show.
