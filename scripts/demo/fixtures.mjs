// FICTIONAL demo data for --demo and the tests. Every company, number, postcode and website here is invented.
// Company numbers use the made-up prefix ZZ, postcodes the made-up district ZZ1, websites the reserved .example
// domain and phone numbers the Ofcom drama range (01632 960xxx). No real business or person appears.

const YEAR = new Date().getUTCFullYear();
const office = (line, postcode, locality = 'Demoton') => ({ address_line_1: line, locality, postal_code: postcode });

export const SEARCH_ITEMS = [
  { company_name: 'QUILLMOOR JOINERY LTD', company_number: 'ZZ000001', company_status: 'active', company_type: 'ltd', date_of_creation: '2019-04-02', sic_codes: ['43320'], registered_office_address: office('4 Mill Yard', 'ZZ1 2AB') },
  { company_name: 'BRACKENFOLD PLUMBING & HEATING LTD', company_number: 'ZZ000002', company_status: 'active', company_type: 'ltd', date_of_creation: '2014-09-15', sic_codes: ['43220'], registered_office_address: office('17 Station Road', 'ZZ1 3CD') },
  { company_name: 'TALLOWMERE ELECTRICAL LTD', company_number: 'ZZ000003', company_status: 'active', company_type: 'ltd', date_of_creation: '2017-01-20', sic_codes: ['43210'], registered_office_address: office('Unit 2, Canal Works', 'ZZ1 4EF') },
  { company_name: 'FERNHALLOW ROOFING LTD', company_number: 'ZZ000004', company_status: 'active', company_type: 'ltd', date_of_creation: '2020-06-11', sic_codes: ['43910'], registered_office_address: office('9 Ash Grove', 'ZZ1 5GH') },
  { company_name: 'OTTERCOMBE HAIR STUDIO LTD', company_number: 'ZZ000005', company_status: 'active', company_type: 'ltd', date_of_creation: '2018-03-08', sic_codes: ['96020'], registered_office_address: office('22 High Street', 'ZZ1 6JK') },
  { company_name: 'WRENFIELD PROPERTY HOLDINGS LTD', company_number: 'ZZ000006', company_status: 'active', company_type: 'ltd', date_of_creation: '2016-02-01', sic_codes: ['43220', '68209'], registered_office_address: office('1 Market Place', 'ZZ1 7LM') },
  { company_name: 'GREYSTOCK CLEANING LLP', company_number: 'ZZ000007', company_status: 'active', company_type: 'llp', date_of_creation: '2012-10-30', sic_codes: ['81210'], registered_office_address: office('3 Bridge Street', 'ZZ1 8NP') },
  { company_name: 'SALTMARSH BUILDING COMPANY', company_number: 'ZZ000008', company_status: 'active', company_type: 'private-unlimited', date_of_creation: '2015-05-05', sic_codes: ['41202'], registered_office_address: office('8 Quay Lane', 'ZZ1 9QR') },
  { company_name: 'PENNYWHISTLE PLUMBING LTD', company_number: 'ZZ000009', company_status: 'active', company_type: 'ltd', date_of_creation: '2021-08-19', sic_codes: ['43220'], registered_office_address: office('5 Elm Close', 'ZZ1 2ST') },
  { company_name: 'KESTRELBY LANDSCAPES LTD', company_number: 'ZZ000010', company_status: 'active', company_type: 'ltd', date_of_creation: '2016-11-14', sic_codes: ['81300'], registered_office_address: office('The Barn, Long Lane', 'ZZ1 3UV') },
  { company_name: 'HOLLINS GRANGE ROOFING LTD', company_number: 'ZZ000011', company_status: 'active', company_type: 'ltd', date_of_creation: '2013-07-07', sic_codes: ['43910'], registered_office_address: office('2 Far Lane', 'ZZ2 1AA', 'Othertown') },
  { company_name: 'MARIGOLD LANE BAKERY LTD', company_number: 'ZZ000012', company_status: 'active', company_type: 'ltd', date_of_creation: '2022-02-22', sic_codes: ['10710'], registered_office_address: office('6 Marigold Lane', 'ZZ1 4WX') },
];

