// Plain-English trade names mapped to UK SIC 2007 codes (the codes Companies House uses).
// You can also pass raw 5-digit SIC codes. Some codes are broad (for example 96090 "other personal services"),
// so a trade can also require a word in the company name, such as "dog" or "groom" for dog groomers.
//
// To add a trade: add a line to TRADES. Look codes up at https://resources.companieshouse.gov.uk/sic/

export const TRADES = [
  // Building and home services
  { key: 'plumbing', label: 'Plumbing and heating', aliases: ['plumber', 'heating', 'gas engineer', 'boiler'], sic: ['43220'] },
  { key: 'electrical', label: 'Electrician', aliases: ['electrician', 'electricians', 'electric'], sic: ['43210'] },
  { key: 'roofing', label: 'Roofer', aliases: ['roofer', 'roofers'], sic: ['43910'] },
  { key: 'building', label: 'Builder', aliases: ['builder', 'builders', 'construction'], sic: ['41201', '41202'] },
  { key: 'joinery', label: 'Joiner', aliases: ['joiner', 'joiners', 'carpenter', 'carpentry', 'kitchens'], sic: ['43320', '16230'] },
  { key: 'plastering', label: 'Plasterer', aliases: ['plasterer'], sic: ['43310'] },
  { key: 'decorating', label: 'Painter and decorator', aliases: ['painter', 'painting', 'decorator'], sic: ['43341'] },
  { key: 'glazing', label: 'Windows and glazing', aliases: ['windows', 'glazier', 'double glazing'], sic: ['43342'] },
  { key: 'flooring', label: 'Flooring and tiling', aliases: ['floor', 'tiler', 'tiling', 'carpet fitter'], sic: ['43330'] },
  { key: 'landscaping', label: 'Landscaping and gardening', aliases: ['landscaper', 'gardener', 'gardening', 'tree surgeon'], sic: ['81300'] },
  { key: 'cleaning', label: 'Cleaning', aliases: ['cleaner', 'cleaners', 'commercial cleaning'], sic: ['81210', '81222', '81229', '81299'] },
  { key: 'window-cleaning', label: 'Window cleaning', aliases: ['window cleaner'], sic: ['81221'] },
  { key: 'pest-control', label: 'Pest control', aliases: ['pest'], sic: ['81291'] },
  { key: 'removals', label: 'Removals', aliases: ['removal', 'removal company', 'man and van'], sic: ['49420'] },
  // Personal services
  { key: 'hair', label: 'Hair and beauty salon', aliases: ['hairdresser', 'hairdressers', 'salon', 'barber', 'barbers', 'beauty', 'nails'], sic: ['96020'] },
  { key: 'wellbeing', label: 'Wellbeing and massage', aliases: ['massage', 'spa', 'wellness'], sic: ['96040'] },
  { key: 'dog-grooming', label: 'Dog groomer', aliases: ['dog groomer', 'dog groomers', 'pet grooming', 'groomer'], sic: ['96090'], name: /\b(dogs?|pets?|paws?|k9|canine|hounds?|pooch|groom\w*)\b/i },
  { key: 'tattoo', label: 'Tattoo studio', aliases: ['tattoo studio', 'tattooist'], sic: ['96090'], name: /\b(tattoo\w*|ink|piercing)\b/i },
  { key: 'fitness', label: 'Gym and fitness', aliases: ['gym', 'gyms', 'personal trainer', 'fitness studio'], sic: ['93130'] },
  { key: 'sports-coaching', label: 'Sports and dance coaching', aliases: ['dance', 'yoga', 'pilates', 'martial arts', 'swimming lessons'], sic: ['85510'] },
  { key: 'driving-school', label: 'Driving school', aliases: ['driving instructor', 'driving lessons'], sic: ['85530'] },
  { key: 'tutoring', label: 'Tutoring', aliases: ['tutor', 'tutors', 'tuition'], sic: ['85590'] },
  { key: 'childcare', label: 'Nursery and childcare', aliases: ['nursery', 'nurseries', 'child care', 'day care'], sic: ['88910'] },
  { key: 'photography', label: 'Photographer', aliases: ['photographer', 'photographers', 'wedding photographer'], sic: ['74201', '74202', '74209'] },
  // Food, drink and stays
  { key: 'restaurant', label: 'Restaurant or café', aliases: ['restaurants', 'cafe', 'cafes', 'café', 'cafés', 'bistro'], sic: ['56101', '56102'] },
  { key: 'takeaway', label: 'Takeaway', aliases: ['takeaways', 'take away', 'fish and chips'], sic: ['56103'] },
  { key: 'pub', label: 'Pub or bar', aliases: ['pubs', 'bar', 'bars'], sic: ['56302'] },
  { key: 'catering', label: 'Event catering', aliases: ['caterer', 'caterers'], sic: ['56210'] },
  { key: 'hotel', label: 'Hotel', aliases: ['hotels'], sic: ['55100'] },
  { key: 'guest-house', label: 'B&B or guest house', aliases: ['b&b', 'bed and breakfast', 'guesthouse'], sic: ['55209', '55900'], name: /\b(b ?& ?b|bed and breakfast|guest ?house|inn|lodge|house)\b/i },
  { key: 'florist', label: 'Florist', aliases: ['florists', 'flowers'], sic: ['47760'], name: /\b(flower\w*|florist\w*|floral|bloom\w*|petal\w*|bouquet\w*)\b/i },
  { key: 'bakery', label: 'Bakery', aliases: ['baker', 'bakers'], sic: ['10710', '47240'] },
  // Health
  { key: 'dentist', label: 'Dentist', aliases: ['dentists', 'dental'], sic: ['86230'] },
  { key: 'clinic', label: 'Health clinic', aliases: ['physio', 'physiotherapist', 'chiropractor', 'osteopath', 'podiatrist'], sic: ['86900', '86220'] },
  { key: 'optician', label: 'Optician', aliases: ['opticians'], sic: ['47782'] },
  { key: 'vet', label: 'Vet', aliases: ['vets', 'veterinary'], sic: ['75000'] },
  // Professional and business services
  { key: 'accountancy', label: 'Accountant or bookkeeper', aliases: ['accountant', 'accountants', 'bookkeeper', 'bookkeeping', 'tax'], sic: ['69201', '69202', '69203'] },
  { key: 'legal', label: 'Solicitor', aliases: ['solicitor', 'solicitors', 'law firm'], sic: ['69102', '69109'] },
  { key: 'estate-agent', label: 'Estate or letting agent', aliases: ['estate agent', 'estate agents', 'letting agent', 'letting agents'], sic: ['68310'] },
  { key: 'architect', label: 'Architect', aliases: ['architects'], sic: ['71111'] },
  { key: 'consultancy', label: 'Management consultancy', aliases: ['consultant', 'consultants', 'consulting'], sic: ['70229'] },
  { key: 'marketing', label: 'Marketing or advertising agency', aliases: ['advertising', 'marketing agency', 'pr'], sic: ['73110', '70210'] },
  { key: 'it-services', label: 'IT services', aliases: ['it', 'software', 'web developer'], sic: ['62012', '62020'] },
  { key: 'recruitment', label: 'Recruitment agency', aliases: ['recruiter', 'recruiters'], sic: ['78109'] },
  { key: 'security', label: 'Security services', aliases: ['security guards'], sic: ['80100'] },
  { key: 'printing', label: 'Printing', aliases: ['printer', 'printers'], sic: ['18129'] },
  // Motor and transport
  { key: 'car-repair', label: 'Garage and car repair', aliases: ['garage', 'garages', 'mechanic', 'mot'], sic: ['45200'] },
  { key: 'car-sales', label: 'Car sales', aliases: ['car dealer', 'used cars'], sic: ['45111'] },
  { key: 'taxi', label: 'Taxi', aliases: ['taxis', 'private hire'], sic: ['49320'] },
  { key: 'haulage', label: 'Haulage', aliases: ['freight', 'logistics'], sic: ['49410'] },
];

