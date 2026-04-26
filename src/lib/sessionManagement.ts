import type { DebateRoom, FilterMode, SortMode } from "../types";

export function filterRooms(
  rooms: DebateRoom[],
  filter: FilterMode,
  searchTerm: string,
): DebateRoom[] {
  const normalizedSearch = searchTerm.trim().toLocaleLowerCase("ko-KR");

  return rooms.filter((room) => {
    if (room.status === "deleted") {
      return false;
    }

    const matchesFilter = filter === "all" ? true : room.status === filter;
    if (!matchesFilter) {
      return false;
    }

    if (!normalizedSearch) {
      return true;
    }

    const searchable = [room.topic, room.className, room.memo]
      .filter(Boolean)
      .join(" ")
      .toLocaleLowerCase("ko-KR");

    return searchable.includes(normalizedSearch);
  });
}

export function sortRooms(rooms: DebateRoom[], sortMode: SortMode): DebateRoom[] {
  return [...rooms].sort((left, right) => {
    switch (sortMode) {
      case "created":
        return compareDateDesc(left.createdAt, right.createdAt);
      case "posts":
        return (right.postCount ?? 0) - (left.postCount ?? 0);
      case "title":
        return left.topic.localeCompare(right.topic, "ko-KR");
      case "updated":
      default:
        return compareDateDesc(left.updatedAt, right.updatedAt);
    }
  });
}

export function getNextRoomStatus(
  status: DebateRoom["status"],
  action: "close" | "reopen" | "archive" | "delete",
): DebateRoom["status"] {
  if (action === "delete") {
    return "deleted";
  }

  if (action === "archive") {
    return "archived";
  }

  if (action === "close") {
    return "closed";
  }

  if (status === "deleted") {
    return "deleted";
  }

  return "open";
}

function compareDateDesc(left: string, right: string): number {
  return new Date(right).getTime() - new Date(left).getTime();
}
