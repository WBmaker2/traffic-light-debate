import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { createTeacherBackup } from "../lib/backup";
import { createRoomExport, restoreRoomFromExport } from "../lib/exportImport";
import { generateSessionCode, normalizeSessionCode } from "../lib/sessionCode";
import type {
  CreatePostInput,
  CreateRoomInput,
  DebatePost,
  DebateRoom,
  DebateRoomExport,
  DebateRoomStatus,
  TeacherDatabaseBackup,
  TeacherUser,
  Unsubscribe,
} from "../types";
import { getFirebaseServices, type FirebaseServices } from "./firebase";

export type DebateRepository = {
  mode: "firebase" | "demo";
  subscribeRooms(ownerUid: string, onValue: (rooms: DebateRoom[]) => void): Unsubscribe;
  subscribeRoom(roomId: string, onValue: (room: DebateRoom | null) => void): Unsubscribe;
  subscribePosts(roomId: string, onValue: (posts: DebatePost[]) => void): Unsubscribe;
  findRoomBySessionCode(sessionCode: string): Promise<DebateRoom | null>;
  createRoom(owner: TeacherUser, input: CreateRoomInput): Promise<DebateRoom>;
  updateRoom(roomId: string, input: CreateRoomInput): Promise<void>;
  duplicateRoom(owner: TeacherUser, roomId: string): Promise<DebateRoom>;
  updateRoomStatus(roomId: string, status: DebateRoomStatus): Promise<void>;
  deletePost(roomId: string, postId: string): Promise<void>;
  addPost(roomId: string, input: CreatePostInput): Promise<DebatePost>;
  exportRoom(roomId: string): Promise<DebateRoomExport>;
  importRoom(owner: TeacherUser, exportData: DebateRoomExport): Promise<DebateRoom>;
  createBackup(owner: TeacherUser, roomIds?: string[]): Promise<TeacherDatabaseBackup>;
  restoreBackup(owner: TeacherUser, backup: TeacherDatabaseBackup): Promise<DebateRoom[]>;
  getRoomWithPosts(roomId: string): Promise<{ room: DebateRoom; posts: DebatePost[] }>;
};

let repository: DebateRepository | null = null;

export function getDebateRepository(): DebateRepository {
  if (repository) {
    return repository;
  }

  const services = getFirebaseServices();
  repository = services ? new FirebaseDebateRepository(services) : new LocalDebateRepository();
  return repository;
}

class FirebaseDebateRepository implements DebateRepository {
  mode = "firebase" as const;

  constructor(private readonly services: FirebaseServices) {}

  subscribeRooms(ownerUid: string, onValue: (rooms: DebateRoom[]) => void): Unsubscribe {
    const roomsQuery = query(
      collection(this.services.db, "rooms"),
      where("ownerUid", "==", ownerUid),
      orderBy("updatedAt", "desc"),
    );

    return onSnapshot(roomsQuery, (snapshot) => {
      onValue(
        snapshot.docs
          .map(roomFromSnapshot)
          .filter((room) => room.status !== "deleted"),
      );
    });
  }

  subscribeRoom(roomId: string, onValue: (room: DebateRoom | null) => void): Unsubscribe {
    return onSnapshot(doc(this.services.db, "rooms", roomId), (snapshot) => {
      onValue(snapshot.exists() ? roomFromSnapshot(snapshot) : null);
    });
  }

  subscribePosts(roomId: string, onValue: (posts: DebatePost[]) => void): Unsubscribe {
    const postsQuery = query(
      collection(this.services.db, "rooms", roomId, "posts"),
      orderBy("createdAt", "asc"),
    );

    return onSnapshot(postsQuery, (snapshot) => {
      onValue(snapshot.docs.map(postFromSnapshot));
    });
  }

  async findRoomBySessionCode(sessionCode: string): Promise<DebateRoom | null> {
    const normalized = normalizeSessionCode(sessionCode);
    const publicRoom = await getDoc(doc(this.services.db, "publicRooms", normalized));
    if (!publicRoom.exists()) {
      return null;
    }

    const roomId = publicRoom.data().roomId as string;
    const room = await getDoc(doc(this.services.db, "rooms", roomId));
    return room.exists() ? roomFromSnapshot(room) : null;
  }

