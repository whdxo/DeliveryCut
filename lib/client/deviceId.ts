const STORAGE_KEY = "deliverycut:deviceId"

const createDeviceId = () => {
  const randomPart = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID().replace(/-/g, "").slice(0, 16)
    : Math.random().toString(36).slice(2, 18)

  return `dc_${randomPart}`
}

export const getOrCreateDeviceId = () => {
  if (typeof window === "undefined") return ""

  const existing = window.localStorage.getItem(STORAGE_KEY)
  if (existing && /^dc_[a-zA-Z0-9_-]{8,64}$/.test(existing)) {
    return existing
  }

  const created = createDeviceId()
  window.localStorage.setItem(STORAGE_KEY, created)
  return created
}
