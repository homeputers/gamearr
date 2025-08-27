export interface OgoPreferences {
  regionPriority: string[];
  preferVerified: boolean;
  preferHighestRevision: boolean;
}

export interface OgoArtifact {
  id: string;
  verified?: boolean | null;
  revision?: number | null;
  release?: { region?: string | null } | null;
}

export interface OgoResult {
  winner: OgoArtifact | null;
  secondary: OgoArtifact[];
}

export function pickWinner(
  artifacts: OgoArtifact[],
  prefs: OgoPreferences,
): OgoResult {
  if (artifacts.length === 0) return { winner: null, secondary: [] };
  const scored = artifacts.map((a) => ({
    artifact: a,
    score: computeScore(a, prefs),
  }));
  scored.sort((a, b) => a.score - b.score);
  const [first, ...rest] = scored;
  return {
    winner: first.artifact,
    secondary: rest.map((s) => s.artifact),
  };
}

function computeScore(a: OgoArtifact, prefs: OgoPreferences): number {
  let score = 0;
  // region priority
  if (a.release?.region) {
    const idx = prefs.regionPriority.indexOf(a.release.region);
    score += idx === -1 ? prefs.regionPriority.length : idx;
  } else {
    score += prefs.regionPriority.length + 1;
  }
  // verified dumps preferred
  if (prefs.preferVerified) {
    score += a.verified ? 0 : prefs.regionPriority.length + 2;
  }
  // highest revision preferred
  if (prefs.preferHighestRevision) {
    // higher revision should have lower score (better)
    const rev = a.revision ?? -Infinity;
    score -= rev / 1000; // small factor to influence ordering
  }
  return score;
}
