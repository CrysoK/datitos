import type { Pack } from '../types'
export const SUPPORTED_SCHEMA_VERSION = 1

const GITHUB_RAW_BASE = 'https://raw.githubusercontent.com/CrysoK/datitos-packs/main'
const CACHE_KEY = 'cached_predefined_packs'
const MANIFEST_URL = `${GITHUB_RAW_BASE}/manifest.json`

/** Id estable de un pack comunitario: path del JSON + índice dentro de ese archivo. */
export const communityPackId = (path: string, index: number): string => `${path}#${index}`

/** Recalcula ids por archivo. Pisa valores aleatorios de cachés viejos. */
export const withCommunityPackIds = (packs: Pack[]): Pack[] => {
  const indexByPath = new Map<string, number>()
  return packs.map((pack) => {
    if (!pack.path) return pack
    const index = indexByPath.get(pack.path) ?? 0
    indexByPath.set(pack.path, index + 1)
    return { ...pack, id: communityPackId(pack.path, index) }
  })
}

export interface PackManifest {
  last_updated: string
  country_names: Record<string, string>
  files: string[]
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
    let maxSchemaVersion = 1

    const manifest = await this.fetchManifest()
    if (!manifest) return { packs: [], countryNames: {}, schemaVersion: SUPPORTED_SCHEMA_VERSION }

    const countryNames = manifest.country_names || {}
    const files = manifest.files || []

    const fetchPromises = files.map((filePath) => (async () => {
      try {
        const response = await fetch(`${GITHUB_RAW_BASE}/${filePath}`)
        if (!response.ok) throw new Error(`Failed to fetch ${filePath}`)

        const data = await response.json()
        const version = data.schema_version || 1
        
        // Track the maximum schema version found to alert about compatibility
        if (version > maxSchemaVersion) {
          maxSchemaVersion = version
        }

        // Infer metadata from path: ar/claro/prepago.json
        const parts = filePath.split('/')
        if (parts.length < 3) return []

        const countryCode = parts[0].toUpperCase()
        const companySlug = parts[1]
        const companyName = companySlug.charAt(0).toUpperCase() + companySlug.slice(1)
        const groupName = parts[parts.length - 1].replace('.json', '')

        const transformedPacks = (data.packs || []).map((p: Record<string, unknown>) => ({
          ...p,
          country: countryCode,
          company: companyName,
          group: groupName,
          path: filePath
        })) as Pack[]

        return withCommunityPackIds(transformedPacks)
      } catch (error) {
        console.error(`Error fetching packs from ${filePath}:`, error)
        return []
      }
    })())

    const results = await Promise.all(fetchPromises)
    results.forEach((packs) => allPacks.push(...packs))

    if (maxSchemaVersion > SUPPORTED_SCHEMA_VERSION) {
      console.warn(`[Schema] Some packs use version (${maxSchemaVersion}) which is higher than supported (${SUPPORTED_SCHEMA_VERSION}).`)
    }

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
        data: withCommunityPackIds(packs),
        countryNames
      })
    )
  },

  getCachedPacks(): { packs: Pack[]; countryNames: Record<string, string>; schemaVersion: number } | null {
    const cached = localStorage.getItem(CACHE_KEY)
    if (!cached) return null

    try {
      const parsed = JSON.parse(cached)
      const { data, countryNames, schemaVersion } = parsed
      if (!Array.isArray(data)) return null

      const packs = withCommunityPackIds(data)
      const idsChanged = packs.some((pack, i) => pack.id !== data[i]?.id)
      if (idsChanged) {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ ...parsed, data: packs }))
      }

      return {
        packs,
        countryNames: countryNames || {},
        schemaVersion: schemaVersion || 1
      }
    } catch {
      return null
    }
  }
}
