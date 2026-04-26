import type { DebatePost, DebateRoom, DebateRoomExport, TeacherUser } from "../types";

const APP_VERSION = "0.1.0";

export function createRoomExport(room: DebateRoom, posts: DebatePost[]): DebateRoomExport {
  return {
    formatVersion: 1,
    exportedAt: new Date().toISOString(),
    appVersion: APP_VERSION,
    room: {
      topic: room.topic,
      sessionCode: room.sessionCode,
      className: room.className,
      memo: room.memo,
      status: room.status,
      createdAt: room.createdAt,
      updatedAt: room.updatedAt,
      closedAt: room.closedAt,
      archivedAt: room.archivedAt,
      deletedAt: room.deletedAt,
    },
    posts: posts.map((post) => ({
      studentName: post.studentName,
      stance: post.stance,
      reason: post.reason,
      createdAt: post.createdAt,
    })),
  };
}

export function parseRoomExport(value: unknown): DebateRoomExport {
  if (!isRecord(value)) {
    throw new Error("JSON 파일 형식이 올바르지 않습니다.");
  }

  if (value.formatVersion !== 1) {
    throw new Error("지원하지 않는 JSON 버전입니다.");
  }

  if (!isRecord(value.room) || typeof value.room.topic !== "string") {
    throw new Error("토론방 정보가 없습니다.");
  }

  if (!Array.isArray(value.posts)) {
    throw new Error("의견 목록이 없습니다.");
  }

  return value as DebateRoomExport;
}

export function restoreRoomFromExport(
  owner: TeacherUser,
  exportData: DebateRoomExport,
  roomId: string,
  sessionCode: string,
  now = new Date().toISOString(),
): { room: DebateRoom; posts: DebatePost[] } {
  const room: DebateRoom = {
    ...exportData.room,
    id: roomId,
    ownerUid: owner.uid,
    sessionCode,
    status: "closed",
    createdAt: now,
    updatedAt: now,
  };

  const posts = exportData.posts.map((post, index) => ({
    ...post,
    id: `${roomId}-post-${index + 1}`,
    roomId,
    sourcePostId: `${index + 1}`,
  }));

  return { room, posts };
}

export function downloadJson(fileName: string, value: unknown): void {
  const blob = new Blob([JSON.stringify(value, null, 2)], {
    type: "application/json;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
