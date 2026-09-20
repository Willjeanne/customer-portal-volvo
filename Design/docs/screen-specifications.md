# Screen specifications

> Visual reference details; use the [active framing](../../docs/CADRAGE_PORTAIL_VOLVO.md) for canonical navigation, WanderGarage data, implementation sequence and reconciliation rules. Mockup amounts and implied service behavior are not verified API capabilities.

## 1. Home

Reference: `assets/screens/01-home-buyer.png`

Purpose: orient the customer around urgent work and common tasks.

Key regions:

- Persistent company, location, optional vehicle and urgency context.
- Vehicle alert for Truck 147 with `Build a solution` as the primary action.
- Task launcher: find part, replenish stock, review quotes/approvals, track orders.
- `My work`: buyer-owned quote, delayed order and Parts Assure deadline.
- Preferred dealer as support context only.

## 2. My Fleet

Reference: `assets/screens/02-my-fleet.png`

Purpose: find a vehicle, understand its status and launch vehicle-specific work.

Key behavior:

- Search by VIN, fleet number, registration or model.
- Filter by location, status, model and contract.
- Table/list is primary; selected vehicle opens a contextual detail panel.
- Primary selected action: `View vehicle`; supporting actions find compatible parts and view orders.

## 3. Quick Order

Reference: `assets/screens/03-quick-order.png`

Purpose: add many parts quickly and resolve exceptions without a retail browsing flow.

Entry modes: manual part numbers, pasted list, file upload.

Required line outcomes: ready, superseded, unknown and partial availability. Vehicle/work order association is optional per line. Continue only with valid, selected lines and communicate that final availability and delivery are confirmed later.

## 4. Quote Detail

Reference: `assets/screens/04-quote-detail.png`

Purpose: let an authorized customer understand and act on a quote.

Required content: status, customer context, vehicle/work order, expiry, line items, adjustments, totals, approval threshold, updates and attachments.

Actions shown: approve, request adjustment and reject. Conversion to order is a subsequent state/action and must not be reported as completed prematurely.

## 5. Order Detail

Reference: `assets/screens/05-order-detail.png`

Purpose: explain order progress and split fulfilment clearly.

Required content: order metadata, progress, delayed-line alert, shipment-grouped lines, fulfilment source, ETA, totals, delivery address, tracking and documents.

Customer actions: track shipment, reorder, initiate an eligible return/claim and contact dealer. Do not expose warehouse or seller fulfilment controls.

