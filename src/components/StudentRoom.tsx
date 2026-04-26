import { useMemo, useState } from "react";
import { Send } from "lucide-react";
import { calculateStats } from "../lib/stats";
import { getDebateRepository } from "../services/debateRepository";
import { useRealtimeValue } from "../hooks/useRealtimeValue";
import { GaugeBar } from "./GaugeBar";
import type { DebatePost, DebateRoom, Stance } from "../types";

type StudentRoomProps = {
  roomId: string;
};

const stanceOptions: Array<{ value: Stance; label: string; description: string }> = [
  { value: "agree", label: "찬성", description: "초록 포스트잇" },
  { value: "disagree", label: "반대", description: "빨간 포스트잇" },
  { value: "neutral", label: "중립", description: "노란 포스트잇" },
];

export function StudentRoom({ roomId }: StudentRoomProps) {
  const repo = useMemo(() => getDebateRepository(), []);
  const room = useRealtimeValue<DebateRoom | null>(
    null,
    (onValue) => repo.subscribeRoom(roomId, onValue),
    [repo, roomId],
  );
  const posts = useRealtimeValue<DebatePost[]>(
    [],
    (onValue) => repo.subscribePosts(roomId, onValue),
    [repo, roomId],
  );
  const [studentName, setStudentName] = useState(() => localStorage.getItem("debate-student-name") ?? "");
  const [stance, setStance] = useState<Stance>("agree");
  const [reason, setReason] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const stats = useMemo(() => calculateStats(posts), [posts]);

  if (!room) {
    return <main className="page page--center">토론방을 불러오고 있습니다...</main>;
  }

  const closed = room.status !== "open";

  async function handleSubmit() {
    if (!studentName.trim() || !reason.trim()) {
      setError("이름과 근거를 모두 입력해 주세요.");
      return;
    }

    await repo.addPost(roomId, {
      studentName,
      stance,
      reason,
      clientId: getClientId(),
    });
    localStorage.setItem("debate-student-name", studentName);
    setReason("");
    setSubmitted(true);
    setError("");
  }

  return (
    <main className="student-shell student-shell--room">
      <section className="student-card student-card--wide">
        <p className="eyebrow">세션 코드 {room.sessionCode}</p>
        <h1>{room.topic}</h1>
        <GaugeBar stats={stats} compact />

        {closed ? (
          <p className="closed-notice">이 토론은 제출이 마감되었습니다.</p>
        ) : (
          <form
            className="student-form"
            onSubmit={(event) => {
              event.preventDefault();
              void handleSubmit();
            }}
          >
            <label>
              이름
              <input
                value={studentName}
                onChange={(event) => setStudentName(event.target.value)}
                placeholder="내 이름"
                required
              />
            </label>

            <fieldset>
              <legend>내 생각 선택</legend>
              <div className="stance-options">
                {stanceOptions.map((option) => (
                  <button
                    key={option.value}
                    className={`stance-button stance-button--${option.value} ${
                      stance === option.value ? "is-active" : ""
                    }`}
                    type="button"
                    aria-pressed={stance === option.value}
                    onClick={() => setStance(option.value)}
                  >
                    <strong>{option.label}</strong>
                    <span>{option.description}</span>
                  </button>
                ))}
              </div>
            </fieldset>

            <label>
              근거
              <textarea
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="왜 그렇게 생각하나요?"
                rows={5}
                required
              />
            </label>

            {error ? <p className="form-error">{error}</p> : null}
            {submitted ? <p className="form-success">의견을 제출했습니다.</p> : null}

            <button className="primary-button" type="submit">
              <Send size={18} aria-hidden="true" /> 의견 제출
            </button>
          </form>
        )}
      </section>
    </main>
  );
}

function getClientId(): string {
  const key = "debate-client-id";
  const existing = localStorage.getItem(key);
  if (existing) {
    return existing;
  }
  const next = crypto.randomUUID();
  localStorage.setItem(key, next);
  return next;
}
