export type DashboardStats = {
  users: number
  roles: number
  divisions: number
  units: number
  apps: number
  participants: number
}

export type RecentUser = { id: string; name: string; email: string }
export type RecentApp = { id: string; name: string; clientId: string }

export type DashboardResponse = {
  stats: DashboardStats
  recentUsers: RecentUser[]
  recentApps: RecentApp[]
}
