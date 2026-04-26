# 신호등 토론방: 내 생각 포스트잇

초등 5~6학년 국어·사회·도덕 토론 수업을 위한 실시간 디지털 토론 보드입니다.

## 실행

```bash
npm install
npm run dev
```

Firebase 환경 변수가 없으면 로컬 데모 저장소로 실행됩니다. 실제 Google 로그인과 Firestore를 쓰려면 `.env.example`을 참고해 `.env.local`을 만드세요. DB 백업 기록은 Spark 무료 요금제에서도 동작하도록 Firestore `backups` 컬렉션에 저장합니다.

## Firebase 설정

1. Firebase Console에서 프로젝트를 만들고 Web app을 추가합니다.
2. Authentication > Sign-in method에서 Google 제공업체를 사용 설정합니다.
3. Firestore Database를 생성합니다.
4. Web app config 값을 `.env.local`에 넣습니다.
5. Authentication 승인 도메인에 배포 도메인을 확인합니다. Firebase Hosting 기본 도메인인 `<project-id>.web.app`, `<project-id>.firebaseapp.com`은 보통 자동 등록됩니다.

```bash
cp .env.example .env.local
npx firebase-tools login
npx firebase-tools use --add
npm run deploy:firebase
```

Firebase Hosting은 `firebase.json`의 SPA rewrite를 사용하므로 `/teacher`, `/student`, `/join/세션코드` 주소를 직접 열어도 앱 화면으로 복원됩니다.

## GitHub Actions 배포

Firebase Hosting 자동 배포를 쓰려면 GitHub 저장소에 아래 값을 설정합니다.

- Repository Variables: `FIREBASE_PROJECT_ID`, `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`
- Repository Secret: `FIREBASE_SERVICE_ACCOUNT`

`FIREBASE_SERVICE_ACCOUNT`는 Firebase CLI의 `firebase init hosting:github` 또는 Firebase Console의 서비스 계정 키로 만들 수 있습니다. `main` 브랜치에 push하면 live 채널, PR에는 preview 채널로 배포됩니다.

## 주요 기능

- 교사 Google 로그인 및 데모 모드
- 토론 세션 생성
- 교사 다중 세션 검색, 필터, 정렬, 복제, 닫기, 다시 열기, 보관, 삭제
- 학생 세션 코드 및 QR 입장
- 찬성/반대/중립 의견 제출
- 실시간 게이지 바와 포스트잇 보드
- PDF 저장
- 개별 세션 JSON 저장/불러오기
- 교사 소유 세션 Firestore DB 백업 및 JSON 복원

## 검증

```bash
npm test -- --run
npm run build
```
