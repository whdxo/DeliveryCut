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

### 🚀 FS2 목표: 결과 + 히스토리 + 인증/배포

#### 1. 결과 화면 (page.tsx) API 중심 개편
- [ ] Mock fallback 제거 (API 조회 실패 시 에러 처리)
- [ ] `GET /api/results/:resultId` 연동
- [ ] 로딩(Loading Skeleton) 및 에러(Error Boundary) 상태 구현
- [ ] 컴포넌트 분리: `ResultCard`, `RecipeList`, `PlanView`, `GroceryList`

#### 2. 히스토리 기능
- [ ] 로그인 사용자 기준 저장 목록 조회 구현
- [ ] 마이페이지 또는 사이드바에 히스토리 목록 렌더링

#### 3. 배포 및 운영 준비
- [ ] Vercel 환경변수 설정 (`FIREBASE_...`, `OPENAI_...`)
- [ ] Firestore 보안 규칙 점검
- [ ] CI/CD 파이프라인 확인

---

### 🤝 지금 당장 합의할 것 (3가지)

1. **결과 페이지 라우팅**
   - Query String: `/result?resultId=123` (현재 구현)
   - Dynamic Route: `/result/123` (SEO 유리, 깔끔함)
   - **결정 필요**

2. **저장 시점**
   - `POST /api/generate` 요청 시 자동 저장? (현재)
   - 별도 저장 버튼 클릭 시 저장?
   - **결정 필요**

3. **Firestore 스키마 확정**
   - `input`: { time, tools, ingredients }
   - `output`: { menus, recipes, plans }
   - `meta`: { createdAt, updatedAt, userId, version }
   - **결정 필요**

### 📦 기타
- [ ] `FS1-입력API-인수인계.md` 최신화 (인수인계 기준 유지)
