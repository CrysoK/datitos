import type { Pack } from './types'

export const calcularDiasHastaRenovacion = (diaRenovacion: number): number => {
  const hoy = new Date()
  const anio = hoy.getFullYear()
  const mes = hoy.getMonth()
  const hoyDia = hoy.getDate()

  // Fecha de renovación este mes
  let fechaRenovacion = new Date(anio, mes, diaRenovacion)

  // Si hoy es el día de renovación o ya pasó, la renovación es el mes que viene
  if (hoyDia >= diaRenovacion) {
    fechaRenovacion = new Date(anio, mes + 1, diaRenovacion)
  }

  const difMs = fechaRenovacion.getTime() - hoy.getTime()
  const difDias = Math.ceil(difMs / (1000 * 60 * 60 * 24))

  return difDias > 0 ? difDias : 1 // Al menos 1 día
}

export const calcularCosto = (
  pack: Pack,
  usoDiario: number,
  diasUso: number,
  diasRestantes: number = 30
): number => {
  if (usoDiario < 0 || diasUso < 0) {
    console.error('Parámetros de cálculo inválidos')
    return 0
  }

  // Si days es 0, usamos los días que faltan para la renovación
  const diasEfectivos = pack.days === 0 ? diasRestantes : pack.days

  if (diasEfectivos <= 0) return 0

  const MBporDia = pack.mb / diasEfectivos
  const necesitaRecarga = MBporDia < usoDiario
  return necesitaRecarga
    ? Math.ceil((diasUso * usoDiario) / pack.mb) * pack.price
    : Math.ceil(diasUso / diasEfectivos) * pack.price
}

export const guardarEnLocalStorage = (key: string, data: any) => {
  localStorage.setItem(key, JSON.stringify(data))
}

export const cargarDesdeLocalStorage = <T>(key: string): T | null => {
  const data = localStorage.getItem(key)
  return data ? JSON.parse(data) as T : null
}

export const defaultPack = (): Pack => ({
  id: undefined,
  country: detectUserCountry(),
  company: '',
  price: 0,
  mb: 0,
  days: 0,
  group: undefined,
  comment: undefined
})

export const detectUserCountry = (): string => {
  const lang = navigator.language || 'es-AR'
  const country = lang.split('-')[1] || lang.split('_')[1]
  return country ? country.toUpperCase() : 'AR'
}

import { shallowRef } from 'vue'

let dynamicTranslations = shallowRef<Record<string, string>>({})

export const setCountryTranslations = (map: Record<string, string>) => {
  dynamicTranslations.value = { ...dynamicTranslations.value, ...map }
}

export const _ = (str: string | undefined) => {
  if (!str) return 'Sin especificar'
  return dynamicTranslations.value[str] || beautifyGroupName(str)
}