const norm = (s) => String(s).toLowerCase().replace(/[’']/g, '').replace(/\s+/g, ' ').trim();
const byName = new Map();
for (const t of TRADES) for (const n of [t.key, t.label, ...t.aliases]) byName.set(norm(n), t);

export function findTrade(word) {
  const w = norm(word);
  return byName.get(w) || byName.get(w.replace(/s$/, '')) || byName.get(w.replace(/es$/, '')) || null;
}

function suggest(word) {
  const w = norm(word);
  const hits = TRADES.filter((t) => [t.key, t.label, ...t.aliases].some((n) => norm(n).includes(w) || w.includes(norm(n).split(' ')[0])));
  return hits.slice(0, 5).map((t) => t.key);
}

// "plumbers, electricians, 96020" -> [{ key, label, sic, name? }, ...]. Throws a plain-English error if unknown.
export function parseSectors(input) {
  const parts = String(input || '').split(/[,;]+|\band\b/).map((s) => s.trim()).filter(Boolean);
  if (!parts.length) throw new Error('Say which sector to search, for example --sector plumbing or --sector "plumbers, electricians" or a SIC code like 43220. Run with --list-sectors to see them all.');
  const out = [];
  for (const p of parts) {
    if (/^\d{5}$/.test(p)) { out.push({ key: p, label: `SIC ${p}`, sic: [p] }); continue; }
    const t = findTrade(p);
    if (!t) {
      const s = suggest(p);
      throw new Error(`I don't know the sector "${p}".${s.length ? ` Did you mean: ${s.join(', ')}?` : ''} Run with --list-sectors to see them all, or pass a 5-digit SIC code.`);
    }
    if (!out.includes(t)) out.push(t);
  }
  return out;
}

export const sicCodes = (sectors) => [...new Set(sectors.flatMap((s) => s.sic))];

// Which of the chosen sectors a company belongs to, or null.
export function matchSector(sectors, companyName, companySics) {
  const have = new Set(companySics || []);
  for (const s of sectors) {
    if (!s.sic.some((c) => have.has(c))) continue;
    if (s.name && !s.name.test(companyName)) continue;
    return s;
  }
  return null;
}

export function listSectors() {
  return TRADES.map((t) => `  ${t.key.padEnd(16)} ${t.label} (SIC ${t.sic.join(', ')})`).join('\n');
}
