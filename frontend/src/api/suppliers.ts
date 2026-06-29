import api from './client'
import type { SupplierOut, SupplierListOut } from '../types/supplier'

export const suppliersApi = {
  list: async (search?: string): Promise<SupplierListOut> => {
    const res = await api.get('/suppliers', { params: search ? { search } : {} })
    return res.data
  },

  get: async (id: string): Promise<SupplierOut> => {
    const res = await api.get(`/suppliers/${id}`)
    return res.data
  },

  create: async (data: {
    name: string
    contact_email?: string
    lead_time_days?: number
  }): Promise<SupplierOut> => {
    const res = await api.post('/suppliers', data)
    return res.data
  },

  update: async (id: string, data: {
    name?: string
    contact_email?: string
    lead_time_days?: number
  }): Promise<SupplierOut> => {
    const res = await api.put(`/suppliers/${id}`, data)
    return res.data
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/suppliers/${id}`)
  },
}