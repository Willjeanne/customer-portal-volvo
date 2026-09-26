# Volvo Customer Portal — Demo Feature Scope

> **Source de périmètre conservée — 25 septembre 2026.** Le [plan actif](../CADRAGE_PORTAIL_VOLVO.md) et la [matrice](../MATRICE_CAPACITES_VOLVO.md) décrivent les décisions et la livraison. Le checkout est désormais intégré au portail pour Promissory ; la couverture cible de ce document reste plus large que la démo livrée. Les exemples historiques ne valent pas preuve de données ou autorisation de mutation du compte.

**Revised 18 September 2026 — scope alignment and delivery sequence.**

## Purpose

This document defines the feature scope for the **Volvo Customer Portal** to be used in the VTEX demo.

The portal should not be designed as a generic e-commerce **My Account** area. It should behave as a **B2B customer operations portal** centered on three persistent contexts:

1. **Customer / Organization**
2. **Fleet / Vehicle**
3. **Current business task** — order, quote, work order, replenishment, claim, service need, etc.

This structure supports scenarios **1B, 1C, 1D, 1F and P2** through a fully custom Volvo interface backed by the **VTEX Buyer Portal installed on volvoemea** and the relevant VTEX services. It replaces the customer-facing My Account experience, not its business capabilities or server-side rules. Buyer Portal and B2B Suite must not be treated as interchangeable API or data models.

**Full My Account functional coverage is a target requirement.** Delivery order does not remove capabilities from that target. Every existing My Account capability must be inventoried and mapped to a portal screen, authorized actions and verified services before coverage is declared complete.

### Anonymous and mobile journey — decision

**Scenario 1E uses the existing storefront and its guest checkout.** Do not rebuild a separate anonymous experience inside the authenticated Customer Portal. The existing checkout still needs to be fixed and guest ordering must then be tested end to end; guest checkout is the selected approach, not a capability already validated on this account. Verify its compatibility with the current sign-in settings without changing those settings by assumption.

Public visitors must not receive private organization data, negotiated conditions or account permissions. If a visitor signs in or is handed over to a dealer, preserve authorized useful context and revalidate prices, availability and purchasing rights. Test the existing site's mobile journey as well as the portal's responsive layout.

### Scope versus proof

The feature inventory below describes the target experience, not confirmed native/API availability. Classify each action as **real**, **mock** or **storyboard**, and identify its source and owner. External capabilities require an explicit integration or a bounded, declared demo scenario. A simulated action must not report a real submission, booking, activation or approval.

---

# 1. Recommended Portal Navigation

Recommended left navigation:

- **Home**
- **Fleet & Vehicles**
- **Find Parts**
- **Quick / Bulk Order**
- **Lists**
- **Quotes**
- **Orders**
- **Approvals** — role-dependent
- **Returns & Claims**
- **Contracts & Services**
- **My Organization** — units, team, permissions, addresses, budgets and accounting settings
- **Payment Methods**
- **Support / Dealer**
- **My Profile**

### Design principle

Do **not** make “Catalog” the primary entry point.

The portal should start from the user's task:

- Find the right part
- Replenish stock
- Resolve an urgent vehicle need
- Review a quote
- Track an order
- Manage a contract
- Act on a vehicle alert

The experience should feel like a professional operational tool rather than a B2C webshop.

---

# 2. Persistent Context Bar

A persistent context bar should be visible throughout the portal.

Example:

**Buying for:** Acme Logistics  
**Location:** Dallas Workshop  
**Vehicle:** Volvo VNL 860 — VIN …3819  
**Urgency:** Vehicle Off Road

The following are intended context effects; each requires a verified service or an identified external source:

- Pricing
- Purchasing rights
- Availability
- Dealer relationship
- Contract eligibility
- Ship-to locations
- Quotes
- Orders
- Search results
- Vehicle compatibility
- Approval rules

**Vehicle context is optional.** Replenishment may concern no vehicle or several vehicles. Use organization and site as the shared context; allow vehicle/VIN and work-order associations per line where required. Do not force a single vehicle onto a stock order.

For dealer-assisted journeys, expose a customer/account selector only after verifying delegated contract access and permitted actions. It must not allow arbitrary impersonation. A context change must revalidate or explicitly reset incompatible cart, quote and commercial data; changing a UI label does not change authorization.

---

# 3. Feature Inventory

