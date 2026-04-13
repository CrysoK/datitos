export interface Pack {
  id?: number
  country?: string
  company: string
  price: number
  mb: number
  days: number
  type?: 'prepaid' | 'postpaid'
  group?: string
  comment?: string
}

export type Message = {
  text: string
  class: 'exito' | 'error'
}
