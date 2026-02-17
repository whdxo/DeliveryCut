# 📚 DeliveryCut 팀 문서

## 🚀 빠른 시작 (처음 시작하는 팀원)

### 1단계: 프로젝트 받기
```bash
# 저장소 클론
git clone https://github.com/whdxo/DeliveryCut.git
cd DeliveryCut

# 본인 브랜치로 이동
git checkout 본인브랜치명
# 종태: git checkout jongtae/#1
# 영진: git checkout youngjin/#2
# 세종: git checkout sejong/#3
# 유경: git checkout yukyung/#4
```

### 2단계: 환경 설정
```bash
# 패키지 설치
npm install

# 환경변수 파일 생성
cp .env.example .env.local
```

### 3단계: 문서 읽기 (순서대로!)
1. **[공동문서/프로젝트-개요.md](공동문서/프로젝트-개요.md)** - 무엇을 만드는지
2. **[공동문서/역할-분담.md](공동문서/역할-분담.md)** - 내 역할 확인
3. **[공동문서/개발-가이드.md](공동문서/개발-가이드.md)** - 개발 환경 사용법
4. **[공동문서/Git-브랜치-전략.md](공동문서/Git-브랜치-전략.md)** - Git 사용법

### 4단계: 개발 서버 실행
```bash
npm run dev
```
→ http://localhost:3000 접속 확인

---

## 📂 문서 구조

```
docs/
├── README.md (← 지금 보고 있는 파일)
│
├── 공동문서/ (모두가 읽어야 할 문서)
│   ├── 프로젝트-개요.md           ⭐ 꼭 읽기!
│   ├── 역할-분담.md              ⭐ 꼭 읽기!
│   ├── 개발-가이드.md             ⭐ 꼭 읽기!
│   ├── Git-브랜치-전략.md         ⭐ 꼭 읽기!
│   └── Firebase-설정-가이드.md    (필요시)
│
└── 개인 폴더/ (각자 작업 공간)
    ├── 종태/README.md
    ├── 영진/README.md
    ├── 세종/README.md
    └── 유경/README.md
```

---

## 🎯 내가 읽어야 할 문서는?

### 모두 공통
- ✅ [프로젝트-개요.md](공동문서/프로젝트-개요.md)
- ✅ [역할-분담.md](공동문서/역할-분담.md)
- ✅ [개발-가이드.md](공동문서/개발-가이드.md)
- ✅ [Git-브랜치-전략.md](공동문서/Git-브랜치-전략.md)

### 역할별 추가 문서
- **Fullstack 1, 2**: [Firebase-설정-가이드.md](공동문서/Firebase-설정-가이드.md)
- **AI 담당**: OpenAI API 설정 (개발-가이드.md 참고)
- **Designer**: shadcn/ui 사용법 (개발-가이드.md 참고)

---

## ✅ 작업 시작 전 체크리스트

- [ ] Git clone 완료
- [ ] 본인 브랜치로 체크아웃
- [ ] `npm install` 완료
- [ ] `.env.local` 파일 생성
- [ ] `npm run dev` 실행 확인
- [ ] 공동문서 4개 읽기 완료
- [ ] 본인 역할 확인

**모두 체크했으면 작업 시작!** 🚀

---

## 💬 질문이 있다면?

1. 이 문서들 먼저 확인
2. 팀 채팅방에 질문
3. 함께 해결!

**처음이라 어려워도 괜찮아요. 천천히 하나씩!** 👍
