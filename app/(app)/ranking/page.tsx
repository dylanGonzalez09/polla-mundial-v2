import { RankingBoard } from "@/components/ranking/podium";
import { PageHero } from "@/components/ui/page-hero";
import { getCurrentProfile } from "@/lib/auth/dal";
import { getRanking } from "@/lib/data/ranking";

export default async function RankingPage() {
  const [ranking, profile] = await Promise.all([getRanking(), getCurrentProfile()]);

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="Ranking global"
        title="Tabla General"
        subtitle="El podio agrupa a quienes empatan en puntos. Debajo esta la tabla completa."
      />

      <RankingBoard rows={ranking} currentUserDisplayName={profile.displayName} />
    </div>
  );
}
