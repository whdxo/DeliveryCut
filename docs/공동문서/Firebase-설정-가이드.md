# Firebase 설정 가이드

## 📌 개요

DeliveryCut AI는 Firebase를 사용합니다:
- **Firestore Database**: 메뉴 플랜, 사용자 데이터 저장
- **Authentication**: 이메일/비밀번호 로그인

---

## ✅ 이미 완료된 설정

프로젝트에 Firebase가 이미 설정되어 있습니다!

### Firebase 프로젝트 정보
- **프로젝트 이름**: deliverycut-3a439
- **프로젝트 ID**: deliverycut-3a439
- **리전**: Seoul (asia-northeast3)
- **콘솔**: https://console.firebase.google.com/project/deliverycut-3a439

### 활성화된 서비스
- ✅ **Firestore Database** (Standard 버전, 테스트 모드)
- ✅ **Authentication** (이메일/비밀번호 활성화)

---

## 🚀 팀원 설정 방법

### 1. 환경변수 설정

`.env.local` 파일을 생성하고 다음 내용 추가:

```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDr-usLA8c7bQJb5ZCqBIB7s4D6D9nAbRw
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=deliverycut-3a439.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=deliverycut-3a439
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=deliverycut-3a439.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=954345744841
NEXT_PUBLIC_FIREBASE_APP_ID=1:954345744841:web:2fa806f32c48d951bca018
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-V1LG36C91X

# OpenAI API Key
OPENAI_API_KEY=your_openai_api_key_here
```

### 2. Firebase 콘솔 접근 (선택)

Firebase 콘솔에 접근하려면:
1. Google 계정으로 https://console.firebase.google.com 로그인
2. 프로젝트 소유자에게 프로젝트 초대 요청
3. 이메일로 받은 초대 링크 클릭

**역할별 권한:**
- **소유자**: 모든 설정 변경 가능
- **편집자**: 데이터 읽기/쓰기, 규칙 수정
- **뷰어**: 데이터 읽기만 가능

---

## 📂 프로젝트 파일 구조

```
lib/firebase/
├── config.ts       # Firebase 초기화 설정
├── auth.ts         # 인증 관련 함수
├── firestore.ts    # Firestore 데이터베이스 함수
└── index.ts        # Export 모음

firestore.rules     # Firestore 보안 규칙 (배포 전 적용)
```

---

## 🔐 Authentication 사용법

### 회원가입
```typescript
import { signUp } from '@/lib/firebase'

const handleSignUp = async (email: string, password: string) => {
  const { user, error } = await signUp(email, password)
  
  if (error) {
    console.error('회원가입 실패:', error)
    return
  }
  
  console.log('회원가입 성공:', user.uid)
}
```

### 로그인
```typescript
import { signIn } from '@/lib/firebase'

const handleSignIn = async (email: string, password: string) => {
  const { user, error } = await signIn(email, password)
  
  if (error) {
    console.error('로그인 실패:', error)
    return
  }
  
  console.log('로그인 성공:', user.email)
}
```

### 로그아웃
```typescript
import { logOut } from '@/lib/firebase'

const handleLogOut = async () => {
  const { error } = await logOut()
  
  if (error) {
    console.error('로그아웃 실패:', error)
    return
  }
  
  console.log('로그아웃 성공')
}
```

### 로그인 상태 감지
```typescript
import { useEffect, useState } from 'react'
import { onAuthChange } from '@/lib/firebase'
import type { User } from 'firebase/auth'

function MyComponent() {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    // 로그인 상태 변경 감지
    const unsubscribe = onAuthChange((user) => {
      setUser(user)
      if (user) {
        console.log('사용자 로그인:', user.email)
      } else {
        console.log('로그아웃 상태')
      }
    })

    // 컴포넌트 언마운트 시 구독 해제
    return () => unsubscribe()
  }, [])

  return (
    <div>
      {user ? (
        <p>환영합니다, {user.email}!</p>
      ) : (
        <p>로그인이 필요합니다.</p>
      )}
    </div>
  )
}
```

---

## 💾 Firestore 사용법

### 메뉴 플랜 저장
```typescript
import { saveMenuPlan } from '@/lib/firebase'

const handleSaveMenuPlan = async (userId: string, menuData: any) => {
  const { id, error } = await saveMenuPlan(userId, {
    menuOptions: [
      {
        optionId: "A",
        title: "참치마요 주먹밥",
        timeMin: 10,
        ingredients: ["밥", "참치캔", "마요네즈"],
        // ...
      }
    ],
    ingredientsUsed: { "밥": 200, "참치캔": 1 },
    createdAt: new Date()
  })

  if (error) {
    console.error('저장 실패:', error)
    return
  }

  console.log('저장 성공! 문서 ID:', id)
}
```

### 사용자의 메뉴 플랜 가져오기
```typescript
import { getUserMenuPlans } from '@/lib/firebase'

const handleGetMenuPlans = async (userId: string) => {
  const { data, error } = await getUserMenuPlans(userId)

  if (error) {
    console.error('조회 실패:', error)
    return
  }

  console.log('메뉴 플랜 목록:', data)
  // data는 최신 순으로 정렬된 배열 (최대 10개)
}
```

### 일반 문서 저장/읽기
```typescript
import { setDocument, getDocument } from '@/lib/firebase'

// 저장
await setDocument('users', userId, {
  name: '홍길동',
  email: 'test@example.com',
  preferences: { vegetarian: false }
})

// 읽기
const { data, error } = await getDocument('users', userId)
if (data) {
  console.log('사용자 정보:', data)
}
```