  async createRoom(owner: TeacherUser, input: CreateRoomInput): Promise<DebateRoom> {
    const existingCodes = await this.getExistingCodes();
    const sessionCode = generateSessionCode(existingCodes);
    const roomRef = doc(collection(this.services.db, "rooms"));
    const now = new Date().toISOString();
    const room: DebateRoom = {
      id: roomRef.id,
      ownerUid: owner.uid,
      topic: input.topic.trim(),
      className: input.className?.trim() || undefined,
      memo: input.memo?.trim() || undefined,
      sessionCode,
      status: "open",
      createdAt: now,
      updatedAt: now,
      postCount: 0,
    };

    const batch = writeBatch(this.services.db);
    batch.set(roomRef, stripUndefined(room));
    batch.set(doc(this.services.db, "publicRooms", sessionCode), {
      roomId: room.id,
      topic: room.topic,
      status: room.status,
      updatedAt: now,
    });
    await batch.commit();
    return room;
  }

  async duplicateRoom(owner: TeacherUser, roomId: string): Promise<DebateRoom> {
    const { room } = await this.getRoomWithPosts(roomId);
    return this.createRoom(owner, {
      topic: `${room.topic} (복사본)`,
      className: room.className,
      memo: room.memo,
    });
  }

  async updateRoom(roomId: string, input: CreateRoomInput): Promise<void> {
    const roomRef = doc(this.services.db, "rooms", roomId);
    const snapshot = await getDoc(roomRef);
    if (!snapshot.exists()) {
      throw new Error("토론방을 찾을 수 없습니다.");
    }

    const room = roomFromSnapshot(snapshot);
    const now = new Date().toISOString();
    const updateData = stripUndefined({
      topic: input.topic.trim(),
      className: input.className?.trim() || undefined,
      memo: input.memo?.trim() || undefined,
      updatedAt: now,
    });

    await updateDoc(roomRef, updateData);
    await setDoc(
      doc(this.services.db, "publicRooms", room.sessionCode),
      {
        topic: updateData.topic,
        updatedAt: now,
      },
      { merge: true },
    );
  }

  async updateRoomStatus(roomId: string, status: DebateRoomStatus): Promise<void> {
    const roomRef = doc(this.services.db, "rooms", roomId);
    const snapshot = await getDoc(roomRef);
    if (!snapshot.exists()) {
      throw new Error("토론방을 찾을 수 없습니다.");
    }

    const room = roomFromSnapshot(snapshot);
    const now = new Date().toISOString();
    const statusDates = {
      closedAt: status === "closed" ? now : room.closedAt,
      archivedAt: status === "archived" ? now : room.archivedAt,
      deletedAt: status === "deleted" ? now : room.deletedAt,
    };

    await updateDoc(roomRef, stripUndefined({ status, updatedAt: now, ...statusDates }));
    await setDoc(
      doc(this.services.db, "publicRooms", room.sessionCode),
      {
        roomId,
        topic: room.topic,
        status,
        updatedAt: now,
      },
      { merge: true },
    );
  }

  async deletePost(roomId: string, postId: string): Promise<void> {
    await deleteDoc(doc(this.services.db, "rooms", roomId, "posts", postId));
    await updateDoc(doc(this.services.db, "rooms", roomId), {
      postCount: increment(-1),
      updatedAt: new Date().toISOString(),
    });
  }

  async addPost(roomId: string, input: CreatePostInput): Promise<DebatePost> {
    const room = await getDoc(doc(this.services.db, "rooms", roomId));
    if (!room.exists() || roomFromSnapshot(room).status !== "open") {
      throw new Error("이 토론은 제출이 마감되었습니다.");
    }

    const now = new Date().toISOString();
    const postRef = doc(collection(this.services.db, "rooms", roomId, "posts"));
    const post: DebatePost = {
      id: postRef.id,
      roomId,
      studentName: input.studentName.trim(),
      stance: input.stance,
      reason: input.reason.trim(),
      clientId: input.clientId,
      createdAt: now,
    };

    const batch = writeBatch(this.services.db);
    batch.set(postRef, stripUndefined(post));
    batch.update(doc(this.services.db, "rooms", roomId), {
      postCount: increment(1),
      updatedAt: now,
    });
    await batch.commit();
    return post;
  }