| Area | Features | Demo relevance |
|---|---|---|
| **Home / Dashboard** | Active organization, active location, selected vehicle, preferred dealer, recent orders, active quotes, pending approvals, vehicle alerts, active contracts, quick actions | Cross-cutting |
| **Customer / Account Context** | Customer/account selector, company details, dealer relationship, commercial conditions, credit/payment terms, ship-to context | 1B / PartASIST |
| **My Fleet** | Vehicle list, VIN, fleet number, model, year, assigned site, status, active contracts, maintenance indicators | 1B / 1D / 1E / 1F / P2 |
| **Vehicle Detail** | VIN, technical details, compatible parts, recent orders, service history, contracts, alerts, “Find parts for this vehicle” | 1D / 1F / P2 |
| **Find Parts** | Search by part number, VIN, vehicle, work order, previous order, diagram, natural-language problem description | 1D |
| **Part Results** | Compatibility, eligibility, Genuine / Reman / Road Choice / Extended Offer, supersessions, alternatives, restrictions, availability, lead time, price, source | 1B / 1D |
| **Product Detail** | Technical information, fitment confirmation, installation restrictions, availability, pricing, alternative parts, supersessions, add to cart | 1B / 1D |
| **Quick Order** | Direct part-number and quantity entry | 1C |
| **Bulk Order / Upload** | Excel upload, paste list, validation, errors, supersessions, alternatives, bulk correction | 1C |
| **Saved Lists** | Private/shared lists, recurring workshop stock lists, add-all-to-cart, repeat order | 1C |
| **Cart / Order Builder** | Customer, VIN, work order, urgency, cost center, PO/reference, ship-to, comments, source, freight, ETA, split order | 1B / 1C |
| **Quotes** | Quote list, statuses, detail, request adjustment, comments, attachments, accept/reject, convert to order | Buyer Portal / B2B |
| **Approvals** | Pending approval queue, requester, value, cost center, budget/threshold, approve/reject/comment | 1C |
| **Orders** | Organization and cost-center orders, filters by VIN, PO, site, dealer, user, status and date | 1B / 1C |
| **Order Detail** | Order lines, VIN/work-order association, split shipments, source/seller, ETA, tracking, partial fulfilment, documents, reorder | 1B |
| **Returns & Claims** | Start return, reason, affected lines, quantity, supporting evidence, core return, warranty, credit status | Cross-cutting / missing journey |
| **Parts Assure** | Contract by vehicle, entitlement, covered operations, covered/non-covered parts, payment-code handling, claim creation, claim deadline/status | 1F |
| **Service Records** | Work performed, vehicle, date, mileage, parts used, claim link, service-record update | 1F |
| **Vehicle Alerts / Needs** | Connected-vehicle event, severity, urgency, impact, recommended next action | P2 |
| **Complete Solution** | Parts + workshop/service + contract/entitlement + digital service, with Buy / Book / Activate actions | P2 |
| **Subscriptions / Digital Services** | Active services, trial, subscribe, activation status, upgrade, renew, cancel | P2 |
| **My Organization** | Organization details, cost centers, locations/workshops, addresses | Buyer Portal / B2B |
| **Users & Roles** | Invite/add user, buyer, approver, org admin, cost-center assignment | 1C |
| **Purchasing Rules** | Purchasing rights, approval thresholds, allowed locations, shared carts/lists where supported, budgets and accounting requirements | 1C |
| **Budgets & Accounting** | Allocations, balances, authorized budget operations, cost-center and PO fields, bulk entry and persistence | Buyer Portal / 1C |
| **Payment Methods** | Authorized payment methods, payment terms and supported saved-method management; verify visibility and mutation permissions | My Account coverage |
| **My Profile** | Personal information, supported preferences, sign-out and supported account/security flows | My Account coverage |
| **Addresses / Locations** | Ship-to addresses by site/workshop/cost center | 1C |
| **Dealer / Support** | Preferred dealer, dealer contacts, parts specialist, contextual handover carrying VIN/cart/need | 1E |
| **Documents** | Purchase orders, invoices, credit notes, warranty documents, technical documents, terms and conditions | Cross-cutting |
| **Notifications** | Quote updated, approval required, order delayed, backorder, claim deadline, connected-vehicle alert | Cross-cutting |

---

# 4. Home / Dashboard

The dashboard should immediately show that this is a **professional B2B workspace**.

Example:

## Volvo Trucks Customer Portal

**Acme Logistics — Chicago Workshop**  
Customer #0013492  
Preferred dealer: Volvo Trucks Chicago

### My Work

