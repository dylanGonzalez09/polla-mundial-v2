export type RoundKey = "r32" | "r16" | "qf" | "sf" | "third" | "final";
export type PhaseStatus = "locked" | "open" | "closed";
export type ManualOverride = Exclude<PhaseStatus, "locked"> | null;
export type SourceType = "winner" | "loser";

export type Team = {
  id: number;
  code: string;
  name: string;
};

export type TournamentMatch = {
  id: number;
  code: string;
  round: RoundKey;
  slotOrder: number;
  matchDate: string;
  venueName: string;
  homeTeamId: number | null;
  awayTeamId: number | null;
  homeSourceMatchId: number | null;
  homeSourceType: SourceType | null;
  awaySourceMatchId: number | null;
  awaySourceType: SourceType | null;
};

export type MatchPhaseWindow = {
  round: RoundKey;
  opensAt: string | null;
  closesAt: string | null;
  manualOverride: ManualOverride;
  effectiveStatus: PhaseStatus;
};

export type AppSettings = {
  initialOpensAt: string | null;
  initialDeadline: string | null;
  initialOverride: ManualOverride;
  initialEffectiveStatus: PhaseStatus;
};

export type Prediction = {
  id: string;
  userId: string;
  isConfirmed: boolean;
  confirmedAt: string | null;
  totalPoints: number;
};

export type PredictionPick = {
  id?: string;
  predictionId?: string;
  matchId: number;
  predictedAdvancingTeamId: number | null;
  homeScore: number | null;
  awayScore: number | null;
  points?: number;
};

export type PredictionPhaseSubmission = {
  round: RoundKey;
  submittedAt: string;
};

export type OfficialResult = {
  matchId: number;
  homeScore: number;
  awayScore: number;
  advancingTeamId: number | null;
};

export type RankingRow = {
  displayName: string;
  totalPoints: number;
};

export type AuthProfile = {
  id: string;
  email: string;
  displayName: string;
  isAdmin: boolean;
};

export type PeerInitialRow = {
  user_id: string;
  display_name: string;
  has_submitted: boolean;
  total_points: number;
  picks: Array<{
    match_id: number;
    predicted_advancing_team_id: number | null;
    home_score: number | null;
    away_score: number | null;
  }> | null;
};

export type PeerRoundRow = {
  user_id: string;
  display_name: string;
  has_submitted: boolean;
  picks: Array<{
    match_id: number;
    home_score: number | null;
    away_score: number | null;
  }> | null;
};

export type BracketMatchView = TournamentMatch & {
  homeTeam: Team | null;
  awayTeam: Team | null;
};
