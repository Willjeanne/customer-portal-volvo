import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { Shell } from "@/components/shell";
import { getSession } from "@/server/session";

export default async function SectionLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  // Keep the portal frame outside the page loading boundary. Each page still
  // validates upstream access before rendering private data.
  return <Shell context={session.context}>{children}</Shell>;
}
