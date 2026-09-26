# Volvo eCom THINKIT — The Use Cases Volvo Asked For

> **Source des besoins Volvo, conservée sans réécriture métier — 25 septembre 2026.** Pour la réponse implémentée et les écarts, consulter la [matrice actuelle](../MATRICE_CAPACITES_VOLVO.md) ; ce document n’est pas un bilan de livraison.

**What this is.** A faithful restatement of the nine use cases Volvo defined in *"Volvo request for workshop 2 — Ecom thinkit Kick off, Week 40"* (Volvo, 9 September 2026).

**What this is not.** There is no VTEX position in this document, no demo plan, no implementation view. It contains only what Volvo asked for, in Volvo's own framing, so that any plan can be checked against it.

**How to use it.** Read a use case, then ask of the plan: does it cover the journey steps? does it answer the "what Volvo wants to explore" questions? A plan that covers the journey but ignores the explore questions has missed the point — those questions are what Volvo said they want vendors to address.

> Volvo's own caveat, quoted: *"These use cases represent initial hypotheses based on Volvo Group's current Trucks eCommerce landscape, known customer needs and observed usability pain points. They are intended to help vendors understand the complexity of our ecosystem and demonstrate how a future commerce platform could support the journeys, not define the final solution."*

---

## Scope and priorities

| Priority | Scope | Volvo's framing |
|---|---|---|
| **P1** | Parts | Primary focus and initial delivery scope. Establish the future e-commerce platform capabilities required to support and grow the Parts business across brands and markets. |
| **P2** | Services & connected services | Closely linked to Parts and therefore considered in the target capabilities, architecture and requirements. **Implementation remains outside the initial delivery scope.** |
| **P3** | New vehicle sales | Future use case, with an identified RT LCV priority. Ensure today's platform decisions enable future expansion toward vehicle commerce without requiring a separate commerce solution. |
| **P4** | Used vehicle sales | Ensure the platform can be extended to support used-vehicle sales in the future without requiring a separate solution. |

**Time allocation Volvo requests for the use-case discussion:** approximately **75% Parts, 15% Services & Connected Services, 10% P3/P4 combined.**

**A labelling inconsistency in the source, for the record.** The High Level Scope slide lists P3 as New vehicle sales and P4 as Used vehicle sales, while the use-case table and the detailed cards do the opposite (use case 3 = New vehicles, tagged P4; use case 4 = Used vehicles, tagged P3). Use case 1F is tagged P1 in the table and P2 on its card. The business intent is unambiguous — Parts first, Services second, vehicles as extensibility — so the numbering is not worth resolving.

---

## The nine use cases at a glance

| # | Use case | Target users | Core outcome Volvo wants |
|---|---|---|---|
| **1A** | Bring my offer to market | Supplier / Market Company / Commercial Admin | Seamless product-to-commercial-offer flow |
| **1B** | Get my customer's truck back on the road | Dealer Parts Manager / Dealer & Workshop Buyer | Right parts, conditions and fulfilment with minimum downtime |
| **1C** | Replenish my Parts stock | Dealer / Fleet / Workshop Buyer | Fast professional workflow for large & recurring Parts orders |
| **1D** | Help me find the right Part | Fleet / Workshop / Technician / Buyer | Right part, first time, with confidence |
| **1E** | Keep my truck running | Owner-Operator / Driver / Small Fleet | Help me first. Identify me when needed. Never start again. |
| **1F** | Vehicle service & maintenance — Parts Assure | Fleet Manager / Owner-Operator / Independent Workshop | Self-maintenance with Volvo Parts and seamless contract/claim handling |
| **2** | Solve my complete vehicle need | Fleet / Operator / Owner-Operator | Solve the vehicle need across Parts, Services & Digital |
| **3** | Configure & acquire my next Truck | Fleet Buyer / Transport Company / Owner-Operator / Dealer | Reuse fleet context to configure and acquire the right truck |
| **4** | Find & acquire the right Used Vehicle | Fleet Buyer / Transport Company / Owner-Operator | Seamless vehicle acquisition into the Volvo ownership lifecycle |

---

# P1 — PARTS

