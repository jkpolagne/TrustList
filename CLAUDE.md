# TrustList — Verified Real Estate Marketplace Prototype (Frontend Only)

BSIT capstone project, University of Nueva Caceres. A shared real estate
marketplace for Naga City, Camarines Sur, inspired by the US MLS model,
with trust/verification as the core theme. "TrustList" is a placeholder
name — keep it in a single config constant (e.g. src/config.ts APP_NAME)
so it can be renamed in one place later.

## THE CORE IDEA (read this before building anything)
In Philippine real estate, money and information move through a chain —
developer → broker → agent → buyer — and at every link, one party just has
to take the other's word for it. This system's entire purpose is making
transaction-relevant information VISIBLE and VERIFIABLE to every party:
agent license status, listing legitimacy, and payment milestone progress.
Every feature should serve this theme. The system NEVER holds or moves
money — it records and reveals information only.

## Scope for THIS deliverable
Frontend-only prototype with pre-set realistic mock data. No real backend,
no real database, no real authentication.
- src/mocks/ — realistic hardcoded data (see Mock Data section)
- src/services/ — thin service layer, each function returns
  Promise.resolve(mockData) with 300–500ms artificial delay so loading
  states are visible. Components NEVER import mock data directly, only
  services. (When a real backend is built later, only service internals
  change.)
- Target stack: React + TypeScript + Vite + React Router. Leaflet for maps.
- NO subscription/billing features — explicitly out of scope.
- NO live chat — the Seller Inquiry form is async (submit → firm follows up).
- Responsive web design (works on phone browsers), NOT a native mobile app.
  Property Seeker pages and consultant-facing pages (Upload Payment Proof,
  Sign Voucher) get mobile-layout priority; admin dashboards are
  desktop-first but must not break on mobile.

## User roles (6)
1. Super Admin — platform-level. Onboards firms onto the platform, manages
   firm status, views platform logs. NOT scoped to one firm.
2. Company Admin — one firm's operations: developers, properties, loan
   quotations, visit schedules, consultant accounts, listing verification
   approvals, seller inquiries.
3. Broker — commission vouchers, check prep/release, expected payout
   tracking, team monitoring. Legally accountable under RA 9646.
4. Sales Manager — team of Sales Persons under them, client monitoring,
   payment proof upload, voucher signing. Has a unique consultant link.
5. Sales Person — own clients, payment proof upload, voucher signing.
   Has a unique consultant link. Reports to a Sales Manager.
6. Property Seeker/Buyer — public, no login. Browses the multi-firm hub.