- 2 quotes awaiting approval
- 1 order delayed
- 3 parts backordered
- 1 Parts Assure claim due in 6 days

### Fleet

- 42 vehicles
- 3 vehicles requiring attention
- 1 active connected-vehicle alert

### Quick Actions

- Find a part
- Upload parts list
- Create quote
- Reorder
- Select / add vehicle

### Recent Activity

- Quote QT-10457 updated
- Order #78451 shipped
- Truck VNL-782 brake-wear alert
- Parts Assure claim approved

This dashboard is the launch point for authenticated portal scenarios. Scenario 1E starts on the existing public storefront. Dashboard figures and statuses must be sourced from real records or clearly identified demo fixtures; all numbers above are illustrative.

---

# 5. Fleet & Vehicle Experience

Vehicle context should be one of the strongest visual elements of the portal.

## My Fleet

Each row/card should include:

- Fleet number
- Vehicle model
- VIN
- Registration
- Mileage
- Assigned workshop/site
- Vehicle status
- Active contract
- Alerts
- Last order / service

## Vehicle Detail

Example:

### Volvo VNL 860 — Truck 147

**VIN:** …3819  
**Mileage:** 412,330 km  
**Location:** Dallas Workshop  
**Parts Assure:** Active until Dec 2027

Primary actions:

- **Find compatible parts**
- **View orders**
- **Service history**
- **Contracts**
- **View alerts**

Sections:

- Active alerts
- Recently purchased parts
- Recommended maintenance
- Compatible replacement parts
- Active contracts / entitlements

This screen later becomes the natural bridge toward Connected Services.

Example future alert:

> **Brake wear detected**  
> Intervention recommended within 2,000 km  
> **Build solution**

---

# 6. Find the Right Part

This area supports Volvo use case **1D — Help me find the right Part**.

Users should be able to start from what they know:

- Part number
- VIN / chassis
- Fleet number
- Work order
- Previous order
- Technical diagram
- Problem description in natural language

### Search Results Should Show

- Part image and description
- Compatibility status
- Eligibility
- Genuine / Reman / Road Choice / Extended Offer
- Supersession
- Alternatives
- Restrictions
- Installation requirements
- Availability
- Lead time
- Customer price
- Fulfilment source

Important principle:

**Commerce should display and orchestrate compatibility information, but Volvo systems remain the source of truth for fitment, eligibility, supersessions, technical diagrams and safety restrictions.**

---

# 7. Quick Order & Bulk Replenishment

This supports **1C — Replenish my Parts stock**.

The experience should prioritize speed.

## Entry Points

- Manual quick order
- Excel / CSV upload
- Paste a list
- Saved list
- Previous order
- API / procurement integration
- DMS / punch-out entry point

## Bulk Validation

For each line:

- Valid part
- Unknown part
- Superseded part
- Alternative available
- Quantity issue
- Availability
- Lead time
- Price
- Source

Example:

| Part | Qty | Result |
|---|---:|---|
| 21707132 | 12 | Available |
| 7421874421 | 4 | Superseded → 7421930122 |
| 21988711 | 6 | Part not found |
| 8143210 | 20 | 12 available / 8 backordered |

The user should resolve exceptions without going line by line through a retail shopping flow. Reuse the existing bulk-order implementation where suitable. CSV, Excel, DMS and punch-out are distinct capabilities: do not imply that an existing CSV import proves XLSX or procurement integration support. Partial availability is not automatically a backorder promise; validate the fulfilment behavior before showing it as orderable.

---

# 8. Cart / Order Builder

The cart should behave as a **B2B order workspace**, not simply a basket.

Recommended header context:

- Customer
- Organization
- Workshop / organizational unit
- Accounting cost center, where required
- Vehicle / VIN
- Work Order
- Urgency
- Buyer

Recommended order-level fields:

- PO number
- Internal reference
- Customer reference
- Ship-to
- Requested delivery date
- Comment to dealer
- Attachment

Recommended line-level information:

- Vehicle association
- Availability
- Lead time
- Source / seller
- Freight
- Price
- Alternatives
- Covered by contract or not
- Backorder status

The interface should clearly explain when fulfilment is split across multiple sources.

---

# 9. Quotes

Quotes should be a first-class portal area.

## Quote List

Recommended columns:

- Quote #
- Customer
- Location / Cost Center
- Vehicle
- Created by
- Value
- Status
- Expiry
- Last update

Illustrative business labels only:

