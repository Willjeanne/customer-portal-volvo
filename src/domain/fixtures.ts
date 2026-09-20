import type { BuyerContext, Persona } from "./portal";
// >>> CLAUDE — lot flotte, 20/09/2026 — à relire
import { defaultVehicleId } from "./fleet";
// <<< CLAUDE
export const personas: Record<
  Persona,
  {
    name: string;
    username: string;
    label: string;
    permissions: BuyerContext["permissions"];
  }
> = {
  buyer: {
    name: "WanderGarage Buyer",
    username: "wandergarage-buyer",
    label: "Buyer",
    permissions: ["purchase"],
  },
  admin: {
    name: "William Jeanne",
    username: "william.jeannegarage",
    label: "Organization administrator",
    permissions: ["purchase", "approve", "manage-organization"],
  },
  approver: {
    name: "Fleet Manager",
    username: "wg-fleet-manager",
    label: "Approver",
    permissions: ["approve"],
  },
  procurement: {
    name: "Procurement",
    username: "wg-procurement",
    label: "Procurement",
    permissions: ["manage-organization"],
  },
};
// Synthetic test contexts, not current VTEX memberships or grants.
export const previewUnits = [
  { id: "preview-dallas", name: "Dallas Depot" },
  { id: "preview-chicago", name: "Chicago Depot" },
];
export function makePreviewContext(persona: Persona): BuyerContext {
  const chosen = personas[persona];
  return {
    mode: "preview",
    user: {
      id: `preview-${persona}`,
      name: chosen.name,
      username: chosen.username,
      persona: chosen.label,
    },
    unit: previewUnits[0],
    company: "WanderGarage",
    contract: "Demo commercial contract · USD",
    permissions: [...chosen.permissions],
    permissionsVerified: false,
    vehicle: defaultVehicleId, // >>> CLAUDE — lot flotte — identifiant, plus un libellé <<< CLAUDE
    urgency: "Normal",
  };
}
