import { ClientApp } from '@prisma/client'

export interface CreateClientAppRequest {
  name: string
  description: string
  client_id: string
  client_secret: string
  redirect_uri: string
  dashboard_url: string
}

export interface UpdateClientAppRequest {
  name?: string
  description?: string
  client_id?: string
  client_secret?: string
  redirect_uri?: string
  dashboard_url?: string
}

export type ClientAppResponse = {
  id: string
  name: string
  description: string
  client_id: string
  client_secret: string
  redirect_uri: string
  dashboard_url: string
}

export type GetAllClientAppsResponse = {
  apps: ClientAppResponse[]
  pagination: {
    totalData: number
    page: number
    limit: number
    totalPage: number
  }
}

export function toClientAppResponse(app: ClientApp): ClientAppResponse {
  return {
    id: app.id,
    name: app.name,
    description: app.description,
    client_id: app.clientId,
    client_secret: app.clientSecret,
    redirect_uri: app.redirectUri,
    dashboard_url: app.dashboardUrl
  }
}

export function toAllClientAppsResponse(apps: ClientApp[], total: number, page: number, limit: number): GetAllClientAppsResponse {
  return {
    apps: apps.map(toClientAppResponse),
    pagination: {
      totalData: total,
      page,
      limit,
      totalPage: Math.ceil(total / limit)
    }
  }
}
