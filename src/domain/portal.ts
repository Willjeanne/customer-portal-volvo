export type Persona = "buyer" | "admin" | "approver" | "procurement";
export type Permission = "purchase" | "approve" | "manage-organization";
export interface BuyerContext {
  mode: "preview" | "vtex";
  user: { id: string; name: string; username: string; persona: string };
  unit: { id: string; name: string };
  company: string;
  contract: string;
  permissions: Permission[];
  permissionsVerified: boolean;
  vehicle: string;
  urgency: "Normal" | "Maintenance" | "Vehicle off road";
}
export const navigation = [
  { slug: "home", label: "Home", icon: "House" },
  { slug: "fleet", label: "Fleet & Vehicles", icon: "Truck" },
  // >>> CLAUDE — lot find parts, 20/09/2026 — à relire
  // Chercher une pièce n'est pas l'acheter : la condition `permission: "purchase"`
  // a été retirée, sinon l'écran est invisible en session VTEX réelle, où
  // `permissions` est vide. Même raisonnement que la préparation de commande.
  // Les actions d'achat restent protégées par `mayPlaceOrders()`.
  {
    slug: "parts",
    label: "Find Parts",
    icon: "MagnifyingGlass",
  },
  // <<< CLAUDE
  {
    slug: "quick-order",
    label: "Quick / Bulk Order",
    icon: "ShoppingCart",
  },
  { slug: "lists", label: "Lists", icon: "ListBullets" },
  { slug: "quotes", label: "Quotes", icon: "FileText" },
  { slug: "orders", label: "Orders", icon: "Package" },
  {
    slug: "approvals",
    label: "Approvals",
    icon: "CheckCircle",
    permission: "approve",
  },
  { slug: "claims", label: "Returns & Claims", icon: "ArrowUUpLeft" },
  { slug: "services", label: "Contracts & Services", icon: "Certificate" },
  { slug: "organization", label: "My Organization", icon: "UsersThree" },
  { slug: "payments", label: "Payment Methods", icon: "CreditCard" },
  { slug: "support", label: "Support / Dealer", icon: "Headset" },
  { slug: "ai-assistant", label: "AI Assistant", icon: "Sparkle" },
  { slug: "profile", label: "My Profile", icon: "UserCircle" },
] as const;
export function canVisit(context: BuyerContext, slug: string): boolean {
  const item = navigation.find((entry) => entry.slug === slug);
  return (
    !!item &&
    (!("permission" in item) || context.permissions.includes(item.permission))
  );
}