**Draft → Requested → Under Review → Revised → Approved → Ordered / Expired**

Before implementation, map these labels and every action to the actual quote service states and transitions. Do not build an independent quote workflow in the front end. Verify adjustment requests, attachments, negotiation and conversion individually; unavailable API actions remain explicit gaps, not silent mocks.

## Quote Detail

Example:

### Quote QT-10457

**Customer:** Acme Logistics  
**Location:** Dallas Workshop  
**Vehicle:** Volvo VNL 860  
**Work Order:** WO-38472

The screen should include:

- Quote lines
- Quantities
- Price
- Negotiated adjustments
- Availability
- Notes
- Attachments
- Conversation / timeline
- Accept
- Reject
- Request adjustment
- Convert to order

---

# 10. Orders

## My Orders

Filters:

- Status
- Date
- Buyer
- Organization
- Location
- VIN
- PO number
- Dealer
- Work order

## Order Detail

Show:

- Order status
- Lines
- Vehicle association
- Fulfilment source
- Split shipments
- Tracking
- ETA
- Partial fulfilment
- Backorders
- Documents
- Comments
- Reorder action
- Return / claim action

---

# 11. My Organization

The portal should expose the B2B organization model using vocabulary familiar to Volvo customers.

Recommended labels:

| VTEX concept | Portal wording |
|---|---|
| Organization | **Company** |
| Organizational unit | **Division / Location / Workshop / Branch**, according to its actual purpose |
| Accounting cost center | **Cost Center** — an accounting allocation, not automatically a physical site |
| Address | **Billing / Delivery Address** — linked to the permitted context |
| Users | **Team** |
| Roles & permissions | **Purchasing Permissions** |

Example:

## Acme Logistics

**4 Locations · 18 Users · 42 Vehicles**

Tabs:

- Locations
- Users
- Purchasing Permissions
- Addresses
- Commercial Contracts
- Budgets
- Accounting Fields

### User Roles

Possible demo personas — map each to verified Buyer Portal roles and permissions; labels alone grant no rights:

- Organization Admin
- Buyer
- Senior Buyer
- Approver
- Workshop Manager
- Fleet Manager
- Read Only

### Purchasing Controls

- Allowed location
- Approval threshold
- Shared lists
- Shared carts
- Order visibility
- Quote visibility
- Ship-to restrictions

---

# 12. Returns & Claims

Provide a bounded demo journey only after naming its external system or fixture source. Returns, warranty claims, core returns and credit issuance are distinct processes. Do not imply that an OMS order API supplies a complete claims workflow. Real submissions require an identified destination, returned reference and retrievable status; otherwise present the journey as a labeled mock or storyboard.

## Start a Return

- Select order
- Select line
- Quantity
- Reason
- Core return?
- Warranty?
- Upload photo/document
- Comment
- Submit

## Status

Example:

**Return RT-00845**

- Submitted
- Under review
- Approved
- Part received
- Credit issued

This is particularly useful because Volvo's current landscape includes return/credit processes that are not consistently handled inside the commerce experience.

---

# 13. Parts Assure

Supports **1F — Vehicle service and maintenance / Parts Assure**.

Keep three contract concepts separate: **commercial purchasing contracts** in Buyer Portal, **maintenance/coverage contracts** from Parts Assure systems, and **digital-service subscriptions**. The portal can connect their presentation but must not merge their identifiers, eligibility or payment rules. Coverage and claim decisions come from the designated external authority or explicitly labeled demo fixtures.

## Contracts

Each contract should show:

- Vehicle
- Contract ID
- Contract type
- Start/end dates
- Status
- Covered operations
- Eligibility

## Contract-Aware Order

During ordering:

- Recognize vehicle
- Recognize active contract
- Identify covered operations
- Identify eligible parts
- Distinguish covered / non-covered lines
- Apply the correct contract/payment logic

## Claims

- Create claim from order
- Reuse vehicle, job and part information
- Submit supporting data
- Display claim deadline
- Track status
- Link to service record

---

# 14. Connected Vehicle / Complete Vehicle Need

Supports Volvo's P2 scenario.

Example entry point:

> **Brake wear detected**  
> Intervention recommended within 2,000 km

The portal should help the user build a complete response:

### Vehicle Need

- What happened?
- Severity
- Can the vehicle continue operating? Display only guidance supplied by an authoritative Volvo source; neither the UI nor an AI assistant may infer this decision.
- Recommended timeline

### Complete Solution

