import api from './client'
import type { DashboardSummary, AnalyticsData } from '../types/dashboard'

export const dashboardApi = {
  summary: async (): Promise<DashboardSummary> => {
    const res = await api.get('/dashboard/summary')
    return res.data
  },
  analytics: async (): Promise<AnalyticsData> => {
    const res = await api.get('/dashboard/analytics')
    return res.data
  },
}
