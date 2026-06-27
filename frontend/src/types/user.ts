export type UserRole = 'admin' | 'warehouse_staff' | 'driver'

export interface UserOut {
  id: string
  email: string
  role: UserRole
  created_at: string
}

export interface TokenOut {
  access_token: string
  token_type: string
  user: UserOut
}