import api from './client'
import type { ProductListOut, ProductOut, StockMovementOut } from '../types/product'

export const inventoryApi = {
  list: async (params?: {
    page?: number
    page_size?: number
    search?: string
    stock_status?: string
    category?: string
  }): Promise<ProductListOut> => {
    const res = await api.get('/inventory/products', { params })
    return res.data
  },

  get: async (id: string): Promise<ProductOut> => {
    const res = await api.get(`/inventory/products/${id}`)
    return res.data
  },

  create: async (data: {
    name: string
    sku: string
    category?: string
    initial_stock?: number
    threshold?: number
    supplier_id?: string
  }): Promise<ProductOut> => {
    const res = await api.post('/inventory/products', data)
    return res.data
  },

  update: async (id: string, data: {
    name?: string
    category?: string
    threshold?: number
  }): Promise<ProductOut> => {
    const res = await api.put(`/inventory/products/${id}`, data)
    return res.data
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/inventory/products/${id}`)
  },

  adjust: async (id: string, delta: number, reason: string): Promise<ProductOut> => {
    const res = await api.post(`/inventory/products/${id}/adjust`, { delta, reason })
    return res.data
  },

  movements: async (id: string, limit = 30): Promise<StockMovementOut[]> => {
    const res = await api.get(`/inventory/products/${id}/movements`, { params: { limit } })
    return res.data
  },
}