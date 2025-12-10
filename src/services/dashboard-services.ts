import { prismaClient } from '../application/database'
import { DashboardResponse } from '../models/dashboard-model'

export const getDashboard = async (): Promise<DashboardResponse> => {
  const [users, roles, divisions, units, apps, participants] = await prismaClient.$transaction([
    prismaClient.user.count(),
    prismaClient.role.count(),
    prismaClient.division.count(),
    prismaClient.unit.count(),
    prismaClient.clientApp.count(),
    prismaClient.user.count()
  ])

  const [recentUsers, recentApps] = await prismaClient.$transaction([
    prismaClient.user.findMany({ orderBy: { id: 'desc' }, take: 5, select: { id: true, name: true, email: true } }),
    prismaClient.clientApp.findMany({ orderBy: { name: 'asc' }, take: 5, select: { id: true, name: true, clientId: true } })
  ])

  return {
    stats: { users, roles, divisions, units, apps, participants },
    recentUsers,
    recentApps
  }
}
