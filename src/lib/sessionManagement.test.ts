import { describe, expect, it } from "vitest";
import type { DebateRoom } from "../types";
import { filterRooms, getNextRoomStatus, sortRooms } from "./sessionManagement";

const rooms: DebateRoom[] = [
  {
    id: "1",
    ownerUid: "teacher",
    topic: "스마트폰 사용 시간 제한",
    sessionCode: "TL-1111",
    className: "6-1",
    status: "open",
    createdAt: "2026-04-01T00:00:00.000Z",
    updatedAt: "2026-04-04T00:00:00.000Z",
    postCount: 3,
  },
  {
    id: "2",
    ownerUid: "teacher",
    topic: "급식 잔반 줄이기",
    sessionCode: "TL-2222",
    status: "closed",
    createdAt: "2026-04-02T00:00:00.000Z",
    updatedAt: "2026-04-03T00:00:00.000Z",
    postCount: 8,
  },
  {
    id: "3",
    ownerUid: "teacher",
    topic: "삭제된 토론",
    sessionCode: "TL-3333",
    status: "deleted",
    createdAt: "2026-04-03T00:00:00.000Z",
    updatedAt: "2026-04-05T00:00:00.000Z",
    postCount: 1,
  },
];

describe("session management", () => {
  it("filters deleted rooms out and searches topic/class metadata", () => {
    expect(filterRooms(rooms, "all", "스마트폰")).toHaveLength(1);
    expect(filterRooms(rooms, "all", "")).toHaveLength(2);
    expect(filterRooms(rooms, "closed", "")).toHaveLength(1);
  });

  it("sorts by post count", () => {
    const sorted = sortRooms(filterRooms(rooms, "all", ""), "posts");

    expect(sorted.map((room) => room.id)).toEqual(["2", "1"]);
  });

  it("calculates next status for common teacher actions", () => {
    expect(getNextRoomStatus("open", "close")).toBe("closed");
    expect(getNextRoomStatus("closed", "reopen")).toBe("open");
    expect(getNextRoomStatus("closed", "archive")).toBe("archived");
    expect(getNextRoomStatus("open", "delete")).toBe("deleted");
  });
});