- Required parts
- Workshop / service option
- Relevant contract / entitlement
- Digital service where applicable

Actions:

- **Buy Parts**
- **Book Service**
- **Activate Service**
- **Contact Dealer**

This illustrates a broader vehicle-centric experience. Predictive alerts, safety guidance, workshop booking and digital provisioning require identified external sources and action destinations. For this demo, use a bounded storyboard or declared fixture where no integration exists; do not simulate successful real booking or activation.

---

# 15. Dealer / Human Handover

Dealer handover should be treated as a capability, not as a failure of self-service.

Use it when:

- Part is restricted
- Certified installation is required
- Warranty requires intervention
- Customer needs expert support
- Commercial exception requires dealer involvement

The handover should preserve:

- Customer
- Organization
- Vehicle / VIN
- Problem description
- Search history
- Selected parts
- Cart
- Quote
- Work order

Principle:

**Never make the user start again.**

---

# 16. What Should Not Be Inside This Customer Portal

## Use Case 1A — Bring My Offer to Market

Do not place this in the Customer Portal.

It belongs to a different application and different personas:

### Volvo Supplier / Commerce Portal

Target personas:

- Supplier
- Market Company
- Commercial Admin
- Commerce Admin

Potential functions:

- Supplier offer management
- Price / stock / lead time
- Offer activation
- Markets
- Brands
- Channels
- Customer/dealer segments
- Publication
- Governance
- Performance

The Customer Portal and Supplier Portal can share the same commerce foundation, but they should not share the same navigation.

---

# 17. Future Vehicle Commerce

Do not build a complete new/used truck purchase experience for the current demo.

Volvo positions New and Used Vehicle commerce primarily as an **extensibility test**.

The portal architecture should nevertheless allow future sections such as:

## Vehicle Acquisition

- Configure next truck
- My vehicle proposals
- New truck quotes
- Used vehicles
- Dealer collaboration
- Financing proposition
- Service contract
- Connected services
- Acquisition orders

The main message is that the same:

- Customer
- Organization
- Fleet
- Vehicle
- Dealer
- Quote
- Commercial context

can later be reused without creating another disconnected commerce silo.

---

# 18. Delivery Sequence — Complete Journeys Before Screen Expansion

The full target remains in scope. Sequence implementation into demonstrable slices:

1. **Portal foundation and My Account coverage map**: navigation, responsive layout, authentication/sign-out, organization/site context, role-aware navigation and the capability matrix in section 21.
2. **First complete purchase journey**: search or existing bulk import → cart → working checkout → order detail → approval where applicable. Include required accounting fields and verify actual server-side permissions. Resolve the existing checkout blocker; do not assume a new interface bypasses it.
3. **Complete account operations**: quotes and permitted transitions, organization/team/roles, addresses, payment methods, saved lists, budgets, commercial contracts, profile and accounting settings. Deliver all target My Account capabilities or explicitly report unresolved API gaps.
4. **One Volvo vehicle journey**: fleet → vehicle → authoritative compatible part → purchase or contextual dealer handover. Support stock orders without a vehicle.
5. **Bounded extensions**: Parts Assure, returns/claims and connected-vehicle needs, each classified as real integration, mock or storyboard.

In parallel, validate **scenario 1E on the existing storefront and guest checkout** once the checkout issue is resolved. Do not create duplicate guest flows in the portal.

Visual design may explore the full experience early, but a designed screen is not evidence of a working capability.

---

# 19. Target Coverage and Demo Priorities

## Required Target — Full Customer Account Coverage

- Custom Volvo portal shell, navigation and role-aware dashboard
- Authorized organization/site/contract context
- Profile, preferences, sign-out and supported account/security flows
- Organization structure, users, roles and permissions
- Billing/delivery addresses and permitted site associations
- Payment methods, supported saved-method operations and commercial payment terms
- Commercial contracts, purchasing rules, budgets and accounting fields
- Approval queue and permitted approve/reject actions
- Saved lists and replenishment
- Quotes, details and supported lifecycle actions
- Orders, details, documents and supported post-order actions
- Quick/bulk ordering and cart connected to the existing checkout

“Required target” does not assert that every operation has a usable API today. The matrix must verify coverage before implementation is promised or completion declared. Standard My Account screens are not the intended final interface.

## Volvo Demo Slice

- Fleet and vehicle detail with an identified data source
- Part discovery and results, with authoritative compatibility and supersession data or declared fixtures
- Vehicle/work-order association where applicable
- Contextual dealer handover with a defined receiving system or explicit demo endpoint

