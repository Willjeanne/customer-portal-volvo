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
