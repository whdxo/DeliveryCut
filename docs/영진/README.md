# 영진 작업 공간

## 🔗 내 브랜치 정보

- **브랜치명**: `youngjin/#2`
- **이슈 번호**: #2

## 📝 작업 계획

### Git 작업 흐름

```bash
# 1. develop 최신 상태로 업데이트
git checkout develop
git pull origin develop

# 2. 내 브랜치로 이동
git checkout youngjin/#2

# 3. develop 변경사항 병합
git merge develop

# 4. 작업 후 커밋
git add .
git commit -m "feat: 작업 내용"
git push origin youngjin/#2

# 5. GitHub에서 PR 생성
# base: develop ← compare: youngjin/#2
```

### PR 생성 시

- **Base 브랜치**: `develop` (⚠️ main 아님!)
- **제목**: `[#2] 작업 내용`
- **본문**: 작업 내용, 체크리스트 포함
- **리뷰어**: 최소 1명 지정

---

## ✅ 완료한 작업

- [ ] 환경 설정
- [ ] 역할 확정

---

## 📌 메모

(자유롭게 작성)
