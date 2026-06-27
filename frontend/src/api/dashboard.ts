import api from './client'
import type { DashboardSummary } from '../types/dashboard'

export const dashboardApi = {
  summary: async (): Promise<DashboardSummary> => {
    const res = await api.get('/dashboard/summary')
    return res.data
  },
}