  async exportRoom(roomId: string): Promise<DebateRoomExport> {
    const { room, posts } = await this.getRoomWithPosts(roomId);
    return createRoomExport(room, posts);
  }

  async importRoom(owner: TeacherUser, exportData: DebateRoomExport): Promise<DebateRoom> {
    const roomRef = doc(collection(this.services.db, "rooms"));
    const sessionCode = generateSessionCode(await this.getExistingCodes());
    const restored = restoreRoomFromExport(owner, exportData, roomRef.id, sessionCode);
    await this.saveRestoredRoom(restored.room, restored.posts);
    return restored.room;
  }

  async createBackup(
    owner: TeacherUser,
    roomIds?: string[],
  ): Promise<TeacherDatabaseBackup> {
    const entries = await this.getBackupEntries(owner.uid, roomIds);
    const backup = createTeacherBackup(owner, entries);
    const fileName = makeBackupFileName();

    await addDoc(collection(this.services.db, "backups"), {
      ownerUid: owner.uid,
      kind: backup.kind,
      roomIds: entries.map((entry) => entry.room.id),
      fileName,
      payload: backup,
      roomCount: backup.summary.roomCount,
      postCount: backup.summary.postCount,
      createdAt: backup.exportedAt,
      appVersion: backup.appVersion,
    });

    return backup;
  }

  async restoreBackup(
    owner: TeacherUser,
    backup: TeacherDatabaseBackup,
  ): Promise<DebateRoom[]> {
    const existingCodes = await this.getExistingCodes();
    const restoredRooms: DebateRoom[] = [];

    for (const entry of backup.rooms) {
      const roomRef = doc(collection(this.services.db, "rooms"));
      const sessionCode = generateSessionCode(existingCodes);
      existingCodes.push(sessionCode);
      const now = new Date().toISOString();
      const room: DebateRoom = {
        ...entry.room,
        id: roomRef.id,
        ownerUid: owner.uid,
        sessionCode,
        status: "closed",
        sourceRoomId: entry.room.id,
        importedFromBackupId: backup.exportedAt,
        createdAt: now,
        updatedAt: now,
        postCount: entry.posts.length,
      };
      const posts = entry.posts.map((post, index) => ({
        ...post,
        id: `${roomRef.id}-post-${index + 1}`,
        roomId: roomRef.id,
        sourcePostId: post.id,
      }));
      await this.saveRestoredRoom(room, posts);
      restoredRooms.push(room);
    }

    return restoredRooms;
  }

  async getRoomWithPosts(roomId: string): Promise<{ room: DebateRoom; posts: DebatePost[] }> {
    const roomSnapshot = await getDoc(doc(this.services.db, "rooms", roomId));
    if (!roomSnapshot.exists()) {
      throw new Error("토론방을 찾을 수 없습니다.");
    }

    const postsSnapshot = await getDocs(
      query(collection(this.services.db, "rooms", roomId, "posts"), orderBy("createdAt", "asc")),
    );

    return {
      room: roomFromSnapshot(roomSnapshot),
      posts: postsSnapshot.docs.map(postFromSnapshot),
    };
  }

  private async getExistingCodes(): Promise<string[]> {
    const snapshot = await getDocs(collection(this.services.db, "publicRooms"));
    return snapshot.docs.map((room) => room.id);
  }

  private async getBackupEntries(
    ownerUid: string,
    roomIds?: string[],
  ): Promise<Array<{ room: DebateRoom; posts: DebatePost[] }>> {
    const roomSnapshots = await getDocs(
      query(collection(this.services.db, "rooms"), where("ownerUid", "==", ownerUid)),
    );

    const allowed = roomIds ? new Set(roomIds) : null;
    const rooms = roomSnapshots.docs
      .map(roomFromSnapshot)
      .filter((room) => room.status !== "deleted")
      .filter((room) => (allowed ? allowed.has(room.id) : true));

    return Promise.all(rooms.map((room) => this.getRoomWithPosts(room.id)));
  }

