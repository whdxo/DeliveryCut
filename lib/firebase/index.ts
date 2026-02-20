/**
 * Firebase 관련 유틸리티 함수 및 설정을 내보내는 메인 파일
 */

export { default as app, auth, db } from "./config"

export { signUp, signIn, signInWithGoogle, logOut, onAuthChange } from "./auth"

export {
  collections,
  setDocument,
  getDocument,
  updateDocument,
  deleteDocument,
  getDocuments,
  saveGeneratedPlan,
  getGeneratedPlanById,
  getFridgeItemsByUserId,
  addFridgeItem,
  updateFridgeItem,
  deleteFridgeItem,
  consumeFridgeItems,
  upsertFoodCatalogItems,
  searchFoodCatalogItems,
  saveMenuPlan,
  getUserMenuPlans,
  savePlannerPlan,
  getPlannerPlan,
  getUserPlannerPlans,
} from "./firestore"

