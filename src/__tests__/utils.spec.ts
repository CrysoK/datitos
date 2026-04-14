import { describe, it, expect } from 'vitest'
import { calcularCosto } from '../utils'
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
