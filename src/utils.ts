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
  type: undefined,
  group: undefined,
  comment: undefined
})

export const detectUserCountry = (): string => {
  const lang = navigator.language || 'es-AR'
  const country = lang.split('-')[1] || lang.split('_')[1]
  return country ? country.toUpperCase() : 'AR'
}

export const _ = (str: string | undefined) => {
  if (!str) return 'Sin especificar'
  const translations: Record<string, string> = {
    "prepaid": "Prepago",
    "postpaid": "Abono / Pospago",
    "AR": "Argentina",
    "CL": "Chile",
    "UY": "Uruguay",
    "MX": "México"
  }
  return translations[str] || beautifyGroupName(str)
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

export const getGithubIssueUrl = (country: string, company: string, type: string, json: string, path?: string) => {
  const title = `[CONTRIB] ${country} - ${company} (${type})`
  const body = `### Datitos Bot: Nueva contribución

Se ha generado una propuesta de actualización para **${company}** en **${country}** (${type}).

${path ? `- **Archivo a modificar**: \`${path}\`` : ''}

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
