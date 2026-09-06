import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest'
import { defineComponent, nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import {
  OFFLINE_PROBE_HEADER,
  ONLINE_CHECK_PATH,
  ONLINE_RETRY_MS,
  resetOnlineStatus,
  useOnlineStatus
} from '../composables/useOnlineStatus'

const Host = defineComponent({
  setup() {
    return useOnlineStatus()
  },
  template: '<span>{{ isOnline }}</span>'
})

const flushProbe = async () => {
  await Promise.resolve()
  await nextTick()
}

describe('useOnlineStatus', () => {
  beforeEach(() => {
    resetOnlineStatus()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 204 })))
  })

  afterEach(() => {
    resetOnlineStatus()
    vi.unstubAllGlobals()
  })

  it('refleja navigator.onLine y cambia con los eventos del navegador', async () => {
    const wrapper = mount(Host)
    expect(wrapper.vm.isOnline).toBe(navigator.onLine)

    window.dispatchEvent(new Event('offline'))
    await nextTick()
    expect(wrapper.vm.isOnline).toBe(false)

    window.dispatchEvent(new Event('online'))
    await flushProbe()
    expect(wrapper.vm.isOnline).toBe(true)
    expect(fetch).toHaveBeenCalled()

    wrapper.unmount()
  })

  it('marca offline al montar si el probe de red falla', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new TypeError('Failed to fetch'))
    const wrapper = mount(Host)
    await flushProbe()

    expect(wrapper.vm.isOnline).toBe(false)
    expect(vi.mocked(fetch).mock.calls[0][0]).toMatch(new RegExp(`^${ONLINE_CHECK_PATH}\\?t=`))
    wrapper.unmount()
  })

  it('marca offline si el service worker responde con la cabecera de probe', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response('', { status: 200, headers: { [OFFLINE_PROBE_HEADER]: '1' } })
    )
    const wrapper = mount(Host)
    await flushProbe()

    expect(wrapper.vm.isOnline).toBe(false)
    wrapper.unmount()
  })

  it('reintenta el probe si no llega el evento online', async () => {
    vi.useFakeTimers()
    vi.mocked(fetch)
      .mockResolvedValueOnce(new Response('', { status: 200, headers: { [OFFLINE_PROBE_HEADER]: '1' } }))
      .mockResolvedValue(new Response(null, { status: 204 }))

    const wrapper = mount(Host)
    await flushProbe()
    expect(wrapper.vm.isOnline).toBe(false)

    await vi.advanceTimersByTimeAsync(ONLINE_RETRY_MS)
    await flushProbe()

    expect(wrapper.vm.isOnline).toBe(true)
    expect(vi.mocked(fetch).mock.calls.length).toBeGreaterThan(1)

    wrapper.unmount()
    vi.useRealTimers()
  })
})
