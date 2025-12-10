import { prismaClient } from '../application/database'
import { Validation } from '../validation/Validation'
import { ResponseError } from '../error/response-error'
import { UserAppAccessValidation } from '../validation/user-app-access-validation'
import {
  CreateUserAppAccessRequest,
  UpdateUserAppAccessRequest,
  UserAppAccessResponse,
  toUserAppAccessResponse,
  toAllUserAppAccessResponse
} from '../models/user-app-access-model'

export const createUserAppAccess = async (request: CreateUserAppAccessRequest): Promise<UserAppAccessResponse> => {
  const createRequest = Validation.validate(UserAppAccessValidation.CREATE, request)

  const user = await prismaClient.user.findUnique({ where: { id: createRequest.user_id } })
  if (!user) throw new ResponseError(404, 'User tidak ditemukan')

  const app = await prismaClient.clientApp.findUnique({ where: { id: createRequest.app_id } })
  if (!app) throw new ResponseError(404, 'Aplikasi tidak ditemukan')

  const duplicate = await prismaClient.userAppAccess.findFirst({ where: { userId: createRequest.user_id, appId: createRequest.app_id } })
  if (duplicate) throw new ResponseError(409, 'Hak akses user ke aplikasi tersebut sudah ada')

  const access = await prismaClient.userAppAccess.create({
    data: {
      userId: createRequest.user_id,
      appId: createRequest.app_id
    }
  })
  return toUserAppAccessResponse(access)
}

export const getUserAppAccesses = async (page: number, limit: number, search: string) => {
  const skip = (page - 1) * limit
  // Search by user name/email or app name/clientId
  const whereForUser = search ? { OR: [{ name: { contains: search } }, { email: { contains: search } }] } : undefined
  const whereForApp = search ? { OR: [{ name: { contains: search } }, { clientId: { contains: search } }] } : undefined

  const [total, accesses] = await prismaClient.$transaction([
    prismaClient.userAppAccess.count({}),
    prismaClient.userAppAccess.findMany({
      skip,
      take: limit,
      include: { user: true, app: true },
      orderBy: { id: 'asc' }
    })
  ])

  // Optional filtering in memory when search provided (since relation filtering can be more verbose)
  const filtered = search
    ? accesses.filter(
        (a) =>
          (whereForUser && (a.user.name.includes(search) || a.user.email.includes(search))) ||
          (whereForApp && (a.app.name.includes(search) || a.app.clientId.includes(search)))
      )
    : accesses

  const totalFiltered = search ? filtered.length : total
  const pagedFiltered = search ? filtered.slice(0, limit) : accesses

  return toAllUserAppAccessResponse(pagedFiltered, totalFiltered, page, limit)
}

export const getUserAppAccessById = async (id: string): Promise<UserAppAccessResponse> => {
  const access = await prismaClient.userAppAccess.findUnique({ where: { id } })
  if (!access) throw new ResponseError(404, 'Data akses tidak ditemukan')
  return toUserAppAccessResponse(access)
}

export const updateUserAppAccess = async (id: string, request: UpdateUserAppAccessRequest): Promise<UserAppAccessResponse> => {
  const updateRequest = Validation.validate(UserAppAccessValidation.UPDATE, request)

  const existing = await prismaClient.userAppAccess.findUnique({ where: { id } })
  if (!existing) throw new ResponseError(404, 'Data akses tidak ditemukan')

  if (updateRequest.user_id) {
    const user = await prismaClient.user.findUnique({ where: { id: updateRequest.user_id } })
    if (!user) throw new ResponseError(404, 'User tidak ditemukan')
  }
  if (updateRequest.app_id) {
    const app = await prismaClient.clientApp.findUnique({ where: { id: updateRequest.app_id } })
    if (!app) throw new ResponseError(404, 'Aplikasi tidak ditemukan')
  }

  const targetUserId = updateRequest.user_id ?? existing.userId
  const targetAppId = updateRequest.app_id ?? existing.appId

  // Check composite uniqueness
  const conflict = await prismaClient.userAppAccess.findFirst({
    where: { AND: [{ id: { not: id } }, { userId: targetUserId }, { appId: targetAppId }] }
  })
  if (conflict) throw new ResponseError(409, 'Kombinasi user dan app sudah memiliki akses')

  const updated = await prismaClient.userAppAccess.update({ where: { id }, data: { userId: targetUserId, appId: targetAppId } })
  return toUserAppAccessResponse(updated)
}

export const deleteUserAppAccess = async (id: string): Promise<{ message: string }> => {
  const access = await prismaClient.userAppAccess.findUnique({ where: { id } })
  if (!access) throw new ResponseError(404, 'Data akses tidak ditemukan')

  await prismaClient.userAppAccess.delete({ where: { id } })
  return { message: 'Hak akses berhasil dihapus' }
}
