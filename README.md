# DeliveryCut AI

> 배달 대신 10분 한 끼 - AI 기반 1인 가구 식단 플래너

냉장고 재료와 시간/도구 제약만 입력하면, AI가 배달 대체 메뉴 3개 + 레시피 + 3일 식단 플랜 + 최소 장보기 리스트를 즉시 생성해드립니다.

---

## 📚 프로젝트 문서

**팀원 모두가 보는 문서**: `docs/` 폴더

- [프로젝트 개요](docs/공동문서/프로젝트-개요.md) ⭐
- [역할 분담 논의](docs/공동문서/역할-분담.md) ⭐
- [개발 가이드](docs/공동문서/개발-가이드.md) ⭐
- [Git 브랜치 전략](docs/공동문서/Git-브랜치-전략.md) ⭐

**상세 문서** (로컬에만 있음): `claude/프로젝트문서/` 폴더
- Git에 올라가지 않으므로 각자 로컬에서 참고

---

## 🚀 빠른 시작

### 1. 패키지 설치

```bash
npm install
```

### 2. 환경변수 설정

`.env.example` 파일을 복사하여 `.env.local` 파일을 생성하고, 실제 API 키를 입력하세요.

```bash
cp .env.example .env.local
```

필요한 환경변수:
- **OPENAI_API_KEY**: [OpenAI Platform](https://platform.openai.com/)에서 발급
- **Firebase Config**: [Firebase Console](https://console.firebase.google.com/)에서 프로젝트 생성 후 설정

### 3. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 접속

---

## 🛠 기술 스택

- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui
- **AI**: OpenAI GPT-4.1-mini (Structured Outputs)
- **Database**: Firebase Firestore
- **Auth**: Firebase Auth (Google OAuth)
- **Deployment**: Vercel

---

## 📦 주요 명령어

```bash
npm run dev          # 개발 서버 실행
npm run build        # 프로덕션 빌드
npm run start        # 프로덕션 서버 실행
npm run lint         # ESLint 실행
npm run type-check   # TypeScript 타입 체크
```

---

## 📁 프로젝트 구조

```
deliverycut-ai/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   │   ├── generate/     # AI 메뉴 생성
│   │   ├── save/         # 결과 저장
│   │   └── history/      # 히스토리 조회
│   ├── result/           # 결과 화면
│   └── history/          # 히스토리 목록
├── components/            # React 컴포넌트
│   ├── forms/            # 입력 폼 컴포넌트
│   ├── results/          # 결과 표시 컴포넌트
│   ├── shared/           # 공통 컴포넌트
│   └── ui/               # shadcn/ui 컴포넌트
├── lib/                   # 유틸리티 및 로직
│   ├── ai/               # OpenAI 통합
│   ├── db/               # Firebase 통합
│   ├── utils/            # 유틸리티 함수
│   └── types/            # TypeScript 타입
└── public/                # 정적 파일
```

---

## 🎯 MVP 범위

### 필수 기능 (Must Have)

1. **입력 화면**
   - 시간 선택 (5/10/15분)
   - 도구 선택 (전자레인지/원팬/에어프라이어)
   - 냉장고 재료 입력
   - 알레르기/기피 재료 (선택)

2. **AI 생성**
   - 오늘의 배달 대체 메뉴 3개
   - 선택 메뉴 레시피 (3~5줄)
   - 3일 식단 플랜 (재료 돌려쓰기)
   - 최소 장보기 리스트

3. **결과 화면**
   - 메뉴 카드 3개 비교
   - 레시피 + 실패 방지 팁
   - 복사/저장 기능

### 제외 기능 (Won't Have in MVP)

- 사진 인식(OCR) 냉장고 스캔
- 영양/칼로리 정밀 분석
- 결제/커머스 연동
- 사용자 취향 학습

---

## 👥 팀원

| 이름 | GitHub | 역할 |
|------|--------|------|
| 종태 | [@whdxo](https://github.com/whdxo) | TBD |
| 영진 | TBD | TBD |
| 세종 | TBD | TBD |
| 유경 | TBD | TBD |

**역할 분담**: [docs/공동문서/역할-분담.md](docs/공동문서/역할-분담.md) 참고

---

## 📝 개발 가이드

자세한 개발 가이드는 다음 문서를 참고하세요:

- [개발환경 설정](claude/프로젝트문서/3.개발가이드/3.1-개발환경-설정.md)
- [컴포넌트 가이드](claude/프로젝트문서/3.개발가이드/3.2-컴포넌트-가이드.md)
- [코딩 컨벤션](claude/프로젝트문서/3.개발가이드/3.3-코딩-컨벤션.md)
- [배포 가이드](claude/프로젝트문서/3.개발가이드/3.4-배포-가이드.md)

---

## 🔐 보안

- 환경변수는 절대 Git에 커밋하지 마세요
- `.env.local` 파일은 `.gitignore`에 포함되어 있습니다
- OpenAI API 키와 Firebase 설정은 개인별로 관리하세요

---

## 📄 라이선스

Private Project

---

## 📞 문의

프로젝트 관련 문의는 팀 채널을 이용해주세요.
