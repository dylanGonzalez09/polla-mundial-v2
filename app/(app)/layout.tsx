import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { getCurrentProfile } from "@/lib/auth/dal";

export default async function ProtectedLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const profile = await getCurrentProfile();

  // El admin tiene su propio panel: no participa del area de jugador.
  if (profile.isAdmin) {
    redirect("/admin");
  }

  return <AppShell profile={profile}>{children}</AppShell>;
}
