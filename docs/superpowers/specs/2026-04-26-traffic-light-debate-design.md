# 신호등 토론방: 내 생각 포스트잇 설계 문서

작성일: 2026-04-26  
대상 저장소: `/Users/kimhongnyeon/Dev/codex/traffic-light-debate`  
권장 구현안: Firebase 기반 Vite + React + TypeScript 웹앱

## 1. 목표

`신호등 토론방: 내 생각 포스트잇`은 5~6학년 국어, 사회, 도덕 수업에서 모든 학생이 자신의 의견을 조용히 제출하고, 학급 전체의 찬성/반대/중립 비율을 실시간으로 확인할 수 있게 하는 디지털 토론 보드입니다.

교사는 Google 로그인 후 토론 세션을 생성하고, 학생은 세션 코드 또는 QR 코드로 접속합니다. 학생 의견은 색상 포스트잇 형태로 교사 화면에 실시간 반영되며, 교사는 토론 결과를 PDF, JSON, Firebase 데이터베이스 백업 파일로 저장할 수 있습니다.

## 2. 교육 맥락

- 대상 학년: 초등학교 5~6학년군
- 과목: 국어, 사회, 도덕
- 연계 성취기준:
  - `[6국01-02]` 의견을 조정하며 토의한다.
  - `[6사06-05]` 일상생활에서 경험하는 민주주의 실천 사례를 탐구하여 민주적인 문제 해결 방안을 제시한다.
- 수업 목표:
  - 학생이 자신의 입장과 근거를 짧게 표현한다.
  - 학급의 의견 분포를 시각적으로 확인한다.
  - 토론 중 의견 변화나 쟁점을 교사가 쉽게 파악한다.
  - 수업 후 토론 기록을 보관하고 다시 불러올 수 있다.

## 3. 주요 사용자

### 교사

- Google 계정으로 로그인합니다.
- 토론 주제를 입력해 세션을 생성합니다.
- 여러 개의 토론 세션을 목록에서 검색, 정렬, 상태 변경, 보관, 삭제할 수 있습니다.
- 세션 코드와 QR 코드를 학생에게 제공합니다.
- 실시간 의견 보드와 비율 게이지를 확인합니다.
- 토론 기록을 PDF, JSON으로 저장합니다.
- 자신이 만든 Firebase 세션 데이터를 백업하고 필요할 때 복원합니다.

### 학생

- 로그인 없이 세션 코드 또는 QR 코드로 입장합니다.
- 이름을 입력합니다.
- 찬성, 반대, 중립 중 하나를 선택합니다.
- 짧은 근거를 입력해 제출합니다.
- 제출 후 자신의 의견과 전체 비율 변화를 확인합니다.

## 4. 범위

### 1차 구현 범위

- 교사 Google 로그인
- 교사 세션 생성
- 교사 다중 세션 관리
- 학생 세션 코드 입장
- 세션 QR 코드 생성
- 찬성/반대/중립 의견 제출
- 실시간 포스트잇 보드
- 실시간 게이지 바
- PDF 내보내기
- JSON 내보내기
- JSON 불러오기 및 세션 복원
- 교사 소유 세션 Firebase 백업 파일 생성
- 백업 파일 다운로드 및 Firebase Storage 저장

### 1차 범위에서 제외

- 학생 개별 계정 로그인
- 실시간 채팅
- 의견 좋아요 또는 댓글
- 복수 교사 공동 편집
- 학교/학급 단위 권한 관리
- 자동 AI 요약
- Cloud Scheduler 기반 자동 정기 백업

## 5. 기술 스택

- 프론트엔드: Vite, React, TypeScript
- 스타일링: CSS Modules 또는 단일 CSS 토큰 기반 전역 스타일
- 인증: Firebase Authentication Google Provider
- 실시간 데이터베이스: Cloud Firestore
- 파일 저장: Firebase Storage
- QR 코드: `qrcode.react`
- PDF 생성: `jspdf`, `html2canvas` 또는 `@react-pdf/renderer`
- 테스트: Vitest, React Testing Library
- 배포 후보: Firebase Hosting 또는 GitHub Pages

Firebase Hosting을 우선 추천합니다. Firebase Auth, Firestore, Storage와 같은 프로젝트 안에서 운영할 수 있어 환경 설정과 배포 경로가 단순해집니다.

## 6. 정보 구조와 라우팅

