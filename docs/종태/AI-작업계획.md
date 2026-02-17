# 종태 AI 작업 계획

## 📌 담당 범위

`lib/ai/` 폴더 전체 구현 + `/api/generate` 연동 지원

```
lib/ai/
├── openai.ts        # OpenAI 클라이언트 + generateMenu() 메인 함수
├── prompts.ts       # System / Developer / User 프롬프트
├── schema.ts        # Structured Outputs JSON 스키마
├── validation.ts    # 출력 검증 (시간/도구/알레르기)
├── retry.ts         # 자동 재시도 로직
└── fallback.ts      # AI 실패 시 템플릿 응답
```

---

## ✅ Day 1 — 환경 설정 + 인터페이스 확정

### 1. 개발 환경 세팅

```bash
git clone https://github.com/whdxo/DeliveryCut.git
cd DeliveryCut
git checkout jongtae/#1
npm install
cp .env.example .env.local
```

`.env.local` 파일에 OpenAI API 키 입력:
```
OPENAI_API_KEY=sk-proj-...
```

OpenAI SDK 설치 확인:
```bash
npm list openai  # 이미 설치되어 있어야 함
```

---

### 2. 세종과 인터페이스 합의 (Day 1 필수)

세종이 `/api/generate`에서 호출할 함수의 입출력 타입을 확정합니다.

**`lib/types/api.ts` 에 아래 타입 추가** (세종과 공동 관리):

```typescript
// 홈 화면 → API → AI로 전달되는 입력
export interface GenerateInput {
  timeLimitMin: 5 | 10 | 15
  tools: ('microwave' | 'pan' | 'airfryer')[]
  ingredientsText: string
  dislikedIngredientsText?: string  // 기피 재료 (자유 텍스트)
}

// AI → API → 결과 화면으로 전달되는 출력
export interface MenuOption {
  optionId: 'opt1' | 'opt2' | 'opt3'
  title: string
  timeMin: number
  tools: string[]
  dishwashing: 'low' | 'medium' | 'high'
  difficulty: 'easy' | 'medium'
  deliveryCutPoint: string           // "배달을 이길 이유" 한 줄
  mainIngredientsUsed: string[]
  missingIngredientsOptional: string[]
}

export interface Recipe {
  prepLine: string
  steps: string[]                    // 3~5개
  failTip: string
  safetyNote: string
}

export interface GenerateOutput {
  todayOptions: MenuOption[]         // 항상 3개
  recipesByOptionId: {
    opt1: Recipe
    opt2: Recipe
    opt3: Recipe
  }
  plan3Days: {
    day: 1 | 2 | 3
    title: string
    timeMin: number
    tools: string[]
    useStrategy: string
  }[]
  shoppingList: {
    vegetables: string[]
    protein: string[]
    sauces: string[]
    others: string[]
  }
  warnings: string[]
}
```

---

### 3. 체크리스트

- [ ] Git clone + 브랜치 확인
- [ ] `.env.local` 에 `OPENAI_API_KEY` 설정
- [ ] `npm run dev` 실행 확인
- [ ] 세종에게 `GenerateInput` / `GenerateOutput` 타입 공유
- [ ] 영진에게 결과 화면 데이터 구조 공유

---

## ✅ Day 2 — 프롬프트 설계

### 파일: `lib/ai/prompts.ts`

**System Prompt** (고정, 역할 부여):
```typescript
export const SYSTEM_PROMPT = `
당신은 1인 가구를 위한 "현생 요리 플래너"입니다.

# 핵심 역할
- 사용자의 현실적 제약(시간/도구/재료)을 기반으로 "배달 대체 한 끼"를 추천
- 재료 낭비를 방지하고 최소 장보기를 유도하는 3일 플랜 제공
- 간결하고 실패 확률이 낮은 레시피 제공

# 출력 규칙
1. 반드시 JSON 스키마를 준수할 것
2. 설명/마크다운/코드블록 금지, 오직 JSON만 반환
3. 모든 필드를 빠짐없이 채울 것
`.trim()
```

**Developer Prompt** (고정, 규칙 강제):
```typescript
export const DEVELOPER_PROMPT = `
# 필수 준수 규칙

## 제약 조건 100% 준수
- 시간: 모든 메뉴의 timeMin은 입력한 timeLimitMin 이하
- 도구: 각 메뉴의 tools는 입력한 tools의 부분집합
- 기피 재료: dislikedIngredientsText에 포함된 재료는 절대 금지

## 출력 형식
- todayOptions: 정확히 3개 (opt1/opt2/opt3)
- recipesByOptionId: opt1/opt2/opt3 모두 포함
- steps: 3~5줄로 간결하게
- plan3Days: 정확히 3일 (day 1/2/3)

## 품질 기준
- 메뉴 3개는 서로 다른 형태 (덮밥/찜/볶음밥 등)
- deliveryCutPoint는 "배달을 이길 이유" 짧게 한 줄
- useStrategy에 "어떤 재료를 언제 소진할지" 반드시 명시
- shoppingList는 "부족한 것만"

