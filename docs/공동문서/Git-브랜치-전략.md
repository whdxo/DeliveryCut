# Git 브랜치 전략

## 🌿 브랜치 구조

```
main                    # 배포용 (Vercel 자동 배포)
  └── develop          # 개발 통합 브랜치
      ├── jongtae/#1   # 종태 작업 브랜치 (이슈 #1)
      ├── youngjin/#2  # 영진 작업 브랜치 (이슈 #2)
      ├── sejong/#3    # 세종 작업 브랜치 (이슈 #3)
      └── yukyung/#4   # 유경 작업 브랜치 (이슈 #4)
```

**핵심**:
- `main` - 배포용 (검증된 코드만)
- `develop` - 개발 통합 브랜치
- `이름/#이슈번호` - 각자 작업 브랜치

---

## 🚀 작업 흐름

### 1. 작업 시작할 때

```bash
# 1. develop 브랜치로 이동
git checkout develop

# 2. 최신 상태로 업데이트
git pull origin develop

# 3. 본인 브랜치로 이동
# 종태
git checkout jongtae/#1

# 영진
git checkout youngjin/#2

# 세종
git checkout sejong/#3

# 유경
git checkout yukyung/#4

# 4. develop의 최신 변경사항 가져오기
git merge develop
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
git push origin 본인브랜치명
# 예: git push origin jongtae/#1
```

---

### 3. 작업 완료 후 (Pull Request)

#### GitHub에서:
1. `https://github.com/whdxo/DeliveryCut` 접속
2. "Pull requests" 탭 클릭
3. "New pull request" 버튼
4. **중요**: `base: develop` ← `compare: 본인브랜치` 선택
   - ❌ main으로 하지 말기!
   - ✅ develop으로 해야 함!
5. 제목 형식: `[#이슈번호] 작업 내용`
   - 예: `[#1] 입력 화면 TimeSelector 구현`
6. 설명 작성:
   ```markdown
   ## 작업 내용
   - TimeSelector 컴포넌트 구현
   - 시간대 선택 UI 완성

   ## 확인 사항
   - [ ] 코드 리뷰 완료
   - [ ] 테스트 완료

   Closes #1
   ```
7. "Create pull request" 클릭

#### 팀원에게:
- 카톡/슬랙에 "PR 올렸어요! 리뷰 부탁드려요 🙏" 메시지
- 링크 공유

---

### 4. 코드 리뷰 받기

- 팀원이 코드 확인
- 수정 요청 있으면:
  ```bash
  # 본인 브랜치에서 수정
  git add .
  git commit -m "fix: Apply review feedback"
  git push origin 본인브랜치명
  # PR이 자동으로 업데이트됨
  ```
- 승인 받으면 → **본인이 "Merge pull request" 버튼 클릭**
- Merge 후 → "Delete branch" 버튼 클릭 (GitHub에서 브랜치 삭제)

**중요**: 최소 1명 이상 리뷰 후 Merge!

---

### 5. Merge 후 정리

```bash
# develop 브랜치로 이동
git checkout develop

# 최신 상태로 업데이트 (다른 사람들의 작업 포함)
git pull origin develop

# 본인 브랜치로 다시 이동
git checkout 본인브랜치명

# develop의 최신 내용 병합
git merge develop

# 로컬 브랜치 정리는 하지 않음 (계속 사용)
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
git branch -a           # 모든 브랜치 보기 (원격 포함)
```

### 브랜치 이동
```bash
git checkout develop            # develop으로 이동
git checkout jongtae/#1         # 종태 브랜치로 이동
git checkout youngjin/#2        # 영진 브랜치로 이동
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

### develop의 최신 변경사항 가져오기
```bash
# 본인 브랜치에서 실행
git checkout 본인브랜치명
git merge develop

# 충돌 발생하면 해결 후
git add .
git commit -m "merge: Merge develop into 본인브랜치명"
git push origin 본인브랜치명
```

---

## ⚠️ 주의사항

### 1. PR은 항상 develop으로!
```bash
# ❌ main으로 PR 하지 말기
base: main ← compare: jongtae/#1

# ✅ develop으로 PR 해야 함
base: develop ← compare: jongtae/#1
```

### 2. 작업 시작 전 항상 최신 상태로!
```bash
git checkout develop
git pull origin develop
git checkout 본인브랜치명
git merge develop
```

### 3. 본인 브랜치는 삭제하지 않기
- GitHub에서 Merge 후 브랜치 삭제 → **OK** (원격 브랜치만 삭제)
- 로컬 브랜치는 계속 사용 → **삭제 안 함**

### 4. 큰 파일 커밋 금지
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
git pull origin 본인브랜치명
# 충돌 있으면 해결 후
git push origin 본인브랜치명
```

### 상황 2: develop과 충돌 발생
```bash
# develop 병합 시 충돌
git checkout 본인브랜치명
git merge develop
# CONFLICT 메시지 발생

# 1. VSCode에서 충돌 파일 열기
# 2. <<<<<<, ======, >>>>>> 표시 확인
# 3. 필요한 코드만 남기고 삭제
# 4. 저장 후
git add .
git commit -m "merge: Resolve conflict with develop"
git push origin 본인브랜치명
```

### 상황 3: 실수로 develop에 commit함
```bash
# 1. 본인 브랜치로 체리픽
git checkout 본인브랜치명
git cherry-pick 커밋해시

# 2. develop 되돌리기
git checkout develop
git reset --hard origin/develop

# 3. 본인 브랜치에서 작업 계속
git checkout 본인브랜치명
```

### 상황 4: 잘못된 브랜치에서 작업함
```bash
# 아직 commit 안 한 경우
git stash                       # 변경사항 임시 저장
git checkout 올바른브랜치명
git stash pop                   # 변경사항 복원

# 이미 commit 한 경우
git checkout 올바른브랜치명
git cherry-pick 커밋해시        # 커밋 복사
```

---

## 👥 팀원별 브랜치 정보

| 이름 | 브랜치명 | 이슈 번호 |
|------|---------|----------|
| 종태 | `jongtae/#1` | #1 |
| 영진 | `youngjin/#2` | #2 |
| 세종 | `sejong/#3` | #3 |
| 유경 | `yukyung/#4` | #4 |

---

## 📖 Git 기초 학습

### 추천 자료
- [Git 간편 안내서](https://rogerdudler.github.io/git-guide/index.ko.html)
- [누구나 쉽게 이해할 수 있는 Git 입문](https://backlog.com/git-tutorial/kr/)

### 30분 안에 배우기
1. `git clone` - 저장소 복사
2. `git checkout` - 브랜치 이동
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