  private async saveRestoredRoom(room: DebateRoom, posts: DebatePost[]): Promise<void> {
    const batch = writeBatch(this.services.db);
    batch.set(doc(this.services.db, "rooms", room.id), stripUndefined(room));
    batch.set(doc(this.services.db, "publicRooms", room.sessionCode), {
      roomId: room.id,
      topic: room.topic,
      status: room.status,
      updatedAt: room.updatedAt,
    });

    for (const post of posts) {
      batch.set(doc(this.services.db, "rooms", room.id, "posts", post.id), stripUndefined(post));
    }

    await batch.commit();
  }
}

class LocalDebateRepository implements DebateRepository {
  mode = "demo" as const;
  private state = readLocalState();
  private roomListeners = new Set<(rooms: DebateRoom[]) => void>();
  private roomDetailListeners = new Map<string, Set<(room: DebateRoom | null) => void>>();
  private postListeners = new Map<string, Set<(posts: DebatePost[]) => void>>();

  subscribeRooms(ownerUid: string, onValue: (rooms: DebateRoom[]) => void): Unsubscribe {
    const listener = () => {
      onValue(this.state.rooms.filter((room) => room.ownerUid === ownerUid));
    };
    this.roomListeners.add(listener);
    listener();
    return () => this.roomListeners.delete(listener);
  }

  subscribeRoom(roomId: string, onValue: (room: DebateRoom | null) => void): Unsubscribe {
    const listeners = getListenerSet(this.roomDetailListeners, roomId);
    const listener = () => {
      onValue(this.state.rooms.find((room) => room.id === roomId) ?? null);
    };
    listeners.add(listener);
    listener();
    return () => listeners.delete(listener);
  }

  subscribePosts(roomId: string, onValue: (posts: DebatePost[]) => void): Unsubscribe {
    const listeners = getListenerSet(this.postListeners, roomId);
    const listener = () => {
      onValue(
        this.state.posts
          .filter((post) => post.roomId === roomId)
          .sort((left, right) => left.createdAt.localeCompare(right.createdAt)),
      );
    };
    listeners.add(listener);
    listener();
    return () => listeners.delete(listener);
  }

  async findRoomBySessionCode(sessionCode: string): Promise<DebateRoom | null> {
    const normalized = normalizeSessionCode(sessionCode);
    return (
      this.state.rooms.find(
        (room) => room.sessionCode === normalized && room.status !== "deleted",
      ) ?? null
    );
  }

  async createRoom(owner: TeacherUser, input: CreateRoomInput): Promise<DebateRoom> {
    const now = new Date().toISOString();
    const room: DebateRoom = {
      id: makeId("room"),
      ownerUid: owner.uid,
      topic: input.topic.trim(),
      className: input.className?.trim() || undefined,
      memo: input.memo?.trim() || undefined,
      sessionCode: generateSessionCode(this.state.rooms.map((item) => item.sessionCode)),
      status: "open",
      createdAt: now,
      updatedAt: now,
      postCount: 0,
    };
    this.state.rooms.unshift(room);
    this.commit();
    return room;
  }

  async duplicateRoom(owner: TeacherUser, roomId: string): Promise<DebateRoom> {
    const room = this.requireRoom(roomId);
    return this.createRoom(owner, {
      topic: `${room.topic} (복사본)`,
      className: room.className,
      memo: room.memo,
    });
  }

  async updateRoom(roomId: string, input: CreateRoomInput): Promise<void> {
    const room = this.requireRoom(roomId);
    room.topic = input.topic.trim();
    room.className = input.className?.trim() || undefined;
    room.memo = input.memo?.trim() || undefined;
    room.updatedAt = new Date().toISOString();
    this.commit();
  }

  async updateRoomStatus(roomId: string, status: DebateRoomStatus): Promise<void> {
    const room = this.requireRoom(roomId);
    const now = new Date().toISOString();
    room.status = status;
    room.updatedAt = now;
    if (status === "closed") room.closedAt = now;
    if (status === "archived") room.archivedAt = now;
    if (status === "deleted") room.deletedAt = now;
    this.commit();
  }

  async deletePost(roomId: string, postId: string): Promise<void> {
    this.state.posts = this.state.posts.filter((post) => post.id !== postId);
    this.refreshPostCount(roomId);
    this.commit();
  }

