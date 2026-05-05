import fs from "node:fs";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";

const PROJECT_ID = "demo-traffic-light-debate-rules";
const OWNER_UID = "teacher-a";
const OTHER_UID = "teacher-b";
const NOW = "2026-05-05T00:00:00.000Z";
const LATER = "2026-05-05T00:10:00.000Z";

type RoomStatus = "open" | "closed" | "archived" | "deleted";

type RoomData = {
  id: string;
  ownerUid: string;
  topic: string;
  sessionCode: string;
  className: string;
  memo: string;
  status: RoomStatus;
  createdAt: string;
  updatedAt: string;
  postCount: number;
  closedAt?: string;
  archivedAt?: string;
  deletedAt?: string;
  sourceRoomId?: string;
  importedFromBackupId?: string;
};

type PostData = {
  id: string;
  roomId: string;
  studentName: string;
  stance: "agree" | "disagree" | "neutral";
  reason: string;
  createdAt: string;
  clientId: string;
  sourcePostId?: string;
};

let testEnv: RulesTestEnvironment;

function roomData(id: string, overrides: Partial<RoomData> = {}): RoomData {
  return {
    id,
    ownerUid: OWNER_UID,
    topic: "초등학생의 스마트폰 사용 시간을 제한해야 한다",
    sessionCode: "TL-1001",
    className: "6학년 1반",
    memo: "사회 토론 수업",
    status: "open",
    createdAt: NOW,
    updatedAt: NOW,
    postCount: 0,
    ...overrides,
  };
}

function postData(roomId: string, overrides: Partial<PostData> = {}): PostData {
  return {
    id: "post-1",
    roomId,
    studentName: "하늘",
    stance: "agree",
    reason: "친구들과 쉬는 시간에 더 많이 이야기할 수 있습니다.",
    createdAt: NOW,
    clientId: "client-1",
    ...overrides,
  };
}

function publicRoomData(roomId: string) {
  return {
    roomId,
    topic: "초등학생의 스마트폰 사용 시간을 제한해야 한다",
    status: "open",
    updatedAt: NOW,
  };
}

function backupData(ownerUid = OWNER_UID) {
  return {
    ownerUid,
    kind: "teacher-database-backup",
    roomIds: ["room-open"],
    fileName: "traffic-light-debate-backup.json",
    payload: {
      formatVersion: 1,
      kind: "teacher-database-backup",
      ownerUid,
      exportedAt: NOW,
      appVersion: "0.1.0",
      summary: {
        roomCount: 1,
        postCount: 0,
      },
      rooms: [],
    },
    roomCount: 1,
    postCount: 0,
    createdAt: NOW,
    appVersion: "0.1.0",
  };
}

async function seedRoom(id: string, overrides: Partial<RoomData> = {}) {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await context.firestore().doc(`rooms/${id}`).set(roomData(id, overrides));
  });
}

async function seedPost(roomId: string, postId: string, overrides: Partial<PostData> = {}) {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await context
      .firestore()
      .doc(`rooms/${roomId}/posts/${postId}`)
      .set(postData(roomId, { id: postId, ...overrides }));
  });
}

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      host: "127.0.0.1",
      port: 8080,
      rules: fs.readFileSync("firestore.rules", "utf8"),
    },
  });
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

afterAll(async () => {
  await testEnv.cleanup();
});

describe("rooms", () => {
  it("allows only the owner teacher to create and manage a valid room", async () => {
    const teacherDb = testEnv.authenticatedContext(OWNER_UID).firestore();
    const otherDb = testEnv.authenticatedContext(OTHER_UID).firestore();
    const guestDb = testEnv.unauthenticatedContext().firestore();

    await assertSucceeds(teacherDb.doc("rooms/room-new").set(roomData("room-new")));
    await assertSucceeds(
      teacherDb.doc("rooms/room-new").update({
        topic: "우리 학교 급식 잔반을 줄이기 위해 규칙을 강화해야 한다",
        updatedAt: LATER,
      }),
    );
    await assertSucceeds(
      teacherDb.doc("rooms/room-new").update({
        status: "archived",
        archivedAt: LATER,
        updatedAt: LATER,
      }),
    );

    await assertFails(guestDb.doc("rooms/room-guest").set(roomData("room-guest")));
    await assertFails(
      otherDb.doc("rooms/room-mismatch").set(roomData("room-mismatch", { ownerUid: OWNER_UID })),
    );
    await assertFails(teacherDb.doc("rooms/room-new").delete());
  });

  it("keeps archived rooms private while open and closed rooms are readable", async () => {
    await seedRoom("room-open");
    await seedRoom("room-closed", {
      status: "closed",
      closedAt: LATER,
      sessionCode: "TL-1002",
    });
    await seedRoom("room-archived", {
      status: "archived",
      archivedAt: LATER,
      sessionCode: "TL-1003",
    });

    const teacherDb = testEnv.authenticatedContext(OWNER_UID).firestore();
    const otherDb = testEnv.authenticatedContext(OTHER_UID).firestore();
    const guestDb = testEnv.unauthenticatedContext().firestore();

    await assertSucceeds(guestDb.doc("rooms/room-open").get());
    await assertSucceeds(guestDb.doc("rooms/room-closed").get());
    await assertFails(guestDb.doc("rooms/room-archived").get());
    await assertSucceeds(teacherDb.doc("rooms/room-archived").get());
    await assertFails(otherDb.doc("rooms/room-archived").get());
  });
});

