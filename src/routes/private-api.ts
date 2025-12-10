import express from 'express'
import unitRoutes from './details/unit'
import userRoutes from './details/user'
import roleRoutes from './details/role'
import divisionRoutes from './details/division'
import participantRoutes from './details/participant'
import clientAppRoutes from './details/client-app'
import userAppAccessRoutes from './details/user-app-access'
import dashboardRoutes from './details/dashboard'
import { authRequired } from '../middleware/auth-middleware'

export const privateRouter = express.Router()

privateRouter.use(authRequired)

privateRouter.use('/api/admin/user', userRoutes)
privateRouter.use('/api/admin/roles', roleRoutes)
privateRouter.use('/api/admin/divisions', divisionRoutes)
privateRouter.use('/api/admin/units', unitRoutes)
privateRouter.use('/api/admin/participants', participantRoutes)
privateRouter.use('/api/admin/apps', clientAppRoutes)
privateRouter.use('/api/admin/app-access', userAppAccessRoutes)
privateRouter.use('/api/admin/dashboard', dashboardRoutes)
