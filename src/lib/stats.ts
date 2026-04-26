import type { DebatePost, DebateStats, Stance, StanceStat } from "../types";

const STANCE_LABELS: Record<Stance, string> = {
  agree: "찬성",
  disagree: "반대",
  neutral: "중립",
};

export const STANCE_ORDER: Stance[] = ["agree", "disagree", "neutral"];

function makeStat(stance: Stance, count: number, total: number): StanceStat {
  return {
    stance,
    label: STANCE_LABELS[stance],
    count,
    percent: total === 0 ? 0 : Math.round((count / total) * 100),
  };
}

export function calculateStats(posts: Pick<DebatePost, "stance">[]): DebateStats {
  const counts: Record<Stance, number> = {
    agree: 0,
    disagree: 0,
    neutral: 0,
  };

  for (const post of posts) {
    counts[post.stance] += 1;
  }

  const total = posts.length;

  return {
    total,
    agree: makeStat("agree", counts.agree, total),
    disagree: makeStat("disagree", counts.disagree, total),
    neutral: makeStat("neutral", counts.neutral, total),
  };
}

export function getStanceLabel(stance: Stance): string {
  return STANCE_LABELS[stance];
}
