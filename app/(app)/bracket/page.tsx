import { BracketExperience } from "@/components/bracket/bracket-experience";
import { getBracketCatalog, getPhaseWindows, getAppSettings } from "@/lib/data/matches";
import { getCurrentUserPrediction } from "@/lib/data/predictions";
import { getOfficialResults } from "@/lib/data/results";

export default async function BracketPage() {
  const [{ matches, teams }, phaseWindows, settings, predictionBundle, officialResults] =
    await Promise.all([
      getBracketCatalog(),
      getPhaseWindows(),
      getAppSettings(),
      getCurrentUserPrediction(),
      getOfficialResults(),
    ]);

  return (
    <BracketExperience
      matches={matches.map((match) => ({
        ...match,
        homeTeam: teams.find((team) => team.id === match.homeTeamId) ?? null,
        awayTeam: teams.find((team) => team.id === match.awayTeamId) ?? null,
      }))}
      teams={teams}
      initialSettings={settings}
      phaseWindows={phaseWindows}
      prediction={predictionBundle.prediction}
      picks={predictionBundle.picks}
      submittedRounds={predictionBundle.submissions.map((submission) => submission.round)}
      officialResults={[...officialResults.values()]}
    />
  );
}