### 문서 업데이트/삭제
```typescript
import { updateDocument, deleteDocument } from '@/lib/firebase'

// 업데이트 (기존 필드 유지, 일부만 변경)
await updateDocument('users', userId, {
  preferences: { vegetarian: true }
})

// 삭제
await deleteDocument('users', userId)
```

---

## 📊 Firestore 데이터 구조

### Collections (컬렉션)

#### 1. `users` - 사용자 정보
```typescript
{
  id: "userId",              // 문서 ID (Auth UID)
  name: "홍길동",
  email: "test@example.com",
  preferences: {
    vegetarian: false,
    allergies: ["땅콩"]
  },
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

#### 2. `menuPlans` - 메뉴 플랜
```typescript
{
  id: "menuPlanId",          // 자동 생성 ID
  userId: "userId",          // 작성자 ID
  menuOptions: [
    {
      optionId: "A",
      title: "참치마요 주먹밥",
      timeMin: 10,
      ingredients: ["밥", "참치캔", "마요네즈"],
      steps: ["1. 밥 준비", "2. 참치 섞기", ...],
      difficulty: "쉬움"
    }
  ],
  ingredientsUsed: {
    "밥": 200,
    "참치캔": 1
  },
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

#### 3. `ingredients` - 재료 마스터 (선택)
```typescript
{
  id: "ingredientId",
  name: "밥",
  category: "곡물",
  unit: "g",
  averagePrice: 1000
}
```

---

## 🔒 보안 규칙

### 현재 상태 (테스트 모드)
**2026년 3월 18일까지** 모든 읽기/쓰기가 허용됩니다.

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.time < timestamp.date(2026, 3, 18);
    }
  }
}
```

### 배포 전 적용할 규칙 (프로덕션)

`firestore.rules` 파일에 정의되어 있습니다:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // 사용자 문서: 본인만 읽기/쓰기 가능
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // 메뉴 플랜: 본인 것만 읽기/쓰기 가능
    match /menuPlans/{planId} {
      allow read, update, delete: if request.auth != null && 
                                      resource.data.userId == request.auth.uid;
      allow create: if request.auth != null;
    }
    
    // 재료 목록: 인증된 사용자만 읽기 가능
    match /ingredients/{ingredientId} {
      allow read: if request.auth != null;
      allow write: if false; // 관리자만 수정 가능
    }
  }
}
```

**배포 전 적용 방법:**
1. Firebase 콘솔 → Firestore Database → 규칙 탭
2. `firestore.rules` 파일 내용 복사
3. 붙여넣기 후 "게시" 클릭

---

## 🧪 테스트 방법

### 1. 개발 서버 실행
```bash
npm run dev
```

### 2. 테스트 페이지 접속
http://localhost:3000/test-firebase

### 3. 테스트 항목
- ✅ 회원가입 (이메일/비밀번호)
- ✅ 로그인
- ✅ 로그아웃
- ✅ Firestore 데이터 쓰기
- ✅ Firestore 데이터 읽기

### 4. Firebase 콘솔에서 확인
1. https://console.firebase.google.com/project/deliverycut-3a439/firestore
2. `test` 컬렉션에 데이터가 저장되었는지 확인

---

## ⚠️ 주의사항

### 1. 환경변수 보안
- ✅ `.env.local`은 `.gitignore`에 포함되어 있음 (Git에 올라가지 않음)
- ✅ `NEXT_PUBLIC_` 접두사가 있는 변수는 클라이언트에 노출됨 (괜찮음)
- ❌ **절대 GitHub에 직접 커밋하지 말 것**

### 2. API 키 관리
- Firebase API Key는 공개되어도 괜찮음 (보안 규칙으로 보호됨)
- 하지만 OpenAI API Key는 절대 노출 금지!

### 3. 보안 규칙 업데이트
- **2026년 3월 18일 이전**에 보안 규칙 업데이트 필수
- 그렇지 않으면 모든 접근이 차단됨

### 4. 비용 관리
- **Firestore**: 무료 할당량 (하루 읽기 50,000회, 쓰기 20,000회)
- **Authentication**: 무료 (무제한)
- 초과 시 자동 청구되므로 주의

---

## 🆘 문제 해결

### Firebase 연결 오류
```
Error: Firebase: Error (auth/configuration-not-found)
```
**해결**: `.env.local` 파일 확인 후 서버 재시작

### 권한 오류
```
FirebaseError: Missing or insufficient permissions
```
**해결**: 
1. Firebase 콘솔에서 보안 규칙 확인
2. 로그인 상태 확인 (`user`가 `null`이 아닌지)

### 데이터가 안 보임
**해결**:
1. Firebase 콘솔 → Firestore Database에서 직접 확인
2. 컬렉션 이름, 문서 ID 확인
3. 브라우저 콘솔에서 에러 메시지 확인

---

## 📚 참고 자료

- [Firebase 공식 문서](https://firebase.google.com/docs)
- [Firestore 시작하기](https://firebase.google.com/docs/firestore/quickstart)
- [Firebase Authentication](https://firebase.google.com/docs/auth)
- [보안 규칙 가이드](https://firebase.google.com/docs/firestore/security/get-started)

---

## 💬 질문/도움

Firebase 관련 질문이 있으면:
1. 이 문서 먼저 확인
2. Firebase 공식 문서 검색
3. 팀 채널에 질문

설정 도움이 필요하면 팀원에게 요청하세요!