```text
/                         랜딩 및 역할 선택
/teacher                  교사 대시보드
/teacher/rooms/:roomId    교사용 실시간 토론 보드
/teacher/backups          Firebase 백업 관리
/student                  학생 세션 코드 입력
/join/:sessionCode        QR 코드용 학생 입장 링크
/student/rooms/:roomId    학생 의견 제출 화면
```

### 교사 흐름

1. `/teacher`에서 Google 로그인합니다.
2. 교사 대시보드에서 기존 세션 목록을 확인하거나 새 세션을 생성합니다.
3. 토론 주제를 입력하면 앱이 짧은 세션 코드와 QR 코드를 생성합니다.
4. 교사는 `/teacher/rooms/:roomId` 화면을 전자칠판에 띄웁니다.
5. 학생 의견이 들어오면 포스트잇과 게이지가 실시간 갱신됩니다.
6. 필요하면 세션을 닫기, 다시 열기, 보관, 삭제, 복제합니다.
7. 수업 후 PDF, JSON, Firebase 백업을 저장합니다.

### 학생 흐름

1. `/student`에서 세션 코드를 입력하거나 QR 코드의 `/join/:sessionCode`로 접속합니다.
2. 이름을 입력합니다.
3. 찬성, 반대, 중립 중 하나를 선택합니다.
4. 근거를 짧게 작성합니다.
5. 제출 후 완료 상태와 현재 비율을 확인합니다.

## 7. 핵심 UI 설계

### 교사 대시보드

- 상단: 앱 이름, 로그인 사용자, 새 토론 만들기 버튼
- 세션 생성 폼:
  - 토론 주제
  - 선택 입력: 수업명, 학급명, 메모
- 기존 세션 목록:
  - 토론 주제
  - 생성일
  - 참여 의견 수
  - 세션 상태
  - 최근 업데이트 시각
  - 열기, 복제, 닫기/다시 열기, 보관, 삭제, JSON 저장, PDF 저장, 백업 버튼
- 세션 관리 도구:
  - 검색: 토론 주제, 학급명, 메모
  - 필터: 전체, 진행 중, 닫힘, 보관됨
  - 정렬: 최근 수정순, 생성일순, 의견 수순, 제목순
  - 다중 선택: 여러 세션을 한 번에 보관하거나 백업
  - 빈 상태: 아직 만든 세션이 없을 때 새 토론 만들기 안내

### 교사 세션 관리 기능

교사 관리 화면은 여러 토론 세션이 쌓여도 수업 기록을 쉽게 찾고 정리할 수 있어야 합니다.

#### 세션 상태

```ts
type DebateRoomStatus = "open" | "closed" | "archived" | "deleted";
```

- `open`: 학생 제출 가능
- `closed`: 학생 제출 마감, 교사 열람 가능
- `archived`: 목록 기본 보기에서 숨김, 기록 보관
- `deleted`: 소프트 삭제 상태, 1차 구현에서는 복구 화면을 제공하지 않음

#### 세션별 작업

- 열기: 교사용 실시간 보드로 이동합니다.
- 복제: 같은 토론 주제와 메모로 새 세션을 만듭니다. 학생 의견은 복제하지 않습니다.
- 닫기: 학생 제출을 막고 결과 열람 상태로 전환합니다.
- 다시 열기: 닫힌 세션을 다시 제출 가능 상태로 전환합니다.
- 보관: 수업이 끝난 세션을 보관 목록으로 이동합니다.
- 삭제: 확인 모달 후 `deleted` 상태로 변경합니다.
- PDF 저장: 해당 세션 결과를 PDF로 저장합니다.
- JSON 저장: 해당 세션 하나를 복원 가능한 JSON으로 저장합니다.
- 백업 포함: Firebase 데이터베이스 백업 대상에 포함합니다.

#### 다중 선택 작업

- 선택한 세션 PDF 일괄 저장
- 선택한 세션 JSON 일괄 저장
- 선택한 세션 Firebase 백업
- 선택한 세션 보관
- 선택한 세션 삭제

일괄 삭제는 실수 방지를 위해 선택한 세션 수와 토론 주제를 확인 모달에 표시합니다.

### 교사용 토론 보드

- 상단 고정 영역:
  - 토론 주제
  - 세션 코드
  - QR 코드
  - 참여 의견 수
  - 찬성/반대/중립 실시간 게이지
- 본문:
  - 코르크 보드 느낌의 넓은 배경
  - 초록색 찬성 포스트잇
  - 빨간색 반대 포스트잇
  - 노란색 중립 포스트잇
- 하단 또는 우측 도구:
  - PDF 저장
  - JSON 저장
  - JSON 불러오기
  - Firebase 백업
  - 세션 닫기

