import { describe, it, expect } from 'vitest'
import { calcularCosto, slugify } from '../utils'
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