  async addPost(roomId: string, input: CreatePostInput): Promise<DebatePost> {
    const room = this.requireRoom(roomId);
    if (room.status !== "open") {
      throw new Error("이 토론은 제출이 마감되었습니다.");
    }

    const post: DebatePost = {
      id: makeId("post"),
      roomId,
      studentName: input.studentName.trim(),
      stance: input.stance,
      reason: input.reason.trim(),
      clientId: input.clientId,
      createdAt: new Date().toISOString(),
    };
    this.state.posts.push(post);
    room.updatedAt = post.createdAt;
    this.refreshPostCount(roomId);
    this.commit();
    return post;
  }

  async exportRoom(roomId: string): Promise<DebateRoomExport> {
    const { room, posts } = await this.getRoomWithPosts(roomId);
    return createRoomExport(room, posts);
  }

  async importRoom(owner: TeacherUser, exportData: DebateRoomExport): Promise<DebateRoom> {
    const roomId = makeId("room");
    const sessionCode = generateSessionCode(this.state.rooms.map((room) => room.sessionCode));
    const restored = restoreRoomFromExport(owner, exportData, roomId, sessionCode);
    restored.room.postCount = restored.posts.length;
    this.state.rooms.unshift(restored.room);
    this.state.posts.push(...restored.posts);
    this.commit();
    return restored.room;
  }

  async createBackup(
    owner: TeacherUser,
    roomIds?: string[],
  ): Promise<TeacherDatabaseBackup> {
    const allowed = roomIds ? new Set(roomIds) : null;
    const entries = await Promise.all(
      this.state.rooms
        .filter((room) => room.ownerUid === owner.uid && room.status !== "deleted")
        .filter((room) => (allowed ? allowed.has(room.id) : true))
        .map((room) => this.getRoomWithPosts(room.id)),
    );

    return createTeacherBackup(owner, entries);
  }

  async restoreBackup(
    owner: TeacherUser,
    backup: TeacherDatabaseBackup,
  ): Promise<DebateRoom[]> {
    const restoredRooms: DebateRoom[] = [];
    const existingCodes = this.state.rooms.map((room) => room.sessionCode);

    for (const entry of backup.rooms) {
      const roomId = makeId("room");
      const sessionCode = generateSessionCode(existingCodes);
      existingCodes.push(sessionCode);
      const now = new Date().toISOString();
      const room: DebateRoom = {
        ...entry.room,
        id: roomId,
        ownerUid: owner.uid,
        sessionCode,
        status: "closed",
        sourceRoomId: entry.room.id,
        importedFromBackupId: backup.exportedAt,
        createdAt: now,
        updatedAt: now,
        postCount: entry.posts.length,
      };
      const posts = entry.posts.map((post) => ({
        ...post,
        id: makeId("post"),
        roomId,
        sourcePostId: post.id,
      }));

      this.state.rooms.unshift(room);
      this.state.posts.push(...posts);
      restoredRooms.push(room);
    }

    this.commit();
    return restoredRooms;
  }

  async getRoomWithPosts(roomId: string): Promise<{ room: DebateRoom; posts: DebatePost[] }> {
    const room = this.requireRoom(roomId);
    return {
      room,
      posts: this.state.posts.filter((post) => post.roomId === roomId),
    };
  }

  private requireRoom(roomId: string): DebateRoom {
    const room = this.state.rooms.find((item) => item.id === roomId);
    if (!room) {
      throw new Error("토론방을 찾을 수 없습니다.");
    }
    return room;
  }

  private refreshPostCount(roomId: string): void {
    const room = this.requireRoom(roomId);
    room.postCount = this.state.posts.filter((post) => post.roomId === roomId).length;
  }

  private commit(): void {
    writeLocalState(this.state);
    for (const listener of this.roomListeners) {
      listener(this.state.rooms);
    }
    for (const [roomId, listeners] of this.roomDetailListeners) {
      const room = this.state.rooms.find((item) => item.id === roomId) ?? null;
      for (const listener of listeners) {
        listener(room);
      }
    }
    for (const [roomId, listeners] of this.postListeners) {
      const posts = this.state.posts.filter((post) => post.roomId === roomId);
      for (const listener of listeners) {
        listener(posts);
      }
    }
  }
}

type LocalState = {
  rooms: DebateRoom[];
  posts: DebatePost[];
};

const LOCAL_KEY = "traffic-light-debate-demo-v1";

