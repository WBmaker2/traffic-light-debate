# Traffic Light Debate Firestore Rules Test Plan

작성일: 2026-05-05
대상 저장소: `/Users/kimhongnyeon/Dev/codex/traffic-light-debate`
목표: 실수업 데이터의 소유권과 학생 제출 권한을 Firestore 에뮬레이터 테스트로 검증한다.

## 구현 범위

### Task 1: Rules 테스트 인프라

**Files**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `firebase.json`
- Add: `vitest.rules.config.ts`

- [x] `@firebase/rules-unit-testing`를 개발 의존성으로 추가한다.
- [x] Firestore 에뮬레이터 실행용 npm 스크립트를 추가한다.
- [x] 규칙 테스트 전용 Vitest 설정을 추가한다.
- [x] Firebase emulator 포트를 고정해 CI와 로컬 실행을 일치시킨다.

### Task 2: 보안 규칙 회귀 테스트

**Files**
- Add: `tests/rules/firestore.rules.test.ts`

- [x] 교사 본인만 세션을 생성, 수정, 보관, 백업할 수 있는지 검증한다.
- [x] 공개 상태 세션은 학생/비로그인 사용자가 읽고 의견을 제출할 수 있는지 검증한다.
- [x] 닫힘/보관/삭제 상태에서 학생 제출과 비소유자 접근이 차단되는지 검증한다.
- [x] 공개 세션 인덱스와 DB 백업 컬렉션의 소유권 규칙을 검증한다.

### Task 3: CI 자동 실행

**Files**
- Modify: `.github/workflows/deploy-firebase-hosting.yml`

- [x] GitHub Actions에 Java 런타임을 설치한다.
- [x] 배포 전 `npm run test:rules`를 실행한다.

## 검증

- [x] `npm run lint`
- [x] `npm test -- --run`
- [x] `npm run build`
- [x] `npm run test:e2e`
- [x] `npx tsc --noEmit --target ES2022 --module ESNext --moduleResolution Bundler --types node,vitest --skipLibCheck tests/rules/firestore.rules.test.ts vitest.rules.config.ts`
- [ ] GitHub Actions에서 Firestore rules test와 Firebase 배포 성공 확인

검증 메모: 로컬 macOS에는 Java Runtime이 없어 Firestore 에뮬레이터 실행이 제한된다. 실제 rules 테스트는 CI의 Java 설정 후 GitHub Actions에서 최종 확인한다.
