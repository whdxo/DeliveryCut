# AI 사용자 흐름 (현재 코드 기준)

> AI가 실제로 어떻게 끼어드는지, 사용자 관점 + 코드 흐름으로 정리

---

## 전체 흐름 한눈에

```
사용자 입력
    ↓
홈 화면 (/home)
    ↓  "배달컷 메뉴 만들기" 버튼 클릭
    ↓
POST /api/generate
    ↓  입력 검증
    ↓
generateMenu()  ← 여기만 Mock → OpenAI 교체
    ↓  출력 검증
    ↓
Firebase 저장 + resultId 발급
    ↓
결과 화면 (/result?resultId=xxx)
    ↓
메뉴 3개 카드 / 레시피 / 3일 플랜 / 장보기 목록
```

---

## 1단계 — 사용자 입력 (홈 화면)

**페이지**: `app/home/page.tsx`

사용자가 선택/입력하는 것:

| 항목 | UI | 값 |
|------|----|----|
| 요리 시간 | 버튼 3개 중 1개 선택 | `5분` / `10분` / `15분` |
| 조리 도구 | 버튼 멀티 선택 | `전자레인지` / `팬` / `에어프라이어` |
| 냉장고 재료 | 텍스트 입력 + 태그 버튼 | `"계란, 김치, 두부, 양파"` |

버튼 클릭 시 만들어지는 API 페이로드:

```typescript
// app/home/page.tsx — handleSubmit()
const payload: GenerateInput = {
  timeLimitMin: 10,                          // "10분" → 숫자 변환
  tools: ["microwave", "pan"],               // 한국어 → 영어 변환
  ingredientsText: "계란, 김치, 두부, 양파", // 그대로 전달
  // dislikedIngredientsText: 현재 UI 미구현 (홈 화면에 입력 없음)
}
```

---

## 2단계 — API 호출

**엔드포인트**: `POST /api/generate`
**파일**: `app/api/generate/route.ts`

```
홈 화면
  → fetch("/api/generate", { method: "POST", body: payload })
  → 로딩 상태 표시 (isSubmitting = true, 버튼 비활성화)
  → 응답 대기 (AI 처리 시간: 약 2~5초)
```

API 내부에서 일어나는 일:

```
1. JSON 파싱
2. validateGenerateInput() — 입력값 유효성 검사
     timeLimitMin이 5/10/15 중 하나인가
     tools 배열이 비어있지 않은가
     ingredientsText가 빈 값이 아닌가
3. generateMenu(input)  ← AI 호출 (현재 Mock, 교체 예정)
4. validateGenerateOutput() — AI 결과 유효성 검사
     menuOptions 정확히 3개인가
     각 메뉴 timeMin ≤ timeLimitMin인가
     steps 3~5개인가
5. Firebase에 결과 저장
6. resultId + output 반환
```

---

## 3단계 — AI 처리 (핵심)

**파일**: `lib/ai/generateMenu.ts`

현재 (Mock):
```typescript
// 입력을 받아 하드코딩된 가짜 데이터 반환
return {
  menuOptions: [ "계란 볶음밥", "김치 덮밥", "두부 한그릇" ],
  threeDayPlan: [ ... ],
  shoppingList: [ ... ],
}
```

교체 후 (OpenAI):
```typescript
// 입력을 받아 실제 AI가 생성한 데이터 반환
const response = await openai.chat.completions.create({
  model: "gpt-4o-mini",
  messages: [
    { role: "system", content: "현생 요리 플래너 역할 + 출력 규칙" },
    { role: "system", content: "시간/도구/기피재료 제약 규칙" },
    { role: "user", content: buildUserPrompt(input) },
    // 예: "10분, 팬+전자레인지, 재료: 계란 김치 두부 양파로 메뉴 3개 추천해줘"
  ],
  response_format: { type: "json_schema", json_schema: ... },
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
      "difficulty": "easy"
    },
    { ... },  // option-2
    { ... }   // option-3
  ],
  "threeDayPlan": [
    { "day": 1, "breakfast": "계란 토스트", "lunch": "김치볶음밥", "dinner": "두부 덮밥" },
    { "day": 2, "breakfast": "스크램블 에그", "lunch": "양파 볶음", "dinner": "원팬 찌개" },
    { "day": 3, "breakfast": "햇반 계란국", "lunch": "비빔 한그릇", "dinner": "재료 털이" }
  ],
  "shoppingList": [
    { "item": "대파", "quantity": 1, "unit": "단", "reason": "3일 플랜 향 보강" },
    { "item": "참기름", "quantity": 1, "unit": "병" }
  ],
  "ingredientsUsed": { "계란": 1, "김치": 1, "두부": 1, "양파": 1 }
}
```

---

## 4단계 — 결과 캐시 + 화면 이동

**파일**: `app/home/page.tsx` — handleSubmit()

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

1. sessionStorage에서 캐시 확인
   → 있으면 바로 렌더링 (빠름)
   → 없으면 /api/results/abc123 으로 Firebase 조회

2. 메뉴 선택 카드 3개 표시
   → 클릭하면 해당 메뉴의 레시피로 전환

3. 레시피 탭 / 3일 플랜 탭
   → 탭 전환으로 내용 변경

4. 장보기 목록 사이드바
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

📅 3일 플랜 (탭 전환)
  1일: 계란토스트 / 김치볶음밥 / 두부덮밥
  2일: 스크램블에그 / 양파볶음 / 원팬찌개
  3일: 햇반계란국 / 비빔한그릇 / 재료털이

🛒 장보기 목록
  대파 1단 (향 보강)
  참기름 1병
```

---

## 에러 처리 흐름

```
입력 오류 (재료 미입력)
  → 버튼 비활성화 (disabled)
  → 홈 화면에서 막힘

API 오류 (400/422/500)
  → 홈 화면에 에러 메시지 표시
  → 예: "메뉴 생성 중 오류가 발생했습니다."

AI 스키마 위반 (422 INVALID_AI_OUTPUT)
  → API가 validateGenerateOutput() 실패 반환
  → 현재: 에러 표시 (재시도 로직 미구현)
  → TODO: 자동 1회 재시도 추가 예정
```

---

## AI 교체 전후 비교

| | Mock (현재) | OpenAI (교체 후) |
|--|------------|-----------------|
| 메뉴 | 항상 같은 "볶음밥/덮밥/한그릇" | 재료에 맞는 실제 메뉴 |
| 재료 | 입력 그대로 나열 | 실제 조합 및 분량 |
| 레시피 | 3줄 고정 텍스트 | 실제 조리 순서 3~5줄 |
| 3일 플랜 | 고정 값 | 입력 재료 소진 전략 반영 |
| 장보기 | 대파/간장 고정 | 부족한 것만 |
| 응답 시간 | 즉시 | 2~5초 |

---

## 주요 파일 위치 요약

```
사용자 입력 수집    → app/home/page.tsx (handleSubmit)
API 진입점         → app/api/generate/route.ts
입력 검증          → lib/ai/schema.ts (validateGenerateInput)
AI 호출            → lib/ai/generateMenu.ts  ← 교체할 파일
출력 검증          → lib/ai/schema.ts (validateGenerateOutput)
결과 표시          → app/result/page.tsx
공통 타입          → lib/types/api.ts
```

---

**마지막 업데이트**: 2026-02-18
