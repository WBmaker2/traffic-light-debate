import type { DebateStats } from "../types";

type GaugeBarProps = {
  stats: DebateStats;
  compact?: boolean;
};

export function GaugeBar({ stats, compact = false }: GaugeBarProps) {
  return (
    <section
      className={`gauge ${compact ? "gauge--compact" : ""}`}
      aria-label={`찬성 ${stats.agree.percent}%, 반대 ${stats.disagree.percent}%, 중립 ${stats.neutral.percent}%`}
    >
      <div className="gauge__track" aria-hidden="true">
        <span
          className="gauge__segment gauge__segment--agree"
          style={{ width: `${stats.agree.percent}%` }}
        />
        <span
          className="gauge__segment gauge__segment--disagree"
          style={{ width: `${stats.disagree.percent}%` }}
        />
        <span
          className="gauge__segment gauge__segment--neutral"
          style={{ width: `${stats.neutral.percent}%` }}
        />
      </div>
      <div className="gauge__legend">
        <span>
          <b className="dot dot--agree" /> 찬성 {stats.agree.count}명{" "}
          <strong>{stats.agree.percent}%</strong>
        </span>
        <span>
          <b className="dot dot--disagree" /> 반대 {stats.disagree.count}명{" "}
          <strong>{stats.disagree.percent}%</strong>
        </span>
        <span>
          <b className="dot dot--neutral" /> 중립 {stats.neutral.count}명{" "}
          <strong>{stats.neutral.percent}%</strong>
        </span>
      </div>
    </section>
  );
}
