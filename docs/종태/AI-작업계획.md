# 종태 AI 작업 계획 (현재 프로젝트 기준)

> 마지막 업데이트: 2026-02-18
> 현재 프로젝트 분석 후 재작성

---

## 📌 현재 상태 파악

### 이미 구현된 것 (건드리지 않기)

| 파일 | 상태 | 내용 |
|------|------|------|
| `lib/types/api.ts` | ✅ 완성 | `GenerateInput`, `GenerateOutput`, `MenuOption` 등 타입 전부 정의됨 |
| `lib/ai/schema.ts` | ✅ 완성 | 입력 검증 `validateGenerateInput()`, 출력 검증 `validateGenerateOutput()` 구현됨 |
| `app/api/generate/route.ts` | ✅ 완성 | 입력 받기 → 검증 → AI 호출 → 출력 검증 → Firebase 저장 전체 흐름 완성 |
| `lib/ai/generateMenu.ts` | 🔄 Mock | OpenAI 연동만 빠진 상태. 이 파일만 수정하면 됨 |

### 내가 할 일은 딱 하나

**`lib/ai/generateMenu.ts` 의 Mock을 실제 OpenAI API 호출로 교체**

타입, 검증, API Route는 이미 완성돼 있으므로 건드리지 않는다.

---

## 📐 현재 타입 구조 (이미 확정됨)

```typescript
// lib/types/api.ts — 이미 구현된 타입, 변경 없음

// 입력 (홈 화면 → /api/generate)
interface GenerateInput {
  timeLimitMin: 5 | 10 | 15
  tools: ("microwave" | "pan" | "airfryer")[]
  ingredientsText: string          // "계란, 김치, 두부, 양파"
  dislikedIngredientsText?: string // "땅콩, 유제품" (선택)
}

// 출력 (AI → /api/generate → 결과 화면)
interface GenerateOutput {
  menuOptions: [MenuOption, MenuOption, MenuOption]  // 정확히 3개
  threeDayPlan: [ThreeDayPlanItem, ThreeDayPlanItem, ThreeDayPlanItem]  // 정확히 3일
  shoppingList: ShoppingItem[]
  ingredientsUsed?: Record<string, number>
}

interface MenuOption {
  optionId: string          // "option-1", "option-2", "option-3"
  title: string             // 메뉴 이름
  timeMin: number           // 조리 시간 (≤ timeLimitMin)
  tools: Tool[]             // 사용 도구
  ingredients: string[]     // 재료 목록
  steps: string[]           // 조리 순서 (3~5개)
  tip: string               // 실패 방지 팁
  difficulty?: "easy" | "medium" | "hard"
  kcal?: number
}

interface ThreeDayPlanItem {
  day: 1 | 2 | 3
  breakfast: string
  lunch: string
  dinner: string
}

interface ShoppingItem {
  item: string
  quantity: number
  unit: string
  reason?: string
}
```

---

## ✅ 작업 순서

### Step 1 — 환경 설정

`.env.local` 에 추가:
```
OPENAI_API_KEY=sk-proj-...
```

설치 확인:
```bash
npm list openai
# 없으면: npm install openai
```

---

### Step 2 — 프롬프트 파일 작성

**파일 생성: `lib/ai/prompts.ts`**

```typescript
import type { GenerateInput } from "@/lib/types/api"

export const SYSTEM_PROMPT = `
당신은 1인 가구를 위한 "현생 요리 플래너"입니다.

# 역할
- 사용자의 시간·도구·재료 제약을 기반으로 배달 대신 직접 만들 수 있는 메뉴 추천
- 재료 낭비를 방지하는 3일 식단 플랜 제공
- 간결하고 실패 확률 낮은 레시피 제공

# 출력 규칙
1. JSON만 반환 (설명, 마크다운, 코드블록 금지)
2. 모든 필드를 빠짐없이 채울 것
3. 한국어로 작성
`.trim()

export const RULES_PROMPT = `
# 반드시 지킬 규칙

