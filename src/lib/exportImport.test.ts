import { describe, expect, it } from "vitest";
import type { DebatePost, DebateRoom, TeacherUser } from "../types";
import { createRoomExport, parseRoomExport, restoreRoomFromExport } from "./exportImport";

const room: DebateRoom = {
  id: "room-1",
  ownerUid: "teacher",
  topic: "초등학생의 스마트폰 사용 시간을 제한해야 한다",
  sessionCode: "TL-4829",
  status: "closed",
  createdAt: "2026-04-01T00:00:00.000Z",
  updatedAt: "2026-04-01T00:00:00.000Z",
};

const posts: DebatePost[] = [
  {
    id: "post-1",
    roomId: "room-1",
    studentName: "민준",
    stance: "agree",
    reason: "수면 시간이 부족해질 수 있습니다.",
    createdAt: "2026-04-01T00:01:00.000Z",
  },
];

const owner: TeacherUser = {
  uid: "teacher-2",
  email: "teacher@example.com",
  displayName: "김선생님",
  photoURL: null,
};

describe("room export/import", () => {
  it("creates a room export without Firestore ids", () => {
    const exported = createRoomExport(room, posts);

    expect(exported.room.topic).toBe(room.topic);
    expect(exported.posts[0].studentName).toBe("민준");
    expect(JSON.stringify(exported)).not.toContain("room-1");
  });

  it("validates and restores a room export into a new closed room", () => {
    const exported = parseRoomExport(createRoomExport(room, posts));
    const restored = restoreRoomFromExport(
      owner,
      exported,
      "room-2",
      "TL-9000",
      "2026-04-02T00:00:00.000Z",
    );

    expect(restored.room.id).toBe("room-2");
    expect(restored.room.ownerUid).toBe("teacher-2");
    expect(restored.room.status).toBe("closed");
    expect(restored.room.sessionCode).toBe("TL-9000");
    expect(restored.posts[0].roomId).toBe("room-2");
  });
});