One shared login for roles 1–5 (simulate role selection with demo login
buttons since there's no real auth). Property Seeker never logs in.

## Modules and ownership (route each independently for individual demos)
- Module 1: Marketplace & Platform Access — Jann Kevin
- Module 2: Sales, Client & Consultant Management — Sean Rey
- Module 3: Commission & Payout Management — Jerome Mark

## THE MULTI-FIRM RULE (biggest difference from any earlier version)
The buyer-facing hub shows listings from MULTIPLE firms, not one. Every
Property, Consultant, Client, and Voucher record carries a company_id.
Buyer-facing pages aggregate across firms; internal dashboards are always
scoped to the logged-in user's firm. Mock data must include AT LEAST 3
firms (see Mock Data) so the multi-firm nature is visible in every demo.

## Trust features (the heart of the system — never cut corners here)
1. PRC Verification badge — every consultant has prc_license_number,
   prc_license_status (Verified / Pending / Unverified). Buyer-facing
   listing pages show a "PRC Verified" badge with the license number for
   verified consultants. Unverified consultants show no badge.
2. Ownership Verification workflow — every Property has listing_source:
   "Developer" or "Individual Seller". Individual Seller listings require
   verification_documents (mock: title copy + owner ID, shown as uploaded
   file names) and verification_status (Pending Review / Verified /
   Rejected). Only Verified listings appear in the public hub. Verified
   listings show an "Ownership Verified" badge distinct from the PRC badge.
3. Shared milestone visibility — when a client payment reaches a milestone
   tranche, BOTH the assigned consultant AND the broker see it, each in
   their own dashboard, with the date the system detected it. The agent
   never depends on the broker's word alone.
4. Expected Developer Payout — when a tranche is reached, an "Awaiting
   Payout" entry appears for the broker AND the concerned consultant:
   developer, sale, tranche number, expected-since date, and an aging
   indicator (e.g. "Pending 12 days") when overdue.

## Commission logic
Rates are negotiated PER DEVELOPER (set by Company Admin on the Add
Developer form), not fixed system-wide. Example rates for mock data:
- Direct Sale: Broker 2%, Sales Manager 4% (no Sales Person share)
- Referred Sale: Broker 2%, Sales Manager 1.5%, Sales Person 2.5%
Sale type is determined by the consultant link: a buyer who arrived
through a Sales Person's unique link = Referred Sale; otherwise Direct.
Stored as an explicit sale_type field, never inferred at display time.

Payment methods and tranche release:
- Cash: 1 tranche, 100% of commission on full payment
- In-House financing: 4 tranches at 25%/50%/75%/100% of contract price
  paid; each tranche = 25% of that role's total commission
- Bank financing: 4 tranches every 3 months across a 12-month DP period;
  each = 25% of total commission; requirements completion also gates
  release (see checklist below)
Each tranche reached = a NEW voucher record. One sale can have many
vouchers over its lifetime, one per tranche per entitled role.

Voucher flow: milestone reached → broker creates voucher (Pending
Signature) → consultant reviews → signs (or disputes back to broker) →
broker preps check (check no., bank, date) → Check Ready → Released →
receipt. Voucher fields: developer, date disbursed, paid to, buyer, RS
date, NTCP, release number (e.g. 2 of 4), rate %, block/lot, check
number, bank, gross commission, less EWT (10%), less ADCOM, total
commission due, less misc tax, net commission receivable, other
deductions, approved by (broker + e-signature), received by (consultant
+ e-signature).

## Requirements checklist (gates Bank-financing tranches)
Client has employment_status: OFW | Locally Employed | Self-Employed.
- Cash: valid ID + declaration of source of funds
- In-House: proof of income + valid government ID
- Bank financing, two phases (Basic = needed for first tranche; Complete
  = needed for later tranches):
  - Locally Employed — Basic: 2 valid IDs, Certificate of Employment w/
    Compensation, payslips (3 mos), ITR. Complete adds: birth certificate,
    marriage contract (if married), proof of billing, verified TIN.
  - OFW — Basic: 2 valid IDs, employment contract/salary certificate,
    payslips or payroll bank statements, passport w/ entry-exit stamps.
    Complete adds: birth certificate, marriage contract (if married),
    proof of billing, verified TIN, Special Power of Attorney.
  - Self-Employed — Basic: 2 valid IDs, ITR (2 yrs), bank statements
    (6 mos). Complete adds: birth certificate, marriage contract (if
    married), audited financial statements (2 yrs), DTI registration,
    Mayor's Permit, proof of billing, verified TIN, business photo.
Model as RequirementsChecklist: items tagged Basic/Complete, checked
boolean, verified_by, verified_date. Monitor Clients must show at a
glance whether a Bank client is at "Basic complete", "Complete", or
"Incomplete" — this gates tranche release alongside payment progress.

## Seller Inquiry (async, NOT chat)
Public "Sell your property" page: form with name, contact number, email,
property location, property type, short description, preferred firm
(dropdown of participating firms). Submits into the chosen firm's
Company Admin dashboard as a Seller Inquiry with status (New / Contacted
/ Converted to Listing / Declined). Confirmation message tells the
seller the firm will contact them. No real-time messaging anywhere.

## Mock data (use consistently EVERYWHERE — never invent new names mid-build)
Firms (3 minimum):
- Advench Realty — Naga City (primary, most complete data)
- Bicol Homes Realty — Naga City
- Coastline Properties — Legazpi City
Developers: Golden Horizon Developers (6% total cut, Direct 2%/4%,
Referred 2%/1.5%/2.5%), plus one more developer with slightly different
rates to prove rates are per-developer.
Properties: Lot 14 Greenview Estates (₱1,500,000, Pili, developer-sourced,
available), Unit 4B Riverside Homes (₱2,300,000, Naga, reserved), plus
4–6 more across the 3 firms, different price points and bedroom counts,
including at least 2 Individual Seller listings (one Verified, one
Pending Review) and at least one lot-only listing.
Clients: Maria Santos (Bank financing, Locally Employed, mid-tranche),
Carlo Reyes (In-House, just started), one Cash buyer fully released.
People: Filipino names, Bicol addresses (Naga, Pili, Legazpi), PHP (₱)
formatting throughout. Coordinates around Naga City/Pili for the map.

## DESIGN DIRECTION — modern but NOT generic-AI-looking
This is a real product prototype, not a template. Hard rules:
- Typography: use a distinctive pairing, not Inter-for-everything. Use
  "Manrope" (weights 600/700/800) for headings and "Inter" (400/500/600)
  for body, via Google Fonts. Tight letter-spacing on large headings
  (-0.02em). Generous size contrast between heading levels.
- Colors: deep ink navy #10233F as primary dark; warm paper #FAF8F4 as
  page background; accent gold #B8863B used SPARINGLY (primary buttons,
  active states, brand mark) — never as large background washes.
  Verification green #1E7F52 reserved EXCLUSIVELY for trust badges (PRC
  Verified, Ownership Verified) so verified status is instantly
  recognizable. Warning amber #B7791F for pending states. Never introduce
  colors outside this palette.
