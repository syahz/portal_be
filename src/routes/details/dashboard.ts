import express from 'express'
import { get } from '../../controller/dashboard-controller'

const dashboardRoutes = express.Router()

dashboardRoutes.get('/', get)

export default dashboardRoutes
