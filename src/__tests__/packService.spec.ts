import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { Pack } from '../types'
import {
  packService,
  communityPackId,
  withCommunityPackIds
} from '../services/packService'

describe('communityPackId', () => {
  it('es determinista para el mismo path e índice', () => {
    expect(communityPackId('ar/claro/prepago.json', 0)).toBe('ar/claro/prepago.json#0')
    expect(communityPackId('ar/claro/prepago.json', 0)).toBe(
      communityPackId('ar/claro/prepago.json', 0)
    )
  })

  it('cambia si cambia el índice o el path', () => {
    expect(communityPackId('ar/claro/prepago.json', 0)).not.toBe(
      communityPackId('ar/claro/prepago.json', 1)
    )
    expect(communityPackId('ar/claro/prepago.json', 0)).not.toBe(
      communityPackId('ar/movistar/prepago.json', 0)
    )
  })
})

describe('withCommunityPackIds', () => {
  it('numera por archivo y pisa ids aleatorios', () => {
    const packs: Pack[] = [
      { company: 'Claro', price: 1, mb: 100, days: 1, path: 'ar/claro/prepago.json', id: 0.12 },
      { company: 'Claro', price: 2, mb: 200, days: 7, path: 'ar/claro/prepago.json', id: 0.99 },
      { company: 'Movistar', price: 3, mb: 300, days: 30, path: 'ar/movistar/prepago.json', id: 0.42 }
    ]

    expect(withCommunityPackIds(packs).map((p) => p.id)).toEqual([
      'ar/claro/prepago.json#0',
      'ar/claro/prepago.json#1',
      'ar/movistar/prepago.json#0'
    ])
  })

  it('deja intactos los packs sin path', () => {
    const local: Pack = { company: 'Propio', price: 10, mb: 500, days: 7, id: 123 }
    expect(withCommunityPackIds([local])[0].id).toBe(123)
  })
})

describe('packService caché y fetch', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    localStorage.clear()
  })

  it('reescribe ids aleatorios al leer cached_predefined_packs', () => {
    localStorage.setItem(
      'cached_predefined_packs',
      JSON.stringify({
        timestamp: 1,
        schemaVersion: 1,
        countryNames: { AR: 'Argentina' },
        data: [
          { company: 'Claro', price: 100, mb: 1000, days: 7, path: 'ar/claro/prepago.json', id: 0.7 }
        ]
      })
    )

    const cached = packService.getCachedPacks()
    expect(cached?.packs[0].id).toBe('ar/claro/prepago.json#0')

    const persisted = JSON.parse(localStorage.getItem('cached_predefined_packs')!)
    expect(persisted.data[0].id).toBe('ar/claro/prepago.json#0')
    expect(persisted.timestamp).toBe(1)
  })

  it('saveToCache no persiste ids aleatorios', () => {
    packService.saveToCache(
      [{ company: 'Claro', price: 100, mb: 1000, days: 7, path: 'ar/claro/prepago.json', id: 0.3 }],
      { AR: 'Argentina' },
      1
    )

    const persisted = JSON.parse(localStorage.getItem('cached_predefined_packs')!)
    expect(persisted.data[0].id).toBe('ar/claro/prepago.json#0')
  })

  it('fetchAllPacks genera el mismo id en llamadas sucesivas', async () => {
    vi.mocked(fetch).mockImplementation(async (input) => {
      const url = String(input)
      if (url.endsWith('manifest.json')) {
        return {
          ok: true,
          json: async () => ({
            last_updated: '2026-01-01',
            country_names: { AR: 'Argentina' },
            files: ['ar/claro/prepago.json']
          })
        } as Response
      }
      return {
        ok: true,
        json: async () => ({
          schema_version: 1,
          packs: [{ mb: 1000, days: 7, price: 100 }]
        })
      } as Response
    })

    const first = await packService.fetchAllPacks()
    const second = await packService.fetchAllPacks()

    expect(first.packs[0].id).toBe('ar/claro/prepago.json#0')
    expect(second.packs[0].id).toBe(first.packs[0].id)
  })
})