### 학생 의견 제출 화면

- 토론 주제 표시
- 이름 입력
- 입장 선택 버튼:
  - 찬성
  - 반대
  - 중립
- 근거 입력창
- 제출 버튼
- 제출 완료 안내
- 현재 학급 의견 비율

## 8. 데이터 모델

Firestore는 다음 구조를 사용합니다.

```text
users/{uid}
rooms/{roomId}
rooms/{roomId}/posts/{postId}
backups/{backupId}
```

### `users/{uid}`

```ts
type TeacherUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  createdAt: Timestamp;
  lastLoginAt: Timestamp;
};
```

### `rooms/{roomId}`

```ts
type DebateRoom = {
  id: string;
  ownerUid: string;
  topic: string;
  sessionCode: string;
  className?: string;
  memo?: string;
  status: "open" | "closed" | "archived" | "deleted";
  createdAt: Timestamp;
  updatedAt: Timestamp;
  closedAt?: Timestamp;
  archivedAt?: Timestamp;
  deletedAt?: Timestamp;
  sourceRoomId?: string;
  importedFromBackupId?: string;
};
```

### `rooms/{roomId}/posts/{postId}`

```ts
type DebatePost = {
  id: string;
  roomId: string;
  studentName: string;
  stance: "agree" | "disagree" | "neutral";
  reason: string;
  createdAt: Timestamp;
  clientId?: string;
};
```

### `backups/{backupId}`

```ts
type DebateBackup = {
  id: string;
  ownerUid: string;
  kind: "room-json" | "teacher-database-backup";
  roomIds: string[];
  fileName: string;
  storagePath: string;
  roomCount: number;
  postCount: number;
  createdAt: Timestamp;
  appVersion: string;
};
```

## 9. 실시간 동기화

교사 보드는 `rooms/{roomId}`와 `rooms/{roomId}/posts`를 Firestore `onSnapshot`으로 구독합니다.

- 새 포스트가 추가되면 포스트잇 목록에 즉시 반영합니다.
- `posts` 목록이 바뀔 때마다 찬성/반대/중립 개수와 백분율을 클라이언트에서 계산합니다.
- 학생 화면도 같은 `posts` 구독을 사용해 전체 비율을 보여줍니다.
- 통계 계산은 별도 순수 함수로 분리해 테스트합니다.

## 10. QR 코드와 세션 코드

세션 생성 시 사람이 읽기 쉬운 6자리 코드를 생성합니다.

예시:

```text
TL-4829
```

Firestore에는 `sessionCode`를 저장하고, 학생 입장 시 `rooms` 컬렉션에서 해당 코드를 조회합니다.

QR 코드는 다음 URL을 담습니다.

```text
https://<app-domain>/join/TL-4829
```

세션 코드는 충돌 가능성이 있으므로 생성 시 기존 코드 조회 후 중복이면 다시 생성합니다.

## 11. PDF 저장

PDF에는 다음 내용을 포함합니다.

- 토론 주제
- 생성일 및 저장일
- 교사 이름 또는 이메일
- 전체 의견 수
- 찬성/반대/중립 개수와 백분율
- 색상별 의견 목록
- 학생 이름
- 근거 문장

PDF는 수업 기록으로 읽기 쉬워야 하므로 포스트잇 화면을 그대로 캡처하는 방식보다, 인쇄용 레이아웃을 별도로 구성하는 방식을 우선합니다.

## 12. JSON 저장과 불러오기

JSON 저장은 개별 토론 세션 복원을 위한 기능입니다.

### JSON 파일 형식

```ts
type DebateRoomExport = {
  formatVersion: 1;
  exportedAt: string;
  appVersion: string;
  room: {
    topic: string;
    sessionCode: string;
    className?: string;
    memo?: string;
    status: "open" | "closed" | "archived" | "deleted";
    createdAt: string;
    updatedAt: string;
  };
  posts: Array<{
    studentName: string;
    stance: "agree" | "disagree" | "neutral";
    reason: string;
    createdAt: string;
  }>;
};
```

### 불러오기 정책

- 교사만 JSON을 불러올 수 있습니다.
- 불러온 JSON은 새 세션으로 복원합니다.
- 기존 세션 덮어쓰기는 1차 구현에서 제외합니다.
- 복원된 세션에는 새 `roomId`와 새 `sessionCode`를 부여합니다.
- 원본 생성일은 메타데이터로 보존하되, Firestore 문서 생성일은 복원 시각으로 기록합니다.

