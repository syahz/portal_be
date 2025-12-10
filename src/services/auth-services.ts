import { Response } from 'express'
import bcrypt from 'bcryptjs'
import { prismaClient } from '../application/database'
import { ResponseError } from '../error/response-error'
import { createSessionToken, hashToken } from '../utils/token'
import { CSRF_ENABLED, NODE_ENV, REFRESH_TOKEN_EXPIRES_SECONDS } from '../config'
import { signAccessToken, signPortalSession, verifyPortalToken } from '../utils/jwt'
import { UserAuthorizeRequest, UserLoginRequest, UserTokenExchangeRequest } from '../models/auth-model'

// 1. LOGIN AUTHENTICATION SERVICE
export const loginAuth = async (request: UserLoginRequest, res: Response) => {
  const user = await prismaClient.user.findUnique({
    where: {
      email: request.email
    },
    include: {
      role: true,
      unit: true,
      division: true
    }
  })
  if (!user) throw new ResponseError(401, 'Invalid email or password')

  // Cek Is User Exist and Is Password valid
  if (!bcrypt.compareSync(request.password, user.password)) {
    await prismaClient.user.update({
      where: { id: user.id },
      data: { failedLogins: user.failedLogins + 1 }
    })
    throw new ResponseError(401, 'Invalid email or password')
  }
  // Reset failed login counter on successful login
  if (user.failedLogins >= 5) {
    await prismaClient.user.update({
      where: { id: user.id },
      data: { isLocked: true }
    })
    throw new ResponseError(403, 'Account locked due to multiple failed login attempts')
  }
  // Cek is User locked
  if (user.isLocked) throw new ResponseError(403, 'Account locked')

  const role = user.role.name
  const unit = user.unit.name
  const division = user.division.name
  const accessToken = signAccessToken({ userId: user.id, role, unit, division })

  const refreshPlain = createSessionToken()
  const tokenHash = hashToken(refreshPlain)
  const expiresAt = new Date(Date.now() + REFRESH_EXPIRES_SECONDS * 1000)
  // Ensure old tokens are cleared to avoid piling up
  await resetUserRefreshTokens(user.id)
  await prismaClient.refreshToken.create({
    data: { userId: user.id, tokenHash, expiresAt }
  })
  // Set csrf token if enabled
  const csrfEnabled = CSRF_ENABLED
  const csrfToken = csrfEnabled ? createSessionToken().slice(0, 32) : null

  //Set Cookies refresh token
  res.cookie('refresh_token', refreshPlain, cookieOptions())
  // Set user role cookie
  res.cookie('user_role', role, nonHttpOnlyCookieOptions())
  // Set user unit cookie
  res.cookie('user_unit', unit, nonHttpOnlyCookieOptions())
  // Set user division cookie
  res.cookie('user_division', division, nonHttpOnlyCookieOptions())
  // Set CSRF token cookie if enabled
  if (csrfEnabled && csrfToken) {
    res.cookie(
      'csrf_token',
      csrfToken,
      withDomain({
        httpOnly: false,
        secure: NODE_ENV === 'production',
        sameSite: 'strict' as const,
        maxAge: REFRESH_EXPIRES_SECONDS * 1000,
        path: '/'
      })
    )
  }
  // Portal session cookie for SSO
  const PortalSessiontoken = signPortalSession({ userId: user.id, role, unit, division })
  res.cookie('portal_session', PortalSessiontoken, cookieOptions())

  return {
    portal_session: PortalSessiontoken,
    access_token: accessToken,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role.name,
      unit: user.unit.code,
      division: user.division.name
    }
  }
}

// 2. AUTHORIZE USER SERVICE (SSO FLOW)
export const authorizeUser = async (request: UserAuthorizeRequest, portal_session: string, res: Response) => {
  // Jika sudah login, Generate Code langsung
  const payload = verifyPortalToken(portal_session)
  if (!payload) {
    return new ResponseError(401, 'Invalid portal session')
  }
  const code = createSessionToken()

  await prismaClient.authCode.create({
    data: {
      code,
      userId: payload.userId,
      clientId: String(request.client_id),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000) // 1 hour for debugging
    }
  })

  return code
}