## 1A — Bring my offer to market

> *From approved product to sellable offer across the right markets, brands and channels*

**Target users:** Supplier · Market Company · Internal Commercial/Admin User

**User goal, in their words:** "My product is approved and ready. Help me turn it into the right commercial offer and make it available to the right dealers/customers and channels with minimum effort and without having to navigate Volvo's systems and organization behind it."

**The situation Volvo describes:** A supplier introduces a new replacement part. The product data, images, technical documentation and vehicle compatibility already exist and have been approved. The challenge is no longer creating the product — it is turning it into a sellable commercial offer with self-service: which markets? which brands? which channels? which dealers/customers? under which commercial conditions? And doing so without recreating or maintaining information Volvo already has. The offer may become part of the overall assortment, or be offered through a specific vendor shop.

**Target journey:**

1. **Become commerce-ready** — supplier onboarded → product enriched & validated → approved. *"Reuse my approved product information, don't make me maintain it again in Commerce."*
2. **Create the commercial assortment** — approved product → markets/brands/channels → dealer/customer segments. *"Let me decide where and to whom my product should be offered."*
3. **Define the commercial offer** — supplier → commercial conditions incl. pricing → availability → relevant offer information. *"Make it clear how and under which conditions my product will be sold."*
4. **Preview the experience** — product & offer → customer/dealer view → related products/alternatives. *"Show me what my customer will actually see."*
5. **Activate across channels** — ready → approve → publish → available. *"Make the move from approved product to sellable offer fast and transparent."*
6. **Maintain & optimize** — commercial changes → availability → activate/deactivate → performance insights. *"Let me maintain it once and understand how it performs."*

**Pain points to remove:** Duplicate data · unclear ownership · manual handovers · slow activation · inconsistent channel information · limited publication visibility · high administration

**Target outcome:** One seamless path from approved product to sellable offer.

**Important scope consideration, quoted:** *"The Supplier Admin Portal/PIM is expected to cover a significant part of: Supplier onboarding → Product onboarding → Product data & enrichment → Classification → Data quality → Approval. Think IT vendors should therefore not assume these capabilities need to be duplicated in eCommerce. Where should Supplier Admin/PIM end, where should Commerce begin, and how can the experience work seamlessly across the two?"*

**What Volvo wants to explore:**

- Seamless product-to-commerce flow: where should PIM end and Commerce begin?
- Multi-market commercialization: one product, different markets/brands/conditions without duplication?
- Low-touch activation: how much can be automated from approval to publication?
- Extended offer readiness: can suppliers self-manage relevant offers and inventory, with Volvo governance and approval, and could this extend to third-party offers where relevant?

---

## 1B — Get my customer's truck back on the road

> *From urgent vehicle need to the right Parts solution with speed, context and minimum downtime*

**Target users:** Dealer Parts Manager · Dealer Buyer · Workshop Buyer

**User goal, in their words:** "Help me identify, source and order the right Parts fast based on the customer, vehicle, job and urgency without making me understand Volvo's systems and supply network behind it."

**The situation Volvo describes:** A truck needs an urgent repair. The dealer knows the customer, VIN and work order. They need to quickly identify:

1. The right part, comparing Genuine, Reman, Road Choice and Extended Offer options based on vehicle age and model.
2. Availability and lead time.
3. The freight cost — and then secure the best option based on the customer and their situation. *"Frequently Speed is more important than Price, especially for VOR situations."*

**Target journey:**

1. **Understand need** — DMS or punch-out or Commerce → customer → fleet → vehicle → work order → urgency (VOR, emergency, maintenance or normal)
2. **Find & compare Parts** — known part / vehicle → Genuine / Reman / Road Choice / Extended Offer → supersessions & alternatives
3. **Select best option** — compatibility → availability → lead time → price → freight
4. **Source & orchestrate** — dealer stock → Volvo warehouse → other warehouse → supplier direct → route/split orders across SAP/backends
5. **Apply commercial conditions & order** — customer/dealer → negotiated price → dealer tier/discount → credit terms → rebate → invoicing conditions → work-order/reference → ship-to → submit
6. **Track & resolve** — delivery → partial fulfilment → replacement → discrepancy → core return

