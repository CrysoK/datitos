import { computed, onMounted, onUnmounted, ref } from 'vue'
import { cargarDesdeLocalStorage, guardarEnLocalStorage } from '../utils'

export const INSTALL_HINT_KEY = 'install_hint_dismissed'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export const isAppInstalled = (): boolean => {
  if (typeof window === 'undefined') return false
  if (window.matchMedia('(display-mode: standalone)').matches) return true
  return 'standalone' in navigator && (navigator as Navigator & { standalone?: boolean }).standalone === true
}

export const isIosSafari = (): boolean => {
  const ua = navigator.userAgent
  const ios = /iP(hone|ad|od)/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  if (!ios) return false
  return /WebKit/i.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/i.test(ua)
}

let capturedPrompt: BeforeInstallPromptEvent | null = null

export const resetInstallPromptCapture = () => {
  capturedPrompt = null
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault()
    capturedPrompt = event as BeforeInstallPromptEvent
  })
}

export function useInstallPrompt(options?: { revealDelayMs?: number }) {
  const revealDelayMs = options?.revealDelayMs ?? 800
  const dismissed = ref(cargarDesdeLocalStorage<boolean>(INSTALL_HINT_KEY) === true)
  const installed = ref(isAppInstalled())
  const revealed = ref(revealDelayMs === 0)
  const canPrompt = ref(false)
  const iosSafari = ref(false)
  let deferred: BeforeInstallPromptEvent | null = null
  let revealTimer: ReturnType<typeof setTimeout> | undefined

  const visible = computed(
    () => revealed.value && !installed.value && !dismissed.value && (canPrompt.value || iosSafari.value)
  )

  const adoptPrompt = (event: BeforeInstallPromptEvent) => {
    deferred = event
    canPrompt.value = true
  }

  const onBeforeInstall = (event: Event) => {
    event.preventDefault()
    capturedPrompt = event as BeforeInstallPromptEvent
    adoptPrompt(capturedPrompt)
  }

  const onInstalled = () => {
    installed.value = true
    canPrompt.value = false
    deferred = null
  }

  const dismiss = () => {
    dismissed.value = true
    guardarEnLocalStorage(INSTALL_HINT_KEY, true)
  }

  const install = async () => {
    if (!deferred) return
    await deferred.prompt()
    await deferred.userChoice
    canPrompt.value = false
    deferred = null
    dismiss()
  }

  onMounted(() => {
    installed.value = isAppInstalled()
    iosSafari.value = isIosSafari()
    if (capturedPrompt) adoptPrompt(capturedPrompt)
    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    window.addEventListener('appinstalled', onInstalled)
    if (revealDelayMs > 0) {
      revealTimer = setTimeout(() => {
        revealed.value = true
      }, revealDelayMs)
    }
  })

  onUnmounted(() => {
    window.removeEventListener('beforeinstallprompt', onBeforeInstall)
    window.removeEventListener('appinstalled', onInstalled)
    if (revealTimer) clearTimeout(revealTimer)
  })

  return { visible, canPrompt, dismiss, install }
}