export const PROFILES = Object.fromEntries(SEARCH_ITEMS.map((c) => [c.company_number, {
  company_name: c.company_name, company_number: c.company_number, company_status: c.company_status, type: c.company_type,
  date_of_creation: c.date_of_creation, has_insolvency_history: false, sic_codes: c.sic_codes, registered_office_address: c.registered_office_address,
  accounts: { last_accounts: { type: c.company_number === 'ZZ000009' ? 'dormant' : 'micro-entity' }, overdue: false },
}]));

const page = ({ title, body, viewport = true, footer = `© ${YEAR}` }) => `<!doctype html><html><head><meta charset="utf-8">${viewport ? '<meta name="viewport" content="width=device-width, initial-scale=1">' : ''}<title>${title}</title></head><body>${body}<footer>${footer}</footer></body></html>`;

// host -> { https: serves https?, httpRedirects: http:// moves to https://, robots, html, status }
export const SITES = {
  'brackenfoldplumbing.example': {
    https: false,
    html: page({ title: 'Brackenfold Plumbing', viewport: false, footer: '© 2016 Brackenfold Plumbing &amp; Heating Ltd, 17 Station Road, Demoton ZZ1 3CD', body: '<h1>Brackenfold Plumbing and Heating</h1><p>Boilers, bathrooms and central heating since 2014. Gas Safe registered engineers covering Demoton and the villages around it. We fit, service and repair all makes of boiler.</p>' }),
  },
  'tallowmereelectrical.example': {
    https: true, httpRedirects: true,
    html: page({ title: 'Tallowmere Electrical | Demoton electricians', footer: `© ${YEAR} Tallowmere Electrical Ltd. Registered in England, company no. ZZ000003`, body: '<h1>Tallowmere Electrical</h1><p>Rewires, consumer units, EV chargers and electrical safety certificates for homes and landlords in Demoton. NICEIC approved contractor with ten years of local work behind us and a two-year warranty on all installations.</p><p>Call <a href="tel:01632960123">01632 960123</a> or <a href="/contact">send us a message</a>.</p>' }),
  },
  'fernhallowroofing.example': {
    https: true, httpRedirects: true,
    html: page({ title: 'Coming soon', footer: 'Fernhallow Roofing Ltd ZZ1 5GH', body: '<h1>Website coming soon</h1>' }),
  },
  'ottercombehairstudio.example': {
    https: true, httpRedirects: true,
    html: page({ title: 'Ottercombe Hair Studio', footer: '© 2019 Ottercombe Hair Studio', body: '<h1>Ottercombe Hair Studio</h1><p>Cuts, colour and styling on the High Street in Demoton. A relaxed salon with three stylists, open Tuesday to Saturday, with late nights on Thursdays. Walk-ins welcome when there is a free chair, and gift vouchers are available all year round.</p>' }),
  },
  'greystockcleaning.example': {
    https: true, httpRedirects: true,
    html: page({ title: 'Greystock Cleaning', footer: `© ${YEAR - 1} Greystock Cleaning LLP, 3 Bridge Street, Demoton ZZ1 8NP`, body: '<h1>Greystock Cleaning</h1><p>Office, surgery and school cleaning across Demoton, with fully vetted teams, our own equipment and flexible early-morning or evening schedules. Contract and one-off deep cleans, all fully insured.</p><p>Email <a href="mailto:hello@greystockcleaning.example">hello@greystockcleaning.example</a> or call 01632 960456.</p>' }),
  },
  'kestrelbylandscapes.example': {
    https: true, httpRedirects: true, robots: 'User-agent: *\nDisallow: /\n',
    html: page({ title: 'Kestrelby Landscapes', body: '<h1>Kestrelby Landscapes</h1>' }),
  },
};

export const DEMO_DEFAULTS = {
  sector: 'plumbing, electrical, roofing, joinery, hair, cleaning, landscaping, building',
  area: 'ZZ1',
  age: '0-30',
};