**Pain points to remove:** Difficult ordering · system switching & re-keying · fragmented Parts alternatives · manual urgency workarounds · unclear availability & freight · multiple orders/backends · manual exceptions

**Target outcome:** The right Parts solution, at the right commercial conditions, with the right urgency and fulfilment, through one coherent dealer ordering experience.

**Important scope consideration, quoted:** *"'Best' depends on context. For VOR/emergency, speed and availability may outweigh price. For planned needs, cost and freight may matter more. Fulfilment can span warehouses, suppliers and different SAP/order systems complexity that should be orchestrated behind one experience. Dealer involvement may also vary by market and flow, including billing, returns and exceptions."*

**What Volvo wants to explore:**

- Context-aware commerce: can Customer + Vehicle + Work Order + Urgency drive the right decision?
- Dealer commercial model: can negotiated pricing, dealer tiers, discounts, credit, rebates and invoicing rules be consistently applied?
- Intelligent fulfilment: can one order be sourced/split across dealer stock, warehouses, suppliers and SAP/backends?
- Embedded commerce: can dealers access the same capabilities through DMS, punch-out, API or Commerce UI without losing context?
- One Parts offer: can Genuine, Reman, Road Choice and Extended Offer be compared coherently?

---

## 1C — Replenish my Parts stock

> *From large Parts list to efficient replenishment built for professional, repetitive purchasing*

**Target users:** Dealer Parts Manager · Dealer Buyer · Fleet/Workshop Buyer

**User goal, in their words:** "I don't want to shop. I have 150 Parts to replenish. Help me get the job done quickly, accurately and with minimum manual effort."

**The situation Volvo describes:** A dealer or large fleet needs to replenish stock across one or several locations. The buyer may already have 150 known part numbers in Excel, a saved list, a previous order or a purchasing system containing exactly what is needed. *"They are not looking for inspiration."* They need to process a large, repetitive and commercially significant transaction efficiently. Speed and accuracy matter more than browsing. Different buyers may have different rights, budgets and approval levels.

**Target journey:**

1. **Start my way** — Excel/bulk upload → saved list → previous order → DMS/procurement → browse
2. **Build the order at scale** — many parts → quantities → validate numbers → identify replacements → resolve errors
3. **Apply my org & rules** — account → site/workshop → buyer role → purchasing rights → shared cart/list → budget/approval
4. **Optimize the order** — my price → conditions → availability → freight → sources → consolidate/split
5. **Order & manage** — ship-to → references → approval → submit → track → partial fulfilment/returns
6. **Replenish again** — consumption → stock need → recommendation/refill → reorder

**Pain points to remove:** Spreadsheet workarounds · repeated entry · item-by-item ordering · weak account hierarchy · manual approvals · unclear freight · manual exceptions · poor repeat-order experience

**Target outcome:** Large and recurring Parts orders become a fast professional workflow, not a long shopping journey.

**Important scope consideration, quoted:** *"Professional buyers need high-speed workflows for known Parts, large quantities and repeated purchasing. The existing value of quick order, bulk upload, saved lists, previous orders and refill/replenishment should be strengthened rather than lost. Large fleets/dealers may operate multiple workshops, locations and buyers under one account hierarchy."*

**What Volvo wants to explore:**

- Professional efficiency: how fast can hundreds of known Parts be ordered?
- Multiple entry points: UI, Excel, DMS, punch-out, procurement system or API?
- Delegated purchasing: can locations, roles, budgets, shared lists/carts and approvals be managed?
- Intelligent replenishment: can usage, fleet and inventory data anticipate what should be replenished?
- Bulk intelligence: can errors, supersessions and alternatives be resolved at scale?

---

## 1D — Help me find the right Part

> *From "I know my vehicle or problem" to "I know this is the right Part" — and I can use it*

**Target users:** Fleet Parts Manager · Workshop Manager · Technician · Professional Buyer

**User goal, in their words:** "Help me get the right Parts quickly and confidently whether I know the part number, know the vehicle, bought it before or only know the problem I'm trying to solve."

