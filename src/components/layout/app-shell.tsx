import type { ReactNode } from "react";
import { prisma } from "@/lib/db/client";
import { WorkspaceShell } from "./workspace-shell";

export async function AppShell({ children }: { children: ReactNode }) {
  const profile = await prisma.businessProfile.findUnique({
    where: { id: "local-business" },
    select: { businessName: true },
  });
  return <WorkspaceShell businessName={profile?.businessName ?? "Your business"}>{children}</WorkspaceShell>;
}