// 3. TOKEN EXCHANGE SERVICE (CLIENT APP BACK CHANNEL)
export const tokenExchange = async (request: UserTokenExchangeRequest) => {
  // Validasi App
  const app = await prismaClient.clientApp.findUnique({
    where: {
      clientId: request.client_id
    }
  })
  if (!app || app.clientSecret !== request.client_secret) return new ResponseError(401, 'Unauthorized Client')
  // Validasi Code
  const authCode = await prismaClient.authCode.findUnique({
    where: { code: request.code },
    include: {
      user: { include: { role: true, unit: true, division: true } }
    }
  })

  if (!authCode || authCode.expiresAt < new Date()) return new ResponseError(400, 'Invalid or expired code')

  // Hapus code agar tidak dipakai ulang
  await prismaClient.authCode.delete({ where: { code: request.code } })

  // Cek Permission: Apakah user ini BOLEH akses aplikasi ini?
  const access = await prismaClient.userAppAccess.findUnique({
    where: { userId_appId: { userId: authCode.userId, appId: app.id } }
  })

  if (!access) return new ResponseError(403, 'User tidak memiliki izin akses aplikasi ini')

  // Ambil refresh token portal terbaru untuk user ini agar client
  // dapat menyamakan masa berlaku berdasarkan sisa waktu aktual.
  const latestPortalRt = await prismaClient.refreshToken.findFirst({
    where: { userId: authCode.userId, revoked: false, expiresAt: { gt: new Date() } },
    orderBy: { expiresAt: 'desc' }
  })

  // Kirim Data Lengkap ke Client App
  return {
    user: {
      id: authCode.user.id,
      email: authCode.user.email,
      name: authCode.user.name,
      role: authCode.user.role.name,
      unit_code: authCode.user.unit.code,
      division_name: authCode.user.division.name
    },
    portal_refresh_expires_ts: latestPortalRt ? latestPortalRt.expiresAt.toISOString() : null
  }
}

// 4. REFRESH TOKEN SERVICE (AUTH FLOW FOR PORTAL)
export const refreshAuth = async (rt: string | undefined, res: Response) => {
  if (!rt) {
    throw new Error('No refresh token')
  }

  const tokenHash = hashToken(rt)
  const stored = await prismaClient.refreshToken.findUnique({
    where: { tokenHash }
  })

  // Jika token tidak ada, sudah dicabut (dari logout), atau kedaluwarsa
  if (!stored || stored.revoked || stored.expiresAt < new Date()) {
    // Clear both host-only and domain-scoped cookies to avoid duplicates
    res.clearCookie('refresh_token', { path: '/' })
    if (COOKIE_DOMAIN) res.clearCookie('refresh_token', { path: '/', domain: COOKIE_DOMAIN })
    res.clearCookie('portal_session', { path: '/' })
    if (COOKIE_DOMAIN) res.clearCookie('portal_session', { path: '/', domain: COOKIE_DOMAIN })
    res.clearCookie('user_unit', { path: '/' })
    if (COOKIE_DOMAIN) res.clearCookie('user_unit', { path: '/', domain: COOKIE_DOMAIN })
    res.clearCookie('user_role', { path: '/' })
    if (COOKIE_DOMAIN) res.clearCookie('user_role', { path: '/', domain: COOKIE_DOMAIN })
    res.clearCookie('user_division', { path: '/' })
    if (COOKIE_DOMAIN) res.clearCookie('user_division', { path: '/', domain: COOKIE_DOMAIN })
    if (CSRF_ENABLED === 'true') {
      res.clearCookie('csrf_token', { path: '/' })
      if (COOKIE_DOMAIN) res.clearCookie('csrf_token', { path: '/', domain: COOKIE_DOMAIN })
    }
    throw new Error('Invalid or expired refresh token')
  }

  const newPlain = createSessionToken()
  const newHash = hashToken(newPlain)
  const newExpires = new Date(Date.now() + REFRESH_EXPIRES_SECONDS * 1000)

  const user = await prismaClient.user.findUnique({
    where: { id: stored.userId },
    include: {
      role: true,
      unit: true,
      division: true
    }
  })

  if (!user) {
    throw new Error('User for token not found')
  }

  try {
    await prismaClient.$transaction([
      // 1. Hapus token lama yang baru saja kita gunakan
      prismaClient.refreshToken.delete({
        where: { id: stored.id }
      }),

      // 2. Buat token baru untuk menggantikannya
      prismaClient.refreshToken.create({
        data: {
          userId: stored.userId,
          tokenHash: newHash,
          expiresAt: newExpires
        }
      })
    ])
  } catch (error) {
    console.error('Refresh token transaction failed', error)
    throw new Error('Failed to rotate refresh token')
  }

  const role = user.role.name
  const unit = user.unit.name
  const division = user.division.name
  const accessToken = signAccessToken({ userId: user.id, role, unit, division })

  // Set semua cookie baru (clear potential host-only duplicate first)
  res.clearCookie('refresh_token', { path: '/' })
  if (COOKIE_DOMAIN) res.clearCookie('refresh_token', { path: '/', domain: COOKIE_DOMAIN })
  res.cookie('refresh_token', newPlain, cookieOptions())
  res.cookie('user_unit', unit, nonHttpOnlyCookieOptions())
  res.cookie('user_role', role, nonHttpOnlyCookieOptions())

  // Set CSRF token baru jika diaktifkan
  if (CSRF_ENABLED === 'true') {
    const csrfToken = createSessionToken().slice(0, 32)
    res.cookie(
      'csrf_token',
      csrfToken,
      withDomain({
        httpOnly: false,
        secure: NODE_ENV === 'production',
        sameSite: 'strict' as const,
        maxAge: REFRESH_EXPIRES_SECONDS * 1000,
        path: '/'
      })
    )
  }

  return {
    accessToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role,
      unit: user.unit.name,
      division: user.division.name
    }
  }
}

