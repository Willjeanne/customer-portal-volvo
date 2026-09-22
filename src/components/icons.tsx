"use client";
import {
  House,
  Truck,
  MagnifyingGlass,
  ShoppingCart,
  ListBullets,
  FileText,
  Package,
  CheckCircle,
  ArrowUUpLeft,
  Certificate,
  UsersThree,
  CreditCard,
  Headset,
  UserCircle,
  Buildings,
  Warning,
  ArrowRight,
  CaretRight,
  SignOut,
  List,
  X,
  ShieldCheck,
  Info,
  GearSix,
  ArrowSquareOut,
  // >>> CLAUDE — lot flotte, 20/09/2026 — à relire
  MapPin,
  Handshake,
  Sparkle,
  PaperPlaneRight,
  Plus,
  CaretLeft,
  // <<< CLAUDE
} from "@phosphor-icons/react";
const icons = {
  House,
  Truck,
  MagnifyingGlass,
  ShoppingCart,
  ListBullets,
  FileText,
  Package,
  CheckCircle,
  ArrowUUpLeft,
  Certificate,
  UsersThree,
  CreditCard,
  Headset,
  UserCircle,
  Buildings,
  Warning,
  ArrowRight,
  CaretRight,
  SignOut,
  List,
  X,
  ShieldCheck,
  Info,
  GearSix,
  ArrowSquareOut,
  // >>> CLAUDE — lot flotte, 20/09/2026 — à relire
  MapPin,
  Handshake,
  Sparkle,
  PaperPlaneRight,
  Plus,
  CaretLeft,
  // <<< CLAUDE
};
export function Icon({
  name,
  size = 24,
}: {
  name: keyof typeof icons;
  size?: number;
}) {
  const Component = icons[name];
  return <Component size={size} weight="regular" aria-hidden="true" />;
}