**The situation Volvo describes:** One technician knows the VIN and the repair but not the part number. Another knows exactly what they need. Another starts from a diagram, a previous order or a work order. *"The experience should adapt to what the user already knows, rather than force everyone through the same search journey."* And: *"Finding a Part is not enough: the user needs confidence that it fits, is eligible for the vehicle/user and is appropriate for the repair, so understanding how it should be applied to secure the right choice."*

**Target journey:**

1. **Start the way I work** — part number or VIN/chassis or work order or fleet number or diagram, previous order, bulk list, or maintenance/problem
2. **Identify & confirm** — search → vehicle compatibility → eligibility → diagram → technical information
3. **Understand the options** — supersession → Genuine/Reman/Alternative → restrictions → installation requirements (incl. dealer or certified installation)
4. **Build naturally** — direct add → quantities → multiple parts → bulk import
5. **Know if I can get it** — requested quantity → availability → lead time → delivery/pick-up
6. **Resolve & buy** — unavailable → replacement/alternative → different source → buy → track → return/reorder

**Pain points to remove:** Forced linear journeys · system switching · weak search · wrong/uncertain fit · lost supersessions · missing technical context · manual eligibility checks

**Target outcome:** Right Parts, first time, with confidence and minimum downtime.

**Important scope consideration, quoted:** *"The goal is not simply 'find a Part' but 'know it is the right Part.' Technical information may remain in specialist systems and certain Parts may require specific VIN eligibility, campaign/recall status, dealer role or certified installation. Commerce should surface the right information and rules in context rather than duplicate specialist capabilities."*

**What Volvo wants to explore:**

- Flexible discovery: can users start with Part, VIN, vehicle, diagram, previous order or problem?
- Vehicle-aware search: can results prioritize only relevant Parts?
- Compatibility & eligibility: does it fit, and is this vehicle/user allowed to buy/use it?
- Technical confidence: can the right technical information appear at the right moment?
- AI-assisted discovery: can natural language + vehicle context move from "What do I need?" to a confident recommendation?

---

## 1E — Keep my truck running

> *A simple, mobile-first Parts experience for owner-operators and small fleets (incl. guest shopping)*

**Target users:** Owner-Operator · Driver · Small Fleet Customer · Anyone — anonymous shopper

**User goal, in their words:** "Help me get the right Parts quickly and confidently whether I know the part number, know the vehicle, bought it before or only know the problem I am trying to solve."

**The situation Volvo describes:** An owner-operator is standing next to their truck with a phone and needs to solve a problem. They may know their vehicle and what is wrong, but not the part number. They may not have a Volvo account, may not remember their credentials, or may simply be visiting Volvo's digital experience for the first time. *"They should not need to understand Volvo's systems or identify themselves before Volvo can start helping."*

Volvo's imagined flow: Open → Identify my truck → Describe/search my need → Find compatible Parts → Understand my options … *"and only then log in or create an account when it adds value or is required to complete the transaction."*

**Target journey:**

1. **Start without logging in** — open mobile/web → search Parts → enter VIN/chassis or identify vehicle → describe my need. *"Help me first — ask me to identify myself when it becomes necessary."*
2. **Find & confirm the right solution** — vehicle/problem → compatible Parts → alternatives → basic technical information. *"Show me what fits my truck and help me understand my options."*
3. **Understand availability & offer** — availability → indicative/relevant offer information → delivery/pick-up options. *"Let me understand whether Volvo can solve my need before asking me to create an account."*
4. **Authenticate when needed** — continue as guest **or** log in / create account when customer-specific information or the transaction requires it. *"Don't make authentication the first step if it doesn't need to be."*
5. **Personalize & complete** — recognize customer → apply customer/dealer relationship incl. purchasing rights (access more SKUs) → customer-specific price/conditions → delivery/pick-up → purchase
6. **Or hand over without starting again** — specialist support required → dealer/workshop or restricted-dealer part or dealer workshop certified → carry vehicle + need + selected Parts context
7. **Continue the relationship** — track → return/warranty → order history → save vehicle → reorder → personalized future experience