## 현생 모드
- 설거지 최소 우선 (dishwashing=low 위주)
- 재료는 있는 것 우선, 없는 건 missingIngredientsOptional에만

## 안전 규칙
- 의료/영양 처방 표현 금지
- 생식/날것 위험 식품 권장 금지
`.trim()
```

**User Prompt** (매 요청마다 동적 생성):
```typescript
export function buildUserPrompt(input: GenerateInput): string {
  const { timeLimitMin, tools, ingredientsText, dislikedIngredientsText } = input

  return `
# 사용자 입력

## 제약 조건
- 시간: ${timeLimitMin}분
- 도구: ${tools.join(', ')}

## 냉장고 재료
${ingredientsText}

${dislikedIngredientsText ? `## 기피 재료 (절대 포함 금지)\n${dislikedIngredientsText}` : ''}

---

# 요청사항
위 조건을 기반으로:
1. 오늘의 배달 대체 메뉴 3개
2. 각 메뉴의 3~5줄 레시피 + 실패 방지 팁
3. 재료를 돌려쓰는 3일 식단 플랜
4. 최소 장보기 리스트 (부족한 것만)

반드시 JSON 스키마를 준수하세요.
`.trim()
}
```

### 체크리스트

- [ ] `lib/ai/prompts.ts` 작성 완료
- [ ] 프롬프트 수동 테스트 (ChatGPT 등에 붙여넣어 결과 확인)
- [ ] 출력이 너무 비슷하거나 제약을 어기면 Developer Prompt 수정

---

## ✅ Day 3 — JSON 스키마 + generateMenu() 구현

### 파일: `lib/ai/schema.ts`

OpenAI Structured Outputs용 JSON 스키마 정의.
전체 스키마는 `claude/프로젝트문서/2.기술설계/2.4-AI-시스템-설계.md` 참고.

핵심 구조:
```typescript
export const OUTPUT_SCHEMA = {
  name: 'menu_generation',
  strict: true,
  schema: {
    type: 'object',
    properties: {
      todayOptions: { /* 3개 메뉴 배열 */ },
      recipesByOptionId: { /* opt1/opt2/opt3 레시피 */ },
      plan3Days: { /* 3일 플랜 배열 */ },
      shoppingList: { /* vegetables/protein/sauces/others */ },
      warnings: { /* 안내 메시지 */ },
    },
    required: ['todayOptions', 'recipesByOptionId', 'plan3Days', 'shoppingList', 'warnings'],
    additionalProperties: false,
  },
}
```

---

### 파일: `lib/ai/openai.ts`

```typescript
import OpenAI from 'openai'
import { SYSTEM_PROMPT, DEVELOPER_PROMPT, buildUserPrompt } from './prompts'
import { OUTPUT_SCHEMA } from './schema'
import { validateOutput } from './validation'
import type { GenerateInput, GenerateOutput } from '@/lib/types/api'

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function generateMenu(input: GenerateInput): Promise<GenerateOutput> {
  const response = await client.chat.completions.create({
    model: 'gpt-4.1-mini',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'developer', content: DEVELOPER_PROMPT },
      { role: 'user', content: buildUserPrompt(input) },
    ],
    response_format: {
      type: 'json_schema',
      json_schema: OUTPUT_SCHEMA,
    },
    temperature: 0.7,
    max_tokens: 2000,
  })

  const content = response.choices[0]?.message?.content
  if (!content) throw new Error('Empty response from OpenAI')

  const result = JSON.parse(content)
  validateOutput(result, input)

  return result
}
```

### 체크리스트

- [ ] `lib/ai/schema.ts` 완성 (스키마 전체 필드 채우기)
- [ ] `lib/ai/openai.ts` 작성 완료
- [ ] `npx tsx scripts/test-ai.ts` 로 실제 API 호출 테스트
- [ ] 결과 JSON이 `GenerateOutput` 타입과 일치하는지 확인

---

## ✅ Day 4 — 검증 + 재시도 + 폴백

### 파일: `lib/ai/validation.ts`

AI 응답이 제약을 지켰는지 서버에서 2차로 검증:

```typescript
export function validateOutput(output: any, input: GenerateInput): void {
  // 1. 메뉴 3개인지
  if (output.todayOptions?.length !== 3)
    throw new Error('메뉴 옵션이 3개가 아닙니다')

  // 2. 레시피 opt1/opt2/opt3 존재하는지
  if (!output.recipesByOptionId?.opt1 || !output.recipesByOptionId?.opt2 || !output.recipesByOptionId?.opt3)
    throw new Error('레시피 누락')

  // 3. 시간 제약 확인
  for (const option of output.todayOptions) {
    if (option.timeMin > input.timeLimitMin)
      throw new Error(`시간 초과: ${option.title} (${option.timeMin}분 > ${input.timeLimitMin}분)`)
  }

  // 4. 도구 제약 확인
  for (const option of output.todayOptions) {
    for (const tool of option.tools) {
      if (!input.tools.includes(tool))
        throw new Error(`사용 불가 도구: ${tool} in ${option.title}`)
    }
  }

  // 5. 3일 플랜 확인
  if (output.plan3Days?.length !== 3)
    throw new Error('3일 플랜이 3개가 아닙니다')
}
```

