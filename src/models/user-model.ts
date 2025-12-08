import { User, Unit, Role, ClientApp } from '@prisma/client'

export type UserPayload = {
  id: string
  unit: Unit
  role: {
    id: string
    name: string
  }
}

export type UserRole =
  | 'Admin'
  | 'Staff'
  | 'General Affair'
  | 'GM'
  | 'Direktur Operasional'
  | 'Direktur Keuangan'
  | 'Direktur Utama'
  | 'Kadiv Keuangan'

// For Account User
export type UpdateAccountUserRequest = {
  name?: string
  email?: string
}

export type UpdateAccountPasswordRequest = {
  current_password: string
  new_password: string
  confirm_password: string
}

export type LoginUserRequest = {
  email: string
  password: string
}

export type UpdateUserPasswordRequest = {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export type UserResponse = {
  id: string
  name: string
  email: string
}

export const toUserResponse = (user: User): UserResponse => {
  // Buat objek dasar
  const response: UserResponse = {
    id: user.id,
    name: user.name,
    email: user.email
  }

  return response
}

export type DashboardResponse = {
  id: string
  name: string
  client_id: string
  description: string | null
  redirect_uri: string
}
export const toDashboardResponse = (app: ClientApp): DashboardResponse => {
  return {
    id: app.id,
    name: app.name,
    client_id: app.clientId,
    description: app.description,
    redirect_uri: app.redirectUri
  }
}