**Pain points to remove:** Login as the first barrier · having to know the part number · desktop-centric experience · generic search without vehicle context · losing progress when logging in · re-entering vehicle · Volvo system complexity

**Target outcome:** Help me first. Identify me when needed. Never make me start again.

**Important scope consideration, quoted:** *"This use case deliberately tests an experience that starts before authentication. Not everything needs to be available anonymously. Customer-specific pricing, commercial conditions, dealer relationships, order rights, entitlements or purchasing rights may require authentication. The target model may combine direct self-service and dealer involvement. Some Parts may be purchased and fulfilled directly, while restricted or safety-critical Parts, certified installation, warranty, returns or specific commercial conditions may require dealer involvement."*

**What Volvo wants to explore:**

- Value before login: how far can users go anonymously?
- Vehicle before identity: can VIN/chassis start the journey?
- Progressive identification: when is login really needed?
- Anonymous to fleet context / personalized: can vehicle, search and cart context carry into the customer's fleet account, purchasing rights and conditions?
- Mobile & AI discovery: can vehicle data and AI simplify finding the right solution?
- Self-service vs dealer-assisted: can the platform determine when the customer can buy directly and when dealer/certified support is required, while preserving full context?

---

## 1F — Vehicle service and maintenance (Parts Assure contract)

> *Easy way for customers to secure Parts supply and estimate cost for Services*

**Card is tagged P2 — Parts Assure Contract; the use-case table lists it under P1.**

**Target users:** Fleet Manager · Owner-Operator · Workshop Manager (independent)

**User goal, in their words:** "Customer can purchase parts and submit claim trough eCom platform. Reducing admin at the dealer."

**The situation Volvo describes, quoted:** *"Parts Assure contracts are specific service contracts where all work under this contract is done by the customer itself. Parts order for vehicles under this specific contract type can be managed in a normal way, just with few additional business rules applied. Main rule is that all operations under the job with parts assure contract payment code will have 0 cost. This is due to all work shall be done by the customer and only parts can be processed in the contract claim. Claim needs to be done within stipulated time frame."*

**Target journey:**

1. **Identify vehicle & service need** — vehicle/VIN → maintenance need → job/operation → required Parts
2. **Recognize contract & coverage** — customer + vehicle → active Parts Assure contract → entitlement → eligible operations/Parts
3. **Build the Parts order** — required Parts → compatibility → availability → alternatives where allowed → complete order
4. **Apply contract rules** — payment code → coverage rules → **0 cost where applicable** → separate covered/non-covered Parts → confirm conditions
5. **Order & perform service** — order → fulfilment → receive Parts → customer performs work → capture service information
6. **Submit claim & record service** — prepare claim → reuse order/job information → submit within stipulated timeframe → claim status → update vehicle service record

**Pain points to remove:** Customer navigating and quality on reporting performed operations on vehicle · risk of losing contact between customer and dealer rep

**Target outcome:** Customers can conduct service by themselves on their vehicles with Volvo original parts and maintain a well-kept service record.

**Important scope consideration, quoted:** *"Parts Assure is a specific service-contract scenario where the customer performs the work themselves. The Parts purchasing process should remain as close as possible to the standard Parts journey, with additional contract, eligibility, payment and claim rules applied when relevant. The purpose is not to build a Parts Assure-specific commerce solution, but to test whether the future platform can support reusable contract-aware and entitlement-aware commerce capabilities that could also support other service-contract models."*

**What Volvo wants to explore:**

- Contract recognition: can customer + vehicle context automatically identify an active Parts Assure contract?
- Eligibility: can the platform determine which jobs, operations and Parts are covered?
- Contract-aware ordering: can contract rules be applied seamlessly within the standard Parts journey?
- Commercial rules: can eligible Parts be handled at zero cost, while non-covered items follow normal conditions?
- Order-to-claim continuity: can vehicle, job and Parts-order data flow directly into the claim?
- Claim management: can claim submission, validation and time-limit rules be supported or orchestrated?
- Service record: can customer-performed work be captured against the vehicle after completion?
- Extensibility: can the same capabilities support other service-contract and entitlement models?

---

# P2 — PARTS, SERVICES & CONNECTED SERVICES

