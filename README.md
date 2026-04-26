# 신호등 토론방: 내 생각 포스트잇

초등 5~6학년 국어·사회·도덕 토론 수업을 위한 실시간 디지털 토론 보드입니다.

## 실행

```bash
npm install
npm run dev
```

Firebase 환경 변수가 없으면 로컬 데모 저장소로 실행됩니다. 실제 Firebase를 쓰려면 `.env.example`을 참고해 `.env.local`을 만드세요.

## 주요 기능

- 교사 Google 로그인 또는 데모 모드
- 토론 세션 생성
- 교사 다중 세션 검색, 필터, 정렬, 복제, 닫기, 다시 열기, 보관, 삭제
- 학생 세션 코드 및 QR 입장
- 찬성/반대/중립 의견 제출
- 실시간 게이지 바와 포스트잇 보드
- PDF 저장
- 개별 세션 JSON 저장/불러오기
- 교사 소유 세션 Firebase 백업 및 복원

## 검증

```bash
npm test -- --run
npm run build
```
