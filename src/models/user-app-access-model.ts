import { UserAppAccess, User, ClientApp } from '@prisma/client'

export interface CreateUserAppAccessRequest {
  user_id: string
  app_id: string
}

export interface UpdateUserAppAccessRequest {
  user_id?: string
  app_id?: string
}

export type UserAppAccessResponse = {
  id: string
  user_id: string
  app_id: string
}

export type UserAppAccessExpandedResponse = {
  id: string
  user: { id: string; email: string; name: string }
  app: { id: string; name: string; client_id: string }
}

export type GetAllUserAppAccessResponse = {
  accesses: UserAppAccessExpandedResponse[]
  pagination: {
    totalData: number
    page: number
    limit: number
    totalPage: number
  }
}

export function toUserAppAccessResponse(access: UserAppAccess): UserAppAccessResponse {
  return {
    id: access.id,
    user_id: access.userId,
    app_id: access.appId
  }
}

export function toExpandedResponse(access: UserAppAccess & { user: User; app: ClientApp }): UserAppAccessExpandedResponse {
  return {
    id: access.id,
    user: { id: access.user.id, email: access.user.email, name: access.user.name },
    app: { id: access.app.id, name: access.app.name, client_id: access.app.clientId }
  }
}

export function toAllUserAppAccessResponse(
  accesses: (UserAppAccess & { user: User; app: ClientApp })[],
  total: number,
  page: number,
  limit: number
): GetAllUserAppAccessResponse {
  return {
    accesses: accesses.map(toExpandedResponse),
    pagination: {
      totalData: total,
      page,
      limit,
      totalPage: Math.ceil(total / limit)
    }
  }
}
