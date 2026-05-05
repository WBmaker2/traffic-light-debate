import { expect, test, type Page } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await resetDemoStorage(page);
});

test("teacher creates a room, a student posts, and the teacher can close submissions", async ({
  page,
}) => {
  const topic = `E2E 토론 ${Date.now()}`;
  const reason = "수업 시간에는 서로의 의견을 더 잘 들을 수 있어야 합니다.";

  await page.goto("/teacher");
  await expect(page.getByRole("heading", { name: "토론 세션을 만들고, 수업 기록을 관리합니다." })).toBeVisible();

  await page.getByLabel("토론 주제").fill(topic);
  await page.getByLabel("수업명 또는 학급").fill("6학년 사회 E2E");
  await page.getByLabel("메모").fill("자동 테스트 세션");
  await page.getByRole("button", { name: "세션 생성" }).click();

  await expect(page.getByRole("heading", { name: topic })).toBeVisible();
  await expect(page.getByLabel("학생 입장 QR 코드")).toBeVisible();

  const teacherRoomPath = new URL(page.url()).pathname;
  const roomId = teacherRoomPath.split("/").filter(Boolean).pop();
  expect(roomId).toBeTruthy();

  const sessionCodeLine = await page.locator(".room-header__title").getByText(/세션 코드 TL-\d{4}/).innerText();
  const sessionCode = sessionCodeLine.match(/TL-\d{4}/)?.[0];
  expect(sessionCode).toBeTruthy();

  await page.goto(`/join/${sessionCode}`);
  await page.getByRole("button", { name: "입장하기" }).click();
  await expect(page).toHaveURL(new RegExp(`/student/rooms/${roomId}$`));
  await expect(page.getByRole("heading", { name: topic })).toBeVisible();

  await page.getByLabel("이름").fill("하늘");
  await page.getByRole("button", { name: /반대/ }).click();
  await page.getByLabel("근거").fill(reason);
  await page.getByRole("button", { name: "의견 제출" }).click();

  await expect(page.getByText("의견을 제출했습니다.")).toBeVisible();
  await expect(page.locator(".gauge").first()).toHaveAttribute(
    "aria-label",
    "찬성 0%, 반대 100%, 중립 0%",
  );

  await page.goto(`/teacher/rooms/${roomId}`);
  await expect(page.getByText(reason)).toBeVisible();
  await expect(page.getByText("하늘")).toBeVisible();
  await expect(page.getByLabel("찬성 0%, 반대 100%, 중립 0%")).toBeVisible();
  await expect(page.locator(".room-header__title").getByText("의견 1개")).toBeVisible();

  await page.getByRole("button", { name: "제출 마감" }).click();
  await expect(page.getByText("닫힘")).toBeVisible();

  await page.goto(`/student/rooms/${roomId}`);
  await expect(page.getByText("이 토론은 제출이 마감되었습니다.")).toBeVisible();
  await expect(page.getByRole("button", { name: "의견 제출" })).toHaveCount(0);
});

test("teacher can create a database backup and preview restore from backup history", async ({
  page,
}) => {
  await page.goto("/teacher");
  await expect(page.getByText("아직 저장된 DB 백업 기록이 없습니다.")).toBeVisible();

  await page.getByRole("button", { name: "전체 DB 백업" }).click();

  await expect(page.getByText("최근 백업 1개")).toBeVisible();
  await expect(page.getByText("세션 2개 · 의견 5개")).toBeVisible();

  await page.locator(".backup-history").getByRole("button", { name: "복원" }).click();
  await expect(page.getByRole("dialog", { name: "백업 복원 미리보기" })).toBeVisible();
  await expect(page.getByText("세션 2개, 의견 5개를 새 세션으로 복원합니다.")).toBeVisible();

  await page.getByRole("button", { name: "새 세션으로 복원" }).click();
  await expect(page.getByText("4개 세션")).toBeVisible();
});

async function resetDemoStorage(page: Page): Promise<void> {
  await page.goto("/");
  await page.evaluate(() => {
    window.localStorage.clear();
  });
}
