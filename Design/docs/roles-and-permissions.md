# Roles and permission boundaries

> **Référence de conception, pas preuve de droits live — 25 septembre 2026.** Le périmètre testé et les fonctions réellement raccordées figurent dans la [matrice courante](../../docs/MATRICE_CAPACITES_VOLVO.md). Les droits serveur VTEX prévalent sur les personas illustratifs.

## Customer / buyer experience — current approved scope

The user acts inside organizations and locations they belong to. Typical roles include Organization Admin, Buyer, Senior Buyer, Approver, Workshop Manager, Fleet Manager and Read Only.

Customer capabilities include:

- View authorized fleet and vehicle information.
- Find compatible parts and create order lines.
- Replenish workshop stock without selecting one vehicle.
- Review own or authorized organization quotes and orders.
- Approve within verified thresholds.
- View contracts, claims, documents and notifications when authorized.
- Contact the preferred dealer while preserving permitted task context.

## Dealer-assisted experience — shared capabilities, separate authorization

Follow the [active framing](../../docs/CADRAGE_PORTAIL_VOLVO.md): buyer and dealer-assisted modes share search, order preparation, quotes and order components. Real delegation is verified when integrated; the mode is not automatically postponed out of the demonstration.

A dealer employee may explicitly select an authorized customer/account at the start of a PartASIST journey. That selection affects pricing, eligibility, credit, commercial rules and permitted actions.

Requirements:

- Delegated contract access must be verified before exposing an account selector.
- No arbitrary impersonation.
- The active customer must always be visible.
- A customer change revalidates or resets incompatible commercial state.
- Dealer-only functions must never appear to customer users.

## Shared design, different authorization

Buyer and dealer experiences may share navigation primitives, context components, tables, status chips and workflow components. They must not share unrestricted data queries or assume identical actions.