## 제약 조건
- timeMin: 모든 메뉴는 입력된 timeLimitMin 이하
- tools: 각 메뉴의 tools는 입력된 tools 목록 안에서만 선택
- 기피 재료: dislikedIngredientsText에 포함된 재료는 메뉴/재료/레시피 어디에도 절대 포함 금지

## 출력 형식
- menuOptions: 정확히 3개, optionId는 "option-1", "option-2", "option-3"
- 메뉴 3개는 서로 다른 형태 (볶음밥/덮밥/찜 등)
- steps: 각 메뉴당 3~5줄, 간결하게
- threeDayPlan: 정확히 3일 (day: 1, 2, 3)
- shoppingList: 현재 재료에서 부족한 것만

## 품질
- 설거지 최소 (한 냄비/팬으로 끝나는 메뉴 우선)
- tip은 "가장 흔히 실패하는 포인트" 한 줄
- 재료는 있는 것 최대한 활용
`.trim()

export function buildUserPrompt(input: GenerateInput): string {
  const { timeLimitMin, tools, ingredientsText, dislikedIngredientsText } = input

  const toolNames: Record<string, string> = {
    microwave: "전자레인지",
    pan: "팬",
    airfryer: "에어프라이어",
  }

  return `
# 사용자 조건

- 요리 시간: ${timeLimitMin}분 이내
- 사용 가능한 도구: ${tools.map(t => toolNames[t] ?? t).join(", ")}
- 냉장고 재료: ${ingredientsText}
${dislikedIngredientsText ? `- 기피 재료 (절대 제외): ${dislikedIngredientsText}` : ""}

# 요청
위 조건으로:
1. 배달 대신 직접 만들 수 있는 메뉴 3가지
2. 각 메뉴의 재료, 조리 순서(3~5줄), 실패 방지 팁
3. 이 재료들로 3일간 돌려먹는 식단 플랜
4. 부족한 재료만 담은 장보기 리스트

JSON 스키마를 정확히 준수해서 반환하세요.
`.trim()
}
```

---

### Step 3 — generateMenu 함수 교체

**파일 수정: `lib/ai/generateMenu.ts`**

현재 Mock 코드를 아래로 전체 교체:

```typescript
import OpenAI from "openai"
import { SYSTEM_PROMPT, RULES_PROMPT, buildUserPrompt } from "./prompts"
import type { GenerateInput, GenerateOutput } from "@/lib/types/api"

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// schema.ts에 이미 정의된 JSON 스키마를 OpenAI에 그대로 전달
import { generateOutputJsonSchema } from "./schema"

export const generateMenu = async (input: GenerateInput): Promise<GenerateOutput> => {
  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "system", content: RULES_PROMPT },
      { role: "user", content: buildUserPrompt(input) },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "menu_generation",
        strict: true,
        schema: generateOutputJsonSchema,
      },
    },
    temperature: 0.7,
    max_tokens: 2500,
  })

  const content = response.choices[0]?.message?.content
  if (!content) throw new Error("OpenAI returned empty response")

  return JSON.parse(content) as GenerateOutput
}
```

> **주의**: `generateOutputJsonSchema` 를 그대로 재사용하기 때문에
> OpenAI 스키마와 검증 스키마가 항상 일치한다.
> 별도로 스키마를 두 번 작성하지 않아도 됨.

---

### Step 4 — 로컬 테스트

개발 서버 실행:
```bash
npm run dev -- -p 3001
```

