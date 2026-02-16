/**
 * Firebase 관련 유틸리티 함수 및 설정을 내보내는 메인 파일
 */

// Firebase 설정 및 서비스
export { default as app, auth, db } from "./config"

// Authentication 함수들
export { signUp, signIn, logOut, onAuthChange } from "./auth"

// Firestore 함수들
export {
  collections,
  setDocument,
  getDocument,
  updateDocument,
  deleteDocument,
  getDocuments,
  saveMenuPlan,
  getUserMenuPlans,
} from "./firestore"
