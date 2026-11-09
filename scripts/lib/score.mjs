// Step 5: score each company 0 to 100 for how much its web presence needs work, with plain reasons.
// Higher = weaker web presence. It describes what the check saw; it is not a judgement of the business.

export const STATUS = {
  SPAM: 'hacked or spam redirect',
  DEAD: 'site not working',
  NONE: 'no website found',
  WEAK: 'weak site',
  OK: 'site looks fine',
  UNCHECKED: 'could not check',
};

export function scoreCompany({ probe, site }, { now = new Date() } = {}) {
  const year = now.getUTCFullYear();
  const reasons = [];
  if (!probe?.website && probe?.robotsBlocked) {
    return { status: STATUS.UNCHECKED, score: 0, reasons: [`Found ${probe.robotsBlocked}, but its robots.txt asks automated tools not to visit, so it was not checked. Look at it yourself.`] };
  }
  if (!probe?.website && !probe?.tried?.length) {
    return { status: STATUS.NONE, score: 80, reasons: ['The company name is too short to guess a web address from, so no website was looked for. Check by hand.'] };
  }
  if (!probe?.website) {
    return {
      status: STATUS.NONE, score: 80,
      reasons: [`No website found at the obvious web addresses (tried ${probe?.tried?.slice(0, 3).join(', ') || 'none'}${probe?.tried?.length > 3 ? ' and others' : ''}). They may still have one elsewhere or only use social media: check before you mention it.`],
    };
  }
  const s = site || {};
  if (s.robotsBlocked) return { status: STATUS.UNCHECKED, score: 0, reasons: [`Their site (${probe.website}) asks automated tools not to visit, so it was not checked. Look at it yourself.`] };
  if (s.error || s.status >= 400) {
    return { status: STATUS.DEAD, score: 90, reasons: [s.error ? `Their site address (${probe.website}) did not load (${String(s.error).split(':')[0]}).` : `Their site returned an error page (HTTP ${s.status}).`] };
  }
  if (s.offsite && (s.spam || s.parked)) return { status: STATUS.SPAM, score: 95, reasons: [`Their web address now sends visitors to an unrelated ${s.spam ? 'spam' : 'parked'} page.`] };
  if (s.parked) return { status: STATUS.DEAD, score: 90, reasons: ['Their web address shows a parked or "coming soon" page rather than the business.'] };

  let score = 20;
  if (!s.https) { score += 25; reasons.push('No HTTPS: browsers mark the site "Not secure".'); }
  else if (s.redirectsToHttps === false) { score += 5; reasons.push('Has HTTPS, but the http:// address does not move visitors to it.'); }
  if (s.viewport === false) { score += 25; reasons.push('Not set up for phones (no mobile viewport tag), so pages show at desktop width on a phone.'); }
  if (!s.contact?.any) { score += 15; reasons.push('No phone number, email address or contact page link on the home page.'); }
  else if (!s.contact.phone) { score += 3; reasons.push('No phone number on the home page.'); }
  if (s.copyrightYear && s.copyrightYear <= year - 3) { score += Math.min(15, 3 + (year - 3 - s.copyrightYear) * 2); reasons.push(`Footer says © ${s.copyrightYear}, so it may not have been updated for a while.`); }
  if (s.words != null && s.words < 80) { score += 5; reasons.push(`Very little text on the home page (about ${s.words} words).`); }

  if (score <= 25) return { status: STATUS.OK, score: Math.min(score, 15), reasons: [`HTTPS, set up for phones and contact details visible${s.copyrightYear ? `, footer © ${s.copyrightYear}` : ''}.`] };
  return { status: STATUS.WEAK, score: Math.min(score, 85), reasons };
}

// How a preset orders the results.
export function ranker(rank = 'website-need') {
  const need = (a, b) => b.score - a.score;
  const age = (a, b) => String(b.incorporated).localeCompare(String(a.incorporated)); // newest first
  return {
    'website-need': (a, b) => need(a, b) || age(a, b),
    'weak-site-first': (a, b) => (b.status === STATUS.WEAK) - (a.status === STATUS.WEAK) || need(a, b),
    newest: (a, b) => age(a, b) || need(a, b),
    oldest: (a, b) => -age(a, b) || need(a, b),
  }[rank] || ((a, b) => need(a, b));
}
