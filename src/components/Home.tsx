import { Monitor, UsersRound } from "lucide-react";

type HomeProps = {
  navigate: (path: string) => void;
};

export function Home({ navigate }: HomeProps) {
  return (
    <main className="home">
      <section className="home__intro">
        <p className="eyebrow">국어·사회·도덕 융합 토론 수업</p>
        <h1>신호등 토론방</h1>
        <p>
          목소리가 작은 학생도 자기 생각을 포스트잇처럼 붙이고, 학급 전체의
          찬성·반대·중립 흐름을 한눈에 확인합니다.
        </p>
      </section>
      <section className="role-grid" aria-label="역할 선택">
        <button className="role-card" type="button" onClick={() => navigate("/teacher")}>
          <Monitor size={32} aria-hidden="true" />
          <span>교사 관리 화면</span>
          <small>토론 세션 생성, 실시간 보드, 백업 관리</small>
        </button>
        <button className="role-card" type="button" onClick={() => navigate("/student")}>
          <UsersRound size={32} aria-hidden="true" />
          <span>학생 입장</span>
          <small>세션 코드 입력 후 의견 제출</small>
        </button>
      </section>
    </main>
  );
}
