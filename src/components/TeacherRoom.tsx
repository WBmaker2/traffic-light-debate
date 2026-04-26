import { useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { ArrowLeft, Download, FileJson, FileText, Lock, Trash2, Unlock } from "lucide-react";
import { downloadJson } from "../lib/exportImport";
import { exportRoomPdf } from "../lib/pdf";
import { calculateStats } from "../lib/stats";
import { getDebateRepository } from "../services/debateRepository";
import { useAuth } from "../hooks/useAuth";
import { useRealtimeValue } from "../hooks/useRealtimeValue";
import { GaugeBar } from "./GaugeBar";
import { PostItBoard } from "./PostItBoard";
import type { DebatePost, DebateRoom } from "../types";

type TeacherRoomProps = {
  roomId: string;
  navigate: (path: string) => void;
};

export function TeacherRoom({ roomId, navigate }: TeacherRoomProps) {
  const repo = useMemo(() => getDebateRepository(), []);
  const auth = useAuth();
  const [notice, setNotice] = useState("");
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
  const stats = useMemo(() => calculateStats(posts), [posts]);

  if (!room) {
    return <main className="page page--center">토론방을 불러오고 있습니다...</main>;
  }

  const currentRoom = room;
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
  const joinUrl = `${window.location.origin}${basePath}/join/${currentRoom.sessionCode}`;

  async function handleJson() {
    const data = await repo.exportRoom(roomId);
    downloadJson(`traffic-light-debate-${data.room.sessionCode}.json`, data);
    setNotice("JSON 저장을 완료했습니다.");
  }

  async function handlePdf() {
    await exportRoomPdf(currentRoom, posts);
    setNotice("PDF 저장을 완료했습니다.");
  }

  async function handleBackup() {
    if (!auth.user) {
      return;
    }

    const backup = await repo.createBackup(auth.user, [roomId]);
    downloadJson(`traffic-light-debate-backup-${currentRoom.sessionCode}.json`, backup);
    setNotice("이 세션을 백업했습니다.");
  }

  async function handleDeletePost(postId: string) {
    const ok = window.confirm("이 의견을 삭제할까요?");
    if (!ok) return;
    await repo.deletePost(roomId, postId);
  }

  return (
    <main className="room-screen">
      <header className="room-header">
        <button className="ghost-button" type="button" onClick={() => navigate("/teacher")}>
          <ArrowLeft size={18} aria-hidden="true" /> 세션 목록
        </button>
        <div className="room-header__title">
          <span className={`status-pill status-pill--${currentRoom.status}`}>{statusLabel(currentRoom.status)}</span>
          <h1>{currentRoom.topic}</h1>
          <p>
            세션 코드 <strong>{currentRoom.sessionCode}</strong> · 의견 {posts.length}개
          </p>
        </div>
        <div className="qr-card" aria-label="학생 입장 QR 코드">
          <QRCodeSVG value={joinUrl} size={104} />
          <span>{currentRoom.sessionCode}</span>
        </div>
      </header>

      <GaugeBar stats={stats} />

      <div className="room-actions">
        <button className="secondary-button" type="button" onClick={() => void handlePdf()}>
          <FileText size={18} aria-hidden="true" /> PDF
        </button>
        <button className="secondary-button" type="button" onClick={() => void handleJson()}>
          <FileJson size={18} aria-hidden="true" /> JSON
        </button>
        <button className="secondary-button" type="button" onClick={() => void handleBackup()}>
          <Download size={18} aria-hidden="true" /> 백업
        </button>
        <button
          className="secondary-button"
          type="button"
          onClick={() => void repo.updateRoomStatus(roomId, currentRoom.status === "open" ? "closed" : "open")}
        >
          {currentRoom.status === "open" ? <Lock size={18} aria-hidden="true" /> : <Unlock size={18} aria-hidden="true" />}
          {currentRoom.status === "open" ? "제출 마감" : "다시 열기"}
        </button>
        <button
          className="secondary-button danger"
          type="button"
          onClick={() => {
            const ok = window.confirm("이 세션을 삭제 표시할까요?");
            if (ok) void repo.updateRoomStatus(roomId, "deleted").then(() => navigate("/teacher"));
          }}
        >
          <Trash2 size={18} aria-hidden="true" /> 삭제
        </button>
      </div>

      <PostItBoard posts={posts} canDelete onDelete={(postId) => void handleDeletePost(postId)} />

      <p className="sr-only" role="status" aria-live="polite">
        {notice || `현재 의견 ${posts.length}개`}
      </p>
    </main>
  );
}

function statusLabel(status: DebateRoom["status"]): string {
  const labels = {
    open: "진행 중",
    closed: "닫힘",
    archived: "보관됨",
    deleted: "삭제됨",
  };
  return labels[status];
}
