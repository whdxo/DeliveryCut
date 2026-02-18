# AI 사용자 흐름 (현재 코드 기준)

> AI가 실제로 어떻게 끼어드는지, 사용자 관점 + 코드 흐름으로 정리

---

## 전체 흐름 한눈에

```
사용자 입력
    ↓
홈 화면 (/home)
    ↓  모드 선택
    ├── "즉시 한끼" → /quick
    └── "플랜 생성기" → /planner

/quick 입력 (재료 + 시간 + 도구)
    ↓  "배달컷 메뉴 추천받기" 버튼 클릭
    ↓
POST /api/generate
    ↓  입력 검증
    ↓
generateMenu()  ← OpenAI gpt-4o-mini (✅ 연동 완료)
    ↓  출력 검증
    ↓
Firebase 저장 + resultId 발급
    ↓
sessionStorage 캐시 저장
    ↓
결과 화면 (/result?resultId=xxx)
    ↓
메뉴 3개 카드 / 레시피 / 장보기 / 3일 플랜
```

---

## 1단계 — 사용자 입력 (/quick)

**페이지**: `app/quick/page.tsx`

사용자가 선택/입력하는 것:

| 항목 | UI | 값 |
|------|----|----|
| 요리 시간 | 버튼 3개 중 1개 선택 | `5분` / `10분` / `15분` |
| 조리 도구 | 버튼 멀티 선택 | `전자레인지` / `팬` / `에어프라이어` |
| 냉장고 재료 | 텍스트 입력 + 태그 버튼 | `"계란, 김치, 두부, 양파"` |
| 기피 재료 | 텍스트 입력 | `"고수, 땅콩"` (선택) |

버튼 클릭 시 만들어지는 API 페이로드:

```typescript
// app/quick/page.tsx — handleSubmit()

const TOOL_MAP: Record<string, Tool> = {
  전자레인지: "microwave",
  팬: "pan",
  에어프라이어: "airfryer",
}
const TIME_MAP = { "5분": 5, "10분": 10, "15분": 15 }

const payload: GenerateInput = {
  timeLimitMin: TIME_MAP[selectedTime] ?? 10,   // "10분" → 10
  tools: selectedTools.map(t => TOOL_MAP[t]),   // "팬" → "pan"
  ingredientsText: "계란, 김치, 두부, 양파",
  dislikedIngredientsText: "고수",              // 입력 시에만 포함
}
```

---

## 2단계 — API 호출

**엔드포인트**: `POST /api/generate`
**파일**: `app/api/generate/route.ts`

```
/quick 버튼 클릭
  → isSubmitting = true (버튼 "AI 메뉴 생성 중..." 로딩 표시)
  → fetch("/api/generate", { method: "POST", body: JSON.stringify(payload) })
  → 응답 대기 (AI 처리 시간: 약 2~5초)
```

API 내부에서 일어나는 일:

```
1. JSON 파싱
2. validateGenerateInput() — 입력값 유효성 검사
     timeLimitMin이 5/10/15 중 하나인가
     tools 배열이 비어있지 않은가
     ingredientsText가 빈 값이 아닌가
3. generateMenu(input)  ← OpenAI API 호출 (✅ 연동 완료)
4. validateGenerateOutput() — AI 결과 유효성 검사
     menuOptions 정확히 3개인가
     각 메뉴 timeMin ≤ timeLimitMin인가
     steps 3~5개인가
5. Firebase에 결과 저장 (menuPlans/{resultId})
6. { resultId, output } 반환
```

---

## 3단계 — AI 처리 (핵심)

**파일**: `lib/ai/generateMenu.ts` + `lib/ai/prompts.ts`

```typescript
// lib/ai/generateMenu.ts — OpenAI gpt-4o-mini Structured Outputs

const response = await client.chat.completions.create({
  model: "gpt-4o-mini",
  messages: [
    { role: "system", content: SYSTEM_PROMPT },   // 현생 요리 플래너 역할
    { role: "system", content: RULES_PROMPT },    // 시간/도구/기피재료 제약
    { role: "user", content: buildUserPrompt(input) },
    // 예: "10분, 팬, 재료: 계란 김치 두부 양파로 메뉴 3개 추천해줘"
  ],
  response_format: {
    type: "json_schema",
    json_schema: { name: "menu_generation", strict: true, schema: strictSchema },
  },
  temperature: 0.7,
  max_tokens: 2500,
})
```

AI가 만들어 내는 것:

```json
{
  "menuOptions": [
    {
      "optionId": "option-1",
      "title": "원팬 김치두부 덮밥",
      "timeMin": 10,
      "tools": ["pan"],
      "ingredients": ["김치", "두부", "양파", "햇반", "간장"],
      "steps": [
        "양파를 굵게 썰어 팬에 볶는다",
        "김치와 두부를 넣고 2분 더 볶는다",
        "간장으로 간 후 밥 위에 올린다"
      ],
      "tip": "두부는 마지막에 넣어야 부서지지 않음",
      "difficulty": "easy",
      "kcal": 400
    },
    { "optionId": "option-2", "...": "..." },
    { "optionId": "option-3", "...": "..." }
  ],
  "threeDayPlan": [
    { "day": 1, "breakfast": "계란 토스트", "lunch": "김치볶음밥", "dinner": "두부 덮밥" },
    { "day": 2, "breakfast": "스크램블 에그", "lunch": "양파 볶음", "dinner": "원팬 찌개" },
    { "day": 3, "breakfast": "햇반 계란국", "lunch": "비빔 한그릇", "dinner": "재료 털이" }
  ],
  "shoppingList": [
    { "item": "대파", "quantity": 1, "unit": "단", "reason": "향 보강" }
  ]
}
```