## 13. Firebase 데이터베이스 백업

Firebase 데이터베이스 백업은 개별 토론 JSON 저장보다 넓은 범위의 운영 백업 기능입니다.

### 1차 백업 범위

교사가 소유한 모든 토론 세션과 의견 데이터를 하나의 백업 파일로 저장합니다. 교사 대시보드에서 선택한 일부 세션만 백업할 수도 있습니다.

포함 데이터:

- `rooms` 중 `ownerUid`가 현재 교사인 문서
- 각 room의 `posts` 하위 컬렉션
- 백업 생성 시각
- 앱 버전
- Firestore 경로 정보
- 데이터 개수 요약
- 세션 상태와 보관/삭제 메타데이터

### 백업 저장 위치

백업은 두 곳에 저장합니다.

1. 사용자 기기로 JSON 다운로드
2. Firebase Storage의 교사별 경로에 업로드

```text
backups/{ownerUid}/{yyyyMMdd-HHmmss}-traffic-light-debate-backup.json
```

백업 메타데이터는 `backups/{backupId}` 문서에 저장합니다.

### 백업 파일 형식

```ts
type TeacherDatabaseBackup = {
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
```

### 백업 복원 정책

- 교사만 자신의 백업을 복원할 수 있습니다.
- 복원은 기존 데이터를 덮어쓰지 않고 새 세션들로 생성합니다.
- 원본 `roomId`, `postId`는 `source` 메타데이터로 보존합니다.
- 새 세션 코드는 복원 시 다시 생성합니다.
- 복원 전 미리보기 화면에서 room 수, post 수, 토론 주제 목록을 보여줍니다.
- 복원 후 생성된 room 목록을 교사 대시보드에 표시합니다.
- 복원된 세션은 기본적으로 `closed` 상태로 생성하고, 교사가 필요할 때 다시 열 수 있습니다.

### 운영형 확장안

2차 구현에서는 Firebase Cloud Functions와 Cloud Scheduler를 사용해 정기 백업을 추가할 수 있습니다.

- 매일 또는 매주 Firestore 전체 export를 Cloud Storage에 저장
- 관리자 권한 사용자만 전체 백업을 내려받기
- 백업 보존 기간 설정
- 복구 절차 문서화

1차 구현에서는 보안과 구현 범위를 고려해 교사 소유 데이터의 앱 수준 JSON 백업을 우선합니다.

## 14. 권한과 보안 규칙

### 기본 원칙

- 교사는 로그인해야 세션을 만들 수 있습니다.
- 학생은 로그인 없이 열린 세션에 의견을 제출할 수 있습니다.
- 학생은 기존 의견을 수정하거나 삭제할 수 없습니다.
- 교사는 자신이 만든 세션과 의견만 읽고 관리할 수 있습니다.
- 백업 파일은 해당 교사만 읽고 쓸 수 있습니다.

### Firestore Rules 방향

```text
users/{uid}
  - 본인만 읽기/쓰기

rooms/{roomId}
  - ownerUid 교사: 읽기/쓰기
  - 학생: status가 open인 room을 sessionCode 조회 목적으로 제한 읽기

rooms/{roomId}/posts/{postId}
  - ownerUid 교사: 읽기/쓰기
  - 학생: status가 open인 room에 create만 허용
  - 학생: update/delete 불가

backups/{backupId}
  - ownerUid 교사만 읽기/쓰기
```

학생이 세션 코드로 room을 찾는 과정은 보안 규칙과 쿼리 구조를 함께 설계해야 합니다. 필요하면 `publicRooms/{sessionCode}` 같은 별도 공개 인덱스 문서를 두어 학생 입장에 필요한 최소 정보만 노출합니다.

## 15. 오류 처리

- 세션 코드가 틀린 경우: "토론방을 찾을 수 없습니다."
- 닫힌 세션인 경우: "이 토론은 제출이 마감되었습니다."
- 이름이 비어 있는 경우: 제출 버튼 비활성화
- 근거가 비어 있는 경우: 제출 버튼 비활성화
- 네트워크 오류: 재시도 안내
- Firebase 권한 오류: 교사 로그인 또는 접근 권한 확인 안내
- JSON 형식 오류: 지원하지 않는 파일이라는 안내
- 백업 복원 오류: 복원 전 검증 단계에서 차단

## 16. 접근성

