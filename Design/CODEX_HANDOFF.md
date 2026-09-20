# Codex implementation brief

> Mise à jour de phase : William a autorisé le démarrage de la réalisation locale après ce cadrage. Les mentions de phase documentaire ci-dessous sont historiques. Voir [le suivi de réalisation](../docs/SUIVI_REALISATION.md) pour l’état implémenté et les limites actuelles.

> Current authority: [active framing](../docs/CADRAGE_PORTAIL_VOLVO.md) and [decision register](../docs/DECISIONS_PORTAIL_VOLVO.md). This pack guides visual implementation; the current phase authorizes documentation only.

## Objective

Build or extend a responsive Volvo Trucks Customer Portal for authenticated B2B customers. The product is an operational workspace, not a generic ecommerce My Account and not a seller/dealer back office.

## Mandatory reading order

1. `assets/screens/01-home-buyer.png` through `05-order-detail.png`
2. `docs/functional-scope-source.md`
3. `docs/roles-and-permissions.md`
4. `docs/screen-specifications.md`
5. `docs/implementation-guidelines.md`
6. `tokens/design-tokens.json`

## Approved persona

Visual reference persona in the supplied images: **Alex Morgan / Acme Logistics / Dallas Workshop**. Integrated demonstration data uses **WanderGarage and its existing users**. Do not create Acme or a new identity to reproduce the screenshots.

This is the buyer/customer UI. It exposes the customer's authorized fleet, vehicles, parts tasks, quotes, orders, approvals, contracts, claims and organization data.

Dealer-assisted PartASIST is a separate role mode. It may reuse the design system and components, but adds explicit delegated customer selection and different permissions. Never silently turn the customer portal into a seller console.

## Persistent contexts

- Company / organization
- Location / workshop
- Vehicle, optional
- Urgency / operational task

Changing context must revalidate authorization, pricing, eligibility, availability and incompatible cart/quote state. A label change alone is not sufficient.

## Visual reference routes (not the delivery sequence)

- `/` or `/home`
- `/fleet`
- `/quick-order`
- `/quotes/:quoteId`
- `/orders/:orderId`

Follow the functional delivery sequence and canonical navigation in the active framing. The five images do not replace full My Account coverage. Use clearly identified fixtures where the scenario requires them. Keep service access behind typed adapters so real VTEX and Volvo integrations can replace fixtures later.

## Non-negotiable product rules

- Customer UI only shows authorized customer data.
- Vehicle is optional for workshop stock replenishment.
- Do not infer safety guidance; display only authoritative Volvo guidance.
- Do not claim a booking, claim, activation, approval or submission succeeded unless a real destination returns a reference.
- Quote status/actions must map to the actual quote service; do not invent a front-end workflow.
- Returns, warranty, core returns and credit are distinct processes.
- Commercial contracts, Parts Assure coverage and digital subscriptions are distinct domains.
- Existing storefront guest checkout remains the anonymous journey; do not rebuild it inside this portal.

## Visual fidelity rules

- Use the screenshots as the visual target.
- Preserve the left navigation, top context bar, typography hierarchy, density and restrained use of status color.
- Prefer spacing, alignment and dividers over card grids and shadows.
- Avoid consumer storefront patterns, marketing heroes and decorative analytics.
- Keep tables readable and make the primary operational action obvious.

## Visual acceptance checks for the five reference screens

- All five routes render responsively and match the reference hierarchy.
- Navigation, context selectors, tabs, filters, row selection, primary CTAs and core form interactions work with fixtures.
- Empty, loading, error and permission-denied states exist.
- Keyboard navigation, focus states, labels and color contrast are verified.
- No action reports success without a fixture or adapter response.


## Reconciliation rules

- Canonical navigation: the 14 entries in the active framing, including Payment Methods and My Profile; document groups are not extra menus.
- Buyer and dealer-assisted modes share functional components. Verify delegation before accessing real customer accounts; a decoded representative claim alone is not authorization.
- Missing native capabilities can be implemented as targeted backend extensions. A custom quote workflow must own persistence, authorization, transitions and server-validated prices; never trust client-supplied prices as negotiated authority.
- Correct quote totals and taxes from consistent line data during implementation. Labour, coverage, quote approval and work-order creation require an identified real/custom behavior or an explicit simulation label.
- Do not copy the Home safety statement as a real recommendation without an authoritative source.
- Preserve responsive and keyboard behavior. These corrections happen within implementation, not as a separate prerequisite design phase.
