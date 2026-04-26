export type Stance = "agree" | "disagree" | "neutral";

export type DebateRoomStatus = "open" | "closed" | "archived" | "deleted";

export type SortMode = "updated" | "created" | "posts" | "title";

export type FilterMode = "all" | "open" | "closed" | "archived";

export type TimestampLike = string | Date | number;

export type TeacherUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
};

export type DebateRoom = {
  id: string;
  ownerUid: string;
  topic: string;
  sessionCode: string;
  className?: string;
  memo?: string;
  status: DebateRoomStatus;
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
  archivedAt?: string;
  deletedAt?: string;
  sourceRoomId?: string;
  importedFromBackupId?: string;
  postCount?: number;
};

export type DebatePost = {
  id: string;
  roomId: string;
  studentName: string;
  stance: Stance;
  reason: string;
  createdAt: string;
  clientId?: string;
  sourcePostId?: string;
};

export type CreateRoomInput = {
  topic: string;
  className?: string;
  memo?: string;
};

export type CreatePostInput = {
  studentName: string;
  stance: Stance;
  reason: string;
  clientId?: string;
};

export type StanceStat = {
  stance: Stance;
  label: string;
  count: number;
  percent: number;
};

export type DebateStats = {
  total: number;
  agree: StanceStat;
  disagree: StanceStat;
  neutral: StanceStat;
};

export type DebateRoomExport = {
  formatVersion: 1;
  exportedAt: string;
  appVersion: string;
  room: Omit<
    DebateRoom,
    "id" | "ownerUid" | "postCount" | "sourceRoomId" | "importedFromBackupId"
  >;
  posts: Array<Omit<DebatePost, "id" | "roomId" | "clientId" | "sourcePostId">>;
};

export type TeacherDatabaseBackup = {
  formatVersion: 1;
  kind: "teacher-database-backup";
  exportedAt: string;
  appVersion: string;
  ownerUid: string;
  summary: {
    roomCount: number;
    postCount: number;
  };
  rooms: Array<{
    firestorePath: string;
    room: DebateRoom;
    posts: DebatePost[];
  }>;
};

export type BackupPreview = {
  roomCount: number;
  postCount: number;
  topics: string[];
};

export type Unsubscribe = () => void;