- 색상만으로 입장을 구분하지 않고 `찬성`, `반대`, `중립` 텍스트를 함께 표시합니다.
- 게이지 바에는 백분율 텍스트와 `aria-label`을 제공합니다.
- 새 의견 도착은 교사 화면의 `aria-live` 영역에 요약 안내합니다.
- 키보드만으로 입장 선택, 제출, 저장 버튼을 사용할 수 있게 합니다.
- 포스트잇 색상은 충분한 명도 대비를 확보합니다.
- QR 코드는 세션 코드 텍스트와 함께 제공합니다.

## 17. 테스트 계획

### 단위 테스트

- 찬성/반대/중립 통계 계산
- 백분율 반올림
- 세션 코드 생성 형식
- 세션 검색, 필터, 정렬
- 세션 상태 전환
- JSON export/import 변환
- Firebase 백업 파일 생성 로직
- 백업 복원 전 검증 로직

### 컴포넌트 테스트

- 학생 제출 폼 유효성 검사
- 입장 선택 버튼 상태
- 게이지 바 렌더링
- 포스트잇 목록 렌더링
- 교사 세션 목록 렌더링
- 다중 선택 작업 확인 모달
- 백업 미리보기 화면

### 브라우저 검증

1. 교사 Google 로그인
2. 토론 주제 입력 후 세션 생성
3. QR 코드와 세션 코드 표시 확인
4. 학생 화면에서 코드로 입장
5. 찬성/반대/중립 의견 제출
6. 교사 화면 실시간 포스트잇 반영 확인
7. 게이지 백분율 갱신 확인
8. PDF 저장 확인
9. JSON 저장 후 새 세션으로 복원 확인
10. 교사 대시보드에서 세션 검색, 필터, 정렬 확인
11. 세션 닫기, 다시 열기, 보관, 삭제 확인
12. 여러 세션 선택 후 백업 대상 지정 확인
13. Firebase 백업 생성, 다운로드, Storage 업로드 확인
14. 백업 파일 미리보기 후 새 세션들로 복원 확인

## 18. 구현 순서 제안

1. Vite + React + TypeScript 프로젝트 초기화
2. 테스트 환경과 기본 스모크 테스트 추가
3. Firebase 프로젝트 설정과 환경 변수 구성
4. Auth, Firestore, Storage 어댑터 작성
5. 공통 타입과 통계 계산 유틸 작성
6. 교사 로그인 및 대시보드 구현
7. 세션 생성 및 세션 코드 생성 구현
8. 교사 세션 목록, 검색, 필터, 정렬 구현
9. 세션 닫기, 다시 열기, 보관, 삭제, 복제 구현
10. 학생 입장 및 의견 제출 구현
11. 실시간 교사용 보드 구현
12. PDF 저장 구현
13. 개별 세션 JSON 저장/불러오기 구현
14. 교사 소유 Firebase 데이터베이스 백업 구현
15. 백업 복원 미리보기 및 복원 구현
16. 보안 규칙 초안 작성
17. 모바일/대형 화면 반응형 조정
18. 테스트, 빌드, 브라우저 검증

## 19. 남은 결정 사항

- 배포 위치를 Firebase Hosting으로 확정할지 여부
- Firebase 프로젝트를 새로 만들지, 기존 프로젝트를 사용할지 여부
- 학생 이름 중복을 허용할지 여부
- 학생이 한 세션에서 여러 번 제출할 수 있게 할지 여부
- 교사가 학생 의견을 삭제할 수 있게 할지 여부
- 삭제한 세션의 복구 기능을 1차에 넣을지 여부
- 일괄 PDF 저장을 하나의 통합 PDF로 만들지, 세션별 PDF 묶음으로 만들지 여부
- 백업 복원 시 원본 토론 주제 뒤에 `(복원됨)` 표시를 붙일지 여부

## 20. 추천 기본 정책

- 배포는 Firebase Hosting을 사용합니다.
- 학생 이름 중복은 허용합니다.
- 학생은 여러 번 제출할 수 있지만, 같은 브라우저에서는 최근 제출 완료 상태를 보여줍니다.
- 교사는 부적절한 의견을 삭제할 수 있습니다.
- 교사 대시보드의 기본 목록은 `open`, `closed` 세션만 보여주고, `archived`는 필터로 확인합니다.
- 세션 삭제는 Firestore 문서를 즉시 제거하지 않고 `deleted` 상태로 표시하는 소프트 삭제를 사용합니다.
- JSON/백업 복원은 기존 데이터를 덮어쓰지 않고 새 세션으로 복원합니다.
- 1차 버전은 교사 소유 데이터 백업까지 구현하고, 전체 Firestore 정기 백업은 2차 운영 기능으로 남깁니다.
