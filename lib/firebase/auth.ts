import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  User,
} from "firebase/auth"
import { auth } from "./config"

/**
 * 이메일/비밀번호로 회원가입
 */
export const signUp = async (email: string, password: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    )
    return { user: userCredential.user, error: null }
  } catch (error: any) {
    return { user: null, error: error.message }
  }
}

/**
 * 이메일/비밀번호로 로그인
 */
export const signIn = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    )
    return { user: userCredential.user, error: null }
  } catch (error: any) {
    return { user: null, error: error.message }
  }
}

/**
 * 구글 계정으로 로그인
 */
export const signInWithGoogle = async () => {
  try {
    const provider = new GoogleAuthProvider()
    provider.setCustomParameters({ prompt: "select_account" })

    const userCredential = await signInWithPopup(auth, provider)
    return { user: userCredential.user, error: null }
  } catch (error: any) {
    return { user: null, error: error.message }
  }
}

/**
 * 로그아웃
 */
export const logOut = async () => {
  try {
    await signOut(auth)
    return { error: null }
  } catch (error: any) {
    return { error: error.message }
  }
}

/**
 * 인증 상태 변경 감지
 */
export const onAuthChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback)
}