export const beautifyGroupName = (name: string): string => {
  if (!name) return ''
  // Si ya tiene traducción, la usamos
  const translations: Record<string, string> = {
    "prepago": "Prepago",
    "abono": "Abono",
    "pospago": "Pospago"
  }
  if (translations[name.toLowerCase()]) return translations[name.toLowerCase()]

  return name
    .split(/[_-]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

export const slugify = (str: string): string =>
  str.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

// ISO 3166-1 alpha-2
const ISO_CODES = 'AD,AE,AF,AG,AI,AL,AM,AO,AQ,AR,AS,AT,AU,AW,AX,AZ,BA,BB,BD,BE,BF,BG,BH,BI,BJ,BL,BM,BN,BO,BQ,BR,BS,BT,BV,BW,BY,BZ,CA,CC,CD,CF,CG,CH,CI,CK,CL,CM,CN,CO,CR,CU,CV,CW,CX,CY,CZ,DE,DJ,DK,DM,DO,DZ,EC,EE,EG,EH,ER,ES,ET,FI,FJ,FK,FM,FO,FR,GA,GB,GD,GE,GF,GG,GH,GI,GL,GM,GN,GP,GQ,GR,GS,GT,GU,GW,GY,HK,HM,HN,HR,HT,HU,ID,IE,IL,IM,IN,IO,IQ,IR,IS,IT,JE,JM,JO,JP,KE,KG,KH,KI,KM,KN,KP,KR,KW,KY,KZ,LA,LB,LC,LI,LK,LR,LS,LT,LU,LV,LY,MA,MC,MD,ME,MF,MG,MH,MK,ML,MM,MN,MO,MP,MQ,MR,MS,MT,MU,MV,MW,MX,MY,MZ,NA,NC,NE,NF,NG,NI,NL,NO,NP,NR,NU,NZ,OM,PA,PE,PF,PG,PH,PK,PL,PM,PN,PR,PS,PT,PW,PY,QA,RE,RO,RS,RU,RW,SA,SB,SC,SD,SE,SG,SH,SI,SJ,SK,SL,SM,SN,SO,SR,SS,ST,SV,SX,SY,SZ,TC,TD,TF,TG,TH,TJ,TK,TL,TM,TN,TO,TR,TT,TV,TW,TZ,UA,UG,UM,US,UY,UZ,VA,VC,VE,VG,VI,VN,VU,WF,WS,YE,YT,ZA,ZM,ZW'

export const ALL_COUNTRY_CODES: readonly string[] = ISO_CODES.split(',')

const countryDisplayNames = new Intl.DisplayNames(['es'], { type: 'region' })

export const getCountryDisplayName = (code: string): string => {
  try {
    return countryDisplayNames.of(code.toUpperCase()) || code
  } catch {
    return code
  }
}

export const getGithubIssueUrl = (country: string, company: string, listName: string, json: string, path?: string) => {
  const title = `[CONTRIB] ${country} - ${company} (${listName})`
  
  // Si no hay path, sugerimos uno basado en la estructura estándar
  const finalPath = path || `${country.toLowerCase()}/${slugify(company)}/${slugify(listName)}.json`

  const body = `### Datitos Bot: Nueva contribución

Se ha generado una propuesta de actualización para **${company}** en **${country}** (${listName}).

- **Archivo a modificar**: \`${finalPath}\`

<!-- CONTRIBUTION_DATA_START -->
\`\`\`json
${json}
\`\`\`
<!-- CONTRIBUTION_DATA_END -->

_Enviado desde la App de Datitos._`

  return `https://github.com/CrysoK/datitos-packs/issues/new?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}&labels=contribucion`
}

export const getGithubEditUrl = (country: string, company: string, path?: string) => {
  const message = `[CONTRIB] ${country} ${company}: Actualizar packs`
  const baseUrl = 'https://github.com/CrysoK/datitos-packs/edit/main'
  
  if (path) {
    return `${baseUrl}/${path}?message=${encodeURIComponent(message)}`
  }

  // Fallback (por si acaso no hay path)
  const c = country.toLowerCase()
  const co = company.toLowerCase().replace(/\s+/g, '-')
  return `${baseUrl}/${c}/${co}/prepago.json?message=${encodeURIComponent(message)}`
}

export const migrateLegacyData = () => {
  const legacyItems = localStorage.getItem('items')
  const legacyDiario = localStorage.getItem('diario')
  const legacyRenovacion = localStorage.getItem('renovacion')

  if (!legacyItems && !legacyDiario && !legacyRenovacion) return null

  console.log('[Migration] Legacy data detected. Starting migration...')

  let migratedPacks: Pack[] = []
  let migratedConfig: any = null

  if (legacyItems) {
    try {
      const items = JSON.parse(legacyItems)
      if (Array.isArray(items)) {
        migratedPacks = items.map((item: any, index: number) => ({
          id: Date.now() + index,
          country: detectUserCountry(),
          company: 'Desconocida',
          price: Number(item.precio) || 0,
          mb: Number(item.mbs) || 0,
          days: Number(item.dias) || 0,
          comment: item.nombre
        }))
      }
    } catch (e) {
      console.error('[Migration] Error parsing legacy items:', e)
    }
  }

  if (legacyDiario !== null || legacyRenovacion !== null) {
    migratedConfig = {
      usoDiario: legacyDiario ? Number(legacyDiario) : 300,
      diasUso: 30,
      diaRenovacion: 1
    }

    if (legacyRenovacion) {
      // Extraemos el día directamente del string YYYY-MM-DD para evitar problemas de zona horaria
      const parts = legacyRenovacion.split('-')
      if (parts.length === 3) {
        migratedConfig.diaRenovacion = parseInt(parts[2])
      } else {
        const date = new Date(legacyRenovacion)
        if (!isNaN(date.getTime())) {
          migratedConfig.diaRenovacion = date.getDate()
        }
      }
    }
  }

  // Cleanup
  localStorage.removeItem('items')
  localStorage.removeItem('diario')
  localStorage.removeItem('renovacion')
  localStorage.removeItem('ultimoId')

  console.log('[Migration] Migration complete.', { migratedPacks, migratedConfig })

  return {
    packs: migratedPacks,
    config: migratedConfig
  }
}
