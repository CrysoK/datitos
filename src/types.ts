export interface Pack {
  id?: number
  country?: string
  company: string
  price: number
  mb: number
  days: number
  group?: string
  comment?: string
  path?: string
}

export type Message = {
  text: string
  class: 'exito' | 'error'
}
