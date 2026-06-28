import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { OnboardingTour } from "@/components/onboarding-tour";
import { getCurrentProfile } from "@/lib/auth/dal";

export default async function ProtectedLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const profile = await getCurrentProfile();

  // El admin tiene su propio panel: no participa del area de jugador.
  if (profile.isAdmin) {
    redirect("/admin");
  }

  return (
    <AppShell profile={profile}>
      <OnboardingTour userId={profile.id} />
      {children}
    </AppShell>
  );
}
