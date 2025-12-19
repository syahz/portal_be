import express from 'express'
import '../config/passport-setup'
import authRoutes from './details/auth'
import passport from 'passport'
import { getAll as getAllUnits } from '../controller/unit-controller'
import { loginWithGoogleCallback } from '../controller/auth-controller'
import { getAll as getAllDivisions } from '../controller/division-controller'

export const publicRouter = express.Router()

publicRouter.get('/api/units/all', getAllUnits)
publicRouter.get('/api/divisions/all', getAllDivisions)
publicRouter.get('/api/auth/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }))

publicRouter.get(
  '/api/auth/google/callback',
  passport.authenticate('google', {
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=unregistered_email`,
    session: false
  }),
  loginWithGoogleCallback
)
publicRouter.use('/api/auth', authRoutes)
