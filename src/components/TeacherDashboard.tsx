import { useMemo, useRef, useState } from "react";
import {
  Archive,
  Copy,
  Download,
  FileJson,
  FileText,
  Lock,
  LogIn,
  LogOut,
  MoreHorizontal,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { parseTeacherBackup, previewBackup } from "../lib/backup";
import { downloadJson, parseRoomExport } from "../lib/exportImport";
import { exportRoomPdf } from "../lib/pdf";
import { filterRooms, sortRooms } from "../lib/sessionManagement";
import { getDebateRepository } from "../services/debateRepository";
import { useAuth } from "../hooks/useAuth";
import { useRealtimeValue } from "../hooks/useRealtimeValue";
import type {
  DebateRoom,
  FilterMode,
  SortMode,
  TeacherDatabaseBackup,
} from "../types";

type TeacherDashboardProps = {
  navigate: (path: string) => void;
};

export function TeacherDashboard({ navigate }: TeacherDashboardProps) {
  const repo = useMemo(() => getDebateRepository(), []);
  const auth = useAuth();
  const [topic, setTopic] = useState("");
  const [className, setClassName] = useState("");
  const [memo, setMemo] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<FilterMode>("all");
  const [sort, setSort] = useState<SortMode>("updated");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [notice, setNotice] = useState("");
  const [backupPreview, setBackupPreview] = useState<TeacherDatabaseBackup | null>(null);
  const [editingRoom, setEditingRoom] = useState<DebateRoom | null>(null);
  const [editTopic, setEditTopic] = useState("");
  const [editClassName, setEditClassName] = useState("");
  const [editMemo, setEditMemo] = useState("");
  const importInputRef = useRef<HTMLInputElement>(null);
  const backupInputRef = useRef<HTMLInputElement>(null);

  const rooms = useRealtimeValue<DebateRoom[]>(
    [],
    (onValue) => (auth.user ? repo.subscribeRooms(auth.user.uid, onValue) : () => undefined),
    [repo, auth.user?.uid],
  );

  const visibleRooms = useMemo(
    () => sortRooms(filterRooms(rooms, filter, searchTerm), sort),
    [rooms, filter, searchTerm, sort],
  );

  const selectedRooms = useMemo(
    () => rooms.filter((room) => selectedIds.has(room.id)),
    [rooms, selectedIds],
  );

  if (auth.loading) {
    return <main className="page page--center">교사 정보를 확인하고 있습니다...</main>;
  }

  if (!auth.user) {
    return (
      <main className="page page--center auth-card">
        <p className="eyebrow">교사 관리 화면</p>
        <h1>Google 로그인 후 토론방을 관리합니다.</h1>
        <button className="primary-button" type="button" onClick={() => void auth.signIn()}>
          <LogIn size={18} aria-hidden="true" />
          교사로 로그인
        </button>
      </main>
    );
  }

  async function handleCreateRoom() {
    if (!auth.user || !topic.trim()) {
      return;
    }

    const room = await repo.createRoom(auth.user, {
      topic,
      className,
      memo,
    });
    setTopic("");
    setClassName("");
    setMemo("");
    navigate(`/teacher/rooms/${room.id}`);
  }

  async function handleExportJson(roomId: string) {
    const data = await repo.exportRoom(roomId);
    downloadJson(`traffic-light-debate-${data.room.sessionCode}.json`, data);
    setNotice("세션 JSON 파일을 저장했습니다.");
  }

  async function handleExportPdf(roomId: string) {
    const { room, posts } = await repo.getRoomWithPosts(roomId);
    await exportRoomPdf(room, posts);
    setNotice("PDF 저장을 완료했습니다.");
  }

  async function handleBackup(roomIds?: string[]) {
    if (!auth.user) {
      return;
    }

    const backup = await repo.createBackup(auth.user, roomIds);
    downloadJson(`traffic-light-debate-backup-${Date.now()}.json`, backup);
    setNotice(
      `${backup.summary.roomCount}개 세션, ${backup.summary.postCount}개 의견을 DB 백업했습니다.`,
    );
  }

  async function handleImportRoom(file: File | undefined) {
    if (!file || !auth.user) {
      return;
    }

    const parsed = parseRoomExport(JSON.parse(await file.text()));
    const room = await repo.importRoom(auth.user, parsed);
    setNotice(`"${room.topic}" 세션을 복원했습니다.`);
    navigate(`/teacher/rooms/${room.id}`);
  }

  async function handleRestoreBackup() {
    if (!auth.user || !backupPreview) {
      return;
    }

    const restored = await repo.restoreBackup(auth.user, backupPreview);
    setNotice(`${restored.length}개 세션을 DB 백업 파일에서 복원했습니다.`);
    setBackupPreview(null);
  }

  async function handleBackupFile(file: File | undefined) {
    if (!file) {
      return;
    }

    setBackupPreview(parseTeacherBackup(JSON.parse(await file.text())));
  }

  function openEditRoom(room: DebateRoom) {
    setEditingRoom(room);
    setEditTopic(room.topic);
    setEditClassName(room.className ?? "");
    setEditMemo(room.memo ?? "");
  }

  async function handleUpdateRoom() {
    if (!editingRoom || !editTopic.trim()) {
      return;
    }

    await repo.updateRoom(editingRoom.id, {
      topic: editTopic,
      className: editClassName,
      memo: editMemo,
    });
    setNotice(`"${editTopic}" 세션 정보를 수정했습니다.`);
    setEditingRoom(null);
  }

  async function updateSelectedStatus(status: "archived" | "deleted") {
    if (selectedIds.size === 0) {
      return;
    }

    if (status === "deleted") {
      const names = selectedRooms.map((room) => `- ${room.topic}`).join("\n");
      const ok = window.confirm(
        `${selectedIds.size}개 세션을 삭제 표시할까요?\n\n${names}`,
      );
      if (!ok) return;
    }

    await Promise.all(
      Array.from(selectedIds).map((roomId) => repo.updateRoomStatus(roomId, status)),
    );
    setSelectedIds(new Set());
  }

  function toggleSelected(roomId: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(roomId)) {
        next.delete(roomId);
      } else {
        next.add(roomId);
      }
      return next;
    });
  }

  return (
    <main className="teacher-layout">
      <header className="topbar">
        <button className="ghost-button" type="button" onClick={() => navigate("/")}>
          신호등 토론방
        </button>
        <div className="topbar__right">
          {repo.mode === "demo" ? <span className="mode-pill">데모 저장소</span> : null}
          <span>{auth.user.displayName ?? auth.user.email ?? "교사"}</span>
          <button className="icon-button" type="button" aria-label="로그아웃" onClick={() => void auth.signOut()}>
            <LogOut size={18} aria-hidden="true" />
          </button>
        </div>
      </header>

      <section className="teacher-hero">
        <div>
          <p className="eyebrow">교사 관리 화면</p>
          <h1>토론 세션을 만들고, 수업 기록을 관리합니다.</h1>
        </div>
        <button
          className="secondary-button"
          type="button"
          onClick={() => void handleBackup(selectedIds.size ? Array.from(selectedIds) : undefined)}
        >
          <Download size={18} aria-hidden="true" />
          {selectedIds.size ? "선택 DB 백업" : "전체 DB 백업"}
        </button>
      </section>

      <section className="dashboard-grid">
        <form
          className="panel create-panel"
          onSubmit={(event) => {
            event.preventDefault();
            void handleCreateRoom();
          }}
        >
          <h2>새 토론 만들기</h2>
          <label>
            토론 주제
            <textarea
              value={topic}
              onChange={(event) => setTopic(event.target.value)}
              placeholder="예: 초등학생의 스마트폰 사용 시간을 제한해야 한다"
              rows={4}
              required
            />
          </label>
          <label>
            수업명 또는 학급
            <input value={className} onChange={(event) => setClassName(event.target.value)} />
          </label>
          <label>
            메모
            <input value={memo} onChange={(event) => setMemo(event.target.value)} />
          </label>
          <button className="primary-button" type="submit">
            <Plus size={18} aria-hidden="true" /> 세션 생성
          </button>
        </form>

        <section className="panel sessions-panel">
          <div className="panel__header">
            <div>
              <h2>세션 관리</h2>
              <p>{rooms.filter((room) => room.status !== "deleted").length}개 세션</p>
            </div>
            <div className="toolbar">
              <button
                className="action-button"
                type="button"
                onClick={() => importInputRef.current?.click()}
              >
                <FileJson size={18} aria-hidden="true" />
                JSON 불러오기
              </button>
              <button
                className="action-button"
                type="button"
                onClick={() => backupInputRef.current?.click()}
              >
                <RotateCcw size={18} aria-hidden="true" />
                DB 백업 복원
              </button>
            </div>
          </div>

          <div className="session-controls">
            <label className="search-field">
              <Search size={18} aria-hidden="true" />
              <span className="sr-only">세션 검색</span>
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="주제, 학급, 메모 검색"
              />
            </label>
            <select value={filter} onChange={(event) => setFilter(event.target.value as FilterMode)}>
              <option value="all">전체</option>
              <option value="open">진행 중</option>
              <option value="closed">닫힘</option>
              <option value="archived">보관됨</option>
            </select>
            <select value={sort} onChange={(event) => setSort(event.target.value as SortMode)}>
              <option value="updated">최근 수정순</option>
              <option value="created">생성일순</option>
              <option value="posts">의견 수순</option>
              <option value="title">제목순</option>
            </select>
          </div>

          {selectedIds.size ? (
            <div className="bulkbar">
              <strong>{selectedIds.size}개 선택됨</strong>
              <button type="button" onClick={() => void updateSelectedStatus("archived")}>
                <Archive size={16} aria-hidden="true" /> 보관
              </button>
              <button type="button" onClick={() => void updateSelectedStatus("deleted")}>
                <Trash2 size={16} aria-hidden="true" /> 삭제
              </button>
              <button type="button" onClick={() => void handleBackup(Array.from(selectedIds))}>
                <Download size={16} aria-hidden="true" /> DB 백업
              </button>
            </div>
          ) : null}

          <div className="session-list">
            {visibleRooms.length === 0 ? (
              <p className="empty-copy">조건에 맞는 세션이 없습니다.</p>
            ) : (
              visibleRooms.map((room) => (
                <SessionRow
                  key={room.id}
                  room={room}
                  selected={selectedIds.has(room.id)}
                  onSelect={() => toggleSelected(room.id)}
                  onOpen={() => navigate(`/teacher/rooms/${room.id}`)}
                  onEdit={() => openEditRoom(room)}
                  onDuplicate={() => void repo.duplicateRoom(auth.user!, room.id)}
                  onStatus={(status) => void repo.updateRoomStatus(room.id, status)}
                  onJson={() => void handleExportJson(room.id)}
                  onPdf={() => void handleExportPdf(room.id)}
                  onBackup={() => void handleBackup([room.id])}
                />
              ))
            )}
          </div>
        </section>
      </section>

      <input
        ref={importInputRef}
        hidden
        type="file"
        accept="application/json"
        onChange={(event) => void handleImportRoom(event.target.files?.[0])}
      />
      <input
        ref={backupInputRef}
        hidden
        type="file"
        accept="application/json"
        onChange={(event) => void handleBackupFile(event.target.files?.[0])}
      />

      {backupPreview ? (
        <div className="modal-backdrop" role="presentation">
          <section className="modal" role="dialog" aria-modal="true" aria-labelledby="backup-title">
            <h2 id="backup-title">백업 복원 미리보기</h2>
            <BackupPreview backup={backupPreview} />
            <div className="modal__actions">
              <button type="button" onClick={() => setBackupPreview(null)}>
                취소
              </button>
              <button className="primary-button" type="button" onClick={() => void handleRestoreBackup()}>
                <ShieldCheck size={18} aria-hidden="true" /> 새 세션으로 복원
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {editingRoom ? (
        <div className="modal-backdrop" role="presentation">
          <section className="modal" role="dialog" aria-modal="true" aria-labelledby="edit-room-title">
            <h2 id="edit-room-title">세션 수정</h2>
            <form
              className="modal-form"
              onSubmit={(event) => {
                event.preventDefault();
                void handleUpdateRoom();
              }}
            >
              <label>
                토론 주제
                <textarea
                  value={editTopic}
                  onChange={(event) => setEditTopic(event.target.value)}
                  rows={4}
                  required
                />
              </label>
              <label>
                수업명 또는 학급
                <input
                  value={editClassName}
                  onChange={(event) => setEditClassName(event.target.value)}
                />
              </label>
              <label>
                메모
                <input value={editMemo} onChange={(event) => setEditMemo(event.target.value)} />
              </label>
              <div className="modal__actions">
                <button type="button" onClick={() => setEditingRoom(null)}>
                  취소
                </button>
                <button className="primary-button" type="submit">
                  저장
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}

      <p className="sr-only" role="status" aria-live="polite">
        {notice}
      </p>
    </main>
  );
}

type SessionRowProps = {
  room: DebateRoom;
  selected: boolean;
  onSelect: () => void;
  onOpen: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onStatus: (status: DebateRoom["status"]) => void;
  onJson: () => void;
  onPdf: () => void;
  onBackup: () => void;
};

function SessionRow({
  room,
  selected,
  onSelect,
  onOpen,
  onEdit,
  onDuplicate,
  onStatus,
  onJson,
  onPdf,
  onBackup,
}: SessionRowProps) {
  return (
    <article className="session-row">
      <input
        type="checkbox"
        aria-label={`${room.topic} 선택`}
        checked={selected}
        onChange={onSelect}
      />
      <button className="session-row__main" type="button" onClick={onOpen}>
        <span className={`status-pill status-pill--${room.status}`}>
          {statusLabel(room.status)}
        </span>
        <strong>{room.topic}</strong>
        <small>
          {room.sessionCode} · 의견 {room.postCount ?? 0}개 ·{" "}
          {new Date(room.updatedAt).toLocaleDateString("ko-KR")}
        </small>
      </button>
      <div className="row-actions">
        <button className="action-button" type="button" onClick={onDuplicate}>
          <Copy size={17} aria-hidden="true" />
          복제
        </button>
        <button className="action-button" type="button" onClick={onEdit}>
          <Pencil size={17} aria-hidden="true" />
          수정
        </button>
        <button
          className="action-button"
          type="button"
          onClick={() => onStatus(room.status === "open" ? "closed" : "open")}
        >
          {room.status === "open" ? (
            <Lock size={17} aria-hidden="true" />
          ) : (
            <RotateCcw size={17} aria-hidden="true" />
          )}
          {room.status === "open" ? "닫기" : "다시 열기"}
        </button>
        <button className="action-button" type="button" onClick={onPdf}>
          <FileText size={17} aria-hidden="true" />
          PDF
        </button>
        <button className="action-button" type="button" onClick={onJson}>
          <FileJson size={17} aria-hidden="true" />
          JSON
        </button>
        <button className="action-button" type="button" onClick={onBackup}>
          <Download size={17} aria-hidden="true" />
          DB 백업
        </button>
        <details className="more-menu">
          <summary className="action-button">
            <MoreHorizontal size={17} aria-hidden="true" />
            더보기
          </summary>
          <div className="more-menu__content">
            <button type="button" onClick={() => onStatus("archived")}>
              <Archive size={17} aria-hidden="true" />
              기록 보관
            </button>
          </div>
        </details>
        <button className="action-button danger" type="button" onClick={() => onStatus("deleted")}>
          <Trash2 size={17} aria-hidden="true" />
          삭제
        </button>
      </div>
    </article>
  );
}

function BackupPreview({ backup }: { backup: TeacherDatabaseBackup }) {
  const preview = previewBackup(backup);
  return (
    <div className="backup-preview">
      <p>
        세션 {preview.roomCount}개, 의견 {preview.postCount}개를 새 세션으로 복원합니다.
      </p>
      <ul>
        {preview.topics.slice(0, 5).map((topic) => (
          <li key={topic}>{topic}</li>
        ))}
      </ul>
    </div>
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
