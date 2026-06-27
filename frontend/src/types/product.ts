export type StockStatus = 'healthy' | 'low' | 'critical' | 'overstock'

export interface SupplierOut {
  id: string
  name: string
  lead_time_days: number
}

export interface ProductOut {
  id: string
  name: string
  sku: string
  category: string | null
  quantity: number
  threshold: number
  supplier_id: string | null
  supplier: SupplierOut | null
  created_at: string
  updated_at: string
}

export interface ProductListOut {
  items: ProductOut[]
  total: number
  page: number
  page_size: number
}

export interface StockMovementOut {
  id: string
  product_id: string
  delta: number
  reason: string
  created_by: string | null
  created_at: string
}

export const getStockStatus = (quantity: number, threshold: number): StockStatus => {
  if (quantity === 0) return 'critical'
  if (quantity <= threshold) return 'low'
  if (quantity > threshold * 5) return 'overstock'
  return 'healthy'
}