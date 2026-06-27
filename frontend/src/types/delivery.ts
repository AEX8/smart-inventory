export type DeliveryStatus = 'processing' | 'in_transit' | 'delivered' | 'delayed' | 'cancelled'

export interface DeliveryOut {
  id: string
  product_id: string
  product_name: string | null
  quantity: number
  status: DeliveryStatus
  eta: string | null
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface DeliveryListOut {
  items: DeliveryOut[]
  total: number
  page: number
  page_size: number
}

export const STATUS_TRANSITIONS: Record<DeliveryStatus, DeliveryStatus[]> = {
  processing:  ['in_transit', 'cancelled'],
  in_transit:  ['delivered', 'delayed', 'cancelled'],
  delayed:     ['in_transit', 'cancelled'],
  delivered:   [],
  cancelled:   [],
}