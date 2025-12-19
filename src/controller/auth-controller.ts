import { logger } from '../utils/logger'
import { Request, Response } from 'express'
import requestIp from 'request-ip'
import { Role, Unit, User } from '@prisma/client'
import { UserAuthorizeRequest, UserLoginRequest, UserTokenExchangeRequest } from '../models/auth-model'
import { authorizeUser, loginAuth, loginGoogleAuth, logoutAuth, refreshAuth, tokenExchange } from '../services/auth-services'
// 1. HALAMAN LOGIN & SSO REDIRECT (GET /oauth/authorize)
export const authorize = async (req: Request, res: Response) => {
  const request: UserAuthorizeRequest = req.query as UserAuthorizeRequest
  // Cek Session Portal (Apakah user sedang login di Portal?)
  const portal_session = req.cookies['portal_session']

  if (!portal_session) {
    // Jika belum login, redirect ke halaman login frontend portal
    // Kita kirim parameter returnUrl agar setelah login bisa balik ke flow ini
    const returnUrl = encodeURIComponent(
      `https://api.portal.bmuconnect.id/api/auth/authorize?client_id=${request.client_id}&redirect_uri=${request.redirect_uri}`
    )
    return res.redirect(`${process.env.PORTAL_FRONTEND_URL}/login?returnUrl=${returnUrl}`)
  }
  const response = await authorizeUser(request, portal_session, res)

  // Redirect browser user kembali ke Client App (Feedback)
  res.redirect(`${request.redirect_uri}?code=${response}`)
}

// 2. LOGIN PORTAL (POST /auth/login)
export const login = async (req: Request, res: Response) => {
  const request: UserLoginRequest = req.body as UserLoginRequest

  const response = await loginAuth(request, res)
  // ============================
  const ip = requestIp.getClientIp(req)
  const userAgent = req.get('User-Agent') || 'unknown'
  logger.info(`Google login successful for user: ${response.user.email}. IP: ${ip}, User-Agent: ${userAgent}`)
  res.status(200).json({
    data: response
  })
}

export async function loginWithGoogleCallback(req: Request, res: Response) {
  try {
    const user = req.user as User & { role: Role; unit: Unit }

    await loginGoogleAuth(user, res)
    // ============================
    const ip = requestIp.getClientIp(req)
    const userAgent = req.get('User-Agent') || 'unknown'
    logger.info(`Google login successful for user: ${user.email}. IP: ${ip}, User-Agent: ${userAgent}`)
    if (user.role.name === 'Admin') {
      res.redirect(`${process.env.FRONTEND_URL}/admin`)
    } else {
      res.redirect(`${process.env.FRONTEND_URL}/user`)
    }
  } catch (error: any) {
    logger.error('Google login callback error:', error)
    res.redirect(`${process.env.FRONTEND_URL}/login?error=google_login_failed`)
  }
}

// 3. TOKEN EXCHANGE (POST /oauth/token) - Back Channel
export const token = async (req: Request, res: Response) => {
  const request: UserTokenExchangeRequest = req.body as UserTokenExchangeRequest

  const response = await tokenExchange(request)
  res.status(200).json({
    data: response
  })
}

// 4. REFRESH TOKEN (POST /auth/refresh)
export async function refresh(req: Request, res: Response) {
  try {
    const result = await refreshAuth(req.cookies['refresh_token'], res)
    res.json(result)
  } catch (err: any) {
    res.status(401).json({ error: err.message })
  }
}

// 5. LOGOUT (DELETE /auth/logout)
export async function logout(req: Request, res: Response) {
  try {
    const result = await logoutAuth(req.cookies['refresh_token'], res)
    res.json(result)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
}
