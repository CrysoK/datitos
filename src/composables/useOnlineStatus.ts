import { onMounted, ref } from 'vue'

export const ONLINE_CHECK_PATH = '/__online'
export const OFFLINE_PROBE_HEADER = 'X-Datitos-Offline'
export const ONLINE_RETRY_MS = 2000

export const probeNetwork = async (force = false): Promise<boolean> => {
  if (!force && typeof navigator !== 'undefined' && !navigator.onLine) return false
  try {
    const res = await fetch(`${ONLINE_CHECK_PATH}?t=${Date.now()}`, { cache: 'no-store' })
    return res.headers.get(OFFLINE_PROBE_HEADER) !== '1'
  } catch {
    return false
  }
}

const isOnline = ref(typeof navigator === 'undefined' ? true : navigator.onLine)
let probing: Promise<void> | null = null
let listening = false
let retryTimer: ReturnType<typeof setInterval> | null = null

const stopRetry = () => {
  if (retryTimer !== null) {
    clearInterval(retryTimer)
    retryTimer = null
  }
}

const startRetry = () => {
  if (retryTimer !== null || typeof window === 'undefined') return
  retryTimer = setInterval(() => {
    void confirmOnline(true)
  }, ONLINE_RETRY_MS)
}

const goOffline = () => {
  isOnline.value = false
  startRetry()
}

const confirmOnline = (force = false) => {
  if (!probing) {
    probing = probeNetwork(force)
      .then((ok) => {
        isOnline.value = ok
        if (ok) stopRetry()
        else startRetry()
      })
      .finally(() => {
        probing = null
      })
  }
  return probing
}

const onVisible = () => {
  if (document.visibilityState === 'visible' && !isOnline.value) {
    void confirmOnline(true)
  }
}

const ensureListening = () => {
  if (listening || typeof window === 'undefined') return
  listening = true
  window.addEventListener('online', () => confirmOnline(true))
  window.addEventListener('offline', goOffline)
  document.addEventListener('visibilitychange', onVisible)
}

export const resetOnlineStatus = () => {
  stopRetry()
  probing = null
  isOnline.value = typeof navigator === 'undefined' ? true : navigator.onLine
}

export function useOnlineStatus() {
  ensureListening()
  onMounted(() => {
    void confirmOnline()
  })
  return { isOnline }
}