## 2 — Solve my complete vehicle need

> *From vehicle need to complete solution — Parts, Services and Digital capabilities working together*

**Target users:** Fleet Manager · Vehicle Operator/Driver · Owner-Operator · Workshop Manager (independent)

**User goal, in their words:** "I don't care which system owns the solution. Help me solve my vehicle need and keep my truck operating."

**The situation Volvo describes:** *"Brake wear detected — intervention recommended within 2,000 km"* (i.e. connected data). *"The customer should not need to determine whether the answer belongs to Parts, workshop Service, a Service Contract, Connected Services or a dealer. Volvo already knows the vehicle. The opportunity is to turn that knowledge into the next best action."*

**Target journey:**

1. **Recognize the need** — vehicle event → maintenance → diagnostic → driver observation → workshop finding
2. **Understand impact** — what happened? how urgent? operational impact → can I continue driving?
3. **Build the complete solution** — Parts + workshop Service + Service Contract/entitlement + Connected/Digital Service
4. **Plan around my operation** — Parts availability → workshop availability → location → vehicle schedule → downtime
5. **Buy, book or activate** — buy Parts → book Service → trial / subscribe / upgrade Digital Service → combine where relevant
6. **Activate, follow & prevent** — entitlement → provision to vehicle/fleet → status → manage/renew → back in operation → predictive next action

**Pain points to remove:** Customer navigating organizational silos · separate Parts/Service/Digital journeys · re-entering vehicle context · unclear entitlement · disconnected booking and purchasing · no end-to-end view of vehicle resolution

**Target outcome:** The customer solves a vehicle need, not a Volvo system flow problem.

**Important scope consideration, quoted:** *"Parts remains the primary initial delivery priority. This case tests whether the future foundation can extend into a broader vehicle-centric ecosystem without creating separate customer experiences. Digital Services introduce a different commerce lifecycle: Discover → Trial → Subscribe → Activate → Provision to vehicle/fleet → Upgrade/Renew/Cancel."*

**What Volvo wants to explore:**

- Vehicle-centric commerce: can VIN/vehicle condition become the starting point?
- Complete solution: can Parts + Service + Digital be presented around one need?
- Digital commerce lifecycle: Trial → Subscribe → Activate → Upgrade → Renew/Cancel?
- Vehicle-level entitlement: can the right capability be activated for the right vehicle/fleet?
- Real-time provisioning: can a purchase trigger activation in connected-vehicle systems?
- Flexible monetization: one-time, subscription, **usage-based** or bundled offers?

---

# FUTURE VEHICLE COMMERCE (extensibility tests)

## 3 — Configure & acquire my next Truck

> *From operational need to the right vehicle proposition — without starting from a blank page*

**Card is tagged P4 — New Vehicles.**

**Target users:** Fleet Buyer · Transport company · Owner-Operator · Dealer Sales Representative

**User goal, in their words:** "I already know what works in my operation. Help me define my next truck and progress seamlessly from operational need to a solution."

**The situation Volvo describes:** A fleet manager needs another truck similar to one already performing well. Rather than starting from zero, they select a truck and say *"build another like this."* The existing specification, fleet context and potentially operational/usage data provide a starting point. The customer and dealer then adapt the configuration and build the complete proposition together.

**Target journey:**

1. **Start from my need or fleet** — operational need → fleet/usage data → existing vehicle → cloned/recommended starting configuration
2. **Configure the right vehicle** — specification → application → configuration/compatibility rules → options → attachments/accessories
3. **Build the complete proposition** — vehicle → price/quote → TCO → financing & Service Contract → Connected Services → trade-in where relevant
4. **Collaborate** — customer team → dealer → save/share → refine → non-standard/discount approval
5. **Progress to purchase** — quote → approval → financing → order where appropriate
6. **Enter the ownership lifecycle** — add to fleet → activate Services → Service relationship → Parts/aftermarket

**Pain points to remove:** Starting from zero despite known fleet context · disconnected commercial journey · repeated vehicle information · separate Services/financing flows · context lost between digital and dealer interactions · another commerce silo