---

## 4단계 — 결과 캐시 + 화면 이동

**파일**: `app/quick/page.tsx` — handleSubmit()

```typescript
// API 응답 받은 후
const cached: ResultResponse = {
  resultId: data.resultId,      // Firebase 문서 ID
  input: payload,               // 원본 입력
  output: data.output,          // AI 결과
  createdAt: new Date().toISOString(),
}

// sessionStorage에 임시 저장 (빠른 결과 화면 렌더링용)
sessionStorage.setItem(`deliverycut:result:${data.resultId}`, JSON.stringify(cached))

// 결과 페이지로 이동
router.push(`/result?resultId=${data.resultId}`)
```

---

## 5단계 — 결과 화면 표시

**페이지**: `app/result/page.tsx`

```
URL: /result?resultId=abc123

1. useSearchParams()로 resultId 읽기
2. sessionStorage에서 캐시 확인
   → 있으면 바로 렌더링 (빠름, API 호출 없음)
   → 없으면 GET /api/results/abc123 으로 Firebase 조회
      (StoredMenuPlan → ResultResponse 변환)

3. 메뉴 선택 카드 3개 표시
   → 클릭하면 selectedIndex 변경 → 레시피 내용 전환

4. 레시피 상세 (재료 목록 + 조리 순서 + 팁)

5. 액션 버튼
   → 레시피 더보기: 만개의레시피 검색 (메뉴명 동적)
   → 유튜브 영상: 유튜브 검색 (메뉴명 동적)

6. 간단 장보기 목록 (AI 생성 shoppingList)
   → 쿠팡 검색 링크

7. 3일 식단 플랜 (AI 생성 threeDayPlan)
```

화면에 표시되는 AI 결과:

```
📋 메뉴 선택 (3개 카드)
  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
  │ 원팬 김치두부   │  │  전자레인지     │  │  계란 스크램블  │
  │ 덮밥            │  │  두부계란찜     │  │  볶음밥         │
  │ 10분 · 팬       │  │  10분 · 전자레인│  │  10분 · 팬      │
  └─────────────────┘  └─────────────────┘  └─────────────────┘

🍳 레시피 (선택한 메뉴)
  재료: 김치, 두부, 양파, 햇반, 간장
  1. 양파를 굵게 썰어 팬에 볶는다
  2. 김치와 두부를 넣고 2분 더 볶는다
  3. 간장으로 간 후 밥 위에 올린다
  💡 두부는 마지막에 넣어야 부서지지 않음

🛒 장보기 목록
  대파 1단 (향 보강)

📅 3일 플랜
  1일: 계란토스트 / 김치볶음밥 / 두부덮밥
  2일: 스크램블에그 / 양파볶음 / 원팬찌개
  3일: 햇반계란국 / 비빔한그릇 / 재료털이
```

---

## 에러 처리 흐름

```
입력 오류 (재료 미입력)
  → 버튼 비활성화 (disabled)
  → "재료를 먼저 입력해주세요" 버튼 텍스트 표시

API 오류 (400/422/500)
  → isSubmitting = false
  → /quick 화면에 에러 메시지 표시
  → "메뉴 생성 중 오류가 발생했습니다. 다시 시도해주세요."

네트워크 오류
  → catch 블록에서 에러 메시지 표시
  → "네트워크 오류가 발생했습니다. 다시 시도해주세요."

결과 페이지 로드 실패
  → sessionStorage 없음 + Firebase 404
  → "결과를 불러오지 못했습니다." + "다시 시도하기" 버튼
```

---

## 플랜 생성기 흐름 (/planner)

```
현재 상태: API 연동 없음, 로컬 Mock 데이터만 표시

/planner 입력 (기간, 끼니, 예산, 기피재료)
  ↓ "플랜 생성하기" 버튼
setGenerated(true)  ← API 호출 없이 로컬 PLAN_BASE[] 표시
```

> 플랜 생성 AI 연동은 추후 별도 작업 예정.

---

## 구현 상태 요약

| 항목 | 상태 |
|------|------|
| `generateMenu()` Mock → OpenAI | ✅ 완료 |
| `/quick` → API 호출 | ✅ 완료 |
| `/result` → AI 데이터 표시 | ✅ 완료 |
| Firebase 저장 (undefined 필드 수정) | ✅ 완료 |
| `/planner` AI 연동 | ⏳ 추후 |

---

## 주요 파일 위치 요약

```
사용자 입력 수집    → app/quick/page.tsx (handleSubmit)
API 진입점         → app/api/generate/route.ts
입력 검증          → lib/ai/schema.ts (validateGenerateInput)
AI 호출            → lib/ai/generateMenu.ts  ✅ OpenAI 연동 완료
프롬프트           → lib/ai/prompts.ts  ✅ 신규 생성
출력 검증          → lib/ai/schema.ts (validateGenerateOutput)
Firebase 저장      → lib/firebase/results.ts (saveResult)
결과 표시          → app/result/page.tsx  ✅ AI 데이터 연동
공통 타입          → lib/types/api.ts
```

---

**마지막 업데이트**: 2026-02-18
