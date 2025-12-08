import express from 'express'
import '../config/passport-setup'
import authRoutes from './details/auth'
import passport from 'passport'
import { getAll as getAllUnits } from '../controller/unit-controller'
import { getAll as getAllDivisions } from '../controller/division-controller'

export const publicRouter = express.Router()

publicRouter.get('/api/units/all', getAllUnits)
publicRouter.get('/api/divisions/all', getAllDivisions)

publicRouter.use('/api/auth', authRoutes)