## Bounded Integration or Declared Illustration

- Returns, core returns, warranty claims and credits
- Parts Assure coverage and service records
- Vehicle alerts and complete-solution screen
- External documents, attachments and notifications

## Future / Storyboard Only Unless Explicitly Added

- Connected-service provisioning and subscription lifecycle
- New/used truck acquisition and financing
- Advanced predictive maintenance
- Live DMS/punch-out integration without a separately verified scope

---

# 20. Core Design Principle

The portal should make one idea obvious:

> **The customer should not have to understand Volvo's internal systems in order to get their job done.**

The portal should reuse persistent context across the entire journey:

**Company → Organizational Unit / Site → Optional Vehicle or Multi-Vehicle Context → Need → Part / Quote / Order / Service**

That context is what turns a collection of e-commerce features into a coherent B2B customer portal.


---

# 21. Capability Coverage and Evidence Matrix

Maintain one row per actionable capability, not just one row per menu. The following is the starting inventory, not verified endpoint documentation. Record exact API operations and permissions during technical validation; do not guess routes or substitute privileged credentials for buyer authorization.

| Capability / screen | Persona and authorization | Service or source to verify | Delivery mode | Acceptance evidence |
|---|---|---|---|---|
| Organization, units, commercial contracts | Organization admin; permitted unit scope | Installed Buyer Portal organization/contract services | Real target; API mapping pending | Read/change permitted data; cross-organization access rejected |
| Team and roles | Authorized user/role manager | Buyer Portal user and permission services | Real target; API mapping pending | Authorized user operation persists; buyer cannot elevate rights |
| Addresses | Buyer/address manager according to permissions | Address services and unit scopes | Real target; API mapping pending | Address persists and is usable only in the permitted purchasing context |
| Payment methods and terms | Buyer or authorized manager | VTEX checkout/payment services and commercial scopes | Real target; API mapping pending | Supported method operations persist; checkout presents authorized methods; use supported tokenized/hosted handling for sensitive payment data |
| Profile and sign-out | Current user | Installed identity/profile services | Real target; API mapping pending | Profile update persists; sign-out ends access; no credential management reimplementation |
| Quotes | Buyer, negotiator or approver as supported | Actual quote service and state transitions | Real target; API mapping pending | Request, permitted revisions and conversion reflect backend state |
| Orders and documents | Buyer/organization viewer within scope | VTEX order services; external document source where needed | Real target; API mapping pending | Correct visibility, status, lines and document ownership |
| Approvals | Requester and authorized approver | Buyer Portal purchasing-policy/authorization services | Real target; API mapping pending | A real order triggers a rule; authorized decision changes its state |
| Budgets and accounting | Buyer view; authorized manager mutations | Buyer Portal budget/accounting services | Real target; API mapping pending | Balance and rules agree with service; bulk field entry survives checkout |
| Lists and quick/bulk order | Authorized buyer; sharing scope as supported | Existing bulk engine, list services, catalog and checkout | Real target; browser validation pending | Quantities, exceptions and seller offers survive actual cart/order flow |
| Fleet, VIN and fitment | Authorized fleet user | Volvo fleet/technical source or explicit fixture | Decide per scenario | Data provenance and expected compatible/incompatible cases documented |
| Returns, claims and Parts Assure | Eligible customer/service user | Named external claims/coverage/service system | Integration or declared mock/storyboard | Real reference/status if integrated; no false submission if simulated |
| Dealer handover / delegated buying | Authorized customer or dealer | Receiving service and delegated contract-access APIs | Verify separately | Context received; delegation cannot expose another customer without authorization |
| Alerts, booking and activation | Eligible fleet/service user | External connected/service systems | Storyboard unless integrated | Source and action destination explicit; no unsupported safety inference |
| Anonymous/mobile ordering | Guest on existing storefront | Existing guest checkout and account settings | Selected approach; checkout blocked/unvalidated | Mobile guest purchase completes after checkout fix; private B2B data stays inaccessible |

For each row, add: exact screen and actions, API/version, data owner, organization context, prerequisites, actual implementation status (**configured / implemented / technically tested / validated in a real journey**), evidence reference and remaining gaps. Real/mock/storyboard is a separate classification from implementation status.

The portal must enforce permissions server-side, not merely hide buttons. Context changes must be checked by the relevant services. This document authorizes no account configuration change and makes no claim that the existing checkout or measurement harness is already validated.
