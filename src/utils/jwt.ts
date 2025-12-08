import jwt, { JwtPayload, SignOptions } from 'jsonwebtoken'
import { SESSION_TOKEN_SECRET, SESSION_TOKEN_EXPIRES, ACCESS_TOKEN_SECRET, ACCESS_TOKEN_EXPIRES } from '../config'

export interface AccessPayload {
  userId: string
  role: string
  unit: string
  division: string
}

// Sign token for session portal (SSO)
export function signPortalSession(payload: AccessPayload) {
  const secret = SESSION_TOKEN_SECRET
  if (!secret) throw new Error('ACCESS_TOKEN_SECRET not set')

  const options: SignOptions = { expiresIn: SESSION_TOKEN_EXPIRES as any }
  return jwt.sign(payload, secret, options)
}
// Verify token for session portal (SSO)
export function verifyPortalToken(token: string): JwtPayload & AccessPayload {
  const secret = SESSION_TOKEN_SECRET
  if (!secret) throw new Error('SESSION_TOKEN_SECRET not set')

  return jwt.verify(token, secret) as JwtPayload & AccessPayload
}

// Sign token for access token (API Access)
export function signAccessToken(payload: AccessPayload) {
  const secret = ACCESS_TOKEN_SECRET
  if (!secret) throw new Error('ACCESS_TOKEN_SECRET not set')

  const options: SignOptions = { expiresIn: ACCESS_TOKEN_EXPIRES as any }
  return jwt.sign(payload, secret, options)
}

// Verify token for access token (API Access)
export function verifyAccessToken(token: string): JwtPayload & AccessPayload {
  const secret = ACCESS_TOKEN_SECRET
  if (!secret) throw new Error('ACCESS_TOKEN_SECRET not set')

  return jwt.verify(token, secret) as JwtPayload & AccessPayload
}
