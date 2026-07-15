import api from './client'
import type { ForecastOut, ForecastListOut } from '../types/forecast'

export const forecastApi = {
  getProduct: async (productId: string): Promise<ForecastOut> => {
    const res = await api.get(`/forecast/reorder/${productId}`)
    return res.data
  },

  getAll: async (): Promise<ForecastListOut> => {
    const res = await api.get('/forecast/all')
    return res.data
  },
}