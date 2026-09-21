import { redirect } from "next/navigation";
import { getSession } from "@/server/session";
import { Shell } from "@/components/shell";
import { Checkout } from "@/components/checkout";
export const dynamic = "force-dynamic";
export default async function CheckoutPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  return (
    <Shell context={session.context}>
      <p className="eyebrow">WANDERGARAGE · CUSTOMER PORTAL</p>
      <h1>Checkout</h1>
      <Checkout />
    </Shell>
  );
}