---

### 파일: `lib/ai/retry.ts`

검증 실패 시 자동 1회 재시도:

```typescript
import { generateMenu } from './openai'
import type { GenerateInput, GenerateOutput } from '@/lib/types/api'

export async function generateWithRetry(
  input: GenerateInput,
  maxRetries = 1
): Promise<GenerateOutput> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await generateMenu(input)
    } catch (error) {
      console.error(`[AI] attempt ${attempt + 1} failed:`, error)
      lastError = error as Error
      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, 1000))
      }
    }
  }

  throw lastError ?? new Error('AI 생성 실패')
}
```

### 체크리스트

- [ ] `lib/ai/validation.ts` 작성 완료
- [ ] `lib/ai/retry.ts` 작성 완료
- [ ] 의도적으로 틀린 입력 넣어서 검증 로직 동작 확인
- [ ] 재시도 후 성공 케이스 테스트

---

## ✅ Day 5 — 세종 API 연동 + 품질 테스트

### 세종의 `/api/generate/route.ts` 에서 호출 방법

```typescript
import { generateWithRetry } from '@/lib/ai/retry'
import type { GenerateInput } from '@/lib/types/api'

export async function POST(request: Request) {
  const body = await request.json()

  const input: GenerateInput = {
    timeLimitMin: body.timeLimitMin,
    tools: body.tools,
    ingredientsText: body.ingredientsText,
    dislikedIngredientsText: body.dislikedIngredientsText,
  }

  const result = await generateWithRetry(input)
  return Response.json(result)
}
```

---

### 품질 테스트 케이스 3개 (최소)

`scripts/test-ai.ts` 파일 만들어서 실행:

```bash
npx tsx scripts/test-ai.ts
```

| 케이스 | timeLimitMin | tools | 재료 | 기피 |
|--------|-------------|-------|------|------|
| 기본 | 10 | pan, microwave | 계란, 김치, 두부, 양파, 햇반 | 없음 |
| 기피 재료 | 15 | pan, airfryer | 닭가슴살, 브로콜리, 고구마 | 유제품, 견과류 |
| 극단 (5분) | 5 | microwave | 계란, 햇반, 김 | 없음 |

**각 케이스에서 확인할 것:**
- [ ] 시간 제약 지켜졌는가
- [ ] 도구 제약 지켜졌는가
- [ ] 기피 재료 포함 안 됐는가
- [ ] 메뉴 3개 다 다른가
- [ ] 레시피가 3~5줄인가

---

## 🔢 프롬프트 튜닝 기준

| 문제 | 수정 방법 |
|------|----------|
| 메뉴 3개가 비슷함 | Developer Prompt에 "형태 변주 (덮밥/찜/볶음밥)" 강조 |
| 시간 초과 | User Prompt에 시간 제약 재강조 |
| 기피 재료 포함 | Developer Prompt에 "절대 금지" 문구 강화 |
| 레시피가 너무 길거나 짧음 | Developer Prompt steps 길이 규칙 재명시 |
| JSON 파싱 오류 | System Prompt "JSON만 반환" 강조, schema 확인 |

Temperature 조정:
- 현재: `0.7` (기본)
- 창의성 더 필요: `0.8`
- 일관성 더 필요: `0.6`

---

## 📂 완성 후 파일 구조

```
lib/
├── ai/
│   ├── openai.ts        ← generateMenu() 메인 함수
│   ├── prompts.ts       ← System/Developer/User 프롬프트
│   ├── schema.ts        ← JSON 스키마
│   ├── validation.ts    ← 출력 검증
│   ├── retry.ts         ← 재시도 로직
│   └── fallback.ts      ← 폴백 (선택)
├── types/
│   └── api.ts           ← GenerateInput / GenerateOutput 타입
scripts/
└── test-ai.ts           ← 수동 테스트 스크립트
```

---

## ✅ 완료 기준 (Definition of Done)

- [ ] `generateMenu()` 함수 실제 API 호출 성공
- [ ] 기본 테스트 케이스 3개 통과
- [ ] 시간/도구/기피 재료 검증 로직 동작
- [ ] 재시도 1회 로직 동작
- [ ] 세종의 `/api/generate` 에서 호출 성공
- [ ] TypeScript 에러 없음 (`npx tsc --noEmit`)

---

## 📚 참고 문서

- [AI 작업 가이드](../../claude/역할별작업가이드/AI-작업가이드.md)
- [AI 시스템 설계](../../claude/프로젝트문서/2.기술설계/2.4-AI-시스템-설계.md)
- [AI 출력 스키마 + 프롬프트](../../claude/초기%20문서/AI%20출력%20스키마%20+%20프롬프트.md)
- [역할 분담](../공동문서/역할-분담.md)

---

**마지막 업데이트**: 2026-02-17
