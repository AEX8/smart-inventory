import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../api/auth'
import type { UserOut } from '../types/user'

export const useAuth = () => {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const { data: user, isLoading } = useQuery<UserOut>({
    queryKey: ['me'],
    queryFn: authApi.me,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 min
  })

  const login = (token: string, userData: UserOut) => {
    localStorage.setItem('token', token)
    queryClient.setQueryData(['me'], userData)
    navigate('/')
  }

  const logout = () => {
    localStorage.removeItem('token')
    queryClient.clear()
    navigate('/login')
  }

  return { user, isLoading, login, logout }
}