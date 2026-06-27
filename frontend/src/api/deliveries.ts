import api from './client'
import type { DeliveryListOut, DeliveryOut } from '../types/delivery'

export const deliveriesApi = {
  list: async (params?: {
    page?: number
    page_size?: number
    status?: string
    product_id?: string
  }): Promise<DeliveryListOut> => {
    const res = await api.get('/deliveries', { params })
    return res.data
  },

  get: async (id: string): Promise<DeliveryOut> => {
    const res = await api.get(`/deliveries/${id}`)
    return res.data
  },

  create: async (data: {
    product_id: string
    quantity: number
    eta?: string
    notes?: string
  }): Promise<DeliveryOut> => {
    const res = await api.post('/deliveries', data)
    return res.data
  },

  updateStatus: async (id: string, status: string, notes?: string): Promise<DeliveryOut> => {
    const res = await api.patch(`/deliveries/${id}/status`, { status, notes })
    return res.data
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/deliveries/${id}`)
  },
}