- NO generic-AI tells: no purple/violet gradients, no glassmorphism, no
  floating blob shapes, no emoji as icons, no giant rounded-everything.
  Border radius: 8px inputs/buttons, 12px cards, never more.
- Cards: 1px solid #E7E3DA borders, flat or barely-there shadow
  (0 1px 2px rgba(16,35,63,.04) max). Status via a 3–4px colored
  left-accent bar on the card edge, not loud badge soup.
- Density: compact and information-rich like a real professional tool
  (think Linear/Stripe dashboard density), NOT airy marketing-page
  spacing inside the app. The public hub pages can breathe a bit more;
  internal dashboards stay dense.
- Icons: use lucide-react exclusively, 16–20px, stroke width 2.
- Tables: real tables for internal dashboards (not card grids), sticky
  header, row hover, right-aligned numbers, tabular-nums for money.
- Money: always ₱ with comma separators (₱1,500,000), tabular figures.
- Trust badges are the visual signature of this product: a small shield
  or check icon + label, green #1E7F52 on #E7F3EC pill for verified;
  amber equivalents for pending. Same component reused everywhere a
  badge appears — build it once as <VerificationBadge/>.
- Empty states, loading states (skeletons, not spinners), and realistic
  hover/focus states are REQUIRED on every page — this is what makes a
  prototype feel real vs. AI-generated.
- Accessibility basics: visible focus rings, labels on all inputs,
  aria-labels on icon-only buttons.

## Build order (one prompt per stage, wait for review between stages)
1. Scaffold: Vite + React + TS + Router, config constant for app name,
   design tokens as CSS variables, service layer + all mock data, shared
   components (VerificationBadge, StatusBar card, AppShell with sidebar,
   PublicShell with top nav), demo login screen with role buttons
2. Public Hub (Module 1a): multi-firm map + listings, search/filters,
   property details with both badge types, comparison, loan calculator
3. Seller side (Module 1b): "Sell your property" inquiry form + Company
   Admin's Seller Inquiries + listing verification approval workflow
4. Super Admin + Company Admin core (Module 1c): firm onboarding,
   developers (with per-developer rates + milestone fields), properties
   (with listing_source + verification fields), loan quotations, visit
   schedules
5. Consultant management (Module 2a): consultant accounts, hierarchy,
   link generation (SM + SP only), consultant links table
6. Client monitoring (Module 2b): clients, status history, requirements
   checklist by employment status, shared milestone visibility, payment
   proof upload
7. Commission (Module 3): tranche engine, voucher creation with all
   fields, e-signature flow, check prep, release, Expected Developer
   Payout with aging, My Commission views for SM/SP
8. Polish pass: responsive check on all Property Seeker + consultant
   pages, empty/loading states audit, cross-module data consistency
   check against this file