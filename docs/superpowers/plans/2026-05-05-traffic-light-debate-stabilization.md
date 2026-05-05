# Traffic Light Debate Stabilization Implementation Plan

작성일: 2026-05-05  
대상 저장소: `/Users/kimhongnyeon/Dev/codex/traffic-light-debate`  
목표: 1차 배포가 끝난 신호등 토론방을 실제 수업에서 더 안전하게 운영할 수 있도록 문서, 보안 규칙, 백업 관리 흐름을 보강한다.

## 현재 상태

- Firebase Hosting 배포 URL: `https://traffic-light-debate.web.app`
- GitHub Actions 자동 배포: `main` push 시 Firebase Hosting live 채널 배포
- 핵심 기능: 교사 Google 로그인, 세션 생성/관리, 학생 QR/코드 입장, 실시간 의견 제출, PDF/JSON 저장, Firestore DB 백업
- 검증 상태: ESLint, Vitest, TypeScript build, Vite production build 통과

## 구현 범위

### Task 1: 운영 문서 정정

**Files**
- Modify: `README.md`

- [x] 실제 GitHub Actions 워크플로에서 쓰는 Secret 이름 `FIREBASE_SERVICE_ACCOUNT_TRAFFIC_LIGHT_DEBATE`로 문서를 맞춘다.
- [x] Firebase Hosting, Firestore 백업, 승인 도메인 안내를 현재 구현과 일치시킨다.

### Task 2: Firestore 보안 규칙 강화

**Files**
- Modify: `firestore.rules`

- [x] `rooms` 문서 생성/수정 시 교사 소유권과 주요 필드 형식을 검증한다.
- [x] `publicRooms` 쓰기를 해당 방 소유 교사만 할 수 있게 제한한다.
- [x] 학생 의견 생성 시 필수 필드, `roomId` 일치, 입장 값, 이름/근거 길이를 검증한다.
- [x] `backups` 문서 생성/읽기를 소유 교사에게만 허용하고 백업 문서 형식을 검증한다.

### Task 3: Firestore 백업 목록 UI

**Files**
- Modify: `src/types.ts`
- Modify: `src/services/debateRepository.ts`
- Modify: `src/components/TeacherDashboard.tsx`
- Modify: `src/App.css`

- [x] Repository에 교사별 백업 기록 구독 메서드를 추가한다.
- [x] Firebase 모드에서는 Firestore `backups` 컬렉션을 최신순으로 구독한다.
- [x] 데모 모드에서도 생성한 백업을 로컬 상태에 남겨 같은 UI를 확인할 수 있게 한다.
- [x] 교사 관리 화면에서 최근 DB 백업 목록, JSON 저장, 새 세션 복원 버튼을 제공한다.

### Task 4: 검증

**Commands**
- [x] `eslint .`
- [x] `vitest --run`
- [x] `tsc -b`
- [x] `vite build`
- [ ] Firebase Rules 원격/에뮬레이터 검증
- [x] Firebase Hosting `/teacher` 응답 확인

검증 메모: Firebase Rules 자동 검증은 현재 로컬 Firebase CLI 재인증 필요 및 Java Runtime 부재로 차단되었다. 배포 전 `firebase login --reauth` 또는 CI 배포 로그에서 rules compile 결과를 확인한다.

### Task 5: 배포 자동화 보강

**Files**
- Modify: `.github/workflows/deploy-firebase-hosting.yml`

- [x] `main` push 배포 시 Firebase Hosting 배포 후 Firestore Rules도 함께 배포하도록 GitHub Actions를 보강한다.
- [x] 기존 GitHub Secret `FIREBASE_SERVICE_ACCOUNT_TRAFFIC_LIGHT_DEBATE`를 재사용해 Rules 배포 인증을 처리한다.
- [x] 서비스 계정에 Firebase Rules Admin 권한이 없으면 Hosting 배포는 유지하고 Actions 경고로 후속 조치를 안내한다.

## 다음 후속 후보

- Playwright E2E 테스트: 교사 로그인/세션 생성/학생 제출/백업 복원 흐름 자동화
- Firestore Rules emulator 테스트: 권한 허용/거부 케이스를 자동 검증
- 대용량 백업 대응: 백업 문서 크기가 커지는 학급을 위해 백업 분할 저장 또는 압축 전략 추가
- 수업 리허설 체크리스트: 교사 화면에서 실사용 전 점검 항목 제공
