# Fullstack 1 인수인계 (입력 화면 + API)

## 1. 작업 범위 (완료)
- 입력 화면: `app/home/page.tsx`
- 생성 API: `POST /api/generate` (`app/api/generate/route.ts`)
- 공용 타입: `lib/types/api.ts`
- 공용 스키마/검증: `lib/ai/schema.ts`
- AI mock 생성기: `lib/ai/generateMenu.ts`

## 2. 확정 계약 (Single Source)
- 타입 기준: `lib/types/api.ts`
- 스키마 검증 기준: `lib/ai/schema.ts`

### GenerateInput
- `timeLimitMin`: `5 | 10 | 15`
- `tools`: `("microwave" | "pan" | "airfryer")[]` (최소 1개)
- `ingredientsText`: `string` (빈 문자열 불가)
- `dislikedIngredientsText?`: `string`

### GenerateOutput 핵심 제약
- `menuOptions`: 정확히 3개
- `threeDayPlan`: 정확히 3개
- `steps`: 3~5개
- 각 메뉴 `timeMin <= input.timeLimitMin`

### API 에러 포맷
```ts
interface ApiError {
  error: {
    code: string
    message: string
    details?: unknown
  }
}
```

## 3. API 스펙

### POST `/api/generate`
#### Request 예시
```json
{
  "timeLimitMin": 10,
  "tools": ["microwave", "pan"],
  "ingredientsText": "계란,김치,두부"
}
```

#### Success (200)
```json
{
  "resultId": "uuid",
  "output": {
    "menuOptions": ["...3개"],
    "threeDayPlan": ["...3개"],
    "shoppingList": []
  }
}
```

#### Error
- `400 INVALID_JSON`
- `400 INVALID_INPUT`
- `422 INVALID_AI_OUTPUT`
- `500 INTERNAL_ERROR`

## 4. 현재 프론트 동작
- 입력 페이지에서 `/api/generate` 호출 후 `resultId`를 받아 결과 페이지로 이동
- 현재 결과 이동 경로: `/result?resultId={id}`
- 현재 캐시 키: `deliverycut:result:{resultId}` (`sessionStorage`)
- 비로그인도 사용 가능, 단 홈에서 로그인 안내 모달 노출(강제 아님)

## 5. FS2 인계 포인트 (우선)
1. 결과 조회를 `GET /api/results/:resultId` 기준으로 연결
2. 결과 라우트를 `/result/[resultId]`로 전환 여부 확정
3. `app/result/page.tsx`의 MOCK fallback 제거 후 API 응답 기반 렌더
4. `loading / error / not-found` 상태 분기 구현
5. 복사 기능(레시피/장보기) 구현

## 6. 미완료 항목 (의도적)
- Firestore 저장/조회 완전 연동 (`generate` 저장 + `results` 조회)
- Auth 사용자 기준 히스토리 영속화 정책
- E2E 테스트 자동화

## 7. 빠른 확인 시나리오
1. `/home`에서 재료 입력
2. `배달컷 메뉴 만들기` 클릭
3. `/result?resultId=...` 이동 확인
4. 결과 카드/레시피/3일 플랜/장보기 렌더 확인
