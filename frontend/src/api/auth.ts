import api from './client'
import type { TokenOut, UserOut } from '../types/user'

export const authApi = {
  login: async (email: string, password: string): Promise<TokenOut> => {
    const res = await api.post('/auth/login', { email, password })
    return res.data
  },

  register: async (email: string, password: string, role: string): Promise<UserOut> => {
    const res = await api.post('/auth/register', { email, password, role })
    return res.data
  },

  me: async (): Promise<UserOut> => {
    const res = await api.get('/auth/me')
    return res.data
  },
}