function readLocalState(): LocalState {
  if (typeof window === "undefined") {
    return createSeedState();
  }

  const raw = window.localStorage.getItem(LOCAL_KEY);
  if (!raw) {
    const seed = createSeedState();
    writeLocalState(seed);
    return seed;
  }

  try {
    return JSON.parse(raw) as LocalState;
  } catch {
    const seed = createSeedState();
    writeLocalState(seed);
    return seed;
  }
}

function writeLocalState(state: LocalState): void {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(LOCAL_KEY, JSON.stringify(state));
  }
}

function createSeedState(): LocalState {
  const now = new Date().toISOString();
  const room: DebateRoom = {
    id: "demo-room-1",
    ownerUid: "demo-teacher",
    topic: "초등학생의 스마트폰 사용 시간을 제한해야 한다",
    sessionCode: "TL-4829",
    className: "6학년 사회",
    memo: "민주적인 문제 해결 방안 찾기",
    status: "open",
    createdAt: now,
    updatedAt: now,
    postCount: 3,
  };

  return {
    rooms: [
      room,
      {
        id: "demo-room-2",
        ownerUid: "demo-teacher",
        topic: "우리 학교는 급식 잔반을 줄이기 위해 규칙을 강화해야 한다",
        sessionCode: "TL-2194",
        className: "5학년 국어",
        status: "closed",
        createdAt: now,
        updatedAt: now,
        postCount: 2,
      },
    ],
    posts: [
      {
        id: "demo-post-1",
        roomId: "demo-room-1",
        studentName: "민준",
        stance: "agree",
        reason: "너무 오래 쓰면 잠자는 시간이 줄어들 수 있습니다.",
        createdAt: now,
      },
      {
        id: "demo-post-2",
        roomId: "demo-room-1",
        studentName: "서연",
        stance: "disagree",
        reason: "가족과 약속을 정하면 스스로 조절하는 연습이 됩니다.",
        createdAt: now,
      },
      {
        id: "demo-post-3",
        roomId: "demo-room-1",
        studentName: "지후",
        stance: "neutral",
        reason: "학습용과 놀이용 시간을 나누는 기준이 필요합니다.",
        createdAt: now,
      },
      {
        id: "demo-post-4",
        roomId: "demo-room-2",
        studentName: "하린",
        stance: "agree",
        reason: "음식물 쓰레기를 줄이는 데 도움이 됩니다.",
        createdAt: now,
      },
      {
        id: "demo-post-5",
        roomId: "demo-room-2",
        studentName: "도윤",
        stance: "neutral",
        reason: "먼저 왜 남기는지 조사해 보면 좋겠습니다.",
        createdAt: now,
      },
    ],
  };
}

function roomFromSnapshot(snapshot: QueryDocumentSnapshot<DocumentData> | { id: string; data: () => DocumentData }): DebateRoom {
  const data = snapshot.data();
  return {
    id: snapshot.id,
    ownerUid: data.ownerUid,
    topic: data.topic,
    sessionCode: data.sessionCode,
    className: data.className,
    memo: data.memo,
    status: data.status,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    closedAt: data.closedAt,
    archivedAt: data.archivedAt,
    deletedAt: data.deletedAt,
    sourceRoomId: data.sourceRoomId,
    importedFromBackupId: data.importedFromBackupId,
    postCount: data.postCount ?? 0,
  };
}

function postFromSnapshot(snapshot: QueryDocumentSnapshot<DocumentData>): DebatePost {
  const data = snapshot.data();
  return {
    id: snapshot.id,
    roomId: data.roomId,
    studentName: data.studentName,
    stance: data.stance,
    reason: data.reason,
    createdAt: data.createdAt,
    clientId: data.clientId,
    sourcePostId: data.sourcePostId,
  };
}

function stripUndefined<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter(([, entryValue]) => entryValue !== undefined),
  ) as T;
}

function getListenerSet<T>(
  map: Map<string, Set<T>>,
  key: string,
): Set<T> {
  const existing = map.get(key);
  if (existing) {
    return existing;
  }
  const next = new Set<T>();
  map.set(key, next);
  return next;
}

function makeId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function makeBackupFileName(): string {
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\..+$/, "");
  return `${stamp}-traffic-light-debate-backup.json`;
}
