# DeliveryCut AI - 팀 문서

## 📁 폴더 구조

```
docs/
├── 공동문서/          # 모두가 함께 보는 문서
├── 종태/             # 종태 개인 작업 공간
├── 영진/             # 영진 개인 작업 공간
├── 세종/             # 세종 개인 작업 공간
└── 유경/             # 유경 개인 작업 공간
```

## 📌 필독 문서

1. **[프로젝트 개요](./공동문서/프로젝트-개요.md)** - 프로젝트 소개 및 목표
2. **[역할 분담 논의](./공동문서/역할-분담.md)** - 4명 역할 분담 옵션
3. **[개발 가이드](./공동문서/개발-가이드.md)** - 개발 환경 설정 및 시작 방법
4. **[Git 브랜치 전략](./공동문서/Git-브랜치-전략.md)** - 간단한 협업 규칙

## 🚀 빠른 시작

### 1. 저장소 클론
```bash
git clone https://github.com/whdxo/DeliveryCut.git
cd DeliveryCut
```

### 2. 패키지 설치
```bash
npm install
```

### 3. 환경변수 설정
```bash
cp .env.example .env.local
# .env.local 파일에 API 키 입력 (팀 채널에서 공유)
```

### 4. 개발 서버 실행
```bash
npm run dev
# http://localhost:3000 접속
```

## 👥 팀원

| 이름 | GitHub | 역할 (논의중) |
|------|--------|---------------|
| 종태 | [@whdxo](https://github.com/whdxo) | TBD |
| 영진 | TBD | TBD |
| 세종 | TBD | TBD |
| 유경 | TBD | TBD |

## 📞 소통 채널

- **일상 소통**: 카톡/슬랙/디스코드
- **코드 리뷰**: GitHub Pull Request
- **이슈 트래킹**: GitHub Issues
- **회의**: 오프라인/Zoom/Discord

## 📅 일정 (5일 MVP)

- **Day 1**: 환경 설정 + 역할 확정 + 기본 구조
- **Day 2-3**: 핵심 기능 개발
- **Day 4**: 통합 테스트 + 버그 수정
- **Day 5**: 배포 + 데모 준비

## 🔗 링크

- **GitHub**: https://github.com/whdxo/DeliveryCut
- **Vercel**: (배포 후 추가)
- **Figma**: (디자인 있으면 추가)
