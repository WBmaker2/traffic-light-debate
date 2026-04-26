import { useMemo, useState } from "react";
import { LogIn } from "lucide-react";
import { isValidSessionCode, normalizeSessionCode } from "../lib/sessionCode";
import { getDebateRepository } from "../services/debateRepository";

type StudentJoinProps = {
  initialCode?: string;
  navigate: (path: string) => void;
};

export function StudentJoin({ initialCode = "", navigate }: StudentJoinProps) {
  const repo = useMemo(() => getDebateRepository(), []);
  const [code, setCode] = useState(initialCode);
  const [error, setError] = useState("");

  async function handleJoin() {
    const normalized = normalizeSessionCode(code);
    if (!isValidSessionCode(normalized)) {
      setError("세션 코드를 다시 확인해 주세요.");
      return;
    }

    const room = await repo.findRoomBySessionCode(normalized);
    if (!room) {
      setError("토론방을 찾을 수 없습니다.");
      return;
    }

    navigate(`/student/rooms/${room.id}`);
  }

  return (
    <main className="student-shell">
      <section className="student-card">
        <p className="eyebrow">학생 입장</p>
        <h1>세션 코드를 입력해 토론방에 들어갑니다.</h1>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void handleJoin();
          }}
        >
          <label>
            세션 코드
            <input
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="TL-4829"
              autoCapitalize="characters"
              autoFocus
            />
          </label>
          {error ? <p className="form-error">{error}</p> : null}
          <button className="primary-button" type="submit">
            <LogIn size={18} aria-hidden="true" /> 입장하기
          </button>
        </form>
      </section>
    </main>
  );
}