**Target outcome:** Extend into New Vehicle commerce without creating another disconnected customer ecosystem. Configure and acquire the right truck by reusing what Volvo already knows about the customer, fleet and operation.

**Important scope consideration, quoted:** *"This is an extensibility test, not an assumption that the future Commerce platform should replace specialist truck configuration or build-to-order capabilities. The question is how much common customer, fleet, pricing, collaboration, commercial and service context can be reused while specialist capabilities remain where they add value."*

**What Volvo wants to explore:**

- Fleet-aware configuration: can an existing truck or operational data provide the starting point?
- One engine, different audiences: can customer self-service and dealer-guided configuration reuse common capabilities?
- Commerce/configurator boundary: what belongs in Commerce vs specialist configuration?
- Complete proposition: vehicle + TCO + financing + Services + Digital?
- Collaboration & approvals: can customer and dealer work on the same proposition?
- Digital continuity: can quote → order → production progress happen without re-keying?

---

## 4 — Find & acquire the right Used Vehicle

> *From operational need to the right vehicle — and into the complete Volvo ownership lifecycle*

**Card is tagged P3 — Used Vehicles.**

**Target users:** Fleet Buyer · Transport company · Owner-Operator

**User goal, in their words:** "I don't just need a used truck. Help me find the right available vehicle for my operation and understand the complete ownership proposition."

**The situation Volvo describes:** A fleet needs another truck quickly. *"Unlike a Part, the customer is not choosing between identical SKUs. Every used vehicle is a unique VIN-level asset with its own: Specification → Mileage → Condition → History → Equipment → Location → Availability."*

**Target journey:**

1. **Define my need** — application → vehicle type → configuration → geography → budget
2. **Discover real vehicles** — available inventory → search/filter → VIN-level vehicle
3. **Understand & compare** — specification → condition → mileage → history → equipment → price
4. **Build the ownership proposition** — vehicle + financing + warranty + Service Contract + Connected Services + accessories
5. **Progress the purchase** — save → compare → request quote/reserve → dealer collaboration → acquire
6. **Enter the Volvo lifecycle** — add to fleet → activate Services → Service relationship → Parts/aftermarket

**Pain points to remove:** Fragmented vehicle information · weak comparison of actual vehicles · separate financing/Service journeys · lost context at dealer handover · disconnected purchase and ownership lifecycle

**Target outcome:** Acquire the right vehicle and immediately bring it into one continuous Volvo relationship.

**Important scope consideration, quoted:** *"P3 is a future priority, not the primary Parts delivery scope. It is included to test whether capabilities established for Parts and Services — such as identity, fleet/equipment context, commercial offers, dealer relationships and adjacent Services — can be reused for vehicle commerce."*

**What Volvo wants to explore:**

- Unique-asset commerce: can Commerce treat each vehicle as a unique commercial asset rather than simply another SKU?
- Complete proposition: can the vehicle be combined naturally with financing, warranty, Service Contracts, Connected Services and accessories?
- Digital-to-dealer continuity: can customers progress digitally and then involve a dealer without starting again?
- Lifecycle continuity: can the commercial relationship continue seamlessly from vehicle acquisition → Services → Parts → replacement vehicle?

---

# Cross-cutting expectations

Two things Volvo states outside the individual use cases, both of which apply to any plan checked against this document.

**On the common foundation, quoted:** *"Across all journeys, we want to explore on a high level how far a common commerce foundation can support different brands, markets, customer types and channels while sharing customer, fleet, vehicle/equipment and commercial context."*

**On what vendors are expected to do, quoted from the pre-requisites:** *"Priority user journeys/use cases — VG provides an initial baseline covering the most important user cases; vendors are expected to challenge, enrich and identify missing use cases/capabilities."*

That second one matters for any comparison exercise: covering all nine use cases satisfies only half of what Volvo asked. They also expect the gaps in their own list to be pointed out.

---

*Source: "Volvo request for workshop 2" — Ecom thinkit Kick off, Designing the future VG trucks commerce platform, Week 40. Volvo Group, 9 September 2026. 21 pages. Quotations are verbatim from that deck, including its original spelling.*
