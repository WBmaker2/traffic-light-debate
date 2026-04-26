import type {
  BackupPreview,
  DebatePost,
  DebateRoom,
  TeacherDatabaseBackup,
  TeacherUser,
} from "../types";

const APP_VERSION = "0.1.0";

export function createTeacherBackup(
  owner: TeacherUser,
  entries: Array<{ room: DebateRoom; posts: DebatePost[] }>,
): TeacherDatabaseBackup {
  return {
    formatVersion: 1,
    kind: "teacher-database-backup",
    exportedAt: new Date().toISOString(),
    appVersion: APP_VERSION,
    ownerUid: owner.uid,
    summary: {
      roomCount: entries.length,
      postCount: entries.reduce((sum, entry) => sum + entry.posts.length, 0),
    },
    rooms: entries.map((entry) => ({
      firestorePath: `rooms/${entry.room.id}`,
      room: entry.room,
      posts: entry.posts,
    })),
  };
}

export function parseTeacherBackup(value: unknown): TeacherDatabaseBackup {
  if (!isRecord(value)) {
    throw new Error("백업 파일 형식이 올바르지 않습니다.");
  }

  if (value.formatVersion !== 1 || value.kind !== "teacher-database-backup") {
    throw new Error("지원하지 않는 백업 파일입니다.");
  }

  if (!isRecord(value.summary) || !Array.isArray(value.rooms)) {
    throw new Error("백업 요약 정보가 없습니다.");
  }

  return value as TeacherDatabaseBackup;
}

export function previewBackup(backup: TeacherDatabaseBackup): BackupPreview {
  return {
    roomCount: backup.summary.roomCount,
    postCount: backup.summary.postCount,
    topics: backup.rooms.map((entry) => entry.room.topic),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
