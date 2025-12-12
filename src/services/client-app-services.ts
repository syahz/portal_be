import { prismaClient } from '../application/database'
import { Validation } from '../validation/Validation'
import { ResponseError } from '../error/response-error'
import { ClientAppValidation } from '../validation/client-app-validation'
import {
  CreateClientAppRequest,
  UpdateClientAppRequest,
  ClientAppResponse,
  toClientAppResponse,
  toAllClientAppsResponse
} from '../models/client-app-model'

export const createClientApp = async (request: CreateClientAppRequest): Promise<ClientAppResponse> => {
  const createRequest = Validation.validate(ClientAppValidation.CREATE, request)

  const existingByClientId = await prismaClient.clientApp.findUnique({ where: { clientId: createRequest.client_id } })
  if (existingByClientId) {
    throw new ResponseError(409, 'Client ID sudah digunakan')
  }

  const app = await prismaClient.clientApp.create({
    data: {
      name: createRequest.name,
      description: createRequest.description,
      clientId: createRequest.client_id,
      clientSecret: createRequest.client_secret,
      redirectUri: createRequest.redirect_uri,
      dashboardUrl: createRequest.dashboard_url
    }
  })
  return toClientAppResponse(app)
}

export const getAllClientApps = async () => {
  const apps = await prismaClient.clientApp.findMany({ orderBy: { name: 'asc' } })
  return apps.map(toClientAppResponse)
}

export const getClientApps = async (page: number, limit: number, search: string) => {
  const skip = (page - 1) * limit
  const where = search ? { OR: [{ name: { contains: search } }, { clientId: { contains: search } }] } : {}

  const [total, apps] = await prismaClient.$transaction([
    prismaClient.clientApp.count({ where }),
    prismaClient.clientApp.findMany({ where, skip, take: limit, orderBy: { name: 'asc' } })
  ])

  return toAllClientAppsResponse(apps, total, page, limit)
}

export const getClientAppById = async (appId: string): Promise<ClientAppResponse> => {
  const app = await prismaClient.clientApp.findUnique({ where: { id: appId } })
  if (!app) {
    throw new ResponseError(404, 'Aplikasi tidak ditemukan')
  }
  return toClientAppResponse(app)
}

export const updateClientApp = async (appId: string, request: UpdateClientAppRequest): Promise<ClientAppResponse> => {
  const updateRequest = Validation.validate(ClientAppValidation.UPDATE, request)

  const existing = await prismaClient.clientApp.findUnique({ where: { id: appId } })
  if (!existing) {
    throw new ResponseError(404, 'Aplikasi tidak ditemukan')
  }

  if (updateRequest.client_id) {
    const conflict = await prismaClient.clientApp.findFirst({
      where: { AND: [{ id: { not: appId } }, { clientId: updateRequest.client_id }] }
    })
    if (conflict) {
      throw new ResponseError(409, 'Client ID sudah digunakan oleh aplikasi lain')
    }
  }

  const updated = await prismaClient.clientApp.update({
    where: { id: appId },
    data: {
      clientId: updateRequest.client_id,
      clientSecret: updateRequest.client_secret,
      name: updateRequest.name,
      description: updateRequest.description,
      redirectUri: updateRequest.redirect_uri,
      dashboardUrl: updateRequest.dashboard_url
    }
  })
  return toClientAppResponse(updated)
}

export const deleteClientApp = async (appId: string): Promise<{ message: string }> => {
  const app = await prismaClient.clientApp.findUnique({ where: { id: appId } })
  if (!app) {
    throw new ResponseError(404, 'Aplikasi tidak ditemukan')
  }

  const relCount = await prismaClient.userAppAccess.count({ where: { appId } })
  if (relCount > 0) {
    throw new ResponseError(400, `Aplikasi tidak dapat dihapus karena masih terhubung dengan ${relCount} user.`)
  }

  await prismaClient.clientApp.delete({ where: { id: appId } })
  return { message: 'Aplikasi berhasil dihapus' }
}
