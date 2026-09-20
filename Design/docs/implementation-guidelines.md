# Implementation guidelines

> Mise à jour de phase : William a autorisé le démarrage de la réalisation locale après ce cadrage. Les mentions de phase documentaire ci-dessous sont historiques. Voir [le suivi de réalisation](../../docs/SUIVI_REALISATION.md) pour l’état implémenté et les limites actuelles.

## Recommended architecture

- Independent Next.js/React/TypeScript application with an integrated BFF, following the [active framing](../../docs/CADRAGE_PORTAIL_VOLVO.md); Vercel is proposed, not yet configured.
- Shared application shell for navigation and context.
- Typed domain models and service adapters for the installed VTEX Buyer Portal, orders, quotes and Volvo services. B2B Suite is not a substitute integration model.
- Fixture adapters for demo-only data, explicitly separated from production adapters.
- Central permission checks at route, section and action level, enforced server-side.
- Prefer existing services; use targeted backend extensions for missing capabilities, with persistence and server-owned rules. Missing native APIs do not automatically reduce a function to a storyboard.
- The current phase is documentation only; do not start implementation until William authorizes it.

## Suggested component inventory

- `AppShell`, `SideNavigation`, `CustomerContextBar`
- `PageHeader`, `Breadcrumbs`, `StatusChip`, `AlertBanner`
- `TaskList`, `WorkQueue`, `DataTable`, `FilterBar`, `SearchField`
- `VehicleRow`, `VehicleDetailPanel`, `VehicleAlert`
- `BulkOrderGrid`, `LineValidationState`, `UploadDropzone`
- `QuoteSummary`, `QuoteLineTable`, `ApprovalActions`, `ConversationTimeline`
- `OrderProgress`, `ShipmentGroup`, `TrackingPanel`, `DocumentList`
- `DealerSupportCard`, `EmptyState`, `ErrorState`, `PermissionState`, `Skeleton`

## Data and integration boundaries

- VTEX and Volvo services must remain separately identifiable.
- Buyer Portal and B2B Suite are not interchangeable API/data models.
- Fitment, eligibility, supersessions, diagrams and safety restrictions remain sourced from authoritative Volvo systems.
- OMS order data does not imply a complete returns or claims workflow.
- Every demo action must be tagged in implementation metadata as `real`, `fixture`, or `storyboard`.

## Responsive behavior

- Desktop is the primary target at 1440×1024.
- At tablet widths, collapse the side navigation and move secondary panels below the main content.
- At mobile widths, retain the company/location context, make vehicle optional, use stacked rows and preserve clear primary actions.
- Large tables need horizontal containment or responsive row views; never shrink body text below readable size.

## Accessibility and UX quality

- Minimum WCAG AA contrast target.
- Visible keyboard focus and logical tab order.
- Status must never be communicated by color alone.
- Inputs and icon-only controls require accessible labels.
- Destructive/reject actions require deliberate confirmation.
- Preserve form/selection state across non-destructive navigation where appropriate.

