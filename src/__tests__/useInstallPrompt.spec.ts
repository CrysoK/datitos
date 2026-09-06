import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { defineComponent } from 'vue'
import { mount } from '@vue/test-utils'
import {
  INSTALL_HINT_KEY,
  isAppInstalled,
  isIosSafari,
  resetInstallPromptCapture,
  useInstallPrompt
} from '../composables/useInstallPrompt'

const Host = defineComponent({
  setup() {
    return useInstallPrompt({ revealDelayMs: 0 })
  },
  template: '<span />'
})

const stubMatchMedia = (standalone: boolean) => {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: standalone && query.includes('standalone'),
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn()
  }))
}

describe('isAppInstalled / isIosSafari', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('detecta display-mode standalone', () => {
    stubMatchMedia(true)
    expect(isAppInstalled()).toBe(true)
  })

  it('detecta Safari en iPhone', () => {
    stubMatchMedia(false)
    vi.stubGlobal('navigator', {
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      platform: 'iPhone',
      maxTouchPoints: 5,
      standalone: false
    })
    expect(isIosSafari()).toBe(true)
    expect(isAppInstalled()).toBe(false)
  })

  it('no trata Chrome iOS como Safari', () => {
    vi.stubGlobal('navigator', {
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/120.0.0.0 Mobile/15E148 Safari/604.1',
      platform: 'iPhone',
      maxTouchPoints: 5
    })
    expect(isIosSafari()).toBe(false)
  })
})

describe('useInstallPrompt', () => {
  beforeEach(() => {
    resetInstallPromptCapture()
    localStorage.clear()
    stubMatchMedia(false)
    vi.stubGlobal('navigator', {
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
      platform: 'Win32',
      maxTouchPoints: 0
    })
  })

  afterEach(() => {
    resetInstallPromptCapture()
    vi.unstubAllGlobals()
    localStorage.clear()
  })

  it('recupera beforeinstallprompt si el evento llegó antes de montar', async () => {
    const event = new Event('beforeinstallprompt')
    event.preventDefault = vi.fn()
    window.dispatchEvent(event)

    const wrapper = mount(Host)
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.visible).toBe(true)
    expect(wrapper.vm.canPrompt).toBe(true)
    wrapper.unmount()
  })

  it('aparece con beforeinstallprompt y se oculta al cerrar', async () => {
    const wrapper = mount(Host)
    expect(wrapper.vm.visible).toBe(false)

    const event = new Event('beforeinstallprompt')
    event.preventDefault = vi.fn()
    window.dispatchEvent(event)
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.visible).toBe(true)
    expect(wrapper.vm.canPrompt).toBe(true)

    wrapper.vm.dismiss()
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.visible).toBe(false)
    expect(JSON.parse(localStorage.getItem(INSTALL_HINT_KEY)!)).toBe(true)

    wrapper.unmount()
  })

  it('no aparece si el usuario ya lo cerró', async () => {
    localStorage.setItem(INSTALL_HINT_KEY, JSON.stringify(true))
    const wrapper = mount(Host)

    window.dispatchEvent(new Event('beforeinstallprompt'))
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.visible).toBe(false)
    wrapper.unmount()
  })
})
