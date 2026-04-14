import type { Pack } from '../types'
export const SUPPORTED_SCHEMA_VERSION = 1

const GITHUB_RAW_BASE = 'https://raw.githubusercontent.com/CrysoK/datitos-packs/main'
const CACHE_KEY = 'cached_predefined_packs'
const MANIFEST_URL = `${GITHUB_RAW_BASE}/manifest.json`

export interface PackManifest {
  last_updated: string
  schema_version: number
  countries: Array<{
    code: string
    name: string
    companies: Array<{
      name: string
      files: Array<{
        type: 'prepaid' | 'postpaid'
        path: string
        schema_version: number
      }>
    }>
  }>
}

export const packService = {
  async fetchManifest(): Promise<PackManifest | null> {
    try {
      const response = await fetch(MANIFEST_URL)
      if (!response.ok) throw new Error('Failed to fetch manifest')
      return await response.json()
    } catch (error) {
      console.error('Error fetching manifest:', error)
      return null
    }
  },

  async fetchAllPacks(): Promise<{ packs: Pack[]; countryNames: Record<string, string>; schemaVersion: number }> {
    const allPacks: Pack[] = []
    const countryNames: Record<string, string> = {}
    let maxSchemaVersion = 1

    const manifest = await this.fetchManifest()
    if (!manifest) return { packs: [], countryNames: {}, schemaVersion: SUPPORTED_SCHEMA_VERSION }

    maxSchemaVersion = manifest.schema_version

    if (maxSchemaVersion > SUPPORTED_SCHEMA_VERSION) {
      console.warn(`[Schema] Manifest version (${maxSchemaVersion}) is higher than supported (${SUPPORTED_SCHEMA_VERSION}). Some features might not work as expected.`)
    }

    const fetchPromises: Promise<Pack[]>[] = []

    manifest.countries.forEach((country) => {
      countryNames[country.code] = country.name
      country.companies.forEach((company) => {
        company.files.forEach((file) => {
          const fetchPromise = (async () => {
            try {
              const response = await fetch(`${GITHUB_RAW_BASE}/${file.path}`)
              if (!response.ok) throw new Error(`Failed to fetch ${file.path}`)

              const data = await response.json()
              const filename = file.path.split('/').pop()?.replace('.json', '') || file.type
              const transformedPacks = (data.packs || []).map((p: any) => ({
                ...p,
                country: country.code,
                company: company.name,
                type: file.type,
                group: filename,
                path: file.path,
                id: p.id || Math.random()
              }))

              return transformedPacks
            } catch (error) {
              console.error(`Error fetching packs from ${file.path}:`, error)
              return []
            }
          })()
          fetchPromises.push(fetchPromise)
        })
      })
    })

    const results = await Promise.all(fetchPromises)
    results.forEach((packs) => allPacks.push(...packs))

    return {
      packs: allPacks,
      countryNames,
      schemaVersion: maxSchemaVersion
    }
  },

  saveToCache(packs: Pack[], countryNames: Record<string, string>, schemaVersion: number): void {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({
        timestamp: Date.now(),
        schemaVersion,
        data: packs,
        countryNames
      })
    )
  },

  getCachedPacks(): { packs: Pack[]; countryNames: Record<string, string>; schemaVersion: number } | null {
    const cached = localStorage.getItem(CACHE_KEY)
    if (!cached) return null

    try {
      const { data, countryNames, schemaVersion } = JSON.parse(cached)
      return { 
        packs: data, 
        countryNames: countryNames || {}, 
        schemaVersion: schemaVersion || 1 
      }
    } catch (e) {
      return null
    }
  }
}
