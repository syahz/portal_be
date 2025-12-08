import { Request, Response } from 'express'
import { UserAuthorizeRequest, UserLoginRequest, UserTokenExchangeRequest } from '../models/auth-model'
import { authorizeUser, loginAuth, logoutAuth, refreshAuth, tokenExchange } from '../services/auth-services'

// 1. HALAMAN LOGIN & SSO REDIRECT (GET /oauth/authorize)
export const authorize = async (req: Request, res: Response) => {
  const request: UserAuthorizeRequest = req.query as UserAuthorizeRequest
  // Cek Session Portal (Apakah user sedang login di Portal?)
  const portal_session = req.cookies['portal_session']

  if (!portal_session) {
    // Jika belum login, redirect ke halaman login frontend portal
    // Kita kirim parameter returnUrl agar setelah login bisa balik ke flow ini
    const returnUrl = encodeURIComponent(
      `http://localhost:4000/api/auth/authorize?client_id=${request.client_id}&redirect_uri=${request.redirect_uri}`
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

  res.status(200).json({
    data: response
  })
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