describe("student posts", () => {
  it("allows a student to submit one valid post to an open room and increment the count by one", async () => {
    await seedRoom("room-open");
    await seedRoom("room-closed", {
      status: "closed",
      closedAt: LATER,
      sessionCode: "TL-1002",
    });

    const guestDb = testEnv.unauthenticatedContext().firestore();

    await assertSucceeds(
      guestDb.doc("rooms/room-open/posts/post-1").set(postData("room-open")),
    );
    await assertSucceeds(
      guestDb.doc("rooms/room-open").update({
        postCount: 1,
        updatedAt: LATER,
      }),
    );

    await assertFails(
      guestDb.doc("rooms/room-open").update({
        postCount: 3,
        updatedAt: LATER,
      }),
    );
    await assertFails(
      guestDb.doc("rooms/room-closed/posts/post-closed").set(postData("room-closed")),
    );
    await assertFails(
      guestDb.doc("rooms/room-open/posts/post-wrong-room").set(
        postData("room-open", {
          id: "post-wrong-room",
          roomId: "another-room",
        }),
      ),
    );
    await assertFails(
      guestDb.doc("rooms/room-open/posts/post-long").set(
        postData("room-open", {
          id: "post-long",
          reason: "가".repeat(281),
        }),
      ),
    );
  });

  it("lets students read public-room posts but only the owner teacher can edit or delete them", async () => {
    await seedRoom("room-open");
    await seedPost("room-open", "post-1");

    const teacherDb = testEnv.authenticatedContext(OWNER_UID).firestore();
    const guestDb = testEnv.unauthenticatedContext().firestore();

    await assertSucceeds(guestDb.doc("rooms/room-open/posts/post-1").get());
    await assertFails(
      guestDb.doc("rooms/room-open/posts/post-1").update({
        reason: "수정 시도",
      }),
    );
    await assertFails(guestDb.doc("rooms/room-open/posts/post-1").delete());
    await assertSucceeds(
      teacherDb.doc("rooms/room-open/posts/post-1").update({
        reason: "수업 정리용으로 교사가 오탈자를 고쳤습니다.",
      }),
    );
    await assertSucceeds(teacherDb.doc("rooms/room-open/posts/post-1").delete());
  });
});

describe("public room index and backups", () => {
  it("allows only the owning teacher to publish and remove a public room index", async () => {
    await seedRoom("room-open");

    const teacherDb = testEnv.authenticatedContext(OWNER_UID).firestore();
    const otherDb = testEnv.authenticatedContext(OTHER_UID).firestore();
    const guestDb = testEnv.unauthenticatedContext().firestore();

    await assertSucceeds(
      teacherDb.doc("publicRooms/TL-1001").set(publicRoomData("room-open")),
    );
    await assertSucceeds(guestDb.doc("publicRooms/TL-1001").get());
    await assertFails(
      guestDb.doc("publicRooms/TL-1002").set(publicRoomData("room-open")),
    );
    await assertFails(
      otherDb.doc("publicRooms/TL-1002").set(publicRoomData("room-open")),
    );
    await assertSucceeds(teacherDb.doc("publicRooms/TL-1001").delete());
  });

  it("keeps Firebase DB backup documents private to the owning teacher", async () => {
    const teacherDb = testEnv.authenticatedContext(OWNER_UID).firestore();
    const otherDb = testEnv.authenticatedContext(OTHER_UID).firestore();
    const guestDb = testEnv.unauthenticatedContext().firestore();

    await assertSucceeds(teacherDb.doc("backups/backup-1").set(backupData()));
    await assertSucceeds(teacherDb.doc("backups/backup-1").get());
    await assertFails(otherDb.doc("backups/backup-1").get());
    await assertFails(guestDb.doc("backups/backup-guest").set(backupData()));
    await assertFails(otherDb.doc("backups/backup-other").set(backupData(OWNER_UID)));
    await assertFails(
      teacherDb.doc("backups/backup-1").update({
        fileName: "changed.json",
      }),
    );
    await assertFails(teacherDb.doc("backups/backup-1").delete());
  });
});