curl로 직접 API 테스트:
```bash
# 기본 케이스
curl -X POST http://localhost:3001/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "timeLimitMin": 10,
    "tools": ["pan", "microwave"],
    "ingredientsText": "계란, 김치, 두부, 양파, 햇반"
  }'

# 기피 재료 케이스
curl -X POST http://localhost:3001/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "timeLimitMin": 15,
    "tools": ["pan", "airfryer"],
    "ingredientsText": "닭가슴살, 브로콜리, 고구마",
    "dislikedIngredientsText": "유제품, 견과류"
  }'

# 극단 케이스 (5분, 전자레인지만)
curl -X POST http://localhost:3001/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "timeLimitMin": 5,
    "tools": ["microwave"],
    "ingredientsText": "계란, 햇반, 김"
  }'
```

**각 케이스에서 확인할 것:**
- [ ] `menuOptions` 3개인가
- [ ] 각 메뉴의 `timeMin` ≤ `timeLimitMin` 인가
- [ ] 각 메뉴의 `tools`가 입력 도구 범위 안인가
- [ ] `dislikedIngredientsText` 재료가 결과에 없는가
- [ ] `steps` 3~5개인가
- [ ] `threeDayPlan` 3일인가
- [ ] `shoppingList` 있는가

---

### Step 5 — 문제 발생 시 대응

| 문제 | 원인 | 대응 |
|------|------|------|
| `422 INVALID_AI_OUTPUT` 에러 | AI가 스키마 규칙 위반 (timeMin 초과 등) | RULES_PROMPT 강화 |
| 메뉴 3개가 비슷함 | 창의성 부족 | temperature `0.7 → 0.8` 또는 RULES_PROMPT에 "형태 다양화" 강조 |
| 기피 재료가 결과에 포함됨 | 프롬프트 지시 미흡 | RULES_PROMPT에 "절대 포함 금지" 재강조 |
| JSON 파싱 오류 | 모델이 스키마 미준수 | `gpt-4o-mini` → `gpt-4o` 로 업그레이드 고려 |
| API 응답 느림 (5초+) | 토큰 많음 | `max_tokens: 2500 → 2000` 으로 줄이기 |
| `401 Unauthorized` | API 키 오류 | `.env.local` 확인, 서버 재시작 |

---

## 🔢 모델 선택 기준

| 상황 | 모델 | 이유 |
|------|------|------|
| 개발/테스트 중 | `gpt-4o-mini` | 빠르고 저렴 |
| 품질 문제 생기면 | `gpt-4o` | 정확도 높음, 비용 10배 |
| 데모 당일 | `gpt-4o-mini` | 속도 우선 |

---

## 📂 최종 파일 구조

```
lib/
├── ai/
│   ├── generateMenu.ts   ← 이 파일만 수정 (Mock → OpenAI)
│   ├── prompts.ts        ← 새로 생성
│   └── schema.ts         ← 건드리지 않음 (이미 완성)
├── types/
│   └── api.ts            ← 건드리지 않음 (이미 완성)
app/
└── api/
    └── generate/
        └── route.ts      ← 건드리지 않음 (이미 완성)
```

---

## ✅ 완료 기준 (Definition of Done)

- [ ] `OPENAI_API_KEY` 설정 완료
- [ ] `lib/ai/prompts.ts` 작성 완료
- [ ] `lib/ai/generateMenu.ts` Mock → OpenAI 교체 완료
- [ ] curl 테스트 3케이스 모두 200 응답
- [ ] 결과 화면(`/result`)에서 실제 AI 메뉴 표시 확인
- [ ] `validateGenerateOutput()` 에러 없이 통과 (422 없음)
- [ ] `npx tsc --noEmit` TypeScript 에러 없음

---

## 📚 참고 문서

- [현재 타입 정의](../../lib/types/api.ts)
- [현재 스키마/검증](../../lib/ai/schema.ts)
- [현재 API Route](../../app/api/generate/route.ts)
- [AI 시스템 설계 문서](../../claude/프로젝트문서/2.기술설계/2.4-AI-시스템-설계.md)
- [AI 출력 스키마 + 프롬프트 초안](../../claude/초기%20문서/AI%20출력%20스키마%20+%20프롬프트.md)
