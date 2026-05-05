# Traffic Light Debate E2E Implementation Plan

작성일: 2026-05-05
대상 저장소: `/Users/kimhongnyeon/Dev/codex/traffic-light-debate`
목표: 실제 수업 전에 교사-학생 핵심 흐름이 깨지지 않는지 Playwright로 자동 검증한다.

## 구현 범위

### Task 1: Playwright 테스트 인프라

**Files**
- Modify: `package.json`
- Modify: `package-lock.json`
- Add: `playwright.config.ts`

- [x] `@playwright/test`를 개발 의존성으로 추가한다.
- [x] `test:e2e` 스크립트를 추가한다.
- [x] Firebase 환경변수를 비워 데모 저장소로 실행되는 E2E 서버 설정을 추가한다.

### Task 2: 수업 흐름 E2E 테스트

**Files**
- Add: `tests/e2e/classroom-flow.spec.ts`

- [x] 교사가 새 토론 세션을 만든다.
- [x] 학생이 세션 코드 링크로 입장해 반대 의견을 제출한다.
- [x] 교사 화면에서 제출 의견, 포스트잇, 실시간 게이지가 반영되는지 확인한다.
- [x] 교사가 제출을 마감하면 학생 화면에 마감 안내가 표시되는지 확인한다.
- [x] 교사 DB 백업 생성 후 백업 기록과 복원 모달이 표시되는지 확인한다.

### Task 3: CI 자동 실행

**Files**
- Modify: `.github/workflows/deploy-firebase-hosting.yml`

- [x] GitHub Actions에서 Chromium 브라우저를 설치한다.
- [x] `npm run test:e2e`를 배포 전 실행한다.

## 검증

- [x] `npm run lint`
- [x] `npm test -- --run`
- [x] `npm run build`
- [x] `npm run test:e2e`
- [ ] GitHub Actions 최신 run에서 E2E와 Firebase Hosting/Rules 배포 성공 확인
