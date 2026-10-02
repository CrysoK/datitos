import { describe, it, expect, afterEach, vi } from 'vitest'
import { calcularCosto, slugify, detectUserCountry, setUserCountry, fetchUserCountry, _ } from '../utils'
import type { Pack } from '../types'

describe('calcularCosto', () => {
  const samplePack: Pack = {
    id: 1,
    company: 'Test',
    price: 100,
    mb: 1000,
    days: 7
  }

  it('calcula correctamente sin recarga', () => {
    // Uso diario 100MB, Pack 1000MB/7dias (142MB/dia) -> No necesita recarga
    // Para 7 días, debería ser 1 pack de 100 pesos
    expect(calcularCosto(samplePack, 100, 7)).toBe(100)
  })

  it('calcula correctamente con recarga', () => {
    // Uso diario 200MB, Pack 1000MB/7dias -> Necesita recarga
    // Para 7 días, usa 1400MB -> 2 packs -> 200 pesos
    expect(calcularCosto(samplePack, 200, 7)).toBe(200)
  })

  it('maneja pack.days = 0 sin romperse', () => {
    const brokenPack = { ...samplePack, days: 0 }
    expect(calcularCosto(brokenPack, 100, 7, 0)).toBe(0)
  })

  it('maneja diasUso = 0', () => {
    expect(calcularCosto(samplePack, 100, 0)).toBe(0)
  })
})

describe('slugify', () => {
  it('convierte espacios a guiones', () => {
    expect(slugify('Datos Prepago')).toBe('datos-prepago')
  })

  it('elimina caracteres especiales', () => {
    expect(slugify('Movistar (4G)')).toBe('movistar-4g')
  })

  it('maneja múltiples espacios', () => {
    expect(slugify('  Mi   Operadora  ')).toBe('mi-operadora')
  })

  it('maneja acentos y ñ', () => {
    expect(slugify('Prepago Ñoño')).toBe('prepago-oo')
  })

  it('devuelve string vacío para input vacío', () => {
    expect(slugify('')).toBe('')
  })

  it('genera slug correcto para el path de contribución', () => {
    const country = 'UY'
    const company = 'Claro'
    const listName = 'Prepago'
    const path = `${country.toLowerCase()}/${slugify(company)}/${slugify(listName)}.json`
    expect(path).toBe('uy/claro/prepago.json')
  })
})

describe('detectUserCountry y fetchUserCountry', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
    setUserCountry('AR')
  })

  it('detectUserCountry devuelve AR por defecto', () => {
    expect(detectUserCountry()).toBe('AR')
  })

  it('setUserCountry actualiza el país actual si es válido', () => {
    setUserCountry('CL')
    expect(detectUserCountry()).toBe('CL')
    setUserCountry('invalid')
    expect(detectUserCountry()).toBe('CL')
  })

  it('fetchUserCountry obtiene el país desde /api/country', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ country: 'cl' })
    }))

    const result = await fetchUserCountry()
    expect(result).toBe('CL')
    expect(detectUserCountry()).toBe('CL')
  })

  it('fetchUserCountry cae en AR si la respuesta no es ok o el código es inválido', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false
    }))

    const result = await fetchUserCountry()
    expect(result).toBe('AR')
  })

  it('fetchUserCountry cae en AR si hay un error de red u offline', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')))

    const result = await fetchUserCountry()
    expect(result).toBe('AR')
  })
})

describe('_ (traducciones y formato)', () => {
  it('formatea nombres de países según código ISO', () => {
    expect(_('AR')).toBe('Argentina')
    expect(_('CL')).toBe('Chile')
    expect(_('UY')).toBe('Uruguay')
    expect(_('US')).toBe('Estados Unidos')
  })

  it('traduce grupos predefinidos', () => {
    expect(_('prepago')).toBe('Prepago')
    expect(_('abono')).toBe('Abono')
    expect(_('pospago')).toBe('Pospago')
  })

  it('capitaliza grupos no estándar', () => {
    expect(_('con_factura')).toBe('Con Factura')
  })

  it('maneja valores vacíos', () => {
    expect(_(undefined)).toBe('Sin especificar')
    expect(_('')).toBe('Sin especificar')
  })
})
