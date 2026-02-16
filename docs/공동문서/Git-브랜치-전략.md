# Git 브랜치 전략 (간단 버전)

## 🌿 브랜치 구조 (간단하게!)

```
main                    # 배포용 (Vercel 자동 배포)
  └── feature/*        # 각자 작업 브랜치
```

**핵심**: `main` 브랜치 1개만 사용, 각자 `feature/기능명` 브랜치에서 작업

---

## 🚀 작업 흐름

### 1. 새 기능 시작할 때

```bash
# 1. main 최신 상태로 업데이트
git checkout main
git pull origin main

# 2. 새 브랜치 생성
git checkout -b feature/내가-만들-기능

# 예시:
# git checkout -b feature/input-form        (입력 화면)
# git checkout -b feature/menu-card         (메뉴 카드)
# git checkout -b feature/api-generate      (API)
# git checkout -b feature/ai-prompt         (AI 프롬프트)
```

---

### 2. 작업 중

```bash
# 파일 수정 후 저장

# 변경사항 확인
git status

# 스테이징 (변경된 파일 선택)
git add .

# 커밋 (의미있는 메시지로!)
git commit -m "feat: Add TimeSelector component"

# GitHub에 푸시
git push origin feature/내가-만들-기능
```

---

### 3. 작업 완료 후 (Pull Request)

#### GitHub에서:
1. `https://github.com/whdxo/DeliveryCut` 접속
2. "Pull requests" 탭 클릭
3. "New pull request" 버튼
4. `base: main` ← `compare: feature/내브랜치` 선택
5. 제목/설명 작성
6. "Create pull request" 클릭

#### 팀원에게:
- 카톡/슬랙에 "PR 올렸어요! 리뷰 부탁드려요 🙏" 메시지
- 링크 공유

---

### 4. 코드 리뷰 받기

- 팀원이 코드 확인
- 수정 요청 있으면 → 수정 후 다시 푸시
- 승인 받으면 → "Merge pull request" 버튼 클릭

**중요**: 최소 1명 이상 리뷰 후 Merge!

---

### 5. Merge 후 정리

```bash
# main 브랜치로 이동
git checkout main

# 최신 상태로 업데이트
git pull origin main

# 완료된 브랜치 삭제 (선택)
git branch -d feature/완료한-기능
```

---

## 📝 커밋 메시지 규칙

### 형식
```
타입: 간단한 설명

예시:
feat: Add TimeSelector component
fix: Fix API validation error
docs: Update README
```

### 타입
- `feat`: 새 기능 추가
- `fix`: 버그 수정
- `docs`: 문서 수정
- `style`: 코드 포맷팅 (동작 변경 없음)
- `refactor`: 리팩토링
- `test`: 테스트 추가

### 좋은 예시
```bash
✅ git commit -m "feat: Add menu card component"
✅ git commit -m "fix: Fix time validation in input form"
✅ git commit -m "docs: Update installation guide"
```

### 나쁜 예시
```bash
❌ git commit -m "update"
❌ git commit -m "asdf"
❌ git commit -m "고쳤음"
```

---

## 🔄 자주 쓰는 Git 명령어

### 현재 상태 확인
```bash
git status              # 변경된 파일 보기
git log --oneline       # 최근 커밋 보기
git branch              # 현재 브랜치 확인
```

### 브랜치 이동
```bash
git checkout main                    # main으로 이동
git checkout feature/my-feature      # 내 브랜치로 이동
```

### 변경사항 되돌리기
```bash
# 아직 commit 안한 변경사항 취소 (주의!)
git checkout -- 파일명

# 마지막 commit 취소 (commit은 유지, 변경사항만 unstage)
git reset HEAD~1

# 특정 파일만 unstage
git reset HEAD 파일명
```

### 다른 브랜치 변경사항 가져오기
```bash
# main의 최신 변경사항을 내 브랜치로 가져오기
git checkout feature/my-feature
git merge main
```

---

## ⚠️ 주의사항

### 1. main 브랜치에 직접 푸시 금지!
```bash
# ❌ 하지 마세요
git checkout main
git commit -m "..."
git push origin main

# ✅ 이렇게 하세요
git checkout -b feature/my-feature
git commit -m "..."
git push origin feature/my-feature
# → 그 다음 Pull Request
```

### 2. 작업 시작 전 항상 최신 상태로!
```bash
git checkout main
git pull origin main
git checkout -b feature/new-feature
```

### 3. 큰 파일 커밋 금지
- `.env.local` (환경변수) ❌
- `node_modules/` (패키지) ❌
- `.DS_Store` (맥 시스템 파일) ❌

→ 이미 `.gitignore`에 설정되어 있어서 자동으로 제외됨

---

## 🆘 문제 상황 해결

### 상황 1: Push가 거부됨
```bash
# 에러: ! [rejected] ... (non-fast-forward)

# 해결: 최신 변경사항 먼저 가져오기
git pull origin feature/my-feature
# 충돌 있으면 해결 후
git push origin feature/my-feature
```

### 상황 2: 브랜치 이름 잘못 만듦
```bash
# 브랜치 이름 변경
git branch -m 잘못된이름 올바른이름
```

### 상황 3: 실수로 main에 commit함
```bash
# 1. 새 브랜치 생성 (commit 유지)
git checkout -b feature/accidentally-committed

# 2. main으로 돌아가기
git checkout main

# 3. main을 이전 상태로 되돌리기
git reset --hard origin/main

# 4. 새 브랜치에서 작업 계속
git checkout feature/accidentally-committed
```

---

## 📖 Git 기초 학습

### 추천 자료
- [Git 간편 안내서](https://rogerdudler.github.io/git-guide/index.ko.html)
- [누구나 쉽게 이해할 수 있는 Git 입문](https://backlog.com/git-tutorial/kr/)

### 30분 안에 배우기
1. `git clone` - 저장소 복사
2. `git checkout -b` - 브랜치 생성
3. `git add` - 스테이징
4. `git commit` - 커밋
5. `git push` - GitHub에 올리기
6. Pull Request - 코드 리뷰 및 Merge

---

## 💬 막히면?

1. Google: "git [하고싶은것] 방법"
2. 팀원에게 물어보기
3. GitHub에서 이전 PR 참고

**중요**: Git은 하다 보면 자연스럽게 익숙해집니다! 처음엔 어려워도 괜찮아요 👍
