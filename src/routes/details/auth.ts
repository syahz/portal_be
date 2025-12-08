import express from 'express'
import { login, refresh, logout, token, authorize } from '../../controller/auth-controller'

const authRoutes = express.Router()

authRoutes.post('/login', login)
authRoutes.post('/token', token)
authRoutes.post('/refresh', refresh)
authRoutes.delete('/logout', logout)
authRoutes.get('/authorize', authorize)

export default authRoutes