// 5. LOGOUT SERVICE
export const logoutAuth = async (rt: string | undefined, res: Response) => {
  if (rt) {
    const tokenHash = hashToken(rt)
    await prismaClient.refreshToken.updateMany({ where: { tokenHash }, data: { revoked: true } })
    // Clear both host-only and domain cookies to fully remove
    res.clearCookie('portal_session', { path: '/' })
    if (COOKIE_DOMAIN) res.clearCookie('portal_session', { path: '/', domain: COOKIE_DOMAIN })
    res.clearCookie('refresh_token', { path: '/' })
    if (COOKIE_DOMAIN) res.clearCookie('refresh_token', { path: '/', domain: COOKIE_DOMAIN })
    res.clearCookie('user_unit', { path: '/' })
    if (COOKIE_DOMAIN) res.clearCookie('user_unit', { path: '/', domain: COOKIE_DOMAIN })
    if (process.env.CSRF_ENABLED === 'true') {
      res.clearCookie('csrf_token', { path: '/' })
      if (COOKIE_DOMAIN) res.clearCookie('csrf_token', { path: '/', domain: COOKIE_DOMAIN })
    }
    res.clearCookie('user_role', { path: '/' })
    if (COOKIE_DOMAIN) res.clearCookie('user_role', { path: '/', domain: COOKIE_DOMAIN })
    res.clearCookie('user_division', { path: '/' })
    if (COOKIE_DOMAIN) res.clearCookie('user_division', { path: '/', domain: COOKIE_DOMAIN })
  }
  return { ok: true }
}

// ================= Helper Functions ================= //
async function resetUserRefreshTokens(userId: string) {
  // To prevent piling up refresh tokens, either enforce single-session or prune old tokens.
  if (SINGLE_SESSION) {
    await prismaClient.refreshToken.deleteMany({ where: { userId } })
  } else {
    // Prune expired or revoked tokens for cleanliness
    await prismaClient.refreshToken.deleteMany({ where: { userId, OR: [{ revoked: true }, { expiresAt: { lt: new Date() } }] } })
  }
}

const REFRESH_EXPIRES_SECONDS = Number(REFRESH_TOKEN_EXPIRES_SECONDS || 60 * 60 * 24 * 30)
const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN
const SINGLE_SESSION = (process.env.SINGLE_SESSION || 'true').toLowerCase() === 'true'

function withDomain<T extends Record<string, any>>(opts: T): T & { domain?: string } {
  return COOKIE_DOMAIN ? { ...opts, domain: COOKIE_DOMAIN } : opts
}

function cookieOptions() {
  // Host-scope or domain-scope depending on COOKIE_DOMAIN
  // return withDomain({
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: REFRESH_EXPIRES_SECONDS * 1000,
    path: '/'
  }
  // })
}

function nonHttpOnlyCookieOptions() {
  // return withDomain({
  return {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: REFRESH_EXPIRES_SECONDS * 1000,
    path: '/'
  }
  // })
}
